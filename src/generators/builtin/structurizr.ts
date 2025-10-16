/**
 * Structurizr DSL Generator
 *
 * @module generators
 * @description
 * Generates Structurizr DSL from ArchletteIR. Produces a complete workspace
 * with model and views following C4 architecture patterns.
 *
 * Mapping:
 * - IR.system → DSL softwareSystem
 * - IR.actors → DSL person or external softwareSystem
 * - IR.containers → DSL container
 * - IR.components → DSL component
 * - IR.code → DSL component (with technology = type)
 * - IR.deployments → DSL deploymentEnvironment
 * - All relationships → DSL relationships with description and technology
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
  Actor,
  Container,
  Component,
  CodeItem,
  Deployment,
  Relationship,
} from '../../core/types-ir.js';
import type { ResolvedStageNode } from '../../core/types-aac.js';
import { TAGS, VIEW_NAMES } from '../../core/constants.js';

/**
 * Generate Structurizr DSL from ArchletteIR
 *
 * @param ir - The validated ArchletteIR to transform
 * @param _node - Configuration node (unused but required by interface)
 * @returns Structurizr DSL as a string
 */
export default function structurizrGenerator(
  ir: ArchletteIR,
  _node: ResolvedStageNode,
): string {
  const indent = '    ';
  const lines: string[] = [];

  // Workspace header
  lines.push(
    `workspace "${ir.system.name}" "${ir.system.description || 'Architecture as Code generated workspace'}" {`,
  );
  lines.push('');

  // Model section
  lines.push(...generateModel(ir, indent));
  lines.push('');

  // Views section
  lines.push(...generateViews(ir, indent));
  lines.push('');

  lines.push('}'); // Close workspace

  return lines.join('\n');
}

/**
 * Generate all actor-related relationships (bidirectional)
 *
 * Includes:
 * 1. Actor → Component (from actor.targets) - users interacting with system
 * 2. Component → Actor (from componentRelationships) - system using external actors
 *
 * Structurizr automatically aggregates relationships in views:
 * - System Context view: Shows as actor ↔ system
 * - Container view: Shows as actor ↔ container
 * - Component view: Shows actual actor ↔ component relationships
 *
 * @param ir - The ArchletteIR containing actors and components
 * @returns Array of relationships to include in the model
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
 * Generate the model section of the DSL
 */
function generateModel(ir: ArchletteIR, indent: string): string[] {
  const lines: string[] = [];
  lines.push(`${indent}model {`);

  // Actors
  if (ir.actors.length > 0) {
    lines.push(`${indent}${indent}# External actors`);
    for (const actor of ir.actors) {
      lines.push(generateActor(actor, indent + indent));
    }
    lines.push('');
  }

  // System
  lines.push(`${indent}${indent}# ${ir.system.name} System`);
  lines.push(
    `${indent}${indent}${sanitizeId(ir.system.name)} = softwareSystem "${ir.system.name}" {`,
  );
  if (ir.system.description) {
    lines.push(
      `${indent}${indent}${indent}description "${escapeString(ir.system.description)}"`,
    );
  }
  if (ir.system.tags && ir.system.tags.length > 0) {
    lines.push(`${indent}${indent}${indent}tags "${ir.system.tags.join(',')}"`);
  }
  lines.push('');

  // Containers
  if (ir.containers.length > 0) {
    lines.push(`${indent}${indent}${indent}# Containers`);
    for (const container of ir.containers) {
      lines.push(
        generateContainer(
          container,
          ir.components,
          ir.code,
          ir.actors,
          ir.componentRelationships,
          ir.codeRelationships,
          indent + indent + indent,
        ),
      );
      lines.push('');
    }
  }

  // Container relationships
  if (ir.containerRelationships.length > 0) {
    lines.push(`${indent}${indent}${indent}# Container relationships`);
    for (const rel of ir.containerRelationships) {
      lines.push(generateRelationship(rel, indent + indent + indent));
    }
  }

  lines.push(`${indent}${indent}}`); // Close system
  lines.push('');

  // Actor relationships
  // 1. Actor → Component (from actor.targets)
  // 2. Component → Actor (from componentRelationships where dest is an actor)
  const allActorRelationships = generateAllActorRelationships(ir);

  if (allActorRelationships.length > 0) {
    lines.push(`${indent}${indent}# Actor interactions`);
    for (const rel of allActorRelationships) {
      lines.push(generateRelationship(rel, indent + indent));
    }
    lines.push('');
  }

  // Deployments
  if (ir.deployments.length > 0) {
    lines.push(`${indent}${indent}# Deployment environments`);
    for (const deployment of ir.deployments) {
      lines.push(generateDeployment(deployment, indent + indent));
      lines.push('');
    }
  }

  lines.push(`${indent}}`); // Close model
  return lines;
}

/**
 * Generate the views section of the DSL
 */
function generateViews(ir: ArchletteIR, indent: string): string[] {
  const lines: string[] = [];
  lines.push(`${indent}views {`);
  lines.push('');

  // System Context view
  lines.push(...generateSystemContextView(ir, indent + indent));
  lines.push('');

  // Container view
  lines.push(...generateContainerView(ir, indent + indent));
  lines.push('');

  // Component views (per container)
  for (const container of ir.containers) {
    const componentLines = generateComponentView(ir, container, indent + indent);
    if (componentLines.length > 0) {
      lines.push(...componentLines);
      lines.push('');
    }
  }

  // Class views (per component) - supports drill-down from component to code level
  for (const component of ir.components) {
    const classLines = generateClassView(ir, component, indent + indent);
    if (classLines.length > 0) {
      lines.push(...classLines);
      lines.push('');
    }
  }

  lines.push(`${indent}}`); // Close views
  return lines;
}

/**
 * Generate System Context view
 *
 * Shows actors and the system boundary. Structurizr automatically aggregates
 * actor → component relationships to actor → system for this view since
 * components are not explicitly included.
 */
function generateSystemContextView(ir: ArchletteIR, indent: string): string[] {
  const lines: string[] = [];
  lines.push(
    `${indent}systemContext ${sanitizeId(ir.system.name)} "${VIEW_NAMES.SYSTEM_CONTEXT}" {`,
  );

  // Include all actors
  for (const actor of ir.actors) {
    lines.push(`${indent}    include ${sanitizeId(actor.id)}`);
  }

  // Include the system (containers/components will be aggregated)
  lines.push(`${indent}    include ${sanitizeId(ir.system.name)}`);

  // Structurizr automatically aggregates relationships when elements are hidden
  // Actor → Component becomes Actor → System in this view
  lines.push(`${indent}    autoLayout`);
  lines.push(`${indent}}`);

  return lines;
}

/**
 * Generate Container view
 *
 * Shows actors, containers, and their relationships. Actor → component
 * relationships are automatically aggregated to actor → container level
 * by Structurizr since components are not shown in this view.
 */
function generateContainerView(ir: ArchletteIR, indent: string): string[] {
  const lines: string[] = [];
  lines.push(
    `${indent}container ${sanitizeId(ir.system.name)} "${VIEW_NAMES.CONTAINERS}" {`,
  );

  // Include all actors
  for (const actor of ir.actors) {
    lines.push(`${indent}    include ${sanitizeId(actor.id)}`);
  }

  // Include all containers
  for (const container of ir.containers) {
    lines.push(`${indent}    include ${sanitizeId(container.id)}`);
  }

  // Components are hidden, so actor → component becomes actor → container
  lines.push(`${indent}    autoLayout`);
  lines.push(`${indent}}`);

  return lines;
}

/**
 * Generate Component view for a container (excludes Code elements)
 *
 * Shows actors, components within the container, and their relationships.
 * Actor → component relationships are shown explicitly at this level.
 * Code elements are excluded to keep the view focused on architecture.
 */
function generateComponentView(
  ir: ArchletteIR,
  container: Container,
  indent: string,
): string[] {
  const containerComponents = ir.components.filter(
    (c) => c.containerId === container.id,
  );

  if (containerComponents.length === 0) return [];

  const lines: string[] = [];
  lines.push(
    `${indent}component ${sanitizeId(container.id)} "${VIEW_NAMES.COMPONENTS(sanitizeId(container.name))}" {`,
  );

  // Include actors that interact with components in this container
  const componentIds = new Set(containerComponents.map((c) => c.id));
  const relevantActors = ir.actors.filter((actor) =>
    (actor.targets || []).some((targetId) => componentIds.has(targetId)),
  );

  for (const actor of relevantActors) {
    lines.push(`${indent}    include ${sanitizeId(actor.id)}`);
  }

  // Include all components in this container (but exclude code elements)
  for (const component of containerComponents) {
    lines.push(`${indent}    include ${sanitizeId(component.id)}`);
  }

  // Exclude code-level elements (classes/functions) - show architecture only
  lines.push(`${indent}    exclude "element.tag==${TAGS.CODE}"`);
  lines.push(`${indent}    autoLayout`);
  lines.push(`${indent}}`);

  return lines;
}

/**
 * Generate Class view for a component (only Code elements within that component)
 * This supports the drill-down model: System → Container → Component → Code
 *
 * Note: Component views in Structurizr require a container ID, not a component ID.
 * We use the component's container and filter to show only this component's code.
 */
function generateClassView(
  ir: ArchletteIR,
  component: Component,
  indent: string,
): string[] {
  const componentCode = ir.code.filter((code) => code.componentId === component.id);

  if (componentCode.length === 0) return [];

  const lines: string[] = [];
  // Use container ID (required by Structurizr), not component ID
  lines.push(
    `${indent}component ${sanitizeId(component.containerId)} "${VIEW_NAMES.CLASSES(sanitizeId(component.name))}" {`,
  );

  // Explicitly include only the code elements that belong to this component
  for (const code of componentCode) {
    lines.push(`${indent}    include ${sanitizeId(code.id)}`);
  }

  // Include relationships between these code elements
  const codeIds = new Set(componentCode.map((c) => c.id));
  const relevantRels = ir.codeRelationships.filter(
    (rel) => codeIds.has(rel.source) && codeIds.has(rel.destination),
  );
  for (const rel of relevantRels) {
    lines.push(
      `${indent}    include ${sanitizeId(rel.source)} -> ${sanitizeId(rel.destination)}`,
    );
  }

  lines.push(`${indent}    autoLayout`);
  lines.push(`${indent}}`);

  return lines;
}

/**
 * Generate DSL for an actor (person or external system)
 */
function generateActor(actor: Actor, indent: string): string {
  const lines: string[] = [];
  const actorType = actor.type === 'Person' ? 'person' : 'softwareSystem';
  const tags = actor.type !== 'Person' ? ` "${TAGS.EXTERNAL}"` : '';

  lines.push(
    `${indent}${sanitizeId(actor.id)} = ${actorType} "${actor.name}" "${escapeString(actor.description || '')}"${tags}`,
  );

  return lines.join('\n');
}

/**
 * Generate DSL for a container with its components
 */
function generateContainer(
  container: Container,
  allComponents: Component[],
  allCode: CodeItem[],
  allActors: Actor[],
  componentRels: Relationship[],
  codeRels: Relationship[],
  indent: string,
): string {
  const lines: string[] = [];
  const containerId = sanitizeId(container.id);

  lines.push(`${indent}${containerId} = container "${container.name}" {`);
  if (container.description) {
    lines.push(`${indent}    description "${escapeString(container.description)}"`);
  }
  if (container.type) {
    lines.push(`${indent}    technology "${escapeString(container.type)}"`);
  }
  if (container.tags && container.tags.length > 0) {
    lines.push(`${indent}    tags "${container.tags.join(',')}"`);
  }

  // Find components for this container
  const containerComponents = allComponents.filter(
    (c) => c.containerId === container.id,
  );

  // Find code items for this container (components or direct container association)
  const containerCode = allCode.filter((code) =>
    containerComponents.some((comp) => comp.id === code.componentId),
  );

  if (containerComponents.length > 0 || containerCode.length > 0) {
    lines.push('');
    lines.push(`${indent}    # Components`);

    // Generate components (logical groupings)
    for (const component of containerComponents) {
      lines.push(generateComponent(component, indent + '    '));
    }

    // Generate ALL code items as components with "Code" tag
    // This allows separate views for architecture vs implementation
    lines.push('');
    lines.push(`${indent}    # Code elements (classes, functions)`);
    for (const code of containerCode) {
      lines.push(generateCodeAsComponent(code, indent + '    '));
    }

    // Component relationships for this container
    // Note: Exclude relationships to actors - those are rendered outside the system block
    const containerCompIds = new Set([
      ...containerComponents.map((c) => c.id),
      ...containerCode.map((c) => c.id),
    ]);
    const actorIds = new Set(allActors.map((a) => a.id));

    const relevantCompRels = componentRels.filter(
      (rel) =>
        containerCompIds.has(rel.source) &&
        containerCompIds.has(rel.destination) &&
        !actorIds.has(rel.destination), // Exclude component → actor
    );
    const relevantCodeRels = codeRels.filter(
      (rel) =>
        containerCompIds.has(rel.source) &&
        containerCompIds.has(rel.destination) &&
        !actorIds.has(rel.destination), // Exclude code → actor
    );

    if (relevantCompRels.length > 0 || relevantCodeRels.length > 0) {
      lines.push('');
      lines.push(`${indent}    # Component relationships`);
      for (const rel of relevantCompRels) {
        lines.push(generateRelationship(rel, indent + '    '));
      }
      for (const rel of relevantCodeRels) {
        lines.push(generateRelationship(rel, indent + '    '));
      }
    }
  }

  lines.push(`${indent}}`); // Close container

  return lines.join('\n');
}

/**
 * Generate DSL for a component
 */
function generateComponent(component: Component, indent: string): string {
  const lines: string[] = [];
  const compId = sanitizeId(component.id);

  lines.push(`${indent}${compId} = component "${component.name}" {`);
  if (component.description) {
    lines.push(`${indent}    description "${escapeString(component.description)}"`);
  }
  if (component.type) {
    lines.push(`${indent}    technology "${escapeString(component.type)}"`);
  }
  if (component.tags && component.tags.length > 0) {
    lines.push(`${indent}    tags "${component.tags.join(',')}"`);
  }
  lines.push(`${indent}}`);

  return lines.join('\n');
}

/**
 * Generate DSL for a code item as a component
 * Always tagged with "Code" to separate from logical components in views
 */
function generateCodeAsComponent(code: CodeItem, indent: string): string {
  const lines: string[] = [];
  const codeId = sanitizeId(code.id);

  // Create unique name by extracting file context from ID
  // ID format: C__path_to_file_ts_functionName
  // Extract last 2-3 segments for uniqueness (e.g., "index_ts::run" or "cli_ts::run")
  const uniqueName = generateUniqueCodeName(code);

  lines.push(`${indent}${codeId} = component "${uniqueName}" {`);
  if (code.description || code.documentation?.summary) {
    const desc = code.description || code.documentation?.summary || '';
    lines.push(`${indent}    description "${escapeString(desc)}"`);
  }
  if (code.type) {
    lines.push(`${indent}    technology "${escapeString(code.type)}"`);
  }

  // Always add "Code" tag, plus any additional tags
  const tags: string[] = [TAGS.CODE];
  if (code.tags && code.tags.length > 0) {
    tags.push(...code.tags);
  }
  lines.push(`${indent}    tags "${tags.join(',')}"`);

  lines.push(`${indent}}`);

  return lines.join('\n');
}

/**
 * Generate a unique name for a code item to avoid naming collisions
 *
 * Extracts file context from the code ID to create a unique display name.
 * Example: "1-extract/index.ts::run" or "cli.ts::run"
 *
 * @param code - The code item
 * @returns Unique name incorporating file context
 */
function generateUniqueCodeName(code: CodeItem): string {
  // ID format: "C:/path/to/file.ts:functionName" or "/path/to/file.ts:functionName"
  // Handle Windows absolute paths (C:) and Unix paths differently

  // Find the last colon that's not part of a Windows drive letter
  // Windows: "C:/path/file.ts:funcName" -> split at last :
  // Unix: "/path/file.ts:funcName" -> split at last :
  const lastColonIndex = code.id.lastIndexOf(':');

  if (lastColonIndex === -1) {
    // No colon separator, fall back to original name
    return code.name.toLowerCase();
  }

  const filePath = code.id.substring(0, lastColonIndex);
  const symbolName = code.id.substring(lastColonIndex + 1);

  // Extract filename from path (last segment)
  // Handle both forward and backward slashes
  const pathSegments = filePath.split(/[/\\]/);
  const fileName = pathSegments[pathSegments.length - 1];

  // Extract parent directory for context (e.g., "1-extract", "core")
  const parentDir = pathSegments[pathSegments.length - 2];

  // Create contextual name (all lowercase for consistency)
  // If parent is numeric stage dir (1-extract, 2-validate), include it
  if (parentDir && /^\d/.test(parentDir)) {
    return `${parentDir.toLowerCase()}/${fileName.toLowerCase()}::${symbolName.toLowerCase()}`;
  }

  // Otherwise just use filename
  return `${fileName.toLowerCase()}::${symbolName.toLowerCase()}`;
}

/**
 * Generate DSL for a relationship
 */
function generateRelationship(rel: Relationship, indent: string): string {
  const source = sanitizeId(rel.source);
  const dest = sanitizeId(rel.destination);
  const description = rel.description || rel.stereotype || 'Uses';
  const technology = buildTechnologyString(rel);

  if (technology) {
    return `${indent}${source} -> ${dest} "${escapeString(description)}" "${escapeString(technology)}"`;
  }
  return `${indent}${source} -> ${dest} "${escapeString(description)}"`;
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
 * Generate DSL for a deployment environment
 */
function generateDeployment(deployment: Deployment, indent: string): string {
  const lines: string[] = [];

  lines.push(`${indent}deploymentEnvironment "${deployment.name}" {`);

  if (deployment.nodes) {
    for (const node of deployment.nodes) {
      lines.push(`${indent}    deploymentNode "${node.name}" {`);
      if (node.technology) {
        lines.push(`${indent}        technology "${escapeString(node.technology)}"`);
      }
      if (node.containers && node.containers.length > 0) {
        for (const containerRef of node.containers) {
          lines.push(
            `${indent}        containerInstance ${sanitizeId(containerRef.id)}`,
          );
        }
      }
      lines.push(`${indent}    }`);
    }
  }

  lines.push(`${indent}}`);

  return lines.join('\n');
}

/**
 * Sanitize ID for DSL (remove special characters, convert to camelCase)
 */
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&'); // Can't start with number
}

/**
 * Escape special characters in strings for DSL
 */
function escapeString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
