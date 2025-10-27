/**
 * @module basic-astro
 * Map extracted Astro data to ArchletteIR format
 * Follows basic-node pattern for consistency
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
import type {
  FileExtraction,
  PackageInfo,
  ExtractedClass,
  ExtractedFunction,
} from './types.js';
import {
  TAGS,
  DEFAULT_CONTAINER_ID,
  IR_VERSION,
  nameToId,
  sanitizeId,
} from '../../../core/constants.js';

/**
 * Map file extractions to ArchletteIR
 * Transforms Astro component analysis into standardized architecture representation
 */
export function mapToIR(
  extractions: FileExtraction[],
  packages?: PackageInfo[],
  systemInfo?: System,
): ArchletteIR {
  const codeItems: CodeItem[] = [];
  const componentsMap = new Map<string, Component>();
  const actorsMap = new Map<string, Actor>();
  const actorDescriptions = new Map<string, Set<string>>();
  const componentDescriptions = new Map<string, Set<string>>();
  const componentRelationships: Relationship[] = [];

  // Step 1: Extract code items, components, actors, and relationships from all files
  for (const file of extractions) {
    const componentId = file.component?.id;

    // Register component if found
    if (file.component) {
      // Filter out generic inferred descriptions when merging
      const isInferredDescription = file.component.description?.startsWith(
        'Component inferred from',
      );

      if (!componentsMap.has(file.component.id)) {
        componentsMap.set(file.component.id, {
          id: file.component.id,
          containerId: '', // Will be filled later
          name: file.component.name,
          type: 'module',
          description: file.component.description,
        });
        // Only add explicit JSDoc descriptions, not inferred ones
        componentDescriptions.set(
          file.component.id,
          new Set(
            file.component.description && !isInferredDescription
              ? [file.component.description]
              : [],
          ),
        );
      } else {
        // Merge descriptions for duplicate components (skip inferred descriptions)
        if (file.component.description && !isInferredDescription) {
          componentDescriptions.get(file.component.id)!.add(file.component.description);
        }
      }
    }

    // Register actors and create actor relationships
    for (const actor of file.actors) {
      if (!actorsMap.has(actor.id)) {
        actorsMap.set(actor.id, {
          id: actor.id,
          name: actor.name,
          type: actor.type,
          description: actor.description,
          tags: [],
          targets: [],
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

      // Create actor relationships based on direction
      if (componentId && actor.direction) {
        const actorData = actorsMap.get(actor.id);
        const direction = actor.direction || 'both';

        // Create actor → component relationship if direction is 'in' or 'both'
        if ((direction === 'in' || direction === 'both') && actorData) {
          // Populate targets array on the actor
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
            componentRelationships.push({
              source: componentId,
              destination: actor.id,
              description: actor.description,
              tags: [],
            });
          }
        }
      }
    }

    // Register component → component relationships from @uses tags
    for (const rel of file.relationships) {
      if (componentId) {
        componentRelationships.push({
          source: componentId,
          destination: sanitizeId(rel.target),
          description: rel.description,
          tags: [],
        });
      }
    }

    // Auto-detect component relationships from actual component usage in template
    // This captures the truth of the code rather than relying on @uses documentation
    if (componentId && file.components) {
      for (const usedComponent of file.components) {
        // We'll resolve the actual component ID later after all components are registered
        // For now, store the component name - we'll map it in Step 2
        componentRelationships.push({
          source: componentId,
          destination: sanitizeId(usedComponent.name), // Temporary, will be resolved later
          description: `Uses ${usedComponent.name} component`,
          tags: ['AUTO_DETECTED'],
        });
      }
    }

    // Extract code items from classes
    for (const cls of file.classes) {
      codeItems.push(...mapClassToCodeItems(cls, componentId, file.filePath));
    }

    // Extract code items from functions
    for (const func of file.functions) {
      codeItems.push(mapFunctionToCodeItem(func, componentId, file.filePath));
    }

    // Extract code items from types
    for (const type of file.types) {
      codeItems.push({
        id: sanitizeId(type.name),
        componentId: componentId || '',
        name: type.name,
        type: 'type',
        description: type.documentation?.summary,
        documentation: type.documentation,
        visibility: type.isExported ? 'public' : 'internal',
        filePath: file.filePath,
        lineNumber: type.location.line,
        tags: [],
      });
    }

    // Extract code items from interfaces
    for (const iface of file.interfaces) {
      codeItems.push({
        id: sanitizeId(iface.name),
        componentId: componentId || '',
        name: iface.name,
        type: 'interface',
        description: iface.documentation?.summary,
        documentation: iface.documentation,
        visibility: iface.isExported ? 'public' : 'internal',
        filePath: file.filePath,
        lineNumber: iface.location.line,
        tags: [],
      });
    }
  }

  // Convert maps to arrays
  const components = Array.from(componentsMap.values());
  const actors = Array.from(actorsMap.values());

  // Merge component descriptions
  for (const component of components) {
    const descriptions = componentDescriptions.get(component.id);
    if (descriptions && descriptions.size > 0) {
      component.description = Array.from(descriptions).join('; ');
    }
  }

  // Merge actor descriptions
  for (const actor of actors) {
    const descriptions = actorDescriptions.get(actor.id);
    if (descriptions && descriptions.size > 0) {
      actor.description = Array.from(descriptions).join('; ');
    }
  }

  // Step 2: Container detection and hierarchical ID generation
  const containers: Container[] = [];
  const componentIdMap = new Map<string, string>(); // oldId → newId

  if (packages && packages.length > 0) {
    // Create one container per package
    for (const pkg of packages) {
      const containerId = sanitizeId(nameToId(pkg.name));
      containers.push({
        id: containerId,
        name: pkg.name,
        type: 'Service',
        layer: 'Application',
        description: pkg.description || `Service: ${pkg.name}`,
        tags: [TAGS.AUTO_GENERATED],
      });
    }

    // Apply hierarchical IDs to components
    for (const component of components) {
      const fileWithComponent = extractions.find(
        (e) => e.component?.id === component.id,
      );
      if (fileWithComponent?.packageInfo) {
        const pkg = fileWithComponent.packageInfo;
        const containerId = sanitizeId(nameToId(pkg.name));

        const oldId = component.id;
        component.containerId = containerId;

        // Handle ROOT_COMPONENT_MARKER replacement
        if (component.name === ROOT_COMPONENT_MARKER) {
          component.name = pkg.name;
          component.description = `Component inferred from container: ${pkg.name}`;
          component.id = sanitizeId(containerId);
        } else {
          component.id = sanitizeId(`${containerId}__${oldId}`);
        }
        componentIdMap.set(oldId, component.id);
      }
    }

    // Handle components without package (orphans)
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

        if (component.name === ROOT_COMPONENT_MARKER) {
          const containerName = systemInfo?.name || 'Application';
          component.name = containerName;
          component.description = `Component inferred from container: ${containerName}`;
          component.id = sanitizeId(DEFAULT_CONTAINER_ID);
        } else {
          component.id = sanitizeId(`${DEFAULT_CONTAINER_ID}__${oldId}`);
        }
        componentIdMap.set(oldId, component.id);
      }
    }
  } else {
    // No packages - create default container for all components
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

      for (const component of components) {
        const oldId = component.id;
        component.containerId = DEFAULT_CONTAINER_ID;

        if (component.name === ROOT_COMPONENT_MARKER) {
          const containerName = systemInfo?.name || 'Application';
          component.name = containerName;
          component.description = `Component inferred from container: ${containerName}`;
          component.id = sanitizeId(DEFAULT_CONTAINER_ID);
        } else {
          component.id = sanitizeId(`${DEFAULT_CONTAINER_ID}__${oldId}`);
        }
        componentIdMap.set(oldId, component.id);
      }
    }
  }

  // Step 3: Update code item componentId references using the componentIdMap
  for (const codeItem of codeItems) {
    if (codeItem.componentId) {
      const newComponentId = componentIdMap.get(codeItem.componentId);
      if (newComponentId) {
        const oldCodeId = codeItem.id;
        codeItem.componentId = newComponentId;
        // Apply hierarchical ID to code items: component__codeName
        codeItem.id = sanitizeId(`${newComponentId}__${oldCodeId}`);
      }
    }
  }

  // Step 3.5: Update actor targets with hierarchical component IDs
  for (const actor of actors) {
    if (actor.targets) {
      for (let i = 0; i < actor.targets.length; i++) {
        const targetId = actor.targets[i];
        const newTargetId = componentIdMap.get(targetId);
        if (newTargetId) {
          actor.targets[i] = newTargetId;
        }
      }
    }
  }

  // Step 4: Update relationship sources/destinations using the componentIdMap
  for (const rel of componentRelationships) {
    const newSource = componentIdMap.get(rel.source) || rel.source;
    const newDestination = componentIdMap.get(rel.destination) || rel.destination;
    rel.source = newSource;
    rel.destination = newDestination;
  }

  // Step 4.5: Resolve auto-detected component relationships
  // Build maps for resolution:
  // 1. Component names to IDs (for component-level relationships)
  // 2. File base names to component IDs (for file-level imports like "BaseLayout" -> "layouts")
  const componentNameToId = new Map<string, string>();
  const fileNameToComponentId = new Map<string, string>();

  for (const component of components) {
    // Map component names to IDs
    const sanitizedName = sanitizeId(component.name);
    componentNameToId.set(sanitizedName, component.id);
    componentNameToId.set(component.name.toLowerCase(), component.id);
  }

  // Build file name to component ID map from extractions
  // This allows us to resolve file imports like "BaseLayout" to their component "layouts"
  for (const file of extractions) {
    if (file.component?.id) {
      // Extract file base name (without extension)
      const filePathParts = file.filePath.split(/[/\\]/);
      const fileName = filePathParts[filePathParts.length - 1];
      const fileBaseName = fileName.replace(/\.astro$/, '');

      // Map file base name (sanitized) to the final component ID
      const finalComponentId = componentIdMap.get(file.component.id);
      if (finalComponentId) {
        const sanitizedFileBaseName = sanitizeId(fileBaseName);
        fileNameToComponentId.set(sanitizedFileBaseName, finalComponentId);
        fileNameToComponentId.set(fileBaseName.toLowerCase(), finalComponentId);
      }
    }
  }

  // Resolve auto-detected relationships: map file/component names to actual IDs
  const resolvedRelationships: Relationship[] = [];
  for (const rel of componentRelationships) {
    if (rel.tags?.includes('AUTO_DETECTED')) {
      // Try to resolve using file name map first (for imports like "BaseLayout")
      let resolvedId = fileNameToComponentId.get(rel.destination);

      // Fall back to component name map (for @uses tags)
      if (!resolvedId) {
        resolvedId = componentNameToId.get(rel.destination);
      }

      if (resolvedId) {
        // Successfully resolved to a component we know about
        resolvedRelationships.push({
          ...rel,
          destination: resolvedId,
        });
      }
      // If not resolved, it's an external component - skip it
    } else {
      // Keep non-auto-detected relationships as-is (from @uses tags)
      resolvedRelationships.push(rel);
    }
  }

  // Step 5: Deduplicate relationships
  const relationshipsSet = new Set<string>();
  const uniqueRelationships: Relationship[] = [];
  for (const rel of resolvedRelationships) {
    const key = `${rel.source}::${rel.destination}`;
    if (!relationshipsSet.has(key)) {
      relationshipsSet.add(key);
      uniqueRelationships.push(rel);
    }
  }

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
    componentRelationships: uniqueRelationships,
    codeRelationships: [],
    deploymentRelationships: [],
  };
}

/**
 * Map a class to code items (class + methods)
 */
function mapClassToCodeItems(
  cls: ExtractedClass,
  componentId: string | undefined,
  filePath: string,
): CodeItem[] {
  const items: CodeItem[] = [];

  // Add the class itself
  items.push({
    id: sanitizeId(cls.name),
    componentId: componentId || '',
    name: cls.name,
    type: 'class',
    description: cls.documentation?.summary,
    documentation: cls.documentation,
    visibility: cls.isExported ? 'public' : 'internal',
    filePath,
    lineNumber: cls.location.line,
    tags: [],
  });

  // Add methods as code items
  for (const method of cls.methods) {
    items.push({
      id: sanitizeId(`${cls.name}.${method.name}`),
      componentId: componentId || '',
      name: `${cls.name}.${method.name}`,
      type: 'method',
      description: method.documentation?.summary,
      documentation: method.documentation,
      parameters: method.parameters,
      returnType: method.returnType,
      visibility: method.visibility,
      isAsync: method.isAsync,
      isStatic: method.isStatic,
      filePath,
      lineNumber: method.location.line,
      tags: [],
    });
  }

  return items;
}

/**
 * Map a function to a code item
 */
function mapFunctionToCodeItem(
  func: ExtractedFunction,
  componentId: string | undefined,
  filePath: string,
): CodeItem {
  return {
    id: sanitizeId(func.name),
    componentId: componentId || '',
    name: func.name,
    type: 'function',
    description: func.documentation?.summary,
    documentation: func.documentation,
    parameters: func.parameters,
    returnType: func.returnType,
    visibility: func.isExported ? 'public' : 'internal',
    isAsync: func.isAsync,
    filePath,
    lineNumber: func.location.line,
    tags: [],
  };
}
