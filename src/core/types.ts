/**
 * Core pipeline types
 *
 * @module core
 * @description
 * Defines the core types for the AAC pipeline including logger, context, and state.
 */

import type { ResolvedAACConfig } from './types-aac';
import type { ArchletteIR } from './types-ir';

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Generated DSL output from a generator
 */
export interface GeneratorOutput {
  /** Generator name/identifier */
  name: string;
  /** Generated DSL content */
  content: string;
  /** Output format (e.g., 'structurizr', 'plantuml', 'mermaid') */
  format: string;
}

/**
 * Shared state passed between pipeline stages
 */
export interface PipelineState {
  /** Individual IR results from each extractor */
  extractorResults?: ArchletteIR[];
  /** Aggregated IR combining all extractor results */
  aggregatedIR?: ArchletteIR;
  /** Validated and transformed IR after validation stage */
  validatedIR?: ArchletteIR;
  /** Generated DSL outputs from generator stage */
  generatorOutputs?: GeneratorOutput[];
  /** Additional state that stages can use (extensible) */
  [key: string]: unknown;
}

export interface PipelineContext {
  config: ResolvedAACConfig;
  state: PipelineState;
  log: Logger;
}

/** What a stage module may export */
export interface StageModule {
  run?: (ctx: PipelineContext) => unknown | Promise<unknown>;
  default?: (ctx: PipelineContext) => unknown | Promise<unknown>;
}
