/**
 * Tests for code relationships with component-level IDs
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { parseFiles } from '../../../../src/extractors/builtin/basic-node/file-parser.js';
import { mapToIR } from '../../../../src/extractors/builtin/basic-node/to-ir-mapper.js';
import { readPackageInfo } from '../../../../src/extractors/builtin/basic-node/file-finder.js';

describe('code relationships - component-level IDs', () => {
  const testDir = join(process.cwd(), 'test-tmp-code-relationships');
  let packageInfo: any;

  beforeAll(async () => {
    // Clean up any existing test directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }

    // Create test directory structure
    mkdirSync(join(testDir, 'utils'), { recursive: true });
    mkdirSync(join(testDir, 'services'), { recursive: true });

    // Create a utility file
    writeFileSync(
      join(testDir, 'utils', 'helper.ts'),
      `/**
 * @component utilities
 */
export function formatData(data: string): string {
  return data.toUpperCase();
}

export function parseData(data: string): object {
  return JSON.parse(data);
}`,
    );

    // Create a service that imports from utils
    writeFileSync(
      join(testDir, 'services', 'api.ts'),
      `/**
 * @component services
 */
import { formatData, parseData } from '../utils/helper.js';

export class ApiClient {
  process(data: string) {
    const formatted = formatData(data);
    const parsed = parseData(formatted);
    return parsed;
  }
}`,
    );

    // Create a package.json
    const packagePath = join(testDir, 'package.json');
    writeFileSync(
      packagePath,
      JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        description: 'Test project for code relationships',
      }),
    );

    packageInfo = await readPackageInfo(packagePath);
  });

  afterAll(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should use component IDs for code relationship source', async () => {
    const files = [
      join(testDir, 'utils', 'helper.ts'),
      join(testDir, 'services', 'api.ts'),
    ];

    const extractions = await parseFiles(files);
    const ir = mapToIR(extractions, packageInfo ? [packageInfo] : []);

    // Find component relationships (import-based relationships are now here)
    const componentRelationships = ir.componentRelationships;

    // Filter to just import-based relationships (they have import stereotype)
    const importBasedRelationships = componentRelationships.filter(
      (rel) => rel.stereotype === 'import' || rel.stereotype === 'type-import',
    );
    expect(importBasedRelationships.length).toBeGreaterThan(0);

    // All import-based relationships should have component IDs as source (not file paths)
    for (const rel of importBasedRelationships) {
      // Source should be a component ID (container__component format or just component)
      expect(rel.source).not.toMatch(/[/\\]/); // Should not contain file path separators
      expect(rel.source).not.toContain('.ts');
      expect(rel.source).not.toContain('.js');

      // Source should match a component ID in the IR
      const sourceIsComponent = ir.components.some((c) => c.id === rel.source);
      expect(sourceIsComponent).toBe(true);
    }
  });

  it('should use component IDs for code relationship destination when resolvable', async () => {
    const files = [
      join(testDir, 'utils', 'helper.ts'),
      join(testDir, 'services', 'api.ts'),
    ];

    const extractions = await parseFiles(files);
    const ir = mapToIR(extractions, packageInfo ? [packageInfo] : []);

    // Find import-based relationships from services to utilities
    const serviceToUtilsRels = ir.componentRelationships.filter(
      (rel) =>
        rel.source.includes('services') &&
        (rel.stereotype === 'import' || rel.stereotype === 'type-import'),
    );
    expect(serviceToUtilsRels.length).toBeGreaterThan(0);

    // These relationships should have component IDs as destination
    for (const rel of serviceToUtilsRels) {
      // For internal imports, destination should be a component ID
      if (!rel.destination.startsWith('..') && !rel.destination.startsWith('.')) {
        expect(rel.destination).not.toMatch(/[/\\]/);
        expect(rel.destination).not.toContain('.ts');
        expect(rel.destination).not.toContain('.js');

        // Destination should match a component ID in the IR
        const destIsComponent = ir.components.some((c) => c.id === rel.destination);
        expect(destIsComponent).toBe(true);
      }
    }
  });

  it('should create component-to-component relationships via imports', async () => {
    const files = [
      join(testDir, 'utils', 'helper.ts'),
      join(testDir, 'services', 'api.ts'),
    ];

    const extractions = await parseFiles(files);
    const ir = mapToIR(extractions, packageInfo ? [packageInfo] : []);

    // Find the services and utilities components
    const servicesComponent = ir.components.find((c) => c.id.includes('services'));
    const utilitiesComponent = ir.components.find((c) => c.id.includes('utilities'));

    expect(servicesComponent).toBeDefined();
    expect(utilitiesComponent).toBeDefined();

    // Should have a component relationship from services to utilities
    const servicesImportsUtils = ir.componentRelationships.some(
      (rel) =>
        rel.source === servicesComponent?.id &&
        rel.destination === utilitiesComponent?.id,
    );

    expect(servicesImportsUtils).toBe(true);
  });

  it('should handle external imports gracefully', async () => {
    // Create a file with external imports
    writeFileSync(
      join(testDir, 'services', 'external.ts'),
      `/**
 * @component services
 */
import { readFile } from 'fs';
import lodash from 'lodash';

export function loadData() {
  return readFile('./data.json');
}`,
    );

    const files = [
      join(testDir, 'utils', 'helper.ts'),
      join(testDir, 'services', 'api.ts'),
      join(testDir, 'services', 'external.ts'),
    ];

    const extractions = await parseFiles(files);
    const ir = mapToIR(extractions, packageInfo ? [packageInfo] : []);

    // Find component relationships with external modules
    const externalRels = ir.componentRelationships.filter(
      (rel) => rel.destination === 'fs' || rel.destination === 'lodash',
    );

    // External imports should keep module name as destination
    expect(externalRels.length).toBeGreaterThan(0);
    for (const rel of externalRels) {
      // Source should still be a component ID
      expect(rel.source).not.toMatch(/[/\\]/);

      // Destination for external imports should be the module name
      expect(['fs', 'lodash']).toContain(rel.destination);
    }
  });

  it('should deduplicate relationships with same source and destination', async () => {
    const files = [
      join(testDir, 'utils', 'helper.ts'),
      join(testDir, 'services', 'api.ts'),
    ];

    const extractions = await parseFiles(files);
    const ir = mapToIR(extractions, packageInfo ? [packageInfo] : []);

    // The services/api.ts file imports both formatData and parseData from utils/helper.ts
    // This should result in only ONE relationship between services and utilities components
    const servicesComponent = ir.components.find((c) => c.id.includes('services'));
    const utilitiesComponent = ir.components.find((c) => c.id.includes('utilities'));

    const relationshipsFromServicesToUtils = ir.componentRelationships.filter(
      (rel) =>
        rel.source === servicesComponent?.id &&
        rel.destination === utilitiesComponent?.id,
    );

    // Should be exactly 1 relationship (deduplicated)
    expect(relationshipsFromServicesToUtils.length).toBe(1);
  });

  it('should concatenate descriptions when deduplicating relationships', async () => {
    // Create files with different import descriptions
    writeFileSync(
      join(testDir, 'services', 'multi-import.ts'),
      `/**
 * @component services
 */
import { formatData } from '../utils/helper.js';
import type { parseData } from '../utils/helper.js';

export class MultiImporter {
  format() {
    return formatData('test');
  }
}`,
    );

    const files = [
      join(testDir, 'utils', 'helper.ts'),
      join(testDir, 'services', 'multi-import.ts'),
    ];

    const extractions = await parseFiles(files);
    const ir = mapToIR(extractions, packageInfo ? [packageInfo] : []);

    const servicesComponent = ir.components.find((c) => c.id.includes('services'));
    const utilitiesComponent = ir.components.find((c) => c.id.includes('utilities'));

    const relationship = ir.componentRelationships.find(
      (rel) =>
        rel.source === servicesComponent?.id &&
        rel.destination === utilitiesComponent?.id,
    );

    expect(relationship).toBeDefined();

    // Description should contain both import names (without "imports " prefix) separated by " | "
    expect(relationship?.description).toContain('formatData');
    expect(relationship?.description).toContain('parseData');
    expect(relationship?.description).toContain(' | ');
    // Should NOT contain the "imports " prefix
    expect(relationship?.description).not.toContain('imports ');
  });
  it('should concatenate stereotypes when deduplicating relationships', async () => {
    // The multi-import.ts file created above has both regular and type imports
    const files = [
      join(testDir, 'utils', 'helper.ts'),
      join(testDir, 'services', 'multi-import.ts'),
    ];

    const extractions = await parseFiles(files);
    const ir = mapToIR(extractions, packageInfo ? [packageInfo] : []);

    const servicesComponent = ir.components.find((c) => c.id.includes('services'));
    const utilitiesComponent = ir.components.find((c) => c.id.includes('utilities'));

    const relationship = ir.componentRelationships.find(
      (rel) =>
        rel.source === servicesComponent?.id &&
        rel.destination === utilitiesComponent?.id,
    );

    expect(relationship).toBeDefined();

    // Stereotype should contain both import types separated by " | "
    expect(relationship?.stereotype).toContain('import');
    expect(relationship?.stereotype).toContain('type-import');
    expect(relationship?.stereotype).toContain(' | ');
  });

  it('should exclude self-referential relationships', async () => {
    // Create a file that imports from itself (same component)
    writeFileSync(
      join(testDir, 'services', 'self-import-a.ts'),
      `/**
 * @component services
 */
export function helperA() {
  return 'A';
}`,
    );

    writeFileSync(
      join(testDir, 'services', 'self-import-b.ts'),
      `/**
 * @component services
 */
import { helperA } from './self-import-a.js';

export function helperB() {
  return helperA() + 'B';
}`,
    );

    const files = [
      join(testDir, 'services', 'self-import-a.ts'),
      join(testDir, 'services', 'self-import-b.ts'),
    ];

    const extractions = await parseFiles(files);
    const ir = mapToIR(extractions, packageInfo ? [packageInfo] : []);

    const servicesComponent = ir.components.find((c) => c.id.includes('services'));

    // Should NOT have any self-referential relationships (services -> services)
    const selfReferentialRels = ir.componentRelationships.filter(
      (rel) =>
        rel.source === servicesComponent?.id &&
        rel.destination === servicesComponent?.id,
    );

    expect(selfReferentialRels.length).toBe(0);
  });
});
