/**
 * Tests for type alias and interface extraction
 */
import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import {
  extractTypeAliases,
  extractInterfaces,
} from '../../../../src/extractors/builtin/basic-node/type-extractor.js';

describe('extractTypeAliases', () => {
  it('extracts simple type alias', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      type UserRole = 'admin' | 'user' | 'guest';
      `,
    );

    const types = extractTypeAliases(sourceFile);

    expect(types).toHaveLength(1);
    expect(types[0].name).toBe('UserRole');
    expect(types[0].isExported).toBe(false);
    expect(types[0].definition).toContain('admin');
  });

  it('extracts exported type alias', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      export type UserId = string;
      `,
    );

    const types = extractTypeAliases(sourceFile);

    expect(types).toHaveLength(1);
    expect(types[0].name).toBe('UserId');
    expect(types[0].isExported).toBe(true);
    expect(types[0].definition).toBe('string');
  });

  it('extracts generic type alias', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      type ApiResponse<T> = {
        data: T;
        status: number;
      };
      `,
    );

    const types = extractTypeAliases(sourceFile);

    expect(types).toHaveLength(1);
    expect(types[0].name).toBe('ApiResponse');
    expect(types[0].typeParameters).toHaveLength(1);
    expect(types[0].typeParameters![0].name).toBe('T');
  });

  it('extracts type alias with JSDoc', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      /**
       * Represents user authentication status
       */
      type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';
      `,
    );

    const types = extractTypeAliases(sourceFile);

    expect(types).toHaveLength(1);
    expect(types[0].documentation?.summary).toContain('authentication status');
  });

  it('extracts multiple type aliases', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      type ID = string;
      type Name = string;
      export type User = { id: ID; name: Name };
      `,
    );

    const types = extractTypeAliases(sourceFile);

    expect(types).toHaveLength(3);
    expect(types[0].name).toBe('ID');
    expect(types[1].name).toBe('Name');
    expect(types[2].name).toBe('User');
    expect(types[2].isExported).toBe(true);
  });
});

describe('extractInterfaces', () => {
  it('extracts simple interface', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      interface User {
        id: string;
        name: string;
      }
      `,
    );

    const interfaces = extractInterfaces(sourceFile);

    expect(interfaces).toHaveLength(1);
    expect(interfaces[0].name).toBe('User');
    expect(interfaces[0].isExported).toBe(false);
    expect(interfaces[0].properties).toHaveLength(2);
    expect(interfaces[0].properties[0].name).toBe('id');
    expect(interfaces[0].properties[0].type).toBe('string');
  });

  it('extracts exported interface', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      export interface ApiClient {
        baseUrl: string;
      }
      `,
    );

    const interfaces = extractInterfaces(sourceFile);

    expect(interfaces).toHaveLength(1);
    expect(interfaces[0].name).toBe('ApiClient');
    expect(interfaces[0].isExported).toBe(true);
  });

  it('extracts interface with methods', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      interface Repository {
        findById(id: string): Promise<User>;
        save(user: User): Promise<void>;
      }
      `,
    );

    const interfaces = extractInterfaces(sourceFile);

    expect(interfaces).toHaveLength(1);
    expect(interfaces[0].methods).toHaveLength(2);
    expect(interfaces[0].methods[0].name).toBe('findById');
    expect(interfaces[0].methods[0].parameters).toHaveLength(1);
    expect(interfaces[0].methods[1].name).toBe('save');
  });

  it('extracts interface with optional and readonly properties', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      interface Config {
        readonly apiKey: string;
        timeout?: number;
      }
      `,
    );

    const interfaces = extractInterfaces(sourceFile);

    expect(interfaces).toHaveLength(1);
    expect(interfaces[0].properties).toHaveLength(2);
    expect(interfaces[0].properties[0].readonly).toBe(true);
    expect(interfaces[0].properties[1].optional).toBe(true);
  });

  it('extracts interface that extends another', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      interface Base {
        id: string;
      }
      interface Extended extends Base {
        name: string;
      }
      `,
    );

    const interfaces = extractInterfaces(sourceFile);

    expect(interfaces).toHaveLength(2);
    expect(interfaces[1].name).toBe('Extended');
    expect(interfaces[1].extends).toHaveLength(1);
    expect(interfaces[1].extends![0]).toBe('Base');
  });

  it('extracts generic interface', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      interface Container<T> {
        value: T;
        get(): T;
      }
      `,
    );

    const interfaces = extractInterfaces(sourceFile);

    expect(interfaces).toHaveLength(1);
    expect(interfaces[0].typeParameters).toHaveLength(1);
    expect(interfaces[0].typeParameters![0].name).toBe('T');
  });

  it('extracts interface with JSDoc', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      /**
       * Represents an HTTP client for API requests
       */
      interface HttpClient {
        get<T>(url: string): Promise<T>;
      }
      `,
    );

    const interfaces = extractInterfaces(sourceFile);

    expect(interfaces).toHaveLength(1);
    expect(interfaces[0].documentation?.summary).toContain('HTTP client');
  });
});
