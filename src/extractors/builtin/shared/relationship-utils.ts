/**
 * @module shared
 * Shared utility functions for extractors
 */

import type { Relationship } from '../../../core/types-ir.js';

/**
 * Deduplicate relationships by source+destination combination
 * - Excludes self-referential relationships (source === destination)
 * - Merges descriptions and stereotypes with " | " separator when duplicates are found
 * - Extracts imported names from descriptions (removes "imports " prefix) and keeps only unique names
 * - Returns one relationship per unique source+destination pair
 */
export function deduplicateRelationships(
  relationships: Relationship[],
): Relationship[] {
  const seen = new Map<string, Relationship>();

  for (const rel of relationships) {
    // Skip self-referential relationships
    if (rel.source === rel.destination) {
      continue;
    }

    const key = `${rel.source}:${rel.destination}`;

    if (!seen.has(key)) {
      // First occurrence - store as-is
      seen.set(key, { ...rel });
    } else {
      // Duplicate found - merge descriptions and stereotypes
      const existing = seen.get(key);

      // Skip if existing is undefined (should never happen due to has check)
      if (!existing) {
        continue;
      }

      // Merge descriptions - extract unique imported names
      if (rel.description && rel.description !== existing.description) {
        const allDescriptions = [existing.description, rel.description].filter(
          Boolean,
        ) as string[];
        const uniqueNames = new Set<string>();

        for (const desc of allDescriptions) {
          // Split by " | " to handle already-merged descriptions
          const parts = desc.split(' | ');
          for (const part of parts) {
            // Extract the imported name (remove "imports " prefix if present)
            const name = part.trim().replace(/^imports\s+/, '');
            if (name) {
              uniqueNames.add(name);
            }
          }
        }

        existing.description = Array.from(uniqueNames).join(' | ');
      }

      // Merge stereotypes
      if (rel.stereotype && rel.stereotype !== existing.stereotype) {
        const stereotypes = new Set(
          [existing.stereotype, rel.stereotype].filter(Boolean),
        );
        existing.stereotype = Array.from(stereotypes).join(' | ');
      }
    }
  }

  return Array.from(seen.values());
}
