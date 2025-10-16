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
  const lines: string[] = [];
  const indent = '    ';

  // Workspace header
  lines.push(
    `workspace "${ir.system.name}" "${ir.system.description || 'Architecture as Code generated workspace'}" {`,
  );
  lines.push('');
  lines.push(`${indent}model {`);

  // Generate actors (external people or systems)
  if (ir.actors.length > 0) {
    lines.push(`${indent}${indent}# External actors`);
    for (const actor of ir.actors) {
      lines.push(generateActor(actor, indent + indent));
    }
    lines.push('');
  }

  // Generate system
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

  // Generate containers
  if (ir.containers.length > 0) {
    lines.push(`${indent}${indent}${indent}# Containers`);
    for (const container of ir.containers) {
      lines.push(
        generateContainer(
          container,
          ir.components,
          ir.code,
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

  // System-level relationships (actors to system)
  const actorRelationships = ir.actors.flatMap((actor) =>
    (actor.targets || []).map((target) => ({
      source: actor.id,
      destination: target,
      description: 'Uses',
    })),
  );

  if (actorRelationships.length > 0) {
    lines.push(`${indent}${indent}# Actor interactions`);
    for (const rel of actorRelationships) {
      lines.push(generateRelationship(rel as Relationship, indent + indent));
    }
    lines.push('');
  }

  // Generate deployments
  if (ir.deployments.length > 0) {
    lines.push(`${indent}${indent}# Deployment environments`);
    for (const deployment of ir.deployments) {
      lines.push(generateDeployment(deployment, indent + indent));
      lines.push('');
    }
  }

  lines.push(`${indent}}`); // Close model
  lines.push('');

  // Generate views
  lines.push(`${indent}views {`);
  lines.push('');

  // System Context diagram (actors + system)
  lines.push(
    `${indent}${indent}systemContext ${sanitizeId(ir.system.name)} "SystemContext" {`,
  );
  lines.push(`${indent}${indent}${indent}include *`);
  lines.push(`${indent}${indent}${indent}autoLayout`);
  lines.push(`${indent}${indent}}`);
  lines.push('');

  // Container diagram (system broken down into containers)
  lines.push(
    `${indent}${indent}container ${sanitizeId(ir.system.name)} "Containers" {`,
  );
  lines.push(`${indent}${indent}${indent}include *`);
  lines.push(`${indent}${indent}${indent}autoLayout`);
  lines.push(`${indent}${indent}}`);
  lines.push('');

  // Component diagrams (one per container, excluding Code elements)
  for (const container of ir.containers) {
    const containerComponents = ir.components.filter(
      (c) => c.containerId === container.id,
    );
    if (containerComponents.length > 0) {
      lines.push(
        `${indent}${indent}component ${sanitizeId(container.id)} "Components_${sanitizeId(container.name)}" {`,
      );
      lines.push(`${indent}${indent}${indent}include *`);
      lines.push(`${indent}${indent}${indent}exclude "element.tag==Code"`);
      lines.push(`${indent}${indent}${indent}autoLayout`);
      lines.push(`${indent}${indent}}`);
      lines.push('');
    }
  }

  // Class diagrams (one per container, only Code elements)
  for (const container of ir.containers) {
    const containerCode = ir.code.filter((code) => {
      const component = ir.components.find((c) => c.id === code.componentId);
      return component && component.containerId === container.id;
    });
    if (containerCode.length > 0) {
      lines.push(
        `${indent}${indent}component ${sanitizeId(container.id)} "Classes_${sanitizeId(container.name)}" {`,
      );
      lines.push(`${indent}${indent}${indent}include *`);
      lines.push(`${indent}${indent}${indent}include "element.tag==Code"`);
      lines.push(`${indent}${indent}${indent}exclude "element.tag!=Code"`);
      lines.push(`${indent}${indent}${indent}autoLayout`);
      lines.push(`${indent}${indent}}`);
      lines.push('');
    }
  }

  lines.push(`${indent}}`); // Close views
  lines.push('');

  lines.push('}'); // Close workspace

  return lines.join('\n');
}

/**
 * Generate DSL for an actor (person or external system)
 */
function generateActor(actor: Actor, indent: string): string {
  const lines: string[] = [];
  const actorType = actor.type === 'Person' ? 'person' : 'softwareSystem';
  const tags = actor.type !== 'Person' ? ' "External"' : '';

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
    const containerCompIds = new Set([
      ...containerComponents.map((c) => c.id),
      ...containerCode.map((c) => c.id),
    ]);
    const relevantCompRels = componentRels.filter(
      (rel) =>
        containerCompIds.has(rel.source) && containerCompIds.has(rel.destination),
    );
    const relevantCodeRels = codeRels.filter(
      (rel) =>
        containerCompIds.has(rel.source) && containerCompIds.has(rel.destination),
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

  lines.push(`${indent}${codeId} = component "${code.name}" {`);
  if (code.description || code.documentation?.summary) {
    const desc = code.description || code.documentation?.summary || '';
    lines.push(`${indent}    description "${escapeString(desc)}"`);
  }
  if (code.type) {
    lines.push(`${indent}    technology "${escapeString(code.type)}"`);
  }

  // Always add "Code" tag, plus any additional tags
  const tags = ['Code'];
  if (code.tags && code.tags.length > 0) {
    tags.push(...code.tags);
  }
  lines.push(`${indent}    tags "${tags.join(',')}"`);

  lines.push(`${indent}}`);

  return lines.join('\n');
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
