/**
 * Dynamic ESM module loader
 *
 * @module core
 * @description
 * Provides utilities for dynamically loading ESM modules at runtime.
 * Handles module resolution, path normalization, and import() invocation
 * with built-in security validation.
 *
 * Supports:
 * - Relative paths (resolved from CLI directory - built-in plugins)
 * - Absolute paths (with security validation)
 * - Home directory paths (~/.archlette/mods is default for user plugins)
 * - Extension probing (.ts, .js)
 * - Directory index files (index.ts, index.js)
 *
 * Security:
 * - Built-in plugins (under CLI directory) are always allowed
 * - User plugins default to ~/.archlette/mods (automatically allowed)
 * - Additional external plugin paths require explicit allowlist
 * - Path traversal attacks are prevented
 *
 * @example
 * ```typescript
 * // Load a built-in extractor module
 * const { module } = await loadModuleFromPath<ArchletteExtractor>(
 *   'extractors/builtin/basic-node'
 * );
 *
 * // Load a user plugin from ~/.archlette/mods/my-extractor
 * const { module } = await loadModuleFromPath<ArchletteExtractor>(
 *   '~/.archlette/mods/my-extractor'
 * );
 *
 * // Load an external plugin with custom allowlist
 * const { module } = await loadModuleFromPath<ArchletteExtractor>(
 *   '/custom/plugins/my-extractor',
 *   ['.ts', '.js'],
 *   ['/custom/plugins']
 * );
 * ```
 */

import {
  resolveModuleEntry,
  getCliDir,
  toFileUrl,
  expandTilde,
} from './path-resolver.js';
import { resolvePluginPath } from './path-security.js';
import { createLogger } from './logger.js';

const log = createLogger({ context: 'ModuleLoader' });

/**
 * Default base directory for user plugins: ~/.archlette/mods
 * This provides a standard location for external plugins and custom modules
 */
function getDefaultUserPluginDir(): string {
  try {
    return expandTilde('~/.archlette/mods');
  } catch {
    log.warn(
      'Could not resolve ~/.archlette/mods directory, falling back to empty allowlist',
    );
    return '';
  }
}

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
 * Dynamically load an ESM module from a path or module specifier with security validation
 *
 * @template T - Expected type of the module exports
 * @param spec - Module specifier (relative path, absolute path, or ~/ path)
 * @param exts - File extensions to probe (in order of preference)
 * @param allowedAbsolutePaths - Optional allowlist for absolute plugin paths (external plugins)
 *                                Defaults to [~/.archlette/mods] for user plugins
 * @returns Promise resolving to loaded module with metadata
 * @throws {Error} When module cannot be found, loaded, or fails security validation
 *
 * @example
 * ```typescript
 * // Load built-in plugin (relative to CLI dir)
 * const result = await loadModuleFromPath('extractors/builtin/basic-node');
 *
 * // Load user plugin from default ~/.archlette/mods directory
 * const result = await loadModuleFromPath('~/.archlette/mods/my-extractor');
 *
 * // Load external plugin with custom allowlist
 * const result = await loadModuleFromPath(
 *   '/custom/plugins/my-extractor',
 *   ['.ts', '.js'],
 *   ['/custom/plugins']
 * );
 * ```
 */
export async function loadModuleFromPath<T = unknown>(
  spec: string,
  exts: ('.ts' | '.js')[] = ['.ts', '.js'],
  allowedAbsolutePaths?: string[],
): Promise<LoadedModule<T>> {
  const cliDir = getCliDir();

  // Build default allowlist: ~/.archlette/mods + user-provided paths
  const defaultUserDir = getDefaultUserPluginDir();
  const fullAllowlist = allowedAbsolutePaths ? [...allowedAbsolutePaths] : [];

  // Add default user plugin directory if it's not empty and not already in list
  if (defaultUserDir && !fullAllowlist.some((p) => p === defaultUserDir)) {
    fullAllowlist.push(defaultUserDir);
  }

  // First resolve the module path using standard logic
  const resolvedPath = resolveModuleEntry(spec, { cliDir, wantedExts: exts });

  // Validate resolved path for security using path-security module
  // This prevents path traversal and validates external plugins
  try {
    const secureResult = resolvePluginPath(spec, cliDir, undefined, fullAllowlist);

    // Log security warnings if any
    if (secureResult.warnings.length > 0) {
      log.warn(
        `Security warnings for plugin '${spec}':\n` +
          secureResult.warnings.map((w) => `  - ${w}`).join('\n'),
      );
    }

    // Verify the resolved path matches our security-validated path
    // (with normalization for path comparison)
    const normalizedResolved = resolvedPath.replace(/\\/g, '/').toLowerCase();
    const normalizedSecure = secureResult.absolutePath
      .replace(/\\/g, '/')
      .toLowerCase();

    // Allow if paths match, or if resolved path is a more specific version
    // (e.g., with .ts extension added, or /index.ts added)
    if (
      !normalizedResolved.startsWith(normalizedSecure) &&
      normalizedResolved !== normalizedSecure
    ) {
      throw new Error(
        `Security validation mismatch: resolved path "${resolvedPath}" ` +
          `does not match validated path "${secureResult.absolutePath}"`,
      );
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to load module '${spec}' due to security validation failure:\n${errorMsg}\n\n` +
        `Hint: User plugins should be placed in ~/.archlette/mods/\n` +
        `Built-in plugins use relative paths like 'extractors/builtin/basic-node'.\n` +
        `External plugins in other locations require explicit allowlist.`,
    );
  }

  log.debug(`Loading module from validated path: ${resolvedPath}`);

  const url = toFileUrl(resolvedPath);

  // Dynamic ESM import from a file URL
  const module = (await import(url)) as T;
  return { url, path: resolvedPath, module };
}
