/**
 * @module basic_node
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
import { resolve, dirname, join, extname } from 'node:path';
import { existsSync } from 'node:fs';
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
  const codeItems: CodeItem[] = [];
  const relationships: Relationship[] = [];
  const componentsMap = new Map<string, Component>();
  const actorsMap = new Map<string, Actor>();
  const actorDescriptions = new Map<string, Set<string>>();
  const componentDescriptions = new Map<string, Set<string>>();
  const componentRelationships: Relationship[] = [];
  const inferredComponents = new Set<string>(); // Track which components were inferred from paths

  // Build a map of file paths to component IDs for resolving import destinations
  const fileToComponentMap = new Map<string, string>();

  // Extract code items, actors, and relationships from all files
  for (const file of extractions) {
    const componentId = file.component?.id;

    // Map file path to component ID for import resolution
    if (componentId) {
      fileToComponentMap.set(file.filePath, componentId);
    }

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
        // Track if this component was inferred from path
        if (file.component._inferred) {
          inferredComponents.add(file.component.id);
        }
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
        const targetId = sanitizeId(rel.target);

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

    // Add import relationships to component relationships (component-level dependencies)
    for (const imp of file.imports) {
      componentRelationships.push(
        ...mapImportToComponentRelationships(
          imp,
          file.filePath,
          componentId,
          fileToComponentMap,
        ),
      );
    }

    // Add import relationships to code relationships (for backward compatibility and future use)
    for (const imp of file.imports) {
      relationships.push(...mapImportRelationships(imp, file.filePath));
    }
  }

  let components = Array.from(componentsMap.values());

  // Merge component descriptions
  for (const component of components) {
    const uniqueDescriptions = Array.from(
      componentDescriptions.get(component.id) || [],
    );
    if (uniqueDescriptions.length > 1) {
      component.description = uniqueDescriptions.join(' | ');
    }
  }

  // Filter out inferred components (from directory structure) that have no code items
  // Keep explicitly tagged components even if they're empty
  const componentsWithCode = new Set(codeItems.map((item) => item.componentId));
  components = components.filter(
    (component) =>
      // Keep if it has code items
      componentsWithCode.has(component.id) ||
      // Or if it was explicitly tagged (not inferred from path)
      !inferredComponents.has(component.id),
  );

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

    // Step 2: Apply hierarchical IDs to components: container__component
    for (const component of components) {
      const fileWithComponent = extractions.find(
        (e) => e.component?.id === component.id,
      );
      if (fileWithComponent?.packageInfo) {
        const pkg = fileWithComponent.packageInfo;
        const containerId = sanitizeId(nameToId(pkg.name));

        const oldId = component.id;
        component.containerId = containerId;

        // If component uses ROOT_COMPONENT_MARKER, replace with container name
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

        // If component uses ROOT_COMPONENT_MARKER, replace with container name
        if (component.name === ROOT_COMPONENT_MARKER) {
          const containerName = systemInfo?.name || 'Application';
          component.name = containerName;
          component.description = `Component inferred from container: ${containerName}`;
          component.id = sanitizeId(DEFAULT_CONTAINER_ID);
        } else {
          // Apply same hierarchical ID pattern
          component.id = sanitizeId(`${DEFAULT_CONTAINER_ID}__${oldId}`);
        }
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

        // If component uses ROOT_COMPONENT_MARKER, replace with container name
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

  // Step 3: Update code item componentId references
  for (const codeItem of codeItems) {
    if (codeItem.componentId && componentIdMap.has(codeItem.componentId)) {
      const newComponentId = componentIdMap.get(codeItem.componentId);
      if (newComponentId) {
        codeItem.componentId = newComponentId;
      }
    }
  }

  // Step 4: Apply hierarchical IDs to code items: container__component__code
  for (const codeItem of codeItems) {
    if (codeItem.componentId) {
      // Extract code name from current ID (usually filename:functionname)
      const parts = codeItem.id.split(':');
      const codeName = parts[parts.length - 1] || codeItem.name;

      // Build hierarchical ID: container__component__code
      codeItem.id = sanitizeId(`${codeItem.componentId}__${codeName}`);
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

  // Note: Code relationships are kept in their original format (filePath:symbolName)
  // for backward compatibility and potential future use

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

  // Code relationships are kept as-is (no deduplication for backward compatibility)

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
 * Deduplicate relationships by source+destination combination
 * - Excludes self-referential relationships (source === destination)
 * - Merges descriptions and stereotypes with " | " separator when duplicates are found
 * - Extracts imported names from descriptions (removes "imports " prefix) and keeps only unique names
 * - Returns one relationship per unique source+destination pair
 */
function deduplicateRelationships(relationships: Relationship[]): Relationship[] {
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
      const existing = seen.get(key)!;

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
 * Resolve an import path to an absolute file path
 * Handles relative imports (./file, ../file) and resolves to actual file paths
 * Returns undefined for node_modules imports or unresolvable paths
 */
function resolveImportPath(
  importSource: string,
  fromFilePath: string,
): string | undefined {
  // Skip node_modules and external packages (don't start with . or /)
  if (!importSource.startsWith('.') && !importSource.startsWith('/')) {
    return undefined;
  }

  const fromDir = dirname(fromFilePath);

  // Remove .js extension if present and try with .ts extensions
  let importWithoutExt = importSource;
  if (importSource.endsWith('.js') || importSource.endsWith('.jsx')) {
    importWithoutExt = importSource.replace(/\.jsx?$/, '');
  } else if (importSource.endsWith('.mjs')) {
    importWithoutExt = importSource.replace(/\.mjs$/, '');
  }

  const targetPath = join(fromDir, importWithoutExt);

  // Try common extensions if the path doesn't have one
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs', '.cts', '.cjs'];

  if (!extname(targetPath)) {
    // Try with each extension
    for (const ext of extensions) {
      const pathWithExt = targetPath + ext;
      if (existsSync(pathWithExt)) {
        return pathWithExt;
      }
    }

    // Try as index file in directory
    for (const ext of extensions) {
      const indexPath = join(targetPath, `index${ext}`);
      if (existsSync(indexPath)) {
        return indexPath;
      }
    }
  } else if (existsSync(targetPath)) {
    return targetPath;
  }

  // Could not resolve
  return undefined;
}

/**
 * Map imports to component relationships (component-level dependencies)
 */
function mapImportToComponentRelationships(
  imp: ExtractedImport,
  filePath: string,
  componentId: string | undefined,
  fileToComponentMap: Map<string, string>,
): Relationship[] {
  const relationships: Relationship[] = [];

  // Resolve the import source to an absolute file path
  let targetFilePath = resolveImportPath(imp.source, filePath);

  // Normalize path separators to forward slashes for consistent lookup
  if (targetFilePath) {
    targetFilePath = targetFilePath.replace(/\\/g, '/');
  }

  // Look up the target component ID
  const destinationComponentId = targetFilePath
    ? fileToComponentMap.get(targetFilePath)
    : undefined;

  // Create a relationship for each imported name
  for (const importedName of imp.importedNames) {
    relationships.push({
      source: componentId || filePath, // Use componentId if available, fallback to filePath
      destination: destinationComponentId || imp.source, // Use target componentId if found, fallback to module path
      description: `imports ${importedName}`,
      stereotype: imp.isTypeOnly ? 'type-import' : 'import',
    });
  }

  return relationships;
}

/**
 * Map imports to relationships (original code-level format for backward compatibility)
 */
function mapImportRelationships(
  imp: ExtractedImport,
  filePath: string,
): Relationship[] {
  const relationships: Relationship[] = [];

  // Create a relationship for each imported name (original format)
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
  // Don't sanitize here - keep the colon separator so we can split later
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
