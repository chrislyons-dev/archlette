import { describe, it, expect } from 'vitest';
import { runGenerate } from '../../../src/core/run.js';
import { loadConfig } from '../../../src/core/config.js';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = path.resolve('tests/integration/archlette-minimal');

async function fileExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

describe('Archlette Minimal Integration Fixture', () => {
  it('runs full pipeline successfully', async () => {
    const prevCwd = process.cwd();
    process.chdir(base); // run inside the fixture
    try {
      // 1) Load the fixture config (reads ./aac.yaml in base)
      const cfg = await loadConfig();

      // 2) IR-only first (easier to debug pathing)
      await runGenerate(cfg, { irOnly: true });

      // 3) Assert IR exists in fixture (fallback to repo root if needed)
      const irInFixture = path.join(base, '.archlette/ir.json');
      const irInRoot = path.resolve(prevCwd, '.archlette/ir.json');
      const hasFixtureIR = await fileExists(irInFixture);
      const hasRootIR = await fileExists(irInRoot);
      expect(hasFixtureIR || hasRootIR).toBeTruthy();

      // 4) Now run full pipeline (generators)
      await runGenerate(cfg, { irOnly: false });

      // 5) Assert Mermaid file was generated in fixture docs dir
      const outDir = path.join(base, 'docs/architecture');
      const files = await fs.readdir(outDir);
      const mermaidFile = files.find(
        (f) => f.endsWith('.mmd') || f.endsWith('.mermaid'),
      );
      expect(mermaidFile).toBeTruthy();
    } finally {
      process.chdir(prevCwd);
    }
  });
});
