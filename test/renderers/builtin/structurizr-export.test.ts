/**
 * Unit tests for Structurizr export renderer
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PipelineContext } from '../../../src/core/types.js';
import type { ResolvedAACConfig } from '../../../src/core/types-aac.js';

// Mock dependencies before importing the module
vi.mock('node:fs');
vi.mock('node:child_process');
vi.mock('../../../src/core/tool-manager.js');
vi.mock('../../../src/core/path-resolver.js');

describe('structurizr-export renderer', () => {
  let mockContext: PipelineContext;
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
      state: {},
      log: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    };

    // Import the renderer after mocks are set up
    const module = await import('../../../src/renderers/builtin/structurizr-export.js');
    structurizrExport = module.default;
  });

  it('exports DSL to PlantUML and Mermaid formats', async () => {
    await structurizrExport(mockContext);

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

    await expect(structurizrExport(mockContext)).rejects.toThrow('Java not found');
  });

  it('throws error when DSL file does not exist', async () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(false);

    await expect(structurizrExport(mockContext)).rejects.toThrow('DSL file not found');
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

    await expect(structurizrExport(mockContext)).rejects.toThrow(
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

    await expect(structurizrExport(mockContext)).rejects.toThrow(
      'Mermaid export failed',
    );
  });

  it('handles empty output directories', async () => {
    vi.mocked(mockFs.readdirSync).mockReturnValue([] as any);

    await structurizrExport(mockContext);

    // Should still complete successfully
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('completed'),
    );
  });

  it('initializes rendererOutputs array if not present', async () => {
    mockContext.state.rendererOutputs = undefined;

    await structurizrExport(mockContext);

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

    await structurizrExport(mockContext);

    expect(mockContext.state.rendererOutputs).toHaveLength(3); // 1 existing + 2 new
  });

  it('logs progress messages', async () => {
    await structurizrExport(mockContext);

    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('converting DSL to PlantUML and Mermaid'),
    );
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('Exporting to PlantUML'),
    );
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('Exporting to Mermaid'),
    );
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('completed'),
    );
  });
});
