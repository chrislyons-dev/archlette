/**
 * File discovery utilities
 */

import { globby } from 'globby';
import type { ExtractorInputs } from './types.js';

const DEFAULT_INCLUDE = ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'];
const DEFAULT_EXCLUDE = [
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.test.js',
  '**/*.test.jsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/*.spec.js',
  '**/*.spec.jsx',
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
];

/**
 * Find source files matching include/exclude patterns
 */
export async function findSourceFiles(inputs?: ExtractorInputs): Promise<string[]> {
  const include = inputs?.include ?? DEFAULT_INCLUDE;
  const exclude = inputs?.exclude ?? DEFAULT_EXCLUDE;

  const files = await globby(include, {
    ignore: exclude,
    absolute: true,
    gitignore: false, // Don't respect .gitignore to allow finding test files
  });

  return files;
}
