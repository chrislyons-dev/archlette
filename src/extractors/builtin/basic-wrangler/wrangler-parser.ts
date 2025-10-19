/**
 * Parser for wrangler.toml configuration files
 */

import { readFileSync } from 'node:fs';
import { parse as parseToml } from 'smol-toml';
import type {
  WranglerConfig,
  ServiceBinding,
  KVBinding,
  R2Binding,
  D1Binding,
  DurableObjectBinding,
  QueueBinding,
} from './types.js';

/**
 * Parse a wrangler.toml file
 *
 * @param filePath - Absolute path to wrangler.toml file
 * @returns Parsed wrangler configuration
 */
export async function parseWranglerFile(filePath: string): Promise<WranglerConfig> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = parseToml(content) as any;

    // Build WranglerConfig
    const config: WranglerConfig = {
      filePath,
      name: parsed.name || 'unknown',
      main: parsed.main,
      compatibility_date: parsed.compatibility_date,

      // Root-level configuration (typically production)
      vars: parsed.vars,
      services: normalizeServiceBindings(parsed.services),
      kv_namespaces: parsed.kv_namespaces as KVBinding[] | undefined,
      r2_buckets: parsed.r2_buckets as R2Binding[] | undefined,
      d1_databases: parsed.d1_databases as D1Binding[] | undefined,
      durable_objects: parsed.durable_objects,
      queues: parsed.queues,
      routes: parsed.routes,
      triggers: parsed.triggers,
      observability: parsed.observability,

      // Named environments
      env: parsed.env,
    };

    return config;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
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
export function normalizeServiceBindings(services: any): ServiceBinding[] | undefined {
  if (!services) return undefined;
  if (!Array.isArray(services)) return undefined;

  return services.map((binding: any) => ({
    binding: binding.binding,
    service: binding.service,
    environment: binding.environment,
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
  observability?: any;
} {
  // Start with root-level config
  const merged: any = {
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
