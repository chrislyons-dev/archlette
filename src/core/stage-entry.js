// Runtime JS helper with JSDoc types

/** @typedef {import('./types').PipelineContext} PipelineContext */
/** @typedef {import('./types').StageModule} StageModule */
/** @typedef {(ctx: PipelineContext) => unknown | Promise<unknown>} StageEntry */

/**
 * Safely pick a callable entry from a stage module.
 * @param {unknown} mod
 * @returns {StageEntry|null}
 */
export function getStageEntry(mod) {
  const m = /** @type {Partial<StageModule> | null | undefined} */ (mod);
  if (m && typeof m.run === 'function') return m.run.bind(m);
  if (m && typeof m.default === 'function') return m.default.bind(m);
  return null;
}
