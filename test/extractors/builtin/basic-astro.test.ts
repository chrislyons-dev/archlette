/**
 * Basic smoke tests for basic-astro extractor
 * These tests verify the scaffold works without testing unimplemented functionality
 */

import { describe, it, expect } from 'vitest';
import basicAstroExtractor from '../../../src/extractors/builtin/basic-astro.js';
import { ROOT_COMPONENT_MARKER } from '../../../src/extractors/builtin/basic-astro/component-detector.js';
import type { ResolvedStageNode } from '../../../src/core/types-aac.js';
import type { PipelineContext } from '../../../src/core/types.js';
import { createLogger } from '../../../src/core/logger.js';

describe('basic-astro extractor - smoke tests', () => {
  const mockContext: PipelineContext = {
    log: createLogger({ context: 'Test', level: 'silent' }),
    config: {} as any,
    state: {},
    configBaseDir: process.cwd(),
  };

  it('should export the extractor function', () => {
    expect(basicAstroExtractor).toBeDefined();
    expect(typeof basicAstroExtractor).toBe('function');
  });

  it('should return a valid ArchletteIR structure', async () => {
    const node: ResolvedStageNode = {
      use: 'builtin/basic-astro',
      name: 'test-extractor',
      props: {},
      inputs: {
        include: ['**/*.astro'],
        exclude: ['**/node_modules/**'],
      },
    };

    const result = await basicAstroExtractor(node, mockContext);

    // Verify IR structure exists with expected properties
    expect(result).toBeDefined();
    expect(result.version).toBe('1.0');
    expect(result.system).toBeDefined();
    expect(result.actors).toBeInstanceOf(Array);
    expect(result.containers).toBeInstanceOf(Array);
    expect(result.components).toBeInstanceOf(Array);
    expect(result.code).toBeInstanceOf(Array);
    expect(result.componentRelationships).toBeInstanceOf(Array);
  });

  it('should handle empty inputs gracefully', async () => {
    const node: ResolvedStageNode = {
      use: 'builtin/basic-astro',
      name: 'test-extractor',
      props: {},
      inputs: {},
    };

    const result = await basicAstroExtractor(node, mockContext);

    // Should not throw, should return valid IR
    expect(result).toBeDefined();
    expect(result.version).toBe('1.0');
  });

  it('should export ROOT_COMPONENT_MARKER constant', () => {
    expect(ROOT_COMPONENT_MARKER).toBeDefined();
    expect(typeof ROOT_COMPONENT_MARKER).toBe('string');
    expect(ROOT_COMPONENT_MARKER).toBe('__USE_CONTAINER_NAME__');
  });
});
