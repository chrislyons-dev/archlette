/**
 * Unit tests for Structurizr export renderer
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PipelineContext } from '../../../src/core/types.js';
import type {
  ResolvedAACConfig,
  ResolvedStageNode,
} from '../../../src/core/types-aac.js';

// Mock dependencies before importing the module
vi.mock('node:fs');
vi.mock('node:child_process');
vi.mock('../../../src/core/tool-manager.js');
vi.mock('../../../src/core/path-resolver.js');

describe('structurizr-export renderer', () => {
  let mockContext: PipelineContext;
  let mockNode: ResolvedStageNode;
  let mockFs: typeof import('node:fs');
  let mockChildProcess: typeof import('node:child_process');
  let mockToolManager: typeof import('../../../src/core/tool-manager.js');
  let mockPathResolver: typeof import('../../../src/core/path-resolver.js');
  let structurizrExport: typeof import('../../../src/renderers/builtin/structurizr-export.js').default;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Import mocked modules
    mockFs = await import('node:fs');
    mockChildProcess = await import('node:child_process');
    mockToolManager = await import('../../../src/core/tool-manager.js');
    mockPathResolver = await import('../../../src/core/path-resolver.js');

    // Setup default mock implementations
    vi.mocked(mockToolManager.requireJava).mockImplementation(() => {});
    vi.mocked(mockToolManager.findStructurizrCLI).mockResolvedValue(
      '/path/to/structurizr-cli',
    );
    vi.mocked(mockPathResolver.getCliDir).mockReturnValue('/cli/dir');
    vi.mocked(mockPathResolver.resolveArchlettePath).mockImplementation(
      (path: string) => `/resolved/${path}`,
    );
    vi.mocked(mockFs.existsSync).mockReturnValue(true);
    vi.mocked(mockFs.mkdirSync).mockImplementation(() => undefined);
    vi.mocked(mockFs.readdirSync).mockReturnValue([
      'diagram1.puml',
      'diagram2.puml',
    ] as any);
    vi.mocked(mockFs.readFileSync).mockReturnValue(
      'graph TB\nsubgraph diagram ["test"]' as any,
    );
    vi.mocked(mockFs.writeFileSync).mockImplementation(() => {});
    vi.mocked(mockChildProcess.execSync).mockImplementation(() => '');

    // Create mock context
    mockContext = {
      config: {
        paths: {
          dsl_out: 'docs/architecture/aac.dsl',
          render_out: 'docs/architecture/diagrams',
          ir_out: 'docs/architecture/aac-ir.json',
          docs_out: 'docs',
        },
      } as ResolvedAACConfig,
      configBaseDir: '/project',
      state: {},
      log: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    };

    // Create mock node
    mockNode = {
      use: 'renderers/builtin/structurizr-export',
      inputs: {},
      _effective: {
        includes: [],
        excludes: [],
      },
    };

    // Import the renderer after mocks are set up
    const module = await import('../../../src/renderers/builtin/structurizr-export.js');
    structurizrExport = module.default;
  });

  it('exports DSL to PlantUML and Mermaid formats', async () => {
    await structurizrExport(mockContext, mockNode);

    // Verify Java check
    expect(mockToolManager.requireJava).toHaveBeenCalled();

    // Verify DSL file existence check
    expect(mockFs.existsSync).toHaveBeenCalledWith(
      '/resolved/docs/architecture/aac.dsl',
    );

    // Verify output directories created
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('plantuml'), {
      recursive: true,
    });
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('mermaid'), {
      recursive: true,
    });

    // Verify Structurizr CLI found
    expect(mockToolManager.findStructurizrCLI).toHaveBeenCalled();

    // Verify PlantUML export
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('plantuml'),
      expect.any(Object),
    );

    // Verify Mermaid export
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('mermaid'),
      expect.any(Object),
    );

    // Verify state updates
    expect(mockContext.state.rendererOutputs).toHaveLength(2);
    expect(mockContext.state.rendererOutputs![0]).toMatchObject({
      renderer: 'structurizr-export',
      format: 'plantuml',
    });
    expect(mockContext.state.rendererOutputs![0].files).toHaveLength(2);
    expect(
      mockContext.state.rendererOutputs![0].files.every((f) => f.includes('diagram')),
    ).toBe(true);
    expect(mockContext.state.rendererOutputs![1]).toMatchObject({
      renderer: 'structurizr-export',
      format: 'mermaid',
    });
  });

  it('throws error when Java is not available', async () => {
    vi.mocked(mockToolManager.requireJava).mockImplementation(() => {
      throw new Error('Java not found');
    });

    await expect(structurizrExport(mockContext, mockNode)).rejects.toThrow(
      'Java not found',
    );
  });

  it('throws error when DSL file does not exist', async () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(false);

    await expect(structurizrExport(mockContext, mockNode)).rejects.toThrow(
      'DSL file not found',
    );
  });

  it('throws error when PlantUML export fails', async () => {
    let callCount = 0;
    vi.mocked(mockChildProcess.execSync).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call (PlantUML) fails
        throw new Error('PlantUML export failed');
      }
      return '';
    });

    await expect(structurizrExport(mockContext, mockNode)).rejects.toThrow(
      'PlantUML export failed',
    );
  });

  it('throws error when Mermaid export fails', async () => {
    let callCount = 0;
    vi.mocked(mockChildProcess.execSync).mockImplementation(() => {
      callCount++;
      if (callCount === 2) {
        // Second call (Mermaid) fails
        throw new Error('Mermaid export failed');
      }
      return '';
    });

    await expect(structurizrExport(mockContext, mockNode)).rejects.toThrow(
      'Mermaid export failed',
    );
  });

  it('handles empty output directories', async () => {
    vi.mocked(mockFs.readdirSync).mockReturnValue([] as any);

    await structurizrExport(mockContext, mockNode);

    // Should still complete successfully
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('completed'),
    );
  });

  it('initializes rendererOutputs array if not present', async () => {
    mockContext.state.rendererOutputs = undefined;

    await structurizrExport(mockContext, mockNode);

    expect(mockContext.state.rendererOutputs).toBeDefined();
    expect(Array.isArray(mockContext.state.rendererOutputs)).toBe(true);
  });

  it('appends to existing rendererOutputs array', async () => {
    mockContext.state.rendererOutputs = [
      {
        renderer: 'previous-renderer',
        format: 'test',
        files: [],
      },
    ];

    await structurizrExport(mockContext, mockNode);

    expect(mockContext.state.rendererOutputs).toHaveLength(3); // 1 existing + 2 new
  });

  it('logs progress messages', async () => {
    await structurizrExport(mockContext, mockNode);

    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('converting DSL to PLANTUML, MERMAID'),
    );
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('Exporting to Plantuml'),
    );
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('Exporting to Mermaid'),
    );
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('completed'),
    );
  });

  it('exports only PlantUML when formats includes only plantuml', async () => {
    mockNode.inputs = { formats: ['plantuml'] };

    await structurizrExport(mockContext, mockNode);

    // Verify PlantUML export only
    expect(mockChildProcess.execSync).toHaveBeenCalledTimes(1);
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('plantuml'),
      expect.any(Object),
    );

    // Verify only one output in state
    expect(mockContext.state.rendererOutputs).toHaveLength(1);
    expect(mockContext.state.rendererOutputs![0]).toMatchObject({
      renderer: 'structurizr-export',
      format: 'plantuml',
    });
  });

  it('exports only Mermaid when formats includes only mermaid', async () => {
    mockNode.inputs = { formats: ['mermaid'] };
    vi.mocked(mockFs.readdirSync).mockReturnValue([
      'diagram1.mmd',
      'diagram2.mmd',
    ] as any);

    // Mock file read/write for post-processing
    vi.mocked(mockFs.readFileSync).mockReturnValue(
      'graph TB\nsubgraph diagram ["test"]' as any,
    );
    vi.mocked(mockFs.writeFileSync).mockImplementation(() => {});

    await structurizrExport(mockContext, mockNode);

    // Verify Mermaid export only
    expect(mockChildProcess.execSync).toHaveBeenCalledTimes(1);
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('mermaid'),
      expect.any(Object),
    );

    // Verify only one output in state
    expect(mockContext.state.rendererOutputs).toHaveLength(1);
    expect(mockContext.state.rendererOutputs![0]).toMatchObject({
      renderer: 'structurizr-export',
      format: 'mermaid',
    });
  });

  it('skips export when formats is empty array', async () => {
    mockNode.inputs = { formats: [] };

    await structurizrExport(mockContext, mockNode);

    // Verify no export commands executed
    expect(mockChildProcess.execSync).not.toHaveBeenCalled();

    // Verify log message
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('no formats selected'),
    );
  });

  it('exports both formats when formats includes both', async () => {
    mockNode.inputs = { formats: ['plantuml', 'mermaid'] };

    // Mock file read/write for Mermaid post-processing
    vi.mocked(mockFs.readFileSync).mockReturnValue(
      'graph TB\nsubgraph diagram ["test"]' as any,
    );
    vi.mocked(mockFs.writeFileSync).mockImplementation(() => {});

    await structurizrExport(mockContext, mockNode);

    // Verify both exports
    expect(mockChildProcess.execSync).toHaveBeenCalledTimes(2);
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('plantuml'),
      expect.any(Object),
    );
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('mermaid'),
      expect.any(Object),
    );

    // Verify both outputs in state
    expect(mockContext.state.rendererOutputs).toHaveLength(2);
  });

  it('post-processes Mermaid files to remove subgraph labels', async () => {
    mockNode.inputs = { formats: ['mermaid'] };
    vi.mocked(mockFs.readdirSync).mockReturnValue([
      'diagram1.mmd',
      'diagram2.mmd',
    ] as any);

    // Mock file content with subgraph labels
    const mockMermaidContent = `graph TB
  linkStyle default fill:#ffffff

  subgraph diagram ["Application - System Context"]
    style diagram fill:#ffffff,stroke:#ffffff

    1("<div>Application</div>")
    style 1 fill:#1168bd,stroke:#0b4884,color:#ffffff

  end`;

    vi.mocked(mockFs.readFileSync).mockReturnValue(mockMermaidContent as any);
    vi.mocked(mockFs.writeFileSync).mockImplementation(() => {});

    await structurizrExport(mockContext, mockNode);

    // Verify files were read
    expect(mockFs.readFileSync).toHaveBeenCalledTimes(2);
    expect(mockFs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('diagram1.mmd'),
      'utf8',
    );
    expect(mockFs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('diagram2.mmd'),
      'utf8',
    );

    // Verify files were written with processed content
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);

    // Get the processed content from the first writeFileSync call
    const writeCalls = vi.mocked(mockFs.writeFileSync).mock.calls;
    const processedContent = writeCalls[0][1] as string;

    // Verify subgraph label was replaced with empty string
    expect(processedContent).toContain('subgraph diagram [" "]');
    expect(processedContent).not.toContain('["Application - System Context"]');

    // Verify debug logging
    expect(mockContext.log.debug).toHaveBeenCalledWith(
      expect.stringContaining('Post-processing Mermaid files'),
    );
    expect(mockContext.log.debug).toHaveBeenCalledWith(
      expect.stringContaining('Post-processed 2 Mermaid file(s)'),
    );
  });
});
