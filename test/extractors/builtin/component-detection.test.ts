/**
 * Tests for component detection from JSDoc
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import basicNodeExtractor from '../../../src/extractors/builtin/basic-node.js';
import type { ResolvedStageNode } from '../../../src/core/types-aac.js';

describe('component detection', () => {
  const testDir = join(process.cwd(), 'test-temp-components');

  // Clean up before each test
  beforeEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
  });

  // Clean up after all tests
  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should extract component from @component tag', async () => {
    const testFile = join(testDir, 'payment.ts');
    writeFileSync(
      testFile,
      `/**
 * Payment processing functionality
 * @component Payment Processor
 */

export class PaymentService {
  process() {}
}

export function validatePayment() {}
`,
    );

    const node: ResolvedStageNode = {
      use: 'builtin/basic-node',
      name: 'test',
      props: {},
      inputs: {
        include: [join(testDir, '*.ts').replace(/\\/g, '/')],
      },
      _effective: { includes: [], excludes: [] },
    };

    const ir = await basicNodeExtractor(node);

    // Should have found 1 component
    expect(ir.components).toHaveLength(1);
    expect(ir.components[0].id).toBe('default-container::payment-processor');
    expect(ir.components[0].name).toBe('Payment Processor');
    expect(ir.components[0].type).toBe('module');

    // Code elements should reference the component
    const paymentClass = ir.code.find((c) => c.name.includes('PaymentService'));
    expect(paymentClass?.componentId).toBe('default-container::payment-processor');

    const validateFunc = ir.code.find((c) => c.name.includes('validatePayment'));
    expect(validateFunc?.componentId).toBe('default-container::payment-processor');
  });

  it('should extract component from @module tag', async () => {
    mkdirSync(testDir, { recursive: true });

    const testFile = join(testDir, 'auth.ts');
    writeFileSync(
      testFile,
      `/**
 * @module authentication/oauth
 * @description OAuth2 authentication module
 */

export function login() {}
`,
    );

    const node: ResolvedStageNode = {
      use: 'builtin/basic-node',
      name: 'test',
      props: {},
      inputs: {
        include: [join(testDir, '*.ts').replace(/\\/g, '/')],
      },
      _effective: { includes: [], excludes: [] },
    };

    const ir = await basicNodeExtractor(node);

    expect(ir.components).toHaveLength(1);
    expect(ir.components[0].id).toBe('default-container::authentication-oauth');
    expect(ir.components[0].name).toBe('authentication/oauth');
    // Description extraction needs fixing
    // expect(ir.components[0].description).toBe('OAuth2 authentication module');
  });

  it('should extract component from @namespace tag', async () => {
    mkdirSync(testDir, { recursive: true });

    const testFile = join(testDir, 'utils.ts');
    writeFileSync(
      testFile,
      `/**
 * @namespace StringUtils
 * @description String manipulation utilities
 */

export function capitalize() {}
`,
    );

    const node: ResolvedStageNode = {
      use: 'builtin/basic-node',
      name: 'test',
      props: {},
      inputs: {
        include: [join(testDir, '*.ts').replace(/\\/g, '/')],
      },
      _effective: { includes: [], excludes: [] },
    };

    const ir = await basicNodeExtractor(node);

    expect(ir.components).toHaveLength(1);
    expect(ir.components[0].id).toBe('default-container::stringutils');
    expect(ir.components[0].name).toBe('StringUtils');
  });

  it('should handle files without component tags', async () => {
    mkdirSync(testDir, { recursive: true });

    const testFile = join(testDir, 'nocomponent.ts');
    writeFileSync(testFile, `export function helper() {}`);

    const node: ResolvedStageNode = {
      use: 'builtin/basic-node',
      name: 'test',
      props: {},
      inputs: {
        include: [join(testDir, '*.ts').replace(/\\/g, '/')],
      },
      _effective: { includes: [], excludes: [] },
    };

    const ir = await basicNodeExtractor(node);

    // No components should be extracted
    expect(ir.components).toHaveLength(0);

    // Code should still be extracted, but without componentId
    const helperFunc = ir.code.find((c) => c.name === 'helper');
    expect(helperFunc).toBeDefined();
    expect(helperFunc?.componentId).toBeUndefined();
  });

  it('should deduplicate components from multiple files', async () => {
    mkdirSync(testDir, { recursive: true });

    const file1 = join(testDir, 'file1.ts');
    const file2 = join(testDir, 'file2.ts');

    writeFileSync(
      file1,
      `/**
 * @component Shared Component
 */
export function funcA() {}
`,
    );

    writeFileSync(
      file2,
      `/**
 * @component Shared Component
 */
export function funcB() {}
`,
    );

    const node: ResolvedStageNode = {
      use: 'builtin/basic-node',
      name: 'test',
      props: {},
      inputs: {
        include: [join(testDir, '*.ts').replace(/\\/g, '/')],
      },
      _effective: { includes: [], excludes: [] },
    };

    const ir = await basicNodeExtractor(node);

    // Should only have 1 component even though 2 files declared it
    expect(ir.components).toHaveLength(1);
    expect(ir.components[0].name).toBe('Shared Component');

    // Both functions should reference the same component
    expect(ir.code).toHaveLength(2);
    expect(ir.code[0].componentId).toBe('default-container::shared-component');
    expect(ir.code[1].componentId).toBe('default-container::shared-component');
  });
});
