import fs from 'node:fs/promises';
import { loadConfig } from './core/config.js';
import { runGenerate } from './core/run.js';
import { setLevel, getLevel, log } from './core/log.js';

const pkgPath = new URL('../package.json', import.meta.url);
const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));

function parseArgs(argv) {
  const flags = { verbose: false, quiet: false, help: false, version: false };
  const rest = [];
  for (const a of argv) {
    if (a === '--verbose' || a === '-v') flags.verbose = true;
    else if (a === '--quiet' || a === '-q') flags.quiet = true;
    else if (a === '--help' || a === '-h') flags.help = true;
    else if (a === '--version') flags.version = true;
    else rest.push(a);
  }
  return { flags, rest };
}

function showBanner() {
  if (getLevel() === 'silent') return;
  const c = log.colors;
  const lines = [
    `╭────────────────────────────────────────────╮`,
    `│  🏗️  ${c.bold}Archlette${c.reset} v${pkg.version}                     │`,
    `│  Code speaks. Archlette listens.          │`,
    `│  Architecture evolves.                    │`,
    `╰────────────────────────────────────────────╯`,
  ];
  for (const l of lines) log.raw(l);
}

function help() {
  return `
Archlette – Architecture-as-Code

Usage:
  archlette [command] [--verbose|--quiet]

Commands:
  init            Scaffold aac.yaml + templates
  generate        Run all enabled generators
  validate        Basic checks for config & outputs
  publish         Placeholder publisher hook

Options:
  -v, --verbose   More logs (show external commands)
  -q, --quiet     Minimal logs (CI friendly)
  -h, --help      Show this help
  --version       Print version
`;
}

export async function main(argv) {
  const { flags, rest } = parseArgs(argv);
  if (flags.version) {
    console.log(pkg.version);
    return;
  }
  if (flags.quiet || process.env.CI === 'true') setLevel('silent');
  else if (flags.verbose) setLevel('verbose');
  else setLevel('info');

  const cmd = rest[0] || 'help';
  const topLevel = ['init', 'generate', 'validate', 'publish', 'help'].includes(cmd);
  if (topLevel && getLevel() !== 'silent') showBanner();

  if (cmd === 'help') {
    console.log(help());
    return;
  }
  if (flags.help) {
    console.log(help());
    return;
  }

  try {
    if (cmd === 'init') {
      await import('./init/scaffold.js').then((m) => m.scaffold());
      return;
    }
    const cfg = await loadConfig();
    log.verbose('config loaded from aac.yaml');
    if (cmd === 'generate') {
      await runGenerate(cfg);
      return;
    }
    if (cmd === 'validate') {
      console.log(
        '✓ validate (basic): config loaded, generators:',
        (cfg.generators || []).length,
      );
      return;
    }
    if (cmd === 'publish') {
      console.log('↪ publish: wire your publisher in src/publish/* and call it here.');
      return;
    }
    throw new Error(`Unknown command: ${cmd}`);
  } catch (err) {
    log.err(err?.message || err);
    process.exit(1);
  }
}
