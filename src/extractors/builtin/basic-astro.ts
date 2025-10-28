/**
 * Astro component extractor
 *
 * @module basic-astro
 * @description
 * Extracts architectural information from Astro codebases using the Astro compiler.
 * Produces ArchletteIR containing:
 *
 * - **Components**: Astro components with JSDoc annotations
 * - **Code elements**: Classes, functions, types from frontmatter
 * - **Actors**: External systems identified via @actor tags
 * - **Relationships**: Component dependencies via @uses tags
 * - **Documentation**: JSDoc comments from frontmatter
 *
 * ## Component Detection
 *
 * Components are identified via frontmatter JSDoc tags or inferred from directory structure:
 * - `@component ComponentName` - Explicit component declaration
 * - `@module path/to/module` - Standard JSDoc module tag
 * - `@namespace NamespaceName` - Standard JSDoc namespace tag
 * - If no tag present: Uses parent directory name (or container name for root files)
 *
 * ## Configuration
 *
 * @example
 * ```yaml
 * extractors:
 *   - use: builtin/basic-astro
 *     inputs:
 *       include: ['src/**\/*.astro']
 *       exclude: ['**\/*.test.astro']
 * ```
 */

import type { ResolvedStageNode } from '../../core/types-aac.js';
import type { ArchletteIR } from '../../core/types-ir.js';
import type { PipelineContext } from '../../core/types.js';
import type { ExtractorInputs } from './basic-astro/types.js';
import { IR_VERSION } from '../../core/constants.js';
import {
  findSourceFiles,
  findPackageJsonFiles,
  readPackageInfo,
  findNearestPackage,
} from './basic-astro/file-finder.js';
import { parseFiles } from './basic-astro/file-parser.js';
import { mapToIR } from './basic-astro/to-ir-mapper.js';
import { resolveSecurePath } from '../../core/path-security.js';

/**
 * Extract architecture information from an Astro codebase
 *
 * @param node - Configuration node with include/exclude patterns
 * @param ctx - Pipeline context with logger and config
 * @returns Promise resolving to ArchletteIR with components, code, and relationships
 *
 * @example
 * ```typescript
 * const ir = await basicAstroExtractor({
 *   use: 'builtin/basic-astro',
 *   name: 'astro-extractor',
 *   props: {},
 *   inputs: {
 *     include: ['src/**\/*.astro'],
 *     exclude: ['**\/*.test.astro']
 *   },
 *   _effective: { includes: [], excludes: [] }
 * }, ctx);
 * ```
 */
export default async function basicAstroExtractor(
  node: ResolvedStageNode,
  ctx: PipelineContext,
): Promise<ArchletteIR> {
  console.time(`ext-${node.name}`);
  const inputs = node.inputs as ExtractorInputs | undefined;
  const log = ctx.log;

  log.info(`Running basic-astro extractor: ${node.name || 'Astro System'}`);

  // 1. Find Astro files
  console.time('find-source-files');
  const files = await findSourceFiles(inputs || {});
  console.timeEnd('find-source-files');
  console.log(
    `[DEBUG] Found files: ${files.length}, content: ${JSON.stringify(files.slice(0, 3))}`,
  );
  log.info(`Found ${files.length} Astro files to analyze`);

  // 1.1. Validate file paths for security before parsing
  // This prevents path traversal attacks and ensures files are within allowed boundaries
  const validatedFiles: string[] = [];
  const invalidFiles: string[] = [];

  console.time('validate-files');
  for (const filePath of files) {
    try {
      const resolved = resolveSecurePath(filePath, {
        baseDir: ctx.configBaseDir,
        strategy: 'config-relative',
        allowedExtensions: ['.astro'],
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

      validatedFiles.push(resolved.absolutePath);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown validation error';
      log.warn(`Skipping invalid path ${filePath}: ${errorMsg}`);
      invalidFiles.push(filePath);
    }
  }
  console.timeEnd('validate-files');
  console.log(
    `[DEBUG] Validated ${validatedFiles.length} files, invalid: ${invalidFiles.length}`,
  );

  if (invalidFiles.length > 0) {
    log.warn(`Skipped ${invalidFiles.length} files due to path validation failures`);
  }

  if (validatedFiles.length === 0) {
    log.warn('No valid Astro files after security validation');
    // Return empty IR instead of throwing
    console.log('[EARLY RETURN] No valid files');
    return {
      version: IR_VERSION,
      system: {
        name: node.name || 'Astro System',
        description: 'No valid Astro files found',
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

  log.info(`Validated ${validatedFiles.length} Astro files for parsing`);

  // 1.5. Find package.json files to create containers
  console.time('find-package-files');
  const packagePaths = await findPackageJsonFiles(inputs || {});
  console.timeEnd('find-package-files');
  console.time('read-package-info');
  const packages = (
    await Promise.all(packagePaths.map((path) => readPackageInfo(path)))
  ).filter((pkg): pkg is NonNullable<typeof pkg> => pkg !== null);
  console.timeEnd('read-package-info');

  log.info(
    `Found ${packages.length} package(s): ${packages.map((p) => p.name).join(', ') || 'none'}`,
  );

  // 2. Parse Astro files using @astrojs/compiler
  console.time('parse-files');
  const extractions = await parseFiles(validatedFiles);
  console.timeEnd('parse-files');
  const successCount = extractions.filter((e) => !e.parseError).length;
  const errorCount = extractions.filter((e) => e.parseError).length;
  log.info(`Successfully parsed ${successCount} files, ${errorCount} errors`);

  // 2.5. Assign each file to its nearest package
  console.time('assign-packages');
  for (const extraction of extractions) {
    const pkg = findNearestPackage(extraction.filePath, packages);
    extraction.packageInfo = pkg ?? undefined;
  }
  console.timeEnd('assign-packages');

  // 3. Map to ArchletteIR format
  console.time('map-to-ir');
  // Pass project info from config if available
  const systemInfo = node._system
    ? {
        name: node._system.name,
        description: node._system.description,
        repository: node._system.repository,
      }
    : undefined;

  const ir = mapToIR(extractions, packages, systemInfo);
  console.timeEnd('map-to-ir');

  log.info(
    `Extracted ${ir.components.length} components, ${ir.actors.length} actors, ${ir.code.length} code elements, ${ir.componentRelationships.length} relationships`,
  );

  console.timeEnd(`ext-${node.name}`);
  return ir;
}
