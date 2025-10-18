/**
 * TypeScript/JavaScript code extractor
 *
 * @module extractors
 * @description
 * Extracts architectural information from TypeScript and JavaScript codebases
 * using static analysis with ts-morph. Produces ArchletteIR containing:
 *
 * - **Code elements**: Classes, functions, methods with full metadata
 * - **Components**: Logical groupings identified via JSDoc annotations
 * - **Import relationships**: File-to-file dependencies
 * - **Documentation**: JSDoc comments, descriptions, examples
 * - **System info**: Extracted from package.json
 *
 * ## Component Detection
 *
 * Components are identified via file-level JSDoc tags:
 * - `@component ComponentName` - Custom explicit component declaration
 * - `@module path/to/module` - Standard JSDoc module tag
 * - `@namespace NamespaceName` - Standard JSDoc namespace tag
 *
 * All code in a file with a component tag is associated with that component.
 *
 * ## Configuration
 *
 * @example
 * ```yaml
 * extractors:
 *   - use: builtin/basic-node
 *     inputs:
 *       include: ['src/**\/*.ts', 'src/**\/*.js']
 *       exclude: ['**\/*.test.ts', '**\/*.spec.ts']
 * ```
 *
 * @see {@link docs/extractors/component-detection.md} for component detection guide
 */

import type { ResolvedStageNode } from '../../core/types-aac.js';
import type { ArchletteIR } from '../../core/types-ir.js';
import type { ExtractorInputs } from './basic-node/types.js';
import {
  findSourceFiles,
  findPackageJsonFiles,
  readPackageInfo,
  findNearestPackage,
} from './basic-node/file-finder.js';
import { parseFiles } from './basic-node/file-parser.js';
import { mapToIR } from './basic-node/to-ir-mapper.js';

/**
 * Extract architecture information from a Node.js/TypeScript codebase
 *
 * @param node - Configuration node with include/exclude patterns
 * @returns Promise resolving to ArchletteIR with code, components, and relationships
 *
 * @example
 * ```typescript
 * const ir = await basicNodeExtractor({
 *   use: 'builtin/basic-node',
 *   name: 'code-extractor',
 *   props: {},
 *   inputs: {
 *     include: ['src/**\/*.ts'],
 *     exclude: ['**\/*.test.ts']
 *   },
 *   _effective: { includes: [], excludes: [] }
 * });
 * ```
 */
export default async function basicNodeExtractor(
  node: ResolvedStageNode,
): Promise<ArchletteIR> {
  const inputs = node.inputs as ExtractorInputs | undefined;

  // 1. Find source files
  const files = await findSourceFiles(inputs);
  console.log(`Found ${files.length} source files to analyze`);

  // 1.5. Find package.json files to create containers
  const packagePaths = await findPackageJsonFiles(inputs);
  const packages = (
    await Promise.all(packagePaths.map((path) => readPackageInfo(path)))
  ).filter((pkg): pkg is NonNullable<typeof pkg> => pkg !== null);

  console.log(
    `Found ${packages.length} package(s): ${packages.map((p) => p.name).join(', ')}`,
  );

  // 2. Parse and extract information from files
  const extractions = await parseFiles(files);

  const successCount = extractions.filter((e) => !e.parseError).length;
  const errorCount = extractions.filter((e) => e.parseError).length;
  console.log(`Successfully parsed ${successCount} files, ${errorCount} errors`);

  // 2.5. Assign each file to its nearest package
  for (const extraction of extractions) {
    const pkg = findNearestPackage(extraction.filePath, packages);
    extraction.packageInfo = pkg ?? undefined;
  }

  // 3. Map to ArchletteIR format
  // Pass project info from config if available
  const systemInfo = node._system
    ? {
        name: node._system.name,
        description: node._system.description,
        repository: node._system.repository,
      }
    : undefined;

  const ir = mapToIR(extractions, packages, systemInfo);
  console.log(`Extracted ${ir.code.length} code elements`);

  return ir;
}
