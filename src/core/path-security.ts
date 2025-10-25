/**
 * @module core/path-security
 * @description
 * Secure path resolution and validation for user-provided paths.
 * Protects against path traversal attacks while allowing legitimate extensibility.
 */

import { relative, resolve, normalize, isAbsolute } from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { expandTilde } from './path-resolver.js';

/**
 * Path resolution strategy determines how to interpret user paths
 */
export type PathResolutionStrategy =
  | 'config-relative' // Relative to config file location (user content: themes, inputs)
  | 'cli-relative' // Relative to Archlette installation (plugins)
  | 'absolute-allowed' // Absolute paths explicitly allowed (advanced use)
  | 'restricted'; // Most restrictive: config dir only, no traversal

/**
 * Options for secure path resolution
 */
export interface SecurePathOptions {
  /** Base directory for resolution */
  baseDir: string;
  /** Resolution strategy to use */
  strategy: PathResolutionStrategy;
  /** Allowed file extensions (e.g., ['.dsl', '.yaml']) */
  allowedExtensions?: string[];
  /** Additional allowed directories for absolute paths */
  allowedAbsolutePaths?: string[];
  /** Whether to check file existence */
  mustExist?: boolean;
}

/**
 * Result of path resolution with security metadata
 */
export interface ResolvedSecurePath {
  /** Normalized absolute path */
  absolutePath: string;
  /** Path relative to base directory */
  relativePath: string;
  /** Whether path exists */
  exists: boolean;
  /** Whether path is a file or directory */
  type: 'file' | 'directory' | 'unknown';
  /** Security validation passed */
  isSecure: boolean;
  /** Warning messages (non-fatal) */
  warnings: string[];
}

/**
 * Validate path for security issues
 */
function validatePathSecurity(
  userPath: string,
  resolvedPath: string,
  baseDir: string,
  strategy: PathResolutionStrategy,
  allowedAbsolutePaths: string[] = [],
): { isSecure: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check for null bytes (security risk)
  if (userPath.includes('\0')) {
    return {
      isSecure: false,
      warnings: ['Path contains null bytes'],
    };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\.[/\\]/, // Directory traversal
    /[/\\]\.\.[/\\]/, // Directory traversal in middle
    /[/\\]\.\.$/, // Directory traversal at end
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userPath)) {
      warnings.push(`Path contains suspicious pattern: ${pattern.source}`);
    }
  }

  // Strategy-specific validation
  switch (strategy) {
    case 'restricted': {
      // Most restrictive: must stay within baseDir, no traversal
      const rel = relative(baseDir, resolvedPath);
      if (rel.startsWith('..') || isAbsolute(rel)) {
        return {
          isSecure: false,
          warnings: [
            `Path must be within project directory (restricted mode): ${resolvedPath}`,
          ],
        };
      }
      break;
    }

    case 'config-relative': {
      // Allow paths relative to config, tilde expansion, but validate absolute paths
      if (isAbsolute(userPath) && !userPath.startsWith('~')) {
        // Check if absolute path is in allowed list
        // Normalize both paths for comparison (handles forward/back slashes on Windows)
        const normalizedResolved = normalize(resolvedPath).toLowerCase();
        const isAllowed = allowedAbsolutePaths.some((allowed) => {
          const normalizedAllowed = normalize(allowed).toLowerCase();
          return normalizedResolved.startsWith(normalizedAllowed);
        });

        if (!isAllowed) {
          const allowList = allowedAbsolutePaths
            .map((allowed) => normalize(allowed))
            .join(', ');
          warnings.push(
            `Absolute path used without explicit allowlist: ${resolvedPath}. Allowed paths are: ${allowList}. Consider using relative paths.`,
          );
        }
        // If absolute path is allowed, don't warn about traversal
        // (traversal check is only relevant for relative paths)
      } else {
        // Only check traversal for relative paths
        const rel = relative(baseDir, resolvedPath);
        if (rel.startsWith('..')) {
          warnings.push('Path traverses outside config directory');
        }
      }
      break;
    }

    case 'cli-relative': {
      // For plugins: paths relative to Archlette installation
      // Absolute paths for external plugins must be explicitly allowed
      if (isAbsolute(userPath)) {
        // Normalize both paths for comparison (handles forward/back slashes on Windows)
        const normalizedResolved = normalize(resolvedPath).toLowerCase();
        const isAllowed = allowedAbsolutePaths.some((allowed) => {
          const normalizedAllowed = normalize(allowed).toLowerCase();
          return normalizedResolved.startsWith(normalizedAllowed);
        });

        if (!isAllowed) {
          return {
            isSecure: false,
            warnings: ['Absolute plugin paths must be in allowed directories'],
          };
        }
      }
      break;
    }

    case 'absolute-allowed': {
      // Most permissive: allow absolute paths, but still validate
      // This is for advanced users who know what they're doing
      if (warnings.length > 0) {
        warnings.push('Using absolute-allowed strategy - ensure paths are trusted');
      }
      break;
    }
  }

  return {
    isSecure: true,
    warnings,
  };
}

/**
 * Securely resolve a user-provided path with validation
 *
 * @param userPath - Path provided by user (from config, CLI, etc.)
 * @param options - Resolution and validation options
 * @returns Resolved path with security metadata
 * @throws Error if path is invalid or fails security validation
 *
 * @example
 * ```typescript
 * // Theme file (config-relative)
 * const theme = resolveSecurePath('./themes/corporate.dsl', {
 *   baseDir: '/project/dir',
 *   strategy: 'config-relative',
 *   allowedExtensions: ['.dsl']
 * });
 *
 * // Plugin (cli-relative)
 * const plugin = resolveSecurePath('./custom/extractors/terraform', {
 *   baseDir: '/archlette/install/dir',
 *   strategy: 'cli-relative'
 * });
 *
 * // Explicit absolute (advanced)
 * const shared = resolveSecurePath('/shared/themes/theme.dsl', {
 *   baseDir: '/project/dir',
 *   strategy: 'absolute-allowed',
 *   allowedAbsolutePaths: ['/shared/themes']
 * });
 * ```
 */
export function resolveSecurePath(
  userPath: string,
  options: SecurePathOptions,
): ResolvedSecurePath {
  const {
    baseDir,
    strategy,
    allowedExtensions,
    allowedAbsolutePaths = [],
    mustExist,
  } = options;

  // Handle tilde expansion BEFORE normalization to preserve ~/ pattern
  // (normalize() on Windows converts ~/path to ~\path which breaks tilde detection)
  let pathToResolve = userPath;
  if (userPath.startsWith('~')) {
    pathToResolve = expandTilde(userPath);
  }

  // Normalize after tilde expansion for security validation
  const normalizedInput = normalize(userPath);

  // Resolve path
  let absolutePath: string;
  if (isAbsolute(pathToResolve)) {
    absolutePath = normalize(pathToResolve);
  } else {
    absolutePath = resolve(baseDir, pathToResolve);
  }

  // Validate security
  const { isSecure, warnings } = validatePathSecurity(
    normalizedInput,
    absolutePath,
    baseDir,
    strategy,
    allowedAbsolutePaths,
  );

  if (!isSecure) {
    throw new Error(
      `Path validation failed: ${userPath}\nReasons:\n${warnings.map((w) => `  - ${w}`).join('\n')}`,
    );
  }

  // Check existence if required
  const exists = existsSync(absolutePath);
  if (mustExist && !exists) {
    throw new Error(`Path does not exist: ${absolutePath}`);
  }

  // Determine type
  let type: 'file' | 'directory' | 'unknown' = 'unknown';
  if (exists) {
    const stats = statSync(absolutePath);
    type = stats.isFile() ? 'file' : stats.isDirectory() ? 'directory' : 'unknown';
  }

  // Validate extension if required
  if (allowedExtensions && allowedExtensions.length > 0 && type === 'file') {
    const hasValidExtension = allowedExtensions.some((ext) =>
      absolutePath.endsWith(ext),
    );
    if (!hasValidExtension) {
      throw new Error(
        `File must have one of these extensions: ${allowedExtensions.join(', ')}\nReceived: ${absolutePath}`,
      );
    }
  }

  const relativePath = relative(baseDir, absolutePath);

  return {
    absolutePath,
    relativePath,
    exists,
    type,
    isSecure,
    warnings,
  };
}

/**
 * Convenience function for resolving user content paths (themes, input files)
 * Uses 'config-relative' strategy by default
 */
export function resolveUserContentPath(
  userPath: string,
  configBaseDir: string,
  allowedExtensions?: string[],
  allowedAbsolutePaths?: string[],
): ResolvedSecurePath {
  return resolveSecurePath(userPath, {
    baseDir: configBaseDir,
    strategy: 'config-relative',
    allowedExtensions,
    allowedAbsolutePaths,
    mustExist: false,
  });
}

/**
 * Convenience function for resolving plugin paths
 * Uses 'cli-relative' strategy by default
 */
export function resolvePluginPath(
  userPath: string,
  cliDir: string,
  allowedExtensions?: string[],
  allowedAbsolutePaths?: string[],
): ResolvedSecurePath {
  return resolveSecurePath(userPath, {
    baseDir: cliDir,
    strategy: 'cli-relative',
    allowedExtensions,
    allowedAbsolutePaths,
    mustExist: false,
  });
}
