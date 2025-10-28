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
 *
 * Parses the frontmatter section (code between --- markers) as TypeScript
 * and extracts code elements using the basic-node AST extractors:
 * - Classes and their methods
 * - Functions (both regular and arrow functions)
 * - Type aliases (type X = ...)
 * - TypeScript interfaces
 *
 * Returns empty result if frontmatter is empty or parsing fails (errors are logged).
 * Graceful error handling ensures one malformed Astro file doesn't break the extraction pipeline.
 *
 * @param frontmatter - The frontmatter code (TypeScript/JavaScript between --- markers)
 * @param filePath - Original Astro file path (used for error reporting and virtual TS path)
 * @returns CodeExtractionResult with extracted classes, functions, types, and interfaces
 *
 * @example
 * const fm = 'export interface Props { title: string; }\\nexport function helper() {}';
 * const result = extractCodeFromFrontmatter(fm, '/path/Component.astro');
 * // Returns:
 * // {
 * //   interfaces: [{ name: 'Props', ... }],
 * //   functions: [{ name: 'helper', ... }],
 * //   classes: [],
 * //   types: []
 * // }
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
 *
 * Every Astro component is fundamentally a server-side render function that:
 * 1. Receives props (if Props interface is defined)
 * 2. Processes the component logic (frontmatter code)
 * 3. Renders the template to HTML
 * 4. Returns an HTML string
 *
 * Since Astro's compiler doesn't explicitly define this, we create a synthetic function
 * to represent the component's executable behavior in the IR.
 *
 * The function is named after the file (without .astro extension):
 * - Button.astro → function Button()
 * - index.astro → function index()
 * - settings/Profile.astro → function Profile()
 *
 * @param filePath - Absolute path to the Astro file
 * @param interfaces - Extracted interfaces from frontmatter (used to detect Props interface)
 * @returns Synthetic ExtractedFunction representing the component's render behavior
 *
 * @example
 * const synthFunc = createSyntheticRenderFunction(
 *   '/project/src/components/Button.astro',
 *   [{ name: 'Props', ... }]
 * );
 * // Returns: { name: 'Button', isAsync: true, parameters: [{name: 'props', type: 'Props'}], ... }
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
