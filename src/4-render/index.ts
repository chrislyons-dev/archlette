import type { PipelineContext } from '../core/types.js';

export async function run(ctx: PipelineContext): Promise<void> {
  ctx.log.info('Extract: building IR…');
  // …do work, mutate ctx.state.ir = …
}
