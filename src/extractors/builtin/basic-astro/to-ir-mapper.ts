/**
 * @module basic-astro
 * Map extracted data to ArchletteIR format
 */

import { ROOT_COMPONENT_MARKER } from './component-detector.js';
import type {
  ArchletteIR,
  CodeItem,
  System,
  Relationship,
  Component,
  Actor,
  Container,
} from '../../../core/types-ir.js';
import type { FileExtraction, PackageInfo } from './types.js';
import {
  TAGS,
  DEFAULT_CONTAINER_ID,
  IR_VERSION,
  nameToId,
  sanitizeId,
} from '../../../core/constants.js';

/**
 * Map file extractions to ArchletteIR
 */
export function mapToIR(
  extractions: FileExtraction[],
  packages?: PackageInfo[],
  systemInfo?: System,
): ArchletteIR {
  // TODO: Implement IR mapping
  // 1. Aggregate components, actors, relationships from all files
  // 2. Create containers from packages
  // 3. Apply hierarchical IDs: container__component__code
  // 4. Handle ROOT_COMPONENT_MARKER replacement
  // 5. Map actors and relationships
  // 6. Build final IR structure

  const containers: Container[] = [];
  const components: Component[] = [];
  const actors: Actor[] = [];
  const codeItems: CodeItem[] = [];
  const componentRelationships: Relationship[] = [];

  return {
    version: IR_VERSION,
    system: systemInfo || {
      name: 'Astro System',
      description: 'System extracted from Astro components',
    },
    actors,
    containers,
    components,
    code: codeItems,
    deployments: [],
    containerRelationships: [],
    componentRelationships,
    codeRelationships: [],
    deploymentRelationships: [],
  };
}
