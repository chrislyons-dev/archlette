#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { runGenerate, runExtract, runValidate, runDsl, runImages, runDocs } from '../src/core/run.js';
import { loadConfig } from '../src/core/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function usage(exitCode = 0) {
  console.log(`Usage: archlette <command> [options]

Commands:
  init                   create a starter aac.yaml
  generate               run extract → validate → dsl → images → docs
  extract                run extractor pipeline → .archlette/ir.json
  validate               validate .archlette/ir.json against schema
  dsl                    generate Structurizr DSL from IR
  images                 export images from DSL (Structurizr CLI)
  docs                   write docs index (links IR + diagrams)

Options:
  --config <path>        path to aac.yaml (default: ./aac.yaml)
  --base-dir <dir>       pipeline working directory (default: CWD)
  --ir-only              stop after extract (generate only)
  --quiet                minimal output
  --verbose              extra output
  -v, --version          print version
  -h, --help             show this help
`);
  process.exit(exitCode);
}

const argv = (() => {
  const out = { _: [] };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-h' || a === '--help') out.help = true;
    else if (a === '-v' || a === '--version') out.version = true;
    else if (a === '--ir-only') out.irOnly = true;
    else if (a === '--quiet') out.quiet = true;
    else if (a === '--verbose') out.verbose = true;
    else if (a === '--config') { out.config = args[++i]; }
    else if (a === '--base-dir') { out.baseDir = args[++i]; }
    else if (a.startsWith('--config=')) out.config = a.split('=')[1];
    else if (a.startsWith('--base-dir=')) out.baseDir = a.split('=')[1];
    else out._.push(a);
  }
  return out;
})();

async function ensureConfig(at) {
  try { await fs.stat(at); return true; } catch { return false; }
}

async function cmdInit() {
  const target = argv.config || path.resolve(process.cwd(), 'aac.yaml');
  const exists = await ensureConfig(target);
  if (exists) { console.log(`aac.yaml already exists at: ${target}`); return; }
  const tmpl = `project:
  name: Archlette Project

ir:
  path: .archlette/ir.json
  publish_copy: true

docs:
  out_dir: docs/architecture

extractors:
  - use: builtin/terraform
    inputs: { include: ["iac/**"] }
  - use: builtin/code-annotations
    inputs: { include: ["services/**","apps/**","**/*.{ts,js,py}"] }
  - use: builtin/openapi
    inputs: { include: ["apis/**/openapi*.{yml,yaml,json}"] }

validators:
  - use: builtin/schema

dsl:
  - use: builtin/structurizr
    inputs:
      out_dir: build/structurizr
      views: ["C1","C2","C3"]
      autolayout: { direction: lr, rankSeparation: 200 }

images:
  - use: builtin/structurizr-cli
    inputs:
      in: build/structurizr/workspace.dsl
      out_dir: docs/architecture/structurizr
      formats: ["svg"]
      cli: structurizr

docsStage:
  - use: builtin/index
    inputs: { out_dir: docs/architecture }
`;
  await fs.writeFile(target, tmpl, 'utf8');
  console.log(`✓ Created ${path.relative(process.cwd(), target)}`);
}

async function withConfig(fn) {
  const baseDir = argv.baseDir ? path.resolve(argv.baseDir) : process.cwd();
  if (argv.verbose) process.env.ARCHLETTE_VERBOSE = '1';
  const cfg = await loadConfig(argv.config ? path.resolve(argv.config) : undefined, { baseDir });
  return fn(cfg, { baseDir: baseDir, irOnly: argv.irOnly === true });
}

async function main() {
  if (argv.help) return usage(0);
  if (argv.version) {
    const pkgPath = path.resolve(__dirname, '../package.json');
    try {
      const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
      console.log(pkg.version || '0.0.0');
    } catch { console.log('0.0.0'); }
    return;
  }

  const cmd = argv._[0] || 'generate';

  try {
    if (cmd === 'init') return await cmdInit();
    if (cmd === 'extract') return await withConfig((cfg, opts) => runExtract(cfg, opts));
    if (cmd === 'validate') return await withConfig((cfg, opts) => runValidate(cfg, opts));
    if (cmd === 'dsl') return await withConfig((cfg, opts) => runDsl(cfg, opts));
    if (cmd === 'images') return await withConfig((cfg, opts) => runImages(cfg, opts));
    if (cmd === 'docs') return await withConfig((cfg, opts) => runDocs(cfg, opts));
    if (cmd === 'generate') return await withConfig((cfg, opts) => runGenerate(cfg, opts));
    console.error(`Unknown command: ${cmd}\n`);
    usage(1);
  } catch (err) {
    console.error(err?.message || err);
    process.exitCode = 1;
  }
}

main();
