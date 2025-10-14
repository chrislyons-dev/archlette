import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';

// These imports assume you have the extractor bundle wired in your project:
import { aggregateIR } from '../src/ir/aggregate.js';
import { registry } from '../src/extractors/index.js';
import { runGenerate } from '../src/core/run.js';

const repoRoot = process.cwd();

const cfgBase = {
  project: { name: 'Archlette Test Project' },
  docs: { out_dir: 'docs/architecture' },
  ir: { path: '.archlette/ir.json', publish_copy: false },
};

describe('Archlette extractor integration', () => {
  it('builds IR from Terraform + Code + OpenAPI and writes to .archlette/ir.json', async () => {
    const cfg = {
      ...cfgBase,
      extractors: [
        {
          use: 'builtin/terraform',
          name: 'tf',
          inputs: { include: ['tests/fixtures/iac/**'] },
        },
        {
          use: 'builtin/code-annotations',
          name: 'code',
          inputs: { include: ['tests/fixtures/**'] },
        },
        {
          use: 'builtin/openapi',
          name: 'api',
          inputs: { include: ['tests/fixtures/apis/**'] },
        },
      ],
    };

    const ir = await aggregateIR(cfg, repoRoot, registry);
    expect(ir).toBeTruthy();
    expect(Array.isArray(ir.entities)).toBe(true);
    // spot-check entities
    const ids = ir.entities.map((e) => e.id);
    expect(ids.find((id) => id.startsWith('infra:'))).toBeTruthy();
    expect(ids).toContain('container:api');
    expect(ids).toContain('container:worker');
    expect(ids).toContain('api:bond-math-api');

    // file was written
    const irPath = path.resolve(repoRoot, cfg.ir.path);
    const stat = await fs.stat(irPath);
    expect(stat.size).toBeGreaterThan(2);
  });

  it('runs full pipeline via runGenerate and emits a Mermaid file using C4 mapping', async () => {
    const cfg = {
      ...cfgBase,
      generators: [{ kind: 'mermaid-c4', levels: ['C1', 'C2'] }],
      extractors: [
        {
          use: 'builtin/terraform',
          name: 'tf',
          inputs: { include: ['tests/fixtures/iac/**'] },
        },
        {
          use: 'builtin/code-annotations',
          name: 'code',
          inputs: { include: ['tests/fixtures/**'] },
        },
        {
          use: 'builtin/openapi',
          name: 'api',
          inputs: { include: ['tests/fixtures/apis/**'] },
        },
      ],
      tools: { mermaid: { enabled: false } }, // skip actual rendering; test generation only
    };

    await runGenerate(cfg, { irOnly: false });

    const outDir = path.resolve(repoRoot, cfg.docs.out_dir);
    // Find a mermaid output file
    const files = await fs.readdir(outDir);
    const mmd = files.find((f) => f.endsWith('.mmd') || f.endsWith('.mermaid'));
    expect(mmd).toBeTruthy();

    const mmdText = await fs.readFile(path.join(outDir, mmd), 'utf8');
    expect(mmdText).toContain('flowchart TD');
    // API entities projected as Containers:
    expect(mmdText).toMatch(/HTTP API \(OpenAPI\)/);
  });
});
