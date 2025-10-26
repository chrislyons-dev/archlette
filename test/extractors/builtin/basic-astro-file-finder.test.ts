/**
 * Tests for basic-astro file finder
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  findSourceFiles,
  findPackageJsonFiles,
  readPackageInfo,
  findNearestPackage,
} from '../../../src/extractors/builtin/basic-astro/file-finder.js';

describe('basic-astro file finder', () => {
  const testDir = join(process.cwd(), 'test-temp-astro');

  beforeAll(() => {
    // Create test directory structure
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, 'src', 'components'), { recursive: true });
    mkdirSync(join(testDir, 'src', 'layouts'), { recursive: true });
    mkdirSync(join(testDir, 'src', 'pages'), { recursive: true });
    mkdirSync(join(testDir, 'packages', 'ui', 'src'), { recursive: true });

    // Create some Astro files
    writeFileSync(
      join(testDir, 'src', 'components', 'Button.astro'),
      `---
const { text } = Astro.props;
---
<button>{text}</button>`,
    );

    writeFileSync(
      join(testDir, 'src', 'layouts', 'Layout.astro'),
      `---
const { title } = Astro.props;
---
<html>
  <head><title>{title}</title></head>
  <body><slot /></body>
</html>`,
    );

    writeFileSync(
      join(testDir, 'src', 'pages', 'index.astro'),
      `---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Home">
  <h1>Welcome</h1>
</Layout>`,
    );

    // Create package.json files
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        name: 'my-astro-project',
        version: '1.0.0',
        description: 'A test Astro project',
      }),
    );

    writeFileSync(
      join(testDir, 'packages', 'ui', 'package.json'),
      JSON.stringify({
        name: '@test/ui',
        version: '0.1.0',
        description: 'UI components package',
      }),
    );

    writeFileSync(
      join(testDir, 'packages', 'ui', 'src', 'Card.astro'),
      `---
const { title } = Astro.props;
---
<div class="card">
  <h2>{title}</h2>
  <slot />
</div>`,
    );
  });

  afterAll(() => {
    // Clean up
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('findSourceFiles', () => {
    it('should find all .astro files', async () => {
      // Normalize paths for cross-platform compatibility
      const pattern = join(testDir, '**/*.astro').replace(/\\/g, '/');

      const files = await findSourceFiles({
        include: [pattern],
        exclude: ['**/node_modules/**'],
      });

      expect(files.length).toBeGreaterThanOrEqual(4);
      expect(files.some((f) => f.includes('Button.astro'))).toBe(true);
      expect(files.some((f) => f.includes('Layout.astro'))).toBe(true);
      expect(files.some((f) => f.includes('index.astro'))).toBe(true);
      expect(files.some((f) => f.includes('Card.astro'))).toBe(true);
    });

    it('should respect exclude patterns', async () => {
      const pattern = join(testDir, '**/*.astro').replace(/\\/g, '/');
      const excludePattern = join(testDir, 'packages/**').replace(/\\/g, '/');

      const files = await findSourceFiles({
        include: [pattern],
        exclude: [excludePattern],
      });

      expect(files.length).toBeGreaterThanOrEqual(3);
      expect(files.some((f) => f.includes('Card.astro'))).toBe(false);
    });

    it('should return empty array when no files match', async () => {
      const pattern = join(testDir, 'nonexistent/**/*.astro').replace(/\\/g, '/');

      const files = await findSourceFiles({
        include: [pattern],
        exclude: [],
      });

      expect(files).toHaveLength(0);
    });
  });

  describe('findPackageJsonFiles', () => {
    it('should find package.json files', async () => {
      const pattern = join(testDir, '**/*.astro').replace(/\\/g, '/');

      const files = await findPackageJsonFiles({
        include: [pattern],
      });

      expect(files.length).toBeGreaterThanOrEqual(1);
      // Files should be absolute paths to package.json
      files.forEach((f) => {
        expect(f).toMatch(/package\.json$/);
      });
    });
  });

  describe('readPackageInfo', () => {
    it('should read and parse package.json', async () => {
      const pkgPath = join(testDir, 'package.json');
      const info = await readPackageInfo(pkgPath);

      expect(info).not.toBeNull();
      expect(info?.name).toBe('my-astro-project');
      expect(info?.version).toBe('1.0.0');
      expect(info?.description).toBe('A test Astro project');
      expect(info?.dir).toBe(testDir);
    });

    it('should return null for non-existent package.json', async () => {
      const info = await readPackageInfo('/nonexistent/package.json');
      expect(info).toBeNull();
    });

    it('should return null for invalid JSON', async () => {
      const badPkgPath = join(testDir, 'bad-package.json');
      writeFileSync(badPkgPath, 'invalid json{]');

      const info = await readPackageInfo(badPkgPath);
      expect(info).toBeNull();
    });
  });

  describe('findNearestPackage', () => {
    it('should find the nearest parent package.json', async () => {
      const packages = [
        await readPackageInfo(join(testDir, 'package.json')),
        await readPackageInfo(join(testDir, 'packages', 'ui', 'package.json')),
      ].filter((p): p is NonNullable<typeof p> => p !== null);

      const buttonFile = join(testDir, 'src', 'components', 'Button.astro');
      const nearest = findNearestPackage(buttonFile, packages);

      expect(nearest).not.toBeNull();
      expect(nearest?.name).toBe('my-astro-project');
    });

    it('should find package in nested directories', async () => {
      const packages = [
        await readPackageInfo(join(testDir, 'package.json')),
        await readPackageInfo(join(testDir, 'packages', 'ui', 'package.json')),
      ].filter((p): p is NonNullable<typeof p> => p !== null);

      const cardFile = join(testDir, 'packages', 'ui', 'src', 'Card.astro');
      const nearest = findNearestPackage(cardFile, packages);

      expect(nearest).not.toBeNull();
      expect(nearest?.name).toBe('@test/ui');
    });

    it('should return null when no package is found', () => {
      const packages: any[] = [];
      const file = join(testDir, 'src', 'components', 'Button.astro');
      const nearest = findNearestPackage(file, packages);

      expect(nearest).toBeNull();
    });
  });
});
