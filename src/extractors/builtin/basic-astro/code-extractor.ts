/**
 * @module basic-astro
 * Extract TypeScript/JavaScript code from Astro frontmatter
 * Reuses basic-node extractors by parsing frontmatter as TypeScript
 */

import { Project, ts } from 'ts-morph';
import { createLogger } from '../../../core/logger.js';
import { extractClasses } from '../basic-node/class-extractor.js';
import {
  extractFunctions,
  extractArrowFunctions,
} from '../basic-node/function-extractor.js';
import { extractTypeAliases, extractInterfaces } from '../basic-node/type-extractor.js';
import type {
  ExtractedClass,
  ExtractedFunction,
  ExtractedType,
  ExtractedInterface,
  ParameterInfo,
} from '../basic-node/types.js';
import * as path from 'node:path';

const log = createLogger({ context: 'AstroCodeExtractor' });

export interface CodeExtractionResult {
  classes: ExtractedClass[];
  functions: ExtractedFunction[];
  types: ExtractedType[];
  interfaces: ExtractedInterface[];
}

/**
 * Extract TypeScript/JavaScript code from Astro frontmatter
 * Parses the frontmatter as TypeScript and uses basic-node extractors
 *
 * @param frontmatter - The frontmatter content (code between --- markers)
 * @param filePath - Original Astro file path (for error reporting)
 * @returns Extracted code items (classes, functions, types, interfaces)
 */
export function extractCodeFromFrontmatter(
  frontmatter: string,
  filePath: string,
): CodeExtractionResult {
  // Return empty result if no frontmatter
  if (!frontmatter || frontmatter.trim().length === 0) {
    return {
      classes: [],
      functions: [],
      types: [],
      interfaces: [],
    };
  }

  try {
    // Create a ts-morph project to parse the frontmatter
    const project = new Project({
      compilerOptions: {
        allowJs: true,
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
      },
      skipAddingFilesFromTsConfig: true,
      useInMemoryFileSystem: true,
    });

    // Create a virtual .ts file with the frontmatter content
    // Use original file path with .ts extension for better error messages
    const virtualPath = filePath.replace(/\.astro$/, '.frontmatter.ts');
    const sourceFile = project.createSourceFile(virtualPath, frontmatter);

    // Extract code using basic-node extractors
    const classes = extractClasses(sourceFile);
    const regularFunctions = extractFunctions(sourceFile);
    const arrowFunctions = extractArrowFunctions(sourceFile);
    const functions = [...regularFunctions, ...arrowFunctions];
    const types = extractTypeAliases(sourceFile);
    const interfaces = extractInterfaces(sourceFile);

    log.debug(
      `Extracted from ${filePath} frontmatter: ${classes.length} classes, ${functions.length} functions, ${types.length} types, ${interfaces.length} interfaces`,
    );

    return {
      classes,
      functions,
      types,
      interfaces,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log.warn(`Failed to extract code from ${filePath} frontmatter: ${errorMsg}`);

    // Return empty result on error
    return {
      classes: [],
      functions: [],
      types: [],
      interfaces: [],
    };
  }
}

/**
 * Create a synthetic render function for an Astro component
 * Every Astro component is fundamentally a server-side render function
 * that takes props and returns HTML
 *
 * Function is named after the file (e.g., "index", "about", "Header")
 * so each Astro file has a unique code-level representation
 *
 * @param filePath - Original Astro file path
 * @param interfaces - Extracted interfaces (to find Props interface)
 * @returns Synthetic render function named after the file
 */
export function createSyntheticRenderFunction(
  filePath: string,
  interfaces: ExtractedInterface[],
): ExtractedFunction {
  // Use file name (without .astro extension) as the function name
  // Examples: "index.astro" -> "index", "Header.astro" -> "Header"
  const fileName = path.basename(filePath, '.astro');

  // Check if a Props interface exists in the frontmatter
  const propsInterface = interfaces.find((iface) => iface.name === 'Props');

  // Build parameter list
  const parameters: ParameterInfo[] = [];
  if (propsInterface) {
    parameters.push({
      name: 'props',
      type: 'Props',
      optional: false,
      description: 'Component properties',
    });
  }

  return {
    name: fileName,
    isExported: true,
    isAsync: true,
    parameters,
    returnType: 'Promise<string>',
    returnDescription: 'HTML string output from the component template',
    documentation: {
      summary: `Server-side render function for ${fileName}. Generates HTML output from Astro component template and props.`,
      remarks: [
        'Auto-generated synthetic function representing Astro component render behavior',
      ],
    },
    location: {
      filePath,
      line: 1,
      column: 0,
    },
  };
}
