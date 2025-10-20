/**
 * Map extracted data to ArchletteIR format
 */

import type {
  ArchletteIR,
  CodeItem,
  System,
  Relationship,
  Component,
  Actor,
} from '../../../core/types-ir.js';
import type {
  FileExtraction,
  PackageInfo,
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
  packages?: PackageInfo[],
  systemInfo?: System,
): ArchletteIR {
  const codeItems: CodeItem[] = [];
  const relationships: Relationship[] = [];
  const componentsMap = new Map<string, Component>();
  const actorsMap = new Map<string, Actor>();
  const actorDescriptions = new Map<string, Set<string>>();
  const componentDescriptions = new Map<string, Set<string>>();
  const componentRelationships: Relationship[] = [];

  // Extract code items, actors, and relationships from all files
  for (const file of extractions) {
    const componentId = file.component?.id;

    // Register component if found
    if (file.component) {
      if (!componentsMap.has(file.component.id)) {
        componentsMap.set(file.component.id, {
          id: file.component.id,
          containerId: '', // Will be filled by IaC extractors or validators
          name: file.component.name,
          type: 'module',
          description: file.component.description,
        });
        componentDescriptions.set(
          file.component.id,
          new Set(file.component.description ? [file.component.description] : []),
        );
      } else {
        // Merge descriptions for duplicate components
        if (file.component.description) {
          componentDescriptions.get(file.component.id)!.add(file.component.description);
        }
      }
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
        actorDescriptions.set(
          actor.id,
          new Set(actor.description ? [actor.description] : []),
        );
      } else {
        // Merge descriptions for duplicate actors
        if (actor.description) {
          actorDescriptions.get(actor.id)!.add(actor.description);
        }
      }

      // If an actor is declared in a component file, create relationships based on direction
      // Direction controls relationship creation:
      // - 'in': Actor → Component (actor uses/calls the component)
      // - 'out': Component → Actor (component uses/calls the actor)
      // - 'both': Bidirectional (both relationships created) - default
      if (componentId) {
        const actorData = actorsMap.get(actor.id);
        const direction = actor.direction || 'both';

        // Create actor → component relationship if direction is 'in' or 'both'
        if ((direction === 'in' || direction === 'both') && actorData) {
          if (!actorData.targets) {
            actorData.targets = [];
          }
          if (!actorData.targets.includes(componentId)) {
            actorData.targets.push(componentId);
          }
        }

        // Create component → actor relationship if direction is 'out' or 'both'
        if (direction === 'out' || direction === 'both') {
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

  const components = Array.from(componentsMap.values());

  // Merge component descriptions
  for (const component of components) {
    const uniqueDescriptions = Array.from(
      componentDescriptions.get(component.id) || [],
    );
    if (uniqueDescriptions.length > 1) {
      component.description = uniqueDescriptions.join(' | ');
    }
  }

  // Merge actor descriptions
  const actors = Array.from(actorsMap.values());
  for (const actor of actors) {
    const uniqueDescriptions = Array.from(actorDescriptions.get(actor.id) || []);
    if (uniqueDescriptions.length > 1) {
      actor.description = uniqueDescriptions.join(' | ');
    }
  }

  // Step 1: Create containers from packages
  const containers = [];
  const componentIdMap = new Map<string, string>(); // old ID -> new ID

  if (packages && packages.length > 0) {
    // Create one container per package
    for (const pkg of packages) {
      const containerId = nameToId(pkg.name);
      containers.push({
        id: containerId,
        name: pkg.name,
        type: 'Service',
        layer: 'Application',
        description: pkg.description || `Service: ${pkg.name}`,
        tags: [TAGS.AUTO_GENERATED],
      });
    }

    // Step 2: Apply hierarchical IDs to components: container__component
    for (const component of components) {
      const fileWithComponent = extractions.find(
        (e) => e.component?.id === component.id,
      );
      if (fileWithComponent?.packageInfo) {
        const pkg = fileWithComponent.packageInfo;
        const containerId = nameToId(pkg.name);

        const oldId = component.id;
        component.containerId = containerId;
        component.id = `${containerId}__${oldId}`;
        componentIdMap.set(oldId, component.id);
      }
    }

    // Step 5: Handle components without package (orphans)
    const orphanComponents = components.filter((c) => !c.containerId);
    if (orphanComponents.length > 0) {
      const defaultContainer = {
        id: DEFAULT_CONTAINER_ID,
        name: systemInfo?.name || 'Application',
        type: 'Application',
        layer: 'Application',
        description: systemInfo?.description || 'Main application container',
        tags: [TAGS.AUTO_GENERATED],
      };
      containers.push(defaultContainer);

      for (const component of orphanComponents) {
        const oldId = component.id;
        component.containerId = DEFAULT_CONTAINER_ID;
        // Apply same hierarchical ID pattern
        component.id = `${DEFAULT_CONTAINER_ID}__${oldId}`;
        componentIdMap.set(oldId, component.id);
      }
    }
  } else {
    // No packages found - create default container for all components
    if (components.length > 0) {
      const defaultContainer = {
        id: DEFAULT_CONTAINER_ID,
        name: systemInfo?.name || 'Application',
        type: 'Application',
        layer: 'Application',
        description: systemInfo?.description || 'Main application container',
        tags: [TAGS.AUTO_GENERATED],
      };
      containers.push(defaultContainer);

      // Assign all components to this container with hierarchical IDs
      for (const component of components) {
        const oldId = component.id;
        component.containerId = DEFAULT_CONTAINER_ID;
        component.id = `${DEFAULT_CONTAINER_ID}__${oldId}`;
        componentIdMap.set(oldId, component.id);
      }
    }
  }

  // Step 3: Update code item componentId references
  for (const codeItem of codeItems) {
    if (codeItem.componentId && componentIdMap.has(codeItem.componentId)) {
      codeItem.componentId = componentIdMap.get(codeItem.componentId);
    }
  }

  // Step 4: Apply hierarchical IDs to code items: container__component__code
  for (const codeItem of codeItems) {
    if (codeItem.componentId) {
      // Extract code name from current ID (usually filename:functionname)
      const parts = codeItem.id.split(':');
      const codeName = parts[parts.length - 1] || codeItem.name;

      // Build hierarchical ID: container__component__code
      codeItem.id = `${codeItem.componentId}__${codeName}`;

      // Update name for display: component__code
      const component = components.find((c) => c.id === codeItem.componentId);
      if (component) {
        // Extract component name without container prefix
        const componentName = component.name;
        codeItem.name = `${componentName}__${codeName}`;
      }
    }
  }

  // apply hierarchical IDs to actor relationships
  for (const actor of actors) {
    if (actor.targets) {
      for (let i = 0; i < actor.targets.length; i++) {
        const targetId = actor.targets[i];
        if (componentIdMap.has(targetId)) {
          actor.targets[i] = componentIdMap.get(targetId)!;
        }
      }
    }
  }
  // apply hierarchical IDs to component relationships
  for (const rel of componentRelationships) {
    if (componentIdMap.has(rel.source)) {
      rel.source = componentIdMap.get(rel.source)!;
    }
    if (componentIdMap.has(rel.destination)) {
      rel.destination = componentIdMap.get(rel.destination)!;
    }
  }

  // Step 6: Determine system info
  // Priority: 1) provided systemInfo, 2) first container, 3) default
  let system: System;
  if (systemInfo) {
    system = systemInfo;
  } else if (containers.length > 0) {
    const firstContainer = containers[0];
    system = {
      name: firstContainer.name,
      description: firstContainer.description,
    };
  } else {
    system = getDefaultSystem();
  }

  // Deduplicate component relationships (same source+destination)
  const uniqueComponentRelationships = deduplicateRelationships(componentRelationships);

  return {
    version: IR_VERSION,
    system,
    actors,
    containers,
    components,
    code: codeItems,
    deployments: [],
    containerRelationships: [],
    componentRelationships: uniqueComponentRelationships,
    codeRelationships: relationships,
    deploymentRelationships: [],
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
