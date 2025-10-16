/**
 * Stage module interfaces for the AAC pipeline
 *
 * @module core/stage-interfaces
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
