/**
 * Import extraction utilities
 */

import type { SourceFile } from 'ts-morph';
import { createLogger } from '../../../core/logger.js';
import type { ExtractedImport } from './types.js';

const log = createLogger({ context: 'ImportExtractor' });

/**
 * Extract all import declarations from a source file
 */
export function extractImports(sourceFile: SourceFile): ExtractedImport[] {
  const imports: ExtractedImport[] = [];

  for (const importDecl of sourceFile.getImportDeclarations()) {
    try {
      const source = importDecl.getModuleSpecifierValue();
      const isTypeOnly = importDecl.isTypeOnly();

      // Get imported names
      const importedNames: string[] = [];

      // Named imports: import { foo, bar } from '...'
      const namedImports = importDecl.getNamedImports();
      for (const named of namedImports) {
        importedNames.push(named.getName());
      }

      // Default import: import foo from '...'
      const defaultImport = importDecl.getDefaultImport();
      if (defaultImport) {
        importedNames.push(defaultImport.getText());
      }

      // Namespace import: import * as foo from '...'
      const namespaceImport = importDecl.getNamespaceImport();
      if (namespaceImport) {
        importedNames.push(`* as ${namespaceImport.getText()}`);
      }

      imports.push({
        source,
        importedNames,
        isTypeOnly,
      });
    } catch (error) {
      log.warn(`Error extracting import: ${error}`);
    }
  }

  return imports;
}
