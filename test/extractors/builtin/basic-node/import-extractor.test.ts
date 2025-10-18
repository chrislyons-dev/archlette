/**
 * Tests for import extraction utilities
 */

import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { extractImports } from '../../../../src/extractors/builtin/basic-node/import-extractor.js';

describe('import-extractor', () => {
  describe('extractImports', () => {
    it('should extract named imports', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'test.ts',
        `import { foo, bar, baz } from 'module-name';`,
      );

      const imports = extractImports(sourceFile);

      expect(imports).toHaveLength(1);
      expect(imports[0]).toEqual({
        source: 'module-name',
        importedNames: ['foo', 'bar', 'baz'],
        isTypeOnly: false,
      });
    });

    it('should extract default imports', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'test.ts',
        `import React from 'react';`,
      );

      const imports = extractImports(sourceFile);

      expect(imports).toHaveLength(1);
      expect(imports[0]).toEqual({
        source: 'react',
        importedNames: ['React'],
        isTypeOnly: false,
      });
    });

    it('should extract namespace imports', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'test.ts',
        `import * as fs from 'fs';`,
      );

      const imports = extractImports(sourceFile);

      expect(imports).toHaveLength(1);
      expect(imports[0]).toEqual({
        source: 'fs',
        importedNames: ['* as fs'],
        isTypeOnly: false,
      });
    });

    it('should extract mixed imports (default + named)', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'test.ts',
        `import React, { useState, useEffect } from 'react';`,
      );

      const imports = extractImports(sourceFile);

      expect(imports).toHaveLength(1);
      expect(imports[0]).toEqual({
        source: 'react',
        importedNames: ['useState', 'useEffect', 'React'],
        isTypeOnly: false,
      });
    });

    it('should detect type-only imports', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'test.ts',
        `import type { MyType, AnotherType } from 'types-module';`,
      );

      const imports = extractImports(sourceFile);

      expect(imports).toHaveLength(1);
      expect(imports[0]).toEqual({
        source: 'types-module',
        importedNames: ['MyType', 'AnotherType'],
        isTypeOnly: true,
      });
    });

    it('should extract multiple import statements', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
import { foo } from 'module1';
import { bar } from 'module2';
import baz from 'module3';
import * as util from 'module4';
        `,
      );

      const imports = extractImports(sourceFile);

      expect(imports).toHaveLength(4);
      expect(imports[0]).toEqual({
        source: 'module1',
        importedNames: ['foo'],
        isTypeOnly: false,
      });
      expect(imports[1]).toEqual({
        source: 'module2',
        importedNames: ['bar'],
        isTypeOnly: false,
      });
      expect(imports[2]).toEqual({
        source: 'module3',
        importedNames: ['baz'],
        isTypeOnly: false,
      });
      expect(imports[3]).toEqual({
        source: 'module4',
        importedNames: ['* as util'],
        isTypeOnly: false,
      });
    });

    it('should handle side-effect imports (no names)', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `import 'polyfill';`);

      const imports = extractImports(sourceFile);

      expect(imports).toHaveLength(1);
      expect(imports[0]).toEqual({
        source: 'polyfill',
        importedNames: [],
        isTypeOnly: false,
      });
    });

    it('should handle files with no imports', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
const x = 42;
function foo() { return x; }
        `,
      );

      const imports = extractImports(sourceFile);

      expect(imports).toHaveLength(0);
    });

    it('should extract relative path imports', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
import { helper } from './utils/helper';
import { config } from '../config';
import { types } from '../../types';
        `,
      );

      const imports = extractImports(sourceFile);

      expect(imports).toHaveLength(3);
      expect(imports[0].source).toBe('./utils/helper');
      expect(imports[1].source).toBe('../config');
      expect(imports[2].source).toBe('../../types');
    });

    it('should handle imports with aliases', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'test.ts',
        `import { foo as bar, baz as qux } from 'module';`,
      );

      const imports = extractImports(sourceFile);

      expect(imports).toHaveLength(1);
      // ts-morph getName() returns the original name, not the alias
      expect(imports[0].importedNames).toContain('foo');
      expect(imports[0].importedNames).toContain('baz');
      expect(imports[0].source).toBe('module');
    });

    it('should handle mixed type and value imports', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
import type { Type1 } from 'module1';
import { value1 } from 'module1';
import type { Type2 } from 'module2';
        `,
      );

      const imports = extractImports(sourceFile);

      expect(imports).toHaveLength(3);
      expect(imports[0]).toMatchObject({
        source: 'module1',
        isTypeOnly: true,
      });
      expect(imports[1]).toMatchObject({
        source: 'module1',
        isTypeOnly: false,
      });
      expect(imports[2]).toMatchObject({
        source: 'module2',
        isTypeOnly: true,
      });
    });

    it('should handle complex real-world imports', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
import React, { useState, useEffect, useCallback } from 'react';
import type { FC, ReactNode } from 'react';
import { Container, Box, Typography } from '@mui/material';
import * as styles from './styles.css';
import './global.css';
import api from '../services/api';
        `,
      );

      const imports = extractImports(sourceFile);

      expect(imports).toHaveLength(6);

      // React with mixed imports
      expect(imports[0]).toMatchObject({
        source: 'react',
        isTypeOnly: false,
      });
      expect(imports[0].importedNames).toContain('useState');
      expect(imports[0].importedNames).toContain('useEffect');
      expect(imports[0].importedNames).toContain('useCallback');
      expect(imports[0].importedNames).toContain('React');

      // Type-only import
      expect(imports[1]).toMatchObject({
        source: 'react',
        isTypeOnly: true,
      });
      expect(imports[1].importedNames).toContain('FC');
      expect(imports[1].importedNames).toContain('ReactNode');

      // Named imports from package
      expect(imports[2]).toMatchObject({
        source: '@mui/material',
        isTypeOnly: false,
      });

      // Namespace import
      expect(imports[3]).toMatchObject({
        source: './styles.css',
        importedNames: ['* as styles'],
      });

      // Side-effect import
      expect(imports[4]).toMatchObject({
        source: './global.css',
        importedNames: [],
      });

      // Default import from relative path
      expect(imports[5]).toMatchObject({
        source: '../services/api',
        importedNames: ['api'],
      });
    });

    it('should handle empty source file gracefully', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', '');

      const imports = extractImports(sourceFile);

      expect(imports).toHaveLength(0);
    });

    it('should extract imports from files with comments', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
// This is a comment
import { foo } from 'module1';

/* Multi-line comment
   with import-like text: import { fake } from 'fake';
*/
import { bar } from 'module2';
        `,
      );

      const imports = extractImports(sourceFile);

      expect(imports).toHaveLength(2);
      expect(imports[0].source).toBe('module1');
      expect(imports[1].source).toBe('module2');
    });

    it('should handle scoped package imports', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
import { Component } from '@angular/core';
import { Observable } from '@reactivex/rxjs';
import { helper } from '@mycompany/utils';
        `,
      );

      const imports = extractImports(sourceFile);

      expect(imports).toHaveLength(3);
      expect(imports[0].source).toBe('@angular/core');
      expect(imports[1].source).toBe('@reactivex/rxjs');
      expect(imports[2].source).toBe('@mycompany/utils');
    });

    it('should handle imports with file extensions', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
import { foo } from './module.js';
import { bar } from './types.d.ts';
import data from './data.json';
        `,
      );

      const imports = extractImports(sourceFile);

      expect(imports).toHaveLength(3);
      expect(imports[0].source).toBe('./module.js');
      expect(imports[1].source).toBe('./types.d.ts');
      expect(imports[2].source).toBe('./data.json');
    });
  });
});
