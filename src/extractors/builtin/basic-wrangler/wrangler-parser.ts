/**
 * @module basic_wrangler
 * Parser for wrangler.toml configuration files
 */

import { readFileSync } from 'node:fs';
import { parse as parseToml } from 'smol-toml';
import { createLogger } from '../../../core/logger.js';
import type {
  WranglerConfig,
  ServiceBinding,
  KVBinding,
  R2Binding,
  D1Binding,
  DurableObjectBinding,
  QueueBinding,
} from './types.js';

const log = createLogger({ context: 'WranglerParser' });

/**
 * Parse a wrangler.toml file
 *
 * @param filePath - Absolute path to wrangler.toml file
 * @returns Parsed wrangler configuration
 */
export async function parseWranglerFile(filePath: string): Promise<WranglerConfig> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    // TOML parser returns unknown structure - we validate at runtime
    const parsed = parseToml(content) as Record<string, unknown>;

    // Build WranglerConfig with runtime type validation
    const config: WranglerConfig = {
      filePath,
      name: (typeof parsed.name === 'string' ? parsed.name : undefined) || 'unknown',
      main: typeof parsed.main === 'string' ? parsed.main : undefined,
      compatibility_date:
        typeof parsed.compatibility_date === 'string'
          ? parsed.compatibility_date
          : undefined,

      // Root-level configuration (typically production)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vars: parsed.vars as any,
      services: normalizeServiceBindings(parsed.services),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      kv_namespaces: parsed.kv_namespaces as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r2_buckets: parsed.r2_buckets as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      d1_databases: parsed.d1_databases as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      durable_objects: parsed.durable_objects as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queues: parsed.queues as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      routes: parsed.routes as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      triggers: parsed.triggers as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      observability: parsed.observability as any,

      // Named environments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      env: parsed.env as any,
    };

    return config;
  } catch (error) {
    log.error(`Error parsing ${filePath}:`, error);
    throw new Error(`Failed to parse wrangler.toml: ${filePath}`);
  }
}

/**
 * Normalize service bindings from various formats
 *
 * Wrangler supports multiple binding formats:
 * - [[services]] array (TOML array of tables)
 * - services = [{ binding = "...", service = "..." }]
 */
export function normalizeServiceBindings(
  services: unknown,
): ServiceBinding[] | undefined {
  if (!services) return undefined;
  if (!Array.isArray(services)) return undefined;

  return services.map((binding: Record<string, unknown>) => ({
    binding: typeof binding.binding === 'string' ? binding.binding : '',
    service: typeof binding.service === 'string' ? binding.service : '',
    environment:
      typeof binding.environment === 'string' ? binding.environment : undefined,
  }));
}

/**
 * Get all environments from a wrangler config
 *
 * Returns a list of environment names, including:
 * - "production" (from root-level config if it has deployable content)
 * - All keys from env.* sections
 */
export function getEnvironments(config: WranglerConfig): string[] {
  const environments: string[] = [];

  // Check if root level has deployable content (treat as production)
  // Root is production if it has services, vars, or other bindings
  const hasRootConfig =
    config.services ||
    config.vars ||
    config.kv_namespaces ||
    config.r2_buckets ||
    config.d1_databases ||
    config.routes;

  if (hasRootConfig) {
    // Check if there's an explicit env.production
    const hasExplicitProd = config.env && 'production' in config.env;

    if (!hasExplicitProd) {
      // Root level is production
      environments.push('production');
    }
  }

  // Add all named environments from env.*
  if (config.env) {
    environments.push(...Object.keys(config.env));
  }

  return environments;
}

/**
 * Get configuration for a specific environment
 *
 * Merges root-level config with environment-specific overrides.
 * Environment config takes precedence.
 *
 * @param config - Parsed wrangler config
 * @param envName - Environment name (e.g., "production", "development")
 * @returns Merged environment configuration
 */
export function getEnvironmentConfig(
  config: WranglerConfig,
  envName: string,
): {
  name: string;
  vars?: Record<string, string>;
  services?: ServiceBinding[];
  kv_namespaces?: KVBinding[];
  r2_buckets?: R2Binding[];
  d1_databases?: D1Binding[];
  durable_objects?: { bindings: DurableObjectBinding[] };
  queues?: { producers?: QueueBinding[]; consumers?: QueueBinding[] };
  routes?: string[];
  triggers?: { crons?: string[] };
  observability?: Record<string, unknown>;
} {
  // Start with root-level config
  const merged: {
    name: string;
    vars?: Record<string, string>;
    services?: ServiceBinding[];
    kv_namespaces?: KVBinding[];
    r2_buckets?: R2Binding[];
    d1_databases?: D1Binding[];
    durable_objects?: { bindings: DurableObjectBinding[] };
    queues?: { producers?: QueueBinding[]; consumers?: QueueBinding[] };
    routes?: string[];
    triggers?: { crons?: string[] };
    observability?: Record<string, unknown>;
  } = {
    name: config.name,
    vars: { ...config.vars },
    services: config.services ? [...config.services] : undefined,
    kv_namespaces: config.kv_namespaces ? [...config.kv_namespaces] : undefined,
    r2_buckets: config.r2_buckets ? [...config.r2_buckets] : undefined,
    d1_databases: config.d1_databases ? [...config.d1_databases] : undefined,
    durable_objects: config.durable_objects ? { ...config.durable_objects } : undefined,
    queues: config.queues ? { ...config.queues } : undefined,
    routes: config.routes ? [...config.routes] : undefined,
    triggers: config.triggers ? { ...config.triggers } : undefined,
    observability: config.observability ? { ...config.observability } : undefined,
  };

  // Apply environment-specific overrides
  const envConfig = config.env?.[envName];
  if (envConfig) {
    // Name override
    if (envConfig.name) {
      merged.name = envConfig.name;
    }

    // Vars: merge root and env vars, env takes precedence
    if (envConfig.vars) {
      merged.vars = { ...merged.vars, ...envConfig.vars };
    }

    // Services: env services replace root services
    if (envConfig.services) {
      merged.services = normalizeServiceBindings(envConfig.services);
    }

    // Other bindings: env bindings replace root bindings
    if (envConfig.kv_namespaces) {
      merged.kv_namespaces = envConfig.kv_namespaces;
    }
    if (envConfig.r2_buckets) {
      merged.r2_buckets = envConfig.r2_buckets;
    }
    if (envConfig.d1_databases) {
      merged.d1_databases = envConfig.d1_databases;
    }
    if (envConfig.durable_objects) {
      merged.durable_objects = envConfig.durable_objects;
    }
    if (envConfig.queues) {
      merged.queues = envConfig.queues;
    }
    if (envConfig.routes) {
      merged.routes = envConfig.routes;
    }
    if (envConfig.triggers) {
      merged.triggers = envConfig.triggers;
    }
    if (envConfig.observability) {
      merged.observability = envConfig.observability;
    }
  }

  return merged;
}
