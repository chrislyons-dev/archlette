/**
 * Stage module loaders
 *
 * @module core
 * @description
 * Dynamic loaders for stage modules (extractors, validators, generators).
 */

import { loadModuleFromPath } from './module-loader';
import { getStageEntry } from './stage-entry.js';

// Extractor modules: (node: ResolvedStageNode) => ArchletteIR | Promise<ArchletteIR>
export async function loadExtractorModule(modulePath: string) {
  const { module: mod, path: resolved } = await loadModuleFromPath(modulePath);
  const m = mod as any;
  const entry = getStageEntry(m) ?? m.default ?? m.run;
  if (typeof entry !== 'function') {
    throw new Error(
      `Extractor module ${modulePath} (resolved to ${resolved}) does not export a callable entry.`,
    );
  }
  return { entry, resolved };
}

// Validator modules: (ir: ArchletteIR) => ArchletteIR | Promise<ArchletteIR>
export async function loadValidatorModule(modulePath: string) {
  const { module: mod, path: resolved } = await loadModuleFromPath(modulePath);
  const m = mod as any;
  const entry = getStageEntry(m) ?? m.default ?? m.run;
  if (typeof entry !== 'function') {
    throw new Error(
      `Validator module ${modulePath} (resolved to ${resolved}) does not export a callable entry.`,
    );
  }
  return { entry, resolved };
}

// Generator modules: (ir: ArchletteIR, node: ResolvedStageNode) => string | Promise<string>
export async function loadGeneratorModule(modulePath: string) {
  const { module: mod, path: resolved } = await loadModuleFromPath(modulePath);
  const m = mod as any;
  const entry = getStageEntry(m) ?? m.default ?? m.run;
  if (typeof entry !== 'function') {
    throw new Error(
      `Generator module ${modulePath} (resolved to ${resolved}) does not export a callable entry.`,
    );
  }
  return { entry, resolved };
}

// Add more loaders for renderers, docs as needed
