/**
 * Type alias and interface extraction utilities
 */

import type { SourceFile } from 'ts-morph';
import type { ExtractedType, ExtractedInterface } from './types.js';
import { extractDocumentation, extractDeprecation } from './doc-extractor.js';

/**
 * Extract type aliases from a source file
 * Examples:
 *   type UserRole = 'admin' | 'user' | 'guest'
 *   export type ApiResponse<T> = { data: T; status: number }
 */
export function extractTypeAliases(sourceFile: SourceFile): ExtractedType[] {
  const types: ExtractedType[] = [];

  for (const typeAlias of sourceFile.getTypeAliases()) {
    try {
      const name = typeAlias.getName();
      const jsDocs = typeAlias.getJsDocs();
      const location = typeAlias.getStartLineNumber();

      types.push({
        name,
        isExported: typeAlias.isExported(),
        location: {
          filePath: sourceFile.getFilePath(),
          line: location,
          column: 0,
        },
        documentation: extractDocumentation(jsDocs),
        deprecated: extractDeprecation(jsDocs),
        typeParameters: typeAlias.getTypeParameters().map((tp) => ({
          name: tp.getName(),
          constraint: tp.getConstraint()?.getText(),
          default: tp.getDefault()?.getText(),
        })),
        definition: typeAlias.getTypeNode()?.getText() || typeAlias.getType().getText(),
      });
    } catch (error) {
      console.warn(`Error extracting type alias ${typeAlias.getName()}: ${error}`);
    }
  }

  return types;
}

/**
 * Extract interfaces from a source file
 * Examples:
 *   interface User { id: string; name: string }
 *   export interface ApiClient { get<T>(url: string): Promise<T> }
 */
export function extractInterfaces(sourceFile: SourceFile): ExtractedInterface[] {
  const interfaces: ExtractedInterface[] = [];

  for (const interfaceDecl of sourceFile.getInterfaces()) {
    try {
      const name = interfaceDecl.getName();
      const jsDocs = interfaceDecl.getJsDocs();
      const location = interfaceDecl.getStartLineNumber();

      interfaces.push({
        name,
        isExported: interfaceDecl.isExported(),
        location: {
          filePath: sourceFile.getFilePath(),
          line: location,
          column: 0,
        },
        documentation: extractDocumentation(jsDocs),
        deprecated: extractDeprecation(jsDocs),
        typeParameters: interfaceDecl.getTypeParameters().map((tp) => ({
          name: tp.getName(),
          constraint: tp.getConstraint()?.getText(),
          default: tp.getDefault()?.getText(),
        })),
        extends: interfaceDecl.getExtends().map((e) => e.getText()),
        properties: interfaceDecl.getProperties().map((prop) => ({
          name: prop.getName(),
          type: prop.getType().getText(),
          optional: prop.hasQuestionToken(),
          readonly: prop.isReadonly(),
        })),
        methods: interfaceDecl.getMethods().map((method) => ({
          name: method.getName(),
          parameters: method.getParameters().map((param) => ({
            name: param.getName(),
            type: param.getType().getText(),
            optional: param.isOptional(),
          })),
          returnType: method.getReturnType().getText(),
        })),
      });
    } catch (error) {
      console.warn(`Error extracting interface ${interfaceDecl.getName()}: ${error}`);
    }
  }

  return interfaces;
}
