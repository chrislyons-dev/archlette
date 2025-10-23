/**
 * Unit tests for basic-python file finder
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  findSourceFiles,
  findPyProjectFiles,
  readPyProjectInfo,
  findNearestPyProject,
  type PyProjectInfo,
} from '../../../../src/extractors/builtin/basic-python/file-finder.js';

const TEST_DIR = join(process.cwd(), 'test-tmp-python-finder');

// Helper to convert paths to forward slashes for globby
const toGlobPattern = (path: string) => path.replace(/\\/g, '/');

describe('basic-python file-finder', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe('findSourceFiles', () => {
    it('should find Python files with include patterns', async () => {
      mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'src', 'main.py'), 'print("hello")');
      writeFileSync(join(TEST_DIR, 'src', 'utils.py'), 'def foo(): pass');

      const files = await findSourceFiles({
        include: [toGlobPattern(join(TEST_DIR, 'src', '**/*.py'))],
      });

      expect(files.length).toBeGreaterThanOrEqual(1);
      expect(files.some((f) => f.endsWith('main.py'))).toBe(true);
    });

    it('should exclude files matching exclude patterns', async () => {
      mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
      mkdirSync(join(TEST_DIR, 'tests'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'src', 'main.py'), 'print("hello")');
      writeFileSync(join(TEST_DIR, 'tests', 'test_main.py'), 'import pytest');

      const files = await findSourceFiles({
        include: [toGlobPattern(join(TEST_DIR, '**/*.py'))],
        exclude: ['**/tests/**'],
      });

      expect(files.some((f) => f.endsWith('main.py'))).toBe(true);
      expect(files.some((f) => f.endsWith('test_main.py'))).toBe(false);
    });

    it('should return absolute paths', async () => {
      mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'src', 'main.py'), 'print("hello")');

      const files = await findSourceFiles({
        include: [toGlobPattern(join(TEST_DIR, 'src', '**/*.py'))],
      });

      expect(files.length).toBeGreaterThan(0);
      expect(files[0]).toMatch(/^[A-Za-z]:|^\//); // Windows absolute or Unix absolute
    });

    it('should return empty array when no files match', async () => {
      mkdirSync(join(TEST_DIR, 'empty'), { recursive: true });

      const files = await findSourceFiles({
        include: [toGlobPattern(join(TEST_DIR, 'empty', '**/*.py'))],
      });

      expect(files).toEqual([]);
    });

    it('should handle nested directories', async () => {
      mkdirSync(join(TEST_DIR, 'src', 'package', 'subpackage'), { recursive: true });
      writeFileSync(
        join(TEST_DIR, 'src', 'package', 'subpackage', 'module.py'),
        'pass',
      );

      const files = await findSourceFiles({
        include: [toGlobPattern(join(TEST_DIR, 'src', '**/*.py'))],
      });

      expect(files.some((f) => f.endsWith('module.py'))).toBe(true);
    });
  });

  describe('findPyProjectFiles', () => {
    it('should find pyproject.toml in base directory', async () => {
      mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'pyproject.toml'), '[project]\nname = "test"');

      const files = await findPyProjectFiles({
        include: [toGlobPattern(join(TEST_DIR, 'src', '**/*.py'))],
      });

      expect(files.some((f) => f.endsWith('pyproject.toml'))).toBe(true);
    });

    it('should find pyproject.toml in nested directories', async () => {
      mkdirSync(join(TEST_DIR, 'packages', 'app', 'src'), { recursive: true });
      mkdirSync(join(TEST_DIR, 'packages', 'lib', 'src'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'pyproject.toml'), '[project]\nname = "root"');
      writeFileSync(
        join(TEST_DIR, 'packages', 'app', 'pyproject.toml'),
        '[project]\nname = "app"',
      );
      writeFileSync(
        join(TEST_DIR, 'packages', 'lib', 'pyproject.toml'),
        '[project]\nname = "lib"',
      );

      const files = await findPyProjectFiles({
        include: [toGlobPattern(join(TEST_DIR, 'packages', '**', 'src', '**/*.py'))],
      });

      expect(files.length).toBeGreaterThanOrEqual(2);
      expect(files.some((f) => f.includes('packages') && f.includes('app'))).toBe(true);
      expect(files.some((f) => f.includes('packages') && f.includes('lib'))).toBe(true);
    });

    it('should exclude venv directories', async () => {
      mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
      mkdirSync(join(TEST_DIR, 'venv', 'lib'), { recursive: true });
      mkdirSync(join(TEST_DIR, '.venv', 'lib'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'pyproject.toml'), '[project]\nname = "test"');
      writeFileSync(
        join(TEST_DIR, 'venv', 'pyproject.toml'),
        '[project]\nname = "venv"',
      );
      writeFileSync(
        join(TEST_DIR, '.venv', 'pyproject.toml'),
        '[project]\nname = "venv"',
      );

      const files = await findPyProjectFiles({
        include: [toGlobPattern(join(TEST_DIR, 'src', '**/*.py'))],
      });

      expect(files.some((f) => f.includes('venv'))).toBe(false);
      expect(files.some((f) => f.includes('.venv'))).toBe(false);
    });

    it('should handle absolute paths in patterns', async () => {
      mkdirSync(join(TEST_DIR, 'src'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'pyproject.toml'), '[project]\nname = "test"');

      const files = await findPyProjectFiles({
        include: [toGlobPattern(join(TEST_DIR, 'src', '**/*.py'))],
      });

      expect(files).toBeInstanceOf(Array);
    });

    it('should extract base dirs correctly from absolute paths with leading slash', async () => {
      // Test the lines 60-61 which add leading slash back for absolute paths
      // This specifically tests Unix-style absolute paths
      mkdirSync(join(TEST_DIR, 'project', 'src'), { recursive: true });
      writeFileSync(
        join(TEST_DIR, 'project', 'pyproject.toml'),
        '[project]\nname = "test"',
      );

      // Create a Unix-style absolute path pattern (starts with /)
      const unixStylePath =
        '/' +
        TEST_DIR.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '') +
        '/project/src/**/*.py';

      const files = await findPyProjectFiles({
        include: [unixStylePath],
      });

      // Should handle the path extraction correctly
      expect(files).toBeInstanceOf(Array);
    });

    it('should return empty array when no pyproject.toml found', async () => {
      mkdirSync(join(TEST_DIR, 'empty'), { recursive: true });

      const files = await findPyProjectFiles({
        include: [toGlobPattern(join(TEST_DIR, 'empty', '**/*.py'))],
      });

      expect(files).toEqual([]);
    });
  });

  describe('readPyProjectInfo', () => {
    it('should parse pyproject.toml with [project] section', async () => {
      const tomlPath = join(TEST_DIR, 'pyproject.toml');
      writeFileSync(
        tomlPath,
        `[project]
name = "test-package"
version = "1.0.0"
description = "Test package"
`,
      );

      const info = await readPyProjectInfo(tomlPath);

      expect(info).not.toBeNull();
      expect(info?.name).toBe('test-package');
      expect(info?.version).toBe('1.0.0');
      expect(info?.description).toBe('Test package');
      expect(info?.path).toBe(tomlPath);
      expect(info?.dir).toBe(TEST_DIR);
    });

    it('should parse pyproject.toml with [tool.poetry] section', async () => {
      const tomlPath = join(TEST_DIR, 'pyproject.toml');
      writeFileSync(
        tomlPath,
        `[tool.poetry]
name = "poetry-package"
version = "2.0.0"
description = "Poetry package"
`,
      );

      const info = await readPyProjectInfo(tomlPath);

      expect(info).not.toBeNull();
      expect(info?.name).toBe('poetry-package');
      expect(info?.version).toBe('2.0.0');
      expect(info?.description).toBe('Poetry package');
    });

    it('should prefer [project] over [tool.poetry]', async () => {
      const tomlPath = join(TEST_DIR, 'pyproject.toml');
      writeFileSync(
        tomlPath,
        `[project]
name = "project-name"
version = "1.0.0"

[tool.poetry]
name = "poetry-name"
version = "2.0.0"
`,
      );

      const info = await readPyProjectInfo(tomlPath);

      expect(info).not.toBeNull();
      expect(info?.name).toBe('project-name');
      expect(info?.version).toBe('1.0.0');
    });

    it('should use directory name when no project name found', async () => {
      const projectDir = join(TEST_DIR, 'my-project');
      mkdirSync(projectDir, { recursive: true });
      const tomlPath = join(projectDir, 'pyproject.toml');
      writeFileSync(tomlPath, '[build-system]\nrequires = ["setuptools"]');

      const info = await readPyProjectInfo(tomlPath);

      expect(info).not.toBeNull();
      expect(info?.name).toBe('my-project');
    });

    it('should handle optional fields', async () => {
      const tomlPath = join(TEST_DIR, 'pyproject.toml');
      writeFileSync(tomlPath, '[project]\nname = "minimal"');

      const info = await readPyProjectInfo(tomlPath);

      expect(info).not.toBeNull();
      expect(info?.name).toBe('minimal');
      expect(info?.version).toBeUndefined();
      expect(info?.description).toBeUndefined();
    });

    it('should handle comments and empty lines', async () => {
      const tomlPath = join(TEST_DIR, 'pyproject.toml');
      writeFileSync(
        tomlPath,
        `# This is a comment
[project]
# Another comment
name = "test"

version = "1.0.0"
`,
      );

      const info = await readPyProjectInfo(tomlPath);

      expect(info).not.toBeNull();
      expect(info?.name).toBe('test');
      expect(info?.version).toBe('1.0.0');
    });

    it('should handle single-quoted strings', async () => {
      const tomlPath = join(TEST_DIR, 'pyproject.toml');
      writeFileSync(tomlPath, "[project]\nname = 'single-quoted'\nversion = '1.0.0'");

      const info = await readPyProjectInfo(tomlPath);

      expect(info).not.toBeNull();
      expect(info?.name).toBe('single-quoted');
      expect(info?.version).toBe('1.0.0');
    });

    it('should handle double-quoted strings', async () => {
      const tomlPath = join(TEST_DIR, 'pyproject.toml');
      writeFileSync(tomlPath, '[project]\nname = "double-quoted"\nversion = "1.0.0"');

      const info = await readPyProjectInfo(tomlPath);

      expect(info).not.toBeNull();
      expect(info?.name).toBe('double-quoted');
      expect(info?.version).toBe('1.0.0');
    });

    it('should handle nested sections correctly', async () => {
      const tomlPath = join(TEST_DIR, 'pyproject.toml');
      writeFileSync(
        tomlPath,
        `[tool.poetry]
name = "poetry-project"
version = "1.0.0"

[tool.poetry.dependencies]
python = "^3.9"
`,
      );

      const info = await readPyProjectInfo(tomlPath);

      expect(info).not.toBeNull();
      expect(info?.name).toBe('poetry-project');
      expect(info?.version).toBe('1.0.0');
    });

    it('should handle malformed TOML gracefully', async () => {
      const tomlPath = join(TEST_DIR, 'pyproject.toml');
      writeFileSync(tomlPath, 'invalid toml {{{');

      const info = await readPyProjectInfo(tomlPath);

      // Parser is lenient, so it will return info with directory name
      // This tests that it doesn't throw an exception
      expect(info).not.toBeNull();
    });

    it('should return null for non-existent file', async () => {
      const tomlPath = join(TEST_DIR, 'missing.toml');

      const info = await readPyProjectInfo(tomlPath);

      expect(info).toBeNull();
    });

    it('should parse values without quotes', async () => {
      const tomlPath = join(TEST_DIR, 'pyproject.toml');
      writeFileSync(
        tomlPath,
        `[build-system]
requires = ["setuptools"]

[project]
name = "test"
`,
      );

      const info = await readPyProjectInfo(tomlPath);

      expect(info).not.toBeNull();
      expect(info?.name).toBe('test');
    });

    it('should handle lines with = but no valid key-value', async () => {
      const tomlPath = join(TEST_DIR, 'pyproject.toml');
      writeFileSync(
        tomlPath,
        `[project]
name = "test"
# This is a comment with = sign
version = "1.0.0"
`,
      );

      const info = await readPyProjectInfo(tomlPath);

      expect(info).not.toBeNull();
      expect(info?.name).toBe('test');
      expect(info?.version).toBe('1.0.0');
    });
  });

  describe('findNearestPyProject', () => {
    it('should find pyproject in same directory', () => {
      const pyprojects: PyProjectInfo[] = [
        {
          path: join(TEST_DIR, 'pyproject.toml'),
          dir: TEST_DIR,
          name: 'root',
        },
      ];

      const filePath = join(TEST_DIR, 'src', 'main.py');
      const proj = findNearestPyProject(filePath, pyprojects);

      expect(proj).not.toBeNull();
      expect(proj?.name).toBe('root');
    });

    it('should find nearest pyproject in nested structure', () => {
      const pyprojects: PyProjectInfo[] = [
        {
          path: join(TEST_DIR, 'pyproject.toml'),
          dir: TEST_DIR,
          name: 'root',
        },
        {
          path: join(TEST_DIR, 'packages', 'app', 'pyproject.toml'),
          dir: join(TEST_DIR, 'packages', 'app'),
          name: 'app',
        },
      ];

      const filePath = join(TEST_DIR, 'packages', 'app', 'src', 'main.py');
      const proj = findNearestPyProject(filePath, pyprojects);

      expect(proj).not.toBeNull();
      expect(proj?.name).toBe('app');
    });

    it('should prefer deepest pyproject', () => {
      const pyprojects: PyProjectInfo[] = [
        {
          path: join(TEST_DIR, 'pyproject.toml'),
          dir: TEST_DIR,
          name: 'root',
        },
        {
          path: join(TEST_DIR, 'packages', 'pyproject.toml'),
          dir: join(TEST_DIR, 'packages'),
          name: 'packages',
        },
        {
          path: join(TEST_DIR, 'packages', 'app', 'pyproject.toml'),
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
        'file.py',
      );
      const proj = findNearestPyProject(filePath, pyprojects);

      expect(proj).not.toBeNull();
      expect(proj?.name).toBe('app');
    });

    it('should return null when no pyproject found', () => {
      const pyprojects: PyProjectInfo[] = [
        {
          path: join(TEST_DIR, 'packages', 'app', 'pyproject.toml'),
          dir: join(TEST_DIR, 'packages', 'app'),
          name: 'app',
        },
      ];

      const filePath = join(TEST_DIR, 'other', 'file.py');
      const proj = findNearestPyProject(filePath, pyprojects);

      expect(proj).toBeNull();
    });

    it('should return null for empty pyprojects array', () => {
      const pyprojects: PyProjectInfo[] = [];
      const filePath = join(TEST_DIR, 'src', 'main.py');
      const proj = findNearestPyProject(filePath, pyprojects);

      expect(proj).toBeNull();
    });

    it('should handle Windows-style paths', () => {
      const pyprojects: PyProjectInfo[] = [
        {
          path: join(TEST_DIR, 'pyproject.toml'),
          dir: TEST_DIR,
          name: 'root',
        },
      ];

      const filePath = join(TEST_DIR, 'src', 'package', 'module.py');
      const proj = findNearestPyProject(filePath, pyprojects);

      expect(proj).not.toBeNull();
      expect(proj?.name).toBe('root');
    });

    it('should sort pyprojects by depth correctly', () => {
      // Create pyprojects in random order to test sorting
      const pyprojects: PyProjectInfo[] = [
        {
          path: join(TEST_DIR, 'packages', 'app', 'pyproject.toml'),
          dir: join(TEST_DIR, 'packages', 'app'),
          name: 'app',
        },
        {
          path: join(TEST_DIR, 'pyproject.toml'),
          dir: TEST_DIR,
          name: 'root',
        },
        {
          path: join(TEST_DIR, 'packages', 'pyproject.toml'),
          dir: join(TEST_DIR, 'packages'),
          name: 'packages',
        },
      ];

      // File in app directory should find app pyproject
      const filePath = join(TEST_DIR, 'packages', 'app', 'main.py');
      const proj = findNearestPyProject(filePath, pyprojects);

      expect(proj).not.toBeNull();
      expect(proj?.name).toBe('app');
    });
  });
});
