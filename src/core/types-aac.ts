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
    // Node-level includes/excludes override stage-level if provided
    includes: GlobArray.optional(),
    excludes: GlobArray.optional(),
  })
  .merge(Meta);

const Stage = z
  .object({
    // Stage-level defaults (inherit from top-level defaults if empty)
    includes: GlobArray.default([]),
    excludes: GlobArray.default([]),
    nodes: z.array(StageNode).default([]),
  })
  // It's safe to default the Stage schema itself since we don't merge Stage into other objects
  .default({
    includes: [],
    excludes: [],
    nodes: [],
  });

/** ---------- Top-level config ---------- */
export const AACConfigSchema = z.object({
  project: z
    .object({
      name: z.string().min(1),
    })
    .merge(Meta),

  paths: z.object({
    ir_out: z.string().min(1),
    dsl_out: z.string().min(1),
    render_out: z.string().min(1),
    docs_out: z.string().min(1),
  }),

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

  // Pipeline stages
  extractors: Stage,
  validators: Stage,
  generators: Stage,
  renderers: Stage,
  docs: Stage,
});

export type AACConfig = z.infer<typeof AACConfigSchema>;

export type ResolvedStageNode = z.infer<typeof StageNode> & {
  _effective: {
    includes: string[];
    excludes: string[];
  };
};

export type ResolvedStage = {
  nodes: ResolvedStageNode[];
  includes: string[];
  excludes: string[];
};

export type ResolvedAACConfig = Omit<
  AACConfig,
  'extractors' | 'validators' | 'generators' | 'renderers' | 'docs'
> & {
  extractors: ResolvedStage;
  validators: ResolvedStage;
  generators: ResolvedStage;
  renderers: ResolvedStage;
  docs: ResolvedStage;
};

/**
 * Merge order for includes/excludes:
 *   defaults → stage → node
 * - If a stage omits includes/excludes (empty), inherit from `defaults`.
 * - If a node omits includes/excludes, inherit from stage (already resolved with defaults).
 */
export function resolveConfig(raw: unknown): ResolvedAACConfig {
  const parsed = AACConfigSchema.parse(raw);

  const resolveStage = (stage: z.infer<typeof Stage>): ResolvedStage => {
    const stageIncludes =
      stage.includes && stage.includes.length > 0
        ? stage.includes
        : parsed.defaults.includes;

    const stageExcludes =
      stage.excludes && stage.excludes.length > 0
        ? stage.excludes
        : parsed.defaults.excludes;

    const nodes: ResolvedStageNode[] = stage.nodes.map((n) => {
      const nodeIncludes =
        n.includes && n.includes.length > 0 ? n.includes : stageIncludes;
      const nodeExcludes =
        n.excludes && n.excludes.length > 0 ? n.excludes : stageExcludes;

      return {
        ...n,
        _effective: {
          includes: nodeIncludes,
          excludes: nodeExcludes,
        },
      };
    });

    return { nodes, includes: stageIncludes, excludes: stageExcludes };
  };

  return {
    project: parsed.project,
    paths: parsed.paths,
    defaults: parsed.defaults,
    extractors: resolveStage(parsed.extractors),
    validators: resolveStage(parsed.validators),
    generators: resolveStage(parsed.generators),
    renderers: resolveStage(parsed.renderers),
    docs: resolveStage(parsed.docs),
  };
}
