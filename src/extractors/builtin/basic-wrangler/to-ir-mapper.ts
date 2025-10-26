/**
 * @module basic_wrangler
 * Map parsed Wrangler configurations to ArchletteIR format
 */

import type {
  ArchletteIR,
  System,
  ContainerInstance,
  Relationship,
} from '../../../core/types-ir.js';
import type { WranglerConfig } from './types.js';
import { IR_VERSION, sanitizeId } from '../../../core/constants.js';
import { getEnvironments, getEnvironmentConfig } from './wrangler-parser.js';

/**
 * Map wrangler configurations to ArchletteIR
 *
 * This creates:
 * - Containers: One per wrangler.toml file
 * - Deployments: One per environment (production, dev, preview, etc.)
 * - Container Instances: One per container per environment
 * - Container Relationships: Logical dependencies from service bindings
 * - Deployment Relationships: Physical instance-to-instance connections
 *
 * @param configs - Parsed wrangler.toml configurations
 * @param systemInfo - Optional system-level metadata
 * @returns Complete ArchletteIR
 */
export function mapToIR(configs: WranglerConfig[], systemInfo?: System): ArchletteIR {
  // Step 1: Extract containers from configs (one per wrangler.toml)
  const containers = extractContainers(configs);

  // Step 2: Collect all unique environments across all configs
  const allEnvironments = new Set<string>();
  configs.forEach((config) => {
    getEnvironments(config).forEach((env) => allEnvironments.add(env));
  });
  const environments = Array.from(allEnvironments);

  // Step 3-4: Create deployments and container instances per environment
  const { deployments, instances } = extractDeploymentsAndInstances(
    configs,
    environments,
  );

  // Step 5: Extract service bindings and create container relationships (deduplicated)
  const containerRelationships = extractContainerRelationships(configs);

  // Step 6: Extract deployment relationships from container instances
  const deploymentRelationships = extractDeploymentRelationships(instances);

  return {
    version: IR_VERSION,
    system: systemInfo || { name: 'Unknown System' },
    actors: [],
    containers,
    components: [],
    code: [],
    deployments,
    containerRelationships,
    componentRelationships: [],
    codeRelationships: [],
    deploymentRelationships,
  };
}

/**
 * Extract containers from wrangler configurations
 *
 * Creates one container per wrangler.toml file.
 * Each container represents a Cloudflare Worker (if main exists) or other Cloudflare service.
 *
 * @param configs - Parsed wrangler configurations
 * @returns Array of Container objects
 */
function extractContainers(configs: WranglerConfig[]) {
  return configs.map((config) => {
    // Derive type from configuration structure
    const type = deriveContainerType(config);

    // Use @description if available, otherwise create default
    const description = config.description || `${type}: ${config.name}`;

    return {
      id: sanitizeId(config.name),
      name: config.name,
      type,
      layer: 'Application',
      description,
      tags: ['cloudflare', 'worker'],
      props: {
        technology: 'Cloudflare Workers',
        filePath: config.filePath,
      },
    };
  });
}

/**
 * Derive container type from wrangler configuration
 *
 * Logic:
 * - If 'main' field exists → Cloudflare Worker
 * - Otherwise → Cloudflare Service (generic)
 *
 * @param config - Wrangler configuration
 * @returns Container type string
 */
function deriveContainerType(config: WranglerConfig): string {
  // Presence of 'main' indicates a Worker
  if (config.main) {
    return 'Cloudflare Worker';
  }

  // Future: Could detect Pages, Durable Objects, etc.
  return 'Cloudflare Worker';
}

/**
 * Extract deployments and container instances
 *
 * Creates:
 * - One deployment per environment
 * - Container instances for each container in each environment
 *
 * @param configs - Parsed wrangler configurations
 * @param environments - Unique environment names
 * @returns Deployments and container instances
 */
function extractDeploymentsAndInstances(
  configs: WranglerConfig[],
  environments: string[],
) {
  const deployments = environments.map((envName) => ({
    name: envName,
    environment: envName,
    platform: 'Cloudflare Workers',
    instances: [] as ContainerInstance[], // Will be populated separately
  }));

  // Create container instances for each container in each environment
  const allInstances: ContainerInstance[] = [];

  configs.forEach((config) => {
    const configEnvironments = getEnvironments(config);

    configEnvironments.forEach((envName) => {
      // Get environment-specific configuration
      const envConfig = getEnvironmentConfig(config, envName);

      // Create instance ID: environment__service-name
      const instanceId = sanitizeId(`${envName}__${config.name}`);

      // Convert bindings to the IR Binding format
      const bindings = [];

      // Service bindings
      if (envConfig.services) {
        bindings.push(
          ...envConfig.services.map((svc) => ({
            type: 'service',
            binding: svc.binding,
            service: svc.service,
            environment: svc.environment,
          })),
        );
      }

      // KV bindings
      if (envConfig.kv_namespaces) {
        bindings.push(
          ...envConfig.kv_namespaces.map((kv) => ({
            type: 'kv',
            binding: kv.binding,
            namespace: kv.id,
          })),
        );
      }

      // R2 bindings
      if (envConfig.r2_buckets) {
        bindings.push(
          ...envConfig.r2_buckets.map((r2) => ({
            type: 'r2',
            binding: r2.binding,
            bucket: r2.bucket_name,
          })),
        );
      }

      // D1 bindings
      if (envConfig.d1_databases) {
        bindings.push(
          ...envConfig.d1_databases.map((d1) => ({
            type: 'd1',
            binding: d1.binding,
            database: d1.database_name,
          })),
        );
      }

      // Durable Object bindings
      if (envConfig.durable_objects?.bindings) {
        bindings.push(
          ...envConfig.durable_objects.bindings.map((dobj) => ({
            type: 'durable_object',
            binding: dobj.binding,
            className: dobj.class_name,
            scriptName: dobj.script_name,
          })),
        );
      }

      // Queue producer bindings
      if (envConfig.queues?.producers) {
        bindings.push(
          ...envConfig.queues.producers.map((queue) => ({
            type: 'queue_producer',
            binding: queue.binding,
            queue: queue.queue,
          })),
        );
      }

      // Queue consumer bindings
      if (envConfig.queues?.consumers) {
        bindings.push(
          ...envConfig.queues.consumers.map((queue) => ({
            type: 'queue_consumer',
            binding: queue.queue,
            queue: queue.queue,
          })),
        );
      }

      // Create container instance
      const instance: ContainerInstance = {
        id: instanceId,
        containerRef: sanitizeId(config.name),
        name: envConfig.name,
        type: 'Cloudflare Worker',
        bindings: bindings.length > 0 ? bindings : undefined,
        vars: envConfig.vars,
        routes: envConfig.routes,
        triggers: envConfig.triggers?.crons
          ? envConfig.triggers.crons.map((cron) => ({ type: 'cron', schedule: cron }))
          : undefined,
        observability: envConfig.observability,
      };

      allInstances.push(instance);
    });
  });

  // Assign instances to their respective deployments
  deployments.forEach((deployment) => {
    deployment.instances = allInstances.filter((inst) =>
      inst.id.startsWith(`${deployment.environment}__`),
    );
  });

  return { deployments, instances: allInstances };
}

/**
 * Extract container relationships from service bindings
 *
 * Creates logical dependencies between containers based on service bindings.
 * Deduplicates relationships across all environments.
 *
 * @param configs - Parsed wrangler configurations
 * @returns Array of container relationships
 */
function extractContainerRelationships(configs: WranglerConfig[]): Relationship[] {
  const relationships = new Map<string, Relationship>();

  configs.forEach((config) => {
    const sourceContainer = sanitizeId(config.name);

    // Collect service bindings from root-level config
    const serviceBindings = config.services || [];

    // Also collect from all environments
    if (config.env) {
      Object.values(config.env).forEach((envConfig) => {
        if (envConfig.services) {
          serviceBindings.push(...envConfig.services);
        }
      });
    }

    // Create relationships for each unique service binding
    serviceBindings.forEach((binding) => {
      const targetContainer = sanitizeId(binding.service);
      const relationshipKey = `${sourceContainer}__${targetContainer}`;

      if (!relationships.has(relationshipKey)) {
        relationships.set(relationshipKey, {
          source: sourceContainer,
          destination: targetContainer,
          description: `Service binding: ${binding.binding}`,
          tags: ['service-binding'],
        });
      }
    });
  });

  return Array.from(relationships.values());
}

/**
 * Extract deployment relationships from container instances
 *
 * Creates physical instance-to-instance relationships based on service bindings.
 * Each relationship represents an actual runtime dependency in a specific environment.
 *
 * @param instances - Container instances
 * @returns Array of deployment relationships
 */
function extractDeploymentRelationships(
  instances: ContainerInstance[],
): Relationship[] {
  const relationships: Relationship[] = [];

  instances.forEach((instance) => {
    // Extract service bindings from this instance
    const serviceBindings = instance.bindings?.filter(
      (binding) => binding.type === 'service',
    );

    if (!serviceBindings || serviceBindings.length === 0) {
      return;
    }

    serviceBindings.forEach((binding) => {
      // Determine target instance ID
      // Format: environment__service-name
      const [sourceEnv, _sourceService] = instance.id.split('__');
      const targetService = binding.service;
      const targetEnv = binding.environment || sourceEnv; // Use binding's env or fallback to source env
      const targetInstanceId = sanitizeId(`${targetEnv}__${targetService}`);

      relationships.push({
        source: instance.id,
        destination: targetInstanceId,
        description: `Service binding: ${binding.binding}`,
        tags: ['service-binding', 'runtime'],
      });
    });
  });

  return relationships;
}
