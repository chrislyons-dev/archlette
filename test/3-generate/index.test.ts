/**
 * Tests for generation stage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { run } from '../../src/3-generate/index.js';
import type { PipelineContext } from '../../src/core/types.js';
import type { ResolvedAACConfig } from '../../src/core/types-aac.js';
import type { ArchletteIR } from '../../src/core/types-ir.js';
import * as stageModuleLoader from '../../src/core/stage-module-loader.js';
import * as pathResolver from '../../src/core/path-resolver.js';

// Mock dependencies
vi.mock('../../src/core/stage-module-loader.js');
vi.mock('../../src/core/path-resolver.js');

describe('generate stage', () => {
  let mockContext: PipelineContext;
  let mockLogger: any;
  let mockIR: ArchletteIR;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    mockIR = {
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
      state: { validatedIR: mockIR },
      log: mockLogger,
      configBaseDir: '/cli',
    };

    // Default mocks
    vi.mocked(pathResolver.getCliDir).mockReturnValue('/cli');
    vi.mocked(pathResolver.resolveArchlettePath).mockReturnValue(
      '/resolved/workspace.dsl',
    );
    vi.mocked(pathResolver.writeFile).mockImplementation(() => {});
  });

  it('should throw error if IR is missing', async () => {
    mockContext.state.validatedIR = undefined;
    mockContext.state.aggregatedIR = undefined;

    await expect(run(mockContext)).rejects.toThrow('Missing IR');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        'Missing IR - extraction stage must run before generation',
      ),
    );
  });

  it('should use aggregated IR if validated IR is not available', async () => {
    mockContext.state.validatedIR = undefined;
    mockContext.state.aggregatedIR = mockIR;

    const dslContent = 'workspace { model {} }';
    const mockGenerator = vi.fn().mockResolvedValue(dslContent);

    vi.mocked(stageModuleLoader.loadGeneratorModule).mockResolvedValue({
      entry: mockGenerator,
      resolved: '/fake/generator.ts',
    });

    mockContext.config.generators = [
      {
        use: 'builtin/structurizr',
        name: 'test-gen',
        props: {},
        _effective: { includes: [], excludes: [] },
      },
    ];

    await run(mockContext);

    expect(mockGenerator).toHaveBeenCalledWith(mockIR, expect.any(Object));
    expect(mockContext.state.generatorOutputs).toHaveLength(1);
  });

  it('should handle empty generators configuration', async () => {
    await run(mockContext);

    expect(mockLogger.info).toHaveBeenCalledWith('Generate: transforming IR to DSL…');
    expect(mockContext.state.generatorOutputs).toEqual([]);
    expect(pathResolver.writeFile).not.toHaveBeenCalled();
  });

  it('should load and execute generators successfully', async () => {
    const dslContent = 'workspace "Test" { model { softwareSystem "System" } }';
    const mockGenerator = vi.fn().mockResolvedValue(dslContent);

    vi.mocked(stageModuleLoader.loadGeneratorModule).mockResolvedValue({
      entry: mockGenerator,
      resolved: '/fake/structurizr.ts',
    });

    mockContext.config.generators = [
      {
        use: 'builtin/structurizr',
        name: 'structurizr-gen',
        props: {},
        _effective: { includes: [], excludes: [] },
      },
    ];

    await run(mockContext);

    expect(stageModuleLoader.loadGeneratorModule).toHaveBeenCalledWith(
      'builtin/structurizr',
    );
    expect(mockGenerator).toHaveBeenCalledWith(
      mockIR,
      expect.objectContaining({
        use: 'builtin/structurizr',
        name: 'structurizr-gen',
      }),
    );
    expect(mockContext.state.generatorOutputs).toHaveLength(1);
    expect(mockContext.state.generatorOutputs?.[0]).toEqual({
      name: 'structurizr-gen',
      content: dslContent,
      format: 'structurizr',
    });
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Generator builtin/structurizr completed.',
    );
  });

  it('should determine generator format from name', async () => {
    const generators = [
      { use: 'builtin/structurizr', expectedFormat: 'structurizr' },
      { use: 'builtin/plantuml', expectedFormat: 'plantuml' },
      { use: 'builtin/mermaid', expectedFormat: 'mermaid' },
      { use: 'custom/generator', expectedFormat: 'unknown' },
    ];

    for (const { use, expectedFormat } of generators) {
      vi.clearAllMocks();

      const mockGenerator = vi.fn().mockResolvedValue('test content');
      vi.mocked(stageModuleLoader.loadGeneratorModule).mockResolvedValue({
        entry: mockGenerator,
        resolved: '/fake/gen.ts',
      });

      mockContext.config.generators = [
        {
          use,
          name: 'test',
          props: {},
          _effective: { includes: [], excludes: [] },
        },
      ];

      await run(mockContext);

      expect(mockContext.state.generatorOutputs?.[0].format).toBe(expectedFormat);
    }
  });

  it('should write single generator output to DSL file', async () => {
    const dslContent = 'workspace { model {} }';
    const mockGenerator = vi.fn().mockResolvedValue(dslContent);

    vi.mocked(stageModuleLoader.loadGeneratorModule).mockResolvedValue({
      entry: mockGenerator,
      resolved: '/fake/generator.ts',
    });

    mockContext.config.generators = [
      {
        use: 'builtin/structurizr',
        name: 'structurizr',
        props: {},
        _effective: { includes: [], excludes: [] },
      },
    ];

    await run(mockContext);

    expect(pathResolver.resolveArchlettePath).toHaveBeenCalledWith(
      'output/workspace.dsl',
      {
        cliDir: '/cli',
      },
    );
    expect(pathResolver.writeFile).toHaveBeenCalledWith(
      '/resolved/workspace.dsl',
      dslContent,
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      '✓ Wrote DSL output to /resolved/workspace.dsl',
    );
  });

  it('should concatenate multiple generator outputs', async () => {
    const dsl1 = 'workspace { model { softwareSystem "S1" } }';
    const dsl2 = 'workspace { model { softwareSystem "S2" } }';

    const gen1 = vi.fn().mockResolvedValue(dsl1);
    const gen2 = vi.fn().mockResolvedValue(dsl2);

    vi.mocked(stageModuleLoader.loadGeneratorModule)
      .mockResolvedValueOnce({ entry: gen1, resolved: '/fake/gen1.ts' })
      .mockResolvedValueOnce({ entry: gen2, resolved: '/fake/gen2.ts' });

    mockContext.config.generators = [
      {
        use: 'generator1',
        name: 'gen1',
        props: {},
        _effective: { includes: [], excludes: [] },
      },
      {
        use: 'generator2',
        name: 'gen2',
        props: {},
        _effective: { includes: [], excludes: [] },
      },
    ];

    await run(mockContext);

    const expectedContent = `# Generated by gen1\n\n${dsl1}\n\n# Generated by gen2\n\n${dsl2}`;
    expect(pathResolver.writeFile).toHaveBeenCalledWith(
      '/resolved/workspace.dsl',
      expectedContent,
    );
    expect(mockContext.state.generatorOutputs).toHaveLength(2);
  });

  it('should throw error if generator fails', async () => {
    const generatorError = new Error('Generator failed: invalid IR structure');
    const failingGenerator = vi.fn().mockRejectedValue(generatorError);

    vi.mocked(stageModuleLoader.loadGeneratorModule).mockResolvedValue({
      entry: failingGenerator,
      resolved: '/fake/failing.ts',
    });

    mockContext.config.generators = [
      {
        use: 'builtin/failing',
        name: 'failing',
        props: {},
        _effective: { includes: [], excludes: [] },
      },
    ];

    await expect(run(mockContext)).rejects.toThrow(
      'Generator failed: invalid IR structure',
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Generator builtin/failing failed:',
      generatorError,
    );
  });

  it('should handle DSL write errors', async () => {
    const dslContent = 'workspace {}';
    const mockGenerator = vi.fn().mockResolvedValue(dslContent);

    vi.mocked(stageModuleLoader.loadGeneratorModule).mockResolvedValue({
      entry: mockGenerator,
      resolved: '/fake/gen.ts',
    });

    const writeError = new Error('EACCES: permission denied');
    vi.mocked(pathResolver.writeFile).mockImplementation(() => {
      throw writeError;
    });

    mockContext.config.generators = [
      {
        use: 'builtin/structurizr',
        name: 'test',
        props: {},
        _effective: { includes: [], excludes: [] },
      },
    ];

    await expect(run(mockContext)).rejects.toThrow('EACCES: permission denied');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to write DSL output to output/workspace.dsl:',
      writeError,
    );
  });

  it('should provide improved error messages for missing IR', async () => {
    mockContext.state.validatedIR = undefined;
    mockContext.state.aggregatedIR = undefined;

    await expect(run(mockContext)).rejects.toThrow('Missing IR');

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('extraction stage must run before generation'),
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        'Ensure your config includes extractors and validators before generators',
      ),
    );
  });
});
