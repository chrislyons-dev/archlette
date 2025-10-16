/**
 * Tests for ArchletteIR aggregation
 */

import { describe, it, expect } from 'vitest';
import { aggregateIRs } from '../../src/1-extract/aggregator.js';
import type { ArchletteIR } from '../../src/core/types-ir.js';

describe('aggregateIRs', () => {
  const createTestIR = (name: string): ArchletteIR => ({
    version: '1.0',
    system: {
      name,
      description: `System ${name}`,
    },
    actors: [],
    containers: [],
    components: [],
    code: [],
    deployments: [],
    containerRelationships: [],
    componentRelationships: [],
    codeRelationships: [],
  });

  it('returns empty IR when given empty array', () => {
    const result = aggregateIRs([]);

    expect(result.version).toBe('1.0');
    expect(result.system.name).toBe('Unknown System');
    expect(result.actors).toHaveLength(0);
    expect(result.containers).toHaveLength(0);
    expect(result.components).toHaveLength(0);
  });

  it('returns same IR when given single IR', () => {
    const ir = createTestIR('TestSystem');
    const result = aggregateIRs([ir]);

    expect(result).toBe(ir);
  });

  it('uses first IR system metadata when aggregating multiple IRs', () => {
    const ir1 = createTestIR('FirstSystem');
    const ir2 = createTestIR('SecondSystem');
    const ir3 = createTestIR('ThirdSystem');

    const result = aggregateIRs([ir1, ir2, ir3]);

    expect(result.system.name).toBe('FirstSystem');
    expect(result.system.description).toBe('System FirstSystem');
  });

  it('deduplicates actors by ID', () => {
    const ir1: ArchletteIR = {
      ...createTestIR('System1'),
      actors: [
        { id: 'actor1', name: 'User', type: 'Person' },
        { id: 'actor2', name: 'Admin', type: 'Person' },
      ],
    };

    const ir2: ArchletteIR = {
      ...createTestIR('System2'),
      actors: [
        { id: 'actor1', name: 'User Duplicate', type: 'Person' }, // Duplicate ID
        { id: 'actor3', name: 'System', type: 'Software System' },
      ],
    };

    const result = aggregateIRs([ir1, ir2]);

    expect(result.actors).toHaveLength(3);
    expect(result.actors[0].name).toBe('User'); // First occurrence wins
    expect(result.actors[1].name).toBe('Admin');
    expect(result.actors[2].name).toBe('System');
  });

  it('deduplicates containers by ID', () => {
    const ir1: ArchletteIR = {
      ...createTestIR('System1'),
      containers: [
        { id: 'container1', name: 'API', type: 'Service', layer: 'Backend' },
      ],
    };

    const ir2: ArchletteIR = {
      ...createTestIR('System2'),
      containers: [
        { id: 'container1', name: 'API Updated', type: 'Service', layer: 'Backend' }, // Duplicate
        { id: 'container2', name: 'Database', type: 'Database', layer: 'Data' },
      ],
    };

    const result = aggregateIRs([ir1, ir2]);

    expect(result.containers).toHaveLength(2);
    expect(result.containers[0].name).toBe('API'); // First wins
    expect(result.containers[1].name).toBe('Database');
  });

  it('deduplicates components by ID', () => {
    const ir1: ArchletteIR = {
      ...createTestIR('System1'),
      components: [
        { id: 'comp1', containerId: 'c1', name: 'UserService', type: 'Service' },
      ],
    };

    const ir2: ArchletteIR = {
      ...createTestIR('System2'),
      components: [
        { id: 'comp1', containerId: 'c1', name: 'UserService2', type: 'Service' }, // Duplicate
        { id: 'comp2', containerId: 'c1', name: 'AuthService', type: 'Service' },
      ],
    };

    const result = aggregateIRs([ir1, ir2]);

    expect(result.components).toHaveLength(2);
    expect(result.components[0].name).toBe('UserService');
    expect(result.components[1].name).toBe('AuthService');
  });

  it('deduplicates code items by ID', () => {
    const ir1: ArchletteIR = {
      ...createTestIR('System1'),
      code: [
        { id: 'code1', name: 'getUser', type: 'function' },
        { id: 'code2', name: 'UserClass', type: 'class' },
      ],
    };

    const ir2: ArchletteIR = {
      ...createTestIR('System2'),
      code: [
        { id: 'code1', name: 'getUserDuplicate', type: 'function' }, // Duplicate
        { id: 'code3', name: 'deleteUser', type: 'function' },
      ],
    };

    const result = aggregateIRs([ir1, ir2]);

    expect(result.code).toHaveLength(3);
    expect(result.code[0].name).toBe('getUser');
    expect(result.code[1].name).toBe('UserClass');
    expect(result.code[2].name).toBe('deleteUser');
  });

  it('deduplicates deployments by name', () => {
    const ir1: ArchletteIR = {
      ...createTestIR('System1'),
      deployments: [{ name: 'Production', nodes: [] }],
    };

    const ir2: ArchletteIR = {
      ...createTestIR('System2'),
      deployments: [
        { name: 'Production', nodes: [] }, // Duplicate
        { name: 'Staging', nodes: [] },
      ],
    };

    const result = aggregateIRs([ir1, ir2]);

    expect(result.deployments).toHaveLength(2);
    expect(result.deployments[0].name).toBe('Production');
    expect(result.deployments[1].name).toBe('Staging');
  });

  it('deduplicates relationships by source+destination+stereotype', () => {
    const ir1: ArchletteIR = {
      ...createTestIR('System1'),
      containerRelationships: [
        { source: 'c1', destination: 'c2', stereotype: 'uses' },
        { source: 'c1', destination: 'c3' },
      ],
    };

    const ir2: ArchletteIR = {
      ...createTestIR('System2'),
      containerRelationships: [
        { source: 'c1', destination: 'c2', stereotype: 'uses' }, // Exact duplicate
        { source: 'c1', destination: 'c2', stereotype: 'depends' }, // Different stereotype
        { source: 'c2', destination: 'c3' },
      ],
    };

    const result = aggregateIRs([ir1, ir2]);

    expect(result.containerRelationships).toHaveLength(4);
  });

  it('handles relationships with undefined stereotypes', () => {
    const ir1: ArchletteIR = {
      ...createTestIR('System1'),
      codeRelationships: [
        { source: 'f1', destination: 'f2' }, // No stereotype
      ],
    };

    const ir2: ArchletteIR = {
      ...createTestIR('System2'),
      codeRelationships: [
        { source: 'f1', destination: 'f2' }, // Same, no stereotype - duplicate
        { source: 'f1', destination: 'f2', stereotype: 'calls' }, // With stereotype - not duplicate
      ],
    };

    const result = aggregateIRs([ir1, ir2]);

    expect(result.codeRelationships).toHaveLength(2);
  });

  it('aggregates complex multi-extractor scenario', () => {
    // Code extractor finds functions and classes
    const codeIR: ArchletteIR = {
      ...createTestIR('MyApp'),
      components: [
        { id: 'comp.api', containerId: 'api', name: 'API Module', type: 'module' },
      ],
      code: [
        {
          id: 'fn.getUser',
          componentId: 'comp.api',
          name: 'getUser',
          type: 'function',
        },
        { id: 'class.User', componentId: 'comp.api', name: 'User', type: 'class' },
      ],
      codeRelationships: [
        { source: 'fn.getUser', destination: 'class.User', stereotype: 'instantiates' },
      ],
    };

    // IaC extractor finds containers and deployments
    const iacIR: ArchletteIR = {
      ...createTestIR('MyApp Infrastructure'),
      containers: [
        {
          id: 'api',
          name: 'API Service',
          type: 'Cloudflare Worker',
          layer: 'Application',
        },
        { id: 'db', name: 'Database', type: 'PostgreSQL', layer: 'Data' },
      ],
      deployments: [{ name: 'Production', nodes: [] }],
      containerRelationships: [
        { source: 'api', destination: 'db', protocol: 'postgresql' },
      ],
    };

    const result = aggregateIRs([codeIR, iacIR]);

    // Should combine everything
    expect(result.system.name).toBe('MyApp'); // First system wins
    expect(result.containers).toHaveLength(2);
    expect(result.components).toHaveLength(1);
    expect(result.code).toHaveLength(2);
    expect(result.deployments).toHaveLength(1);
    expect(result.containerRelationships).toHaveLength(1);
    expect(result.codeRelationships).toHaveLength(1);
  });
});
