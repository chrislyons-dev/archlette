/**
 * Architecture-as-Code (AAC) configuration types and schemas
 *
 * @module core
 * @description
 * Defines the schema for AAC YAML configuration files. These files configure
 * the entire AAC pipeline, specifying which extractors, validators, generators,
 * renderers, and documentation generators to run.
 *
 * The configuration uses a stage-based architecture:
 * 1. **Extractors**: Produce ArchletteIR from various sources (code, IaC, etc.)
 * 2. **Validators**: Validate and enrich IR
 * 3. **Generators**: Transform IR into DSL formats (Structurizr, PlantUML, etc.)
 * 4. **Renderers**: Convert DSL to visual diagrams
 * 5. **Docs**: Generate documentation from diagrams and IR
 *
 * Each stage consists of one or more modules that are loaded and executed in order.
 *
 * @example
 * ```yaml
 * # .aac.yaml
 * project:
 *   name: MyProject
 *
 * extractors:
 *   - use: builtin/basic-node
 *     inputs:
 *       include: ['src/**\/*.ts']
 *
 * generators:
 *   - use: builtin/structurizr
 * ```
 */

import { z } from 'zod';

/** ---------- Shared primitives ---------- */
const GlobArray = z.array(z.string()).default([]);

/**
 * Meta fields that can be merged into many schemas.
 * NOTE: Do NOT put `.default({})` on this object, because we `.merge(Meta)` elsewhere.
 */
const Meta = z.object({
  // Arbitrary name/value pairs on every node
  props: z.record(z.string(), z.unknown()).default({}),
});

/** ---------- Stage nodes & stages ---------- */

const StageNode = z
  .object({
    use: z.string().min(1),
    name: z.string().default(''),
    inputs: z.record(z.string(), z.unknown()).optional(),
    // Node-level includes/excludes override defaults if provided
    includes: GlobArray.optional(),
    excludes: GlobArray.optional(),
  })
  .merge(Meta);

/** ---------- Top-level config ---------- */

export const AACConfigSchema = z.object({
  project: z
    .object({
      name: z.string().min(1),
      description: z.string().optional(),
      repository: z.string().optional(),
    })
    .merge(Meta),

  // Optional system-level override for IR
  // If not provided, system info will be inferred from first container
  system: z
    .object({
      name: z.string().min(1),
      description: z.string().optional(),
      repository: z.string().optional(),
    })
    .optional(),

  paths: z.object({
    ir_out: z.string().min(1),
    dsl_out: z.string().min(1),
    render_out: z.string().min(1),
    docs_out: z.string().min(1),
  }),

  allowedPluginPaths: z.array(z.string()).optional(),
  allowedAbsolutePaths: z.array(z.string()).optional(),

  defaults: z
    .object({
      includes: GlobArray,
      excludes: GlobArray,
    })
    .merge(Meta)
    .default({
      includes: ['**/*'],
      excludes: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      props: {},
    }),

  // Pipeline stages as arrays of StageNode
  extractors: z.array(StageNode).default([]),
  validators: z.array(StageNode).default([]),
  generators: z.array(StageNode).default([]),
  renderers: z.array(StageNode).default([]),
  docs: z.array(StageNode).default([]),
});

export type AACConfig = z.infer<typeof AACConfigSchema>;

export type ResolvedStageNode = z.infer<typeof StageNode> & {
  _effective: {
    includes: string[];
    excludes: string[];
  };
  _system?: {
    name: string;
    description?: string;
    repository?: string;
  };
  /** Base directory for resolving config-relative paths (themes, inputs, etc.) */
  _configBaseDir?: string;
};

export type ResolvedAACConfig = Omit<
  AACConfig,
  'extractors' | 'validators' | 'generators' | 'renderers' | 'docs'
> & {
  extractors: ResolvedStageNode[];
  validators: ResolvedStageNode[];
  generators: ResolvedStageNode[];
  renderers: ResolvedStageNode[];
  docs: ResolvedStageNode[];
};

/**
 * For each stage, resolve includes/excludes for each node:
 *   - If node omits includes/excludes, inherit from defaults.
 *   - Add configBaseDir for resolving config-relative paths
 */
export function resolveConfig(
  raw: unknown,
  options?: { configBaseDir?: string },
): ResolvedAACConfig {
  const parsed = AACConfigSchema.parse(raw);

  const resolveStage = (nodes: z.infer<typeof StageNode>[]): ResolvedStageNode[] => {
    return nodes.map((n) => {
      const nodeIncludes =
        n.includes && n.includes.length > 0 ? n.includes : parsed.defaults.includes;
      const nodeExcludes =
        n.excludes && n.excludes.length > 0 ? n.excludes : parsed.defaults.excludes;
      return {
        ...n,
        _effective: {
          includes: nodeIncludes,
          excludes: nodeExcludes,
        },
        _system: parsed.system,
        _configBaseDir: options?.configBaseDir,
      };
    });
  };

  return {
    project: parsed.project,
    paths: parsed.paths,
    defaults: parsed.defaults,
    allowedPluginPaths: parsed.allowedPluginPaths,
    allowedAbsolutePaths: parsed.allowedAbsolutePaths,
    extractors: resolveStage(parsed.extractors),
    validators: resolveStage(parsed.validators),
    generators: resolveStage(parsed.generators),
    renderers: resolveStage(parsed.renderers),
    docs: resolveStage(parsed.docs),
  };
}
