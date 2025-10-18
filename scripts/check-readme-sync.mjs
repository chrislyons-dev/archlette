#!/usr/bin/env node

/**
 * Check if docs/index.md is in sync with README.md
 *
 * Used in CI to ensure the sync script was run after README changes
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'docs', 'index.md');

console.log('🔍 Checking if docs/index.md is in sync with README.md...\n');

// Read current docs/index.md
const before = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';

// Regenerate
try {
  execSync('npm run readme:sync', {
    cwd: rootDir,
    stdio: 'inherit',
  });
} catch (err) {
  console.error('❌ Failed to sync README');
  console.error('Error:', err && err.message ? err.message : String(err));
  if (err && err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
}

// Read regenerated docs/index.md
const after = fs.readFileSync(indexPath, 'utf8');

// Compare
if (before !== after) {
  console.error('\n❌ docs/index.md is out of sync with README.md!\n');
  console.error('Run the following command to update it:\n');
  console.error('  npm run readme:sync\n');
  console.error('Then commit the updated file.\n');
  process.exit(1);
}

console.log('\n✅ docs/index.md is in sync with README.md\n');
