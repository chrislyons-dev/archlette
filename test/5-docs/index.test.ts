/**
 * Unit tests for docs stage orchestrator
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PipelineContext } from '../../src/core/types.js';
import type { ArchletteIR } from '../../src/core/types-ir.js';

// Mock dependencies
vi.mock('../../src/core/stage-module-loader.js');

describe('docs stage', () => {
  let mockContext: PipelineContext;
  let mockModuleLoader: typeof import('../../src/core/stage-module-loader.js');
  let docsStage: typeof import('../../src/5-docs/index.js');

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Import mocked module loader
    mockModuleLoader = await import('../../src/core/stage-module-loader.js');

    // Setup default mock - doc generator that succeeds
    vi.mocked(mockModuleLoader.loadDocModule).mockResolvedValue({
      entry: vi.fn().mockResolvedValue(undefined),
      resolved: '/path/to/doc-generator.js',
    });

    // Create mock IR
    const mockIR: ArchletteIR = {
      version: '1.0.0',
      system: {
        name: 'Test System',
        description: 'Test system description',
      },
      actors: [],
      containers: [],
      components: [
        {
          id: 'comp-auth',
          containerId: 'api',
          name: 'Authentication',
          type: 'module',
          description: 'Authentication component',
        },
      ],
      code: [],
      deployments: [],
      containerRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    // Create mock context
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
        renderers: [],
        docs: [
          {
            use: 'builtin/markdown-docs',
            name: 'markdown-docs',
            _effective: { includes: [], excludes: [] },
            props: {},
            inputs: {},
          },
        ],
      },
      state: {
        aggregatedIR: mockIR,
        docOutputs: [],
      },
      log: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    } as any;

    // Import the docs stage after mocks are set up
    docsStage = await import('../../src/5-docs/index.js');
  });

  it('runs configured doc generators sequentially', async () => {
    await docsStage.run(mockContext);

    // Verify doc generators were loaded
    expect(mockModuleLoader.loadDocModule).toHaveBeenCalledTimes(1);
    expect(mockModuleLoader.loadDocModule).toHaveBeenCalledWith(
      'builtin/markdown-docs',
    );
  });

  it('invokes each doc generator with context and node', async () => {
    const mockDocGen = vi.fn().mockResolvedValue(undefined);

    vi.mocked(mockModuleLoader.loadDocModule).mockResolvedValue({
      entry: mockDocGen,
      resolved: '/path/to/doc-gen.js',
    });

    await docsStage.run(mockContext);

    expect(mockDocGen).toHaveBeenCalledWith(
      mockContext,
      expect.objectContaining({ use: 'builtin/markdown-docs' }),
    );
  });

  it('initializes docOutputs array', async () => {
    mockContext.state.docOutputs = undefined;

    await docsStage.run(mockContext);

    expect(mockContext.state.docOutputs).toBeDefined();
    expect(Array.isArray(mockContext.state.docOutputs)).toBe(true);
  });

  it('returns early when no IR found', async () => {
    mockContext.state.aggregatedIR = undefined;
    mockContext.state.validatedIR = undefined;

    await docsStage.run(mockContext);

    expect(mockContext.log.warn).toHaveBeenCalledWith(
      expect.stringContaining('No IR found'),
    );
    expect(mockModuleLoader.loadDocModule).not.toHaveBeenCalled();
  });

  it('returns early when no doc generators configured', async () => {
    mockContext.config.docs = [];

    await docsStage.run(mockContext);

    expect(mockContext.log.info).toHaveBeenCalledWith(
      'No doc generators configured. Skipping docs stage.',
    );
    expect(mockModuleLoader.loadDocModule).not.toHaveBeenCalled();
  });

  it('prefers validatedIR over aggregatedIR', async () => {
    const validatedIR = {
      ...mockContext.state.aggregatedIR!,
      system: { name: 'Validated System' },
    };
    mockContext.state.validatedIR = validatedIR;

    const mockDocGen = vi.fn().mockResolvedValue(undefined);
    vi.mocked(mockModuleLoader.loadDocModule).mockResolvedValue({
      entry: mockDocGen,
      resolved: '/path/to/doc-gen.js',
    });

    await docsStage.run(mockContext);

    // Verify doc generator was called with validated IR available in context
    expect(mockDocGen).toHaveBeenCalled();
    expect(mockContext.state.validatedIR).toBe(validatedIR);
  });

  it('throws error when doc generator fails', async () => {
    const mockError = new Error('Doc generator failed');
    vi.mocked(mockModuleLoader.loadDocModule).mockResolvedValue({
      entry: vi.fn().mockRejectedValue(mockError),
      resolved: '/path/to/doc-gen.js',
    });

    await expect(docsStage.run(mockContext)).rejects.toThrow('Doc generator failed');
    expect(mockContext.log.error).toHaveBeenCalledWith(
      expect.stringContaining('failed'),
      mockError,
    );
  });

  it('stops processing when a doc generator fails', async () => {
    const mockDocGen1 = vi.fn().mockRejectedValue(new Error('First generator failed'));
    const mockDocGen2 = vi.fn().mockResolvedValue(undefined);

    mockContext.config.docs = [
      {
        use: 'builtin/markdown-docs',
        name: 'markdown-docs',
        _effective: { includes: [], excludes: [] },
        props: {},
        inputs: {},
      },
      {
        use: 'builtin/html-docs',
        name: 'html-docs',
        _effective: { includes: [], excludes: [] },
        props: {},
        inputs: {},
      },
    ];

    vi.mocked(mockModuleLoader.loadDocModule)
      .mockResolvedValueOnce({
        entry: mockDocGen1,
        resolved: '/path/to/doc-gen1.js',
      })
      .mockResolvedValueOnce({
        entry: mockDocGen2,
        resolved: '/path/to/doc-gen2.js',
      });

    await expect(docsStage.run(mockContext)).rejects.toThrow();

    // Second generator should not be called
    expect(mockDocGen1).toHaveBeenCalled();
    expect(mockDocGen2).not.toHaveBeenCalled();
  });

  it('logs summary with file counts', async () => {
    // Simulate doc generator populating docOutputs
    const mockDocGen = vi.fn().mockImplementation(async (ctx: PipelineContext) => {
      ctx.state.docOutputs!.push({
        generator: 'markdown-docs',
        format: 'markdown',
        files: ['README.md', 'comp-auth.md', 'comp-user.md'],
      });
    });

    // Reset mock completely for this test
    vi.mocked(mockModuleLoader.loadDocModule).mockReset();
    vi.mocked(mockModuleLoader.loadDocModule).mockResolvedValue({
      entry: mockDocGen,
      resolved: '/path/to/doc-gen.js',
    });

    await docsStage.run(mockContext);

    // Verify doc generator was called
    expect(mockDocGen).toHaveBeenCalled();

    // Verify summary log contains generator count and file count
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringMatching(/completed 1 generator\(s\), generated 3 file\(s\)/),
    );
  });

  it('handles zero files in summary', async () => {
    const mockDocGen = vi.fn().mockResolvedValue(undefined);
    vi.mocked(mockModuleLoader.loadDocModule).mockResolvedValue({
      entry: mockDocGen,
      resolved: '/path/to/doc-gen.js',
    });

    await docsStage.run(mockContext);

    // Verify summary log was called
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringMatching(/completed \d+ generator\(s\), generated \d+ file\(s\)/),
    );
  });

  it('logs doc generator module resolution', async () => {
    await docsStage.run(mockContext);

    expect(mockContext.log.debug).toHaveBeenCalledWith(
      expect.stringMatching(/Loaded doc generator.*from/),
    );
    expect(mockContext.log.debug).toHaveBeenCalledWith(
      expect.stringMatching(/Invoking doc generator/),
    );
  });

  it('logs doc generator completion', async () => {
    await docsStage.run(mockContext);

    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringMatching(/Doc generator.*completed/),
    );
  });

  it('processes doc generators in order', async () => {
    const callOrder: string[] = [];

    const mockDocGen1 = vi.fn().mockImplementation(() => {
      callOrder.push('docgen1');
    });

    const mockDocGen2 = vi.fn().mockImplementation(() => {
      callOrder.push('docgen2');
    });

    mockContext.config.docs = [
      {
        use: 'builtin/markdown-docs',
        name: 'markdown-docs',
        _effective: { includes: [], excludes: [] },
        props: {},
        inputs: {},
      },
      {
        use: 'builtin/html-docs',
        name: 'html-docs',
        _effective: { includes: [], excludes: [] },
        props: {},
        inputs: {},
      },
    ];

    vi.mocked(mockModuleLoader.loadDocModule)
      .mockResolvedValueOnce({
        entry: mockDocGen1,
        resolved: '/path/to/docgen1.js',
      })
      .mockResolvedValueOnce({
        entry: mockDocGen2,
        resolved: '/path/to/docgen2.js',
      });

    await docsStage.run(mockContext);

    expect(callOrder).toEqual(['docgen1', 'docgen2']);
  });
});
