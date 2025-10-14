import path from 'node:path';
import { globby } from 'globby';

/**
 * Resolve include/exclude globs relative to repoRoot into a concrete file list.
 * All paths are normalized to POSIX for cross-platform consistency.
 * Exclusions are applied via negative patterns in the same globby call.
 */
export async function resolvePaths(
  repoRoot,
  { include = ['**/*'], exclude = [] } = {},
) {
  const toPosix = (p) => p.replaceAll('\\', '/');
  const inc = include.map((p) => toPosix(path.resolve(repoRoot, p)));
  const exc = exclude.map((p) => '!' + toPosix(path.resolve(repoRoot, p)));
  return globby([...inc, ...exc], { dot: false, followSymbolicLinks: true });
}
