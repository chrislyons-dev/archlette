/**
 * Tests for basic-astro component-detector module
 */

import { describe, it, expect } from 'vitest';
import {
  extractFileComponent,
  extractFileActors,
  extractFileRelationships,
  ROOT_COMPONENT_MARKER,
} from '../../../../src/extractors/builtin/basic-astro/component-detector.js';

describe('basic-astro component-detector', () => {
  describe('extractFileComponent', () => {
    it('should extract component from @component tag', () => {
      const frontmatter = `
/**
 * This is a layout component
 * @component Layout
 */
import Header from './Header.astro';
      `.trim();

      const result = extractFileComponent(
        frontmatter,
        '/path/to/components/Layout.astro',
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('Layout');
      expect(result?.id).toBe('layout');
      expect(result?.description).toBe('This is a layout component');
    });

    it('should extract component from @module tag', () => {
      const frontmatter = `
/**
 * Authentication utilities
 * @module auth/utils
 */
      `.trim();

      const result = extractFileComponent(frontmatter, '/path/to/auth/utils.astro');

      expect(result).toBeDefined();
      // Module path "auth/utils" extracts directory part "auth" for deduplication
      expect(result?.name).toBe('auth');
      expect(result?.id).toBe('auth');
    });

    it('should extract component from @namespace tag', () => {
      const frontmatter = `
/**
 * UI Components
 * @namespace UI
 */
      `.trim();

      const result = extractFileComponent(frontmatter, '/path/to/ui/Button.astro');

      expect(result).toBeDefined();
      expect(result?.name).toBe('UI');
      expect(result?.id).toBe('ui');
    });

    it('should prioritize @component over @module and @namespace', () => {
      const frontmatter = `
/**
 * Test component
 * @component MyComponent
 * @module some/module
 * @namespace SomeNamespace
 */
      `.trim();

      const result = extractFileComponent(frontmatter, '/path/to/test.astro');

      expect(result).toBeDefined();
      expect(result?.name).toBe('MyComponent');
    });

    it('should infer component from parent directory when no JSDoc tags', () => {
      const frontmatter = `
const greeting = 'Hello';
      `.trim();

      const result = extractFileComponent(
        frontmatter,
        '/path/to/components/Button.astro',
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('components');
      expect(result?.id).toBe('components');
      expect(result?.description).toBe('Component inferred from directory: components');
    });

    it('should use ROOT_COMPONENT_MARKER for files in root directory', () => {
      const frontmatter = `
const greeting = 'Hello';
      `.trim();

      const result = extractFileComponent(frontmatter, '/Layout.astro');

      expect(result).toBeDefined();
      expect(result?.name).toBe(ROOT_COMPONENT_MARKER);
      expect(result?.id).toBe('__use_container_name__');
    });

    it('should handle Windows-style paths', () => {
      const frontmatter = `const greeting = 'Hello';`;

      const result = extractFileComponent(
        frontmatter,
        'C:\\Users\\test\\src\\components\\Button.astro',
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('components');
    });

    it('should handle component name with dashes', () => {
      const frontmatter = `
/**
 * @component My-Component
 */
      `.trim();

      const result = extractFileComponent(frontmatter, '/test.astro');

      expect(result).toBeDefined();
      expect(result?.name).toBe('My-Component');
      expect(result?.id).toBe('my_component'); // sanitizeId converts dashes to _
    });

    it('should handle empty frontmatter', () => {
      const result = extractFileComponent('', '/path/to/components/Button.astro');

      expect(result).toBeDefined();
      expect(result?.name).toBe('components');
    });
  });

  describe('extractFileActors', () => {
    it('should extract actor with all fields', () => {
      const frontmatter = `
/**
 * @actor User {Person} {in} End user who views the website
 */
      `.trim();

      const actors = extractFileActors(frontmatter);

      expect(actors).toHaveLength(1);
      expect(actors[0].name).toBe('User');
      expect(actors[0].id).toBe('user');
      expect(actors[0].type).toBe('Person');
      expect(actors[0].direction).toBe('in');
      expect(actors[0].description).toBe('End user who views the website');
    });

    it('should extract actor without direction (defaults to both)', () => {
      const frontmatter = `
/**
 * @actor Database {System} Stores application data
 */
      `.trim();

      const actors = extractFileActors(frontmatter);

      expect(actors).toHaveLength(1);
      expect(actors[0].name).toBe('Database');
      expect(actors[0].type).toBe('System');
      expect(actors[0].direction).toBe('both');
      expect(actors[0].description).toBe('Stores application data');
    });

    it('should extract multiple actors', () => {
      const frontmatter = `
/**
 * @actor User {Person} {in} End user
 * @actor API {System} {out} External API
 * @actor Cache {System} {both} Redis cache
 */
      `.trim();

      const actors = extractFileActors(frontmatter);

      expect(actors).toHaveLength(3);
      expect(actors[0].name).toBe('User');
      expect(actors[1].name).toBe('API');
      expect(actors[2].name).toBe('Cache');
    });

    it('should extract actors with out direction', () => {
      const frontmatter = `
/**
 * @actor EmailService {System} {out} Sends notification emails
 */
      `.trim();

      const actors = extractFileActors(frontmatter);

      expect(actors).toHaveLength(1);
      expect(actors[0].direction).toBe('out');
    });

    it('should handle actor names with spaces', () => {
      const frontmatter = `
/**
 * @actor Email Service {System} {out} Sends emails
 */
      `.trim();

      const actors = extractFileActors(frontmatter);

      expect(actors).toHaveLength(1);
      expect(actors[0].name).toBe('Email Service');
      expect(actors[0].id).toBe('email_service'); // sanitizeId converts spaces to _
    });

    it('should return empty array when no actors', () => {
      const frontmatter = `
/**
 * @component Test
 */
      `.trim();

      const actors = extractFileActors(frontmatter);

      expect(actors).toHaveLength(0);
    });

    it('should skip malformed actor tags', () => {
      const frontmatter = `
/**
 * @actor InvalidActor
 * @actor ValidActor {System} {in} A valid actor
 */
      `.trim();

      const actors = extractFileActors(frontmatter);

      expect(actors).toHaveLength(1);
      expect(actors[0].name).toBe('ValidActor');
    });

    it('should handle empty frontmatter', () => {
      const actors = extractFileActors('');
      expect(actors).toHaveLength(0);
    });
  });

  describe('extractFileRelationships', () => {
    it('should extract relationship with description', () => {
      const frontmatter = `
/**
 * @uses AuthService Handles user authentication
 */
      `.trim();

      const relationships = extractFileRelationships(frontmatter);

      expect(relationships).toHaveLength(1);
      expect(relationships[0].target).toBe('AuthService');
      expect(relationships[0].description).toBe('Handles user authentication');
      expect(relationships[0].source).toBe(''); // Filled later by mapper
    });

    it('should extract relationship without description', () => {
      const frontmatter = `
/**
 * @uses Logger
 */
      `.trim();

      const relationships = extractFileRelationships(frontmatter);

      expect(relationships).toHaveLength(1);
      expect(relationships[0].target).toBe('Logger');
      expect(relationships[0].description).toBeUndefined();
    });

    it('should extract multiple relationships', () => {
      const frontmatter = `
/**
 * @uses Database Stores data
 * @uses Cache Caches responses
 * @uses Logger Logs operations
 */
      `.trim();

      const relationships = extractFileRelationships(frontmatter);

      expect(relationships).toHaveLength(3);
      expect(relationships[0].target).toBe('Database');
      expect(relationships[1].target).toBe('Cache');
      expect(relationships[2].target).toBe('Logger');
    });

    it('should handle target names with hyphens', () => {
      const frontmatter = `
/**
 * @uses Auth-Service Authenticates users
 */
      `.trim();

      const relationships = extractFileRelationships(frontmatter);

      expect(relationships).toHaveLength(1);
      expect(relationships[0].target).toBe('Auth-Service');
    });

    it('should return empty array when no relationships', () => {
      const frontmatter = `
/**
 * @component Test
 */
      `.trim();

      const relationships = extractFileRelationships(frontmatter);

      expect(relationships).toHaveLength(0);
    });

    it('should handle empty frontmatter', () => {
      const relationships = extractFileRelationships('');
      expect(relationships).toHaveLength(0);
    });
  });

  describe('JSDoc parsing', () => {
    it('should handle multi-line descriptions', () => {
      const frontmatter = `
/**
 * This is a multi-line
 * description for the component
 * @component MultiLine
 */
      `.trim();

      const result = extractFileComponent(frontmatter, '/test.astro');

      expect(result).toBeDefined();
      expect(result?.description).toContain('multi-line');
      expect(result?.description).toContain('description');
    });

    it('should handle multiple JSDoc blocks', () => {
      const frontmatter = `
/**
 * First block
 * @component FirstComponent
 */

/**
 * Second block
 * @actor User {Person} {in} A user
 */
      `.trim();

      const component = extractFileComponent(frontmatter, '/test.astro');
      const actors = extractFileActors(frontmatter);

      expect(component?.name).toBe('FirstComponent');
      expect(actors).toHaveLength(1);
      expect(actors[0].name).toBe('User');
    });

    it('should extract actor and uses from same JSDoc block (like index.astro)', () => {
      const frontmatter = `
/**
 * Home Page - Landing page for Bond Math application
 * @actor User {Person} {in} End user who interacts with the bond math UI
 * @uses bond-math-gateway Communicates with Gateway API for bond calculations
 */
import BaseLayout from '@layouts/BaseLayout.astro';
      `.trim();

      const actors = extractFileActors(frontmatter);
      const relationships = extractFileRelationships(frontmatter);

      expect(actors).toHaveLength(1);
      expect(actors[0].name).toBe('User');
      expect(relationships).toHaveLength(1);
      expect(relationships[0].target).toBe('bond-math-gateway');
    });

    it('should handle JSDoc without description', () => {
      const frontmatter = `
/**
 * @component NoDescription
 */
      `.trim();

      const result = extractFileComponent(frontmatter, '/test.astro');

      expect(result).toBeDefined();
      expect(result?.name).toBe('NoDescription');
      expect(result?.description).toBeUndefined(); // No description returns undefined
    });
  });
});
