/**
 * Documentation stage of the AAC pipeline
 *
 * @module docs
 * @description
 * Generates documentation from diagrams and IR data.
 * Produces structured markdown files for the system and components.
 *
 * The documentation stage:
 * 1. Loads doc generator modules from configuration
 * 2. Invokes each generator sequentially
 * 3. Each generator can access IR data and rendered diagram files
 * 4. Generates markdown documentation files
 * 5. Updates pipeline state with generated documentation metadata
 *
 * Common doc generator:
 * - markdown-docs: IR + diagrams → Markdown documentation site
 *
 * @uses core Provides types, module loading, and path resolution
 *
 * @see {@link module:renderers} for render stage
 * @see {@link module:core/stage-module-loader} for module loading
 */

import type { PipelineContext } from '../core/types.js';
import type { ResolvedAACConfig, ResolvedStageNode } from '../core/types-aac.js';
import { loadDocModule } from '../core/stage-module-loader.js';

/**
 * Execute the documentation stage
 *
 * @param ctx - Pipeline context with configuration, logging, IR, and rendered diagrams
 * @throws May throw if doc generators fail
 */
export async function run(ctx: PipelineContext): Promise<void> {
  ctx.log.info('Docs: generating documentation…');
  const config = ctx.config as ResolvedAACConfig;
  const docs: ResolvedStageNode[] = config?.docs || [];

  // Verify IR exists
  const ir = ctx.state.validatedIR || ctx.state.aggregatedIR;
  if (!ir) {
    ctx.log.warn(
      'No IR found in pipeline state. Extraction and validation stages may not have run.',
    );
    return;
  }

  // If no doc generators configured, skip silently
  if (docs.length === 0) {
    ctx.log.info('No doc generators configured. Skipping docs stage.');
    return;
  }

  // Initialize doc outputs in state
  ctx.state.docOutputs = [];

  // Process doc generators sequentially
  for (const node of docs) {
    try {
      const { entry, resolved } = await loadDocModule(node.use);
      ctx.log.debug(`Loaded doc generator ${node.use} from ${resolved}`);
      ctx.log.debug(`Invoking doc generator ${node.use}`);

      await entry(ctx, node);

      ctx.log.info(`Doc generator ${node.use} completed.`);
    } catch (err) {
      ctx.log.error(`Doc generator ${node.use} failed:`, err);
      throw err;
    }
  }

  // Log summary
  const totalFiles =
    ctx.state.docOutputs?.reduce((sum, d) => sum + d.files.length, 0) || 0;
  ctx.log.info(
    `Docs: completed ${docs.length} generator(s), generated ${totalFiles} file(s).`,
  );
}
