/**
 * Validation stage of the AAC pipeline
 *
 * @module stages/validate
 * @description
 * Loads and executes validators to check, normalize, and enrich the aggregated
 * ArchletteIR before it proceeds to generation. Validators can perform various
 * transformations: schema validation, data enrichment, consistency checks, etc.
 *
 * The validation stage:
 * 1. Retrieves the aggregated IR from extraction stage
 * 2. Loads validator modules from configuration
 * 3. Invokes each validator sequentially, passing the IR through the chain
 * 4. Logs errors but stops processing on validator failure
 * 5. Stores the final validated IR in pipeline state
 *
 * The validated IR is passed to subsequent pipeline stages and is
 * guaranteed to be valid according to all configured validators.
 *
 * @see {@link module:core/types-ir} for ArchletteIR schema
 * @see {@link module:core/stage-interfaces.ArchletteValidator} for validator interface
 */

import type { PipelineContext } from '../core/types.js';
import { loadValidatorModule } from '../core/stage-module-loader.js';
import type { ResolvedAACConfig, ResolvedStageNode } from '../core/types-aac.js';

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
    ctx.log.error(
      'No aggregated IR found in pipeline state. Extraction stage may not have run.',
    );
    throw new Error(
      'Missing aggregated IR - extraction stage must run before validation',
    );
  }

  // Process validators sequentially, passing IR through the chain
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

  ctx.log.info(`Validate: completed ${validators.length} validator(s).`);
}
