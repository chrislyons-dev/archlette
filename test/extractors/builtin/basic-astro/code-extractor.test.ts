/**
 * Tests for basic-astro code-extractor module
 */

import { describe, it, expect } from 'vitest';
import { extractCodeFromFrontmatter } from '../../../../src/extractors/builtin/basic-astro/code-extractor.js';

describe('basic-astro code-extractor', () => {
  describe('extractCodeFromFrontmatter', () => {
    it('should extract functions from frontmatter', () => {
      const frontmatter = `
/**
 * Calculate sum of two numbers
 * @param a First number
 * @param b Second number
 * @returns Sum of a and b
 */
function add(a: number, b: number): number {
  return a + b;
}

export function multiply(x: number, y: number): number {
  return x * y;
}
      `.trim();

      const result = extractCodeFromFrontmatter(frontmatter, '/test/Button.astro');

      expect(result.functions).toHaveLength(2);
      expect(result.functions[0].name).toBe('add');
      expect(result.functions[0].isExported).toBe(false);
      expect(result.functions[1].name).toBe('multiply');
      expect(result.functions[1].isExported).toBe(true);
    });

    it('should extract classes from frontmatter', () => {
      const frontmatter = `
export class ButtonState {
  private pressed: boolean = false;

  public toggle(): void {
    this.pressed = !this.pressed;
  }

  public isPressed(): boolean {
    return this.pressed;
  }
}
      `.trim();

      const result = extractCodeFromFrontmatter(frontmatter, '/test/Button.astro');

      expect(result.classes).toHaveLength(1);
      expect(result.classes[0].name).toBe('ButtonState');
      expect(result.classes[0].isExported).toBe(true);
      expect(result.classes[0].methods).toHaveLength(2);
    });

    it('should extract types and interfaces from frontmatter', () => {
      const frontmatter = `
export interface Props {
  label: string;
  variant?: 'primary' | 'secondary';
}

export type ButtonSize = 'small' | 'medium' | 'large';

const { label, variant = 'primary' } = Astro.props as Props;
      `.trim();

      const result = extractCodeFromFrontmatter(frontmatter, '/test/Button.astro');

      expect(result.interfaces).toHaveLength(1);
      expect(result.interfaces[0].name).toBe('Props');
      expect(result.interfaces[0].properties).toHaveLength(2);

      expect(result.types).toHaveLength(1);
      expect(result.types[0].name).toBe('ButtonSize');
    });

    it('should handle empty frontmatter', () => {
      const result = extractCodeFromFrontmatter('', '/test/Button.astro');

      expect(result.classes).toHaveLength(0);
      expect(result.functions).toHaveLength(0);
      expect(result.types).toHaveLength(0);
      expect(result.interfaces).toHaveLength(0);
    });

    it('should handle frontmatter with only imports', () => {
      const frontmatter = `
import Header from './Header.astro';
import { Button } from './components/Button';
      `.trim();

      const result = extractCodeFromFrontmatter(frontmatter, '/test/Layout.astro');

      expect(result.classes).toHaveLength(0);
      expect(result.functions).toHaveLength(0);
      expect(result.types).toHaveLength(0);
      expect(result.interfaces).toHaveLength(0);
    });

    it('should extract arrow functions', () => {
      const frontmatter = `
const getTitle = (name: string) => \`Hello, \${name}\`;

export const formatDate = (date: Date): string => {
  return date.toISOString();
};
      `.trim();

      const result = extractCodeFromFrontmatter(frontmatter, '/test/Utils.astro');

      expect(result.functions).toHaveLength(2);
      expect(result.functions[0].name).toBe('getTitle');
      expect(result.functions[1].name).toBe('formatDate');
      expect(result.functions[1].isExported).toBe(true);
    });

    it('should extract JSDoc documentation', () => {
      const frontmatter = `
/**
 * Validates user input
 * @param input The input string to validate
 * @returns True if valid, false otherwise
 * @example
 * validate('test'); // returns true
 */
function validate(input: string): boolean {
  return input.length > 0;
}
      `.trim();

      const result = extractCodeFromFrontmatter(frontmatter, '/test/Form.astro');

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].documentation).toBeDefined();
      expect(result.functions[0].documentation?.summary).toContain(
        'Validates user input',
      );
    });

    it('should handle parse errors gracefully', () => {
      const frontmatter = `
this is not valid TypeScript {{{
      `.trim();

      // Should not throw, should return empty result
      const result = extractCodeFromFrontmatter(frontmatter, '/test/Invalid.astro');

      expect(result.classes).toHaveLength(0);
      expect(result.functions).toHaveLength(0);
    });
  });
});
