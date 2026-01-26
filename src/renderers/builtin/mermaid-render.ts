/**
 * Mermaid image renderer
 *
 * @module renderers
 * @description
 * Renders Mermaid (.mmd) files to PNG or SVG images using Mermaid CLI (mmdc).
 *
 * This renderer:
 * 1. Finds Mermaid CLI (mmdc) in PATH
 * 2. Scans render_out/mermaid/ for .mmd files
 * 3. Renders each file to PNG or SVG format
 * 4. Saves images to render_out directory (root level)
 * 5. Updates pipeline state with generated file metadata
 *
 * @see {@link module:core/tool-manager} for tool management
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import type { PipelineContext } from '../../core/types.js';
import type { ResolvedStageNode } from '../../core/types-aac.js';
import { findMermaidCLI } from '../../core/tool-manager.js';
import { resolveArchlettePath } from '../../core/path-resolver.js';

/**
 * Props interface for mermaid-render
 */
interface MermaidRenderProps {
  format?: 'png' | 'svg'; // Default: 'svg'
  theme?: 'default' | 'forest' | 'dark' | 'neutral'; // Default: 'default'
  width?: number; // Default: 800
  height?: number; // Default: 600
  backgroundColor?: string; // Default: 'white'
  configFile?: string; // Path to mermaid config JSON
}

/**
 * Render Mermaid files to images
 */
export default async function mermaidRender(
  ctx: PipelineContext,
  node: ResolvedStageNode,
): Promise<void> {
  const props = (node.inputs || {}) as MermaidRenderProps;
  const format = props.format || 'svg';
  const theme = props.theme || 'default';
  const width = props.width || 800;
  const height = props.height || 600;
  const backgroundColor = props.backgroundColor || 'white';

  ctx.log.info(`Mermaid Render: converting .mmd to ${format.toUpperCase()}...`);

  // Get output directory
  const outputBase = resolveArchlettePath(ctx.config.paths.render_out, {
    cliDir: ctx.configBaseDir,
  });
  const mermaidDir = path.join(outputBase, 'mermaid');
  // Ensure absolute path for output
  const imagesDir = path.resolve(outputBase);

  // Check if Mermaid directory exists
  if (!fs.existsSync(mermaidDir)) {
    ctx.log.warn(`Mermaid directory not found: ${mermaidDir}`);
    ctx.log.warn('Run the structurizr-export renderer first to generate .mmd files.');
    return;
  }

  // Find all .mmd files
  const mmdFiles = fs.readdirSync(mermaidDir).filter((f) => f.endsWith('.mmd'));

  if (mmdFiles.length === 0) {
    ctx.log.warn('No .mmd files found to render.');
    return;
  }

  ctx.log.info(`Found ${mmdFiles.length} Mermaid file(s) to render`);

  // Ensure output directory exists
  fs.mkdirSync(imagesDir, { recursive: true });

  // Find Mermaid CLI
  ctx.log.debug('Looking for Mermaid CLI...');
  const mmdcPath = findMermaidCLI(ctx.log);
  ctx.log.debug(`Using Mermaid CLI: ${mmdcPath}`);

  // Resolve config file if provided
  let configPath: string | undefined;
  if (props.configFile) {
    configPath = resolveArchlettePath(props.configFile, {
      cliDir: ctx.configBaseDir,
    });

    if (!fs.existsSync(configPath)) {
      ctx.log.warn(`Config file not found: ${configPath}`);
      ctx.log.warn('Using default Mermaid configuration.');
      configPath = undefined;
    } else {
      ctx.log.debug(`Using Mermaid config: ${configPath}`);
    }
  }

  const renderedFiles: string[] = [];

  // Render each .mmd file
  for (const mmdFile of mmdFiles) {
    const mmdPath = path.join(mermaidDir, mmdFile);
    const baseName = path.basename(mmdFile, '.mmd');
    const outputFile = `${baseName}.${format}`;
    const outputPath = path.join(imagesDir, outputFile);

    ctx.log.debug(`Rendering ${mmdFile} → ${outputFile}`);

    try {
      // Build Mermaid CLI command
      // -i: input file
      // -o: output file
      // -t: theme
      // -w: width
      // -H: height (capital H!)
      // -b: background color
      // -c: config file (optional)
      const args = [
        '-i',
        `"${mmdPath}"`,
        '-o',
        `"${outputPath}"`,
        '-t',
        theme,
        '-w',
        width.toString(),
        '-H',
        height.toString(),
        '-b',
        backgroundColor,
      ];

      if (configPath) {
        args.push('-c', `"${configPath}"`);
      }

      const cmd = `"${mmdcPath}" ${args.join(' ')}`;

      ctx.log.debug(`Executing: ${cmd}`);
      execSync(cmd, {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      renderedFiles.push(outputFile);
      ctx.log.debug(`  ${outputFile}`);
    } catch (err) {
      ctx.log.error(`Failed to render ${mmdFile}:`, err);
      // Continue with other files instead of throwing
    }
  }

  if (renderedFiles.length > 0) {
    ctx.log.info(`Generated ${renderedFiles.length} ${format.toUpperCase()} image(s)`);

    // Add to renderer outputs
    if (!ctx.state.rendererOutputs) {
      ctx.state.rendererOutputs = [];
    }

    ctx.state.rendererOutputs.push({
      renderer: 'mermaid-render',
      format,
      files: renderedFiles,
      timestamp: Date.now(),
    });

    renderedFiles.forEach((f) => {
      ctx.log.debug(`  • ${f}`);
    });
  } else {
    ctx.log.warn('No images were generated successfully.');
  }

  ctx.log.info('Mermaid Render: completed');
}
