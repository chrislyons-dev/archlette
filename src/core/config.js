import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

const DEFAULT_OUT_DIR = 'docs/architecture';

export async function loadConfig() {
  const candidates = ['aac.yaml', 'aac.yml'];
  let file = null;
  for (const c of candidates) {
    try {
      await fs.access(c);
      file = c;
      break;
    } catch {
      /* not found, ignore */
    }
  }
  if (!file) throw new Error('No aac.yaml found in repo root.');
  const raw = await fs.readFile(file, 'utf8');
  const cfg = YAML.parse(raw);
  cfg.docs = cfg.docs || {};
  cfg.docs.out_dir = cfg.docs.out_dir || DEFAULT_OUT_DIR;
  cfg.generators = cfg.generators || [];
  cfg.tools = cfg.tools || {};
  // tool defaults (can be overridden in aac.yaml)
  cfg.tools.plantuml = cfg.tools.plantuml || {
    enabled: true,
    jar: process.env.PLANTUML_JAR || './tools/plantuml.jar',
    render: ['-tpng'], // additional formats: -tsvg
  };
  cfg.tools.mermaid = cfg.tools.mermaid || {
    enabled: false,
    mmdc: 'mmdc', // assumes @mermaid-js/mermaid-cli installed
  };
  cfg.tools.inframap = cfg.tools.inframap || {
    enabled: false,
    cmd: 'inframap', // assumes inframap available in PATH
  };
  cfg.tools.graphviz = cfg.tools.graphviz || {
    dot: 'dot', // for DOT->PNG/SVG
  };
  return cfg;
}

export function resolveOutDir(cfg) {
  return path.resolve(process.cwd(), cfg.docs.out_dir);
}
