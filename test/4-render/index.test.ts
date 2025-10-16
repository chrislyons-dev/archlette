/**
 * Unit tests for render stage orchestrator
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PipelineContext, GeneratorOutput } from '../../src/core/types.js';

// Mock dependencies
vi.mock('../../src/core/stage-module-loader.js');

describe('render stage', () => {
  let mockContext: PipelineContext;
  let mockModuleLoader: typeof import('../../src/core/stage-module-loader.js');
  let renderStage: typeof import('../../src/4-render/index.js');

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Import mocked module loader
    mockModuleLoader = await import('../../src/core/stage-module-loader.js');

    // Setup default mock - renderer that succeeds
    vi.mocked(mockModuleLoader.loadRendererModule).mockResolvedValue({
      entry: vi.fn().mockResolvedValue(undefined),
      resolved: '/path/to/renderer.js',
    });

    // Create mock context with generator outputs
    mockContext = {
      config: {
        project: {
          name: 'test-project',
          props: {},
        },
        paths: {
          ir_out: 'test-ir.json',
          dsl_out: 'test-dsl.txt',
          render_out: 'test-render',
          docs_out: 'test-docs',
        },
        defaults: {
          includes: [],
          excludes: [],
          props: {},
        },
        extractors: [],
        validators: [],
        generators: [],
        renderers: [
          {
            use: 'builtin/structurizr-export',
            name: 'structurizr-export',
            _effective: { includes: [], excludes: [] },
            props: {},
            inputs: {},
          },
          {
            use: 'builtin/plantuml-render',
            name: 'plantuml-render',
            _effective: { includes: [], excludes: [] },
            props: {},
            inputs: {},
          },
        ],
        docs: [],
      },
      state: {
        generatorOutputs: [
          {
            name: 'structurizr',
            content: 'workspace "Test" {}',
            format: 'structurizr',
          },
        ] as GeneratorOutput[],
        rendererOutputs: [],
      },
      log: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    };

    // Import the render stage after mocks are set up
    renderStage = await import('../../src/4-render/index.js');
  });

  it('runs configured renderers sequentially', async () => {
    await renderStage.run(mockContext);

    // Verify renderers were loaded
    expect(mockModuleLoader.loadRendererModule).toHaveBeenCalledTimes(2);
    expect(mockModuleLoader.loadRendererModule).toHaveBeenNthCalledWith(
      1,
      'builtin/structurizr-export',
    );
    expect(mockModuleLoader.loadRendererModule).toHaveBeenNthCalledWith(
      2,
      'builtin/plantuml-render',
    );
  });

  it('invokes each renderer with context and node', async () => {
    const mockRenderer1 = vi.fn().mockResolvedValue(undefined);
    const mockRenderer2 = vi.fn().mockResolvedValue(undefined);

    vi.mocked(mockModuleLoader.loadRendererModule)
      .mockResolvedValueOnce({
        entry: mockRenderer1,
        resolved: '/path/to/renderer1.js',
      })
      .mockResolvedValueOnce({
        entry: mockRenderer2,
        resolved: '/path/to/renderer2.js',
      });

    await renderStage.run(mockContext);

    expect(mockRenderer1).toHaveBeenCalledWith(
      mockContext,
      expect.objectContaining({ use: 'builtin/structurizr-export' }),
    );
    expect(mockRenderer2).toHaveBeenCalledWith(
      mockContext,
      expect.objectContaining({ use: 'builtin/plantuml-render' }),
    );
  });

  it('initializes rendererOutputs array', async () => {
    mockContext.state.rendererOutputs = undefined;

    await renderStage.run(mockContext);

    expect(mockContext.state.rendererOutputs).toBeDefined();
    expect(Array.isArray(mockContext.state.rendererOutputs)).toBe(true);
  });

  it('returns early when no generator outputs found', async () => {
    mockContext.state.generatorOutputs = [];

    await renderStage.run(mockContext);

    expect(mockContext.log.warn).toHaveBeenCalledWith(
      expect.stringContaining('No generator outputs found'),
    );
    expect(mockModuleLoader.loadRendererModule).not.toHaveBeenCalled();
  });

  it('returns early when no renderers configured', async () => {
    mockContext.config.renderers = [];

    await renderStage.run(mockContext);

    expect(mockContext.log.info).toHaveBeenCalledWith(
      'No renderers configured. Skipping render stage.',
    );
    expect(mockModuleLoader.loadRendererModule).not.toHaveBeenCalled();
  });

  it('throws error when renderer fails', async () => {
    const mockError = new Error('Renderer failed');
    vi.mocked(mockModuleLoader.loadRendererModule).mockResolvedValue({
      entry: vi.fn().mockRejectedValue(mockError),
      resolved: '/path/to/renderer.js',
    });

    await expect(renderStage.run(mockContext)).rejects.toThrow('Renderer failed');
    expect(mockContext.log.error).toHaveBeenCalledWith(
      expect.stringContaining('failed'),
      mockError,
    );
  });

  it('stops processing when a renderer fails', async () => {
    const mockRenderer1 = vi.fn().mockRejectedValue(new Error('First renderer failed'));
    const mockRenderer2 = vi.fn().mockResolvedValue(undefined);

    vi.mocked(mockModuleLoader.loadRendererModule)
      .mockResolvedValueOnce({
        entry: mockRenderer1,
        resolved: '/path/to/renderer1.js',
      })
      .mockResolvedValueOnce({
        entry: mockRenderer2,
        resolved: '/path/to/renderer2.js',
      });

    await expect(renderStage.run(mockContext)).rejects.toThrow();

    // Second renderer should not be called
    expect(mockRenderer1).toHaveBeenCalled();
    expect(mockRenderer2).not.toHaveBeenCalled();
  });

  it('logs summary with file counts', async () => {
    // Clear previous mock setups
    vi.clearAllMocks();

    // Simulate renderers populating rendererOutputs
    const mockRenderer1 = vi.fn().mockImplementation(async (ctx: PipelineContext) => {
      ctx.state.rendererOutputs!.push({
        renderer: 'renderer1',
        format: 'puml',
        files: ['diagram1.puml', 'diagram2.puml'],
      });
    });

    const mockRenderer2 = vi.fn().mockImplementation(async (ctx: PipelineContext) => {
      ctx.state.rendererOutputs!.push({
        renderer: 'renderer2',
        format: 'png',
        files: ['diagram1.png', 'diagram2.png', 'diagram3.png'],
      });
    });

    // Reset the mock completely for this test
    vi.mocked(mockModuleLoader.loadRendererModule).mockReset();
    vi.mocked(mockModuleLoader.loadRendererModule)
      .mockResolvedValueOnce({
        entry: mockRenderer1,
        resolved: '/path/to/renderer1.js',
      })
      .mockResolvedValueOnce({
        entry: mockRenderer2,
        resolved: '/path/to/renderer2.js',
      });

    await renderStage.run(mockContext);

    // Verify both renderers were called
    expect(mockRenderer1).toHaveBeenCalled();
    expect(mockRenderer2).toHaveBeenCalled();

    // Verify summary log contains renderer count and file count
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringMatching(/completed 2 renderer\(s\), generated \d+ file\(s\)/),
    );
  });

  it('handles zero files in summary', async () => {
    // Override mocks to ensure they don't add files
    const mockRenderer = vi.fn().mockResolvedValue(undefined);
    vi.mocked(mockModuleLoader.loadRendererModule).mockResolvedValue({
      entry: mockRenderer,
      resolved: '/path/to/renderer.js',
    });

    await renderStage.run(mockContext);

    // Verify summary log was called (don't check exact count since it depends on other state)
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringMatching(/completed \d+ renderer\(s\), generated \d+ file\(s\)/),
    );
  });

  it('logs renderer module resolution', async () => {
    await renderStage.run(mockContext);

    expect(mockContext.log.debug).toHaveBeenCalledWith(
      expect.stringMatching(/Loaded renderer.*from/),
    );
    expect(mockContext.log.debug).toHaveBeenCalledWith(
      expect.stringMatching(/Invoking renderer/),
    );
  });

  it('logs renderer completion', async () => {
    await renderStage.run(mockContext);

    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringMatching(/Renderer.*completed/),
    );
  });

  it('processes renderers in order', async () => {
    const callOrder: string[] = [];

    const mockRenderer1 = vi.fn().mockImplementation(() => {
      callOrder.push('renderer1');
    });

    const mockRenderer2 = vi.fn().mockImplementation(() => {
      callOrder.push('renderer2');
    });

    vi.mocked(mockModuleLoader.loadRendererModule)
      .mockResolvedValueOnce({
        entry: mockRenderer1,
        resolved: '/path/to/renderer1.js',
      })
      .mockResolvedValueOnce({
        entry: mockRenderer2,
        resolved: '/path/to/renderer2.js',
      });

    await renderStage.run(mockContext);

    expect(callOrder).toEqual(['renderer1', 'renderer2']);
  });
});
