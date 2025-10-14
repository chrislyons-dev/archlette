import fs from 'node:fs/promises';
import path from 'node:path';
import { resolvePaths } from '../util/glob.js';

/**
 * Language-agnostic annotation extractor for JS/TS/PY.
 * Recognizes:
 *   @service <name>    -> container entity
 *   @component <name>  -> component entity
 *   @depends_on <id>   -> relation from inferred container to id
 */
export async function run(ctx) {
  const files = await resolvePaths(ctx.repoRoot, {
    include: ctx.inputs?.include ?? [
      'services/**',
      'apps/**',
      'libs/**',
      '**/*.{ts,js,py}',
    ],
    exclude: ctx.inputs?.exclude ?? [
      '**/node_modules/**',
      '**/.venv/**',
      '**/__pycache__/**',
      '**/dist/**',
      '**/build/**',
      '**/*.spec.*',
      '**/__tests__/**',
    ],
  });

  const entities = [];
  const relations = [];
  const serviceRe = /(?:^|\s)@service\s+([A-Za-z0-9_.-]+)/g;
  const componentRe = /(?:^|\s)@component\s+([A-Za-z0-9_.-]+)/g;
  const dependsRe = /(?:^|\s)@depends_on\s+([A-Za-z0-9_.:-]+)/g;

  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (!['.ts', '.js', '.mjs', '.cjs', '.py'].includes(ext)) continue;

    const content = await fs.readFile(f, 'utf8');
    const rel = path.relative(ctx.repoRoot, f).replaceAll('\\', '/');
    let m;

    while ((m = serviceRe.exec(content))) {
      const name = m[1];
      entities.push({
        id: `container:${name}`,
        kind: 'container',
        name,
        tags: ['service'],
        source: {
          extractor: 'builtin/code-annotations',
          location: rel,
          line: lineOf(content, m.index),
        },
      });
    }
    while ((m = componentRe.exec(content))) {
      const name = m[1];
      entities.push({
        id: `component:${name}`,
        kind: 'component',
        name,
        source: {
          extractor: 'builtin/code-annotations',
          location: rel,
          line: lineOf(content, m.index),
        },
      });
    }
    while ((m = dependsRe.exec(content))) {
      const to = m[1];
      relations.push({
        from: guessFrom(rel),
        to,
        label: 'depends_on',
        source: {
          extractor: 'builtin/code-annotations',
          location: rel,
          line: lineOf(content, m.index),
        },
      });
    }
  }

  ctx.log(`code-annotations: scanned ${files.length} files`);
  return { entities, relations };
}

function lineOf(text, idx) {
  return text.slice(0, idx).split(/\r?\n/).length;
}

function guessFrom(relPath) {
  const parts = relPath.split('/');
  const folder = parts[0] || 'unknown';
  return `container:${folder}`;
}
