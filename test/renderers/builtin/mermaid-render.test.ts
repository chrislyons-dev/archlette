/**
 * Unit tests for Mermaid renderer
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

describe('mermaid-render renderer', () => {
  let mockContext: PipelineContext;
  let mockNode: ResolvedStageNode;
  let mockFs: typeof import('node:fs');
  let mockChildProcess: typeof import('node:child_process');
  let mockToolManager: typeof import('../../../src/core/tool-manager.js');
  let mockPathResolver: typeof import('../../../src/core/path-resolver.js');
  let mermaidRender: typeof import('../../../src/renderers/builtin/mermaid-render.js').default;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Import mocked modules
    mockFs = await import('node:fs');
    mockChildProcess = await import('node:child_process');
    mockToolManager = await import('../../../src/core/tool-manager.js');
    mockPathResolver = await import('../../../src/core/path-resolver.js');

    // Setup default mock implementations
    vi.mocked(mockToolManager.findMermaidCLI).mockReturnValue('/usr/bin/mmdc');
    vi.mocked(mockPathResolver.resolveArchlettePath).mockImplementation(
      (path: string) => `/resolved/${path}`,
    );
    vi.mocked(mockFs.existsSync).mockReturnValue(true);
    vi.mocked(mockFs.mkdirSync).mockImplementation(() => undefined);
    vi.mocked(mockFs.readdirSync).mockReturnValue([
      'diagram1.mmd',
      'diagram2.mmd',
      'ignored.txt',
    ] as any);
    vi.mocked(mockChildProcess.execSync).mockImplementation(() => '');

    // Create mock context
    mockContext = {
      config: {
        paths: {
          render_out: 'docs/architecture/diagrams',
          dsl_out: 'docs/architecture/aac.dsl',
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
      use: 'renderers/builtin/mermaid-render',
      inputs: {},
      _effective: {
        includes: [],
        excludes: [],
      },
    };

    // Import the renderer after mocks are set up
    const module = await import('../../../src/renderers/builtin/mermaid-render.js');
    mermaidRender = module.default;
  });

  it('renders Mermaid files to SVG images by default', async () => {
    await mermaidRender(mockContext, mockNode);

    // Verify Mermaid CLI found
    expect(mockToolManager.findMermaidCLI).toHaveBeenCalled();

    // Verify Mermaid directory check
    expect(mockFs.existsSync).toHaveBeenCalledWith(expect.stringContaining('mermaid'));

    // Verify execSync called for each .mmd file (2 files)
    expect(mockChildProcess.execSync).toHaveBeenCalledTimes(2);
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('diagram1.mmd'),
      expect.any(Object),
    );
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('diagram2.mmd'),
      expect.any(Object),
    );

    // Verify state updates
    expect(mockContext.state.rendererOutputs).toHaveLength(1);
    expect(mockContext.state.rendererOutputs![0]).toMatchObject({
      renderer: 'mermaid-render',
      format: 'svg',
      files: expect.arrayContaining(['diagram1.svg', 'diagram2.svg']),
    });
  });

  it('renders Mermaid files to PNG when format is specified', async () => {
    mockNode.inputs = { format: 'png' };

    await mermaidRender(mockContext, mockNode);

    // Verify state updates
    expect(mockContext.state.rendererOutputs![0]).toMatchObject({
      renderer: 'mermaid-render',
      format: 'png',
      files: expect.arrayContaining(['diagram1.png', 'diagram2.png']),
    });
  });

  it('applies custom theme when specified', async () => {
    mockNode.inputs = { theme: 'forest' };

    await mermaidRender(mockContext, mockNode);

    // Verify execSync called with forest theme
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('-t forest'),
      expect.any(Object),
    );
  });

  it('applies custom dimensions when specified', async () => {
    mockNode.inputs = { width: 1024, height: 768 };

    await mermaidRender(mockContext, mockNode);

    // Verify execSync called with custom dimensions
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('-w 1024'),
      expect.any(Object),
    );
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('-H 768'),
      expect.any(Object),
    );
  });

  it('applies custom background color when specified', async () => {
    mockNode.inputs = { backgroundColor: 'transparent' };

    await mermaidRender(mockContext, mockNode);

    // Verify execSync called with custom background
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('-b transparent'),
      expect.any(Object),
    );
  });

  it('uses config file when specified', async () => {
    mockNode.inputs = { configFile: './mermaid-config.json' };

    await mermaidRender(mockContext, mockNode);

    // Verify config file path was resolved
    expect(mockPathResolver.resolveArchlettePath).toHaveBeenCalledWith(
      './mermaid-config.json',
      expect.any(Object),
    );

    // Verify execSync called with config file
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('-c'),
      expect.any(Object),
    );
  });

  it('handles missing config file gracefully', async () => {
    mockNode.inputs = { configFile: './missing-config.json' };

    // Mock existsSync to return false for config file
    let existsCallCount = 0;
    vi.mocked(mockFs.existsSync).mockImplementation((_path: any) => {
      existsCallCount++;
      if (existsCallCount === 2) return false; // Config file doesn't exist
      return true;
    });

    await mermaidRender(mockContext, mockNode);

    // Verify warning logged
    expect(mockContext.log.warn).toHaveBeenCalledWith(
      expect.stringContaining('Config file not found'),
    );

    // Verify rendering continued without config file
    expect(mockChildProcess.execSync).not.toHaveBeenCalledWith(
      expect.stringContaining('-c'),
      expect.any(Object),
    );
  });

  it('returns early when Mermaid directory does not exist', async () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(false);

    await mermaidRender(mockContext, mockNode);

    expect(mockContext.log.warn).toHaveBeenCalledWith(
      expect.stringContaining('Mermaid directory not found'),
    );
    expect(mockChildProcess.execSync).not.toHaveBeenCalled();
  });

  it('returns early when no .mmd files found', async () => {
    vi.mocked(mockFs.readdirSync).mockReturnValue([] as any);

    await mermaidRender(mockContext, mockNode);

    expect(mockContext.log.warn).toHaveBeenCalledWith('No .mmd files found to render.');
    expect(mockChildProcess.execSync).not.toHaveBeenCalled();
  });

  it('continues rendering other files when one fails', async () => {
    let callCount = 0;
    vi.mocked(mockChildProcess.execSync).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First file fails
        throw new Error('Render failed');
      }
      return '';
    });

    await mermaidRender(mockContext, mockNode);

    // Should still complete and render the second file
    expect(mockContext.log.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to render'),
      expect.any(Error),
    );
    expect(mockContext.state.rendererOutputs).toHaveLength(1);
    expect(mockContext.state.rendererOutputs![0].files).toEqual(['diagram2.svg']);
  });

  it('warns when no images were generated successfully', async () => {
    vi.mocked(mockChildProcess.execSync).mockImplementation(() => {
      throw new Error('All renders failed');
    });

    await mermaidRender(mockContext, mockNode);

    expect(mockContext.log.warn).toHaveBeenCalledWith(
      'No images were generated successfully.',
    );
    expect(mockContext.state.rendererOutputs).toBeUndefined();
  });

  it('filters out non-.mmd files', async () => {
    vi.mocked(mockFs.readdirSync).mockReturnValue([
      'diagram1.mmd',
      'readme.txt',
      'diagram2.mmd',
      'config.json',
    ] as any);

    await mermaidRender(mockContext, mockNode);

    // Should only render .mmd files (2 files)
    expect(mockChildProcess.execSync).toHaveBeenCalledTimes(2);
  });

  it('initializes rendererOutputs array if not present', async () => {
    mockContext.state.rendererOutputs = undefined;

    await mermaidRender(mockContext, mockNode);

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

    await mermaidRender(mockContext, mockNode);

    expect(mockContext.state.rendererOutputs).toHaveLength(2);
  });

  it('logs progress messages', async () => {
    await mermaidRender(mockContext, mockNode);

    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('converting .mmd to SVG'),
    );
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('Found 2 Mermaid file(s) to render'),
    );
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('Generated 2 SVG image(s)'),
    );
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('completed'),
    );
  });

  it('uses default theme when not specified', async () => {
    await mermaidRender(mockContext, mockNode);

    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('-t default'),
      expect.any(Object),
    );
  });

  it('uses default dimensions when not specified', async () => {
    await mermaidRender(mockContext, mockNode);

    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('-w 800'),
      expect.any(Object),
    );
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('-H 600'),
      expect.any(Object),
    );
  });

  it('uses default background when not specified', async () => {
    await mermaidRender(mockContext, mockNode);

    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('-b white'),
      expect.any(Object),
    );
  });
});
