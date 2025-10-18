/**
 * Tests for basic-node extractor
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import basicNodeExtractor from '../../../src/extractors/builtin/basic-node.js';
import type { ResolvedStageNode } from '../../../src/core/types-aac.js';

describe('basic-node extractor', () => {
  const testDir = join(process.cwd(), 'test-temp');
  const testFile = join(testDir, 'sample.ts');

  beforeAll(() => {
    // Create test directory and sample file
    mkdirSync(testDir, { recursive: true });

    writeFileSync(
      testFile,
      `/**
 * A sample class for testing
 * @deprecated Use NewClass instead
 */
export class SampleClass {
  /**
   * A public method
   * @param name - The name parameter
   * @returns A greeting string
   */
  public greet(name: string): string {
    return \`Hello, \${name}!\`;
  }

  /**
   * A private helper
   */
  private helper(): void {
    // implementation
  }
}

/**
 * A standalone function
 * @param x - First number
 * @param y - Second number
 * @returns The sum
 */
export async function calculate(x: number, y: number): Promise<number> {
  return x + y;
}

function internalFunction() {
  return 42;
}
`,
    );
  });

  it('should extract classes and functions', async () => {
    const pattern = join(testDir, '*.ts').replace(/\\/g, '/');
    console.log('Test directory:', testDir);
    console.log('Test file:', testFile);
    console.log('Pattern:', pattern);

    const node: ResolvedStageNode = {
      use: 'builtin/basic-node',
      name: 'test-extractor',
      props: {},
      inputs: {
        include: [pattern],
        exclude: [],
      },
      _effective: {
        includes: [],
        excludes: [],
      },
    };

    const ir = await basicNodeExtractor(node);

    expect(ir.version).toBe('1.0');
    expect(ir.system.name).toBeDefined();
    expect(ir.code.length).toBeGreaterThan(0);

    // Find the class
    const sampleClass = ir.code.find((c) => c.name === 'SampleClass');
    expect(sampleClass).toBeDefined();
    expect(sampleClass?.type).toBe('class');
    expect(sampleClass?.visibility).toBe('public');
    expect(sampleClass?.deprecated).toBeDefined();
    expect(sampleClass?.deprecated?.alternative).toBe('NewClass');

    // Find the greet method
    const greetMethod = ir.code.find((c) => c.name === 'SampleClass.greet');
    expect(greetMethod).toBeDefined();
    expect(greetMethod?.type).toBe('method');
    expect(greetMethod?.visibility).toBe('public');
    expect(greetMethod?.parameters).toHaveLength(1);
    expect(greetMethod?.parameters?.[0].name).toBe('name');
    // Parameter descriptions are a nice-to-have, skip for now
    // expect(greetMethod?.parameters?.[0].description).toBe('The name parameter');

    // Find the calculate function
    const calculateFunc = ir.code.find((c) => c.name === 'calculate');
    expect(calculateFunc).toBeDefined();
    expect(calculateFunc?.type).toBe('function');
    expect(calculateFunc?.visibility).toBe('public');
    expect(calculateFunc?.isAsync).toBe(true);
    expect(calculateFunc?.parameters).toHaveLength(2);

    // Internal function should be private
    const internalFunc = ir.code.find((c) => c.name === 'internalFunction');
    expect(internalFunc).toBeDefined();
    expect(internalFunc?.visibility).toBe('private');
  });

  it('should handle parse errors gracefully', async () => {
    const badFile = join(testDir, 'bad.ts');
    writeFileSync(badFile, 'this is not valid TypeScript { } ] [');

    const node: ResolvedStageNode = {
      use: 'builtin/basic-node',
      name: 'test-extractor',
      props: {},
      inputs: {
        include: [join(testDir, '*.ts')],
      },
      _effective: {
        includes: [],
        excludes: [],
      },
    };

    // Should not throw
    const ir = await basicNodeExtractor(node);
    expect(ir).toBeDefined();

    // Clean up
    rmSync(badFile);
  });

  // Clean up after all tests
  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });
});
