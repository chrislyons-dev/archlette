import type { PipelineContext } from '../core/types.js';

export async function run(ctx: PipelineContext): Promise<void> {
  console.info(`config: ${JSON.stringify(ctx.config)}`);
  console.info(`state: ${JSON.stringify(ctx.state)}`);
  ctx.log.info('Extract: building IR…');
  // …do work, mutate ctx.state.ir = …
}
