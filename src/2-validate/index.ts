/**
 * Validation stage of the AAC pipeline
 *
 * @module validators
 * @description
 * Loads and executes validators to check, normalize, and enrich the aggregated
 * ArchletteIR before it proceeds to generation. Validators can perform various
 * transformations: schema validation, data enrichment, consistency checks, etc.
 *
 * The validation stage:
 * 1. Retrieves the aggregated IR from extraction stage
 * 2. Loads validator modules from configuration
 * 3. Invokes each validator sequentially, chaining IR through transformations
 * 4. Each validator receives the output of the previous validator
 * 5. Stores the final validated IR in pipeline state
 * 6. Writes the validated IR to the configured ir_out path for persistence
 *
 * The validated IR is passed to subsequent pipeline stages and is
 * guaranteed to be valid according to all configured validators.
 *
 * @uses core Provides IR types, validation schemas, and module loading
 *
 * @see {@link module:core/types-ir} for ArchletteIR schema
 * @see {@link module:core/stage-interfaces.ArchletteValidator} for validator interface
 */

import type { PipelineContext } from '../core/types.js';
import { loadValidatorModule } from '../core/stage-module-loader.js';
import type { ResolvedAACConfig, ResolvedStageNode } from '../core/types-aac.js';
import { resolveArchlettePath, writeFile } from '../core/path-resolver.js';

/**
 * Execute the validation stage
 *
 * @param ctx - Pipeline context with configuration, logging, and aggregated IR
 * @throws May throw if a validator fails validation checks
 */
export async function run(ctx: PipelineContext): Promise<void> {
  ctx.log.info('Validate: validating and transforming IR…');
  const config = ctx.config as ResolvedAACConfig;
  const validators: ResolvedStageNode[] = config?.validators || [];

  // Get the aggregated IR from extraction stage
  let ir = ctx.state.aggregatedIR;
  if (!ir) {
    const errorMessage = [
      'Missing aggregated IR - extraction stage must run before validation.',
      '',
      'Troubleshooting:',
      '1. Ensure your config includes extractors before validators:',
      '   extractors:',
      '     - use: builtin/basic-node',
      '       inputs:',
      '         include: ["src/**/*.ts"]',
      '   validators:',
      '     - use: builtin/base-validator',
      '',
      '2. Check if extraction stage completed successfully',
      '3. Verify extractors produced valid IR output',
    ].join('\n');

    ctx.log.error(errorMessage);
    throw new Error('Missing aggregated IR');
  }

  // Process validators sequentially, chaining IR transformations
  // Each validator receives the output of the previous validator
  for (const node of validators) {
    try {
      const { entry, resolved } = await loadValidatorModule(node.use);
      ctx.log.debug(`Loaded validator ${node.use} from ${resolved}`);
      ctx.log.debug(`Invoking validator ${node.use}`);
      ir = await entry(ir);
      ctx.log.debug(`Validator ${node.use} completed successfully.`);
      ctx.log.info(`Validator ${node.use} completed.`);
    } catch (err) {
      ctx.log.error(`Validator ${node.use} failed:`, err);
      throw err;
    }
  }

  // Store validated IR in pipeline state for downstream stages
  ctx.state.validatedIR = ir;

  // Write validated IR to disk for persistence
  ctx.log.debug(
    `Resolving validated IR output destination from ${config.paths.ir_out}.`,
  );
  const outputPath = resolveArchlettePath(config.paths.ir_out, {
    cliDir: ctx.configBaseDir,
  });
  ctx.log.debug(`Writing validated IR to ${outputPath}.`);
  writeFile(outputPath, JSON.stringify(ir, null, 2));

  ctx.log.info(
    `Validate: completed ${validators.length} validator(s). Validated IR written to ${outputPath}`,
  );
}
