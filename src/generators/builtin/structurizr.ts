/**
 * Structurizr DSL Generator (Template-based)
 *
 * @module generators
 * @description
 * Generates Structurizr DSL from ArchletteIR using Nunjucks templates.
 * Produces a complete workspace with model and views following C4 architecture patterns.
 *
 * @example
 * ```yaml
 * generators:
 *   - use: builtin/structurizr
 *     outputs:
 *       workspace_dsl: docs/architecture/workspace.dsl
 * ```
 */

import type {
  ArchletteIR,
  Container,
  Component,
  CodeItem,
  Relationship,
} from '../../core/types-ir.js';
import type { ResolvedStageNode } from '../../core/types-aac.js';
import { VIEW_NAMES } from '../../core/constants.js';
import * as nunjucks from 'nunjucks';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

// Configure Nunjucks environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const templatesDir = join(__dirname, 'structurizr', 'templates');

const nunjucksEnv = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(templatesDir),
  { autoescape: false },
);

// Register custom filters
nunjucksEnv.addFilter('sanitizeId', sanitizeId);
nunjucksEnv.addFilter('escapeString', escapeString);
nunjucksEnv.addFilter('uniqueCodeName', generateUniqueCodeName);
nunjucksEnv.addFilter('buildTechnology', buildTechnologyString);

/**
 * Generate Structurizr DSL from ArchletteIR
 */
export default function structurizrGenerator(
  ir: ArchletteIR,
  _node: ResolvedStageNode,
): string {
  // Prepare actor relationships
  const actorRelationships = generateAllActorRelationships(ir);

  // Prepare container data with components and code
  const containersWithData = ir.containers.map((container) =>
    prepareContainerData(container, ir),
  );

  // Prepare component views
  const componentViews = ir.containers
    .map((container) => prepareComponentView(container, ir))
    .filter((view) => view !== null);

  // Prepare class views
  const classViews = ir.components
    .map((component) => prepareClassView(component, ir))
    .filter((view) => view !== null);

  // Render using main template
  return nunjucksEnv.render('workspace.dsl.njk', {
    system: ir.system,
    actors: ir.actors,
    containers: containersWithData,
    containerRelationships: ir.containerRelationships,
    actorRelationships,
    deployments: ir.deployments,
    componentViews,
    classViews,
    VIEW_NAMES,
  });
}

/**
 * Prepare container data with components, code, and relationships for template
 */
function prepareContainerData(container: Container, ir: ArchletteIR) {
  const containerComponents = ir.components.filter(
    (c) => c.containerId === container.id,
  );
  const containerCode = ir.code.filter((code) =>
    containerComponents.some((comp) => comp.id === code.componentId),
  );

  const actorIds = new Set(ir.actors.map((a) => a.id));
  const containerCompIds = new Set([
    ...containerComponents.map((c) => c.id),
    ...containerCode.map((c) => c.id),
  ]);

  const relevantCompRels = ir.componentRelationships.filter(
    (rel) =>
      containerCompIds.has(rel.source) &&
      containerCompIds.has(rel.destination) &&
      !actorIds.has(rel.source) &&
      !actorIds.has(rel.destination),
  );

  const relevantCodeRels = ir.codeRelationships.filter(
    (rel) =>
      containerCompIds.has(rel.source) &&
      containerCompIds.has(rel.destination) &&
      !actorIds.has(rel.source) &&
      !actorIds.has(rel.destination),
  );

  return {
    ...container,
    containerComponents,
    containerCode,
    relevantCompRels,
    relevantCodeRels,
  };
}

/**
 * Prepare component view data for template
 */
function prepareComponentView(container: Container, ir: ArchletteIR) {
  const containerComponents = ir.components.filter(
    (c) => c.containerId === container.id,
  );

  if (containerComponents.length === 0) return null;

  const componentIds = new Set(containerComponents.map((c) => c.id));

  const actorsWithInboundRels = ir.actors.filter((actor) =>
    (actor.targets || []).some((targetId) => componentIds.has(targetId)),
  );

  const actorsWithOutboundRels = ir.actors.filter((actor) =>
    ir.componentRelationships.some(
      (rel) => componentIds.has(rel.source) && rel.destination === actor.id,
    ),
  );

  const relevantActorIds = new Set([
    ...actorsWithInboundRels.map((a) => a.id),
    ...actorsWithOutboundRels.map((a) => a.id),
  ]);

  const relevantActors = ir.actors.filter((a) => relevantActorIds.has(a.id));

  return {
    containerId: container.id,
    viewName: VIEW_NAMES.COMPONENTS(sanitizeId(container.name)),
    relevantActors,
    components: containerComponents,
  };
}

/**
 * Prepare class view data for template
 */
function prepareClassView(component: Component, ir: ArchletteIR) {
  const componentCode = ir.code.filter((code) => code.componentId === component.id);

  if (componentCode.length === 0) return null;

  return {
    containerId: component.containerId,
    viewName: VIEW_NAMES.CLASSES(sanitizeId(component.id)),
    codeItems: componentCode,
  };
}

/**
 * Generate all actor-related relationships
 */
function generateAllActorRelationships(ir: ArchletteIR): Relationship[] {
  const relationships: Relationship[] = [];
  const actorIds = new Set(ir.actors.map((a) => a.id));

  // 1. Actor → Component (from actor.targets)
  for (const actor of ir.actors) {
    const targets = actor.targets || [];

    for (const targetId of targets) {
      const targetComponent = ir.components.find((c) => c.id === targetId);
      const targetContainer = ir.containers.find((c) => c.id === targetId);

      if (targetComponent) {
        relationships.push({
          source: actor.id,
          destination: targetId,
          description: `Interacts with ${targetComponent.name}`,
        });
      } else if (targetContainer) {
        relationships.push({
          source: actor.id,
          destination: targetId,
          description: `Uses ${targetContainer.name}`,
        });
      } else {
        relationships.push({
          source: actor.id,
          destination: targetId,
          description: 'Uses',
        });
      }
    }
  }

  // 2. Component → Actor (from componentRelationships where destination is an actor)
  for (const rel of ir.componentRelationships) {
    if (actorIds.has(rel.destination)) {
      relationships.push(rel);
    }
  }

  return relationships;
}

/**
 * Generate a unique name for a code item to avoid naming collisions
 */
function generateUniqueCodeName(code: CodeItem): string {
  // Check if this is a hierarchical ID (contains ::)
  if (code.id.includes('::')) {
    // Hierarchical ID format: "container::component::codeName"
    const parts = code.id.split('::');
    const codeName = parts[parts.length - 1];
    const componentName = parts.length > 2 ? parts[parts.length - 2] : undefined;

    if (componentName) {
      return `${componentName.toLowerCase()}::${codeName.toLowerCase()}`;
    }
    return codeName.toLowerCase();
  }

  // File-based ID format: "C:/path/to/file.ts:functionName"
  const lastColonIndex = code.id.lastIndexOf(':');

  if (lastColonIndex === -1) {
    return code.name.toLowerCase();
  }

  const filePath = code.id.substring(0, lastColonIndex);
  const symbolName = code.id.substring(lastColonIndex + 1);

  const pathSegments = filePath.split(/[/\\]/);
  const fileName = pathSegments[pathSegments.length - 1];
  const parentDir = pathSegments[pathSegments.length - 2];

  if (parentDir && /^\d/.test(parentDir)) {
    return `${parentDir.toLowerCase()}/${fileName.toLowerCase()}::${symbolName.toLowerCase()}`;
  }

  return `${fileName.toLowerCase()}::${symbolName.toLowerCase()}`;
}

/**
 * Build technology string from relationship metadata
 */
function buildTechnologyString(rel: Relationship): string {
  const parts: string[] = [];

  if (rel.protocol) {
    parts.push(rel.protocol);
  }
  if (rel.auth) {
    parts.push(`(${rel.auth})`);
  }

  return parts.join(' ');
}

/**
 * Sanitize ID for DSL (remove special characters, convert to valid identifier)
 */
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&');
}

/**
 * Escape special characters in strings for DSL
 */
function escapeString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
