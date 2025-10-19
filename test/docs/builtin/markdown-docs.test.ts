/**
 * Unit tests for markdown docs generator
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PipelineContext } from '../../../src/core/types.js';
import type { ArchletteIR } from '../../../src/core/types-ir.js';

// Mock node modules
vi.mock('node:fs');
vi.mock('node:path');
vi.mock('node:module', () => ({
  createRequire: vi.fn(() => vi.fn(() => mockNunjucks)),
}));

// Mock path resolver
vi.mock('../../../src/core/path-resolver.js', () => ({
  getCliDir: vi.fn(() => '/test/cli/dir'),
  resolveArchlettePath: vi.fn((path: string) => `/resolved/${path}`),
}));

// Mock nunjucks
const mockNunjucks = {
  configure: vi.fn(() => mockEnv),
};

const mockEnv = {
  addFilter: vi.fn((_name: string, _fn: (...args: any[]) => any) => {}),
  render: vi.fn((template: string, _data?: any) => `# Generated ${template} content`),
};

describe('markdown-docs generator', () => {
  let markdownDocs: any;
  let mockContext: PipelineContext;
  let mockFs: any;
  let mockPath: any;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Import and setup mocked modules
    mockFs = await import('node:fs');
    mockPath = await import('node:path');

    // Setup default mock implementations
    mockFs.mkdirSync = vi.fn();
    mockFs.writeFileSync = vi.fn();
    mockFs.existsSync = vi.fn(() => true);

    mockPath.join = vi.fn((...args: string[]) => args.join('/'));
    mockPath.dirname = vi.fn((p: string) => p.split('/').slice(0, -1).join('/'));
    mockPath.basename = vi.fn((p: string, ext?: string) => {
      const base = p.split('/').pop() || '';
      return ext ? base.replace(ext, '') : base;
    });
    mockPath.relative = vi.fn((from: string, to: string) => {
      // Simple mock: just return the 'to' path
      return to.replace(from + '/', '');
    });

    // Mock fileURLToPath
    vi.mock('node:url', () => ({
      fileURLToPath: vi.fn((url: string) => url.replace('file://', '')),
    }));

    // Create mock IR
    const mockIR: ArchletteIR = {
      version: '1.0.0',
      system: {
        name: 'Test System',
        description: 'Test system description',
      },
      actors: [
        {
          id: 'user',
          name: 'User',
          type: 'Person',
          description: 'End user',
        },
      ],
      containers: [
        {
          id: 'api',
          name: 'API Service',
          type: 'Service',
          layer: 'Application',
        },
      ],
      components: [
        {
          id: 'comp-auth',
          containerId: 'api',
          name: 'Authentication',
          type: 'module',
          description: 'Authentication component',
        },
        {
          id: 'comp-user',
          containerId: 'api',
          name: 'UserManagement',
          type: 'module',
          description: 'User management component',
        },
      ],
      code: [
        {
          id: 'code-auth-handler',
          componentId: 'comp-auth',
          name: 'AuthHandler',
          type: 'class',
          filePath: '/src/auth/handler.ts',
        },
      ],
      deployments: [],
      deploymentRelationships: [],
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
        docs: [],
      },
      state: {
        aggregatedIR: mockIR,
        rendererOutputs: [
          {
            renderer: 'structurizr',
            format: 'png',
            files: [
              'structurizr-SystemContext.png',
              'structurizr-Containers.png',
              'structurizr-Components.png',
              'structurizr-Classes_compauth.png',
            ],
            timestamp: Date.now(),
          },
        ],
        docOutputs: [],
      },
      log: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    } as any;

    // Import the module under test after mocks are set up
    markdownDocs = (await import('../../../src/docs/builtin/markdown-docs.js')).default;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('markdownDocs', () => {
    it('generates README.md system overview page', async () => {
      await markdownDocs(mockContext);

      // Verify README.md was written
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('Generated system.md.njk content'),
        'utf8',
      );
    });

    it('generates individual component pages', async () => {
      await markdownDocs(mockContext);

      // Verify component pages were written
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining(`${sanitizeFileName('comp-auth.md')}`),
        expect.stringContaining('Generated component.md.njk content'),
        'utf8',
      );

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('comp-user.md'),
        expect.stringContaining('Generated component.md.njk content'),
        'utf8',
      );
    });

    it('creates output directory if it does not exist', async () => {
      await markdownDocs(mockContext);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(expect.any(String), {
        recursive: true,
      });

      // Verify it was called once
      expect(mockFs.mkdirSync).toHaveBeenCalledTimes(1);
    });

    it('configures nunjucks with template directory', async () => {
      await markdownDocs(mockContext);

      expect(mockNunjucks.configure).toHaveBeenCalledWith(
        expect.stringContaining('templates'),
        expect.objectContaining({
          autoescape: false,
          trimBlocks: true,
          lstripBlocks: true,
        }),
      );
    });

    it('adds custom nunjucks filters', async () => {
      await markdownDocs(mockContext);

      // Verify all custom filters were added
      expect(mockEnv.addFilter).toHaveBeenCalledWith('kebabCase', expect.any(Function));
      expect(mockEnv.addFilter).toHaveBeenCalledWith(
        'forwardSlashes',
        expect.any(Function),
      );
      expect(mockEnv.addFilter).toHaveBeenCalledWith('date', expect.any(Function));
      expect(mockEnv.addFilter).toHaveBeenCalledWith(
        'selectattr',
        expect.any(Function),
      );
      expect(mockEnv.addFilter).toHaveBeenCalledWith('map', expect.any(Function));
      expect(mockEnv.addFilter).toHaveBeenCalledWith('first', expect.any(Function));
    });

    it('renders system page with IR data and diagrams', async () => {
      await markdownDocs(mockContext);

      expect(mockEnv.render).toHaveBeenCalledWith(
        'system.md.njk',
        expect.objectContaining({
          system: mockContext.state.aggregatedIR?.system,
          actors: mockContext.state.aggregatedIR?.actors,
          containers: mockContext.state.aggregatedIR?.containers,
          components: mockContext.state.aggregatedIR?.components,
          systemDiagrams: expect.any(Array),
          containerDiagrams: expect.any(Array),
          componentDiagrams: expect.any(Array),
        }),
      );
    });

    it('renders component pages with component-specific data', async () => {
      await markdownDocs(mockContext);

      // Check first component
      expect(mockEnv.render).toHaveBeenCalledWith(
        'component.md.njk',
        expect.objectContaining({
          component: mockContext.state.aggregatedIR?.components[0],
          system: mockContext.state.aggregatedIR?.system,
          codeItems: expect.any(Array),
        }),
      );

      // Check second component
      expect(mockEnv.render).toHaveBeenCalledWith(
        'component.md.njk',
        expect.objectContaining({
          component: mockContext.state.aggregatedIR?.components[1],
        }),
      );
    });

    it('filters code items by component ID', async () => {
      await markdownDocs(mockContext);

      // Find the render call for comp-auth
      const authRenderCall = vi
        .mocked(mockEnv.render)
        .mock.calls.find((call) => call[1]?.component?.id === 'comp-auth');
      if (!authRenderCall || !authRenderCall[1]) {
        throw new Error('Mock render call for comp-auth not found');
      } else {
        expect(authRenderCall).toBeDefined();
        expect(authRenderCall![1].codeItems).toHaveLength(1);
        expect(authRenderCall![1].codeItems[0].id).toBe('code-auth-handler');
      }
    });

    it('updates pipeline state with generated files', async () => {
      await markdownDocs(mockContext);

      expect(mockContext.state.docOutputs).toHaveLength(1);
      expect(mockContext.state.docOutputs![0]).toMatchObject({
        generator: 'markdown-docs',
        format: 'markdown',
        files: expect.arrayContaining(['README.md', 'comp-auth.md', 'comp-user.md']),
        timestamp: expect.any(Number),
      });
    });

    it('initializes docOutputs array if undefined', async () => {
      mockContext.state.docOutputs = undefined;

      await markdownDocs(mockContext);

      expect(mockContext.state.docOutputs).toBeDefined();
      expect(Array.isArray(mockContext.state.docOutputs)).toBe(true);
    });

    it('prefers validatedIR over aggregatedIR', async () => {
      const validatedIR = {
        ...mockContext.state.aggregatedIR!,
        system: { name: 'Validated System' },
      };
      mockContext.state.validatedIR = validatedIR;

      await markdownDocs(mockContext);

      // Verify validatedIR was used
      expect(mockEnv.render).toHaveBeenCalledWith(
        'system.md.njk',
        expect.objectContaining({
          system: validatedIR.system,
        }),
      );
    });

    it('throws error when no IR data found', async () => {
      mockContext.state.aggregatedIR = undefined;
      mockContext.state.validatedIR = undefined;

      await expect(markdownDocs(mockContext)).rejects.toThrow(
        'No IR data found. Run extract and validate stages first.',
      );

      expect(mockContext.log.error).toHaveBeenCalledWith(
        'No IR data found in pipeline state',
      );
    });

    it('logs progress information', async () => {
      await markdownDocs(mockContext);

      expect(mockContext.log.info).toHaveBeenCalledWith(
        'Markdown Docs: generating documentation...',
      );
      expect(mockContext.log.info).toHaveBeenCalledWith(
        'Generating system overview page...',
      );
      expect(mockContext.log.info).toHaveBeenCalledWith(
        expect.stringContaining('Generating 2 component page(s)'),
      );
      expect(mockContext.log.info).toHaveBeenCalledWith('✓ Generated README.md');
      expect(mockContext.log.info).toHaveBeenCalledWith(
        expect.stringContaining('✓ Generated 2 component page(s)'),
      );
      expect(mockContext.log.info).toHaveBeenCalledWith('Markdown Docs: completed');
    });

    it('logs debug information about IR and renderers', async () => {
      await markdownDocs(mockContext);

      expect(mockContext.log.debug).toHaveBeenCalledWith(
        'Loaded IR: 2 components, 1 actors',
      );
      expect(mockContext.log.debug).toHaveBeenCalledWith('Found 1 renderer output(s)');
    });

    it('handles empty renderer outputs gracefully', async () => {
      mockContext.state.rendererOutputs = [];

      await markdownDocs(mockContext);

      // Should still generate docs, just without diagrams
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.any(String),
        'utf8',
      );
    });

    it('handles undefined renderer outputs gracefully', async () => {
      mockContext.state.rendererOutputs = undefined;

      await markdownDocs(mockContext);

      // Should still generate docs, just without diagrams
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.any(String),
        'utf8',
      );
    });

    it('looks for diagrams in docs_out/diagrams directory', async () => {
      await markdownDocs(mockContext);

      // Verify existsSync was called with paths in the diagrams directory
      const existsSyncCalls = vi.mocked(mockFs.existsSync).mock.calls;
      const diagramCalls = existsSyncCalls.filter((call: any[]) =>
        call[0].includes('diagrams'),
      );

      expect(diagramCalls.length).toBeGreaterThan(0);
    });
  });

  describe('custom nunjucks filters', () => {
    it('kebabCase filter converts strings to kebab-case', async () => {
      await markdownDocs(mockContext);

      const kebabCaseFilter = vi
        .mocked(mockEnv.addFilter)
        .mock.calls.find((call) => call[0] === 'kebabCase')![1] as (
        str: string,
      ) => string;

      expect(kebabCaseFilter('Hello World')).toBe('hello-world');
      expect(kebabCaseFilter('Test Component 123')).toBe('test-component-123');
      expect(kebabCaseFilter('Special@Chars#Here')).toBe('specialcharshere');
    });

    it('forwardSlashes filter converts backslashes to forward slashes', async () => {
      await markdownDocs(mockContext);

      const forwardSlashesFilter = vi
        .mocked(mockEnv.addFilter)
        .mock.calls.find((call) => call[0] === 'forwardSlashes')![1] as (
        str: string,
      ) => string;

      expect(forwardSlashesFilter('C:\\Users\\test\\file.txt')).toBe(
        'C:/Users/test/file.txt',
      );
      expect(forwardSlashesFilter('path/to/file')).toBe('path/to/file');
    });

    it('date filter formats dates correctly', async () => {
      await markdownDocs(mockContext);

      const dateFilter = vi
        .mocked(mockEnv.addFilter)
        .mock.calls.find((call) => call[0] === 'date')![1] as (
        date: Date,
        format: string,
      ) => string;

      const testDate = new Date('2023-05-15T14:30:45');
      expect(dateFilter(testDate, 'YYYY-MM-DD')).toBe('2023-05-15');
      expect(dateFilter(testDate, 'YYYY-MM-DD HH:mm:ss')).toBe('2023-05-15 14:30:45');
    });

    it('selectattr filter filters array by attribute value', async () => {
      await markdownDocs(mockContext);

      const selectattrFilter = vi
        .mocked(mockEnv.addFilter)
        .mock.calls.find((call) => call[0] === 'selectattr')![1] as (
        items: any[],
        attr: string,
        operator: string,
        value: any,
      ) => any[];

      const items = [
        { name: 'Alice', role: 'admin' },
        { name: 'Bob', role: 'user' },
        { name: 'Charlie', role: 'admin' },
      ];

      const result = selectattrFilter(items, 'role', 'equalto', 'admin');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Charlie');
    });

    it('map filter extracts attribute values from array', async () => {
      await markdownDocs(mockContext);

      const mapFilter = vi
        .mocked(mockEnv.addFilter)
        .mock.calls.find((call) => call[0] === 'map')![1] as (
        items: any[],
        keyword: string,
        attr: string,
      ) => any[];

      const items = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];

      const result = mapFilter(items, 'attribute', 'name');
      expect(result).toEqual(['Alice', 'Bob']);
    });

    it('first filter returns first element of array', async () => {
      await markdownDocs(mockContext);

      const firstFilter = vi
        .mocked(mockEnv.addFilter)
        .mock.calls.find((call) => call[0] === 'first')![1] as (
        items: any[] | null,
      ) => any;

      expect(firstFilter([1, 2, 3])).toBe(1);
      expect(firstFilter(['a', 'b', 'c'])).toBe('a');
      expect(firstFilter([])).toBeUndefined();
      expect(firstFilter(null)).toBeUndefined();
    });
  });

  describe('diagram finding logic', () => {
    it('finds system context diagrams', async () => {
      await markdownDocs(mockContext);

      // Verify existsSync was called for system diagrams
      const existsCalls = vi.mocked(mockFs.existsSync).mock.calls;
      const systemDiagramCheck = existsCalls.some((call: any[]) =>
        String(call[0]).includes('SystemContext'),
      );

      expect(systemDiagramCheck).toBe(true);
    });

    it('finds container diagrams', async () => {
      await markdownDocs(mockContext);

      const existsCalls = vi.mocked(mockFs.existsSync).mock.calls;
      const containerDiagramCheck = existsCalls.some((call: any[]) =>
        String(call[0]).includes('Containers'),
      );

      expect(containerDiagramCheck).toBe(true);
    });

    it('finds component diagrams', async () => {
      await markdownDocs(mockContext);

      const existsCalls = vi.mocked(mockFs.existsSync).mock.calls;
      const componentDiagramCheck = existsCalls.some((call: any[]) =>
        String(call[0]).includes('Components'),
      );

      expect(componentDiagramCheck).toBe(true);
    });

    it('finds class diagrams for components', async () => {
      await markdownDocs(mockContext);

      const existsCalls = vi.mocked(mockFs.existsSync).mock.calls;
      const classDiagramCheck = existsCalls.some((call: any[]) =>
        String(call[0]).includes('Classes'),
      );

      expect(classDiagramCheck).toBe(true);
    });

    it('skips non-existent diagrams', async () => {
      mockFs.existsSync = vi.fn((path: string) => {
        // Only SystemContext exists
        return String(path).includes('SystemContext');
      });

      await markdownDocs(mockContext);

      // Should still generate docs successfully
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.any(String),
        'utf8',
      );
    });

    it('filters out non-PNG renderer outputs', async () => {
      mockContext.state.rendererOutputs = [
        {
          renderer: 'structurizr',
          format: 'dsl',
          files: ['structurizr.dsl'],
          timestamp: Date.now(),
        },
        {
          renderer: 'plantuml',
          format: 'png',
          files: ['diagram.png'],
          timestamp: Date.now(),
        },
      ];

      await markdownDocs(mockContext);

      // Only PNG files should be checked
      const existsCalls = vi.mocked(mockFs.existsSync).mock.calls;
      const dslCheck = existsCalls.some((call: any[]) =>
        String(call[0]).includes('structurizr.dsl'),
      );

      expect(dslCheck).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles components without container', async () => {
      mockContext.state.aggregatedIR!.components[0].containerId = 'non-existent';

      await markdownDocs(mockContext);

      // Should still generate component page
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining(`${sanitizeFileName('comp-auth.md')}`),
        expect.any(String),
        'utf8',
      );
    });

    it('handles components with no code items', async () => {
      mockContext.state.aggregatedIR!.code = [];

      await markdownDocs(mockContext);

      // Verify empty code items array was passed
      const componentRenderCall = vi
        .mocked(mockEnv.render)
        .mock.calls.find((call) => call[0] === 'component.md.njk');

      expect(componentRenderCall).toBeDefined();
      expect(componentRenderCall![1].codeItems).toEqual([]);
    });

    it('handles zero components', async () => {
      mockContext.state.aggregatedIR!.components = [];

      await markdownDocs(mockContext);

      // Should generate README but no component pages
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.any(String),
        'utf8',
      );
    });

    it('handles component IDs with special characters', async () => {
      mockContext.state.aggregatedIR!.components = [
        {
          id: 'comp-auth-v2',
          containerId: 'api',
          name: 'Auth V2',
          type: 'module',
        },
      ];

      await markdownDocs(mockContext);
      const name = sanitizeFileName(mockContext.state.aggregatedIR!.components[0].id);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining(name),
        expect.any(String),
        'utf8',
      );
    });
  });
});

function sanitizeFileName(name: string): string {
  // Remove or replace characters not allowed in Windows or Linux filenames
  // Windows: \ / : * ? " < > |
  // Linux: /
  return name
    .replace(/[\\/:*?"<>|]/g, '-') // Replace invalid characters with hyphen
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\s+/g, '-') // Replace spaces with hyphen
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
}
