/**
 * Structurizr DSL export renderer
 *
 * @module renderers
 * @description
 * Exports Structurizr DSL to PlantUML and/or Mermaid formats using Structurizr CLI.
 *
 * This renderer:
 * 1. Finds or downloads Structurizr CLI
 * 2. Reads the generated DSL file
 * 3. Exports to selected formats (PlantUML and/or Mermaid)
 * 4. Saves outputs to diagrams/plantuml/ and/or diagrams/mermaid/
 * 5. Updates pipeline state with generated file metadata
 *
 * @see {@link module:core/tool-manager} for tool management
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import type { PipelineContext } from '../../core/types.js';
import type { ResolvedStageNode } from '../../core/types-aac.js';
import { findStructurizrCLI, requireJava } from '../../core/tool-manager.js';
import { resolveArchlettePath } from '../../core/path-resolver.js';

/**
 * Props interface for structurizr-export
 */
interface StructurizrExportProps {
  formats?: ('plantuml' | 'mermaid')[]; // Default: ['plantuml', 'mermaid']
}

/**
 * Export Structurizr DSL to PlantUML and/or Mermaid formats
 */
export default async function structurizrExport(
  ctx: PipelineContext,
  node: ResolvedStageNode,
): Promise<void> {
  const props = (node.inputs || {}) as StructurizrExportProps;
  const formats = props.formats || ['plantuml', 'mermaid'];

  if (formats.length === 0) {
    ctx.log.info('Structurizr Export: no formats selected, skipping.');
    return;
  }

  const formatList = formats.join(', ').toUpperCase();
  ctx.log.info(`Structurizr Export: converting DSL to ${formatList}...`);

  // Verify Java is available
  try {
    requireJava();
  } catch (err) {
    ctx.log.error('Java not found:', err);
    throw err;
  }

  // Get DSL file path
  const dslPath = resolveArchlettePath(ctx.config.paths.dsl_out, {
    cliDir: ctx.configBaseDir,
  });

  if (!fs.existsSync(dslPath)) {
    ctx.log.error(`DSL file not found: ${dslPath}`);
    throw new Error(`DSL file not found: ${dslPath}. Run the generate stage first.`);
  }

  ctx.log.debug(`Using DSL file: ${dslPath}`);

  // Get output directory
  const outputBase = resolveArchlettePath(ctx.config.paths.render_out, {
    cliDir: ctx.configBaseDir,
  });

  // Find Structurizr CLI
  ctx.log.debug('Looking for Structurizr CLI...');
  const structurizrPath = await findStructurizrCLI(ctx.log);
  ctx.log.debug(`Using Structurizr CLI: ${structurizrPath}`);

  // Initialize renderer outputs in state if needed
  if (!ctx.state.rendererOutputs) {
    ctx.state.rendererOutputs = [];
  }

  const isWindows = process.platform === 'win32';

  // Export to each selected format
  for (const format of formats) {
    const formatName = format.charAt(0).toUpperCase() + format.slice(1);
    const formatDir = path.join(outputBase, format);
    const fileExt = format === 'plantuml' ? '.puml' : '.mmd';

    ctx.log.info(`Exporting to ${formatName}...`);

    // Ensure output directory exists
    fs.mkdirSync(formatDir, { recursive: true });

    try {
      const cmd = isWindows
        ? `"${structurizrPath}" export -workspace "${dslPath}" -format ${format} -output "${formatDir}"`
        : `"${structurizrPath}" export -workspace "${dslPath}" -format ${format} -output "${formatDir}"`;

      ctx.log.debug(`Executing: ${cmd}`);
      execSync(cmd, {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      const exportedFiles = fs
        .readdirSync(formatDir)
        .filter((f) => f.endsWith(fileExt));
      ctx.log.info(`Generated ${exportedFiles.length} ${formatName} file(s)`);

      // Post-process Mermaid files to remove subgraph labels (fixes text overlay)
      if (format === 'mermaid') {
        ctx.log.debug('Post-processing Mermaid files to remove subgraph labels...');
        for (const file of exportedFiles) {
          const filePath = path.join(formatDir, file);
          let content = fs.readFileSync(filePath, 'utf8');
          // Replace subgraph labels with empty string to prevent text overlay
          // Pattern: subgraph identifier ["Label Text"]
          content = content.replace(
            /subgraph\s+(\w+)\s+\["[^"]*"\]/g,
            'subgraph $1 [" "]',
          );
          fs.writeFileSync(filePath, content, 'utf8');
        }
        ctx.log.debug(`Post-processed ${exportedFiles.length} Mermaid file(s)`);
      }

      ctx.state.rendererOutputs.push({
        renderer: 'structurizr-export',
        format,
        files: exportedFiles.map((f) => path.join(format, f)),
        timestamp: Date.now(),
      });

      exportedFiles.forEach((f) => {
        ctx.log.debug(`  • ${f}`);
      });
    } catch (err) {
      ctx.log.error(`${formatName} export failed:`, err);
      throw new Error(`${formatName} export failed: ${err}`);
    }
  }

  ctx.log.info('Structurizr Export: completed');
}
