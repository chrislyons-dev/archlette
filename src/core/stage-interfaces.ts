/**
 * Stage module interfaces for the AAC pipeline
 *
 * @module core
 * @description
 * Defines the contract that all stage modules must implement. Each stage
 * (extractor, validator, generator, renderer, docs) has a specific interface
 * that defines its inputs and outputs.
 *
 * Stage modules are dynamically loaded from the configuration and must export
 * a default function matching the appropriate interface.
 *
 * @see {@link module:core/types-aac} for configuration schema
 * @see {@link module:core/types-ir} for IR types
 */

import type { ArchletteIR } from './types-ir';
import type { ResolvedStageNode } from './types-aac';
import type { PipelineContext } from './types';

/**
 * Extractor module interface
 *
 * @description
 * Extractors analyze source materials (code, IaC, configs) and produce
 * ArchletteIR. They are the entry point of the pipeline.
 *
 * @param node - Configuration for this extractor including inputs and options
 * @returns Promise resolving to ArchletteIR or ArchletteIR directly
 *
 * @example
 * ```typescript
 * // src/extractors/builtin/basic-node.ts
 * export default async function(node: ResolvedStageNode): Promise<ArchletteIR> {
 *   const files = await findFiles(node.inputs.include);
 *   const ir = await analyzeFiles(files);
 *   return ir;
 * }
 * ```
 */
export interface ArchletteExtractor {
  (node: ResolvedStageNode): Promise<ArchletteIR> | ArchletteIR;
}

/**
 * Validator module interface
 *
 * @description
 * Validators analyze and transform the aggregated ArchletteIR, performing
 * checks, normalization, or enrichment. They may mutate, filter, or annotate
 * the IR, and must return a valid ArchletteIR.
 *
 * @param ir - The input ArchletteIR to validate or transform
 * @returns Promise resolving to ArchletteIR or ArchletteIR directly
 *
 * @example
 * ```typescript
 * // src/validators/builtin/required-fields.ts
 * export default function(ir: ArchletteIR): ArchletteIR {
 *   // ...validate and/or mutate IR...
 *   return ir;
 * }
 * ```
 */
export interface ArchletteValidator {
  (ir: ArchletteIR): Promise<ArchletteIR> | ArchletteIR;
}

/**
 * Generator module interface
 *
 * @description
 * Generators transform the validated ArchletteIR into target DSL formats
 * (Structurizr, PlantUML, Mermaid, etc.). They produce string output
 * representing architecture diagrams or documentation.
 *
 * @param ir - The validated ArchletteIR to transform
 * @param node - Configuration node with generator options
 * @returns Promise resolving to DSL string or string directly
 *
 * @example
 * ```typescript
 * // src/generators/builtin/structurizr.ts
 * export default function(ir: ArchletteIR, node: ResolvedStageNode): string {
 *   const dsl = generateWorkspace(ir);
 *   return dsl;
 * }
 * ```
 */
export interface ArchletteGenerator {
  (ir: ArchletteIR, node: ResolvedStageNode): Promise<string> | string;
}

/**
 * Renderer module interface
 *
 * @description
 * Renderers transform DSL outputs or previous renderer outputs into diagram
 * images or alternative formats. They operate sequentially in a pipeline,
 * with access to full pipeline context for coordination.
 *
 * Common renderer patterns:
 * - DSL exporters (e.g., Structurizr DSL → PlantUML/Mermaid)
 * - Image generators (e.g., PlantUML → PNG/SVG)
 * - Format converters (e.g., Mermaid → PNG)
 *
 * @param ctx - Pipeline context with config, state, and logging
 * @param node - Configuration node with renderer options
 * @returns Promise resolving when rendering completes, or void
 *
 * @example
 * ```typescript
 * // src/renderers/builtin/structurizr-export.ts
 * export default async function(ctx: PipelineContext, node: ResolvedStageNode): Promise<void> {
 *   const dslOutputs = ctx.state.generatorOutputs || [];
 *   const outputDir = resolveArchlettePath(ctx.config.paths.render_out);
 *   // Export Structurizr DSL to PlantUML and Mermaid
 *   // Write files to outputDir/plantuml/ and outputDir/mermaid/
 *   ctx.state.rendererOutputs = [...]; // Track generated files
 * }
 * ```
 */
export interface ArchletteRenderer {
  (ctx: PipelineContext, node: ResolvedStageNode): Promise<void> | void;
}
