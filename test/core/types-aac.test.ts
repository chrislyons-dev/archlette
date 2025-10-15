import { describe, it, expect } from 'vitest';
import { AACConfigSchema, resolveConfig } from '../../src/core/types-aac';

function baseRaw(overrides: Partial<any> = {}) {
  return {
    project: { name: 'Archlette', props: { owner: 'platform' } },
    paths: {
      ir_out: '../docs/architecture/aac-ir.json',
      dsl_out: '../docs/architecture/aac.dsl',
      render_out: '../docs/architecture/images',
      docs_out: '../docs/architecture',
    },
    defaults: {
      includes: ['**/*'],
      excludes: ['node_modules/**', '.git/**'],
      props: { ci: true },
    },
    extractors: {
      includes: ['src/**/*.{ts,tsx}'],
      excludes: ['**/*.test.*'],
      nodes: [
        {
          use: 'extractors/builtin/basic-node',
          name: 'Basic Code Scan',
          props: { mode: 'ast' },
        },
      ],
    },
    validators: { nodes: [{ use: 'validators/builtin/schema' }] },
    generators: { nodes: [{ use: 'generators/builtin/structurizr' }] },
    renderers: { nodes: [{ use: 'renderers/builtin/structurizr-cli' }] },
    docs: { nodes: [{ use: 'docs/builtin/index' }] },
    ...overrides,
  };
}

describe('AACConfigSchema', () => {
  it('parses a valid config and preserves props', () => {
    const parsed = AACConfigSchema.parse(baseRaw());
    expect(parsed.project.name).toBe('Archlette');
    expect(parsed.project.props).toEqual({ owner: 'platform' });
    expect(parsed.paths.ir_out).toMatch(/aac-ir.json$/);
    // defaults and stage presence
    expect(parsed.defaults.includes).toContain('**/*');
    expect(parsed.extractors.nodes[0].props).toEqual({ mode: 'ast' });
  });

  it('applies field-level defaults when optional fields are omitted', () => {
    const raw = baseRaw({
      project: { name: 'Archlette' }, // omit props
      defaults: { includes: ['**/*'], excludes: ['node_modules/**'] }, // omit props
    });
    const parsed = AACConfigSchema.parse(raw);
    expect(parsed.project.props).toEqual({}); // default({})
    expect(parsed.defaults.props).toEqual({}); // default({})
  });

  it('rejects missing required fields', () => {
    const bad = { ...baseRaw(), project: { name: '' } }; // invalid name
    expect(() => AACConfigSchema.parse(bad)).toThrow();
  });

  it('strips unknown keys by default', () => {
    const raw = baseRaw({
      project: { name: 'Archlette', props: {}, unknownKey: 123 },
      extractors: {
        nodes: [
          {
            use: 'x',
            props: {},
            includes: ['src/**'],
            excludes: [],
            extra: 'nope',
          },
        ],
      },
    });
    const parsed = AACConfigSchema.parse(raw);
    expect((parsed.project as any).unknownKey).toBeUndefined();
    expect((parsed.extractors.nodes[0] as any).extra).toBeUndefined();
  });
});

describe('resolveConfig()', () => {
  it('inherits stage includes/excludes from stage first, then defaults', () => {
    const raw = baseRaw({
      // remove stage includes to force inherit from defaults
      extractors: {
        nodes: [{ use: 'extractors/builtin/basic-node' }],
      },
    });
    const resolved = resolveConfig(raw);
    // Stage-level arrays empty → inherit from defaults
    expect(resolved.extractors.includes).toEqual(['**/*']);
    expect(resolved.extractors.excludes).toEqual(['node_modules/**', '.git/**']);
    // Node inherits effective includes/excludes from stage
    expect(resolved.extractors.nodes[0]._effective.includes).toEqual(['**/*']);
    expect(resolved.extractors.nodes[0]._effective.excludes).toEqual([
      'node_modules/**',
      '.git/**',
    ]);
  });

  it('uses stage overrides when provided', () => {
    const raw = baseRaw({
      extractors: {
        includes: ['src/**/*.ts'],
        excludes: ['**/*.test.ts'],
        nodes: [{ use: 'extractors/builtin/basic-node' }],
      },
    });
    const resolved = resolveConfig(raw);
    expect(resolved.extractors.includes).toEqual(['src/**/*.ts']);
    expect(resolved.extractors.excludes).toEqual(['**/*.test.ts']);
    // Node inherits those
    expect(resolved.extractors.nodes[0]._effective.includes).toEqual(['src/**/*.ts']);
    expect(resolved.extractors.nodes[0]._effective.excludes).toEqual(['**/*.test.ts']);
  });

  it('applies node-level overrides when provided', () => {
    const raw = baseRaw({
      extractors: {
        includes: ['src/**/*.ts'],
        excludes: ['**/*.test.ts'],
        nodes: [
          {
            use: 'extractors/builtin/basic-node',
            includes: ['src/core/**'],
            excludes: ['**/*.spec.ts'],
          },
        ],
      },
    });
    const resolved = resolveConfig(raw);
    const node = resolved.extractors.nodes[0];
    // Node overrides replace stage patterns
    expect(node._effective.includes).toEqual(['src/core/**']);
    expect(node._effective.excludes).toEqual(['**/*.spec.ts']);
  });

  it('defaults node name to empty string and props to {} if omitted', () => {
    const raw = baseRaw({
      extractors: {
        nodes: [{ use: 'extractors/builtin/basic-node' }],
      },
    });
    const resolved = resolveConfig(raw);
    const node = resolved.extractors.nodes[0];
    expect(node.name).toBe(''); // default
    expect(node.props).toEqual({}); // default({})
  });

  it('keeps props as arbitrary name/value pairs', () => {
    const raw = baseRaw({
      extractors: {
        nodes: [
          {
            use: 'extractors/builtin/basic-node',
            props: {
              mode: 'ast',
              retries: 2,
              flags: { a: true },
              list: [1, 'x', null],
            },
          },
        ],
      },
    });
    const resolved = resolveConfig(raw);
    expect(resolved.extractors.nodes[0].props).toEqual({
      mode: 'ast',
      retries: 2,
      flags: { a: true },
      list: [1, 'x', null],
    });
  });

  it('handles empty stage gracefully (defaults applied)', () => {
    const raw = baseRaw({
      validators: {}, // completely empty stage config
    });
    const resolved = resolveConfig(raw);
    expect(resolved.validators.includes).toEqual(['**/*']);
    expect(resolved.validators.excludes).toEqual(['node_modules/**', '.git/**']);
    expect(resolved.validators.nodes).toHaveLength(0);
  });

  it('does not treat empty arrays as explicit overrides (inherits instead)', () => {
    // With current logic, empty arrays mean "inherit"
    const raw = baseRaw({
      extractors: {
        includes: [], // intended inherit
        excludes: [],
        nodes: [{ use: 'extractors/builtin/basic-node', includes: [], excludes: [] }],
      },
    });
    const resolved = resolveConfig(raw);
    expect(resolved.extractors.includes).toEqual(['**/*']); // inherited
    expect(resolved.extractors.excludes).toEqual(['node_modules/**', '.git/**']); // inherited
    // Node also inherits from resolved stage
    expect(resolved.extractors.nodes[0]._effective.includes).toEqual(['**/*']);
    expect(resolved.extractors.nodes[0]._effective.excludes).toEqual([
      'node_modules/**',
      '.git/**',
    ]);
  });

  it('throws on invalid structure (e.g., non-string include)', () => {
    const raw = baseRaw({
      extractors: {
        includes: [42], // invalid
        nodes: [{ use: 'extractors/builtin/basic-node' }],
      },
    });
    expect(() => resolveConfig(raw)).toThrow();
  });
});
