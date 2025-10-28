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
 *
 * Locates all .astro files in the workspace using glob patterns.
 * Returns absolute paths to enable downstream processing.
 *
 * Default patterns include src directory and exclude node_modules, dist, build, and .astro.
 *
 * @param options - Configuration object
 * @param options.include - Glob patterns to include (defaults to src and root)
 * @param options.exclude - Glob patterns to exclude (node_modules, build artifacts, etc.)
 * @returns Promise resolving to array of absolute file paths
 *
 * @example
 * const files = await findSourceFiles({});
 * // Returns array of absolute paths to all found .astro files
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
 *
 * Extracts base directories from include patterns and searches multiple directory levels
 * to locate all package.json files. Useful for identifying container boundaries and
 * package metadata (name, version, description).
 *
 * @param options - Configuration object
 * @param options.include - Glob patterns to use as search base directories
 * @param options.exclude - Exclude patterns (currently unused for package search)
 * @returns Promise resolving to array of absolute paths to package.json files
 *
 * @example
 * const packages = await findPackageJsonFiles({
 *   include: ['src/**\/*.astro']
 * });
 * // Returns paths to package.json files found in the workspace
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
 *
 * Parses a package.json file and extracts key metadata fields: name, version, and description.
 * Returns null on read or parse errors (logged as warnings).
 *
 * @param filePath - Absolute path to package.json file
 * @returns Promise resolving to PackageInfo object or null on error
 *
 * @example
 * const pkg = await readPackageInfo('/abs/path/package.json');
 * // { path: '/abs/path/package.json', dir: '/abs/path', name: 'my-pkg', version: '1.0.0' }
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
 *
 * Searches through all known packages and finds the one whose directory is the closest
 * parent of the given file. Packages are sorted by depth (deepest first) to prioritize
 * monorepo sub-packages over workspace root packages.
 *
 * @param filePath - Absolute path to the file
 * @param packages - Array of discovered package.json metadata objects
 * @returns The closest parent package, or null if file is not within any package
 *
 * @example
 * const pkg = findNearestPackage(
 *   '/workspace/packages/ui/src/Button.astro',
 *   packages
 * );
 * // Returns the packages/ui/package.json metadata if it exists
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
