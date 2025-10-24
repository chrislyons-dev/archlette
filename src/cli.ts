#!/usr/bin/env node

/**
 * Archlette CLI - Architecture-as-Code toolkit
 *
 * @module CLI
 * @description
 * Command-line interface for the Archlette Architecture-as-Code toolkit.
 * Orchestrates the full AAC pipeline from extraction through documentation.
 *
 * ## Pipeline Stages
 *
 * 1. **Extract**: Analyze source materials (code, IaC) to produce ArchletteIR
 * 2. **Validate**: Validate and enrich the IR
 * 3. **Generate**: Transform IR into DSL formats (Structurizr, PlantUML, etc.)
 * 4. **Render**: Convert DSL to visual diagrams
 * 5. **Docs**: Generate documentation from diagrams and IR
 *
 * ## Usage
 *
 * ```bash
 * # Run full pipeline (default)
 * archlette
 * archlette -f .aac.yaml
 *
 * # Run specific stage
 * archlette extract
 * archlette -f .aac.yaml extract
 * ```
 *
 * ## Configuration
 *
 * The CLI reads configuration from a YAML file (default: `templates/default.yaml`)
 * that specifies which modules to load for each stage.
 *
 * @actor User {Person} {in} End user who runs archlette commands
 * @uses extractors Analyzes source code to extract architecture components
 * @uses validators Validates and enriches intermediate representation
 * @uses generators Transforms IR into DSL formats
 * @uses renderers Converts DSL to visual diagrams
 * @uses core Provides shared utilities, types, and module loading
 *
 * @see {@link module:core/types-aac} for configuration schema
 */

import { pathToFileURL } from 'node:url';
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { PipelineContext, StageModule } from './core/types.ts';
import type { ResolvedAACConfig } from './core/types-aac.ts';
import { getStageEntry } from './core/stage-entry.js';
import { loadModuleFromPath } from './core/module-loader.js';
import { resolveArchlettePath, getCliDir, expandTilde } from './core/path-resolver.js';
import { AACConfigSchema as aacConfigSchema, resolveConfig } from './core/types-aac.js';
import { createLogger } from './core/logger.js';

const DEFAULT_YAML_PATH = 'templates/default.yaml';
const STAGE_DIRS = {
  extract: '1-extract',
  validate: '2-validate',
  generate: '3-generate',
  render: '4-render',
  docs: '5-docs',
};
const STAGE_ORDER = ['extract', 'validate', 'generate', 'render', 'docs'];
const LOGGER = createLogger({ context: 'archlette-cli', level: 'info' });

function usageAndExit(msg: string) {
  if (msg) LOGGER.error(`\nError: ${msg}\n`);
  LOGGER.info(
    `Usage: archlette [-f <config.yaml>] [stage]

Stages (optional, defaults to 'all'):
  all | extract | validate | generate | render | docs
  - "all" and "docs" both run the full pipeline (extract→validate→generate→render→docs)
  - Each stage runs all previous stages automatically

Options:
  -f <file>   YAML config file path. Defaults to templates/default.yaml

Examples:
  archlette                     # Run 'all' with default config
  archlette -f .aac.yaml        # Run 'all' with custom config
  archlette extract             # Run 'extract' with default config
  archlette -f .aac.yaml extract # Run 'extract' with custom config`,
  );
  process.exit(2);
}

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const valid = new Set(['all', ...STAGE_ORDER]);

  let stageArg = 'all'; // Default stage
  let yamlPathArg = null;

  // Parse arguments - handle -f flag and optional stage
  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '-f') {
      const next = args[i + 1];
      if (!next) usageAndExit('Missing value for -f <file>.');
      yamlPathArg = next;
      i += 2;
    } else if (arg.startsWith('-')) {
      usageAndExit(`Unknown option "${arg}".`);
    } else {
      // Non-flag argument - must be a stage
      const providedStage = arg.toLowerCase();
      if (!valid.has(providedStage)) {
        usageAndExit(`Invalid stage "${providedStage}".`);
      }
      stageArg = providedStage;
      i++;
    }
  }

  return { stageArg, yamlPathArg };
}

function stageListFromArg(stageArg: string) {
  if (stageArg === 'all' || stageArg === 'docs') return [...STAGE_ORDER];
  const idx = STAGE_ORDER.indexOf(stageArg);
  return STAGE_ORDER.slice(0, idx + 1);
}

async function loadYamlIfExists(resolvedFile: string) {
  if (!resolvedFile) return { config: null, path: null };
  if (!fs.existsSync(resolvedFile)) return { config: null, path: null };
  try {
    const YAML: typeof import('yaml') = await import('yaml'); // <- typed
    const text = fs.readFileSync(resolvedFile, 'utf8');
    const parsed = YAML.parse(text);
    const result = aacConfigSchema.safeParse(parsed);
    if (!result.success) {
      usageAndExit(`[archlette] Config validation failed: ${result.error}`);
    }
    return { config: parsed ?? null, path: resolvedFile };
  } catch {
    LOGGER.warn(
      `[archlette] Found ${resolvedFile} but "yaml" is not installed; skipping parse.`,
    );
    return { config: null, path: resolvedFile };
  }
}

export async function run(argv = process.argv) {
  const { stageArg, yamlPathArg } = parseArgs(argv);
  const cliDir = getCliDir();

  // Config path resolution:
  // - Default: templates/default.yaml (CLI-relative, in Archlette installation)
  // - User -f: resolve from CWD (where user runs command), with tilde expansion
  const defaultYaml = resolveArchlettePath(DEFAULT_YAML_PATH, { cliDir });
  const chosenYaml = yamlPathArg
    ? path.resolve(process.cwd(), expandTilde(yamlPathArg))
    : defaultYaml;

  // Determine base directory for resolving config-relative paths FIRST:
  // - If user specified a config file with -f: use its directory
  // - If using default template: use current working directory
  // - Otherwise: use current working directory
  const loaded = await loadYamlIfExists(chosenYaml);
  const configPath = loaded.path;
  const isUsingDefaultTemplate = !yamlPathArg && configPath === defaultYaml;
  const configBaseDir =
    configPath && !isUsingDefaultTemplate ? path.dirname(configPath) : process.cwd();

  // Parse and resolve config, passing configBaseDir for stage nodes
  let config: ResolvedAACConfig;
  if (loaded.config) {
    config = resolveConfig(loaded.config, { configBaseDir });
  } else {
    // Create minimal default config when no config file is found
    config = resolveConfig(
      {
        project: { name: 'archlette-project' },
        paths: {
          ir_out: './archlette-output/ir',
          dsl_out: './archlette-output/dsl',
          render_out: './archlette-output/render',
          docs_out: './archlette-output/docs',
        },
      },
      { configBaseDir },
    );
  }

  /** Shared pipeline context passed to stages if they export a function */
  const ctx: PipelineContext = {
    config,
    state: {},
    log: LOGGER,
    configBaseDir,
  };

  const stagesToRun = stageListFromArg(stageArg);
  ctx.log.info(`Starting pipeline: ${stagesToRun.join(' → ')}`);
  ctx.log.info(
    configPath
      ? `Using config: ${configPath}`
      : `No config file found (looked for: ${chosenYaml}). Proceeding.`,
  );

  for (const stage of stagesToRun) {
    const stageKey = stage as keyof typeof STAGE_DIRS;
    const spec = `./${STAGE_DIRS[stageKey]}`;

    // Create stage-specific logger
    const stageLogger = createLogger({
      context: stage.charAt(0).toUpperCase() + stage.slice(1),
      level: 'info',
    });
    const stageCtx = { ...ctx, log: stageLogger };

    stageLogger.info(`Starting ${stage} stage`);
    try {
      // Tell the loader what shape we expect
      const { module: stageMod, path: resolved } =
        await loadModuleFromPath<StageModule>(spec);

      stageLogger.debug(`Loaded module from ${resolved}`);

      const entry = getStageEntry(stageMod);
      if (entry) {
        await entry(stageCtx);
      } else {
        stageLogger.info(
          `No exported function in ${resolved}; assuming side-effect execution on import.`,
        );
      }
    } catch (err) {
      stageLogger.error(`Stage failed:`, (err as Error)?.stack || err);
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
    LOGGER.error('[archlette:fatal]', e?.stack || e);
    process.exit(1);
  });
}
