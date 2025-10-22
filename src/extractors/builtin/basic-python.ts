/**
 * Basic Python Extractor for Archlette
 * Extracts architecture information from Python source code
 *
 * @module basic-python
 */

import { findSourceFiles } from './basic-node/file-finder.js'; // Reuse file finder
import { parseFiles } from './basic-python/file-parser.js';
import { mapToIR } from './basic-python/to-ir-mapper.js';
import type { ArchletteExtractor } from '../../core/stage-interfaces.js';
import type { ArchletteIR } from '../../core/types-ir.js';
import type { ResolvedStageNode } from '../../core/types-aac.ts';
import type { ExtractorInputs } from './basic-python/types.js';

/**
 * Basic Python extractor
 * Analyzes Python source code and extracts architectural components
 */
export const basicPython: ArchletteExtractor = async (
  node: ResolvedStageNode,
  ctx,
): Promise<ArchletteIR> => {
  const log = ctx.log;
  log.info(`Running basic-python extractor: ${node.name || 'unnamed'}`);

  // Parse inputs
  const inputs = node.inputs as ExtractorInputs;
  const include = inputs.include || [];
  const exclude = inputs.exclude || [];
  const pythonPath = inputs.pythonPath || 'python';

  // Find Python files
  log.info(`Finding Python files with patterns: ${include.join(', ')}`);
  const filePaths = await findSourceFiles({ include, exclude });
  log.info(`Found ${filePaths.length} Python files`);

  if (filePaths.length === 0) {
    log.warn('No Python files found matching include patterns');
    return createEmptyIR(node.name || 'Python System');
  }

  // Parse files using Python AST parser
  const extractions = await parseFiles(filePaths, pythonPath);

  // Count successful vs failed parses
  const successful = extractions.filter((e) => !e.parseError).length;
  const failed = extractions.filter((e) => e.parseError).length;
  log.info(`Parsed ${successful} files successfully, ${failed} failed`);

  if (failed > 0) {
    log.warn(
      `Parse errors in ${failed} files:\n` +
        extractions
          .filter((e) => e.parseError)
          .map((e) => `  - ${e.filePath}: ${e.parseError}`)
          .join('\n'),
    );
  }

  // Map to IR
  const systemName = node.name || 'Python System';
  const ir = mapToIR(extractions, systemName);

  log.info(
    `Extracted IR: ${ir.components.length} components, ` +
      `${ir.actors.length} actors, ${ir.code.length} code items, ` +
      `${ir.componentRelationships.length} relationships`,
  );

  return ir;
};

/**
 * Create empty IR when no files found
 */
function createEmptyIR(systemName: string): ArchletteIR {
  return {
    version: '1.0',
    system: {
      name: systemName,
      description: 'No Python files found or parsed',
    },
    actors: [],
    containers: [],
    components: [],
    code: [],
    deployments: [],
    containerRelationships: [],
    componentRelationships: [],
    codeRelationships: [],
    deploymentRelationships: [],
  };
}

// Export as default for dynamic loading
export default basicPython;
