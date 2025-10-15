// src/core/types.ts
export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export interface PipelineContext {
  config: Record<string, unknown> | null;
  state: Record<string, unknown>;
  log: Logger;
}

/** What a stage module may export */
export interface StageModule {
  run?: (ctx: PipelineContext) => unknown | Promise<unknown>;
  default?: (ctx: PipelineContext) => unknown | Promise<unknown>;
}
