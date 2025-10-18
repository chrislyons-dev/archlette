/**
 * Tests for extraction stage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { run } from '../../src/1-extract/index.js';
import type { PipelineContext } from '../../src/core/types.js';
import type { ResolvedAACConfig } from '../../src/core/types-aac.js';
import type { ArchletteIR } from '../../src/core/types-ir.js';
import * as stageModuleLoader from '../../src/core/stage-module-loader.js';
import * as pathResolver from '../../src/core/path-resolver.js';
import * as aggregator from '../../src/1-extract/aggregator.js';

// Mock dependencies
vi.mock('../../src/core/stage-module-loader.js');
vi.mock('../../src/core/path-resolver.js');
vi.mock('../../src/1-extract/aggregator.js');

describe('extract stage', () => {
  let mockContext: PipelineContext;
  let mockLogger: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const mockConfig: ResolvedAACConfig = {
      project: { name: 'test-project', props: {} },
      paths: {
        ir_out: 'output/ir.json',
        dsl_out: 'output/workspace.dsl',
        render_out: 'output/render',
        docs_out: 'output/docs',
      },
      defaults: {
        includes: [],
        excludes: [],
        props: {},
      },
      extractors: [],
      validators: [],
      generators: [],
      renderers: [],
      docs: [],
    };

    mockContext = {
      config: mockConfig,
      state: {},
      log: mockLogger,
      configBaseDir: '/cli',
    };

    // Default mocks
    vi.mocked(pathResolver.getCliDir).mockReturnValue('/cli');
    vi.mocked(pathResolver.resolveArchlettePath).mockReturnValue('/resolved/ir.json');
    vi.mocked(pathResolver.writeFile).mockImplementation(() => {});
  });

  it('should handle empty extractors configuration', async () => {
    vi.mocked(aggregator.aggregateIRs).mockReturnValue({
      version: '1.0',
      system: { name: 'Test', description: 'Test system' },
      actors: [],
      containers: [],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    });

    await run(mockContext);

    expect(mockLogger.info).toHaveBeenCalledWith('Extract: building IR…');
    expect(mockContext.state.extractorResults).toEqual([]);
    expect(mockContext.state.aggregatedIR).toBeDefined();
  });

  it('should load and execute extractors successfully', async () => {
    const mockIR: ArchletteIR = {
      version: '1.0',
      system: { name: 'Test', description: 'Test system' },
      actors: [{ id: 'user', name: 'User', type: 'Person', tags: [], targets: [] }],
      containers: [],
      components: [
        {
          id: 'comp1',
          containerId: 'cont1',
          name: 'Component1',
          type: 'module',
        },
      ],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const mockExtractor = vi.fn().mockResolvedValue(mockIR);
    vi.mocked(stageModuleLoader.loadExtractorModule).mockResolvedValue({
      entry: mockExtractor,
      resolved: '/fake/extractor.ts',
    });

    vi.mocked(aggregator.aggregateIRs).mockReturnValue(mockIR);

    mockContext.config.extractors = [
      {
        use: 'builtin/basic-node',
        name: 'test-extractor',
        inputs: { include: ['src/**/*.ts'], exclude: [] },
        props: {},
        _effective: {
          includes: ['src/**/*.ts'],
          excludes: [],
        },
      },
    ];

    await run(mockContext);

    expect(stageModuleLoader.loadExtractorModule).toHaveBeenCalledWith(
      'builtin/basic-node',
    );
    expect(mockExtractor).toHaveBeenCalledWith({
      use: 'builtin/basic-node',
      name: 'test-extractor',
      inputs: { include: ['src/**/*.ts'], exclude: [] },
      props: {},
      _effective: {
        includes: ['src/**/*.ts'],
        excludes: [],
      },
    });
    expect(mockContext.state.extractorResults).toHaveLength(1);
    expect(mockContext.state.aggregatedIR).toBe(mockIR);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Extractor builtin/basic-node completed.',
    );
  });

  it('should validate IR output from extractors', async () => {
    const invalidIR = { invalid: 'data' }; // Not a valid ArchletteIR
    const mockExtractor = vi.fn().mockResolvedValue(invalidIR);

    vi.mocked(stageModuleLoader.loadExtractorModule).mockResolvedValue({
      entry: mockExtractor,
      resolved: '/fake/extractor.ts',
    });

    vi.mocked(aggregator.aggregateIRs).mockReturnValue({
      version: '1.0',
      system: { name: 'Test', description: 'Test system' },
      actors: [],
      containers: [],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    });

    mockContext.config.extractors = [
      {
        use: 'builtin/test-extractor',
        name: 'test',
        inputs: { include: [], exclude: [] },
        props: {},
        _effective: {
          includes: [],
          excludes: [],
        },
      },
    ];

    await run(mockContext);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('produced invalid ArchletteIR'),
      expect.anything(),
    );
    expect(mockContext.state.extractorResults).toHaveLength(0);
  });

  it('should continue processing if one extractor fails', async () => {
    const validIR: ArchletteIR = {
      version: '1.0',
      system: { name: 'Test', description: 'Test system' },
      actors: [],
      containers: [],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const failingExtractor = vi.fn().mockRejectedValue(new Error('Extractor failed'));
    const workingExtractor = vi.fn().mockResolvedValue(validIR);

    vi.mocked(stageModuleLoader.loadExtractorModule)
      .mockResolvedValueOnce({
        entry: failingExtractor,
        resolved: '/fake/failing.ts',
      })
      .mockResolvedValueOnce({
        entry: workingExtractor,
        resolved: '/fake/working.ts',
      });

    vi.mocked(aggregator.aggregateIRs).mockReturnValue(validIR);

    mockContext.config.extractors = [
      {
        use: 'builtin/failing',
        name: 'failing',
        inputs: { include: [], exclude: [] },
        props: {},
        _effective: {
          includes: [],
          excludes: [],
        },
      },
      {
        use: 'builtin/working',
        name: 'working',
        inputs: { include: [], exclude: [] },
        props: {},
        _effective: {
          includes: [],
          excludes: [],
        },
      },
    ];

    await run(mockContext);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Extractor builtin/failing failed:',
      expect.any(Error),
    );
    expect(mockContext.state.extractorResults).toHaveLength(1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Extractor builtin/working completed.',
    );
  });

  it('should write aggregated IR to disk', async () => {
    const mockIR: ArchletteIR = {
      version: '1.0',
      system: { name: 'Test', description: 'Test system' },
      actors: [],
      containers: [],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    vi.mocked(aggregator.aggregateIRs).mockReturnValue(mockIR);

    await run(mockContext);

    expect(pathResolver.resolveArchlettePath).toHaveBeenCalledWith('output/ir.json', {
      cliDir: '/cli',
    });
    expect(pathResolver.writeFile).toHaveBeenCalledWith(
      '/resolved/ir.json',
      JSON.stringify(mockIR, null, 2),
    );
  });

  it('should aggregate multiple extractor results', async () => {
    const ir1: ArchletteIR = {
      version: '1.0',
      system: { name: 'System1', description: 'First system' },
      actors: [],
      containers: [],
      components: [
        { id: 'comp1', containerId: 'cont1', name: 'Comp1', type: 'module' },
      ],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const ir2: ArchletteIR = {
      version: '1.0',
      system: { name: 'System2', description: 'Second system' },
      actors: [],
      containers: [],
      components: [
        { id: 'comp2', containerId: 'cont1', name: 'Comp2', type: 'module' },
      ],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const aggregatedIR: ArchletteIR = {
      version: '1.0',
      system: { name: 'System1', description: 'First system' },
      actors: [],
      containers: [],
      components: [
        { id: 'comp1', containerId: 'cont1', name: 'Comp1', type: 'module' },
        { id: 'comp2', containerId: 'cont1', name: 'Comp2', type: 'module' },
      ],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    vi.mocked(stageModuleLoader.loadExtractorModule)
      .mockResolvedValueOnce({
        entry: vi.fn().mockResolvedValue(ir1),
        resolved: '/fake/ext1.ts',
      })
      .mockResolvedValueOnce({
        entry: vi.fn().mockResolvedValue(ir2),
        resolved: '/fake/ext2.ts',
      });

    vi.mocked(aggregator.aggregateIRs).mockReturnValue(aggregatedIR);

    mockContext.config.extractors = [
      {
        use: 'ext1',
        name: 'ext1',
        inputs: { include: [], exclude: [] },
        props: {},
        _effective: { includes: [], excludes: [] },
      },
      {
        use: 'ext2',
        name: 'ext2',
        inputs: { include: [], exclude: [] },
        props: {},
        _effective: { includes: [], excludes: [] },
      },
    ];

    await run(mockContext);

    expect(aggregator.aggregateIRs).toHaveBeenCalledWith([ir1, ir2]);
    expect(mockContext.state.extractorResults).toEqual([ir1, ir2]);
    expect(mockContext.state.aggregatedIR).toBe(aggregatedIR);
  });
});
