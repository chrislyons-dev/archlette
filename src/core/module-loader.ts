// packages/archlette-core/src/module-loader.ts
import { resolveModuleEntry, getCliDir, toFileUrl } from './path-resolver.js';

export interface LoadedModule<T = unknown> {
  url: string; // file:// URL used for import()
  path: string; // normalized filesystem path
  module: T; // the imported module
}

export async function loadModuleFromPath<T = unknown>(
  spec: string,
  importMetaUrlForCli: string, // pass import.meta.url from the CLI entry file
  exts: ('.ts' | '.js')[] = ['.ts', '.js'],
): Promise<LoadedModule<T>> {
  const cliDir = getCliDir(importMetaUrlForCli);
  const resolvedPath = resolveModuleEntry(spec, { cliDir, wantedExts: exts });
  const url = toFileUrl(resolvedPath);

  // Dynamic ESM import from a file URL
  const module = (await import(url)) as T;
  return { url, path: resolvedPath, module };
}
