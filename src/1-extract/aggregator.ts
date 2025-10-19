/**
 * ArchletteIR aggregation utilities
 *
 * @module extractors
 * @description
 * Combines multiple ArchletteIR objects from different extractors into a single
 * unified IR. Handles deduplication, conflict resolution, and merging of all
 * architecture elements.
 *
 * The aggregator performs the following operations:
 * 1. Uses the first IR's system metadata as the base
 * 2. Deduplicates entities by ID across all IRs
 * 3. Merges arrays of elements (actors, containers, components, code, etc.)
 * 4. Combines relationships from all sources
 * 5. Preserves metadata and descriptions from the first occurrence
 *
 * @example
 * ```typescript
 * const ir1 = await codeExtractor.extract();
 * const ir2 = await iacExtractor.extract();
 * const aggregated = aggregateIRs([ir1, ir2]);
 * ```
 */

import type { ArchletteIR, Relationship } from '../core/types-ir.js';

/**
 * Aggregate multiple ArchletteIR objects into a single unified IR
 *
 * @param irs - Array of ArchletteIR objects to merge
 * @returns A single aggregated ArchletteIR with deduplicated elements
 *
 * @remarks
 * - If the input array is empty, returns a minimal valid IR
 * - System metadata is taken from the first IR
 * - Elements are deduplicated by ID (first occurrence wins)
 * - Relationships are deduplicated by source+destination+stereotype combination
 *
 * @example
 * ```typescript
 * const results = [ir1, ir2, ir3];
 * const merged = aggregateIRs(results);
 * // merged contains all unique elements from all three IRs
 * ```
 */
export function aggregateIRs(irs: ArchletteIR[]): ArchletteIR {
  if (irs.length === 0) {
    return createEmptyIR();
  }

  if (irs.length === 1) {
    return irs[0];
  }

  const base = irs[0];

  // Aggregate all elements with deduplication
  const actors = deduplicateById(irs.flatMap((ir) => ir.actors));
  const containers = deduplicateById(irs.flatMap((ir) => ir.containers));
  const components = deduplicateById(irs.flatMap((ir) => ir.components));
  const code = deduplicateById(irs.flatMap((ir) => ir.code));
  const deployments = deduplicateByName(irs.flatMap((ir) => ir.deployments));

  // Aggregate relationships with deduplication
  const containerRelationships = deduplicateRelationships(
    irs.flatMap((ir) => ir.containerRelationships),
  );
  const componentRelationships = deduplicateRelationships(
    irs.flatMap((ir) => ir.componentRelationships),
  );
  const codeRelationships = deduplicateRelationships(
    irs.flatMap((ir) => ir.codeRelationships),
  );
  const deploymentRelationships = deduplicateRelationships(
    irs.flatMap((ir) => ir.deploymentRelationships),
  );

  return {
    version: base.version,
    system: base.system, // Use first IR's system metadata
    actors,
    containers,
    components,
    code,
    deployments,
    containerRelationships,
    componentRelationships,
    codeRelationships,
    deploymentRelationships,
  };
}

/**
 * Deduplicate array of entities by their ID field
 *
 * @param items - Array of entities with id property
 * @returns Array with duplicates removed (first occurrence preserved, descriptions merged)
 *
 * @remarks
 * When duplicate IDs are found, their descriptions are concatenated with ' | ' separator.
 * Duplicate descriptions are automatically filtered out.
 */
function deduplicateById<T extends { id: string; description?: string }>(
  items: T[],
): T[] {
  const seen = new Map<string, T>();
  const descriptions = new Map<string, Set<string>>();

  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.set(item.id, item);
      descriptions.set(item.id, new Set(item.description ? [item.description] : []));
    } else {
      if (item.description) {
        descriptions.get(item.id)!.add(item.description);
      }
    }
  }

  // Merge unique descriptions
  for (const [id, item] of seen.entries()) {
    const uniqueDescriptions = Array.from(descriptions.get(id) || []);
    if (uniqueDescriptions.length > 1) {
      item.description = uniqueDescriptions.join(' | ');
    }
  }

  return Array.from(seen.values());
}

/**
 * Deduplicate array of entities by their name field
 *
 * @param items - Array of entities with name property
 * @returns Array with duplicates removed (first occurrence preserved, descriptions merged)
 *
 * @remarks
 * When duplicate names are found, their descriptions are concatenated with ' | ' separator.
 * Duplicate descriptions are automatically filtered out.
 */
function deduplicateByName<T extends { name: string; description?: string }>(
  items: T[],
): T[] {
  const seen = new Map<string, T>();
  const descriptions = new Map<string, Set<string>>();

  for (const item of items) {
    if (!seen.has(item.name)) {
      seen.set(item.name, item);
      descriptions.set(item.name, new Set(item.description ? [item.description] : []));
    } else {
      if (item.description) {
        descriptions.get(item.name)!.add(item.description);
      }
    }
  }

  // Merge unique descriptions
  for (const [name, item] of seen.entries()) {
    const uniqueDescriptions = Array.from(descriptions.get(name) || []);
    if (uniqueDescriptions.length > 1) {
      item.description = uniqueDescriptions.join(' | ');
    }
  }

  return Array.from(seen.values());
}

/**
 * Deduplicate relationships by source+destination+stereotype combination
 *
 * @param relationships - Array of relationships to deduplicate
 * @returns Array with duplicate relationships removed
 *
 * @remarks
 * Two relationships are considered duplicates if they have the same:
 * - source ID
 * - destination ID
 * - stereotype (undefined stereotypes are treated as distinct from defined ones)
 * The first occurrence is preserved, including its description.
 * This allows multiple relationships between the same elements with different stereotypes.
 */
function deduplicateRelationships(relationships: Relationship[]): Relationship[] {
  const seen = new Map<string, Relationship>();
  // Filter out undefined/null values before processing
  for (const rel of relationships.filter((r) => r && r.source && r.destination)) {
    const key = `${rel.source}:${rel.destination}:${rel.stereotype ?? ''}`;
    if (!seen.has(key)) {
      seen.set(key, rel);
    }
  }
  return Array.from(seen.values());
}

/**
 * Create an empty but valid ArchletteIR structure
 *
 * @returns A minimal valid ArchletteIR with no elements
 */
function createEmptyIR(): ArchletteIR {
  return {
    version: '1.0',
    system: {
      name: 'Unknown System',
      description: 'No extractors produced valid IR',
    },
    actors: [],
    containers: [],
    components: [],
    code: [],
    deployments: [],
    containerRelationships: [],
    componentRelationships: [],
    codeRelationships: [],
    deploymentRelationships: [],
  };
}
