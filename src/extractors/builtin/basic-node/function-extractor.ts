/**
 * @module basic_node
 * Function extraction utilities
 */

import { Node, type FunctionDeclaration, type SourceFile } from 'ts-morph';
import { createLogger } from '../../../core/logger.js';
import type { ExtractedFunction, ParameterInfo } from './types.js';
import {
  extractDocumentation,
  extractDeprecation,
  extractParameterDescriptions,
  extractReturnDescription,
} from './doc-extractor.js';

const log = createLogger({ context: 'FunctionExtractor' });

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
      log.warn(
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
      .map((param) => extractFunctionParameter(param, paramDescriptions)),
    returnType: func.getReturnType().getText(),
    returnDescription: extractReturnDescription(jsDocs),
  };
}

/**
 * Extract parameter information
 */
function extractFunctionParameter(
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

/**
 * Extract arrow functions assigned to const/let/var
 * Examples:
 *   const handleClick = () => {}
 *   export const createUser = async (data) => {}
 */
export function extractArrowFunctions(sourceFile: SourceFile): ExtractedFunction[] {
  const functions: ExtractedFunction[] = [];

  // Get all variable statements (const, let, var)
  for (const statement of sourceFile.getVariableStatements()) {
    const isExported = statement.isExported();

    for (const declaration of statement.getDeclarations()) {
      const initializer = declaration.getInitializer();

      // Check if the initializer is an arrow function or function expression
      if (
        initializer &&
        (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))
      ) {
        try {
          const name = declaration.getName();
          const jsDocs = statement.getJsDocs();
          const paramDescriptions = extractParameterDescriptions(jsDocs);
          const location = declaration.getStartLineNumber();

          functions.push({
            name,
            isExported,
            isAsync: initializer.isAsync(),
            location: {
              filePath: sourceFile.getFilePath(),
              line: location,
              column: 0,
            },
            documentation: extractDocumentation(jsDocs),
            deprecated: extractDeprecation(jsDocs),
            parameters: initializer.getParameters().map((param) => ({
              name: param.getName(),
              type: param.getType().getText(),
              description: paramDescriptions.get(param.getName()),
              optional: param.isOptional(),
              defaultValue: param.getInitializer()?.getText(),
            })),
            returnType: initializer.getReturnType().getText(),
            returnDescription: extractReturnDescription(jsDocs),
          });
        } catch (error) {
          log.warn(
            `Error extracting arrow function ${declaration.getName()}: ${error}`,
          );
        }
      }
    }
  }

  return functions;
}
