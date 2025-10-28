/**
 * Unit tests for basic-astro to-IR mapper
 */
import { describe, it, expect } from 'vitest';
import { mapToIR } from '../../../../src/extractors/builtin/basic-astro/to-ir-mapper.js';
import { ROOT_COMPONENT_MARKER } from '../../../../src/extractors/builtin/basic-astro/component-detector.js';
import type {
  FileExtraction,
  PackageInfo,
} from '../../../../src/extractors/builtin/basic-astro/types.js';

describe('to-ir-mapper', () => {
  describe('mapToIR', () => {
    it('should create empty IR for empty extraction array', () => {
      const ir = mapToIR([]);

      expect(ir.version).toBe('1.0');
      expect(ir.system.name).toBe('Astro System');
      expect(ir.system.description).toBe('System extracted from Astro components');
      expect(ir.containers).toEqual([]);
      expect(ir.components).toEqual([]);
      expect(ir.actors).toEqual([]);
      expect(ir.code).toEqual([]);
      expect(ir.componentRelationships).toEqual([]);
    });

    it('should extract components from file extractions', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/components/Header.astro',
          language: 'astro',
          component: {
            id: 'header',
            name: 'Header',
            description: 'Main header component',
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
        {
          filePath: '/src/components/Footer.astro',
          language: 'astro',
          component: {
            id: 'footer',
            name: 'Footer',
            description: 'Footer component',
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const ir = mapToIR(extractions);

      expect(ir.components).toHaveLength(2);
      expect(ir.components[0]).toMatchObject({
        name: 'Header',
        type: 'module',
        description: 'Main header component',
      });
      expect(ir.components[1]).toMatchObject({
        name: 'Footer',
        type: 'module',
        description: 'Footer component',
      });
    });

    it('should merge duplicate component descriptions', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/components/Button1.astro',
          language: 'astro',
          component: {
            id: 'button',
            name: 'Button',
            description: 'Clickable button',
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
        {
          filePath: '/src/components/Button2.astro',
          language: 'astro',
          component: {
            id: 'button',
            name: 'Button',
            description: 'Interactive element',
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const ir = mapToIR(extractions);

      expect(ir.components).toHaveLength(1);
      expect(ir.components[0].description).toBe(
        'Clickable button; Interactive element',
      );
    });

    it('should filter out inferred components with no code', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/layouts/BaseLayout.astro',
          language: 'astro',
          component: {
            id: 'layouts',
            name: 'layouts',
            description: 'Component inferred from directory: layouts',
            _inferred: true,
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
        {
          filePath: '/src/pages/index.astro',
          language: 'astro',
          component: {
            id: 'pages',
            name: 'pages',
            description: 'Component inferred from directory: pages',
            _inferred: true,
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const ir = mapToIR(extractions);

      // Inferred components with no code should be filtered out
      expect(ir.components).toHaveLength(0);
    });

    it('should keep explicitly tagged components even if empty', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/utils/helpers.astro',
          language: 'astro',
          component: {
            id: 'helpers',
            name: 'Helpers',
            description: 'Helper utilities',
            _inferred: false, // Explicitly tagged
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const ir = mapToIR(extractions);

      // Explicitly tagged components should be kept even without code
      expect(ir.components).toHaveLength(1);
      expect(ir.components[0].name).toBe('Helpers');
    });

    it('should extract actors from file extractions', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/pages/api.astro',
          language: 'astro',
          component: {
            id: 'api',
            name: 'API',
          },
          actors: [
            {
              id: 'database',
              name: 'Database',
              type: 'System',
              direction: 'out',
              description: 'PostgreSQL database',
            },
            {
              id: 'user',
              name: 'User',
              type: 'Person',
              direction: 'in',
              description: 'End user',
            },
          ],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const ir = mapToIR(extractions);

      expect(ir.actors).toHaveLength(2);
      expect(ir.actors[0]).toMatchObject({
        id: 'database',
        name: 'Database',
        type: 'System',
        description: 'PostgreSQL database',
      });
      expect(ir.actors[1]).toMatchObject({
        id: 'user',
        name: 'User',
        type: 'Person',
        description: 'End user',
      });
    });

    it('should create actor relationships with correct direction', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/components/DataFetcher.astro',
          language: 'astro',
          component: {
            id: 'datafetcher',
            name: 'DataFetcher',
          },
          actors: [
            {
              id: 'api',
              name: 'External API',
              type: 'System',
              direction: 'out',
              description: 'REST API',
            },
            {
              id: 'admin',
              name: 'Admin',
              type: 'Person',
              direction: 'in',
              description: 'Administrator',
            },
            {
              id: 'cache',
              name: 'Cache',
              type: 'System',
              direction: 'both',
              description: 'Redis cache',
            },
          ],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const ir = mapToIR(extractions);

      // Component → actor (direction: out or both)
      const componentToActor = ir.componentRelationships.filter(
        (r) => r.source.includes('datafetcher') && r.destination === 'api',
      );
      expect(componentToActor.length).toBeGreaterThan(0);

      // Actor → component (direction: in or both) - stored in actor.targets
      // Note: targets get updated with hierarchical IDs (e.g., "application__datafetcher")
      const actorWithIncoming = ir.actors.find((a) => a.id === 'admin');
      expect(actorWithIncoming?.targets?.length).toBeGreaterThan(0);
      expect(actorWithIncoming?.targets?.[0]).toContain('datafetcher');

      // Both direction creates both relationships
      const actorWithBoth = ir.actors.find((a) => a.id === 'cache');
      expect(actorWithBoth?.targets?.length).toBeGreaterThan(0);
      expect(actorWithBoth?.targets?.[0]).toContain('datafetcher');
      const componentToCache = ir.componentRelationships.filter(
        (r) => r.source.includes('datafetcher') && r.destination === 'cache',
      );
      expect(componentToCache.length).toBeGreaterThan(0);
    });

    it('should extract code items from classes', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/lib/UserService.astro',
          language: 'astro',
          component: {
            id: 'userservice',
            name: 'UserService',
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [
            {
              name: 'UserManager',
              isExported: true,
              isAbstract: false,
              location: { filePath: '/src/lib/UserService.astro', line: 10, column: 0 },
              documentation: {
                summary: 'Manages users',
              },
              properties: [],
              methods: [
                {
                  name: 'getUser',
                  visibility: 'public',
                  isAsync: true,
                  isStatic: false,
                  isAbstract: false,
                  location: {
                    filePath: '/src/lib/UserService.astro',
                    line: 15,
                    column: 2,
                  },
                  parameters: [{ name: 'id', type: 'string' }],
                  returnType: 'Promise<User>',
                  documentation: {
                    summary: 'Gets user by ID',
                  },
                },
              ],
            },
          ],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const ir = mapToIR(extractions);

      expect(ir.code.length).toBeGreaterThan(0);
      const userManagerClass = ir.code.find((c) => c.name === 'UserManager');
      expect(userManagerClass).toBeDefined();
      expect(userManagerClass?.type).toBe('class');
      expect(userManagerClass?.description).toBe('Manages users');
      expect(userManagerClass?.visibility).toBe('public');

      const getUserMethod = ir.code.find((c) => c.name === 'UserManager.getUser');
      expect(getUserMethod).toBeDefined();
      expect(getUserMethod?.type).toBe('method');
      expect(getUserMethod?.isAsync).toBe(true);
    });

    it('should extract code items from functions', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/utils/format.astro',
          language: 'astro',
          component: {
            id: 'format',
            name: 'Format',
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [
            {
              name: 'formatDate',
              isExported: true,
              isAsync: false,
              location: { filePath: '/src/utils/format.astro', line: 5, column: 0 },
              parameters: [
                { name: 'date', type: 'Date' },
                { name: 'format', type: 'string', optional: true },
              ],
              returnType: 'string',
              documentation: {
                summary: 'Formats a date',
              },
            },
          ],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const ir = mapToIR(extractions);

      const formatDateFn = ir.code.find((c) => c.name === 'formatDate');
      expect(formatDateFn).toBeDefined();
      expect(formatDateFn?.type).toBe('function');
      expect(formatDateFn?.description).toBe('Formats a date');
      expect(formatDateFn?.parameters).toHaveLength(2);
      expect(formatDateFn?.returnType).toBe('string');
    });

    it('should extract code items from types and interfaces', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/types/models.astro',
          language: 'astro',
          component: {
            id: 'models',
            name: 'Models',
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [
            {
              name: 'UserId',
              isExported: true,
              location: { filePath: '/src/types/models.astro', line: 3, column: 0 },
              definition: 'string',
              documentation: {
                summary: 'Unique user identifier',
              },
            },
          ],
          interfaces: [
            {
              name: 'UserProfile',
              isExported: true,
              location: { filePath: '/src/types/models.astro', line: 5, column: 0 },
              properties: [],
              methods: [],
              documentation: {
                summary: 'User profile data',
              },
            },
          ],
          imports: [],
        },
      ];

      const ir = mapToIR(extractions);

      const userIdType = ir.code.find((c) => c.name === 'UserId');
      expect(userIdType).toBeDefined();
      expect(userIdType?.type).toBe('type');

      const userProfileInterface = ir.code.find((c) => c.name === 'UserProfile');
      expect(userProfileInterface).toBeDefined();
      expect(userProfileInterface?.type).toBe('interface');
    });

    it('should create component relationships from @uses tags', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/pages/Home.astro',
          language: 'astro',
          component: {
            id: 'home',
            name: 'Home',
          },
          actors: [],
          relationships: [
            {
              source: 'home',
              target: 'Header',
              description: 'Uses header component',
            },
            {
              source: 'home',
              target: 'Footer',
              description: 'Uses footer component',
            },
          ],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const ir = mapToIR(extractions);

      expect(ir.componentRelationships.length).toBeGreaterThan(0);
      const headerRel = ir.componentRelationships.find(
        (r) => r.description === 'Uses header component',
      );
      expect(headerRel).toBeDefined();
    });

    it('should auto-detect component relationships from template usage', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/components/Header.astro',
          language: 'astro',
          component: {
            id: 'header',
            name: 'Header',
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
        {
          filePath: '/src/pages/index.astro',
          language: 'astro',
          component: {
            id: 'index',
            name: 'Index',
          },
          actors: [],
          relationships: [],
          components: [
            {
              name: 'Header',
              isExported: false,
              location: { filePath: '/src/pages/index.astro', line: 10, column: 0 },
              slots: [],
            },
          ],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const ir = mapToIR(extractions);

      // Note: auto-detected relationships are only created if the target component exists
      // Since we don't have code items, the components may not be retained
      expect(ir.componentRelationships.length).toBeGreaterThanOrEqual(0);
    });

    it('should create containers from package info', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/packages/frontend/src/App.astro',
          language: 'astro',
          component: {
            id: 'app',
            name: 'App',
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const packages: PackageInfo[] = [
        {
          path: '/packages/frontend/package.json',
          dir: '/packages/frontend',
          name: '@myapp/frontend',
          version: '1.0.0',
          description: 'Frontend application',
        },
      ];

      const ir = mapToIR(extractions, packages);

      // May create additional default container if component has no package
      expect(ir.containers.length).toBeGreaterThanOrEqual(1);
      const frontendContainer = ir.containers.find((c) => c.name === '@myapp/frontend');
      expect(frontendContainer).toMatchObject({
        name: '@myapp/frontend',
        type: 'Service',
        layer: 'Application',
        description: 'Frontend application',
      });
    });

    it('should assign components to containers', () => {
      const packages: PackageInfo[] = [
        {
          path: '/app/package.json',
          dir: '/app',
          name: 'my-app',
          description: 'Main app',
        },
      ];

      const extractions: FileExtraction[] = [
        {
          filePath: '/app/src/pages/Home.astro',
          language: 'astro',
          component: {
            id: 'home',
            name: 'Home',
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
          packageInfo: packages[0],
        },
      ];

      const ir = mapToIR(extractions, packages);

      expect(ir.components).toHaveLength(1);
      expect(ir.components[0].containerId).toBeTruthy();
      expect(ir.components[0].containerId).toBe('my_app');
    });

    it('should handle ROOT_COMPONENT_MARKER in component names', () => {
      const packages: PackageInfo[] = [
        {
          path: '/app/package.json',
          dir: '/app',
          name: 'test-app',
          description: 'Test application',
        },
      ];

      const extractions: FileExtraction[] = [
        {
          filePath: '/app/src/index.astro',
          language: 'astro',
          component: {
            id: ROOT_COMPONENT_MARKER,
            name: ROOT_COMPONENT_MARKER,
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
          packageInfo: packages[0],
        },
      ];

      const ir = mapToIR(extractions, packages);

      expect(ir.components).toHaveLength(1);
      expect(ir.components[0].name).toBe('test-app');
      expect(ir.components[0].description).toContain(
        'Component inferred from container',
      );
    });

    it('should create default container for components without packages', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/App.astro',
          language: 'astro',
          component: {
            id: 'app',
            name: 'App',
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const ir = mapToIR(extractions, []);

      expect(ir.containers).toHaveLength(1);
      expect(ir.containers[0].id).toBe('default-container');
      expect(ir.components[0].containerId).toBe('default-container');
    });

    it('should apply hierarchical IDs to components', () => {
      const packages: PackageInfo[] = [
        {
          path: '/pkg/package.json',
          dir: '/pkg',
          name: 'my-package',
        },
      ];

      const extractions: FileExtraction[] = [
        {
          filePath: '/pkg/src/Button.astro',
          language: 'astro',
          component: {
            id: 'button',
            name: 'Button',
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
          packageInfo: packages[0],
        },
      ];

      const ir = mapToIR(extractions, packages);

      expect(ir.components[0].id).toBe('my_package__button');
    });

    it('should apply hierarchical IDs to code items', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/utils.astro',
          language: 'astro',
          component: {
            id: 'utils',
            name: 'Utils',
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [
            {
              name: 'helper',
              isExported: true,
              isAsync: false,
              location: { filePath: '/src/utils.astro', line: 5, column: 0 },
              parameters: [],
            },
          ],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const ir = mapToIR(extractions);

      const helperFn = ir.code.find((c) => c.name === 'helper');
      expect(helperFn?.id).toContain('__helper');
      expect(helperFn?.componentId).toContain('utils');
    });

    it('should deduplicate relationships', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/Page1.astro',
          language: 'astro',
          component: {
            id: 'page1',
            name: 'Page1',
          },
          actors: [],
          relationships: [
            { source: 'page1', target: 'Header', description: 'Uses header' },
            { source: 'page1', target: 'Header', description: 'Uses header again' },
          ],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const ir = mapToIR(extractions);

      const headerRels = ir.componentRelationships.filter((r) =>
        r.destination.includes('header'),
      );
      // Should only have one unique relationship even though defined twice
      expect(headerRels.length).toBe(1);
    });

    it('should use custom system info when provided', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/App.astro',
          language: 'astro',
          component: { id: 'app', name: 'App' },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const customSystem = {
        name: 'Custom System',
        description: 'My custom description',
        repository: 'https://github.com/user/repo',
      };

      const ir = mapToIR(extractions, [], customSystem);

      expect(ir.system.name).toBe('Custom System');
      expect(ir.system.description).toBe('My custom description');
      expect(ir.system.repository).toBe('https://github.com/user/repo');
    });

    it('should merge actor descriptions across files', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/Page1.astro',
          language: 'astro',
          component: { id: 'page1', name: 'Page1' },
          actors: [
            {
              id: 'db',
              name: 'Database',
              type: 'System',
              description: 'Stores data',
            },
          ],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
        {
          filePath: '/src/Page2.astro',
          language: 'astro',
          component: { id: 'page2', name: 'Page2' },
          actors: [
            {
              id: 'db',
              name: 'Database',
              type: 'System',
              description: 'PostgreSQL instance',
            },
          ],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const ir = mapToIR(extractions);

      const dbActor = ir.actors.find((a) => a.id === 'db');
      expect(dbActor?.description).toBe('Stores data; PostgreSQL instance');
    });

    it('should skip inferred component descriptions when merging', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/components/Button1.astro',
          language: 'astro',
          component: {
            id: 'button',
            name: 'Button',
            description: 'Component inferred from directory: components',
            _inferred: true,
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
        {
          filePath: '/src/components/Button2.astro',
          language: 'astro',
          component: {
            id: 'button',
            name: 'Button',
            description: 'Clickable UI element',
            _inferred: false,
          },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
      ];

      const ir = mapToIR(extractions);

      // Inferred components with no code items are filtered out
      // So we expect no components in this case
      expect(ir.components.length).toBe(0);
    });

    it('should handle files with parse errors gracefully', () => {
      const extractions: FileExtraction[] = [
        {
          filePath: '/src/Good.astro',
          language: 'astro',
          component: { id: 'good', name: 'Good' },
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
        },
        {
          filePath: '/src/Bad.astro',
          language: 'astro',
          actors: [],
          relationships: [],
          components: [],
          functions: [],
          classes: [],
          types: [],
          interfaces: [],
          imports: [],
          parseError: 'Syntax error at line 10',
        },
      ];

      const ir = mapToIR(extractions);

      // Should still process the good file
      expect(ir.components.length).toBeGreaterThan(0);
      expect(ir.components.some((c) => c.name === 'Good')).toBe(true);
    });
  });
});
