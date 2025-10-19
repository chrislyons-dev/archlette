/**
 * Unit tests for base IR validator
 */
import { describe, it, expect } from 'vitest';
import baseValidator from '../../../src/validators/builtin/base-validator.ts';
import { type ArchletteIR } from '../../../src/core/types-ir.ts';

describe('baseValidator', () => {
  it('passes valid IR', () => {
    // Minimal valid IR
    const validIR: ArchletteIR = {
      version: '1.0',
      system: { name: 'Test', description: 'desc' },
      actors: [],
      containers: [],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
      deploymentRelationships: [],
    };
    expect(() => baseValidator(validIR)).not.toThrow();
    expect(baseValidator(validIR)).toBe(validIR);
  });

  it('throws on missing required fields', () => {
    // Intentionally invalid: missing required fields
    const invalidIR = { version: '1.0' } as unknown as ArchletteIR;
    expect(() => baseValidator(invalidIR)).toThrow(/ArchletteIR validation failed/);
  });

  it('throws on invalid field types', () => {
    // Intentionally invalid: wrong types
    const invalidIR = {
      version: 123,
      system: { name: 42 },
      actors: 'not-an-array',
      containers: [],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
      deploymentRelationships: [],
    } as unknown as ArchletteIR;
    expect(() => baseValidator(invalidIR)).toThrow(/ArchletteIR validation failed/);
  });
});
