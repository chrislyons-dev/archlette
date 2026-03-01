#!/usr/bin/env node
/**
 * Run integration tests for all rendering configurations.
 *
 * Usage: node scripts/run-integration-tests.mjs
 */

import { execSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const testIntegrationDir = join(rootDir, 'test-integration');

// Get all subdirectories in test-integration/
const testDirs = readdirSync(testIntegrationDir).filter((name) => {
  const fullPath = join(testIntegrationDir, name);
  return statSync(fullPath).isDirectory();
});

if (testDirs.length === 0) {
  console.log('No integration test directories found.');
  process.exit(0);
}

console.log(`Found ${testDirs.length} integration test(s):\n`);

let passed = 0;
let failed = 0;
const failures = [];

for (const dir of testDirs) {
  const testDir = join(testIntegrationDir, dir);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${dir}`);
  console.log('='.repeat(60));

  try {
    execSync('npx tsx ../../src/cli.ts -f archlette.config.yaml all', {
      cwd: testDir,
      stdio: 'inherit',
    });
    console.log(`\n[PASS] ${dir}`);
    passed++;
  } catch {
    console.error(`\n[FAIL] ${dir}`);
    failed++;
    failures.push(dir);
  }
}

// Summary
console.log(`\n${'='.repeat(60)}`);
console.log('Integration Test Summary');
console.log('='.repeat(60));
console.log(`Total:  ${testDirs.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failures.length > 0) {
  console.log(`\nFailed tests:`);
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}

console.log('\nAll integration tests passed!');
