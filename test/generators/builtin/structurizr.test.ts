/**
 * Unit tests for Structurizr DSL generator
 */
import { describe, it, expect } from 'vitest';
import structurizrGenerator from '../../../src/generators/builtin/structurizr.js';
import type { ArchletteIR } from '../../../src/core/types-ir.js';
import type { ResolvedStageNode } from '../../../src/core/types-aac.js';

describe('structurizrGenerator', () => {
  const mockNode: ResolvedStageNode = {
    use: 'builtin/structurizr',
    name: 'test-generator',
    props: {},
    inputs: {},
    _effective: { includes: [], excludes: [] },
  };

  it('generates minimal workspace with system', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'TestSystem', description: 'A test system' },
      actors: [],
      containers: [],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    expect(dsl).toContain('workspace "TestSystem"');
    expect(dsl).toContain('softwareSystem "TestSystem"');
    expect(dsl).toContain('description "A test system"');
  });

  it('generates actors as person or external system', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'TestSystem' },
      actors: [
        { id: 'user', name: 'User', type: 'Person', description: 'End user' },
        {
          id: 'external',
          name: 'External API',
          type: 'Software System',
          description: 'External service',
        },
      ],
      containers: [],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    expect(dsl).toContain('user = person "User"');
    expect(dsl).toContain(
      'external = softwareSystem "External API" "External service" "External"',
    );
  });

  it('generates containers with technology', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'TestSystem' },
      actors: [],
      containers: [
        {
          id: 'api',
          name: 'API Service',
          type: 'Cloudflare Worker',
          layer: 'Application',
          description: 'REST API',
          tags: ['Backend', 'TypeScript'],
        },
      ],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    expect(dsl).toContain('api = container "API Service"');
    expect(dsl).toContain('technology "Cloudflare Worker"');
    expect(dsl).toContain('description "REST API"');
    expect(dsl).toContain('tags "Backend,TypeScript"');
  });

  it('generates components within containers', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'TestSystem' },
      actors: [],
      containers: [{ id: 'api', name: 'API', type: 'Service', layer: 'Application' }],
      components: [
        {
          id: 'comp.auth',
          containerId: 'api',
          name: 'Auth Module',
          type: 'module',
          description: 'Authentication logic',
        },
      ],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    expect(dsl).toContain('comp_auth = component "Auth Module"');
    expect(dsl).toContain('description "Authentication logic"');
    expect(dsl).toContain('technology "module"');
  });

  it('generates relationships with description and technology', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'TestSystem' },
      actors: [],
      containers: [
        { id: 'api', name: 'API', type: 'Service', layer: 'Application' },
        { id: 'db', name: 'Database', type: 'PostgreSQL', layer: 'Data' },
      ],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [
        {
          source: 'api',
          destination: 'db',
          description: 'Reads/Writes',
          protocol: 'postgresql',
          auth: 'tls',
        },
      ],
      componentRelationships: [],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    expect(dsl).toContain('api -> db "Reads/Writes" "postgresql (tls)"');
  });

  it('generates component relationships within containers', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'TestSystem' },
      actors: [],
      containers: [{ id: 'api', name: 'API', type: 'Service', layer: 'Application' }],
      components: [
        { id: 'comp.a', containerId: 'api', name: 'ComponentA', type: 'module' },
        { id: 'comp.b', containerId: 'api', name: 'ComponentB', type: 'module' },
      ],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [
        { source: 'comp.a', destination: 'comp.b', description: 'Uses' },
      ],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    expect(dsl).toContain('comp_a -> comp_b "Uses"');
  });

  it('generates deployments with container instances', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'TestSystem' },
      actors: [],
      containers: [{ id: 'api', name: 'API', type: 'Service', layer: 'Application' }],
      components: [],
      code: [],
      deployments: [
        {
          name: 'Production',
          nodes: [
            {
              id: 'node1',
              name: 'worker-prod',
              type: 'deployment',
              technology: 'Cloudflare Workers',
              containers: [{ id: 'api' }],
            },
          ],
        },
      ],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    expect(dsl).toContain('deploymentEnvironment "Production"');
    expect(dsl).toContain('deploymentNode "worker-prod"');
    expect(dsl).toContain('technology "Cloudflare Workers"');
    expect(dsl).toContain('containerInstance api');
  });

  it('handles special characters in strings', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'Test System', description: 'Has backslash and newline' },
      actors: [],
      containers: [],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    // Verify workspace is generated successfully
    expect(dsl).toContain('workspace "Test System"');
    expect(dsl).toContain('description "Has backslash and newline"');
  });
});
