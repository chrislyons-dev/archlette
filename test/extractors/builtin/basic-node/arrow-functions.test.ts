/**
 * Tests for arrow function extraction
 */
import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { extractArrowFunctions } from '../../../../src/extractors/builtin/basic-node/function-extractor.js';

describe('extractArrowFunctions', () => {
  it('extracts simple arrow function', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      const greet = () => {
        return 'Hello';
      };
      `,
    );

    const functions = extractArrowFunctions(sourceFile);

    expect(functions).toHaveLength(1);
    expect(functions[0].name).toBe('greet');
    expect(functions[0].isExported).toBe(false);
    expect(functions[0].isAsync).toBe(false);
  });

  it('extracts exported arrow function', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      export const createUser = (name: string) => {
        return { name };
      };
      `,
    );

    const functions = extractArrowFunctions(sourceFile);

    expect(functions).toHaveLength(1);
    expect(functions[0].name).toBe('createUser');
    expect(functions[0].isExported).toBe(true);
    expect(functions[0].parameters).toHaveLength(1);
    expect(functions[0].parameters[0].name).toBe('name');
    expect(functions[0].parameters[0].type).toContain('string');
  });

  it('extracts async arrow function', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      const fetchData = async () => {
        return fetch('/api/data');
      };
      `,
    );

    const functions = extractArrowFunctions(sourceFile);

    expect(functions).toHaveLength(1);
    expect(functions[0].name).toBe('fetchData');
    expect(functions[0].isAsync).toBe(true);
  });

  it('extracts arrow function with JSDoc', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      /**
       * Calculates the sum of two numbers
       * @param a - First number
       * @param b - Second number
       * @returns The sum
       */
      const add = (a: number, b: number) => a + b;
      `,
    );

    const functions = extractArrowFunctions(sourceFile);

    expect(functions).toHaveLength(1);
    expect(functions[0].name).toBe('add');
    expect(functions[0].documentation?.summary).toContain('sum of two numbers');
    expect(functions[0].parameters).toHaveLength(2);
    expect(functions[0].parameters[0].description).toContain('First number');
    expect(functions[0].returnDescription).toContain('sum');
  });

  it('extracts function expression assigned to const', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      const handleClick = function() {
        console.log('clicked');
      };
      `,
    );

    const functions = extractArrowFunctions(sourceFile);

    expect(functions).toHaveLength(1);
    expect(functions[0].name).toBe('handleClick');
    expect(functions[0].isExported).toBe(false);
  });

  it('extracts multiple arrow functions', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      const foo = () => 'foo';
      const bar = () => 'bar';
      export const baz = () => 'baz';
      `,
    );

    const functions = extractArrowFunctions(sourceFile);

    expect(functions).toHaveLength(3);
    expect(functions[0].name).toBe('foo');
    expect(functions[1].name).toBe('bar');
    expect(functions[2].name).toBe('baz');
    expect(functions[2].isExported).toBe(true);
  });

  it('handles arrow functions with complex parameters', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      const process = (data: string, options?: { limit: number }) => {
        return data.slice(0, options?.limit);
      };
      `,
    );

    const functions = extractArrowFunctions(sourceFile);

    expect(functions).toHaveLength(1);
    expect(functions[0].parameters).toHaveLength(2);
    expect(functions[0].parameters[0].name).toBe('data');
    expect(functions[0].parameters[1].name).toBe('options');
    expect(functions[0].parameters[1].optional).toBe(true);
  });

  it('skips non-function variable declarations', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      const value = 42;
      const obj = { key: 'value' };
      const arr = [1, 2, 3];
      const fn = () => 'function';
      `,
    );

    const functions = extractArrowFunctions(sourceFile);

    // Should only extract the arrow function
    expect(functions).toHaveLength(1);
    expect(functions[0].name).toBe('fn');
  });
});
