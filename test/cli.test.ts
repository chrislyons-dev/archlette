import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';

// ---------- shared state ----------
let calls: Array<{ stage: string; ctxConfig: unknown }> = [];

// fabricate a stage module that records when run(ctx) is called
function makeStageModule(stage: string) {
  return {
    module: {
      run: (ctx: any) => {
        calls.push({ stage, ctxConfig: ctx?.config ?? null });
      },
    },
    path: `/fake/${stage}/index.ts`,
    url: `file:///fake/${stage}/index.ts`,
  };
}

// ---------- mocks (inline URLs, no TDZ) ----------

// Mock loader: resolve "./<n>-stage" → fake module
vi.mock(new URL('../src/core/module-loader.js', import.meta.url).href, () => ({
  loadModuleFromPath: vi.fn(async (spec: string) => {
    const map: Record<string, string> = {
      './1-extract': 'extract',
      './2-validate': 'validate',
      './3-generate': 'generate',
      './4-render': 'render',
      './5-docs': 'docs',
    };
    const stage = map[spec as keyof typeof map] ?? 'unknown';
    return makeStageModule(stage);
  }),
}));

// Mock path resolver
vi.mock(new URL('../src/core/path-resolver.js', import.meta.url).href, () => ({
  getCliDir: vi.fn(() => '/cli'),
  resolveArchlettePath: vi.fn((input: string) => {
    if (input === './templates/default.yaml') return '/cfg/default.yaml';
    if (input.startsWith('~')) return `/home/user/${input.slice(2)}`;
    if (input.startsWith('/')) return input;
    return `/cli/${input}`;
  }),
}));

// Mock fs: pretend only default/custom YAML exist
vi.mock('node:fs', () => {
  const existsSync = vi.fn(
    (p: string) => p === '/cfg/default.yaml' || p === '/cfg/custom.yaml',
  );
  const readFileSync = vi.fn((p: string) => {
    if (p === '/cfg/default.yaml') return 'default: true';
    if (p === '/cfg/custom.yaml') return 'answer: 42';
    return '';
  });
  return { existsSync, readFileSync };
});

// Mock yaml parser
vi.mock('yaml', () => ({
  parse: (text: string) =>
    text.includes('answer: 42')
      ? { answer: 42 }
      : text.includes('default: true')
        ? { default: true }
        : {},
}));

// Console + exit spies
const spyLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
const spyError = vi.spyOn(console, 'error').mockImplementation(() => {});
const spyDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});
vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
  throw new Error(`process.exit(${code})`);
}) as any);

// helper: import CLI after mocks, return its { run }
async function freshCli() {
  await vi.resetModules();
  return import(new URL('../src/cli.js', import.meta.url).href);
}

beforeEach(async () => {
  calls = [];
  spyLog.mockClear();
  spyWarn.mockClear();
  spyError.mockClear();
  spyDebug.mockClear();

  const fsMod: any = await import('node:fs');
  fsMod.existsSync.mockClear?.();
  fsMod.readFileSync.mockClear?.();

  const loader: any = await import(
    new URL('../src/core/module-loader.js', import.meta.url).href
  );
  loader.loadModuleFromPath.mockClear?.();

  const resolver: any = await import(
    new URL('../src/core/path-resolver.js', import.meta.url).href
  );
  resolver.getCliDir.mockClear?.();
  resolver.resolveArchlettePath.mockClear?.();
});

afterEach(() => {
  process.argv = ['node', 'cli'];
});

// ---------- TESTS ----------

describe('CLI stage selection & order', () => {
  it('runs full pipeline for "all"', async () => {
    const { run } = await freshCli();
    await expect(run(['node', 'cli', 'all'])).resolves.toBeUndefined();

    expect(calls.map((c) => c.stage)).toEqual([
      'extract',
      'validate',
      'generate',
      'render',
      'docs',
    ]);

    const loader: any = await import(
      new URL('../src/core/module-loader.js', import.meta.url).href
    );
    expect(loader.loadModuleFromPath.mock.calls.map((c: any[]) => c[0])).toEqual([
      './1-extract',
      './2-validate',
      './3-generate',
      './4-render',
      './5-docs',
    ]);
  });

  it('runs full pipeline for "docs" alias', async () => {
    const { run } = await freshCli();
    await run(['node', 'cli', 'docs']);
    expect(calls.map((c) => c.stage)).toEqual([
      'extract',
      'validate',
      'generate',
      'render',
      'docs',
    ]);
  });

  it('runs only the requested single stage', async () => {
    const { run } = await freshCli();
    await run(['node', 'cli', 'generate']);
    expect(calls.map((c) => c.stage)).toEqual(['extract', 'validate', 'generate']);
  });
});

describe('CLI YAML handling & resolution', () => {
  it('uses default ./templates/default.yaml when -f not provided', async () => {
    const { run } = await freshCli();
    await run(['node', 'cli', 'all']);

    const resolver: any = await import(
      new URL('../src/core/path-resolver.js', import.meta.url).href
    );
    const inputs = resolver.resolveArchlettePath.mock.calls.map((c: any[]) => c[0]);
    expect(inputs).toContain('./templates/default.yaml');
    expect(calls[0].ctxConfig).toEqual({ default: true });
  });

  it('honors -f <yaml> with tilde expansion', async () => {
    const resolver: any = await import(
      new URL('../src/core/path-resolver.js', import.meta.url).href
    );
    resolver.resolveArchlettePath.mockImplementation((input: string) => {
      if (input === './templates/default.yaml') return '/cfg/default.yaml';
      if (input === '~/custom.yaml') return '/cfg/custom.yaml';
      if (input.startsWith('~')) return `/home/user/${input.slice(2)}`;
      if (input.startsWith('/')) return input;
      return `/cli/${input}`;
    });

    const { run } = await freshCli();
    await run(['node', 'cli', 'extract', '-f', '~/custom.yaml']);

    const fsMod: any = await import('node:fs');
    expect(fsMod.existsSync).toHaveBeenCalledWith('/cfg/custom.yaml');
    expect(calls[0].ctxConfig).toEqual({ answer: 42 });
  });

  it('proceeds with empty config if file does not exist', async () => {
    const fsMod: any = await import('node:fs');
    fsMod.existsSync.mockImplementation((p: string) => p !== '/does/not/exist.yaml');

    const { run } = await freshCli();
    await run(['node', 'cli', 'extract', '-f', '/does/not/exist.yaml']);

    expect(calls[0].ctxConfig).toBeNull();
    expect(spyWarn).not.toHaveBeenCalled();
  });

  it('fails when passed an unknown option', async () => {
    const { run } = await freshCli();

    // run() should exit(2) -> our mocked process.exit throws
    await expect(run(['node', 'cli', 'extract', '-x', 'random'])).rejects.toThrow(
      /process\.exit\(2\)/,
    );

    // and it should print a friendly error
    expect(spyError).toHaveBeenCalled();

    // be tolerant to the logger prefix and multiple args
    const last = (spyError as any).mock.calls.at(-1) as unknown[]; // ["[archlette:error]", "Error: Unknown option \"-x\".", ...]
    expect(Array.isArray(last)).toBe(true);
    // includes our logger prefix
    expect(String(last[0])).toContain('Error: Unknown option "-x"');
    // includes the specific unknown option message somewhere
    expect(
      last.some((a) => typeof a === 'string' && a.includes('Unknown option "-x"')),
    ).toBe(true);
  });

  it('logs "Using config:" when the YAML file exists', async () => {
    const { run } = await freshCli();
    await run(['node', 'cli', 'extract']); // uses default ./templates/default.yaml -> /cfg/default.yaml (exists)

    // find the info log that mentions Using config:
    const infoCalls = (console.log as any).mock.calls.map((c: any[]) => c.join(' '));
    // example call looks like: ["[archlette:info]", "Using config:", "/cfg/default.yaml"]
    const hasUsing = infoCalls.some(
      (line: string | string[]) =>
        line.includes('Using config:') && line.includes('/cfg/default.yaml'),
    );
    expect(hasUsing).toBe(true);
  });

  it('logs "No config file found" when YAML is missing', async () => {
    // Make fs.existsSync return false for any path to force "missing"
    const fsMod: any = await import('node:fs');
    fsMod.existsSync.mockImplementation(() => false);

    const { run } = await freshCli();
    await run(['node', 'cli', 'extract']); // still looks for ./templates/default.yaml but now "missing"

    const infoCalls = (console.log as any).mock.calls.map((c: any[]) => c.join(' '));
    const found = infoCalls.find((line: string | string[]) =>
      line.includes('No config file found'),
    );
    expect(found).toBeTruthy();
    // should mention what it looked for (the resolved default)
    expect(found).toContain('/cfg/default.yaml');
  });

  it('invokes a stage module default export when present', async () => {
    // Override the loader ONCE to return a module with default() instead of run()
    const loader: any = await import(
      new URL('../src/core/module-loader.js', import.meta.url).href
    );
    loader.loadModuleFromPath.mockImplementationOnce(async () => ({
      module: {
        default: (ctx: any) => {
          calls.push({ stage: 'extract-default', ctxConfig: ctx?.config ?? null });
        },
      },
      path: '/fake/extract/index.ts',
      url: 'file:///fake/extract/index.ts',
    }));

    const { run } = await freshCli();
    await run(['node', 'cli', 'extract']);

    expect(calls.map((c) => c.stage)).toEqual(['extract-default']);
  });

  it('logs a debug notice if a stage module exports no callable entry', async () => {
    const loader: any = await import(
      new URL('../src/core/module-loader.js', import.meta.url).href
    );
    loader.loadModuleFromPath.mockImplementationOnce(async () => ({
      module: {}, // no run/default
      path: '/fake/extract/index.ts',
      url: 'file:///fake/extract/index.ts',
    }));

    const { run } = await freshCli();
    await run(['node', 'cli', 'extract']);

    // debug should include "No exported function in" and the resolved path
    const debugLines = (console.debug as any).mock.calls.map((c: any[]) => c.join(' '));
    const hit = debugLines.find(
      (line: string | string[]) =>
        line.includes('No exported function in') &&
        line.includes('/fake/extract/index.ts'),
    );
    expect(hit).toBeTruthy();
  });
});

describe('CLI errors', () => {
  it('exits on invalid stage', async () => {
    const { run } = await freshCli();
    await expect(run(['node', 'cli', 'nope'])).rejects.toThrow(/process\.exit\(2\)/);
    expect(spyError).toHaveBeenCalled();
  });

  it('exits on missing -f value', async () => {
    const { run } = await freshCli();
    await expect(run(['node', 'cli', 'extract', '-f'])).rejects.toThrow(
      /process\.exit\(2\)/,
    );
  });

  it('exits if a stage throws', async () => {
    const loader: any = await import(
      new URL('../src/core/module-loader.js', import.meta.url).href
    );
    loader.loadModuleFromPath.mockImplementationOnce(async () => {
      throw new Error('boom');
    });

    const { run } = await freshCli();
    await expect(run(['node', 'cli', 'extract'])).rejects.toThrow(/process\.exit\(1\)/);

    expect(spyError).toHaveBeenCalledWith(
      expect.stringContaining('[archlette:error]'),
      expect.stringContaining('Stage "extract" failed:'),
      expect.anything(),
    );
  });
});
