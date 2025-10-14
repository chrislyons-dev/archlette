import path from 'node:path';
import { resolvePaths } from '../util/glob.js';

/**
 * Terraform extractor (placeholder implementation).
 * Emits an infra Entity per matched .tf file.
 *
 * inputs:
 *  - include: ["iac/**"] by default (expanded to **\/*.tf)
 *  - exclude: ["**\/.terraform/**"] by default
 *  - roots:   legacy fallback -> converted to `${root}/**\/*.tf`
 */
export async function run(ctx) {
  const defaultsInclude = (ctx.inputs?.roots ?? ['iac']).map((r) => `${r}/**/*.tf`);

  const files = (
    await resolvePaths(ctx.repoRoot, {
      include: ctx.inputs?.include ?? defaultsInclude,
      exclude: ctx.inputs?.exclude ?? ['**/.terraform/**'],
    })
  ).filter((f) => f.endsWith('.tf'));

  const entities = files.map((f) => {
    const rel = path.relative(ctx.repoRoot, f).replaceAll('\\', '/');
    const name = rel.split('/').slice(-2).join('/'); // folder/file.tf
    const id = `infra:${name.replace(/[^\w.-]/g, '_')}`;
    return {
      id,
      kind: 'infra',
      name,
      tags: ['terraform'],
      source: { extractor: 'builtin/terraform', location: rel },
    };
  });

  ctx.log(`terraform: found ${files.length} .tf files`);
  return { entities, relations: [] };
}
