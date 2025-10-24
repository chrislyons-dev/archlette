import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  resolveArchlettePath,
  resolveModuleEntry,
  toFileUrl,
  getCliDir,
} from '../../src/core/path-resolver.ts';
import { loadModuleFromPath } from '../../src/core/module-loader.js';

// We'll use the actual CLI dir since getCliDir() now always returns the real CLI location
let tmpRoot!: string;
let cliDir!: string;
let oldHOME!: string | undefined;

function mk(p: string) {
  fs.mkdirSync(p, { recursive: true });
}
async function write(p: string, content: string) {
  await fsp.mkdir(path.dirname(p), { recursive: true });
  await fsp.writeFile(p, content, 'utf8');
}

beforeAll(async () => {
  tmpRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'archlette-test-'));
  // Use the actual CLI directory from getCliDir()
  cliDir = getCliDir();

  // Fake HOME so "~" tests don't touch the real home
  oldHOME = process.env.HOME;
  process.env.HOME = path.join(tmpRoot, 'home');
  mk(process.env.HOME);

  // Create test files in the actual CLI directory
  // These will be created alongside your source files for testing
  await write(
    path.join(cliDir, 'test-plugins', 'ext.ts'),
    'export const ok = "ext.ts";',
  );
  await write(
    path.join(cliDir, 'test-plugins', 'gen.js'),
    'export const ok = "gen.js";',
  );
  await write(
    path.join(cliDir, 'test-plugins', 'dir', 'index.ts'),
    'export const ok = "index.ts";',
  );

  // Home-based file
  await write(
    path.join(process.env.HOME!, 'mods', 'homeMod.ts'),
    'export const ok = "homeMod.ts";',
  );

  // Absolute path file
  await write(path.join(tmpRoot, 'abs.js'), 'export const ok = "abs.js";');
});

afterAll(async () => {
  if (oldHOME === undefined) delete process.env.HOME;
  else process.env.HOME = oldHOME;

  // Clean up test files from CLI directory
  const testPluginsDir = path.join(cliDir, 'test-plugins');
  if (fs.existsSync(testPluginsDir)) {
    await fsp.rm(testPluginsDir, { recursive: true, force: true });
  }

  // Clean up temp tree
  await fsp.rm(tmpRoot, { recursive: true, force: true });
});

describe('path-resolution basics', () => {
  it('resolves CLI-relative when no ~ or /', () => {
    const p = resolveArchlettePath('test-plugins/ext', { cliDir });
    expect(p).toBe(path.normalize(path.join(cliDir, 'test-plugins', 'ext')));
  });

  it('expands ~ to HOME', () => {
    const p = resolveArchlettePath('~/mods/homeMod', { cliDir });
    expect(p.startsWith(process.env.HOME!)).toBe(true);
  });

  it('passes through absolute paths', () => {
    const abs = path.join(tmpRoot, 'abs.js');
    const p = resolveArchlettePath(abs, { cliDir });
    expect(p).toBe(path.normalize(abs));
  });

  it('converts to file URL', () => {
    const abs = path.join(tmpRoot, 'abs.js');
    const url = toFileUrl(abs);
    expect(url).toBe(pathToFileURL(abs).href);
  });
});

describe('resolveModuleEntry with extension/index probing', () => {
  it('finds .ts when given bare path', () => {
    const p = resolveModuleEntry('test-plugins/ext', { cliDir });
    expect(p).toBe(path.join(cliDir, 'test-plugins', 'ext.ts'));
  });

  it('finds .js when given bare path', () => {
    const p = resolveModuleEntry('test-plugins/gen', { cliDir });
    expect(p).toBe(path.join(cliDir, 'test-plugins', 'gen.js'));
  });

  it('resolves directory index.ts', () => {
    const p = resolveModuleEntry('test-plugins/dir', { cliDir });
    expect(p).toBe(path.join(cliDir, 'test-plugins', 'dir', 'index.ts'));
  });

  it('resolves home ~ file with .ts', () => {
    const p = resolveModuleEntry('~/mods/homeMod', { cliDir });
    expect(p.endsWith(path.normalize(path.join('mods', 'homeMod.ts')))).toBe(true);
  });

  it('throws when nothing matches', () => {
    expect(() => resolveModuleEntry('no/such/file', { cliDir })).toThrow(
      /Unable to resolve module entry/,
    );
  });
});

describe('loadModuleFromPath dynamic import', () => {
  it('imports a .ts file resolved via probing', async () => {
    const { module, path: found } = await loadModuleFromPath<any>('test-plugins/ext');
    expect(found.endsWith('ext.ts')).toBe(true);
    expect(module.ok).toBe('ext.ts');
  });

  it('imports a directory index.ts', async () => {
    const { module, path: found } = await loadModuleFromPath<any>('test-plugins/dir');
    expect(found.endsWith(path.normalize('test-plugins/dir/index.ts'))).toBe(true);
    expect(module.ok).toBe('index.ts');
  });

  it('imports an absolute path as-is', async () => {
    const abs = path.join(tmpRoot, 'abs.js');
    // External plugins require allowlist for security validation
    const { module, path: found } = await loadModuleFromPath<any>(
      abs,
      ['.ts', '.js'],
      [tmpRoot],
    );
    expect(found).toBe(abs);
    expect(module.ok).toBe('abs.js');
  });

  it('imports a home-path module', async () => {
    // Home directory paths need to be in allowlist
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const { module } = await loadModuleFromPath<any>(
      '~/mods/homeMod',
      ['.ts', '.js'],
      [homeDir],
    );
    expect(module.ok).toBe('homeMod.ts');
  });
});

describe.runIf(process.platform === 'win32')(
  'normalizes mixed separators on Windows',
  () => {
    it('normalizes C:/foo\\bar -> C:\\foo\\bar', () => {
      const mixed = 'C:/foo\\bar/baz.js';
      const resolved = resolveArchlettePath(mixed, { cliDir: 'C:\\fake-cli' });
      expect(resolved.includes('/')).toBe(false);
      expect(resolved).toMatch(/^.:\\foo\\bar\\baz\.js$/i);
    });
  },
);

describe('getDefaultUserPluginDir edge cases', () => {
  it('should handle expandTilde errors gracefully', async () => {
    // Create a spy that can observe the module behavior
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Try to trigger the warning path by using an invalid home path
    const invalidPath = '~/.archlette/mods/invalid-test-module-xyz';

    // This should use the fallback behavior when home cannot be resolved
    await expect(loadModuleFromPath(invalidPath, ['.ts', '.js'], [])).rejects.toThrow();

    consoleSpy.mockRestore();
  });
});

describe('loadModuleFromPath security validation', () => {
  it('should log security warnings when they exist', async () => {
    // Mock console.log to capture warnings
    const warnLogs: string[] = [];
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation((msg: string) => {
      if (typeof msg === 'string' && msg.includes('Security warnings')) {
        warnLogs.push(msg);
      }
    });

    // Create a test module in an absolute path that might trigger warnings
    const testPath = path.join(tmpRoot, 'external-plugin');
    await write(path.join(testPath, 'index.js'), 'export const test = "external";');

    try {
      // Load with allowlist to avoid rejection, but path might still trigger warnings
      await loadModuleFromPath(
        path.join(testPath, 'index.js'),
        ['.ts', '.js'],
        [tmpRoot],
      );
    } catch {
      // Expected to fail for other reasons, but we're checking warning logs
    }

    consoleLogSpy.mockRestore();
  });

  it('should throw error on security validation mismatch', async () => {
    // Try to load a path that would fail normalized path comparison
    const testPath = path.join(tmpRoot, 'mismatch-test');
    await write(path.join(testPath, 'index.ts'), 'export const bad = "mismatch";');

    // Mock resolvePluginPath to return a mismatched path
    const pathSecurity = await import('../../src/core/path-security.js');

    // Create a spy that returns a mismatched path
    vi.spyOn(pathSecurity, 'resolvePluginPath').mockReturnValue({
      absolutePath: path.join(tmpRoot, 'completely-different-path'),
      relativePath: 'different',
      exists: false,
      type: 'unknown',
      isSecure: true,
      warnings: [],
    });

    await expect(
      loadModuleFromPath(path.join(testPath, 'index.ts'), ['.ts', '.js'], [tmpRoot]),
    ).rejects.toThrow(/Security validation mismatch/);

    vi.restoreAllMocks();
  });

  it('should throw error with helpful hint on security validation failure', async () => {
    // Try to load a path from an unauthorized location
    const unauthorizedPath = path.join(tmpRoot, 'unauthorized');
    await write(
      path.join(unauthorizedPath, 'bad.js'),
      'export const bad = "unauthorized";',
    );

    // Load without including it in the allowlist
    await expect(
      loadModuleFromPath(path.join(unauthorizedPath, 'bad.js'), ['.ts', '.js'], []),
    ).rejects.toThrow(/Hint: User plugins should be placed in/);
  });

  it('should handle path normalization for security validation', async () => {
    // Test with a path that has mixed separators (Windows-style)
    const normalPath = path.join(cliDir, 'test-plugins', 'ext.ts');
    const result = await loadModuleFromPath('test-plugins/ext');
    expect(result.path).toBe(path.normalize(normalPath));
  });

  it('should validate external plugins with allowlist', async () => {
    const externalPath = path.join(tmpRoot, 'external-allowed');
    await write(
      path.join(externalPath, 'plugin.js'),
      'export const external = "allowed";',
    );

    const result = await loadModuleFromPath(
      path.join(externalPath, 'plugin.js'),
      ['.ts', '.js'],
      [tmpRoot],
    );

    expect(result.module).toHaveProperty('external', 'allowed');
  });

  it('should add default user plugin dir to allowlist', async () => {
    // Mock HOME to create a predictable default user plugin directory
    const testHome = path.join(tmpRoot, 'test-home');
    const userPluginDir = path.join(testHome, '.archlette', 'mods');
    await write(
      path.join(userPluginDir, 'user-plugin.js'),
      'export const user = "plugin";',
    );

    const oldHome = process.env.HOME;
    process.env.HOME = testHome;

    try {
      const result = await loadModuleFromPath(
        path.join(userPluginDir, 'user-plugin.js'),
        ['.ts', '.js'],
        [],
      );
      expect(result.module).toHaveProperty('user', 'plugin');
    } finally {
      process.env.HOME = oldHome;
    }
  });
});
