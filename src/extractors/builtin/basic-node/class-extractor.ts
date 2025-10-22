/**
 * @module basic_node
 * Class extraction utilities
 */

import type {
  ClassDeclaration,
  SourceFile,
  MethodDeclaration,
  PropertyDeclaration,
} from 'ts-morph';
import { Scope } from 'ts-morph';
import { createLogger } from '../../../core/logger.js';
import type {
  ExtractedClass,
  ExtractedMethod,
  ExtractedProperty,
  ParameterInfo,
} from './types.js';
import {
  extractDocumentation,
  extractDeprecation,
  extractParameterDescriptions,
  extractReturnDescription,
} from './doc-extractor.js';

const log = createLogger({ context: 'ClassExtractor' });

/**
 * Extract all class declarations from a source file
 */
export function extractClasses(sourceFile: SourceFile): ExtractedClass[] {
  const classes: ExtractedClass[] = [];

  for (const cls of sourceFile.getClasses()) {
    try {
      const extracted = extractClass(cls, sourceFile.getFilePath());
      if (extracted) {
        classes.push(extracted);
      }
    } catch (error) {
      // Log and continue - don't let one bad class stop the whole extraction
      log.warn(`Error extracting class ${cls.getName() || '<anonymous>'}: ${error}`);
    }
  }

  return classes;
}

/**
 * Extract information from a single class declaration
 */
function extractClass(cls: ClassDeclaration, filePath: string): ExtractedClass | null {
  const name = cls.getName();
  if (!name) {
    // Skip anonymous classes
    return null;
  }

  const jsDocs = cls.getJsDocs();
  const location = cls.getStartLineNumber();

  // Get base class if it extends another class
  const extendsClause = cls.getExtends();
  const extendsName = extendsClause?.getText();

  // Get implemented interfaces
  const implementsClauses = cls.getImplements();
  const implementsNames = implementsClauses.map((impl) => impl.getText());

  return {
    name,
    isExported: cls.isExported(),
    isAbstract: cls.isAbstract(),
    location: {
      filePath,
      line: location,
      column: 0,
    },
    documentation: extractDocumentation(jsDocs),
    deprecated: extractDeprecation(jsDocs),
    extends: extendsName,
    implements: implementsNames.length > 0 ? implementsNames : undefined,
    methods: cls.getMethods().map((method) => extractMethod(method, filePath)),
    properties: cls.getProperties().map((prop) => extractProperty(prop, filePath)),
  };
}

/**
 * Extract method information from a class
 */
function extractMethod(method: MethodDeclaration, filePath: string): ExtractedMethod {
  const jsDocs = method.getJsDocs();
  const paramDescriptions = extractParameterDescriptions(jsDocs);
  const location = method.getStartLineNumber();

  return {
    name: method.getName(),
    visibility: mapVisibility(method.getScope()),
    isStatic: method.isStatic(),
    isAsync: method.isAsync(),
    isAbstract: method.isAbstract(),
    location: {
      filePath,
      line: location,
      column: 0,
    },
    documentation: extractDocumentation(jsDocs),
    deprecated: extractDeprecation(jsDocs),
    parameters: method
      .getParameters()
      .map((param) => extractMethodParameter(param, paramDescriptions)),
    returnType: method.getReturnType().getText(),
    returnDescription: extractReturnDescription(jsDocs),
  };
}

/**
 * Extract property information from a class
 */
function extractProperty(
  prop: PropertyDeclaration,
  filePath: string,
): ExtractedProperty {
  const jsDocs = prop.getJsDocs();
  const location = prop.getStartLineNumber();

  return {
    name: prop.getName(),
    visibility: mapVisibility(prop.getScope()),
    isStatic: prop.isStatic(),
    isReadonly: prop.isReadonly(),
    location: {
      filePath,
      line: location,
      column: 0,
    },
    documentation: extractDocumentation(jsDocs),
    type: prop.getType().getText(),
  };
}

/**
 * Extract parameter information
 */
// function extractMethodParameter(
function extractMethodParameter(
  param: ReturnType<MethodDeclaration['getParameters']>[0],
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
 * Map ts-morph Scope to our visibility string
 */
function mapVisibility(scope: Scope | undefined): 'public' | 'private' | 'protected' {
  if (scope === Scope.Private) return 'private';
  if (scope === Scope.Protected) return 'protected';
  return 'public';
}
