/**
 * @module basic-python
 * File discovery utilities for Python projects
 */

import { globby } from 'globby';
import { sep, relative, dirname } from 'node:path';
import { readFile } from 'node:fs/promises';
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
 * Simple TOML parser for pyproject.toml
 * Only handles the subset we need: [project] and [tool.poetry] sections
 */
function parsePyProjectToml(content: string): PyProjectToml {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {};
  let currentSection: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentObject: Record<string, any> = result;

  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Section header like [project] or [tool.poetry]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const section = trimmed.slice(1, -1);
      currentSection = section.split('.');
      currentObject = result;

      // Navigate/create nested objects
      for (const key of currentSection) {
        if (!currentObject[key]) {
          currentObject[key] = {};
        }
        currentObject = currentObject[key];
      }
      continue;
    }

    // Key-value pair
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();

      // Remove quotes from string values
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      currentObject[key] = value;
    }
  }

  return result;
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
