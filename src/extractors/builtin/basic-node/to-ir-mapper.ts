/**
 * Map extracted data to ArchletteIR format
 */

import type {
  ArchletteIR,
  CodeItem,
  System,
  Relationship,
  Component,
} from '../../../core/types-ir.js';
import type {
  FileExtraction,
  ExtractedClass,
  ExtractedFunction,
  ExtractedMethod,
  ExtractedImport,
} from './types.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  TAGS,
  DEFAULT_CONTAINER_ID,
  IR_VERSION,
  nameToId,
} from '../../../core/constants.js';

/**
 * Map file extractions to ArchletteIR
 */
export function mapToIR(
  extractions: FileExtraction[],
  systemInfo?: System,
): ArchletteIR {
  const codeItems: CodeItem[] = [];
  const relationships: Relationship[] = [];
  const componentsMap = new Map<string, Component>();
  const actorsMap = new Map<string, any>();
  const componentRelationships: Relationship[] = [];

  // Extract code items, actors, and relationships from all files
  for (const file of extractions) {
    const componentId = file.component?.id;

    // Register component if found
    if (file.component && !componentsMap.has(file.component.id)) {
      componentsMap.set(file.component.id, {
        id: file.component.id,
        containerId: '', // Will be filled by IaC extractors or validators
        name: file.component.name,
        type: 'module',
        description: file.component.description,
      });
    }

    // Register actors if found
    for (const actor of file.actors) {
      if (!actorsMap.has(actor.id)) {
        actorsMap.set(actor.id, {
          id: actor.id,
          name: actor.name,
          type: actor.type,
          description: actor.description,
          tags: [],
          targets: [], // Relationships will be populated below
        });
      }

      // If an actor is declared in a component file, automatically create bidirectional relationship
      // Actor → Component: The actor interacts with/uses the component
      // Component → Actor: The component depends on/uses the actor
      // This applies to both Person (users) and System (external systems) actors
      if (componentId) {
        const actorData = actorsMap.get(actor.id);

        // Create actor → component relationship (stored in actor.targets)
        if (actorData && !actorData.targets.includes(componentId)) {
          actorData.targets.push(componentId);
        }

        // Create component → actor relationship (stored in componentRelationships)
        const relationshipExists = componentRelationships.some(
          (rel) => rel.source === componentId && rel.destination === actor.id,
        );
        if (!relationshipExists) {
          const description =
            actor.type === 'Person'
              ? `Interacts with ${actor.name}`
              : `Uses ${actor.name} for external system integration`;
          componentRelationships.push({
            source: componentId,
            destination: actor.id,
            description,
            tags: [],
          });
        }
      }
    }

    // Process @uses relationships from this file
    // @uses tags create component → component relationships
    for (const rel of file.relationships) {
      if (componentId) {
        // Convert target name to ID (lowercase, etc.)
        const targetId = nameToId(rel.target);

        // Create component → component relationship
        componentRelationships.push({
          source: componentId,
          destination: targetId,
          description: rel.description || 'Uses',
          tags: [],
        });
      }
    }

    // Add functions
    for (const func of file.functions) {
      codeItems.push(mapFunction(func, file.filePath, componentId));
    }

    // Add classes and their methods
    for (const cls of file.classes) {
      codeItems.push(mapClass(cls, file.filePath, componentId));

      // Add methods as separate code items
      for (const method of cls.methods) {
        codeItems.push(mapMethod(method, cls.name, file.filePath, componentId));
      }
    }

    // Add import relationships
    for (const imp of file.imports) {
      relationships.push(...mapImportRelationships(imp, file.filePath));
    }
  }

  const system = systemInfo || getDefaultSystem();
  const components = Array.from(componentsMap.values());
  const containers = [];

  // If we have components but no containers, create a default container
  // This handles the common case of a single application/service
  if (components.length > 0 && containers.length === 0) {
    const defaultContainer = {
      id: DEFAULT_CONTAINER_ID,
      name: system.name,
      type: 'Application',
      layer: 'Application',
      description: system.description || 'Main application container',
      tags: [TAGS.AUTO_GENERATED],
    };
    containers.push(defaultContainer);

    // Assign all components to this container
    for (const component of components) {
      component.containerId = defaultContainer.id;
    }
  }

  // Deduplicate component relationships (same source+destination)
  const uniqueComponentRelationships = deduplicateRelationships(componentRelationships);

  return {
    version: IR_VERSION,
    system,
    actors: Array.from(actorsMap.values()),
    containers,
    components,
    code: codeItems,
    deployments: [],
    containerRelationships: [],
    componentRelationships: uniqueComponentRelationships,
    codeRelationships: relationships,
  };
}

/**
 * Deduplicate relationships by source+destination+stereotype combination
 * First occurrence wins - preserves description from first relationship
 * This allows multiple relationships between the same elements with different stereotypes
 */
function deduplicateRelationships(relationships: Relationship[]): Relationship[] {
  const seen = new Map<string, Relationship>();
  for (const rel of relationships) {
    const key = `${rel.source}:${rel.destination}:${rel.stereotype ?? ''}`;
    if (!seen.has(key)) {
      seen.set(key, rel);
    }
  }
  return Array.from(seen.values());
}

/**
 * Map a function to a CodeItem
 */
function mapFunction(
  func: ExtractedFunction,
  filePath: string,
  componentId?: string,
): CodeItem {
  const id = generateId(filePath, func.name);

  return {
    id,
    componentId,
    name: func.name,
    type: 'function',
    description: func.documentation?.summary,
    documentation: func.documentation,
    deprecated: func.deprecated,
    returnType: func.returnType,
    returnDescription: func.returnDescription,
    parameters: func.parameters,
    visibility: func.isExported ? 'public' : 'private',
    isAsync: func.isAsync,
    filePath,
    lineNumber: func.location.line,
  };
}

/**
 * Map a class to a CodeItem
 */
function mapClass(
  cls: ExtractedClass,
  filePath: string,
  componentId?: string,
): CodeItem {
  const id = generateId(filePath, cls.name);

  return {
    id,
    componentId,
    name: cls.name,
    type: 'class',
    description: cls.documentation?.summary,
    documentation: cls.documentation,
    deprecated: cls.deprecated,
    visibility: cls.isExported ? 'public' : 'private',
    isAbstract: cls.isAbstract,
    filePath,
    lineNumber: cls.location.line,
    metadata: {
      extends: cls.extends,
      implements: cls.implements,
    },
  };
}

/**
 * Map a class method to a CodeItem
 */
function mapMethod(
  method: ExtractedMethod,
  className: string,
  filePath: string,
  componentId?: string,
): CodeItem {
  const id = generateId(filePath, `${className}.${method.name}`);

  return {
    id,
    componentId,
    name: `${className}.${method.name}`,
    type: 'method',
    description: method.documentation?.summary,
    documentation: method.documentation,
    deprecated: method.deprecated,
    returnType: method.returnType,
    returnDescription: method.returnDescription,
    parameters: method.parameters,
    visibility: method.visibility,
    isAsync: method.isAsync,
    isStatic: method.isStatic,
    isAbstract: method.isAbstract,
    filePath,
    lineNumber: method.location.line,
    metadata: {
      className,
    },
  };
}

/**
 * Map imports to relationships
 */
function mapImportRelationships(
  imp: ExtractedImport,
  filePath: string,
): Relationship[] {
  const relationships: Relationship[] = [];

  // Create a relationship for each imported name
  for (const importedName of imp.importedNames) {
    relationships.push({
      source: filePath,
      destination: `${imp.source}:${importedName}`,
      description: `imports ${importedName}`,
      stereotype: imp.isTypeOnly ? 'type-import' : 'import',
    });
  }

  return relationships;
}

/**
 * Generate a unique ID for a code element
 * Format: filePath:symbolName
 */
function generateId(filePath: string, symbolName: string): string {
  // Normalize path separators
  const normalized = filePath.replace(/\\/g, '/');
  return `${normalized}:${symbolName}`;
}

/**
 * Get default system info from package.json if available
 */
function getDefaultSystem(): System {
  try {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    return {
      name: packageJson.name || 'Unknown System',
      description: packageJson.description,
      repository:
        typeof packageJson.repository === 'string'
          ? packageJson.repository
          : packageJson.repository?.url,
    };
  } catch {
    return {
      name: 'Unknown System',
      description: 'No package.json found',
    };
  }
}
