/**
 * @module basic_node
 * File discovery utilities
 */

import { globby } from 'globby';
import { sep, relative } from 'node:path';
import { createLogger } from '../../../core/logger.js';
import type { ExtractorInputs, PackageInfo } from './types.js';

const log = createLogger({ context: 'FileFinder' });

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

/**
 * Find package.json files within the search paths
 */
export async function findPackageJsonFiles(
  inputs?: ExtractorInputs,
): Promise<string[]> {
  const include = inputs?.include ?? DEFAULT_INCLUDE;

  // Extract base directories from include patterns
  const baseDirs = new Set<string>();
  for (const pattern of include) {
    // Normalize path separators to forward slashes
    const normalized = pattern.replace(/\\/g, '/');
    const parts = normalized.split('/');
    let baseDir = '';
    for (const part of parts) {
      if (part.includes('*') || part === 'src') break;
      baseDir += (baseDir ? '/' : '') + part;
    }
    if (baseDir) baseDirs.add(baseDir);
  }

  // Search for package.json in base directories
  const packagePatterns: string[] = [];
  for (const baseDir of baseDirs) {
    packagePatterns.push(`${baseDir}/package.json`);
    packagePatterns.push(`${baseDir}/*/package.json`);
    packagePatterns.push(`${baseDir}/*/*/package.json`);
  }

  const files = await globby(packagePatterns, {
    absolute: true,
    gitignore: false,
  });

  return files;
}

/**
 * Read and parse package.json file
 */
export async function readPackageInfo(filePath: string): Promise<PackageInfo | null> {
  try {
    const { readFile } = await import('node:fs/promises');
    const { dirname } = await import('node:path');

    const content = await readFile(filePath, 'utf-8');
    const pkg = JSON.parse(content);

    return {
      path: filePath,
      dir: dirname(filePath),
      name: pkg.name || 'unknown',
      version: pkg.version,
      description: pkg.description,
    };
  } catch (error) {
    log.warn(`Failed to read package.json at ${filePath}:`, error);
    return null;
  }
}

/**
 * Find the nearest parent package.json for a given file
 */
export function findNearestPackage(
  filePath: string,
  packages: PackageInfo[],
): PackageInfo | null {
  // Sort packages by depth (deepest first)
  const sortedPackages = [...packages].sort((a, b) => {
    const depthA = a.dir.split(sep).length;
    const depthB = b.dir.split(sep).length;
    return depthB - depthA;
  });

  // Find first package whose directory is parent of file
  for (const pkg of sortedPackages) {
    const rel = relative(pkg.dir, filePath);
    if (!rel.startsWith('..') && !rel.startsWith(sep)) {
      return pkg;
    }
  }

  return null;
}
