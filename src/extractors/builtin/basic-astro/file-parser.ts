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
import {
  extractCodeFromFrontmatter,
  createSyntheticRenderFunction,
} from './code-extractor.js';
import type { FileExtraction, ExtractedComponent } from './types.js';

const log = createLogger({ context: 'AstroFileParser' });

/**
 * Parse Astro files using @astrojs/compiler
 *
 * Orchestrates the complete extraction pipeline for a batch of Astro files:
 * 1. Reads file content from disk
 * 2. Parses with Astro compiler to get AST and diagnostics
 * 3. Extracts frontmatter (code section) and template (markup section)
 * 4. Identifies components, actors, and relationships from JSDoc
 * 5. Extracts code elements (classes, functions, types, interfaces)
 * 6. Creates synthetic render function for each component
 *
 * Returns a FileExtraction for each input file. On parse errors,
 * still returns a FileExtraction with parseError field set and
 * a synthetic render function to show the component is executable.
 *
 * @param filePaths - Array of absolute paths to Astro files
 * @returns Promise resolving to FileExtraction array (one per file)
 *
 * @example
 * const extractions = await parseFiles([
 *   '/project/src/components/Header.astro',
 *   '/project/src/components/Footer.astro'
 * ]);
 * // Returns [FileExtraction, FileExtraction]
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

      // Create synthetic render function (every Astro component is a render function)
      const syntheticRender = createSyntheticRenderFunction(
        filePath,
        codeExtraction.interfaces,
      );

      results.push({
        filePath,
        language: 'astro',
        component,
        actors,
        relationships,
        components: componentUsage,
        functions: [...codeExtraction.functions, syntheticRender],
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

      // Even on error, create synthetic render function to show component is executable
      const syntheticRender = createSyntheticRenderFunction(filePath, []);

      results.push({
        filePath,
        language: 'astro',
        component: undefined,
        types: [],
        interfaces: [],
        actors: [],
        relationships: [],
        components: [],
        functions: [syntheticRender],
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
 *
 * Astro files have two sections separated by --- markers:
 * - Frontmatter: TypeScript/JavaScript code at the top (server-side)
 * - Template: HTML markup and component usage (client-side)
 *
 * This function extracts only the frontmatter section. Returns empty string if no frontmatter.
 * Handles both Unix and Windows line endings for cross-platform compatibility.
 *
 * @param content - Full Astro file content
 * @returns Frontmatter code between the --- markers, or empty string
 *
 * @example
 * const content = '--- import X from "y"\\n---\\n<div>...';
 * const frontmatter = extractFrontmatter(content);
 * // Returns: ' import X from "y"'
 */
function extractFrontmatter(content: string): string {
  const frontmatterMatch = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  return frontmatterMatch ? frontmatterMatch[1] : '';
}

/**
 * Extract import statements from frontmatter
 *
 * Parses all import declarations using regex and categorizes them:
 * - Default imports: import Foo from 'bar'
 * - Named imports: import { Foo, Bar } from 'baz'
 * - Namespace imports: import * as Foo from 'bar'
 *
 * Also handles aliased imports like: import { Foo as F } from 'bar'
 *
 * @param frontmatter - TypeScript/JavaScript code from frontmatter
 * @returns Array of import declarations with categorization
 *
 * @example
 * const code = 'import Foo from "a"; import { Bar } from "b";';
 * const imports = extractImports(code);
 * // Returns: [
 * //   { source: 'a', importedNames: ['Foo'], isDefault: true, isNamespace: false },
 * //   { source: 'b', importedNames: ['Bar'], isDefault: false, isNamespace: false }
 * // ]
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
 *
 * Astro components can define slots to allow content projection:
 * - Default slot: <slot /> (unnamed)
 * - Named slot: <slot name="header" />
 *
 * Returns location information (line number) for each slot found.
 *
 * @param content - Full Astro file content (used to calculate line numbers)
 * @returns Array of slots with names and line numbers
 *
 * @example
 * const content = '---...---\\n<slot />\\n<slot name="footer" />';
 * const slots = findSlots(content);
 * // Returns: [
 * //   { name: 'default', line: 2 },
 * //   { name: 'footer', line: 3 }
 * // ]
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
 *
 * Astro allows hydration directives to run components on the client:
 * - client:load - Eager hydration
 * - client:idle - Hydrate when browser is idle
 * - client:visible - Hydrate when component enters viewport
 * - client:media - Hydrate when media query matches
 * - client:only - Hydrate only on client (no SSR)
 *
 * Returns the first directive found. Used to indicate interactive components.
 *
 * @param content - Full Astro file content
 * @returns The directive found (e.g., 'client:load'), or undefined
 *
 * @example
 * const content = '<Component client:load />';
 * const directive = findClientDirective(content);
 * // Returns: 'client:load'
 */
function findClientDirective(content: string): string | undefined {
  const directiveMatch = content.match(/client:(load|idle|visible|media|only)/);
  return directiveMatch ? directiveMatch[0] : undefined;
}

/**
 * Extract component usage from template
 *
 * Identifies which imported components are actually used in the template markup.
 * Only includes components that:
 * 1. Start with an uppercase letter (C4 naming convention)
 * 2. Are found in the import statements
 * 3. Appear in the template markup
 *
 * Component names in Astro are PascalCase by convention (e.g., Header, Footer).
 * This function uses the import list to avoid false positives from HTML elements.
 *
 * @param content - Full Astro file content
 * @param imports - List of imports from extractImports()
 * @param filePath - File path (used for location tracking)
 * @returns Array of ExtractedComponent objects for used components
 *
 * @example
 * const components = extractComponentUsage(content, imports, '/path/file.astro');
 * // Returns components that match imported names and appear in template
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
