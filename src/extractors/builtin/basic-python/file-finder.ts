/**
 * @module basic-python
 * File discovery utilities for Python projects
 */

import { globby } from 'globby';
import { sep, relative, dirname } from 'node:path';
import { readFile } from 'node:fs/promises';
import { parse as parseToml } from 'smol-toml';
import { createLogger } from '../../../core/logger.js';
import type { ExtractorInputs } from './types.js';

const log = createLogger({ context: 'PythonFileFinder' });

export interface PyProjectInfo {
  path: string;
  dir: string;
  name: string;
  version?: string;
  description?: string;
}

/**
 * Find source files matching include/exclude patterns
 */
export async function findSourceFiles(inputs: ExtractorInputs): Promise<string[]> {
  const include = inputs.include || [];
  const exclude = inputs.exclude || [];

  const files = await globby(include, {
    ignore: exclude,
    absolute: true,
    gitignore: false,
  });

  return files;
}

/**
 * Find pyproject.toml files within the search paths
 */
export async function findPyProjectFiles(inputs: ExtractorInputs): Promise<string[]> {
  const include = inputs.include || [];

  // Extract base directories from include patterns
  const baseDirs = new Set<string>();
  for (const pattern of include) {
    // Normalize path separators to forward slashes
    const normalized = pattern.replace(/\\/g, '/');
    const parts = normalized.split('/');
    let baseDir = '';
    const isAbsolute = normalized.startsWith('/');
    for (const part of parts) {
      // Stop if we hit a glob pattern, 'src', or a .py file
      if (part.includes('*') || part === 'src' || part.endsWith('.py')) break;
      if (!part) continue; // Skip empty parts (from leading slash or double slashes)
      baseDir += (baseDir ? '/' : '') + part;
    }
    // Add leading slash back for absolute paths
    if (isAbsolute && baseDir) {
      baseDir = '/' + baseDir;
    }
    if (baseDir) baseDirs.add(baseDir);
  }

  // Search for pyproject.toml in base directories
  const pyprojectPatterns: string[] = [];
  for (const baseDir of baseDirs) {
    pyprojectPatterns.push(`${baseDir}/pyproject.toml`);
    pyprojectPatterns.push(`${baseDir}/*/pyproject.toml`);
    pyprojectPatterns.push(`${baseDir}/*/*/pyproject.toml`);
  }

  log.debug(`PyProject search base dirs: ${Array.from(baseDirs).join(', ')}`);
  log.debug(`PyProject search patterns: ${pyprojectPatterns.join(', ')}`);

  const files = await globby(pyprojectPatterns, {
    absolute: true,
    gitignore: false,
    ignore: ['**/venv/**', '**/.venv/**', '**/node_modules/**'], // Exclude virtual envs
  });

  log.debug(`Found ${files.length} pyproject.toml files: ${files.join(', ')}`);

  return files;
}

/**
 * Read and parse pyproject.toml file
 */
export async function readPyProjectInfo(
  filePath: string,
): Promise<PyProjectInfo | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const pyproject = parsePyProjectToml(content);

    // Get project name from [project] or [tool.poetry] section
    let name = pyproject.project?.name || pyproject.tool?.poetry?.name;
    const version = pyproject.project?.version || pyproject.tool?.poetry?.version;
    const description =
      pyproject.project?.description || pyproject.tool?.poetry?.description;

    if (!name) {
      log.warn(`No project name found in ${filePath}, using directory name`);
      name = dirname(filePath).split(sep).pop() || 'unknown';
    }

    return {
      path: filePath,
      dir: dirname(filePath),
      name,
      version,
      description,
    };
  } catch (error) {
    log.warn(`Failed to read pyproject.toml at ${filePath}:`, error);
    return null;
  }
}

interface PyProjectToml {
  project?: {
    name?: string;
    version?: string;
    description?: string;
  };
  tool?: {
    poetry?: {
      name?: string;
      version?: string;
      description?: string;
    };
  };
  [key: string]: unknown;
}

/**
 * Parse pyproject.toml using smol-toml library
 * Handles full TOML spec including multiline strings, arrays, and nested tables
 */
function parsePyProjectToml(content: string): PyProjectToml {
  try {
    return parseToml(content);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log.warn(`Failed to parse TOML: ${errorMsg}`);
    // Return empty structure on parse failure
    return {};
  }
}

/**
 * Find the nearest parent pyproject.toml for a given file
 */
export function findNearestPyProject(
  filePath: string,
  pyprojects: PyProjectInfo[],
): PyProjectInfo | null {
  // Sort pyprojects by depth (deepest first)
  const sortedProjects = [...pyprojects].sort((a, b) => {
    const depthA = a.dir.split(sep).length;
    const depthB = b.dir.split(sep).length;
    return depthB - depthA;
  });

  // Find first pyproject whose directory is parent of file
  for (const proj of sortedProjects) {
    const rel = relative(proj.dir, filePath);
    if (!rel.startsWith('..') && !rel.startsWith(sep)) {
      return proj;
    }
  }

  return null;
}
