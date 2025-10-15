import { pathToFileURL } from 'node:url';
import * as fs from 'node:fs';

import type { PipelineContext, StageModule } from './core/types.ts';
import { getStageEntry } from './core/stage-entry.js';
import { loadModuleFromPath } from './core/module-loader.js';
import { resolveArchlettePath, getCliDir } from './core/path-resolver.js';

const STAGE_DIRS = {
  extract: '1-extract',
  validate: '2-validate',
  generate: '3-generate',
  render: '4-render',
  docs: '5-docs',
};
const STAGE_ORDER = ['extract', 'validate', 'generate', 'render', 'docs'];

function usageAndExit(msg: string) {
  if (msg) console.error(`\nError: ${msg}\n`);
  console.log(
    `Usage: archlette <stage> [-f <config.yaml>]

<stage>: all | extract | validate | generate | render | docs
  - "all" and "docs" both run the full pipeline (extract→validate→generate→render→docs)

Options:
  -f <file>   YAML config file path. Defaults to ../aac.yaml (resolved relative to the CLI file).`,
  );
  process.exit(2);
}

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  if (args.length === 0) usageAndExit('Missing required <stage> argument.');

  const stageArg = String(args[0] || '').toLowerCase();
  const valid = new Set(['all', ...STAGE_ORDER]);
  if (!valid.has(stageArg)) usageAndExit(`Invalid stage "${stageArg}".`);

  let yamlPathArg = null;
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '-f') {
      const next = args[i + 1];
      if (!next) usageAndExit('Missing value for -f <file>.');
      yamlPathArg = next;
      i++;
    } else {
      usageAndExit(`Unknown option "${args[i]}".`);
    }
  }
  return { stageArg, yamlPathArg };
}

function stageListFromArg(stageArg: string) {
  if (stageArg === 'all' || stageArg === 'docs') return [...STAGE_ORDER];
  const idx = STAGE_ORDER.indexOf(stageArg);
  return STAGE_ORDER.slice(0, idx + 1);
}

function createLogger() {
  const tag = (lvl: string) => `[archlette:${lvl}]`;
  return {
    debug: (...a: unknown[]) => console.debug(tag('debug'), ...a),
    info: (...a: unknown[]) => console.log(tag('info'), ...a),
    warn: (...a: unknown[]) => console.warn(tag('warn'), ...a),
    error: (...a: unknown[]) => console.error(tag('error'), ...a),
  };
}

async function loadYamlIfExists(resolvedFile: string) {
  if (!resolvedFile) return { config: null, path: null };
  if (!fs.existsSync(resolvedFile)) return { config: null, path: null };
  try {
    const YAML: typeof import('yaml') = await import('yaml'); // <- typed
    const text = fs.readFileSync(resolvedFile, 'utf8');
    const parsed = YAML.parse(text);
    return { config: parsed ?? null, path: resolvedFile };
  } catch {
    console.warn(
      `[archlette] Found ${resolvedFile} but "yaml" is not installed; skipping parse.`,
    );
    return { config: null, path: resolvedFile };
  }
}

export async function run(argv = process.argv) {
  const { stageArg, yamlPathArg } = parseArgs(argv);
  const cliDir = getCliDir(import.meta.url);

  // config path: default ../aac.yaml (CLI-relative) or user -f path (~/, /, or CLI-relative)
  const defaultYaml = resolveArchlettePath('../aac.yaml', { cliDir });
  const chosenYaml = yamlPathArg
    ? resolveArchlettePath(yamlPathArg, { cliDir })
    : defaultYaml;

  const { config, path } = await loadYamlIfExists(chosenYaml);

  /** Shared pipeline context passed to stages if they export a function */
  const ctx: PipelineContext = {
    config,
    state: {},
    log: createLogger(),
  };

  const stagesToRun = stageListFromArg(stageArg);
  ctx.log.info(`Starting pipeline: ${stagesToRun.join(' → ')}`);
  ctx.log.info(
    path
      ? `Using config: ${path}`
      : `No config file found (looked for: ${chosenYaml}). Proceeding.`,
  );

  for (const stage of stagesToRun) {
    const stageKey = stage as keyof typeof STAGE_DIRS;
    const spec = `./${STAGE_DIRS[stageKey]}`;
    ctx.log.info(`Stage: ${stage}`);
    try {
      // Tell the loader what shape we expect
      const { module: stageMod, path: resolved } =
        await loadModuleFromPath<StageModule>(spec, import.meta.url);

      ctx.log.debug(`Loaded: ${resolved}`);

      const entry = getStageEntry(stageMod);
      if (entry) {
        await entry(ctx);
      } else {
        ctx.log.debug(
          `No exported function in ${resolved}; assuming side-effect execution on import.`,
        );
      }
    } catch (err) {
      ctx.log.error(`Stage "${stage}" failed:`, (err as Error)?.stack || err);
      process.exit(1);
    }
  }
  ctx.log.info('Pipeline complete.');
}

// only auto-run if executed as a program, not when imported by vitest
const isDirect = (() => {
  try {
    return import.meta.url === pathToFileURL(process.argv[1] || '').href;
  } catch {
    return false;
  }
})();

if (isDirect) {
  run().catch((e) => {
    console.error('[archlette:fatal]', e?.stack || e);
    process.exit(1);
  });
}
