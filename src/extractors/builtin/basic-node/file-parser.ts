/**
 * File parsing and extraction
 */

import { Project, ts } from 'ts-morph';
import type { FileExtraction } from './types.js';
import { extractClasses } from './class-extractor.js';
import { extractFunctions } from './function-extractor.js';
import { extractImports } from './import-extractor.js';
import { extractFileComponent } from './component-detector.js';

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

      extractions.push({
        filePath,
        language,
        component: extractFileComponent(sourceFile),
        classes: extractClasses(sourceFile),
        functions: extractFunctions(sourceFile),
        imports: extractImports(sourceFile),
      });
    } catch (error) {
      // Log parse error but continue with other files
      const filePath = sourceFile.getFilePath();
      console.warn(`Parse error in ${filePath}: ${error}`);

      extractions.push({
        filePath,
        language: 'typescript',
        component: undefined,
        classes: [],
        functions: [],
        imports: [],
        parseError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return extractions;
}
