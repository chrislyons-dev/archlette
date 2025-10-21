/**
 * PlantUML image renderer
 *
 * @module renderers
 * @description
 * Renders PlantUML (.puml) files to PNG images using PlantUML JAR.
 *
 * This renderer:
 * 1. Finds or downloads PlantUML JAR
 * 2. Scans diagrams/plantuml/ for .puml files
 * 3. Renders each file to PNG format
 * 4. Saves images to diagrams/ directory (root level)
 * 5. Updates pipeline state with generated file metadata
 *
 * @see {@link module:core/tool-manager} for tool management
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import type { PipelineContext } from '../../core/types.js';
import { findPlantUML, requireJava } from '../../core/tool-manager.js';
import { resolveArchlettePath } from '../../core/path-resolver.js';

/**
 * Render PlantUML files to PNG images
 */
export default async function plantumlRender(ctx: PipelineContext): Promise<void> {
  ctx.log.info('PlantUML Render: converting .puml to PNG...');

  // Verify Java is available
  try {
    requireJava();
  } catch (err) {
    ctx.log.error('Java not found:', err);
    throw err;
  }

  // Get output directory
  const outputBase = resolveArchlettePath(ctx.config.paths.render_out, {
    cliDir: ctx.configBaseDir,
  });
  const plantumlDir = path.join(outputBase, 'plantuml');
  // Ensure absolute path for PlantUML (it doesn't handle relative paths correctly)
  const imagesDir = path.resolve(outputBase);

  // Check if PlantUML directory exists
  if (!fs.existsSync(plantumlDir)) {
    ctx.log.warn(`PlantUML directory not found: ${plantumlDir}`);
    ctx.log.warn('Run the structurizr-export renderer first to generate .puml files.');
    return;
  }

  // Find all .puml files
  const pumlFiles = fs.readdirSync(plantumlDir).filter((f) => f.endsWith('.puml'));

  if (pumlFiles.length === 0) {
    ctx.log.warn('No .puml files found to render.');
    return;
  }

  ctx.log.info(`Found ${pumlFiles.length} PlantUML file(s) to render`);

  // Ensure output directory exists
  fs.mkdirSync(imagesDir, { recursive: true });

  // Find PlantUML JAR
  ctx.log.debug('Looking for PlantUML...');
  const plantumlPath = await findPlantUML(ctx.log);
  ctx.log.debug(`Using PlantUML: ${plantumlPath}`);

  const renderedFiles: string[] = [];

  // Render each .puml file
  for (const pumlFile of pumlFiles) {
    const pumlPath = path.join(plantumlDir, pumlFile);
    const baseName = path.basename(pumlFile, '.puml');
    const outputFile = `${baseName}.png`;

    ctx.log.debug(`Rendering ${pumlFile} → ${outputFile}`);

    try {
      // PlantUML command to render
      // -o: output directory
      // -tpng: output format (PNG)
      // For JAR files, we need to use java -jar
      const isPlantumlJar = plantumlPath.endsWith('.jar');

      let cmd: string;
      if (isPlantumlJar) {
        cmd = `java -jar "${plantumlPath}" -tpng -o "${imagesDir}" "${pumlPath}"`;
      } else {
        // If it's a wrapper script in PATH
        cmd = `"${plantumlPath}" -tpng -o "${imagesDir}" "${pumlPath}"`;
      }

      ctx.log.debug(`Executing: ${cmd}`);
      execSync(cmd, {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      renderedFiles.push(outputFile);
      ctx.log.debug(`  ✓ ${outputFile}`);
    } catch (err) {
      ctx.log.error(`Failed to render ${pumlFile}:`, err);
      // Continue with other files instead of throwing
    }
  }

  if (renderedFiles.length > 0) {
    ctx.log.info(`✓ Generated ${renderedFiles.length} PNG image(s)`);

    // Add to renderer outputs
    if (!ctx.state.rendererOutputs) {
      ctx.state.rendererOutputs = [];
    }

    ctx.state.rendererOutputs.push({
      renderer: 'plantuml-render',
      format: 'png',
      files: renderedFiles,
      timestamp: Date.now(),
    });

    renderedFiles.forEach((f) => {
      ctx.log.debug(`  • ${f}`);
    });
  } else {
    ctx.log.warn('No images were generated successfully.');
  }

  ctx.log.info('PlantUML Render: completed');
}
