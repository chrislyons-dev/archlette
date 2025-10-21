/**
 * Extraction stage of the AAC pipeline
 *
 * @module extractors
 * @description
 * Loads and executes extractors to produce ArchletteIR from various sources.
 * Extractors can analyze code, IaC, configuration files, or any other
 * source of architectural information.
 *
 * The extraction stage:
 * 1. Loads extractor modules from configuration
 * 2. Invokes each extractor with its inputs and configuration
 * 3. Validates outputs against the ArchletteIR schema
 * 4. Collects all valid extractions into pipeline state
 * 5. Logs warnings for invalid outputs but continues processing
 *
 * All valid IR results are stored in `ctx.state.extractorResults` for
 * use by subsequent pipeline stages.
 *
 * @uses core Provides IR types, validation schemas, and module loading
 *
 * @see {@link module:core/types-ir} for ArchletteIR schema
 * @see {@link module:core/stage-interfaces.ArchletteExtractor} for extractor interface
 */

import type { PipelineContext } from '../core/types.js';
import { loadExtractorModule } from '../core/stage-module-loader';
import { zArchletteIR, type ArchletteIR } from '../core/types-ir';
import { resolveArchlettePath, writeFile } from '../core/path-resolver.js';
import type { ResolvedAACConfig, ResolvedStageNode } from '../core/types-aac';
import { aggregateIRs } from './aggregator.js';

/**
 * Execute the extraction stage
 *
 * @param ctx - Pipeline context with configuration and logging
 * @throws Does not throw - logs errors and continues processing remaining extractors
 */
export async function run(ctx: PipelineContext): Promise<void> {
  ctx.log.info('Extract: building IR…');
  const config = ctx.config as ResolvedAACConfig;
  const extractors: ResolvedStageNode[] = config?.extractors || [];
  const results: ArchletteIR[] = [];

  for (const node of extractors) {
    try {
      const { entry, resolved } = await loadExtractorModule(node.use);
      ctx.log.debug(`Loaded extractor ${node.use} from ${resolved}`);
      ctx.log.debug(`Invoking extractor ${node.use}`);

      // Pass context to extractor for logging support
      const result = await entry(node, ctx);

      ctx.log.debug(`Validating extractor ${node.use} results`);
      const validation = zArchletteIR.safeParse(result);
      if (!validation.success) {
        ctx.log.warn(
          `Extractor ${node.use} produced invalid ArchletteIR. Discarding results. Errors:`,
          validation.error,
        );
      } else {
        ctx.log.debug(`Extractor ${node.use} results are valid ArchletteIR.`);
        results.push(validation.data);
      }
      ctx.log.info(`Extractor ${node.use} completed.`);
    } catch (err) {
      ctx.log.error(`Extractor ${node.use} failed:`, err);
    }
  }

  // Aggregate all valid IRs into a single unified IR
  ctx.log.debug(`Aggregating ${results.length} IR result(s)…`);
  const aggregatedIR = aggregateIRs(results);
  ctx.log.debug(
    `Aggregated IR contains: ${aggregatedIR.actors.length} actors, ${aggregatedIR.containers.length} containers, ${aggregatedIR.components.length} components, ${aggregatedIR.code.length} code items`,
  );

  ctx.state.extractorResults = results;
  ctx.state.aggregatedIR = aggregatedIR;

  ctx.log.debug(`Resolving IR output destination from ${config.paths.ir_out}.`);
  const outputPath = resolveArchlettePath(config.paths.ir_out, {
    cliDir: ctx.configBaseDir,
  });
  ctx.log.debug(`Writing aggregated IR to ${outputPath}.`);
  writeFile(outputPath, JSON.stringify(aggregatedIR, null, 2));
  ctx.log.info(`Extract: completed ${results.length} extractor(s).`);
}
