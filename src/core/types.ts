import type { ResolvedAACConfig } from './types-aac';
import type { ArchletteIR } from './types-ir';

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Shared state passed between pipeline stages
 */
export interface PipelineState {
  /** Individual IR results from each extractor */
  extractorResults?: ArchletteIR[];
  /** Aggregated IR combining all extractor results */
  aggregatedIR?: ArchletteIR;
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
