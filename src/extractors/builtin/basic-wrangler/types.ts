/**
 * @module basic_wrangler
 * Type definitions for Wrangler configuration parsing
 */

/**
 * Parsed service binding from wrangler.toml
 */
export interface ServiceBinding {
  binding: string; // Variable name (e.g., "SVC_DAYCOUNT")
  service: string; // Service name (e.g., "bond-math-daycount")
  environment?: string; // Target environment
}

/**
 * Parsed KV namespace binding
 */
export interface KVBinding {
  binding: string;
  id: string;
  preview_id?: string;
}

/**
 * Parsed R2 bucket binding
 */
export interface R2Binding {
  binding: string;
  bucket_name: string;
  preview_bucket_name?: string;
}

/**
 * Parsed D1 database binding
 */
export interface D1Binding {
  binding: string;
  database_name: string;
  database_id: string;
  preview_database_id?: string;
}

/**
 * Parsed Durable Object binding
 */
export interface DurableObjectBinding {
  binding: string;
  class_name: string;
  script_name?: string;
}

/**
 * Parsed Queue binding
 */
export interface QueueBinding {
  binding: string;
  queue: string;
}

/**
 * All possible bindings
 */
export type AnyBinding =
  | ServiceBinding
  | KVBinding
  | R2Binding
  | D1Binding
  | DurableObjectBinding
  | QueueBinding;

/**
 * Parsed environment configuration from wrangler.toml
 */
export interface WranglerEnvironment {
  name?: string; // Environment-specific name override
  vars?: Record<string, string>; // Environment variables
  services?: ServiceBinding[]; // Service bindings
  kv_namespaces?: KVBinding[]; // KV namespace bindings
  r2_buckets?: R2Binding[]; // R2 bucket bindings
  d1_databases?: D1Binding[]; // D1 database bindings
  durable_objects?: { bindings: DurableObjectBinding[] }; // Durable Object bindings
  queues?: { producers?: QueueBinding[]; consumers?: QueueBinding[] }; // Queue bindings
  routes?: string[]; // HTTP routes
  triggers?: { crons?: string[] }; // Cron triggers
  observability?: Record<string, unknown>; // Observability config
}

/**
 * Parsed wrangler.toml file
 */
export interface WranglerConfig {
  filePath: string; // Path to wrangler.toml file
  name: string; // Worker/service name
  main?: string; // Entry point file path
  compatibility_date?: string;
  description?: string; // Extracted from @description comment tag

  // Root-level configuration (typically production)
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

  // Named environments
  env?: Record<string, WranglerEnvironment>;
}

/**
 * Extractor input configuration
 */
export interface ExtractorInputs {
  include?: string[]; // Glob patterns for wrangler.toml files
  exclude?: string[]; // Glob patterns to exclude
}
