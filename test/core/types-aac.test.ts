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
    extractors: [
      {
        use: 'extractors/builtin/basic-node',
        name: 'Basic Code Scan',
        props: { mode: 'ast' },
      },
    ],
    validators: [{ use: 'validators/builtin/schema' }],
    generators: [{ use: 'generators/builtin/structurizr' }],
    renderers: [{ use: 'renderers/builtin/structurizr-cli' }],
    docs: [{ use: 'docs/builtin/index' }],
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
    expect(parsed.extractors[0].props).toEqual({ mode: 'ast' });
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
      extractors: [
        {
          use: 'x',
          props: {},
          includes: ['src/**'],
          excludes: [],
          extra: 'nope',
        },
      ],
    });
    const parsed = AACConfigSchema.parse(raw);
    expect((parsed.project as any).unknownKey).toBeUndefined();
    expect((parsed.extractors[0] as any).extra).toBeUndefined();
  });
});

describe('resolveConfig()', () => {
  it('inherits includes/excludes from defaults if not set on node', () => {
    const raw = baseRaw({
      extractors: [{ use: 'extractors/builtin/basic-node' }],
    });
    const resolved = resolveConfig(raw);
    expect(resolved.extractors[0]._effective.includes).toEqual(['**/*']);
    expect(resolved.extractors[0]._effective.excludes).toEqual([
      'node_modules/**',
      '.git/**',
    ]);
  });

  it('applies node-level overrides when provided', () => {
    const raw = baseRaw({
      extractors: [
        {
          use: 'extractors/builtin/basic-node',
          includes: ['src/core/**'],
          excludes: ['**/*.spec.ts'],
        },
      ],
    });
    const resolved = resolveConfig(raw);
    const node = resolved.extractors[0];
    expect(node._effective.includes).toEqual(['src/core/**']);
    expect(node._effective.excludes).toEqual(['**/*.spec.ts']);
  });

  it('defaults node name to empty string and props to {} if omitted', () => {
    const raw = baseRaw({
      extractors: [{ use: 'extractors/builtin/basic-node' }],
    });
    const resolved = resolveConfig(raw);
    const node = resolved.extractors[0];
    expect(node.name).toBe('');
    expect(node.props).toEqual({});
  });

  it('keeps props as arbitrary name/value pairs', () => {
    const raw = baseRaw({
      extractors: [
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
    });
    const resolved = resolveConfig(raw);
    expect(resolved.extractors[0].props).toEqual({
      mode: 'ast',
      retries: 2,
      flags: { a: true },
      list: [1, 'x', null],
    });
  });

  it('handles empty stage gracefully (defaults applied)', () => {
    const raw = baseRaw({
      validators: [], // completely empty stage config
    });
    const resolved = resolveConfig(raw);
    expect(resolved.validators).toHaveLength(0);
  });

  it('does not treat empty arrays as explicit overrides (inherits instead)', () => {
    const raw = baseRaw({
      extractors: [
        { use: 'extractors/builtin/basic-node', includes: [], excludes: [] },
      ],
    });
    const resolved = resolveConfig(raw);
    expect(resolved.extractors[0]._effective.includes).toEqual(['**/*']);
    expect(resolved.extractors[0]._effective.excludes).toEqual([
      'node_modules/**',
      '.git/**',
    ]);
  });

  it('throws on invalid structure (e.g., non-string include)', () => {
    const raw = baseRaw({
      extractors: [{ use: 'extractors/builtin/basic-node', includes: [42] }],
    });
    expect(() => resolveConfig(raw)).toThrow();
  });
});
