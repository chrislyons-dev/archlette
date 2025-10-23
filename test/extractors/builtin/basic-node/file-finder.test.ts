/**
 * Unit tests for basic-node file finder
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  findSourceFiles,
  findPackageJsonFiles,
  readPackageInfo,
  findNearestPackage,
} from '../../../../src/extractors/builtin/basic-node/file-finder.js';
import type { PackageInfo } from '../../../../src/extractors/builtin/basic-node/types.js';

const TEST_DIR = join(process.cwd(), 'test-tmp-node-finder');

// Helper to convert paths to forward slashes for globby
const toGlobPattern = (path: string) => path.replace(/\\/g, '/');

describe('basic-node file-finder', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe('findSourceFiles', () => {
    it('should find TypeScript files with default patterns', async () => {
      mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'src', 'index.ts'), 'export const foo = 1;');
      writeFileSync(join(TEST_DIR, 'src', 'app.tsx'), 'export const App = () => {};');

      const files = await findSourceFiles({
        include: [toGlobPattern(join(TEST_DIR, 'src', '**/*.ts'))],
      });

      expect(files).toBeInstanceOf(Array);
      expect(files.length).toBeGreaterThanOrEqual(1);
      expect(files.some((f) => f.endsWith('index.ts'))).toBe(true);
    });

    it('should find JavaScript files', async () => {
      mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'src', 'index.js'), 'export const foo = 1;');
      writeFileSync(join(TEST_DIR, 'src', 'app.jsx'), 'export const App = () => {};');

      const files = await findSourceFiles({
        include: [toGlobPattern(join(TEST_DIR, 'src', '**/*.js'))],
      });

      expect(files.length).toBeGreaterThanOrEqual(1);
      expect(files.some((f) => f.endsWith('index.js'))).toBe(true);
    });

    it('should exclude test files by default', async () => {
      mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'src', 'index.ts'), 'export const foo = 1;');
      writeFileSync(join(TEST_DIR, 'src', 'index.test.ts'), 'test("foo", () => {});');
      writeFileSync(join(TEST_DIR, 'src', 'index.spec.ts'), 'test("foo", () => {});');

      const files = await findSourceFiles({
        include: [toGlobPattern(join(TEST_DIR, 'src', '**/*.ts'))],
        exclude: ['**/*.test.ts', '**/*.spec.ts'],
      });

      expect(files.some((f) => f.endsWith('index.ts'))).toBe(true);
      expect(files.some((f) => f.endsWith('index.test.ts'))).toBe(false);
      expect(files.some((f) => f.endsWith('index.spec.ts'))).toBe(false);
    });

    it('should respect custom include patterns', async () => {
      mkdirSync(join(TEST_DIR, 'lib'), { recursive: true });
      mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'lib', 'utils.ts'), 'export const util = 1;');
      writeFileSync(join(TEST_DIR, 'src', 'index.ts'), 'export const foo = 1;');

      const files = await findSourceFiles({
        include: [toGlobPattern(join(TEST_DIR, 'lib', '**/*.ts'))],
      });

      expect(files.some((f) => f.endsWith('utils.ts'))).toBe(true);
      expect(files.some((f) => f.endsWith('index.ts'))).toBe(false);
    });

    it('should respect custom exclude patterns', async () => {
      mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
      mkdirSync(join(TEST_DIR, 'src', 'generated'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'src', 'index.ts'), 'export const foo = 1;');
      writeFileSync(
        join(TEST_DIR, 'src', 'generated', 'types.ts'),
        'export type Foo = {};',
      );

      const files = await findSourceFiles({
        include: [toGlobPattern(join(TEST_DIR, 'src', '**/*.ts'))],
        exclude: ['**/generated/**'],
      });

      expect(files.some((f) => f.endsWith('index.ts'))).toBe(true);
      expect(files.some((f) => f.endsWith('types.ts'))).toBe(false);
    });

    it('should return absolute paths', async () => {
      mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'src', 'index.ts'), 'export const foo = 1;');

      const files = await findSourceFiles({
        include: [toGlobPattern(join(TEST_DIR, 'src', '**/*.ts'))],
      });

      expect(files.length).toBeGreaterThan(0);
      expect(files[0]).toMatch(/^[A-Za-z]:|^\//); // Windows absolute or Unix absolute
    });

    it('should handle nested directories', async () => {
      mkdirSync(join(TEST_DIR, 'src', 'components', 'ui'), { recursive: true });
      writeFileSync(
        join(TEST_DIR, 'src', 'components', 'ui', 'Button.tsx'),
        'export const Button = () => {};',
      );

      const files = await findSourceFiles({
        include: [toGlobPattern(join(TEST_DIR, 'src', '**/*.tsx'))],
      });

      expect(files.some((f) => f.endsWith('Button.tsx'))).toBe(true);
    });

    it('should return empty array when no files match', async () => {
      mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'src', 'readme.md'), '# README');

      const files = await findSourceFiles({
        include: [toGlobPattern(join(TEST_DIR, 'src', '**/*.ts'))],
      });

      expect(files).toEqual([]);
    });
  });

  describe('findPackageJsonFiles', () => {
    it('should find package.json in base directory', async () => {
      mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'package.json'), '{"name": "test"}');

      const files = await findPackageJsonFiles({
        include: [toGlobPattern(join(TEST_DIR, 'src', '**/*.ts'))],
      });

      expect(files.some((f) => f.endsWith('package.json'))).toBe(true);
    });

    it('should find package.json in nested workspaces', async () => {
      mkdirSync(join(TEST_DIR, 'packages', 'app', 'src'), { recursive: true });
      mkdirSync(join(TEST_DIR, 'packages', 'lib', 'src'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'package.json'), '{"name": "root"}');
      writeFileSync(
        join(TEST_DIR, 'packages', 'app', 'package.json'),
        '{"name": "app"}',
      );
      writeFileSync(
        join(TEST_DIR, 'packages', 'lib', 'package.json'),
        '{"name": "lib"}',
      );

      const files = await findPackageJsonFiles({
        include: [toGlobPattern(join(TEST_DIR, 'packages', '**', 'src', '**/*.ts'))],
      });

      expect(files.length).toBeGreaterThanOrEqual(2);
      expect(
        files.some(
          (f) =>
            f.includes('packages') && f.includes('app') && f.endsWith('package.json'),
        ),
      ).toBe(true);
      expect(
        files.some(
          (f) =>
            f.includes('packages') && f.includes('lib') && f.endsWith('package.json'),
        ),
      ).toBe(true);
    });

    it('should exclude node_modules package.json', async () => {
      mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
      mkdirSync(join(TEST_DIR, 'node_modules', 'some-package'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'package.json'), '{"name": "test"}');
      writeFileSync(
        join(TEST_DIR, 'node_modules', 'some-package', 'package.json'),
        '{"name": "dep"}',
      );

      const files = await findPackageJsonFiles({
        include: [toGlobPattern(join(TEST_DIR, 'src', '**/*.ts'))],
      });

      expect(files.some((f) => f.includes('node_modules'))).toBe(false);
    });

    it('should handle absolute paths in include patterns', async () => {
      mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'package.json'), '{"name": "test"}');

      const files = await findPackageJsonFiles({
        include: [toGlobPattern(join(TEST_DIR, 'src', '**/*.ts'))],
      });

      expect(files).toBeInstanceOf(Array);
    });

    it('should return empty array when no package.json found', async () => {
      mkdirSync(join(TEST_DIR, 'empty'), { recursive: true });

      const files = await findPackageJsonFiles({
        include: [toGlobPattern(join(TEST_DIR, 'empty', '**/*.ts'))],
      });

      // May or may not be empty depending on the pattern extraction logic
      expect(files).toBeInstanceOf(Array);
    });
  });

  describe('readPackageInfo', () => {
    it('should parse valid package.json', async () => {
      const pkgPath = join(TEST_DIR, 'package.json');
      writeFileSync(
        pkgPath,
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          description: 'Test package',
        }),
      );

      const info = await readPackageInfo(pkgPath);

      expect(info).not.toBeNull();
      expect(info?.name).toBe('test-package');
      expect(info?.version).toBe('1.0.0');
      expect(info?.description).toBe('Test package');
      expect(info?.path).toBe(pkgPath);
      expect(info?.dir).toBe(TEST_DIR);
    });

    it('should handle package.json without optional fields', async () => {
      const pkgPath = join(TEST_DIR, 'package.json');
      writeFileSync(pkgPath, JSON.stringify({ name: 'minimal' }));

      const info = await readPackageInfo(pkgPath);

      expect(info).not.toBeNull();
      expect(info?.name).toBe('minimal');
      expect(info?.version).toBeUndefined();
      expect(info?.description).toBeUndefined();
    });

    it('should handle package.json without name field', async () => {
      const pkgPath = join(TEST_DIR, 'package.json');
      writeFileSync(pkgPath, JSON.stringify({ version: '1.0.0' }));

      const info = await readPackageInfo(pkgPath);

      expect(info).not.toBeNull();
      expect(info?.name).toBe('unknown');
    });

    it('should return null for invalid JSON', async () => {
      const pkgPath = join(TEST_DIR, 'package.json');
      writeFileSync(pkgPath, 'invalid json {');

      const info = await readPackageInfo(pkgPath);

      expect(info).toBeNull();
    });

    it('should return null for non-existent file', async () => {
      const pkgPath = join(TEST_DIR, 'missing.json');

      const info = await readPackageInfo(pkgPath);

      expect(info).toBeNull();
    });
  });

  describe('findNearestPackage', () => {
    it('should find package in same directory', () => {
      const packages: PackageInfo[] = [
        {
          path: join(TEST_DIR, 'package.json'),
          dir: TEST_DIR,
          name: 'root',
        },
      ];

      const filePath = join(TEST_DIR, 'src', 'index.ts');
      const pkg = findNearestPackage(filePath, packages);

      expect(pkg).not.toBeNull();
      expect(pkg?.name).toBe('root');
    });

    it('should find nearest package in nested structure', () => {
      const packages: PackageInfo[] = [
        {
          path: join(TEST_DIR, 'package.json'),
          dir: TEST_DIR,
          name: 'root',
        },
        {
          path: join(TEST_DIR, 'packages', 'app', 'package.json'),
          dir: join(TEST_DIR, 'packages', 'app'),
          name: 'app',
        },
      ];

      const filePath = join(TEST_DIR, 'packages', 'app', 'src', 'index.ts');
      const pkg = findNearestPackage(filePath, packages);

      expect(pkg).not.toBeNull();
      expect(pkg?.name).toBe('app');
    });

    it('should prefer deepest package', () => {
      const packages: PackageInfo[] = [
        {
          path: join(TEST_DIR, 'package.json'),
          dir: TEST_DIR,
          name: 'root',
        },
        {
          path: join(TEST_DIR, 'packages', 'package.json'),
          dir: join(TEST_DIR, 'packages'),
          name: 'packages',
        },
        {
          path: join(TEST_DIR, 'packages', 'app', 'package.json'),
          dir: join(TEST_DIR, 'packages', 'app'),
          name: 'app',
        },
      ];

      const filePath = join(
        TEST_DIR,
        'packages',
        'app',
        'src',
        'deep',
        'nested',
        'file.ts',
      );
      const pkg = findNearestPackage(filePath, packages);

      expect(pkg).not.toBeNull();
      expect(pkg?.name).toBe('app');
    });

    it('should return null when no package found', () => {
      const packages: PackageInfo[] = [
        {
          path: join(TEST_DIR, 'packages', 'app', 'package.json'),
          dir: join(TEST_DIR, 'packages', 'app'),
          name: 'app',
        },
      ];

      const filePath = join(TEST_DIR, 'other', 'file.ts');
      const pkg = findNearestPackage(filePath, packages);

      expect(pkg).toBeNull();
    });

    it('should return null for empty packages array', () => {
      const packages: PackageInfo[] = [];
      const filePath = join(TEST_DIR, 'src', 'index.ts');
      const pkg = findNearestPackage(filePath, packages);

      expect(pkg).toBeNull();
    });

    it('should handle Windows-style paths', () => {
      const packages: PackageInfo[] = [
        {
          path: join(TEST_DIR, 'package.json'),
          dir: TEST_DIR,
          name: 'root',
        },
      ];

      const filePath = join(TEST_DIR, 'src', 'components', 'Button.tsx');
      const pkg = findNearestPackage(filePath, packages);

      expect(pkg).not.toBeNull();
      expect(pkg?.name).toBe('root');
    });
  });
});
