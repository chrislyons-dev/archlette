/**
 * @module basic-astro
 * File parsing and extraction orchestrator
 * Uses @astrojs/compiler to parse Astro files and extract architecture info
 */

import { parse } from '@astrojs/compiler';
import { readFile } from 'node:fs/promises';
import { createLogger } from '../../../core/logger.js';
import {
  extractFileComponent,
  extractFileActors,
  extractFileRelationships,
} from './component-detector.js';
import { extractCodeFromFrontmatter } from './code-extractor.js';
import type { FileExtraction, ExtractedComponent } from './types.js';

const log = createLogger({ context: 'AstroFileParser' });

/**
 * Parse Astro files using @astrojs/compiler
 */
export async function parseFiles(filePaths: string[]): Promise<FileExtraction[]> {
  if (filePaths.length === 0) {
    return [];
  }

  const results: FileExtraction[] = [];

  for (const filePath of filePaths) {
    try {
      const content = await readFile(filePath, 'utf-8');

      // Parse with Astro compiler
      const parseResult = await parse(content, {
        position: true,
      });

      // Extract frontmatter content (code between --- markers)
      const frontmatter = extractFrontmatter(content);

      // Extract component info from frontmatter JSDoc
      const component = extractFileComponent(frontmatter, filePath);
      const actors = extractFileActors(frontmatter);
      const relationships = extractFileRelationships(frontmatter);

      // Extract imports from frontmatter
      const imports = extractImports(frontmatter);

      // Find slots in the template (reserved for future Astro metadata extraction)
      const _slots = findSlots(content);

      // Extract client directives (reserved for future Astro metadata extraction)
      const _clientDirective = findClientDirective(content);

      // Extract component usage from template
      const componentUsage = extractComponentUsage(content, imports, filePath);

      // Extract TypeScript/JavaScript code from frontmatter
      const codeExtraction = extractCodeFromFrontmatter(frontmatter, filePath);

      results.push({
        filePath,
        language: 'astro',
        component,
        actors,
        relationships,
        components: componentUsage,
        functions: codeExtraction.functions,
        classes: codeExtraction.classes,
        types: codeExtraction.types,
        interfaces: codeExtraction.interfaces,
        imports,
        parseError:
          parseResult.diagnostics && parseResult.diagnostics.length > 0
            ? parseResult.diagnostics[0].text
            : undefined,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.warn(`Failed to parse ${filePath}: ${errorMsg}`);

      results.push({
        filePath,
        language: 'astro',
        component: undefined,
        types: [],
        interfaces: [],
        actors: [],
        relationships: [],
        components: [],
        functions: [],
        classes: [],
        imports: [],
        parseError: errorMsg,
      });
    }
  }

  return results;
}

/**
 * Extract frontmatter content from Astro file
 * Frontmatter is the TypeScript/JavaScript code between --- markers at the top of the file
 */
function extractFrontmatter(content: string): string {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  return frontmatterMatch ? frontmatterMatch[1] : '';
}

/**
 * Extract import statements from frontmatter
 */
function extractImports(frontmatter: string): Array<{
  source: string;
  importedNames: string[];
  isDefault: boolean;
  isNamespace: boolean;
}> {
  const imports: Array<{
    source: string;
    importedNames: string[];
    isDefault: boolean;
    isNamespace: boolean;
  }> = [];

  // Match import statements
  const importRegex =
    /import\s+(?:([\w]+)|{([^}]+)}|\*\s+as\s+([\w]+))\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(frontmatter)) !== null) {
    const [, defaultImport, namedImports, namespaceImport, source] = match;

    if (defaultImport) {
      // Default import: import Foo from 'bar'
      imports.push({
        source,
        importedNames: [defaultImport],
        isDefault: true,
        isNamespace: false,
      });
    } else if (namedImports) {
      // Named imports: import { Foo, Bar } from 'baz'
      const names = namedImports.split(',').map((n) => n.trim().split(/\s+as\s+/)[0]);
      imports.push({
        source,
        importedNames: names,
        isDefault: false,
        isNamespace: false,
      });
    } else if (namespaceImport) {
      // Namespace import: import * as Foo from 'bar'
      imports.push({
        source,
        importedNames: [namespaceImport],
        isDefault: false,
        isNamespace: true,
      });
    }
  }

  return imports;
}

/**
 * Find slot tags in the template
 */
function findSlots(content: string): Array<{ name: string; line: number }> {
  const slots: Array<{ name: string; line: number }> = [];

  // Match <slot> and <slot name="..."> tags
  const slotRegex = /<slot(?:\s+name=['"]([^'"]+)['"])?[^>]*>/g;
  let match;

  while ((match = slotRegex.exec(content)) !== null) {
    const name = match[1] || 'default';
    const line = content.substring(0, match.index).split('\n').length;
    slots.push({ name, line });
  }

  return slots;
}

/**
 * Find client directive in component usage
 * Examples: client:load, client:idle, client:visible, client:media, client:only
 */
function findClientDirective(content: string): string | undefined {
  const directiveMatch = content.match(/client:(load|idle|visible|media|only)/);
  return directiveMatch ? directiveMatch[0] : undefined;
}

/**
 * Extract component usage from template
 * Finds which imported components are used in the template markup
 */
function extractComponentUsage(
  content: string,
  imports: Array<{ source: string; importedNames: string[] }>,
  filePath: string,
): ExtractedComponent[] {
  const components: ExtractedComponent[] = [];

  // Get template part (after frontmatter)
  const templateMatch = content.match(/^---\s*\n[\s\S]*?\n---\s*\n([\s\S]*)$/);
  const template = templateMatch ? templateMatch[1] : content;

  // Build list of all imported component names
  const importedNames = new Set<string>();
  for (const imp of imports) {
    for (const name of imp.importedNames) {
      importedNames.add(name);
    }
  }

  // Find component usage in template
  // Match opening tags like <ComponentName ...> or <ComponentName>
  const componentRegex = /<([A-Z][\w]*)[^>]*>/g;
  let match;

  const foundComponents = new Set<string>();
  while ((match = componentRegex.exec(template)) !== null) {
    const componentName = match[1];

    // Only include if it was imported
    if (importedNames.has(componentName) && !foundComponents.has(componentName)) {
      foundComponents.add(componentName);

      // Calculate line number in original file
      const line = content.substring(0, match.index).split('\n').length;

      components.push({
        name: componentName,
        isExported: false,
        slots: [], // Component usage doesn't define slots
        location: {
          filePath,
          line,
          column: 0, // Approximate column
        },
      });
    }
  }

  return components;
}
