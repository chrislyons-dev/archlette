/**
 * Cloudflare Wrangler deployment extractor
 *
 * @module basic_wrangler
 * @description
 * Extracts deployment topology from Cloudflare Wrangler configuration files.
 * Produces ArchletteIR containing:
 *
 * - **Containers**: One per wrangler.toml (Cloudflare Workers)
 * - **Deployments**: One per environment (production, development, preview, etc.)
 * - **Container Instances**: Deployed instances per environment
 * - **Bindings**: Service bindings, KV, R2, D1, Durable Objects, Queues
 * - **Relationships**: Both logical (container→container) and physical (instance→instance)
 *
 * ## What it extracts
 *
 * From each wrangler.toml file:
 * - Worker name and configuration
 * - Environment-specific overrides
 * - Service bindings (dependencies on other workers)
 * - Infrastructure bindings (KV, R2, D1, Durable Objects, Queues)
 * - Routes, cron triggers, observability settings
 *
 * ## Configuration
 *
 * @example
 * ```yaml
 * extractors:
 *   - use: builtin/basic-wrangler
 *     inputs:
 *       include:
 *         - 'iac/workers/gateway.toml'
 *         - 'iac/workers/daycount.toml'
 * ```
 *
 * @see {@link docs/reqs/WRANGLER_DEPLOYMENT_REQUIREMENTS.md} for full requirements
 */

import type { ResolvedStageNode } from '../../core/types-aac.js';
import type { ArchletteIR } from '../../core/types-ir.js';
import type { PipelineContext } from '../../core/types.js';
import { emptyIR } from '../../core/types-ir.js';
import type { ExtractorInputs } from './basic-wrangler/types.js';
import { findWranglerFiles } from './basic-wrangler/file-finder.js';
import { parseWranglerFile } from './basic-wrangler/wrangler-parser.js';
import { mapToIR } from './basic-wrangler/to-ir-mapper.js';

/**
 * Extract deployment topology from Cloudflare Wrangler configuration files
 *
 * @param node - Configuration node with include/exclude patterns
 * @param ctx - Optional pipeline context with logger
 * @returns Promise resolving to ArchletteIR with containers, deployments, and relationships
 *
 * @example
 * ```typescript
 * const ir = await basicWranglerExtractor({
 *   use: 'builtin/basic-wrangler',
 *   name: 'wrangler-extractor',
 *   props: {},
 *   inputs: {
 *     include: ['iac/workers/*.toml']
 *   },
 *   _effective: { includes: [], excludes: [] }
 * });
 * ```
 */
export default async function basicWranglerExtractor(
  node: ResolvedStageNode,
  ctx: PipelineContext,
): Promise<ArchletteIR> {
  const inputs = node.inputs as ExtractorInputs | undefined;
  const log = ctx.log;

  // 1. Find wrangler.toml files
  const files = await findWranglerFiles(inputs);
  log.info(`Found ${files.length} wrangler.toml file(s) to analyze`);

  if (files.length === 0) {
    log.warn('No wrangler.toml files found');
    return emptyIR;
  }

  // 2. Parse wrangler.toml files
  const configs = await Promise.all(files.map(parseWranglerFile));
  log.info(`Parsed ${configs.length} wrangler.toml configuration(s)`);

  // 3. Map to ArchletteIR
  const ir = mapToIR(configs, node._system);
  log.info(
    `Extracted ${ir.containers.length} container(s), ${ir.deployments.length} deployment(s)`,
  );

  return ir;
}
