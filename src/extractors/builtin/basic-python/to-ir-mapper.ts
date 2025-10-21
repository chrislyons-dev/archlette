/**
 * Map Python file extractions to ArchletteIR
 */

import { createLogger } from '../../../core/logger.js';
import { nameToId } from '../../../core/constants.js';
import type {
  ArchletteIR,
  Actor,
  Component,
  CodeItem,
  Relationship,
} from '../../../core/types-ir.js';
import type {
  FileExtraction,
  ComponentInfo,
  ActorInfo,
  RelationshipInfo,
  ExtractedClass,
  ExtractedMethod,
  ExtractedFunction,
} from './types.js';

const log = createLogger({ context: 'PythonIRMapper' });

/**
 * Map file extractions to ArchletteIR
 */
export function mapToIR(
  extractions: FileExtraction[],
  systemName: string,
  systemDescription?: string,
): ArchletteIR {
  log.info(`Mapping ${extractions.length} Python files to IR`);

  // Aggregate all components, actors, relationships
  const componentMap = new Map<string, ComponentInfo>();
  const actorMap = new Map<string, ActorInfo>();
  const relationships: RelationshipInfo[] = [];
  const codeItems: CodeItem[] = [];

  for (const extraction of extractions) {
    // Collect components
    if (extraction.component) {
      const existing = componentMap.get(extraction.component.id);
      if (!existing) {
        componentMap.set(extraction.component.id, extraction.component);
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
  }

  // Map actors and collect targets
  const actors = Array.from(actorMap.values());
  const actorTargets = new Map<string, string[]>();

  // Create IR
  const ir: ArchletteIR = {
    version: '1.0',
    system: {
      name: systemName,
      description: systemDescription,
    },
    actors: actors.map((actor) => mapActorToIR(actor, actorTargets)),
    containers: [], // TODO: Infer from package structure in Phase 3
    components: Array.from(componentMap.values()).map(mapComponentToIR),
    code: codeItems,
    deployments: [],
    containerRelationships: [],
    componentRelationships: deduplicateRelationships(
      mapRelationshipsToIR(relationships, componentMap, actorMap, actorTargets),
    ),
    codeRelationships: [],
    deploymentRelationships: [],
  };

  log.info(
    `Mapped IR: ${ir.components.length} components, ${ir.actors.length} actors, ${ir.code.length} code items`,
  );

  return ir;
}

/**
 * Map ComponentInfo to Component
 */
function mapComponentToIR(comp: ComponentInfo): Component {
  return {
    id: comp.id,
    containerId: '', // Will be filled by validators or other extractors
    name: comp.name,
    type: 'module',
    description: comp.description,
    tags: ['Code'], // Mark as code element for view filtering
  };
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
  componentMap: Map<string, ComponentInfo>,
  actorMap: Map<string, ActorInfo>,
  actorTargets: Map<string, string[]>,
): Relationship[] {
  const result: Relationship[] = [];

  for (const rel of relationships) {
    const targetId = nameToId(rel.target);

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
 * Deduplicate relationships by source+destination
 */
function deduplicateRelationships(relationships: Relationship[]): Relationship[] {
  const seen = new Set<string>();
  return relationships.filter((rel) => {
    const key = `${rel.source}->${rel.destination}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Map ExtractedClass to CodeItem
 */
function mapClassToCodeItem(cls: ExtractedClass, componentId?: string): CodeItem {
  return {
    id: nameToId(cls.name),
    componentId: componentId || undefined,
    name: cls.name,
    type: 'class',
    description: cls.documentation?.summary,
    documentation: cls.documentation,
    deprecated: cls.deprecated,
    filePath: cls.location.filePath,
    lineNumber: cls.location.line,
    tags: ['Code'],
    metadata: {
      language: 'python',
      baseClasses: cls.baseClasses,
      decorators: cls.decorators,
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
    id: nameToId(`${className}.${method.name}`),
    componentId: componentId || undefined,
    name: `${className}.${method.name}`,
    type: 'method',
    description: method.documentation?.summary,
    documentation: method.documentation,
    deprecated: method.deprecated,
    parameters: method.parameters,
    returnType: method.returnType,
    returnDescription: method.returnDescription,
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
    id: nameToId(func.name),
    componentId: componentId || undefined,
    name: func.name,
    type: 'function',
    description: func.documentation?.summary,
    documentation: func.documentation,
    deprecated: func.deprecated,
    parameters: func.parameters,
    returnType: func.returnType,
    returnDescription: func.returnDescription,
    isAsync: func.isAsync,
    filePath: func.location.filePath,
    lineNumber: func.location.line,
    tags: ['Code'],
    metadata: {
      language: 'python',
      decorators: func.decorators,
      isExported: func.isExported,
    },
  };
}
