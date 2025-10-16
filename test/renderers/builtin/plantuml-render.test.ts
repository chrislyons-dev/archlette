/**
 * Unit tests for PlantUML renderer
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PipelineContext } from '../../../src/core/types.js';
import type { ResolvedAACConfig } from '../../../src/core/types-aac.js';

// Mock dependencies before importing the module
vi.mock('node:fs');
vi.mock('node:child_process');
vi.mock('../../../src/core/tool-manager.js');
vi.mock('../../../src/core/path-resolver.js');

describe('plantuml-render renderer', () => {
  let mockContext: PipelineContext;
  let mockFs: typeof import('node:fs');
  let mockChildProcess: typeof import('node:child_process');
  let mockToolManager: typeof import('../../../src/core/tool-manager.js');
  let mockPathResolver: typeof import('../../../src/core/path-resolver.js');
  let plantumlRender: typeof import('../../../src/renderers/builtin/plantuml-render.js').default;

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
    vi.mocked(mockToolManager.findPlantUML).mockResolvedValue('/path/to/plantuml.jar');
    vi.mocked(mockPathResolver.getCliDir).mockReturnValue('/cli/dir');
    vi.mocked(mockPathResolver.resolveArchlettePath).mockImplementation(
      (path: string) => `/resolved/${path}`,
    );
    vi.mocked(mockFs.existsSync).mockReturnValue(true);
    vi.mocked(mockFs.mkdirSync).mockImplementation(() => undefined);
    vi.mocked(mockFs.readdirSync).mockReturnValue([
      'diagram1.puml',
      'diagram2.puml',
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
      state: {},
      log: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    };

    // Import the renderer after mocks are set up
    const module = await import('../../../src/renderers/builtin/plantuml-render.js');
    plantumlRender = module.default;
  });

  it('renders PlantUML files to PNG images', async () => {
    await plantumlRender(mockContext);

    // Verify Java check
    expect(mockToolManager.requireJava).toHaveBeenCalled();

    // Verify PlantUML directory check
    expect(mockFs.existsSync).toHaveBeenCalledWith(expect.stringContaining('plantuml'));

    // Verify PlantUML JAR found
    expect(mockToolManager.findPlantUML).toHaveBeenCalled();

    // Verify execSync called for each .puml file (2 files)
    expect(mockChildProcess.execSync).toHaveBeenCalledTimes(2);
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('diagram1.puml'),
      expect.any(Object),
    );
    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining('diagram2.puml'),
      expect.any(Object),
    );

    // Verify state updates
    expect(mockContext.state.rendererOutputs).toHaveLength(1);
    expect(mockContext.state.rendererOutputs![0]).toMatchObject({
      renderer: 'plantuml-render',
      format: 'png',
      files: expect.arrayContaining(['diagram1.png', 'diagram2.png']),
    });
  });

  it('throws error when Java is not available', async () => {
    vi.mocked(mockToolManager.requireJava).mockImplementation(() => {
      throw new Error('Java not found');
    });

    await expect(plantumlRender(mockContext)).rejects.toThrow('Java not found');
  });

  it('returns early when PlantUML directory does not exist', async () => {
    vi.mocked(mockFs.existsSync).mockReturnValue(false);

    await plantumlRender(mockContext);

    expect(mockContext.log.warn).toHaveBeenCalledWith(
      expect.stringContaining('PlantUML directory not found'),
    );
    expect(mockChildProcess.execSync).not.toHaveBeenCalled();
  });

  it('returns early when no .puml files found', async () => {
    vi.mocked(mockFs.readdirSync).mockReturnValue([] as any);

    await plantumlRender(mockContext);

    expect(mockContext.log.warn).toHaveBeenCalledWith(
      'No .puml files found to render.',
    );
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

    await plantumlRender(mockContext);

    // Should still complete and render the second file
    expect(mockContext.log.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to render'),
      expect.any(Error),
    );
    expect(mockContext.state.rendererOutputs).toHaveLength(1);
    expect(mockContext.state.rendererOutputs![0].files).toEqual(['diagram2.png']);
  });

  it('warns when no images were generated successfully', async () => {
    vi.mocked(mockChildProcess.execSync).mockImplementation(() => {
      throw new Error('All renders failed');
    });

    await plantumlRender(mockContext);

    expect(mockContext.log.warn).toHaveBeenCalledWith(
      'No images were generated successfully.',
    );
    expect(mockContext.state.rendererOutputs).toBeUndefined();
  });

  it('uses correct command for JAR files', async () => {
    vi.mocked(mockToolManager.findPlantUML).mockResolvedValue('/path/to/plantuml.jar');

    await plantumlRender(mockContext);

    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringMatching(/^java -jar/),
      expect.any(Object),
    );
  });

  it('uses correct command for wrapper scripts', async () => {
    vi.mocked(mockToolManager.findPlantUML).mockResolvedValue('/usr/bin/plantuml');

    await plantumlRender(mockContext);

    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.not.stringMatching(/^java -jar/),
      expect.any(Object),
    );
  });

  it('filters out non-.puml files', async () => {
    vi.mocked(mockFs.readdirSync).mockReturnValue([
      'diagram1.puml',
      'readme.txt',
      'diagram2.puml',
      'config.json',
    ] as any);

    await plantumlRender(mockContext);

    // Should only render .puml files (2 files)
    expect(mockChildProcess.execSync).toHaveBeenCalledTimes(2);
  });

  it('initializes rendererOutputs array if not present', async () => {
    mockContext.state.rendererOutputs = undefined;

    await plantumlRender(mockContext);

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

    await plantumlRender(mockContext);

    expect(mockContext.state.rendererOutputs).toHaveLength(2); // 1 existing + 1 new
  });

  it('logs progress messages', async () => {
    await plantumlRender(mockContext);

    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('converting .puml to PNG'),
    );
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('Found 2 PlantUML file(s) to render'),
    );
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('Generated 2 PNG image(s)'),
    );
    expect(mockContext.log.info).toHaveBeenCalledWith(
      expect.stringContaining('completed'),
    );
  });
});
