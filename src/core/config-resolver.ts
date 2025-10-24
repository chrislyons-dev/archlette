/**
 * @module core/config-resolver
 * @description
 * Configuration file resolution and loading.
 * Handles config path resolution, YAML parsing, and base directory determination.
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import * as yaml from 'yaml';
import { resolveArchlettePath, expandTilde, getCliDir } from './path-resolver.js';
import { resolveConfig, type ResolvedAACConfig } from './types-aac.js';
import { createLogger } from './logger.js';

const log = createLogger({ context: 'ConfigResolver' });

const DEFAULT_YAML_PATH = 'templates/default.yaml';

/**
 * Result of config file resolution
 */
export interface ResolvedConfigFile {
  /** Absolute path to resolved config file (or undefined if not found) */
  path: string | undefined;
  /** Whether file exists on filesystem */
  exists: boolean;
  /** Whether using default template from Archlette installation */
  isDefaultTemplate: boolean;
}

/**
 * Result of config loading with all metadata
 */
export interface LoadedConfig {
  /** Parsed and resolved configuration */
  config: ResolvedAACConfig;
  /** Base directory for resolving config-relative paths (themes, inputs, etc.) */
  baseDir: string;
  /** Path to config file (or undefined if using default/not found) */
  configPath: string | undefined;
  /** Path that was attempted (for logging purposes) */
  attemptedPath: string | undefined;
  /** Whether using default template */
  isDefaultTemplate: boolean;
}

/**
 * Resolve config file path from CLI arguments
 *
 * @param userProvidedPath - Path from -f argument (or undefined for default)
 * @returns Resolved config file information
 *
 * @example
 * ```typescript
 * // User didn't provide -f, use default
 * const resolved = resolveConfigFilePath();
 * // resolved.path = '/archlette/templates/default.yaml'
 * // resolved.isDefaultTemplate = true
 *
 * // User provided relative path
 * const resolved = resolveConfigFilePath('./archlette.config.yaml');
 * // resolved.path = '/project/archlette.config.yaml'
 * // resolved.isDefaultTemplate = false
 *
 * // User provided absolute or tilde path
 * const resolved = resolveConfigFilePath('~/archlette.config.yaml');
 * // resolved.path = '/home/user/archlette.config.yaml'
 * ```
 */
export function resolveConfigFilePath(userProvidedPath?: string): ResolvedConfigFile {
  const cliDir = getCliDir();

  if (!userProvidedPath) {
    // No -f argument: use default template from Archlette installation
    const defaultPath = resolveArchlettePath(DEFAULT_YAML_PATH, { cliDir });
    return {
      path: defaultPath,
      exists: fs.existsSync(defaultPath),
      isDefaultTemplate: true,
    };
  }

  // User provided -f: resolve from CWD with tilde expansion
  const expandedPath = expandTilde(userProvidedPath);
  const absolutePath = path.resolve(process.cwd(), expandedPath);

  return {
    path: absolutePath,
    exists: fs.existsSync(absolutePath),
    isDefaultTemplate: false,
  };
}

/**
 * Determine base directory for resolving config-relative paths
 *
 * Logic:
 * - If using default template: CWD (user's project directory)
 * - If user provided config file: config file's directory
 * - Fallback: CWD
 *
 * @param configPath - Absolute path to config file (or undefined)
 * @param isDefaultTemplate - Whether using default template
 * @returns Base directory for config-relative path resolution
 *
 * @example
 * ```typescript
 * // Using default template
 * const baseDir = resolveConfigBaseDir(undefined, true);
 * // Returns: process.cwd() - user's project directory
 *
 * // Using user config file
 * const baseDir = resolveConfigBaseDir('/project/config/archlette.yaml', false);
 * // Returns: '/project/config' - config file's directory
 * ```
 */
export function resolveConfigBaseDir(
  configPath: string | undefined,
  isDefaultTemplate: boolean,
): string {
  // Default template: use CWD (user's project directory)
  if (isDefaultTemplate) {
    return process.cwd();
  }

  // User config: use config file's directory
  if (configPath) {
    return path.dirname(configPath);
  }

  // Fallback: CWD
  return process.cwd();
}

/**
 * Load and parse YAML config file
 *
 * @param filePath - Absolute path to YAML file
 * @returns Parsed config object or null if file doesn't exist/is invalid
 */
function loadYamlFile(filePath: string): unknown | null {
  try {
    if (!fs.existsSync(filePath)) {
      log.debug(`Config file not found: ${filePath}`);
      return null;
    }

    const contents = fs.readFileSync(filePath, 'utf8');
    const parsed = yaml.parse(contents);
    return parsed;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    log.warn(`Failed to parse YAML config at ${filePath}: ${errorMsg}`);
    return null;
  }
}

/**
 * Create minimal default configuration when no config file is found
 *
 * @param baseDir - Base directory for output paths
 * @returns Default configuration
 */
function createDefaultConfig(baseDir: string): ResolvedAACConfig {
  return resolveConfig(
    {
      project: { name: 'archlette-project' },
      paths: {
        ir_out: './archlette-output/ir',
        dsl_out: './archlette-output/dsl',
        render_out: './archlette-output/render',
        docs_out: './archlette-output/docs',
      },
    },
    { configBaseDir: baseDir },
  );
}

/**
 * Load configuration from file path (high-level API)
 *
 * This is the main entry point for config loading. It handles:
 * 1. Config file path resolution (default vs user-provided)
 * 2. Base directory determination
 * 3. YAML parsing
 * 4. Config validation and resolution
 * 5. Fallback to default config
 *
 * @param userProvidedPath - Path from -f argument (or undefined for default)
 * @returns Loaded configuration with all metadata
 * @throws Never throws - returns default config on any failure
 *
 * @example
 * ```typescript
 * // Load default config
 * const loaded = await loadConfig();
 *
 * // Load user config
 * const loaded = await loadConfig('./archlette.config.yaml');
 *
 * // Use loaded config
 * const ctx: PipelineContext = {
 *   config: loaded.config,
 *   configBaseDir: loaded.baseDir,
 *   state: {},
 *   log: logger
 * };
 * ```
 */
export function loadConfig(userProvidedPath?: string): LoadedConfig {
  // Step 1: Resolve config file path
  const resolved = resolveConfigFilePath(userProvidedPath);

  log.debug(
    `Config file: ${resolved.path} (exists: ${resolved.exists}, default: ${resolved.isDefaultTemplate})`,
  );

  if (resolved.exists) {
    log.info(`Using config: ${resolved.path}`);
  } else if (!resolved.isDefaultTemplate) {
    log.warn(`Config file not found: ${resolved.path}, using default configuration`);
  }

  // Step 2: Determine base directory for config-relative paths
  const baseDir = resolveConfigBaseDir(resolved.path, resolved.isDefaultTemplate);

  log.debug(`Config base directory: ${baseDir}`);

  // Step 3: Load and parse YAML
  let config: ResolvedAACConfig;

  if (resolved.exists && resolved.path) {
    const parsed = loadYamlFile(resolved.path);

    if (parsed) {
      // Step 4: Resolve config with base directory
      config = resolveConfig(parsed, { configBaseDir: baseDir });
    } else {
      // Failed to parse - use default
      log.warn('Failed to parse config, using default configuration');
      config = createDefaultConfig(baseDir);
    }
  } else {
    // File doesn't exist - use default
    if (!resolved.isDefaultTemplate) {
      log.warn('No config file found, using default configuration');
    }
    config = createDefaultConfig(baseDir);
  }

  return {
    config,
    baseDir,
    configPath: resolved.exists ? resolved.path : undefined,
    attemptedPath: resolved.path, // Always include the path we tried (for logging)
    isDefaultTemplate: resolved.isDefaultTemplate,
  };
}
