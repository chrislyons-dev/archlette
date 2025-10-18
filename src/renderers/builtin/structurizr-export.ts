/**
 * Structurizr DSL export renderer
 *
 * @module renderers
 * @description
 * Exports Structurizr DSL to PlantUML and Mermaid formats using Structurizr CLI.
 *
 * This renderer:
 * 1. Finds or downloads Structurizr CLI
 * 2. Reads the generated DSL file
 * 3. Exports to PlantUML (.puml) and Mermaid (.mmd) formats
 * 4. Saves outputs to diagrams/plantuml/ and diagrams/mermaid/
 * 5. Updates pipeline state with generated file metadata
 *
 * @see {@link module:core/tool-manager} for tool management
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import type { PipelineContext } from '../../core/types.js';
import { findStructurizrCLI, requireJava } from '../../core/tool-manager.js';
import { resolveArchlettePath } from '../../core/path-resolver.js';

/**
 * Export Structurizr DSL to PlantUML and Mermaid formats
 */
export default async function structurizrExport(ctx: PipelineContext): Promise<void> {
  ctx.log.info('Structurizr Export: converting DSL to PlantUML and Mermaid...');

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
  const plantumlDir = path.join(outputBase, 'plantuml');
  const mermaidDir = path.join(outputBase, 'mermaid');

  // Ensure output directories exist
  fs.mkdirSync(plantumlDir, { recursive: true });
  fs.mkdirSync(mermaidDir, { recursive: true });

  // Find Structurizr CLI
  ctx.log.debug('Looking for Structurizr CLI...');
  const structurizrPath = await findStructurizrCLI(ctx.log);
  ctx.log.debug(`Using Structurizr CLI: ${structurizrPath}`);

  // Export to PlantUML
  ctx.log.info('Exporting to PlantUML...');
  try {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows
      ? `"${structurizrPath}" export -workspace "${dslPath}" -format plantuml -output "${plantumlDir}"`
      : `"${structurizrPath}" export -workspace "${dslPath}" -format plantuml -output "${plantumlDir}"`;

    ctx.log.debug(`Executing: ${cmd}`);
    execSync(cmd, {
      encoding: 'utf8',
      stdio: 'pipe',
    });

    const plantumlFiles = fs
      .readdirSync(plantumlDir)
      .filter((f) => f.endsWith('.puml'));
    ctx.log.info(`✓ Generated ${plantumlFiles.length} PlantUML file(s)`);

    // Add to renderer outputs
    if (!ctx.state.rendererOutputs) {
      ctx.state.rendererOutputs = [];
    }

    ctx.state.rendererOutputs.push({
      renderer: 'structurizr-export',
      format: 'plantuml',
      files: plantumlFiles.map((f) => path.join('plantuml', f)),
      timestamp: Date.now(),
    });

    plantumlFiles.forEach((f) => {
      ctx.log.debug(`  • ${f}`);
    });
  } catch (err) {
    ctx.log.error('PlantUML export failed:', err);
    throw new Error(`PlantUML export failed: ${err}`);
  }

  // Export to Mermaid
  ctx.log.info('Exporting to Mermaid...');
  try {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows
      ? `"${structurizrPath}" export -workspace "${dslPath}" -format mermaid -output "${mermaidDir}"`
      : `"${structurizrPath}" export -workspace "${dslPath}" -format mermaid -output "${mermaidDir}"`;

    ctx.log.debug(`Executing: ${cmd}`);
    execSync(cmd, {
      encoding: 'utf8',
      stdio: 'pipe',
    });

    const mermaidFiles = fs.readdirSync(mermaidDir).filter((f) => f.endsWith('.mmd'));
    ctx.log.info(`✓ Generated ${mermaidFiles.length} Mermaid file(s)`);

    ctx.state.rendererOutputs.push({
      renderer: 'structurizr-export',
      format: 'mermaid',
      files: mermaidFiles.map((f) => path.join('mermaid', f)),
      timestamp: Date.now(),
    });

    mermaidFiles.forEach((f) => {
      ctx.log.debug(`  • ${f}`);
    });
  } catch (err) {
    ctx.log.error('Mermaid export failed:', err);
    throw new Error(`Mermaid export failed: ${err}`);
  }

  ctx.log.info('Structurizr Export: completed');
}
