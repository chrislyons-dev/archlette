/**
 * @module basic-python
 * Map Python file extractions to ArchletteIR
 */

import { createLogger } from '../../../core/logger.js';
import {
  nameToId,
  sanitizeId,
  TAGS,
  DEFAULT_CONTAINER_ID,
} from '../../../core/constants.js';
import type {
  ArchletteIR,
  Actor,
  Component,
  Container,
  CodeItem,
  Relationship,
} from '../../../core/types-ir.js';
import type {
  FileExtraction,
  ActorInfo,
  RelationshipInfo,
  ExtractedClass,
  ExtractedMethod,
  ExtractedFunction,
  ExtractedType,
  ExtractedImport,
} from './types.js';
import type { PyProjectInfo } from './file-finder.js';
import { deduplicateRelationships } from '../shared/relationship-utils.js';

const log = createLogger({ context: 'PythonIRMapper' });

interface SystemInfo {
  name?: string;
  description?: string;
  repository?: string;
}

/**
 * Map file extractions to ArchletteIR
 */
export function mapToIR(
  extractions: FileExtraction[],
  pyprojects: PyProjectInfo[],
  systemInfo?: SystemInfo,
): ArchletteIR {
  log.info(`Mapping ${extractions.length} Python files to IR`);

  // Aggregate all components, actors, relationships
  const componentsMap = new Map<string, Component>();
  const actorMap = new Map<string, ActorInfo>();
  const relationships: RelationshipInfo[] = [];
  const componentRelationships: Relationship[] = [];
  const codeItems: CodeItem[] = [];

  // Build a map of file paths to component IDs for import resolution
  const fileToComponentMap = new Map<string, string>();

  // Build an index of module paths for O(1) import resolution
  const modulePathIndex = new Map<string, string>(); // module path -> file path

  for (const extraction of extractions) {
    // Map file path to component ID
    if (extraction.component) {
      fileToComponentMap.set(extraction.filePath, extraction.component.id);
    }

    // Index module paths for fast lookup (Issue #3)
    // Extract module path from file path for absolute import matching
    // e.g., "src/services/auth.py" -> "services.auth", "services/auth"
    const modulePath = extraction.filePath
      .replace(/\\/g, '/')
      .replace(/\.py$/, '')
      .replace(/\/__init__$/, '');

    // Store both dotted and slashed versions
    const dottedPath = modulePath.split('/').join('.');
    modulePathIndex.set(modulePath, extraction.filePath);
    modulePathIndex.set(dottedPath, extraction.filePath);

    // Collect components
    if (extraction.component) {
      const existing = componentsMap.get(extraction.component.id);
      if (!existing) {
        componentsMap.set(extraction.component.id, {
          id: extraction.component.id,
          containerId: '', // Will be filled below based on packageInfo
          name: extraction.component.name,
          type: 'module',
          description: extraction.component.description,
        });
      }
    }

    // Collect actors
    for (const actor of extraction.actors) {
      const existing = actorMap.get(actor.id);
      if (!existing) {
        actorMap.set(actor.id, actor);
      }
    }

    // Collect relationships (fill in source component ID)
    for (const rel of extraction.relationships) {
      if (extraction.component) {
        relationships.push({
          source: extraction.component.id,
          target: rel.target,
          description: rel.description,
        });
      }
    }

    // Process imports to create component relationships
    for (const imp of extraction.imports) {
      if (extraction.component) {
        componentRelationships.push(
          ...mapImportToComponentRelationships(
            imp,
            extraction.filePath,
            extraction.component.id,
            fileToComponentMap,
            modulePathIndex,
          ),
        );
      }
    }

    // Extract code items from classes and functions
    const componentId = extraction.component?.id;

    // Classes
    for (const cls of extraction.classes) {
      // Add class as code item
      codeItems.push(mapClassToCodeItem(cls, componentId));

      // Add methods as code items
      for (const method of cls.methods) {
        codeItems.push(mapMethodToCodeItem(method, cls.name, componentId));
      }
    }

    // Functions
    for (const func of extraction.functions) {
      codeItems.push(mapFunctionToCodeItem(func, componentId));
    }

    // Types (TypedDict, Protocol, Enum, etc.)
    for (const type of extraction.types) {
      codeItems.push(mapTypeToCodeItem(type, componentId));
    }
  }

  // Map actors and collect targets
  const actors = Array.from(actorMap.values());
  const actorTargets = new Map<string, string[]>();

  // Build components array
  const components = Array.from(componentsMap.values());
  const containers: Container[] = [];
  const componentIdMap = new Map<string, string>(); // old ID -> new hierarchical ID

  // Create containers from pyprojects and assign components
  if (pyprojects.length > 0) {
    // Step 1: Create containers from pyprojects
    for (const proj of pyprojects) {
      const containerId = sanitizeId(nameToId(proj.name));
      containers.push({
        id: containerId,
        name: proj.name,
        type: 'Service',
        layer: 'Application',
        description: proj.description || `Service: ${proj.name}`,
        tags: [TAGS.AUTO_GENERATED],
      });
    }

    // Step 2: Apply hierarchical IDs to components: container__component
    for (const component of components) {
      const fileWithComponent = extractions.find(
        (e) => e.component?.id === component.id,
      );
      if (fileWithComponent?.packageInfo) {
        const proj = fileWithComponent.packageInfo;
        const containerId = sanitizeId(nameToId(proj.name));

        const oldId = component.id;
        component.containerId = containerId;
        component.id = sanitizeId(`${containerId}__${oldId}`);
        componentIdMap.set(oldId, component.id);
      }
    }

    // Step 3: Handle components without package (orphans)
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
        component.id = sanitizeId(`${DEFAULT_CONTAINER_ID}__${oldId}`);
        componentIdMap.set(oldId, component.id);
      }
    }
  } else {
    // No pyprojects found - create default container for all components
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
        component.id = sanitizeId(`${DEFAULT_CONTAINER_ID}__${oldId}`);
        componentIdMap.set(oldId, component.id);
      }
    }
  }

  // Step 3.5: Replace __CONTAINER__ component names with actual container names
  for (const component of components) {
    if (component.name === '__CONTAINER__' && component.containerId) {
      const container = containers.find((c) => c.id === component.containerId);
      if (container) {
        component.name = container.name;
        component.description = `Component derived from root file in ${container.name}`;
      }
    }
  }

  // Step 4: Update code items with new hierarchical component IDs
  for (const codeItem of codeItems) {
    if (codeItem.componentId) {
      const newComponentId = componentIdMap.get(codeItem.componentId);
      if (newComponentId) {
        codeItem.componentId = newComponentId;
      }
    }
  }

  // Step 4.5: Make code IDs hierarchical (componentId__codeId)
  for (const codeItem of codeItems) {
    if (codeItem.componentId) {
      codeItem.id = sanitizeId(`${codeItem.componentId}__${codeItem.id}`);
    }
  }

  // Step 5: Update relationships with new hierarchical component IDs
  for (const rel of relationships) {
    const newSource = componentIdMap.get(rel.source);
    if (newSource) {
      rel.source = newSource;
    }
    const newTarget = componentIdMap.get(rel.target);
    if (newTarget) {
      rel.target = newTarget;
    }
  }

  // Step 5.5: Update component relationships (from imports) with hierarchical IDs
  for (const rel of componentRelationships) {
    const newSource = componentIdMap.get(rel.source);
    if (newSource) {
      rel.source = newSource;
    }
    const newDest = componentIdMap.get(rel.destination);
    if (newDest) {
      rel.destination = newDest;
    }
  }

  // Step 6: Rebuild componentsMap with new hierarchical IDs
  componentsMap.clear();
  for (const component of components) {
    componentsMap.set(component.id, component);
  }

  // Merge @uses relationships and import-based relationships
  const allComponentRelationships = [
    ...mapRelationshipsToIR(relationships, componentsMap, actorMap, actorTargets),
    ...componentRelationships,
  ];

  // Create IR
  const ir: ArchletteIR = {
    version: '1.0',
    system: {
      name: systemInfo?.name || 'Python System',
      description: systemInfo?.description,
      repository: systemInfo?.repository,
    },
    actors: actors.map((actor) => mapActorToIR(actor, actorTargets)),
    containers,
    components, // Already Component objects, no need to map
    code: codeItems,
    deployments: [],
    containerRelationships: [],
    componentRelationships: deduplicateRelationships(allComponentRelationships),
    codeRelationships: [],
    deploymentRelationships: [],
  };

  log.info(
    `Mapped IR: ${ir.components.length} components, ${ir.actors.length} actors, ${ir.code.length} code items`,
  );

  return ir;
}

/**
 * Map ActorInfo to Actor
 */
function mapActorToIR(actor: ActorInfo, actorTargets: Map<string, string[]>): Actor {
  return {
    id: actor.id,
    name: actor.name,
    type: actor.type,
    description: actor.description,
    targets: actorTargets.get(actor.id) || [],
  };
}

/**
 * Map relationships to Relationship[]
 * Creates bidirectional actor relationships
 */
function mapRelationshipsToIR(
  relationships: RelationshipInfo[],
  componentMap: Map<string, Component>,
  actorMap: Map<string, ActorInfo>,
  actorTargets: Map<string, string[]>,
): Relationship[] {
  const result: Relationship[] = [];

  for (const rel of relationships) {
    // Use target as-is to preserve underscores (Python naming convention)
    const targetId = rel.target;

    // Check if target is a component
    if (componentMap.has(targetId)) {
      result.push({
        source: rel.source,
        destination: targetId,
        description: rel.description,
        tags: [],
      });
    }

    // Check if target is an actor
    if (actorMap.has(targetId)) {
      // Add component -> actor relationship
      result.push({
        source: rel.source,
        destination: targetId,
        description: rel.description,
        tags: [],
      });

      // Add to actor's targets for bidirectional relationship
      const targets = actorTargets.get(targetId) || [];
      if (!targets.includes(rel.source)) {
        targets.push(rel.source);
        actorTargets.set(targetId, targets);
      }
    }
  }

  return result;
}

/**
 * Map Python imports to component relationships (component-level dependencies)
 * Resolves local imports to component IDs when possible
 */
function mapImportToComponentRelationships(
  imp: ExtractedImport,
  filePath: string,
  componentId: string,
  fileToComponentMap: Map<string, string>,
  modulePathIndex: Map<string, string>,
): Relationship[] {
  const relationships: Relationship[] = [];

  // Skip standard library and third-party imports - only handle local imports
  if (imp.category !== 'local') {
    // For stdlib/third_party, create relationship to external module (Issue #4: debug logging)
    log.debug(
      `External import detected: ${imp.source} (${imp.category}) in ${filePath}`,
    );
    for (const importedName of imp.importedNames) {
      relationships.push({
        source: componentId,
        destination: imp.source,
        description: importedName,
        stereotype: 'import',
      });
    }
    return relationships;
  }

  // For local imports, try to resolve to a component
  // Python relative imports: .module (level=1), ..module (level=2), etc.
  let targetFilePath: string | undefined;

  if (imp.isRelative) {
    // Resolve relative import path
    const currentDir = filePath.substring(0, filePath.lastIndexOf('/'));
    const parts = currentDir.split('/');

    // Go up 'level' directories
    const level = imp.level || 1;

    // Validate level doesn't exceed directory depth (path traversal protection)
    if (level > parts.length - 1) {
      log.warn(
        `Invalid relative import level ${level} exceeds directory depth in ${filePath}`,
      );
      return relationships;
    }

    if (parts.length >= level) {
      const targetDir = parts.slice(0, -level + 1).join('/');
      const modulePath = imp.source.replace(/\./g, '/');
      targetFilePath = `${targetDir}/${modulePath}.py`;

      // Also check for __init__.py
      if (!fileToComponentMap.has(targetFilePath)) {
        targetFilePath = `${targetDir}/${modulePath}/__init__.py`;
      }
    }
  } else {
    // Absolute import within the project
    // Use index for O(1) lookup instead of O(n) search (Issue #3)
    const modulePath = imp.source.replace(/\./g, '/');

    // Try direct lookup in index
    targetFilePath = modulePathIndex.get(imp.source) || modulePathIndex.get(modulePath);

    // If not found, try with __init__.py
    if (!targetFilePath) {
      const initPath = `${modulePath}/__init__`;
      targetFilePath = modulePathIndex.get(initPath);
    }
  }

  // Normalize path separators
  if (targetFilePath) {
    targetFilePath = targetFilePath.replace(/\\/g, '/');
  }

  // Look up the target component ID
  const destinationComponentId = targetFilePath
    ? fileToComponentMap.get(targetFilePath)
    : undefined;

  // Debug logging for failed import resolutions (Issue #4)
  if (imp.category === 'local' && !destinationComponentId) {
    log.debug(
      `Failed to resolve local import: ${imp.source} from ${filePath} (target: ${targetFilePath || 'not found'})`,
    );
  }

  // Create relationships for each imported name
  for (const importedName of imp.importedNames) {
    relationships.push({
      source: componentId,
      destination: destinationComponentId || imp.source,
      description: importedName,
      stereotype: 'import',
    });
  }

  return relationships;
}

/**
 * Map ExtractedClass to CodeItem
 */
function mapClassToCodeItem(cls: ExtractedClass, componentId?: string): CodeItem {
  return {
    id: sanitizeId(cls.name),
    componentId: componentId || undefined,
    name: cls.name,
    type: 'class',
    description: cls.documentation?.summary ?? undefined,
    documentation: cls.documentation,
    deprecated: cls.deprecated,
    filePath: cls.location.filePath,
    lineNumber: cls.location.line,
    tags: ['Code'],
    metadata: {
      language: 'python',
      baseClasses: cls.baseClasses,
      decorators: cls.decorators,
      decoratorDetails: cls.decoratorDetails,
      isExported: cls.isExported,
    },
  };
}

/**
 * Map ExtractedMethod to CodeItem
 */
function mapMethodToCodeItem(
  method: ExtractedMethod,
  className: string,
  componentId?: string,
): CodeItem {
  return {
    id: sanitizeId(`${className}.${method.name}`),
    componentId: componentId || undefined,
    name: `${className}.${method.name}`,
    type: 'method',
    description: method.documentation?.summary ?? undefined,
    documentation: method.documentation,
    deprecated: method.deprecated,
    parameters: method.parameters,
    returnType: method.returnType,
    returnDescription: method.returnDescription ?? undefined,
    visibility: method.visibility,
    isAsync: method.isAsync,
    isStatic: method.isStatic,
    isAbstract: method.isAbstract,
    filePath: method.location.filePath,
    lineNumber: method.location.line,
    tags: ['Code'],
    metadata: {
      language: 'python',
      decorators: method.decorators,
      decoratorDetails: method.decoratorDetails,
      isClassMethod: method.isClassMethod,
    },
  };
}

/**
 * Map ExtractedFunction to CodeItem
 */
function mapFunctionToCodeItem(
  func: ExtractedFunction,
  componentId?: string,
): CodeItem {
  return {
    id: sanitizeId(func.name),
    componentId: componentId || undefined,
    name: func.name,
    type: 'function',
    description: func.documentation?.summary ?? undefined,
    documentation: func.documentation,
    deprecated: func.deprecated,
    parameters: func.parameters,
    returnType: func.returnType,
    returnDescription: func.returnDescription ?? undefined,
    isAsync: func.isAsync,
    filePath: func.location.filePath,
    lineNumber: func.location.line,
    tags: ['Code'],
    metadata: {
      language: 'python',
      decorators: func.decorators,
      decoratorDetails: func.decoratorDetails,
      isExported: func.isExported,
    },
  };
}

/**
 * Map ExtractedType to CodeItem
 */
function mapTypeToCodeItem(type: ExtractedType, componentId?: string): CodeItem {
  return {
    id: sanitizeId(type.name),
    componentId: componentId || undefined,
    name: type.name,
    type: 'type', // Using 'type' for type definitions
    description: type.documentation?.summary ?? undefined,
    documentation: type.documentation,
    deprecated: type.deprecated,
    filePath: type.location.filePath,
    lineNumber: type.location.line,
    tags: ['Code', 'Type'],
    metadata: {
      language: 'python',
      typeCategory: type.category,
      typeDefinition: type.definition,
      isExported: type.isExported,
    },
  };
}
