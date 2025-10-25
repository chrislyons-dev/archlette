/**
 * Unit tests for path-security module
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolveSecurePath,
  resolveUserContentPath,
  resolvePluginPath,
  type SecurePathOptions,
} from '../../src/core/path-security.js';

const TEST_DIR = join(process.cwd(), 'test-tmp-path-security');

describe('path-security', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe('resolveSecurePath', () => {
    describe('restricted strategy', () => {
      it('should allow paths within base directory', () => {
        mkdirSync(join(TEST_DIR, 'themes'), { recursive: true });
        writeFileSync(join(TEST_DIR, 'themes', 'theme.dsl'), 'test');

        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'restricted',
        };

        const result = resolveSecurePath('./themes/theme.dsl', options);

        expect(result.isSecure).toBe(true);
        expect(result.absolutePath).toContain('themes');
        expect(result.warnings).toHaveLength(0);
      });

      it('should reject paths that traverse outside base directory', () => {
        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'restricted',
        };

        expect(() => {
          resolveSecurePath('../outside/file.txt', options);
        }).toThrow('Path must be within project directory');
      });

      it('should reject absolute paths in restricted mode', () => {
        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'restricted',
        };

        expect(() => {
          resolveSecurePath('/absolute/path/file.txt', options);
        }).toThrow('Path must be within project directory');
      });
    });

    describe('config-relative strategy', () => {
      it('should allow relative paths', () => {
        mkdirSync(join(TEST_DIR, 'config'), { recursive: true });
        writeFileSync(join(TEST_DIR, 'config', 'custom.yaml'), 'test');

        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
        };

        const result = resolveSecurePath('./config/custom.yaml', options);

        expect(result.isSecure).toBe(true);
        expect(result.absolutePath).toContain('config');
      });

      it('should warn on directory traversal but not block', () => {
        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
        };

        const result = resolveSecurePath('../outside/file.txt', options);

        expect(result.isSecure).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings.some((w) => w.includes('traverses outside'))).toBe(true);
      });

      it('should warn on absolute paths without allowlist', () => {
        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
        };

        const result = resolveSecurePath('/some/absolute/path.txt', options);

        expect(result.isSecure).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings.some((w) => w.includes('Absolute path used'))).toBe(
          true,
        );
      });

      it('should allow absolute paths in allowlist', () => {
        const allowedDir = join(TEST_DIR, 'allowed');
        mkdirSync(allowedDir, { recursive: true });
        writeFileSync(join(allowedDir, 'file.txt'), 'test');

        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
          allowedAbsolutePaths: [allowedDir],
        };

        const result = resolveSecurePath(join(allowedDir, 'file.txt'), options);

        expect(result.isSecure).toBe(true);
        expect(result.warnings).toHaveLength(0);
      });
    });

    describe('cli-relative strategy', () => {
      it('should allow relative paths', () => {
        mkdirSync(join(TEST_DIR, 'plugins'), { recursive: true });
        writeFileSync(join(TEST_DIR, 'plugins', 'custom.js'), 'export default {}');

        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'cli-relative',
        };

        const result = resolveSecurePath('./plugins/custom.js', options);

        expect(result.isSecure).toBe(true);
        expect(result.absolutePath).toContain('plugins');
      });

      it('should reject absolute paths not in allowlist', () => {
        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'cli-relative',
        };

        expect(() => {
          resolveSecurePath('/some/plugin/path.js', options);
        }).toThrow('Absolute plugin paths must be in allowed directories');
      });

      it('should allow absolute paths in allowlist', () => {
        const allowedDir = join(TEST_DIR, 'external-plugins');
        mkdirSync(allowedDir, { recursive: true });
        writeFileSync(join(allowedDir, 'plugin.js'), 'export default {}');

        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'cli-relative',
          allowedAbsolutePaths: [allowedDir],
        };

        const result = resolveSecurePath(join(allowedDir, 'plugin.js'), options);

        expect(result.isSecure).toBe(true);
        expect(result.warnings).toHaveLength(0);
      });
    });

    describe('absolute-allowed strategy', () => {
      it('should allow absolute paths', () => {
        const absPath = join(TEST_DIR, 'file.txt');
        writeFileSync(absPath, 'test');

        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'absolute-allowed',
        };

        const result = resolveSecurePath(absPath, options);

        expect(result.isSecure).toBe(true);
      });

      it('should allow relative paths', () => {
        mkdirSync(join(TEST_DIR, 'data'), { recursive: true });
        writeFileSync(join(TEST_DIR, 'data', 'file.txt'), 'test');

        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'absolute-allowed',
        };

        const result = resolveSecurePath('./data/file.txt', options);

        expect(result.isSecure).toBe(true);
      });

      it('should still warn on suspicious patterns', () => {
        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'absolute-allowed',
        };

        const result = resolveSecurePath('../suspicious/path.txt', options);

        expect(result.isSecure).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
      });
    });

    describe('security validations', () => {
      it('should reject paths with null bytes', () => {
        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
        };

        expect(() => {
          resolveSecurePath('file\0.txt', options);
        }).toThrow('null bytes');
      });

      it('should detect directory traversal patterns', () => {
        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
        };

        const result = resolveSecurePath('../outside/file.txt', options);

        expect(result.warnings.some((w) => w.includes('suspicious pattern'))).toBe(
          true,
        );
      });

      it('should detect traversal in middle of path (before normalization)', () => {
        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
        };

        // Use a path that contains .. traversal - the pattern check happens before normalization resolves it
        const result = resolveSecurePath('foo/../../bar/file.txt', options);

        // The path will be normalized, but the warning about the pattern should be present
        // because validation happens on the input before full normalization
        expect(
          result.warnings.some(
            (w) => w.includes('suspicious pattern') || w.includes('traverses outside'),
          ),
        ).toBe(true);
      });

      it('should allow paths that normalize to safe locations', () => {
        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
        };

        // Path contains .. but normalizes to 'foo' which is safe
        const result = resolveSecurePath('foo/bar/..', options);

        // Should not have warnings since the normalized path is safe
        expect(result.isSecure).toBe(true);
      });
    });

    describe('file existence checking', () => {
      it('should detect existing files', () => {
        const filePath = join(TEST_DIR, 'exists.txt');
        writeFileSync(filePath, 'test');

        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
        };

        const result = resolveSecurePath('./exists.txt', options);

        expect(result.exists).toBe(true);
        expect(result.type).toBe('file');
      });

      it('should detect existing directories', () => {
        const dirPath = join(TEST_DIR, 'subdir');
        mkdirSync(dirPath, { recursive: true });

        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
        };

        const result = resolveSecurePath('./subdir', options);

        expect(result.exists).toBe(true);
        expect(result.type).toBe('directory');
      });

      it('should mark non-existent paths as unknown', () => {
        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
        };

        const result = resolveSecurePath('./missing.txt', options);

        expect(result.exists).toBe(false);
        expect(result.type).toBe('unknown');
      });

      it('should throw when mustExist is true and file does not exist', () => {
        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
          mustExist: true,
        };

        expect(() => {
          resolveSecurePath('./missing.txt', options);
        }).toThrow('does not exist');
      });
    });

    describe('extension validation', () => {
      it('should allow files with valid extensions', () => {
        const filePath = join(TEST_DIR, 'theme.dsl');
        writeFileSync(filePath, 'test');

        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
          allowedExtensions: ['.dsl'],
        };

        const result = resolveSecurePath('./theme.dsl', options);

        expect(result.isSecure).toBe(true);
      });

      it('should reject files with invalid extensions', () => {
        const filePath = join(TEST_DIR, 'file.txt');
        writeFileSync(filePath, 'test');

        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
          allowedExtensions: ['.dsl'],
        };

        expect(() => {
          resolveSecurePath('./file.txt', options);
        }).toThrow('must have one of these extensions');
      });

      it('should allow multiple valid extensions', () => {
        const yamlPath = join(TEST_DIR, 'config.yaml');
        const ymlPath = join(TEST_DIR, 'config.yml');
        writeFileSync(yamlPath, 'test');
        writeFileSync(ymlPath, 'test');

        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
          allowedExtensions: ['.yaml', '.yml'],
        };

        const result1 = resolveSecurePath('./config.yaml', options);
        const result2 = resolveSecurePath('./config.yml', options);

        expect(result1.isSecure).toBe(true);
        expect(result2.isSecure).toBe(true);
      });

      it('should only validate extensions for files, not directories', () => {
        const dirPath = join(TEST_DIR, 'folder.dsl');
        mkdirSync(dirPath, { recursive: true });

        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
          allowedExtensions: ['.txt'],
        };

        // Should not throw even though directory doesn't have .txt extension
        const result = resolveSecurePath('./folder.dsl', options);
        expect(result.exists).toBe(true);
        expect(result.type).toBe('directory');
      });
    });

    describe('tilde expansion', () => {
      it('should expand tilde paths', () => {
        // Mock expandTilde to return a known path
        vi.mock('../../src/core/path-resolver.js', () => ({
          expandTilde: (path: string) => {
            if (path.startsWith('~/')) {
              return join(TEST_DIR, path.slice(2));
            }
            return path;
          },
        }));

        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
        };

        const result = resolveSecurePath('~/test/file.txt', options);

        expect(result.absolutePath).toContain('test');
      });
    });

    describe('path normalization', () => {
      it('should normalize paths with multiple slashes', () => {
        const filePath = join(TEST_DIR, 'file.txt');
        writeFileSync(filePath, 'test');

        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
        };

        const result = resolveSecurePath('./././file.txt', options);

        expect(result.absolutePath).toBe(filePath);
      });

      it('should return relative path from baseDir', () => {
        const filePath = join(TEST_DIR, 'sub', 'file.txt');
        mkdirSync(join(TEST_DIR, 'sub'), { recursive: true });
        writeFileSync(filePath, 'test');

        const options: SecurePathOptions = {
          baseDir: TEST_DIR,
          strategy: 'config-relative',
        };

        const result = resolveSecurePath('./sub/file.txt', options);

        expect(result.relativePath).toMatch(/sub/);
      });
    });
  });

  describe('resolveUserContentPath', () => {
    it('should use config-relative strategy by default', () => {
      mkdirSync(join(TEST_DIR, 'themes'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'themes', 'custom.dsl'), 'test');

      const result = resolveUserContentPath('./themes/custom.dsl', TEST_DIR);

      expect(result.isSecure).toBe(true);
      expect(result.absolutePath).toContain('themes');
    });

    it('should validate extensions when provided', () => {
      const filePath = join(TEST_DIR, 'theme.dsl');
      writeFileSync(filePath, 'test');

      const result = resolveUserContentPath('./theme.dsl', TEST_DIR, ['.dsl']);

      expect(result.isSecure).toBe(true);
    });

    it('should not require file to exist', () => {
      const result = resolveUserContentPath('./missing.dsl', TEST_DIR);

      expect(result.exists).toBe(false);
      expect(result.isSecure).toBe(true);
    });
  });

  describe('resolvePluginPath', () => {
    it('should use cli-relative strategy by default', () => {
      mkdirSync(join(TEST_DIR, 'plugins'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'plugins', 'custom.js'), 'export default {}');

      const result = resolvePluginPath('./plugins/custom.js', TEST_DIR);

      expect(result.isSecure).toBe(true);
      expect(result.absolutePath).toContain('plugins');
    });

    it('should allow absolute paths in allowlist', () => {
      const allowedDir = join(TEST_DIR, 'external');
      mkdirSync(allowedDir, { recursive: true });
      writeFileSync(join(allowedDir, 'plugin.js'), 'export default {}');

      const result = resolvePluginPath(
        join(allowedDir, 'plugin.js'),
        TEST_DIR,
        undefined, // allowedExtensions
        [allowedDir], // allowedAbsolutePaths
      );

      expect(result.isSecure).toBe(true);
    });

    it('should not require file to exist', () => {
      const result = resolvePluginPath('./missing-plugin.js', TEST_DIR);

      expect(result.exists).toBe(false);
      expect(result.isSecure).toBe(true);
    });
  });
});
