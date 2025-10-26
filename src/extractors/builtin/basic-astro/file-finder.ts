/**
 * @module basic-astro
 * File discovery utilities
 * Finds Astro files and package.json files in the workspace
 */

import { globby } from 'globby';
import { sep, relative, dirname } from 'node:path';
import { createLogger } from '../../../core/logger.js';
import type { PackageInfo } from './types.js';

const log = createLogger({ context: 'AstroFileFinder' });

const DEFAULT_INCLUDE = ['src/**/*.astro', '**/*.astro'];
const DEFAULT_EXCLUDE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.astro/**',
];

/**
 * Find Astro source files matching the given patterns
 */
export async function findSourceFiles(options: {
  include?: string[];
  exclude?: string[];
}): Promise<string[]> {
  const include = options.include ?? DEFAULT_INCLUDE;
  const exclude = options.exclude ?? DEFAULT_EXCLUDE;

  const files = await globby(include, {
    ignore: exclude,
    absolute: true,
    gitignore: false,
  });

  return files;
}

/**
 * Find all package.json files in the workspace
 */
export async function findPackageJsonFiles(options: {
  include?: string[];
  exclude?: string[];
}): Promise<string[]> {
  const include = options.include ?? DEFAULT_INCLUDE;

  // Extract base directories from include patterns
  const baseDirs = new Set<string>();
  for (const pattern of include) {
    // Normalize path separators to forward slashes
    const normalized = pattern.replace(/\\/g, '/');
    const parts = normalized.split('/');
    let baseDir = '';
    const isAbsolute = normalized.startsWith('/');
    for (const part of parts) {
      if (part.includes('*') || part === 'src') break;
      if (!part) continue; // Skip empty parts
      baseDir += (baseDir ? '/' : '') + part;
    }
    // Add leading slash back for absolute paths
    if (isAbsolute && baseDir) {
      baseDir = '/' + baseDir;
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

  log.debug(`Package search base dirs: ${Array.from(baseDirs).join(', ')}`);
  log.debug(`Package search patterns: ${packagePatterns.join(', ')}`);

  const files = await globby(packagePatterns, {
    absolute: true,
    gitignore: false,
    ignore: ['**/node_modules/**'],
  });

  log.debug(`Found ${files.length} package.json files: ${files.join(', ')}`);

  return files;
}

/**
 * Read package.json and extract metadata
 */
export async function readPackageInfo(filePath: string): Promise<PackageInfo | null> {
  try {
    const { readFile } = await import('node:fs/promises');

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
 * Find the nearest package.json for a given file
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
