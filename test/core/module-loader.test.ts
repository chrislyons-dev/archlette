import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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
