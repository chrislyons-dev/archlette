/**
 * @module basic_node
 * File parsing and extraction
 */

import { Project, ts } from 'ts-morph';
import { createLogger } from '../../../core/logger.js';
import type { FileExtraction } from './types.js';
import { extractClasses } from './class-extractor.js';
import { extractFunctions, extractArrowFunctions } from './function-extractor.js';
import { extractTypeAliases, extractInterfaces } from './type-extractor.js';
import { extractImports } from './import-extractor.js';
import {
  extractFileComponent,
  extractFileActors,
  extractFileRelationships,
} from './component-detector.js';

const log = createLogger({ context: 'FileParser' });

/**
 * Parse and extract information from source files
 */
export async function parseFiles(filePaths: string[]): Promise<FileExtraction[]> {
  const project = new Project({
    compilerOptions: {
      allowJs: true,
      jsx: ts.JsxEmit.React,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    },
    skipAddingFilesFromTsConfig: true,
  });

  // Add all files to the project
  for (const filePath of filePaths) {
    project.addSourceFileAtPath(filePath);
  }

  const extractions: FileExtraction[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    try {
      const filePath = sourceFile.getFilePath();
      const language =
        filePath.endsWith('.ts') || filePath.endsWith('.tsx')
          ? 'typescript'
          : 'javascript';

      // Extract both regular functions and arrow functions
      const regularFunctions = extractFunctions(sourceFile);
      const arrowFunctions = extractArrowFunctions(sourceFile);
      const allFunctions = [...regularFunctions, ...arrowFunctions];

      extractions.push({
        filePath,
        language,
        component: extractFileComponent(sourceFile),
        actors: extractFileActors(sourceFile),
        relationships: extractFileRelationships(sourceFile),
        classes: extractClasses(sourceFile),
        functions: allFunctions,
        types: extractTypeAliases(sourceFile),
        interfaces: extractInterfaces(sourceFile),
        imports: extractImports(sourceFile),
      });
    } catch (error) {
      // Log parse error but continue with other files
      const filePath = sourceFile.getFilePath();
      log.warn(`Parse error in ${filePath}: ${error}`);

      extractions.push({
        filePath,
        language: 'typescript',
        component: undefined,
        actors: [],
        relationships: [],
        classes: [],
        functions: [],
        types: [],
        interfaces: [],
        imports: [],
        parseError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return extractions;
}
