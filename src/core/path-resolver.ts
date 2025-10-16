import { fileURLToPath, pathToFileURL } from 'node:url';
import * as path from 'node:path';
import * as fs from 'node:fs';

export function getCliDir(): string {
  const idx = import.meta.url.indexOf('core');
  const newUrl = `${import.meta.url.slice(0, idx)}/cli.ts`;
  const cliFile = fileURLToPath(newUrl);
  return path.dirname(cliFile);
}

export function expandTilde(
  p: string,
  homeDir = process.env.HOME || process.env.USERPROFILE || '',
): string {
  if (!p.startsWith('~')) return p;
  if (!homeDir)
    throw new Error('Cannot resolve "~": home directory not found in environment.');
  if (p === '~') return homeDir;
  if (p.startsWith('~/')) return path.join(homeDir, p.slice(2));
  throw new Error('Only "~" and "~/" are supported (not "~user").');
}

/**
 * Core path resolver honoring Archlette rules (no file existence checks).
 * - "~"  -> user home
 * - "/"  -> absolute
 * - else -> relative to CLI dir
 */
export function resolveArchlettePath(input: string, opts: { cliDir: string }): string {
  const { cliDir } = opts;

  let candidate: string;
  if (input.startsWith('~')) {
    candidate = expandTilde(input);
  } else if (path.isAbsolute(input) || input.startsWith('/')) {
    candidate = input;
  } else {
    console.info(`Resolving relative path "${input}" against CLI dir: ${cliDir}`);
    candidate = path.join(cliDir, input);
  }

  return path.normalize(candidate);
}

/**
 * Resolve a module entry by probing:
 * 1) Exact path
 * 2) With extensions: .ts then .js
 * 3) If directory: index.ts then index.js
 */
export function resolveModuleEntry(
  input: string,
  opts: { cliDir: string; wantedExts?: ('.ts' | '.js')[] },
): string {
  const base = resolveArchlettePath(input, opts);
  const exts = opts.wantedExts ?? ['.ts', '.js'];

  // 1) Exact path
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;

  // 2) With extensions
  for (const ext of exts) {
    const withExt = base + ext;
    if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) return withExt;
  }

  // 3) Directory index
  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
    for (const ext of exts) {
      const idx = path.join(base, `index${ext}`);
      if (fs.existsSync(idx) && fs.statSync(idx).isFile()) return idx;
    }
  }

  // If it looks like a directory but didn’t match, also try base/index without checking dir first
  for (const ext of exts) {
    const idx = path.join(base, `index${ext}`);
    if (fs.existsSync(idx) && fs.statSync(idx).isFile()) return idx;
  }

  throw new Error(
    `Unable to resolve module entry for: ${input}\n` +
      `Tried: ${base}{${exts.join(', ')}} and ${path.join(base, 'index')}{${exts.join(', ')}}`,
  );
}

export function toFileUrl(p: string): string {
  return pathToFileURL(p).href;
}

export function writeFile(filename: string, content: string = '') {
  const dirname = path.dirname(filename);
  // Create parent directories recursively if they don't exist
  fs.mkdirSync(dirname, { recursive: true });
  // Now write the file
  fs.writeFileSync(filename, content);
}
