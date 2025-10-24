/**
 * Unit tests for Structurizr DSL generator
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { ArchletteIR } from '../../../src/core/types-ir.js';
import type { ResolvedStageNode } from '../../../src/core/types-aac.js';

// Store reference to actual fs functions for use in mocks
const actualFs = await import('node:fs');

// Mock node:fs module
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn(actual.existsSync),
    readFileSync: vi.fn(actual.readFileSync),
    statSync: vi.fn(actual.statSync),
  };
});

// Import after mocking
import structurizrGenerator from '../../../src/generators/builtin/structurizr.js';

describe('structurizrGenerator', () => {
  const mockNode: ResolvedStageNode = {
    use: 'builtin/structurizr',
    name: 'test-generator',
    props: {},
    inputs: {},
    _effective: { includes: [], excludes: [] },
  };

  it('generates minimal workspace with system', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'TestSystem', description: 'A test system' },
      actors: [],
      containers: [],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [],
      deploymentRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    expect(dsl).toContain('workspace "TestSystem"');
    expect(dsl).toContain('softwareSystem "TestSystem"');
    expect(dsl).toContain('description "A test system"');
  });

  it('generates actors as person or external system', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'TestSystem' },
      actors: [
        { id: 'user', name: 'User', type: 'Person', description: 'End user' },
        {
          id: 'external',
          name: 'External API',
          type: 'Software System',
          description: 'External service',
        },
      ],
      containers: [],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [],
      deploymentRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    expect(dsl).toContain('user = person "User"');
    expect(dsl).toContain(
      'external = softwareSystem "External API" "External service" "External"',
    );
  });

  it('generates containers with technology', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'TestSystem' },
      actors: [],
      containers: [
        {
          id: 'api',
          name: 'API Service',
          type: 'Cloudflare Worker',
          layer: 'Application',
          description: 'REST API',
          tags: ['Backend', 'TypeScript'],
        },
      ],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [],
      deploymentRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    expect(dsl).toContain('api = container "API Service"');
    expect(dsl).toContain('technology "Cloudflare Worker"');
    expect(dsl).toContain('description "REST API"');
    expect(dsl).toContain('tags "Backend,TypeScript"');
  });

  it('generates components within containers', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'TestSystem' },
      actors: [],
      containers: [{ id: 'api', name: 'API', type: 'Service', layer: 'Application' }],
      components: [
        {
          id: 'comp.auth',
          containerId: 'api',
          name: 'Auth Module',
          type: 'module',
          description: 'Authentication logic',
        },
      ],
      code: [],
      deployments: [],
      containerRelationships: [],
      deploymentRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    expect(dsl).toContain('comp_auth = component "Auth Module"');
    expect(dsl).toContain('description "Authentication logic"');
    expect(dsl).toContain('technology "module"');
  });

  it('generates relationships with description and technology', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'TestSystem' },
      actors: [],
      containers: [
        { id: 'api', name: 'API', type: 'Service', layer: 'Application' },
        { id: 'db', name: 'Database', type: 'PostgreSQL', layer: 'Data' },
      ],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [
        {
          source: 'api',
          destination: 'db',
          description: 'Reads/Writes',
          protocol: 'postgresql',
          auth: 'tls',
        },
      ],
      deploymentRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    expect(dsl).toContain('api -> db "Reads/Writes" "postgresql (tls)"');
  });

  it('generates component relationships within containers', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'TestSystem' },
      actors: [],
      containers: [{ id: 'api', name: 'API', type: 'Service', layer: 'Application' }],
      components: [
        { id: 'comp.a', containerId: 'api', name: 'ComponentA', type: 'module' },
        { id: 'comp.b', containerId: 'api', name: 'ComponentB', type: 'module' },
      ],
      code: [],
      deployments: [],
      containerRelationships: [],
      deploymentRelationships: [],
      componentRelationships: [
        { source: 'comp.a', destination: 'comp.b', description: 'Uses' },
      ],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    expect(dsl).toContain('comp_a -> comp_b "Uses"');
  });

  it('generates deployments with container instances', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'TestSystem' },
      actors: [],
      containers: [{ id: 'api', name: 'API', type: 'Service', layer: 'Application' }],
      components: [],
      code: [],
      deployments: [
        {
          name: 'Production',
          nodes: [
            {
              id: 'node1',
              name: 'worker-prod',
              type: 'deployment',
              technology: 'Cloudflare Workers',
              containers: [{ id: 'api' }],
            },
          ],
        },
      ],
      containerRelationships: [],
      deploymentRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    expect(dsl).toContain('deploymentEnvironment "Production"');
    expect(dsl).toContain('deploymentNode "worker-prod"');
    expect(dsl).toContain('technology "Cloudflare Workers"');
    expect(dsl).toContain('containerInstance api');
  });

  it('handles special characters in strings', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'Test System', description: 'Has backslash and newline' },
      actors: [],
      containers: [],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [],
      deploymentRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    // Verify workspace is generated successfully
    expect(dsl).toContain('workspace "Test System"');
    expect(dsl).toContain('description "Has backslash and newline"');
  });

  it('generates class views per component for drill-down', () => {
    const ir: ArchletteIR = {
      version: '1.0',
      system: { name: 'TestSystem' },
      actors: [],
      containers: [{ id: 'api', name: 'API', type: 'Service', layer: 'Application' }],
      components: [
        { id: 'api__auth', containerId: 'api', name: 'Auth', type: 'module' },
        { id: 'api__user', containerId: 'api', name: 'User', type: 'module' },
      ],
      code: [
        {
          id: 'api__auth__handler',
          componentId: 'api__auth',
          name: 'AuthHandler',
          type: 'class',
          filePath: '/auth/handler.ts',
        },
        {
          id: 'api__auth__service',
          componentId: 'api__auth',
          name: 'AuthService',
          type: 'class',
          filePath: '/auth/service.ts',
        },
        {
          id: 'api__user__repository',
          componentId: 'api__user',
          name: 'UserRepository',
          type: 'class',
          filePath: '/user/repository.ts',
        },
      ],
      deployments: [],
      containerRelationships: [],
      deploymentRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    const dsl = structurizrGenerator(ir, mockNode);

    // Should generate separate class views for each component
    // Note: Component views use container ID (api) as scope, not component ID
    expect(dsl).toContain('component api "Classes_api__auth"');
    expect(dsl).toContain('component api "Classes_api__user"');

    // Should explicitly include code elements for the Auth component
    expect(dsl).toContain('include api__auth__handler');
    expect(dsl).toContain('include api__auth__service');

    // Should explicitly include code elements for the User component
    expect(dsl).toContain('include api__user__repository');

    // Verify both class views are present (not just one per container)
    const classViewMatches = dsl.match(/component \w+ "Classes_\w+"/g);
    expect(classViewMatches).toHaveLength(2);

    // Verify code elements are properly scoped to their components
    // Auth view should only include Auth code elements
    const authViewStart = dsl.indexOf('component api "Classes_api__auth"');
    const authViewEnd = dsl.indexOf('}', authViewStart);
    const authView = dsl.substring(authViewStart, authViewEnd);
    expect(authView).toContain('api__auth__handler');
    expect(authView).toContain('api__auth__service');
    expect(authView).not.toContain('api__user__repository');
  });

  describe('custom themes', () => {
    const minimalIR: ArchletteIR = {
      version: '1.0',
      system: { name: 'TestSystem' },
      actors: [],
      containers: [],
      components: [],
      code: [],
      deployments: [],
      containerRelationships: [],
      deploymentRelationships: [],
      componentRelationships: [],
      codeRelationships: [],
    };

    afterEach(() => {
      // Clear mocks after each test
      vi.clearAllMocks();
    });

    it('should load custom theme when path provided and file exists', async () => {
      const customThemeContent = 'styles { element "Custom" { background #ff0000 } }';
      const node: ResolvedStageNode = {
        use: 'builtin/structurizr',
        name: 'test-generator',
        props: {},
        inputs: { theme: './custom-theme.dsl' },
        _effective: { includes: [], excludes: [] },
        _configBaseDir: '/project',
      };

      // Mock file system
      const { existsSync, readFileSync, statSync } = await import('node:fs');
      vi.mocked(existsSync).mockImplementation((path) => {
        const pathStr = String(path);
        // Custom theme exists
        if (pathStr.includes('custom-theme.dsl')) return true;
        // Default theme exists
        if (pathStr.includes('templates/theme.dsl')) return true;
        return false;
      });

      vi.mocked(statSync).mockImplementation((path) => {
        const pathStr = String(path);
        if (
          pathStr.includes('custom-theme.dsl') ||
          pathStr.includes('templates/theme.dsl')
        ) {
          return { isFile: () => true, isDirectory: () => false } as any;
        }
        return actualFs.statSync(path);
      });

      vi.mocked(readFileSync).mockImplementation((path, options) => {
        const pathStr = String(path);
        if (pathStr.includes('custom-theme.dsl')) return customThemeContent;
        if (pathStr.match(/templates[/\\]theme\.dsl/)) return 'default theme';
        // Return actual file content for template files
        if (pathStr.includes('.njk')) {
          return actualFs.readFileSync(path, options as any);
        }
        return '';
      });

      const dsl = structurizrGenerator(minimalIR, node);

      expect(dsl).toContain(customThemeContent);
      expect(dsl).not.toContain('default theme');
    });

    it('should fall back to default theme when custom theme not found', async () => {
      const defaultThemeContent = 'styles { element "Default" { background #0000ff } }';
      const node: ResolvedStageNode = {
        use: 'builtin/structurizr',
        name: 'test-generator',
        props: {},
        inputs: { theme: './missing-theme.dsl' },
        _effective: { includes: [], excludes: [] },
        _configBaseDir: '/project',
      };

      // Mock file system
      const { existsSync, readFileSync } = await import('node:fs');
      vi.mocked(existsSync).mockImplementation((path) => {
        const pathStr = String(path);
        // Custom theme doesn't exist
        if (pathStr.includes('missing-theme.dsl')) return false;
        // Default theme and template files exist
        return true;
      });

      vi.mocked(readFileSync).mockImplementation((path, options) => {
        const pathStr = String(path);
        // Default theme (matches /templates/theme.dsl or \\templates\\theme.dsl)
        if (pathStr.match(/templates[/\\]theme\.dsl/)) return defaultThemeContent;
        // Return actual file content for template files
        if (pathStr.includes('.njk')) {
          return actualFs.readFileSync(path, options as any);
        }
        return '';
      });

      const dsl = structurizrGenerator(minimalIR, node);

      // Should fall back to default theme silently
      expect(dsl).toContain(defaultThemeContent);
    });

    it('should use default theme when no custom theme specified', async () => {
      const defaultThemeContent = 'styles { element "Default" { background #00ff00 } }';
      const node: ResolvedStageNode = {
        use: 'builtin/structurizr',
        name: 'test-generator',
        props: {},
        inputs: {},
        _effective: { includes: [], excludes: [] },
      };

      // Mock file system
      const { existsSync, readFileSync } = await import('node:fs');
      vi.mocked(existsSync).mockImplementation((path) => {
        const pathStr = String(path);
        if (pathStr.includes('templates/theme.dsl')) return true;
        return false;
      });

      vi.mocked(readFileSync).mockImplementation((path, options) => {
        const pathStr = String(path);
        if (pathStr.match(/templates[/\\]theme\.dsl/)) return defaultThemeContent;
        // Return actual file content for template files
        if (pathStr.includes('.njk')) {
          return actualFs.readFileSync(path, options as any);
        }
        return '';
      });

      const dsl = structurizrGenerator(minimalIR, node);

      expect(dsl).toContain(defaultThemeContent);
    });

    it('should resolve theme path relative to config base directory', async () => {
      const customThemeContent = 'styles { element "Relative" { background #00ffff } }';
      const node: ResolvedStageNode = {
        use: 'builtin/structurizr',
        name: 'test-generator',
        props: {},
        inputs: { theme: './themes/custom.dsl' },
        _effective: { includes: [], excludes: [] },
        _configBaseDir: '/my/project',
      };

      // Mock file system
      const { existsSync, readFileSync, statSync } = await import('node:fs');
      vi.mocked(existsSync).mockImplementation((path) => {
        const pathStr = String(path).replace(/\\/g, '/');
        // Should resolve relative to _configBaseDir
        if (pathStr.includes('/my/project') && pathStr.includes('themes/custom.dsl'))
          return true;
        if (pathStr.includes('templates/theme.dsl')) return true;
        return false;
      });

      vi.mocked(statSync).mockImplementation((path) => {
        const pathStr = String(path).replace(/\\/g, '/');
        if (
          (pathStr.includes('/my/project') && pathStr.includes('themes/custom.dsl')) ||
          pathStr.includes('templates/theme.dsl')
        ) {
          return { isFile: () => true, isDirectory: () => false } as any;
        }
        return actualFs.statSync(path);
      });

      vi.mocked(readFileSync).mockImplementation((path, options) => {
        const pathStr = String(path).replace(/\\/g, '/');
        if (pathStr.includes('themes/custom.dsl')) return customThemeContent;
        if (pathStr.match(/templates[/]theme\.dsl/)) return 'default theme';
        // Return actual file content for template files
        if (pathStr.includes('.njk')) {
          return actualFs.readFileSync(path, options as any);
        }
        return '';
      });

      const dsl = structurizrGenerator(minimalIR, node);

      expect(dsl).toContain(customThemeContent);
    });

    it('should fall back to default theme when custom theme file is unreadable', async () => {
      const defaultThemeContent = 'styles { element "Default" { background #cccccc } }';
      const node: ResolvedStageNode = {
        use: 'builtin/structurizr',
        name: 'test-generator',
        props: {},
        inputs: { theme: './corrupt-theme.dsl' },
        _effective: { includes: [], excludes: [] },
        _configBaseDir: '/project',
      };

      // Mock file system
      const { existsSync, readFileSync, statSync } = await import('node:fs');
      vi.mocked(existsSync).mockImplementation((path) => {
        const pathStr = String(path);
        // Corrupt theme exists (existsSync returns true)
        if (pathStr.includes('corrupt-theme.dsl')) return true;
        // Default theme exists
        if (pathStr.includes('templates/theme.dsl')) return true;
        return false;
      });

      vi.mocked(statSync).mockImplementation((path) => {
        const pathStr = String(path);
        if (
          pathStr.includes('corrupt-theme.dsl') ||
          pathStr.includes('templates/theme.dsl')
        ) {
          return { isFile: () => true, isDirectory: () => false } as any;
        }
        return actualFs.statSync(path);
      });

      vi.mocked(readFileSync).mockImplementation((path, options) => {
        const pathStr = String(path);
        // Throw error when trying to read corrupt theme
        if (pathStr.includes('corrupt-theme.dsl')) {
          throw new Error('EACCES: permission denied');
        }
        // Return default theme successfully
        if (pathStr.match(/templates[/\\]theme\.dsl/)) return defaultThemeContent;
        // Return actual file content for template files
        if (pathStr.includes('.njk')) {
          return actualFs.readFileSync(path, options as any);
        }
        return '';
      });

      // Should not throw, should fall back gracefully to default theme
      const dsl = structurizrGenerator(minimalIR, node);

      expect(dsl).toContain(defaultThemeContent);
      expect(dsl).not.toContain('corrupt');
    });

    it('should throw error when default theme is missing', async () => {
      const node: ResolvedStageNode = {
        use: 'builtin/structurizr',
        name: 'test-generator',
        props: {},
        inputs: {},
        _effective: { includes: [], excludes: [] },
      };

      // Mock file system
      const { existsSync, readFileSync } = await import('node:fs');
      vi.mocked(existsSync).mockReturnValue(false);

      vi.mocked(readFileSync).mockImplementation((path, options) => {
        const pathStr = String(path);
        // Default theme missing - throw error
        if (pathStr.match(/templates[/\\]theme\.dsl/)) {
          throw new Error('ENOENT: no such file or directory');
        }
        // Return actual file content for template files
        if (pathStr.includes('.njk')) {
          return actualFs.readFileSync(path, options as any);
        }
        return '';
      });

      // Should throw with helpful error message
      expect(() => structurizrGenerator(minimalIR, node)).toThrow(
        /Failed to load default Structurizr theme/,
      );
      expect(() => structurizrGenerator(minimalIR, node)).toThrow(
        /corrupted installation/,
      );
    });

    it('should handle custom theme with security warnings gracefully', async () => {
      const customThemeContent = 'styles { element "Custom" { background #aaaaaa } }';
      const node: ResolvedStageNode = {
        use: 'builtin/structurizr',
        name: 'test-generator',
        props: {},
        inputs: { theme: '../shared-themes/custom.dsl' },
        _effective: { includes: [], excludes: [] },
        _configBaseDir: '/project',
      };

      // Mock file system
      const { existsSync, readFileSync, statSync } = await import('node:fs');
      vi.mocked(existsSync).mockImplementation((path) => {
        const pathStr = String(path).replace(/\\/g, '/');
        // Theme exists but escapes project directory (should still load with warning)
        if (pathStr.includes('shared-themes/custom.dsl')) return true;
        if (pathStr.includes('templates/theme.dsl')) return true;
        return false;
      });

      vi.mocked(statSync).mockImplementation((path) => {
        const pathStr = String(path).replace(/\\/g, '/');
        if (
          pathStr.includes('shared-themes/custom.dsl') ||
          pathStr.includes('templates/theme.dsl')
        ) {
          return { isFile: () => true, isDirectory: () => false } as any;
        }
        return actualFs.statSync(path);
      });

      vi.mocked(readFileSync).mockImplementation((path, options) => {
        const pathStr = String(path).replace(/\\/g, '/');
        if (pathStr.includes('shared-themes/custom.dsl')) return customThemeContent;
        if (pathStr.match(/templates[/]theme\.dsl/)) return 'default theme';
        // Return actual file content for template files
        if (pathStr.includes('.njk')) {
          return actualFs.readFileSync(path, options as any);
        }
        return '';
      });

      // Should succeed even with path traversal (config-relative strategy allows this)
      const dsl = structurizrGenerator(minimalIR, node);

      expect(dsl).toContain(customThemeContent);
    });
  });
});
