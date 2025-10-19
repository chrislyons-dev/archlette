/**
 * Archlette Intermediate Representation (IR) types and schemas
 *
 * @module core
 * @description
 * Defines the ArchletteIR format - a language-agnostic representation of software
 * architecture. This IR serves as the canonical format that all extractors produce
 * and all generators consume.
 *
 * The IR models C4 architecture elements:
 * - **System**: The overall software system being documented
 * - **Actors**: External users or systems that interact with the system
 * - **Containers**: Deployable units (microservices, SPAs, databases)
 * - **Components**: Logical groupings of code within containers
 * - **Code**: Individual classes, functions, methods, interfaces
 * - **Deployments**: Infrastructure and deployment topology
 * - **Relationships**: Dependencies and interactions between elements
 *
 * Each element is defined with both a Zod schema (for runtime validation) and
 * a TypeScript type (inferred from the schema for type safety).
 *
 * @example
 * ```typescript
 * import { zArchletteIR, type ArchletteIR } from './types-ir';
 *
 * // Validate IR at runtime
 * const result = zArchletteIR.safeParse(data);
 * if (result.success) {
 *   const ir: ArchletteIR = result.data;
 * }
 * ```
 */

import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/*  Base building blocks                                                      */
/* -------------------------------------------------------------------------- */

export const zProps = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);
export type Props = z.infer<typeof zProps>;

export const zWithMeta = z.object({
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  props: zProps.optional(),
});
export type WithMeta = z.infer<typeof zWithMeta>;

/* -------------------------------------------------------------------------- */
/*  Core entities                                                             */
/* -------------------------------------------------------------------------- */

export const zSystem = zWithMeta.extend({
  name: z.string(),
  description: z.string().optional(),
  repository: z.string().optional(),
  tags: z.array(z.string()).optional(),
  props: zProps.optional(),
});
export type System = z.infer<typeof zSystem>;

export const zActor = zWithMeta.extend({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  relationshipStereotypes: z.array(z.object({ name: z.string() })).optional(),
  targets: z.array(z.string()).optional(),
});
export type Actor = z.infer<typeof zActor>;

export const zContainer = zWithMeta.extend({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  layer: z.string(),
});
export type Container = z.infer<typeof zContainer>;

export const zComponent = zWithMeta.extend({
  id: z.string(),
  containerId: z.string(),
  name: z.string(),
  type: z.string(),
});
export type Component = z.infer<typeof zComponent>;

export const zParameter = z.object({
  name: z.string(),
  type: z.string().optional(),
  description: z.string().optional(),
  async: z.boolean().optional(),
  optional: z.boolean().optional(),
  defaultValue: z.string().optional(),
  visibility: z.string().optional(),
  stereotype: z.string().optional(),
});
export type Parameter = z.infer<typeof zParameter>;

// Language-agnostic documentation structure
export const zDocumentation = z.object({
  summary: z.string().optional(),
  details: z.string().optional(),
  examples: z.array(z.string()).optional(),
  remarks: z.array(z.string()).optional(),
  seeAlso: z.array(z.string()).optional(),
});
export type Documentation = z.infer<typeof zDocumentation>;

// Deprecation info
export const zDeprecation = z.object({
  reason: z.string().optional(),
  alternative: z.string().optional(),
});
export type Deprecation = z.infer<typeof zDeprecation>;

export const zCodeItem = zWithMeta.extend({
  id: z.string(),
  componentId: z.string().optional(), // Optional since containers come from IaC extractors
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  documentation: zDocumentation.optional(),
  deprecated: zDeprecation.optional(),
  returnType: z.string().optional(),
  returnDescription: z.string().optional(),
  parameters: z.array(zParameter).optional(),
  visibility: z.enum(['public', 'private', 'protected', 'internal']).optional(),
  isAsync: z.boolean().optional(),
  isStatic: z.boolean().optional(),
  isAbstract: z.boolean().optional(),
  isReadonly: z.boolean().optional(),
  filePath: z.string().optional(),
  lineNumber: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(), // Language-specific metadata
});
export type CodeItem = z.infer<typeof zCodeItem>;

/* -------------------------------------------------------------------------- */
/*  Deployments                                                               */
/* -------------------------------------------------------------------------- */

export const zDeploymentNode = zWithMeta.extend({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  technology: z.string().optional(),
  containers: z
    .array(
      z.object({
        id: z.string(),
      }),
    )
    .optional(),
});
export type DeploymentNode = z.infer<typeof zDeploymentNode>;

// Binding schema for service bindings, KV, R2, D1, Durable Objects, etc.
export const zBinding = z.object({
  type: z.string(), // "service", "kv", "r2", "d1", "durable_object", "queue", etc.
  binding: z.string(), // Variable name used in code (e.g., "SVC_DAYCOUNT")
  service: z.string().optional(), // Service name for service bindings
  environment: z.string().optional(), // Target environment for service bindings
  namespace: z.string().optional(), // KV namespace
  bucket: z.string().optional(), // R2 bucket
  database: z.string().optional(), // D1 database
  className: z.string().optional(), // Durable Object class name
  scriptName: z.string().optional(), // Durable Object script name
  queueName: z.string().optional(), // Queue name
  metadata: z.record(z.string(), z.unknown()).optional(), // Additional binding-specific data
});
export type Binding = z.infer<typeof zBinding>;

// Container Instance - represents a deployed instance in a specific environment
export const zContainerInstance = zWithMeta.extend({
  id: z.string(), // e.g., "production::gateway"
  containerRef: z.string(), // References Container.id
  name: z.string().optional(), // Instance-specific name override
  type: z.string().optional(), // e.g., "worker", "service"
  technology: z.string().optional(), // e.g., "TypeScript", "Rust"
  bindings: z.array(zBinding).optional(), // All bindings for this instance
  vars: z.record(z.string(), z.string()).optional(), // Environment variables (non-sensitive)
  routes: z.array(z.string()).optional(), // HTTP routes
  triggers: z.array(z.unknown()).optional(), // Cron schedules, etc.
  observability: z.unknown().optional(), // Observability configuration
});
export type ContainerInstance = z.infer<typeof zContainerInstance>;

// Enhanced Deployment with environment and instances
export const zDeployment = zWithMeta.extend({
  name: z.string(), // e.g., "production", "development"
  environment: z.string().optional(), // Environment name (defaults to name if not specified)
  platform: z.string().optional(), // e.g., "Cloudflare Edge", "AWS", "Azure"
  nodes: z.array(zDeploymentNode).optional(), // Legacy deployment nodes
  instances: z.array(zContainerInstance).optional(), // Container instances in this environment
});
export type Deployment = z.infer<typeof zDeployment>;

/* -------------------------------------------------------------------------- */
/*  Relationships                                                             */
/* -------------------------------------------------------------------------- */

export const zRelationship = zWithMeta.extend({
  source: z.string(),
  destination: z.string(),
  protocol: z.string().optional(),
  auth: z.string().optional(),
  stereotype: z.string().optional(),
});
export type Relationship = z.infer<typeof zRelationship>;

/* -------------------------------------------------------------------------- */
/*  Root IR                                                                   */
/* -------------------------------------------------------------------------- */

export const zArchletteIR = z.object({
  version: z.string(),
  system: zSystem,
  actors: z.array(zActor),
  containers: z.array(zContainer),
  components: z.array(zComponent),
  code: z.array(zCodeItem),
  deployments: z.array(zDeployment),
  containerRelationships: z.array(zRelationship),
  componentRelationships: z.array(zRelationship),
  codeRelationships: z.array(zRelationship),
  deploymentRelationships: z.array(zRelationship), // Instance-to-instance relationships
});

export type ArchletteIR = z.infer<typeof zArchletteIR>;
