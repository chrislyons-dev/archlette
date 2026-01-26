/**
 * Unit tests for Structurizr renderer (CLI DOT export + Graphviz approach)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PipelineContext } from '../../../src/core/types.js';
import type { ResolvedStageNode } from '../../../src/core/types-aac.js';

// Mock dependencies before importing the module
vi.mock('node:fs');
vi.mock('node:child_process');
vi.mock('../../../src/core/tool-manager.js');
vi.mock('../../../src/core/path-resolver.js');

describe('structurizr-render renderer (CLI DOT export + Graphviz)', () => {
  let mockContext: PipelineContext;
  let mockNode: ResolvedStageNode;
  let mockFs: typeof import('node:fs');
  let mockChildProcess: typeof import('node:child_process');
  let mockToolManager: typeof import('../../../src/core/tool-manager.js');
  let mockPathResolver: typeof import('../../../src/core/path-resolver.js');
  let structurizrRender: typeof import('../../../src/renderers/builtin/structurizr-render.js').default;
  let sanitizeDotContent: (content: string, debug?: boolean) => string;

  beforeEach(async () => {
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
    vi.mocked(mockToolManager.commandExistsInPath).mockReturnValue('/usr/bin/dot');
    vi.mocked(mockPathResolver.resolveArchlettePath).mockImplementation(
      (path: string) => `/resolved/${path}`,
    );

    // Mock file system
    vi.mocked(mockFs.existsSync).mockReturnValue(true);
    vi.mocked(mockFs.mkdirSync).mockImplementation(() => undefined);
    vi.mocked(mockFs.readFileSync).mockReturnValue('workspace { model {} views {} }');
    vi.mocked(mockFs.writeFileSync).mockImplementation(() => {});
    vi.mocked(mockFs.unlinkSync).mockImplementation(() => {});
    vi.mocked(mockFs.rmSync).mockImplementation(() => {});
    vi.mocked(mockFs.readdirSync).mockReturnValue([
      'structurizr-SystemContext.dot',
      'structurizr-Containers.dot',
    ] as unknown as ReturnType<typeof mockFs.readdirSync>);

    // Mock child_process execSync
    vi.mocked(mockChildProcess.execSync).mockReturnValue(Buffer.from(''));

    // Create mock context
    mockContext = {
      config: {
        paths: {
          render_out: 'output/diagrams',
          dsl_out: 'output/workspace.dsl',
          ir_out: 'output/ir.json',
          docs_out: 'output/docs',
        },
      },
      configBaseDir: '/project',
      state: {},
      log: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    } as unknown as PipelineContext;

    // Create mock node
    mockNode = {
      use: 'renderers/builtin/structurizr-render',
      inputs: {},
    } as ResolvedStageNode;

    // Import the renderer after mocks are set up
    const module = await import('../../../src/renderers/builtin/structurizr-render.js');
    structurizrRender = module.default;
    sanitizeDotContent = module.__test__sanitizeDotContent;
  });

  it('renders DSL to PNG using CLI DOT export + Graphviz', async () => {
    await structurizrRender(mockContext, mockNode);

    // Verify Java check
    expect(mockToolManager.requireJava).toHaveBeenCalled();

    // Verify CLI export to DOT
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('export -workspace'),
      expect.any(Object),
    );
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('-format dot'),
      expect.any(Object),
    );

    // Verify Graphviz rendering
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('-Tpng'),
      expect.any(Object),
    );

    // Verify state updates
    expect(mockContext.state.rendererOutputs).toHaveLength(1);
    expect(mockContext.state.rendererOutputs![0]).toMatchObject({
      renderer: 'structurizr-render',
      format: 'png',
    });
  });

  it('renders to SVG when format is specified', async () => {
    mockNode.inputs = { format: 'svg' };

    await structurizrRender(mockContext, mockNode);

    // Verify Graphviz uses SVG format
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('-Tsvg'),
      expect.any(Object),
    );

    expect(mockContext.state.rendererOutputs![0].format).toBe('svg');
  });

  it('applies theme override when specified', async () => {
    mockNode.inputs = { theme: './custom-theme.dsl' };

    vi.mocked(mockFs.readFileSync).mockImplementation((filePath) => {
      const pathStr = String(filePath);
      if (pathStr.includes('custom-theme')) {
        return 'styles { element "Person" { background #ff0000 } }';
      }
      // DSL with proper structure for views block insertion
      return `workspace {
  model {}
  views {
    styles {
    }
  }
}`;
    });

    await structurizrRender(mockContext, mockNode);

    // Verify temp DSL created with theme
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.temp-workspace'),
      expect.stringContaining('background #ff0000'),
      'utf8',
    );

    // Verify temp file cleanup
    expect(mockFs.unlinkSync).toHaveBeenCalled();
  });

  it('handles missing theme file gracefully', async () => {
    mockNode.inputs = { theme: './missing-theme.dsl' };

    let callCount = 0;
    vi.mocked(mockFs.existsSync).mockImplementation(() => {
      callCount++;
      if (callCount === 1) return true; // DSL exists
      if (callCount === 2) return false; // Theme doesn't exist
      return true;
    });

    await structurizrRender(mockContext, mockNode);

    expect(mockContext.log.warn).toHaveBeenCalledWith(
      expect.stringContaining('Theme file not found'),
    );
  });

  it('throws error when Java is not available', async () => {
    vi.mocked(mockToolManager.requireJava).mockImplementation(() => {
      throw new Error('Java not found');
    });

    await expect(structurizrRender(mockContext, mockNode)).rejects.toThrow(
      'Java not found',
    );
  });

  it('returns early when DSL file does not exist', async () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(false);

    await structurizrRender(mockContext, mockNode);

    expect(mockContext.log.warn).toHaveBeenCalledWith(
      expect.stringContaining('DSL file not found'),
    );
    expect(mockChildProcess.execSync).not.toHaveBeenCalled();
  });

  it('throws when no DOT files are generated', async () => {
    vi.mocked(mockFs.readdirSync).mockReturnValue(
      [] as unknown as ReturnType<typeof mockFs.readdirSync>,
    );

    await expect(structurizrRender(mockContext, mockNode)).rejects.toThrow(
      'No DOT files generated',
    );
  });

  it('throws when Graphviz is not found', async () => {
    vi.mocked(mockToolManager.commandExistsInPath).mockReturnValue(null);

    // Also make sure Windows paths don't exist
    vi.mocked(mockFs.existsSync).mockImplementation((filePath) => {
      const pathStr = String(filePath);
      if (pathStr.includes('workspace.dsl')) return true;
      if (pathStr.includes('Graphviz')) return false;
      return false;
    });

    await expect(structurizrRender(mockContext, mockNode)).rejects.toThrow(
      'Graphviz not found',
    );
  });

  it('uses outputSubdir when specified', async () => {
    mockNode.inputs = { outputSubdir: 'custom' };

    await structurizrRender(mockContext, mockNode);

    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('custom'),
      expect.any(Object),
    );
  });

  it('cleans up DOT temp directory', async () => {
    await structurizrRender(mockContext, mockNode);

    expect(mockFs.rmSync).toHaveBeenCalledWith(
      expect.stringContaining('.dot-temp'),
      expect.objectContaining({ recursive: true, force: true }),
    );
  });

  it('cleans up temp directory even on error', async () => {
    vi.mocked(mockFs.readdirSync).mockReturnValue(
      [] as unknown as ReturnType<typeof mockFs.readdirSync>,
    );

    await expect(structurizrRender(mockContext, mockNode)).rejects.toThrow();

    expect(mockFs.rmSync).toHaveBeenCalledWith(
      expect.stringContaining('.dot-temp'),
      expect.objectContaining({ recursive: true, force: true }),
    );
  });

  it('initializes rendererOutputs array if not present', async () => {
    mockContext.state.rendererOutputs = undefined;

    await structurizrRender(mockContext, mockNode);

    expect(mockContext.state.rendererOutputs).toBeDefined();
    expect(Array.isArray(mockContext.state.rendererOutputs)).toBe(true);
  });

  it('appends to existing rendererOutputs array', async () => {
    mockContext.state.rendererOutputs = [
      { renderer: 'previous', format: 'test', files: [], timestamp: 0 },
    ];

    await structurizrRender(mockContext, mockNode);

    expect(mockContext.state.rendererOutputs).toHaveLength(2);
  });

  it('logs progress messages', async () => {
    await structurizrRender(mockContext, mockNode);

    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('converting DSL to PNG'),
    );
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('Generated'),
    );
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('completed'),
    );
  });

  it('warns when individual DOT file fails to render', async () => {
    let execCallCount = 0;
    vi.mocked(mockChildProcess.execSync).mockImplementation(() => {
      execCallCount++;
      // First call is CLI export, subsequent are Graphviz renders
      if (execCallCount === 2) {
        throw new Error('Graphviz render failed');
      }
      return Buffer.from('');
    });

    await structurizrRender(mockContext, mockNode);

    expect(mockContext.log.warn).toHaveBeenCalledWith(
      expect.stringContaining('render failed'),
    );
  });

  it('preserves valid HTML tags in DOT labels', () => {
    const input =
      'label=<<br /><font point-size="34">Title</font><br /><font point-size="12">Desc</font>>';
    const output = sanitizeDotContent(input);

    expect(output).toContain('<br />');
    expect(output).toContain('<font point-size="34">Title</font>');
    expect(output).toContain('<font point-size="12">Desc</font>');
  });
});
