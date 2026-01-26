/**
 * Structurizr direct image renderer
 *
 * @module renderers
 * @description
 * Renders Structurizr DSL to PNG or SVG images using CLI DOT export + Graphviz.
 * Preserves themes and styling from the DSL.
 *
 * This renderer:
 * 1. Exports DSL to DOT format via Structurizr CLI (which runs any Groovy scripts)
 * 2. Renders DOT files to PNG/SVG using Graphviz
 * 3. Updates pipeline state with generated file metadata
 *
 * @see {@link module:core/tool-manager} for tool management
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import type { PipelineContext } from '../../core/types.js';
import type { ResolvedStageNode } from '../../core/types-aac.js';
import {
  findStructurizrCLI,
  commandExistsInPath,
  requireJava,
} from '../../core/tool-manager.js';
import { resolveArchlettePath } from '../../core/path-resolver.js';

/**
 * Props interface for structurizr-render
 */
interface StructurizrRenderProps {
  format?: 'png' | 'svg'; // Default: 'png'
  theme?: string; // Path to theme override .dsl file (applied before export)
  outputSubdir?: string; // Default: '' (render_out root)
}

/**
 * Find Graphviz dot command in PATH
 */
function findGraphviz(log?: {
  debug?: (msg: string) => void;
  warn?: (msg: string) => void;
}): string {
  const dotInPath = commandExistsInPath('dot');
  if (dotInPath) {
    log?.debug?.(`Found Graphviz dot in PATH: ${dotInPath}`);
    return dotInPath;
  }

  // Check common installation paths on Windows
  const windowsPaths = [
    'C:/Program Files/Graphviz/bin/dot.exe',
    'C:/Program Files (x86)/Graphviz/bin/dot.exe',
    'D:/myapps/Graphviz/bin/dot.exe',
  ];

  for (const p of windowsPaths) {
    if (fs.existsSync(p)) {
      log?.debug?.(`Found Graphviz at: ${p}`);
      return p;
    }
  }

  throw new Error(
    'Graphviz not found. Install Graphviz and ensure "dot" is in your PATH.\n' +
      'Download from: https://graphviz.org/download/',
  );
}

/**
 * Render Structurizr DSL to images using CLI DOT export + Graphviz
 */
export default async function structurizrRender(
  ctx: PipelineContext,
  node: ResolvedStageNode,
): Promise<void> {
  const props = (node.inputs || {}) as StructurizrRenderProps;
  const format = props.format || 'png';
  const outputSubdir = props.outputSubdir || '';

  ctx.log.info(`Structurizr Render: converting DSL to ${format.toUpperCase()}...`);

  // Verify Java is available
  try {
    requireJava();
  } catch (err) {
    ctx.log.error('Java not found:', err);
    throw err;
  }

  // Get DSL file path
  let dslPath = resolveArchlettePath(ctx.config.paths.dsl_out, {
    cliDir: ctx.configBaseDir,
  });

  if (!fs.existsSync(dslPath)) {
    ctx.log.warn(`DSL file not found: ${dslPath}`);
    ctx.log.warn('Run the generate stage first to create the DSL file.');
    return;
  }

  ctx.log.debug(`Using DSL file: ${dslPath}`);

  // Get output directory
  const outputBase = resolveArchlettePath(ctx.config.paths.render_out, {
    cliDir: ctx.configBaseDir,
  });
  const imagesDir = outputSubdir ? path.join(outputBase, outputSubdir) : outputBase;

  // Ensure output directory exists
  fs.mkdirSync(imagesDir, { recursive: true });

  // Handle theme override if provided
  let tempDslPath: string | null = null;

  if (props.theme) {
    try {
      ctx.log.debug(`Theme override requested: ${props.theme}`);

      const themePath = resolveArchlettePath(props.theme, {
        cliDir: ctx.configBaseDir,
      });

      if (!fs.existsSync(themePath)) {
        ctx.log.warn(`Theme file not found: ${themePath}`);
        ctx.log.warn('Using original DSL theme instead.');
      } else {
        ctx.log.debug(`Loading theme from: ${themePath}`);

        const originalDsl = fs.readFileSync(dslPath, 'utf8');
        const themeContent = fs.readFileSync(themePath, 'utf8');

        // Extract theme section from override file
        const stylesMatch = extractStylesBlock(themeContent);
        const themeMatch = themeContent.match(/theme\s+.*$/m);
        const themeOverride = stylesMatch || themeMatch?.[0] || '';

        if (!themeOverride) {
          ctx.log.warn('No theme or styles found in theme file.');
          ctx.log.warn('Using original DSL theme instead.');
        } else {
          // Replace theme in original DSL
          let modifiedDsl = originalDsl.replace(/^\s*theme\s+.*$/gm, '');
          modifiedDsl = removeStylesBlock(modifiedDsl);
          modifiedDsl = removeBrandingBlock(modifiedDsl);

          // Insert theme override inside the views block
          const viewsEndMatch = modifiedDsl.match(/(\n\s*}\s*\n\s*}\s*)$/);
          if (viewsEndMatch) {
            const insertPos = modifiedDsl.length - viewsEndMatch[0].length;
            modifiedDsl =
              modifiedDsl.slice(0, insertPos) +
              `\n\n        ${themeOverride.replace(/\n/g, '\n        ')}\n    ` +
              modifiedDsl.slice(insertPos);
          }

          // Write to temp file
          tempDslPath = path.join(outputBase, `.temp-workspace-${Date.now()}.dsl`);
          fs.writeFileSync(tempDslPath, modifiedDsl, 'utf8');
          dslPath = tempDslPath;

          ctx.log.debug(`Created temp DSL with theme override: ${tempDslPath}`);
        }
      }
    } catch (err) {
      ctx.log.warn('Failed to apply theme override:', err);
      ctx.log.warn('Using original DSL theme instead.');
    }
  }

  try {
    // Find tools
    const cliPath = await findStructurizrCLI(ctx.log);
    const dotPath = findGraphviz(ctx.log);

    // Create temp directory for DOT files
    const dotTempDir = path.join(outputBase, `.dot-temp-${Date.now()}`);
    fs.mkdirSync(dotTempDir, { recursive: true });

    try {
      // Export to DOT format (this runs any Groovy scripts and embeds styling)
      ctx.log.debug(`Exporting DSL to DOT format...`);
      execSync(
        `"${cliPath}" export -workspace "${dslPath}" -format dot -output "${dotTempDir}"`,
        {
          stdio: 'pipe',
        },
      );

      // Find all DOT files
      const dotFiles = fs.readdirSync(dotTempDir).filter((f) => f.endsWith('.dot'));
      if (dotFiles.length === 0) {
        throw new Error('No DOT files generated from export');
      }

      ctx.log.debug(`Found ${dotFiles.length} DOT file(s) to render`);

      // Sanitize DOT files for Graphviz compatibility
      // (escapes special characters that cause rendering failures)
      sanitizeDotFiles(dotTempDir);

      // Render each DOT file to PNG/SVG using Graphviz
      const imageFiles: string[] = [];
      for (const dotFile of dotFiles) {
        const dotFilePath = path.join(dotTempDir, dotFile);
        const outputName = dotFile.replace('.dot', `.${format}`);
        const outputPath = path.join(imagesDir, outputName);

        try {
          execSync(`"${dotPath}" -T${format} "${dotFilePath}" -o "${outputPath}"`, {
            stdio: 'pipe',
          });
          imageFiles.push(outputName);
          ctx.log.debug(`  ✓ ${outputName}`);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          ctx.log.warn(`  ✗ ${outputName} (render failed): ${errorMsg}`);
        }
      }

      if (imageFiles.length === 0) {
        throw new Error('No images were generated');
      }

      ctx.log.info(`Generated ${imageFiles.length} ${format.toUpperCase()} image(s)`);

      // Add to renderer outputs
      if (!ctx.state.rendererOutputs) {
        ctx.state.rendererOutputs = [];
      }

      const outputFiles = outputSubdir
        ? imageFiles.map((f) => path.join(outputSubdir, f))
        : imageFiles;

      ctx.state.rendererOutputs.push({
        renderer: 'structurizr-render',
        format,
        files: outputFiles,
        timestamp: Date.now(),
      });

      ctx.log.info('Structurizr Render: completed');
    } finally {
      // Clean up DOT temp directory
      if (fs.existsSync(dotTempDir)) {
        fs.rmSync(dotTempDir, { recursive: true, force: true });
      }
    }
  } finally {
    // Clean up theme override temp file
    if (tempDslPath && fs.existsSync(tempDslPath)) {
      try {
        fs.unlinkSync(tempDslPath);
        ctx.log.debug(`Cleaned up temp DSL: ${tempDslPath}`);
      } catch (err) {
        ctx.log.warn(`Failed to delete temp DSL ${tempDslPath}:`, err);
      }
    }
  }
}

/**
 * Extract styles block from theme content using brace counting
 */
function extractStylesBlock(content: string): string | null {
  const stylesIndex = content.indexOf('styles');
  if (stylesIndex === -1) return null;

  const braceStart = content.indexOf('{', stylesIndex);
  if (braceStart === -1) return null;

  let braceCount = 1;
  let i = braceStart + 1;

  while (i < content.length && braceCount > 0) {
    if (content[i] === '{') braceCount++;
    else if (content[i] === '}') braceCount--;
    i++;
  }

  if (braceCount === 0) {
    return content.slice(stylesIndex, i);
  }

  return null;
}

/**
 * Remove a block from DSL content using brace counting
 */
function removeBlock(content: string, blockName: string): string {
  const blockPattern = new RegExp(`^(\\s*)${blockName}\\s*\\{`, 'm');
  const match = content.match(blockPattern);
  if (!match || match.index === undefined) return content;

  const blockIndex = match.index + (match[1]?.length || 0);
  const braceStart = content.indexOf('{', blockIndex);
  if (braceStart === -1) return content;

  let braceCount = 1;
  let i = braceStart + 1;

  while (i < content.length && braceCount > 0) {
    if (content[i] === '{') braceCount++;
    else if (content[i] === '}') braceCount--;
    i++;
  }

  if (braceCount === 0) {
    const lineStart = match.index;
    return content.slice(0, lineStart) + content.slice(i);
  }

  return content;
}

function removeStylesBlock(content: string): string {
  return removeBlock(content, 'styles');
}

function removeBrandingBlock(content: string): string {
  return removeBlock(content, 'branding');
}

/**
 * DOT/Graphviz character replacements for label content
 *
 * Graphviz HTML labels don't support all HTML tags and have quirks with
 * certain characters. This table defines simple string replacements to
 * sanitize description text that appears in DOT label content.
 *
 * Add new patterns here as needed - order matters for some replacements.
 */
/**
 * Simple string replacements for DOT label content.
 * NOTE: Run AFTER escapeInvalidHtmlTags since that handles < and >.
 */
const DOT_LABEL_REPLACEMENTS: [string, string][] = [
  // Curly braces have special meaning in DOT - escape them
  ['{', '&#123;'],
  ['}', '&#125;'],

  // Single quotes cause DOT syntax errors - just remove them
  ["'", ''],
];

/**
 * Escape all angle brackets that aren't part of valid DOT HTML tags.
 *
 * Handles cases where Structurizr inserts <br /> for word-wrapping inside
 * other tag-like content (e.g., <slot name="header<br />/>").
 *
 * Strategy:
 * 1. Find all valid HTML tags using regex
 * 2. Escape all < and > that are NOT part of those tags
 */
function escapeInvalidHtmlTags(content: string, debug = false): string {
  // Pattern to match valid DOT HTML tags
  // Matches: <font...>, </font>, <br />, <br/>, etc.
  const validTagPattern =
    /<\/?(?:font|br|b|i|u|o|sub|sup|s|table|tr|td|hr|vr|img)\b[^>]*\/?>/gi;

  // Find all valid tags and their positions
  const validTags: { start: number; end: number; tag: string }[] = [];
  let match;
  while ((match = validTagPattern.exec(content)) !== null) {
    validTags.push({
      start: match.index,
      end: match.index + match[0].length,
      tag: match[0],
    });
  }

  if (debug) {
    console.log(
      `[escapeInvalidHtmlTags] Found ${validTags.length} valid tags:`,
      validTags.map((t) => t.tag),
    );
  }

  // Build result by escaping brackets NOT in valid tags
  let result = '';
  let lastEnd = 0;

  for (const tag of validTags) {
    // Process text before this tag - escape < and >
    const before = content.slice(lastEnd, tag.start);
    result += before.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Keep the valid tag as-is
    result += content.slice(tag.start, tag.end);
    lastEnd = tag.end;
  }

  // Process remaining text after last tag
  const remaining = content.slice(lastEnd);
  result += remaining.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return result;
}

/**
 * Sanitize DOT file content for Graphviz compatibility
 *
 * Applies string replacements only within label=<<...>> content,
 * preserving the DOT structural syntax.
 */
function sanitizeDotContent(content: string, debug = false): string {
  // Process each line to find and sanitize label content
  // Label format: label=<<...>> where ... may contain nested < and >
  const lines = content.split('\n');
  let changesApplied = 0;

  const result = lines
    .map((line, lineNum) => {
      const labelStart = line.indexOf('label=<<');
      if (labelStart === -1) return line;

      // HTML labels start with '<<' where the second '<' is the first tag's '<'
      // Start after 'label=<' so the label content preserves the leading '<' of the first tag.
      const contentStart = labelStart + 7; // After 'label=<'

      // Find the closing '>>' by looking for the LAST occurrence that makes sense
      // DOT labels end with '>>' followed by attributes like ', style=' or ']'
      // Look backwards from the end for '>>' followed by comma, bracket, or end
      let labelEnd = -1;
      for (let i = line.length - 1; i >= contentStart + 1; i--) {
        if (line[i] === '>' && line[i - 1] === '>') {
          // Check what comes after (should be end of node attributes)
          const afterClose = line.slice(i + 1).trim();
          if (
            afterClose === '' ||
            afterClose === ']' ||
            afterClose.startsWith(',') ||
            afterClose.startsWith(']')
          ) {
            // Use the second '>' as the slice end so the first '>' can close the final HTML tag.
            labelEnd = i; // Position just after the content (exclusive end index)
            break;
          }
        }
      }

      if (labelEnd === -1) {
        if (debug)
          console.log(
            `[sanitize] Line ${lineNum + 1}: Could not find closing '>>', skipping`,
          );
        return line;
      }

      // Extract and sanitize the content between << and >>
      const labelContent = line.slice(contentStart, labelEnd);
      let sanitized = labelContent;

      // First: Escape invalid HTML tags (preserves <font>, <br>, etc.)
      // This handles <, >, arrows (->), generics (<T>), etc.
      const beforeEscape = sanitized;
      sanitized = escapeInvalidHtmlTags(sanitized, debug);
      if (debug && beforeEscape !== sanitized) {
        console.log(`[sanitize] Line ${lineNum + 1}: Escaped invalid HTML tags`);
        if (sanitized.length < 500) {
          console.log(`[sanitize]   Before: ${beforeEscape.substring(0, 200)}...`);
          console.log(`[sanitize]   After:  ${sanitized.substring(0, 200)}...`);
        }
      }

      // Second: Apply simple string replacements (after HTML escaping)
      for (const [from, to] of DOT_LABEL_REPLACEMENTS) {
        const before = sanitized;
        sanitized = sanitized.split(from).join(to);
        if (debug && before !== sanitized) {
          console.log(`[sanitize] Line ${lineNum + 1}: Replaced '${from}' -> '${to}'`);
        }
      }

      if (sanitized !== labelContent) {
        changesApplied++;
        if (debug) {
          console.log(`[sanitize] Line ${lineNum + 1}: Changed label content`);
        }
      }

      // Reconstruct the line
      return line.slice(0, contentStart) + sanitized + line.slice(labelEnd);
    })
    .join('\n');

  if (debug) {
    console.log(`[sanitize] Total changes applied: ${changesApplied}`);
  }

  return result;
}

/**
 * Sanitize all DOT files in a directory
 */
function sanitizeDotFiles(dotDir: string, debug = false): void {
  const dotFiles = fs.readdirSync(dotDir).filter((f) => f.endsWith('.dot'));

  if (debug) {
    console.log(`[sanitize] Processing ${dotFiles.length} DOT files in ${dotDir}`);
  }

  for (const dotFile of dotFiles) {
    const filePath = path.join(dotDir, dotFile);
    const content = fs.readFileSync(filePath, 'utf8');

    if (debug) {
      console.log(`[sanitize] Processing ${dotFile}...`);
    }

    const sanitized = sanitizeDotContent(content, debug);

    if (sanitized !== content) {
      fs.writeFileSync(filePath, sanitized, 'utf8');
      if (debug) {
        console.log(`[sanitize] Updated ${dotFile}`);
      }
    } else if (debug) {
      console.log(`[sanitize] No changes needed for ${dotFile}`);
    }
  }
}

// Test-only export to validate HTML label sanitization behavior.
export const __test__sanitizeDotContent = sanitizeDotContent;
