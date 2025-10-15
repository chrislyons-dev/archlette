/**
 * Archlette IR Types + Zod Schemas
 * --------------------------------
 * This file defines both the TypeScript types and corresponding Zod schemas
 * for runtime validation and inference.
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
  type: z.string(),
  async: z.boolean().optional(),
  optional: z.boolean().optional(),
  visibility: z.string().optional(),
  stereotype: z.string().optional(),
});
export type Parameter = z.infer<typeof zParameter>;

export const zCodeItem = zWithMeta.extend({
  id: z.string(),
  componentId: z.string(),
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
  returnType: z.string().optional(),
  parameters: z.array(zParameter).optional(),
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

export const zDeployment = zWithMeta.extend({
  name: z.string(),
  nodes: z.array(zDeploymentNode).optional(),
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
});

export type ArchletteIR = z.infer<typeof zArchletteIR>;
