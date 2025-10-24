/**
 * Markdown documentation generator
 *
 * @module docs
 * @description
 * Generates markdown documentation from IR data and rendered diagrams.
 *
 * This generator:
 * 1. Reads IR data and rendered diagram files
 * 2. Configures Nunjucks templating engine
 * 3. Generates system overview page with system/container/component diagrams
 * 4. Generates individual component pages with component/code diagrams
 * 5. Writes markdown files to docs_out directory
 * 6. Updates pipeline state with generated file metadata
 *
 * @see {@link module:core/types-ir} for IR structure
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import type { PipelineContext, Logger, RendererOutput } from '../../core/types.js';
import type { Component } from '../../core/types-ir.js';
import { resolveArchlettePath } from '../../core/path-resolver.js';

const require = createRequire(import.meta.url);
const nunjucks = require('nunjucks');

/**
 * Generate markdown documentation
 */
export default async function markdownDocs(ctx: PipelineContext): Promise<void> {
  ctx.log.info('Markdown Docs: generating documentation...');

  // Get IR data
  const ir = ctx.state.validatedIR || ctx.state.aggregatedIR;
  if (!ir) {
    ctx.log.error('No IR data found in pipeline state');
    throw new Error('No IR data found. Run extract and validate stages first.');
  }

  ctx.log.debug(
    `Loaded IR: ${ir.components.length} components, ${ir.actors.length} actors`,
  );

  // Get rendered diagram files
  const rendererOutputs = ctx.state.rendererOutputs || [];
  ctx.log.debug(`Found ${rendererOutputs.length} renderer output(s)`);

  // Get output directory
  const docsDir = resolveArchlettePath(ctx.config.paths.docs_out, {
    cliDir: ctx.configBaseDir,
  });
  // Get diagram directory from render_out config (not docs_out)
  const diagramsDir = resolveArchlettePath(ctx.config.paths.render_out, {
    cliDir: ctx.configBaseDir,
  });

  // Ensure output directory exists
  fs.mkdirSync(docsDir, { recursive: true });

  // Configure Nunjucks
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const templateDir = path.join(__dirname, 'templates');
  const env = nunjucks.configure(templateDir, {
    autoescape: false,
    trimBlocks: true,
    lstripBlocks: true,
  });

  // Add custom filters
  env.addFilter('kebabCase', (str: string) => {
    return str
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  });

  env.addFilter('sanitizeFileName', (str: string) => {
    return sanitizeFileName(str);
  });

  env.addFilter('forwardSlashes', (str: string) => {
    return str.replace(/\\/g, '/');
  });

  env.addFilter('date', (date: Date | string, format: string) => {
    const d = typeof date === 'string' ? new Date() : date;
    const pad = (n: number) => String(n).padStart(2, '0');
    return format
      .replace('YYYY', String(d.getFullYear()))
      .replace('MM', pad(d.getMonth() + 1))
      .replace('DD', pad(d.getDate()))
      .replace('HH', pad(d.getHours()))
      .replace('mm', pad(d.getMinutes()))
      .replace('ss', pad(d.getSeconds()));
  });

  env.addFilter(
    'selectattr',
    (
      arr: Array<Record<string, unknown>>,
      attr: string,
      test: string,
      value: unknown,
    ) => {
      if (test === 'equalto') {
        return arr.filter((item) => item[attr] === value);
      }
      return arr;
    },
  );

  env.addFilter(
    'map',
    (arr: Array<Record<string, unknown>>, _mapType: string, attr: string) => {
      return arr.map((item) => item[attr]);
    },
  );

  env.addFilter('first', <T>(arr: T[]) => {
    return arr && arr.length > 0 ? arr[0] : undefined;
  });

  // Find diagram files for system views
  const systemDiagrams = findDiagramsForView(
    rendererOutputs,
    diagramsDir,
    docsDir,
    'SystemContext',
    ctx.log,
  );
  const containerDiagrams = findDiagramsForView(
    rendererOutputs,
    diagramsDir,
    docsDir,
    'Container',
    ctx.log,
  );
  const componentDiagrams = findDiagramsForView(
    rendererOutputs,
    diagramsDir,
    docsDir,
    'Component',
    ctx.log,
  );

  // Render system page
  ctx.log.info('Generating system overview page...');
  const systemPageContent = env.render('system.md.njk', {
    system: ir.system,
    actors: ir.actors,
    containers: ir.containers,
    components: ir.components,
    systemDiagrams,
    containerDiagrams,
    componentDiagrams,
  });

  const systemPagePath = path.join(docsDir, 'README.md');
  fs.writeFileSync(systemPagePath, systemPageContent, 'utf8');
  ctx.log.info(`Generated README.md`);

  const generatedFiles: string[] = ['README.md'];

  // Render container pages
  ctx.log.info(`Generating ${ir.containers.length} container page(s)...`);
  for (const container of ir.containers) {
    const containerComponents = ir.components.filter(
      (c) => c.containerId === container.id,
    );

    // Find component diagrams for this container
    const containerComponentDiagrams = findDiagramsForContainer(
      rendererOutputs,
      diagramsDir,
      docsDir,
      container,
    );

    const containerPageContent = env.render('container.md.njk', {
      container,
      system: ir.system,
      components: containerComponents,
      containerDiagrams,
      componentDiagrams: containerComponentDiagrams,
    });

    const filename = `${sanitizeFileName(container.id)}.md`;
    const containerPagePath = path.join(docsDir, filename);
    fs.writeFileSync(containerPagePath, containerPageContent, 'utf8');
    ctx.log.debug(`  • ${filename}`);
    generatedFiles.push(filename);
  }

  ctx.log.info(`Generated ${ir.containers.length} container page(s)`);

  // Render component pages
  ctx.log.info(`Generating ${ir.components.length} component page(s)...`);
  for (const component of ir.components) {
    const componentPageContent = env.render('component.md.njk', {
      component,
      system: ir.system,
      container: ir.containers.find((c) => c.id === component.containerId),
      codeItems: ir.code.filter((item) => item.componentId === component.id),
      codeDiagrams: findClassDiagramsForComponent(
        rendererOutputs,
        diagramsDir,
        docsDir,
        component,
      ),
    });

    const filename = `${sanitizeFileName(component.id)}.md`;
    const componentPagePath = path.join(docsDir, filename);
    fs.writeFileSync(componentPagePath, componentPageContent, 'utf8');
    ctx.log.debug(`  • ${filename}`);
    generatedFiles.push(filename);
  }

  ctx.log.info(`Generated ${ir.components.length} component page(s)`);

  // Update pipeline state
  if (!ctx.state.docOutputs) {
    ctx.state.docOutputs = [];
  }

  ctx.state.docOutputs.push({
    generator: 'markdown-docs',
    format: 'markdown',
    files: generatedFiles,
    timestamp: Date.now(),
  });

  ctx.log.info('Markdown Docs: completed');
}

/**
 * Find diagram files for a specific view type
 */
function findDiagramsForView(
  rendererOutputs: RendererOutput[],
  diagramsDir: string,
  docsDir: string,
  viewType: string,
  log?: Logger,
): string[] {
  const diagrams: string[] = [];
  log?.debug(
    `Searching for diagrams using diagramsDir: ${diagramsDir}, docsDir: ${docsDir}, view type: ${viewType}`,
  );
  for (const output of rendererOutputs) {
    if (output.format === 'png') {
      for (const file of output.files) {
        const filename = path.basename(file, '.png');
        if (filename.includes(viewType) && !filename.includes('-key')) {
          const fullPath = path.join(diagramsDir, file);
          log?.debug('Checking for diagram file:', fullPath);
          if (fs.existsSync(fullPath)) {
            diagrams.push(path.relative(docsDir, fullPath));
          }
        }
      }
    }
  }

  return diagrams;
}

/**
 * Find component diagrams for a specific container
 */
function findDiagramsForContainer(
  rendererOutputs: RendererOutput[],
  diagramsDir: string,
  docsDir: string,
  container: { id: string; name: string },
): string[] {
  const diagrams: string[] = [];
  // Sanitize container NAME same way as generator does (not ID)
  // The DSL generator uses container.name to create the view name
  const sanitizedContainerName = container.name.replace(/[^a-zA-Z0-9_]/g, '_');

  for (const output of rendererOutputs) {
    if (output.format === 'png') {
      for (const file of output.files) {
        const filename = path.basename(file, '.png');
        // Look for component view diagrams for this specific container
        // Format: structurizr-Components_{sanitized-container-name}
        if (
          filename.includes('Component') &&
          filename.includes(sanitizedContainerName) &&
          !filename.includes('Classes') &&
          !filename.includes('-key')
        ) {
          const fullPath = path.join(diagramsDir, file);
          if (fs.existsSync(fullPath)) {
            diagrams.push(path.relative(docsDir, fullPath));
          }
        }
      }
    }
  }

  return diagrams;
}

/**
 * Find class diagrams for a specific component
 */
function findClassDiagramsForComponent(
  rendererOutputs: RendererOutput[],
  diagramsDir: string,
  docsDir: string,
  component: Component,
): string[] {
  const diagrams: string[] = [];
  // Sanitize component ID same way as generator does
  // (replaces non-alphanumeric except underscore with underscore)
  const sanitizedComponentId = component.id.replace(/[^a-zA-Z0-9_]/g, '_');

  for (const output of rendererOutputs) {
    if (output.format === 'png') {
      for (const file of output.files) {
        const filename = path.basename(file, '.png');
        // Look for class diagrams for this specific component
        // Format: structurizr-Classes_{sanitized-component-id}
        if (
          filename.includes('Classes') &&
          filename.includes(sanitizedComponentId) &&
          !filename.includes('-key')
        ) {
          const fullPath = path.join(diagramsDir, file);
          if (fs.existsSync(fullPath)) {
            diagrams.push(path.relative(docsDir, fullPath));
          }
        }
      }
    }
  }

  return diagrams;
}

function sanitizeFileName(name: string): string {
  // Remove or replace characters not allowed in Windows or Linux filenames
  // Windows: \ / : * ? " < > |
  // Linux: /
  return name
    .replace(/[\\/:*?"<>|]/g, '-') // Replace invalid characters with hyphen
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\s+/g, '-') // Replace spaces with hyphen
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
}
