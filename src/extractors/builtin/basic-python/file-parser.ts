/**
 * @module basic_python
 * File parsing and extraction orchestrator
 * Shells out to Python AST parser script and maps results to TypeScript types
 */

import { spawn } from 'child_process';
import { createLogger } from '../../../core/logger.js';
import { getCliDir } from '../../../core/path-resolver.js';
import { nameToId } from '../../../core/constants.js';
import * as path from 'path';
import type {
  FileExtraction,
  PythonParserOutput,
  ExtractedClass,
  ExtractedMethod,
  ExtractedProperty,
  ExtractedFunction,
  ExtractedType,
  ParameterInfo,
  DocInfo,
} from './types.js';

const log = createLogger({ context: 'PythonFileParser' });

/**
 * Parse Python files using Python AST parser script
 */
export async function parseFiles(
  filePaths: string[],
  pythonPath = 'python',
): Promise<FileExtraction[]> {
  if (filePaths.length === 0) {
    return [];
  }

  try {
    // In development: src/extractors/builtin/basic_python -> scripts/
    // In production: dist/extractors/builtin/basic_python -> dist/scripts/
    // getCliDir() returns the directory containing cli.ts (src/ or dist/)
    const cliDir = getCliDir();
    const parserScript = path.join(cliDir, 'scripts', 'python-ast-parser.py');
    log.info(`Parsing ${filePaths.length} Python files using ${parserScript}`);

    const output = await runPythonParser(parserScript, filePaths, pythonPath);
    const parsed: PythonParserOutput = JSON.parse(output);

    return parsed.files.map((file) => mapToFileExtraction(file));
  } catch (error) {
    log.error(`Failed to parse Python files: ${error}`);
    throw error;
  }
}

/**
 * Run Python parser script and return JSON output
 */
function runPythonParser(
  scriptPath: string,
  filePaths: string[],
  pythonPath: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [scriptPath, ...filePaths];
    const process = spawn(pythonPath, args);

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python parser failed with code ${code}: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });

    process.on('error', (error) => {
      reject(new Error(`Failed to spawn Python process: ${error.message}`));
    });
  });
}

/**
 * Map Python parser output to FileExtraction format
 */
function mapToFileExtraction(file: PythonParserOutput['files'][0]): FileExtraction {
  return {
    filePath: file.filePath,
    language: 'python',
    component: file.component
      ? {
          id: nameToId(file.component.name),
          name: file.component.name,
          description: file.component.description,
        }
      : undefined,
    actors: file.actors.map((actor) => ({
      id: nameToId(actor.name),
      name: actor.name,
      type: actor.type,
      direction: actor.direction,
      description: actor.description,
    })),
    relationships: file.relationships.map((rel) => ({
      source: '', // Will be filled by mapper with component ID
      target: rel.target,
      description: rel.description,
    })),
    classes: file.classes.map((cls) => mapClass(cls, file.filePath)),
    functions: file.functions.map((func) => mapFunction(func, file.filePath)),
    types: file.types.map((type) => mapType(type, file.filePath)),
    imports: file.imports.map((imp) => ({
      source: imp.source,
      importedNames: imp.names,
      isRelative: imp.isRelative,
      level: imp.level,
      category: imp.category,
    })),
    parseError: file.parseError,
  };
}

/**
 * Map Python class to ExtractedClass
 */
function mapClass(
  cls: PythonParserOutput['files'][0]['classes'][0],
  filePath: string,
): ExtractedClass {
  return {
    name: cls.name,
    isExported: !cls.name.startsWith('_'), // Python convention: _private
    baseClasses: cls.baseClasses,
    decorators: cls.decorators,
    decoratorDetails: cls.decoratorDetails,
    location: {
      filePath,
      line: cls.line,
      column: 0,
    },
    documentation: parseDocstring(cls.docstring),
    deprecated: extractDeprecation(cls.docstring),
    methods: cls.methods.map((method) => mapMethod(method, filePath)),
    properties: cls.properties.map((prop) => mapProperty(prop, filePath)),
  };
}

/**
 * Map Python method to ExtractedMethod
 */
function mapMethod(
  method: PythonParserOutput['files'][0]['classes'][0]['methods'][0],
  filePath: string,
): ExtractedMethod {
  const visibility = getVisibility(method.name);

  return {
    name: method.name,
    visibility,
    isStatic: method.isStatic,
    isAsync: method.isAsync,
    isAbstract: method.isAbstract,
    isClassMethod: method.isClassMethod,
    decorators: method.decorators,
    decoratorDetails: method.decoratorDetails,
    location: {
      filePath,
      line: method.line,
      column: 0,
    },
    documentation: parseDocstring(method.docstring, method.parsedDoc),
    deprecated: extractDeprecation(method.docstring),
    parameters: method.parameters.map((param, idx) =>
      mapParameter(param, method.parsedDoc?.args?.[idx]),
    ),
    returnType: method.returnAnnotation ?? undefined,
    returnDescription:
      method.parsedDoc?.returns?.description ||
      extractReturnDescription(method.docstring),
  };
}

/**
 * Map Python property to ExtractedProperty
 */
function mapProperty(
  prop: PythonParserOutput['files'][0]['classes'][0]['properties'][0],
  filePath: string,
): ExtractedProperty {
  const visibility = getVisibility(prop.name);
  const isProperty = prop.type === 'property';

  return {
    name: prop.name,
    visibility,
    isStatic: !isProperty, // Properties are instance members, class variables are static
    isReadonly: prop.isReadonly || false,
    isProperty,
    location: {
      filePath,
      line: prop.line,
      column: 0,
    },
    documentation: parseDocstring(prop.docstring),
    type: prop.annotation ?? undefined,
    defaultValue: prop.default ?? undefined,
    hasGetter: prop.hasGetter,
    hasSetter: prop.hasSetter,
    hasDeleter: prop.hasDeleter,
  };
}

/**
 * Map Python function to ExtractedFunction
 */
function mapFunction(
  func: PythonParserOutput['files'][0]['functions'][0],
  filePath: string,
): ExtractedFunction {
  return {
    name: func.name,
    isExported: !func.name.startsWith('_'), // Python convention
    isAsync: func.isAsync,
    decorators: func.decorators,
    decoratorDetails: func.decoratorDetails,
    location: {
      filePath,
      line: func.line,
      column: 0,
    },
    documentation: parseDocstring(func.docstring, func.parsedDoc),
    deprecated: extractDeprecation(func.docstring),
    parameters: func.parameters.map((param, idx) =>
      mapParameter(param, func.parsedDoc?.args?.[idx]),
    ),
    returnType: func.returnAnnotation ?? undefined,
    returnDescription:
      func.parsedDoc?.returns?.description || extractReturnDescription(func.docstring),
  };
}

/**
 * Map Python type definition to ExtractedType
 */
function mapType(
  type: PythonParserOutput['files'][0]['types'][0],
  filePath: string,
): ExtractedType {
  return {
    name: type.name,
    isExported: !type.name.startsWith('_'),
    category: type.category,
    location: {
      filePath,
      line: type.line,
      column: 0,
    },
    documentation: parseDocstring(type.docstring),
    deprecated: extractDeprecation(type.docstring),
    definition: type.definition || '',
  };
}

/**
 * Map Python parameter to ParameterInfo
 */
function mapParameter(
  param: PythonParserOutput['files'][0]['functions'][0]['parameters'][0],
  parsedParam?: { name: string; type?: string; description?: string },
): ParameterInfo {
  return {
    name: param.name,
    type: param.annotation ?? undefined,
    description: parsedParam?.description,
    optional: param.default !== null && param.default !== undefined,
    defaultValue: param.default ?? undefined,
  };
}

/**
 * Parse Python docstring into DocInfo
 * Enhanced in Phase 2 to use parsed Google/NumPy/Sphinx docstrings
 */
function parseDocstring(
  docstring?: string,
  parsedDoc?: {
    summary?: string;
    description?: string;
    args?: Array<{ name: string; type?: string; description?: string }>;
    returns?: { type?: string; description?: string };
    raises?: Array<{ type: string; description?: string }>;
    examples?: string;
  },
): DocInfo | undefined {
  if (!docstring && !parsedDoc) return undefined;

  // Use parsed docstring if available (from Google/NumPy/Sphinx parsing)
  if (parsedDoc) {
    return {
      summary: parsedDoc.summary ?? undefined,
      details: parsedDoc.description ?? undefined,
      examples: parsedDoc.examples ? [parsedDoc.examples] : undefined,
    };
  }

  // Fallback to simple parsing
  const lines = docstring!.trim().split('\n');
  const summary = lines[0].trim();
  const details = lines.length > 1 ? lines.slice(1).join('\n').trim() : undefined;

  return {
    summary: summary || undefined,
    details: details || undefined,
  };
}

/**
 * Extract deprecation info from docstring
 */
function extractDeprecation(
  docstring?: string,
): { reason?: string; alternative?: string } | undefined {
  if (!docstring) return undefined;

  const deprecatedMatch = docstring.match(/@deprecated\s+(.*?)(?=@|$)/s);
  if (!deprecatedMatch) return undefined;

  return {
    reason: deprecatedMatch[1].trim(),
  };
}

/**
 * Extract return description from docstring
 */
function extractReturnDescription(docstring?: string): string | undefined {
  if (!docstring) return undefined;

  const returnMatch = docstring.match(/@returns?\s+(.*?)(?=@|$)/s);
  return returnMatch ? returnMatch[1].trim() : undefined;
}

/**
 * Determine visibility from Python name convention
 * - __name: private
 * - _name: protected
 * - name: public
 */
function getVisibility(name: string): 'public' | 'private' | 'protected' {
  if (name.startsWith('__') && !name.endsWith('__')) {
    return 'private';
  }
  if (name.startsWith('_')) {
    return 'protected';
  }
  return 'public';
}
