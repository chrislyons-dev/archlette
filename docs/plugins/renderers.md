# Writing Renderers

Extend Archlette. Render DSL to visual formats.

---

## Renderer Interface

All renderers export a default function:

```typescript
export default async function myRenderer(
  ctx: PipelineContext,
  node: ResolvedStageNode,
): Promise<{ outputs: string[] }> {
  // Read DSL from ctx.config.paths.dsl_out
  // Render to images
  // Return list of output files

  return {
    outputs: ['diagram.png', 'diagram.svg'],
  };
}
```

**Input:** `PipelineContext` — Shared pipeline state, `ResolvedStageNode` — Configuration

**Output:** List of generated file paths

---

## Example: SVG Renderer

```typescript
import type { PipelineContext, ResolvedStageNode } from '@chrislyons-dev/archlette';
import { readFile, writeFile } from 'node:fs/promises';
import { execa } from 'execa';

export default async function svgRenderer(
  ctx: PipelineContext,
  node: ResolvedStageNode,
): Promise<{ outputs: string[] }> {
  const dslPath = ctx.config?.paths.dsl_out;
  const outputDir = ctx.config?.paths.render_out;

  if (!dslPath || !outputDir) {
    throw new Error('Configuration missing dsl_out or render_out paths');
  }

  // Read DSL
  const dsl = await readFile(dslPath, 'utf-8');

  // Convert to SVG (example using PlantUML)
  const { stdout } = await execa('plantuml', ['-tsvg', '-pipe'], {
    input: dsl,
  });

  // Write output
  const outputPath = `${outputDir}/diagram.svg`;
  await writeFile(outputPath, stdout);

  return {
    outputs: [outputPath],
  };
}
```

---

## Example: Mermaid Renderer

```typescript
import type { PipelineContext, ResolvedStageNode } from '@chrislyons-dev/archlette';
import { readFile, writeFile } from 'node:fs/promises';
import { execa } from 'execa';

export default async function mermaidRenderer(
  ctx: PipelineContext,
  node: ResolvedStageNode,
): Promise<{ outputs: string[] }> {
  const dslPath = ctx.config?.paths.dsl_out;
  const outputDir = ctx.config?.paths.render_out;

  if (!dslPath || !outputDir) {
    throw new Error('Configuration missing paths');
  }

  // Read Mermaid DSL
  const mermaid = await readFile(dslPath, 'utf-8');

  // Render using mermaid-cli (mmdc)
  const outputPath = `${outputDir}/diagram.png`;

  await execa('mmdc', ['-i', dslPath, '-o', outputPath, '-b', 'transparent']);

  return {
    outputs: [outputPath],
  };
}
```

---

## Example: Multi-Format Renderer

```typescript
import type { PipelineContext, ResolvedStageNode } from '@chrislyons-dev/archlette';
import { readFile, writeFile } from 'node:fs/promises';
import { execa } from 'execa';

export default async function multiFormatRenderer(
  ctx: PipelineContext,
  node: ResolvedStageNode,
): Promise<{ outputs: string[] }> {
  const dslPath = ctx.config?.paths.dsl_out;
  const outputDir = ctx.config?.paths.render_out;

  if (!dslPath || !outputDir) {
    throw new Error('Configuration missing paths');
  }

  const outputs: string[] = [];

  // Render to PNG
  await execa('plantuml', ['-tpng', dslPath, '-o', outputDir]);
  outputs.push(`${outputDir}/diagram.png`);

  // Render to SVG
  await execa('plantuml', ['-tsvg', dslPath, '-o', outputDir]);
  outputs.push(`${outputDir}/diagram.svg`);

  // Render to PDF
  await execa('plantuml', ['-tpdf', dslPath, '-o', outputDir]);
  outputs.push(`${outputDir}/diagram.pdf`);

  return { outputs };
}
```

---

## Using Custom Renderers

Reference in config:

```yaml
renderers:
  - use: renderers/builtin/structurizr-export # DSL → PlantUML
  - use: renderers/builtin/plantuml-render # PlantUML → PNG
  - use: ./custom/svg-renderer # Custom SVG renderer
```

Renderers run sequentially. Order matters.

**Typical chain:**

1. Export DSL to PlantUML
2. Render PlantUML to images

---

## Tool Management

Use `ToolManager` for external tools:

```typescript
import { ToolManager } from '@chrislyons-dev/archlette/core/tool-manager';
import type { PipelineContext, ResolvedStageNode } from '@chrislyons-dev/archlette';

export default async function toolRenderer(
  ctx: PipelineContext,
  node: ResolvedStageNode,
): Promise<{ outputs: string[] }> {
  const toolManager = new ToolManager(ctx.log);

  // Download tool if needed
  const toolPath = await toolManager.ensureTool('plantuml', {
    url: 'https://github.com/plantuml/plantuml/releases/download/v1.2025.8/plantuml-1.2025.8.jar',
    version: '1.2025.8',
  });

  // Use tool
  // ... render logic

  return { outputs: [] };
}
```

**Built-in renderers** use this pattern. See `src/renderers/builtin/plantuml-render.ts`.

---

## Pipeline Context

Access shared state via `ctx`:

```typescript
// Configuration
const config = ctx.config;
const projectName = config?.project.name;

// Logging
ctx.log.info('Starting render...');
ctx.log.error('Render failed:', error);

// Shared state (advanced)
const ir = ctx.state.ir as ArchletteIR;
const dslContent = ctx.state.dslContent as string;
```

---

## Best Practices

**Validate paths** — Check `dsl_out` and `render_out` exist.

**Handle tool errors** — Wrap `execa` calls in try-catch.

**Log progress** — Use `ctx.log` for visibility.

**Clean up** — Remove temporary files.

**Return all outputs** — List every file created.

**Check tool availability** — Verify external tools before use.

---

## Common Patterns

**Checking tool availability:**

```typescript
import { which } from 'execa';

try {
  await which('plantuml');
} catch {
  throw new Error('PlantUML not found. Install with: brew install plantuml');
}
```

**Creating output directory:**

```typescript
import { mkdir } from 'node:fs/promises';

await mkdir(outputDir, { recursive: true });
```

**Processing multiple files:**

```typescript
import { glob } from 'globby';

const dslFiles = await glob(`${dslDir}/*.dsl`);

for (const dslFile of dslFiles) {
  const outputPath = dslFile.replace('.dsl', '.png');
  await renderFile(dslFile, outputPath);
  outputs.push(outputPath);
}
```

**Error handling:**

```typescript
try {
  await execa('plantuml', ['-tpng', dslPath]);
} catch (error) {
  ctx.log.error(`PlantUML failed: ${error.message}`);
  throw new Error('Rendering failed. Check PlantUML installation.');
}
```

---

## Sequential Rendering

Renderers execute in order. Use for chained transformations:

```yaml
renderers:
  # Step 1: Export DSL to PlantUML format
  - use: renderers/builtin/structurizr-export

  # Step 2: Render PlantUML to images
  - use: renderers/builtin/plantuml-render
```

First renderer produces intermediate format. Second renderer consumes it.

---

## Configuration Options

Custom renderers can accept options via `node.config`:

```yaml
renderers:
  - use: ./custom/plantuml-renderer
    config:
      format: png
      scale: 2
      theme: dark
```

Access in renderer:

```typescript
const format = node.config?.format ?? 'png';
const scale = node.config?.scale ?? 1;
const theme = node.config?.theme ?? 'light';
```

---

## See Also

- [Configuration](../guide/configuration.md) — Using custom renderers
- [PlantUML Renderer](../../src/renderers/builtin/plantuml-render.ts) — Reference implementation
- [Tool Manager](../../src/core/tool-manager.ts) — Managing external tools
