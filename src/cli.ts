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

import type { PipelineContext, StageModule } from './core/types.js';
import { getStageEntry } from './core/stage-entry.js';
import { loadModuleFromPath } from './core/module-loader.js';
import { loadConfig } from './core/config-resolver.js';
import { createLogger } from './core/logger.js';
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
  LOGGER.info(`Usage: archlette [-f <config.yaml>] [stage]

  Stages (optional, defaults to 'all'):
    all | extract | validate | generate | render | docs
    - "all" and "docs" both run the full pipeline (extract-->validate-->generate-->render-->docs)
    - Each stage runs all previous stages automatically

  Options:
    -f <file>   YAML config file path. Defaults to templates/default.yaml

  Examples:
    archlette                     # Run 'all' with default config
    archlette -f .aac.yaml        # Run 'all' with custom config
    archlette extract             # Run 'extract' with default config
    archlette -f .aac.yaml extract # Run 'extract' with custom config`);
  if (msg) {
    LOGGER.error(`\nError: ${msg}\n`);
    process.exit(2);
  } else {
    process.exit(0);
  }
}

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const valid = new Set(['all', ...STAGE_ORDER]);

  let stageArg = 'all'; // Default stage
  let yamlPathArg: string | undefined = undefined;

  // Parse arguments - handle -f flag and optional stage
  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '-f') {
      const next = args[i + 1];
      if (!next) usageAndExit('Missing value for -f <file>.');
      yamlPathArg = next;
      i += 2;
    } else if (arg === '--help' || arg === '-h') {
      usageAndExit('');
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

export async function run(argv = process.argv) {
  const { stageArg, yamlPathArg } = parseArgs(argv);

  // Load configuration using config-resolver module
  // Handles: path resolution, base directory determination, YAML parsing, validation
  const loaded = loadConfig(yamlPathArg);

  /** Shared pipeline context passed to stages if they export a function */
  const ctx: PipelineContext = {
    config: loaded.config,
    state: {},
    log: LOGGER,
    configBaseDir: loaded.baseDir,
  };

  const stagesToRun = stageListFromArg(stageArg);
  ctx.log.info(`Starting pipeline: ${stagesToRun.join(' → ')}`);

  // Log config status (loaded.configPath contains the path that was attempted)
  // For tests and debugging, we need to show what was looked for
  if (loaded.configPath) {
    ctx.log.info(`Using config: ${loaded.configPath}`);
  } else {
    // No config file - show what we looked for
    const attemptedPath = loaded.attemptedPath || 'config file';
    ctx.log.info(`No config file found (looked for: ${attemptedPath}). Proceeding.`);
  }

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
