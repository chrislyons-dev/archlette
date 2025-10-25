/**
 * Basic Python Extractor for Archlette
 * Extracts architecture information from Python source code
 *
 * @module basic-python
 */

import {
  findSourceFiles,
  findPyProjectFiles,
  readPyProjectInfo,
  findNearestPyProject,
} from './basic-python/file-finder.js';
import { parseFiles } from './basic-python/file-parser.js';
import { mapToIR } from './basic-python/to-ir-mapper.js';
import { resolveSecurePath } from '../../core/path-security.js';
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

  // Validate file paths for security before passing to Python parser
  // This prevents path traversal attacks and ensures files are within allowed boundaries
  const validatedPaths: string[] = [];
  const invalidPaths: string[] = [];

  for (const filePath of filePaths) {
    try {
      const resolved = resolveSecurePath(filePath, {
        baseDir: ctx.configBaseDir,
        strategy: 'config-relative',
        allowedExtensions: ['.py', '.pyi'],
        allowedAbsolutePaths: ctx.config.allowedAbsolutePaths || [],
        mustExist: true,
      });

      // Log warnings for suspicious paths
      if (resolved.warnings.length > 0) {
        log.warn(
          `Security warnings for ${filePath}:\n` +
            resolved.warnings.map((w) => `  - ${w}`).join('\n'),
        );
      }

      validatedPaths.push(resolved.absolutePath);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown validation error';
      log.warn(`Skipping invalid path ${filePath}: ${errorMsg}`);
      invalidPaths.push(filePath);
    }
  }

  if (invalidPaths.length > 0) {
    log.warn(`Skipped ${invalidPaths.length} files due to path validation failures`);
  }

  if (validatedPaths.length === 0) {
    log.warn('No valid Python files after security validation');
    return createEmptyIR(node.name || 'Python System');
  }

  log.info(`Validated ${validatedPaths.length} Python files for parsing`);

  // Find pyproject.toml files to create containers
  const pyprojectPaths = await findPyProjectFiles({ include, exclude });
  const pyprojects = (
    await Promise.all(pyprojectPaths.map((path) => readPyProjectInfo(path)))
  ).filter((proj): proj is NonNullable<typeof proj> => proj !== null);

  log.info(
    `Found ${pyprojects.length} pyproject(s): ${pyprojects.map((p) => p.name).join(', ')}`,
  );

  // Parse files using Python AST parser (with validated paths)
  const extractions = await parseFiles(validatedPaths, pythonPath);

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

  // Assign each file to its nearest pyproject
  for (const extraction of extractions) {
    const proj = findNearestPyProject(extraction.filePath, pyprojects);
    extraction.packageInfo = proj ?? undefined;
  }

  // Map to IR
  // Pass project info from config if available
  const systemInfo = node._system
    ? {
        name: node._system.name,
        description: node._system.description,
        repository: node._system.repository,
      }
    : undefined;

  const ir = mapToIR(extractions, pyprojects, systemInfo);

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
