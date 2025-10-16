/**
 * Dynamic ESM module loader
 *
 * @module core/module-loader
 * @description
 * Provides utilities for dynamically loading ESM modules at runtime.
 * Handles module resolution, path normalization, and import() invocation.
 *
 * Supports:
 * - Relative paths (resolved from CLI directory)
 * - Absolute paths
 * - Home directory paths (~)
 * - Extension probing (.ts, .js)
 * - Directory index files (index.ts, index.js)
 *
 * @example
 * ```typescript
 * // Load an extractor module
 * const { module } = await loadModuleFromPath<ArchletteExtractor>(
 *   'extractors/builtin/basic-node'
 * );
 *
 * // module.default is the extractor function
 * const ir = await module.default(node);
 * ```
 */

import { resolveModuleEntry, getCliDir, toFileUrl } from './path-resolver.js';

/**
 * Result of loading a module
 *
 * @template T - Type of the loaded module
 */
export interface LoadedModule<T = unknown> {
  /** file:// URL used for import() */
  url: string;
  /** Normalized filesystem path */
  path: string;
  /** The imported module object */
  module: T;
}

/**
 * Dynamically load an ESM module from a path or module specifier
 *
 * @template T - Expected type of the module exports
 * @param spec - Module specifier (relative path, absolute path, or ~/ path)
 * @param exts - File extensions to probe (in order of preference)
 * @returns Promise resolving to loaded module with metadata
 * @throws {Error} When module cannot be found or loaded
 *
 * @example
 * ```typescript
 * // Load with default extensions (.ts, .js)
 * const result = await loadModuleFromPath('utils/helper');
 *
 * // Load with specific extensions
 * const result = await loadModuleFromPath('config', ['.json', '.js']);
 * ```
 */
export async function loadModuleFromPath<T = unknown>(
  spec: string,
  exts: ('.ts' | '.js')[] = ['.ts', '.js'],
): Promise<LoadedModule<T>> {
  const cliDir = getCliDir();
  const resolvedPath = resolveModuleEntry(spec, { cliDir, wantedExts: exts });
  const url = toFileUrl(resolvedPath);

  // Dynamic ESM import from a file URL
  const module = (await import(url)) as T;
  return { url, path: resolvedPath, module };
}
