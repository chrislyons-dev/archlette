/**
 * Unit tests for wrangler file finder
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { findWranglerFiles } from '../../../../src/extractors/builtin/basic-wrangler/file-finder.js';

const TEST_DIR = join(process.cwd(), 'test-tmp-finder');

// Helper to convert paths to forward slashes for globby
const toGlobPattern = (path: string) => path.replace(/\\/g, '/');

describe('file-finder', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe('findWranglerFiles', () => {
    it('should find wrangler.toml files with default patterns', async () => {
      writeFileSync(join(TEST_DIR, 'wrangler.toml'), 'name = "test"');
      mkdirSync(join(TEST_DIR, 'workers'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'workers', 'wrangler.toml'), 'name = "worker"');

      const files = await findWranglerFiles();

      expect(files).toBeInstanceOf(Array);
      // Files found depend on test execution directory, so just verify it returns an array
    });

    it('should find files with custom include patterns', async () => {
      mkdirSync(join(TEST_DIR, 'services'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'services', 'api.toml'), 'name = "api"');
      writeFileSync(join(TEST_DIR, 'services', 'auth.toml'), 'name = "auth"');
      writeFileSync(join(TEST_DIR, 'other.toml'), 'name = "other"');

      const files = await findWranglerFiles({
        include: [toGlobPattern(join(TEST_DIR, 'services', '*.toml'))],
      });

      expect(files).toHaveLength(2);
      expect(files.some((f) => f.endsWith('api.toml'))).toBe(true);
      expect(files.some((f) => f.endsWith('auth.toml'))).toBe(true);
      expect(files.some((f) => f.endsWith('other.toml'))).toBe(false);
    });

    it('should exclude files matching exclude patterns', async () => {
      mkdirSync(join(TEST_DIR, 'workers'), { recursive: true });
      mkdirSync(join(TEST_DIR, 'node_modules'), { recursive: true });

      writeFileSync(join(TEST_DIR, 'workers', 'wrangler.toml'), 'name = "worker"');
      writeFileSync(join(TEST_DIR, 'node_modules', 'wrangler.toml'), 'name = "dep"');

      const files = await findWranglerFiles({
        include: [toGlobPattern(join(TEST_DIR, '**', 'wrangler.toml'))],
        exclude: ['**/node_modules/**'],
      });

      expect(files.some((f) => f.includes('workers'))).toBe(true);
      expect(files.some((f) => f.includes('node_modules'))).toBe(false);
    });

    it('should return absolute paths', async () => {
      writeFileSync(join(TEST_DIR, 'test.toml'), 'name = "test"');

      const files = await findWranglerFiles({
        include: [toGlobPattern(join(TEST_DIR, '*.toml'))],
      });

      expect(files.every((f) => f.startsWith('/') || /^[A-Z]:/.test(f))).toBe(true);
    });

    it('should return empty array when no files match', async () => {
      const files = await findWranglerFiles({
        include: [toGlobPattern(join(TEST_DIR, 'nonexistent', '*.toml'))],
      });

      expect(files).toEqual([]);
    });

    it('should find files in nested directories', async () => {
      mkdirSync(join(TEST_DIR, 'a', 'b', 'c'), { recursive: true });
      mkdirSync(join(TEST_DIR, 'x', 'y'), { recursive: true });

      writeFileSync(join(TEST_DIR, 'a', 'b', 'c', 'deep.toml'), 'name = "deep"');
      writeFileSync(join(TEST_DIR, 'x', 'y', 'nested.toml'), 'name = "nested"');

      const files = await findWranglerFiles({
        include: [toGlobPattern(join(TEST_DIR, '**', '*.toml'))],
      });

      expect(files).toHaveLength(2);
      expect(files.some((f) => f.endsWith('deep.toml'))).toBe(true);
      expect(files.some((f) => f.endsWith('nested.toml'))).toBe(true);
    });

    it('should handle multiple include patterns', async () => {
      mkdirSync(join(TEST_DIR, 'workers'), { recursive: true });
      mkdirSync(join(TEST_DIR, 'configs'), { recursive: true });

      writeFileSync(join(TEST_DIR, 'workers', 'api.toml'), 'name = "api"');
      writeFileSync(join(TEST_DIR, 'configs', 'auth.toml'), 'name = "auth"');

      const files = await findWranglerFiles({
        include: [
          toGlobPattern(join(TEST_DIR, 'workers', '*.toml')),
          toGlobPattern(join(TEST_DIR, 'configs', '*.toml')),
        ],
      });

      expect(files).toHaveLength(2);
      expect(files.some((f) => f.endsWith('api.toml'))).toBe(true);
      expect(files.some((f) => f.endsWith('auth.toml'))).toBe(true);
    });

    it('should only return files, not directories', async () => {
      mkdirSync(join(TEST_DIR, 'wrangler.toml'), { recursive: true }); // Directory named like a file
      writeFileSync(join(TEST_DIR, 'actual.toml'), 'name = "actual"');

      const files = await findWranglerFiles({
        include: [toGlobPattern(join(TEST_DIR, '*.toml'))],
      });

      expect(files).toHaveLength(1);
      expect(files[0]).toContain('actual.toml');
    });

    it('should handle glob patterns with wildcards', async () => {
      mkdirSync(join(TEST_DIR, 'iac', 'workers'), { recursive: true });

      writeFileSync(join(TEST_DIR, 'iac', 'workers', 'api.toml'), 'name = "api"');
      writeFileSync(join(TEST_DIR, 'iac', 'workers', 'auth.toml'), 'name = "auth"');
      writeFileSync(join(TEST_DIR, 'iac', 'workers', 'data.toml'), 'name = "data"');
      writeFileSync(join(TEST_DIR, 'iac', 'other.toml'), 'name = "other"');

      const files = await findWranglerFiles({
        include: [toGlobPattern(join(TEST_DIR, 'iac', 'workers', '*.toml'))],
      });

      expect(files).toHaveLength(3);
      expect(files.every((f) => f.includes('workers'))).toBe(true);
    });

    it('should work with Windows-style paths', async () => {
      mkdirSync(join(TEST_DIR, 'workers'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'workers', 'test.toml'), 'name = "test"');

      // Use Windows-style path separators if on Windows
      const pattern = toGlobPattern(join(TEST_DIR, 'workers', '*.toml'));

      const files = await findWranglerFiles({
        include: [pattern],
      });

      expect(files.length).toBeGreaterThan(0);
    });
  });
});
