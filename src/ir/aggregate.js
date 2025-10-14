import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Fan-out to all configured extractors, aggregate their outputs,
 * normalize, and write IR files.
 *
 * @param {any} cfg        aac.yaml parsed object
 * @param {string} repoRoot
 * @param {Record<string, Function>} registry   extractor registry
 */
export async function aggregateIR(cfg, repoRoot, registry) {
  const ir = {
    version: '1',
    project: { name: cfg.project?.name || 'Project' },
    generatedAt: new Date().toISOString(),
    provenance: {
      extractors: (cfg.extractors || []).map((e) => ({ name: e.name, use: e.use })),
    },
    entities: [],
    relations: [],
    artifacts: [],
  };

  for (const ex of cfg.extractors || []) {
    const fn = registry[ex.use];
    if (!fn) {
      console.warn('No extractor:', ex.use);
      continue;
    }
    const res = await fn({
      repoRoot,
      inputs: ex.inputs || {},
      log: (...a) => console.log(`[${ex.name || ex.use}]`, ...a),
    });
    if (res.entities) ir.entities.push(...res.entities);
    if (res.relations) ir.relations.push(...res.relations);
    if (res.artifacts) ir.artifacts.push(...res.artifacts);
    (res.warnings || []).forEach((w) => console.warn(`[${ex.name || ex.use}]`, w));
  }

  // de-dupe entities by id (merge tags/props)
  const byId = new Map();
  for (const e of ir.entities) {
    const prev = byId.get(e.id);
    if (!prev) byId.set(e.id, e);
    else {
      prev.tags = Array.from(new Set([...(prev.tags || []), ...(e.tags || [])]));
      prev.props = { ...(prev.props || {}), ...(e.props || {}) };
    }
  }
  ir.entities = Array.from(byId.values()).sort(
    (a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id),
  );
  ir.relations.sort((a, b) => (a.from + a.to).localeCompare(b.from + b.to));
  ir.artifacts.sort((a, b) => a.id.localeCompare(b.id));

  const out = path.resolve(repoRoot, cfg.ir?.path || '.archlette/ir.json');
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, JSON.stringify(ir, null, 2), 'utf8');

  if (cfg.ir?.publish_copy) {
    const docs = path.resolve(
      repoRoot,
      cfg.docs?.out_dir || 'docs/architecture',
      'ir.json',
    );
    await fs.mkdir(path.dirname(docs), { recursive: true });
    await fs.writeFile(docs, JSON.stringify(ir, null, 2), 'utf8');
  }

  return ir;
}
