/**
 * Function extraction utilities
 */

import type { FunctionDeclaration, SourceFile } from 'ts-morph';
import type { ExtractedFunction, ParameterInfo } from './types.js';
import {
  extractDocumentation,
  extractDeprecation,
  extractParameterDescriptions,
  extractReturnDescription,
} from './doc-extractor.js';

/**
 * Extract all function declarations from a source file
 */
export function extractFunctions(sourceFile: SourceFile): ExtractedFunction[] {
  const functions: ExtractedFunction[] = [];

  for (const func of sourceFile.getFunctions()) {
    try {
      const extracted = extractFunction(func, sourceFile.getFilePath());
      if (extracted) {
        functions.push(extracted);
      }
    } catch (error) {
      // Log and continue - don't let one bad function stop the whole extraction
      console.warn(
        `Error extracting function ${func.getName() || '<anonymous>'}: ${error}`,
      );
    }
  }

  return functions;
}

/**
 * Extract information from a single function declaration
 */
function extractFunction(
  func: FunctionDeclaration,
  filePath: string,
): ExtractedFunction | null {
  const name = func.getName();
  if (!name) {
    // Skip anonymous functions
    return null;
  }

  const jsDocs = func.getJsDocs();
  const paramDescriptions = extractParameterDescriptions(jsDocs);
  const location = func.getStartLineNumber();

  return {
    name,
    isExported: func.isExported(),
    isAsync: func.isAsync(),
    location: {
      filePath,
      line: location,
      column: 0,
    },
    documentation: extractDocumentation(jsDocs),
    deprecated: extractDeprecation(jsDocs),
    parameters: func
      .getParameters()
      .map((param) => extractParameter(param, paramDescriptions)),
    returnType: func.getReturnType().getText(),
    returnDescription: extractReturnDescription(jsDocs),
  };
}

/**
 * Extract parameter information
 */
function extractParameter(
  param: ReturnType<FunctionDeclaration['getParameters']>[0],
  descriptions: Map<string, string>,
): ParameterInfo {
  const name = param.getName();
  const type = param.getType().getText();
  const optional = param.isOptional();
  const initializer = param.getInitializer();

  return {
    name,
    type: type !== 'any' ? type : undefined,
    description: descriptions.get(name),
    optional,
    defaultValue: initializer?.getText(),
  };
}
