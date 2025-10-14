import fs from 'node:fs/promises';
import path from 'node:path';
import { resolvePaths } from '../util/glob.js';
import YAML from 'yaml';

/**
 * OpenAPI extractor
 * Emits:
 *  - api entity per spec
 *  - component entities per tag or first path segment
 *  - artifact record for the spec path
 *  - relation api -> container when hinted
 */
export async function run(ctx) {
  const files = await resolvePaths(ctx.repoRoot, {
    include: ctx.inputs?.include ?? [
      'apis/**/openapi*.{yml,yaml,json}',
      'openapi*.{yml,yaml,json}',
    ],
    exclude: ctx.inputs?.exclude ?? [],
  });

  const entities = [];
  const relations = [];
  const artifacts = [];

  for (const f of files) {
    const rel = path.relative(ctx.repoRoot, f).replaceAll('\\', '/');
    const ext = path.extname(f).toLowerCase();
    let doc;
    try {
      const raw = await fs.readFile(f, 'utf8');
      if (ext === '.yaml' || ext === '.yml') doc = YAML.parse(raw);
      else doc = JSON.parse(raw);
    } catch {
      ctx.log(`openapi: skip ${rel} (parse failed)`);
      continue;
    }

    const title = doc?.info?.title || path.basename(f);
    const apiId = `api:${slug(title)}`;
    entities.push({
      id: apiId,
      kind: 'api',
      name: title,
      props: {
        version: doc?.info?.version,
        servers: (doc?.servers || []).map((s) => s.url),
      },
      source: { extractor: 'builtin/openapi', location: rel },
    });
    artifacts.push({
      id: `openapi:${slug(rel)}`,
      kind: 'openapi',
      path: rel,
      meta: { format: ext.replace('.', '') },
      source: { extractor: 'builtin/openapi', location: rel },
    });

    const tags = (doc?.tags || []).map((t) => t.name).filter(Boolean);
    if (tags.length) {
      for (const t of tags) {
        entities.push({
          id: `component:${slug(`${title}:${t}`)}`,
          kind: 'component',
          name: `${title}: ${t}`,
          source: { extractor: 'builtin/openapi', location: rel },
        });
      }
    } else if (doc?.paths) {
      const segs = new Set();
      for (const p of Object.keys(doc.paths)) {
        const first = (p || '').split('/').filter(Boolean)[0];
        if (first) segs.add(first);
      }
      for (const s of Array.from(segs).slice(0, 50)) {
        entities.push({
          id: `component:${slug(`${title}:${s}`)}`,
          kind: 'component',
          name: `${title}: ${s}`,
          source: { extractor: 'builtin/openapi', location: rel },
        });
      }
    }

    const hinted =
      doc?.info?.['x-archlette-container'] ||
      doc?.['x-archlette-container'] ||
      ctx.inputs?.container_hint;
    if (hinted) {
      relations.push({
        from: apiId,
        to: hinted,
        label: 'served_by',
        source: { extractor: 'builtin/openapi', location: rel },
      });
    }
  }

  ctx.log(`openapi: parsed ${files.length} spec(s)`);
  return { entities, relations, artifacts };
}

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
