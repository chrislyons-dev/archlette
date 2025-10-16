/**
 * Render stage of the AAC pipeline
 *
 * @module renderers
 * @description
 * Takes generated DSL outputs from the generation stage and writes them to
 * configured output files. Each generator can specify output paths in its
 * configuration, and this stage handles the actual file I/O.
 *
 * The rendering stage:
 * 1. Retrieves generator outputs from generation stage
 * 2. Resolves output file paths from generator configuration
 * 3. Writes each output to its designated file
 * 4. Logs success/failure for each file written
 *
 * @see {@link module:stages/generate} for generation stage
 */

import type { PipelineContext } from '../core/types.js';
import { resolveArchlettePath, getCliDir, writeFile } from '../core/path-resolver.js';
import type { ResolvedAACConfig, ResolvedStageNode } from '../core/types-aac.js';

/**
 * Execute the rendering stage
 *
 * @param ctx - Pipeline context with configuration, logging, and generator outputs
 * @throws Does not throw - logs errors for individual file write failures
 */
export async function run(ctx: PipelineContext): Promise<void> {
  ctx.log.info('Render: writing generated outputs to files…');
  const config = ctx.config as ResolvedAACConfig;
  const generators: ResolvedStageNode[] = config?.generators || [];

  // Get generator outputs from generation stage
  const outputs = ctx.state.generatorOutputs;
  if (!outputs || outputs.length === 0) {
    ctx.log.warn(
      'No generator outputs found in pipeline state. Generation stage may not have run.',
    );
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  // Write each generator output to its configured file
  for (let i = 0; i < outputs.length; i++) {
    const output = outputs[i];
    const generatorNode = generators[i]; // Match by index

    if (!generatorNode) {
      ctx.log.warn(
        `No configuration found for generator output "${output.name}". Skipping.`,
      );
      continue;
    }

    // Get output path from generator's props (flexible approach)
    // Expected config: props: { output: "path/to/file.dsl" }
    const outputPath = (generatorNode.props as Record<string, unknown>)?.output as
      | string
      | undefined;

    if (!outputPath) {
      ctx.log.warn(
        `Generator "${generatorNode.use}" has no 'output' property in props. Skipping.`,
      );
      ctx.log.debug(`Generator config: ${JSON.stringify(generatorNode.props)}`);
      continue;
    }

    try {
      const cliDir = getCliDir();
      ctx.log.debug(`CLI directory: ${cliDir}`);
      ctx.log.debug(`Output path from config: ${outputPath}`);
      const resolvedPath = resolveArchlettePath(outputPath, { cliDir });
      ctx.log.info(`Resolved output path: ${resolvedPath}`);
      ctx.log.debug(
        `Writing ${output.format} output (${output.content.length} chars) to ${resolvedPath}`,
      );
      writeFile(resolvedPath, output.content);
      ctx.log.info(`✓ Wrote ${output.format} output to ${resolvedPath}`);
      successCount++;
    } catch (err) {
      ctx.log.error(
        `Failed to write output for generator "${generatorNode.use}" to ${outputPath}:`,
        err,
      );
      errorCount++;
    }
  }

  ctx.log.info(`Render: completed ${successCount} file(s), ${errorCount} error(s).`);
}
