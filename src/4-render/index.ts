/**
 * Render stage of the AAC pipeline
 *
 * @module renderers
 * @description
 * Takes generated DSL files and converts them to visual diagrams (PNG, SVG, etc.)
 * using external rendering tools like Structurizr CLI, PlantUML, or Mermaid.
 *
 * The rendering stage:
 * 1. Loads renderer modules from configuration
 * 2. Invokes each renderer sequentially (order matters!)
 * 3. Each renderer can consume previous renderer outputs
 * 4. Generates diagram files in configured formats
 * 5. Updates pipeline state with rendered file metadata
 *
 * Common renderer pipeline:
 * - structurizr-export: DSL → PlantUML/Mermaid
 * - plantuml-render: PlantUML → PNG images
 *
 * @uses core Provides types, module loading, and tool management
 *
 * @see {@link module:generators} for generation stage
 * @see {@link module:core/tool-manager} for tool management
 */

import type { PipelineContext } from '../core/types.js';
import type { ResolvedAACConfig, ResolvedStageNode } from '../core/types-aac.js';
import { loadRendererModule } from '../core/stage-module-loader.js';

/**
 * Execute the rendering stage
 *
 * @param ctx - Pipeline context with configuration, logging, and DSL file location
 * @throws May throw if rendering tools fail or renderers error
 */
export async function run(ctx: PipelineContext): Promise<void> {
  ctx.log.info('Render: converting DSL to diagrams…');
  const config = ctx.config as ResolvedAACConfig;
  const renderers: ResolvedStageNode[] = config?.renderers || [];

  // Verify generator outputs exist
  const outputs = ctx.state.generatorOutputs;
  if (!outputs || outputs.length === 0) {
    ctx.log.warn(
      'No generator outputs found in pipeline state. Generation stage may not have run.',
    );
    return;
  }

  // If no renderers configured, skip silently
  if (renderers.length === 0) {
    ctx.log.info('No renderers configured. Skipping render stage.');
    return;
  }

  // Initialize renderer outputs in state
  ctx.state.rendererOutputs = [];

  // Process renderers sequentially (order matters for pipelines)
  for (const node of renderers) {
    try {
      const { entry, resolved } = await loadRendererModule(node.use);
      ctx.log.debug(`Loaded renderer ${node.use} from ${resolved}`);
      ctx.log.debug(`Invoking renderer ${node.use}`);

      await entry(ctx, node);

      ctx.log.info(`Renderer ${node.use} completed.`);
    } catch (err) {
      ctx.log.error(`Renderer ${node.use} failed:`, err);
      throw err;
    }
  }

  // Log summary
  const totalFiles =
    ctx.state.rendererOutputs?.reduce((sum, r) => sum + r.files.length, 0) || 0;
  ctx.log.info(
    `Render: completed ${renderers.length} renderer(s), generated ${totalFiles} file(s).`,
  );
}
