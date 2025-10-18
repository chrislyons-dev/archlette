import { describe, it, expect } from 'vitest';
import { zArchletteIR, zRelationship, type ArchletteIR } from '../../src/core/types-ir';

function minimalIR(): ArchletteIR {
  return {
    version: '1.0.0',
    system: {
      name: 'Archlette Demo',
      repository: 'org/repo',
      tags: ['demo'],
      props: { tier: 'gold', cost: 5, enabled: true, note: null },
    },
    actors: [
      {
        id: 'actor:ext-system',
        name: 'External System',
        type: 'system',
        relationshipStereotypes: [{ name: 'uses' }],
        targets: [], // defaults to system semantically, optional here
      },
    ],
    containers: [
      {
        id: 'ctr:web',
        name: 'Web SPA',
        type: 's3-spa',
        layer: 'ui',
        tags: ['ui'],
        props: { public: true },
      },
      {
        id: 'ctr:api',
        name: 'API',
        type: 'cloudflare-worker',
        layer: 'business-logic',
      },
    ],
    components: [
      {
        id: 'cmp:api.routes',
        containerId: 'ctr:api',
        name: 'Routes',
        type: 'module',
      },
    ],
    code: [
      {
        id: 'code:getHealth',
        componentId: 'cmp:api.routes',
        name: 'getHealth',
        type: 'function',
        returnType: 'Promise<Response>',
        parameters: [
          { name: 'req', type: 'Request', optional: false },
          { name: 'ctx', type: 'Env', optional: true, visibility: 'public' },
        ],
        tags: ['endpoint'],
      },
    ],
    deployments: [
      {
        name: 'dev',
        nodes: [
          {
            id: 'node:edge-1',
            name: 'Edge PoP',
            type: 'edge-location',
            technology: 'Cloudflare',
            containers: [{ id: 'ctr:api' }],
          },
        ],
        tags: ['dev'],
        props: { region: 'global' },
      },
    ],
    containerRelationships: [
      {
        source: 'ctr:web',
        destination: 'ctr:api',
        protocol: 'HTTPS',
        auth: 'JWT',
        stereotype: 'uses',
      },
    ],
    componentRelationships: [],
    codeRelationships: [],
  };
}

describe('types-ir.ts / zod schema', () => {
  it('validates a correct minimal IR', () => {
    const ir = minimalIR();
    const result = zArchletteIR.safeParse(ir);
    expect(result.success).toBe(true);
    if (result.success) {
      // spot-check a few fields survived as-is
      expect(result.data.system.name).toBe('Archlette Demo');
      expect(result.data.containers[0].layer).toBe('ui');
      expect(result.data.deployments[0].nodes?.[0].containers?.[0].id).toBe('ctr:api');
    }
  });

  it('rejects invalid props values (non-scalar)', () => {
    const ir = minimalIR();
    // props allows string | number | boolean | null only
    ir.system.props = { ok: 'yes', notOk: { nested: true } as unknown as string };
    const result = zArchletteIR.safeParse(ir);
    expect(result.success).toBe(false);
    if (!result.success) {
      // ensure the error points at system.props
      expect(
        result.error.issues.some((i) => i.path.join('.').startsWith('system.props')),
      ).toBe(true);
    }
  });

  it('rejects a container missing required fields', () => {
    const ir = minimalIR();
    delete (ir.containers[1] as any).layer;
    const res = zArchletteIR.safeParse(ir);
    expect(res.success).toBe(false);
  });

  it('accepts empty arrays for optional collections but requires them to exist', () => {
    const ir = minimalIR();
    ir.actors = [];
    ir.components = [];
    ir.code = [];
    ir.deployments = [];
    ir.containerRelationships = [];
    ir.componentRelationships = [];
    ir.codeRelationships = [];

    const res = zArchletteIR.safeParse(ir);
    expect(res.success).toBe(true);
  });

  it('validates fragments via .partial() during extraction', () => {
    const fragment = {
      containers: [{ id: 'ctr:db', name: 'DB', type: 'postgres', layer: 'data' }],
    };
    const res = zArchletteIR.partial().safeParse(fragment);
    expect(res.success).toBe(true);
  });

  it('rejects bad relationship objects', () => {
    const badRel = { source: 123, destination: true }; // wrong types
    const relRes = zRelationship.safeParse(badRel);
    expect(relRes.success).toBe(false);
  });

  it('accepts relationship objects with only required fields', () => {
    const rel = { source: 'ctr:A', destination: 'ctr:B' };
    const relRes = zRelationship.safeParse(rel);
    expect(relRes.success).toBe(true);
  });

  it('allows parameters with optional metadata fields', () => {
    const ir = minimalIR();
    ir.code[0].parameters?.push({
      name: 'opts',
      type: 'Record<string, any>',
      optional: true,
      async: false,
      stereotype: 'query',
      visibility: 'public',
    });
    const res = zArchletteIR.safeParse(ir);
    expect(res.success).toBe(true);
  });

  it('accepts deployments without nodes (empty or omitted)', () => {
    const ir = minimalIR();
    ir.deployments = [{ name: 'staging' }];
    const res = zArchletteIR.safeParse(ir);
    expect(res.success).toBe(true);
  });

  it('does not enforce referential integrity (schema-level only)', () => {
    const ir = minimalIR();
    // Point to a non-existent container ID — schema should still pass (business rule checks are separate)
    ir.deployments[0].nodes![0].containers = [{ id: 'ctr:does-not-exist' }];
    const res = zArchletteIR.safeParse(ir);
    expect(res.success).toBe(true);
  });
});
