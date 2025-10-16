/**
 * Documentation stage of the AAC pipeline
 *
 * @module docs
 * @description
 * Generates documentation from diagrams and IR.
 */

import type { PipelineContext } from '../core/types.js';

export async function run(ctx: PipelineContext): Promise<void> {
  ctx.log.info('Docs: generating documentation…');
  // …do work, mutate ctx.state
}
