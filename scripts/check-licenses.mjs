#!/usr/bin/env node

/**
 * Check if THIRD-PARTY-NOTICES.md is up to date
 *
 * Used in CI to ensure licenses are regenerated when dependencies change
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const licenseFile = path.join(rootDir, 'THIRD-PARTY-NOTICES.md');

console.log('🔍 Checking if THIRD-PARTY-NOTICES.md is up to date...\n');

// Read current file
const before = fs.existsSync(licenseFile) ? fs.readFileSync(licenseFile, 'utf8') : '';

// Regenerate
try {
  execSync('npm run licenses:generate', {
    cwd: rootDir,
    stdio: 'inherit',
  });
} catch (err) {
  console.error('❌ Failed to generate licenses');
  console.error('Error:', err && err.message ? err.message : String(err));
  if (err && err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
}

// Format the regenerated file
try {
  execSync(`npx prettier --write ${licenseFile}`, {
    cwd: rootDir,
    stdio: 'inherit',
  });
} catch (err) {
  console.error('❌ Failed to format licenses file');
  console.error('Error:', err && err.message ? err.message : String(err));
  process.exit(1);
}

// Read regenerated file
const after = fs.readFileSync(licenseFile, 'utf8');

// Compare (ignoring the "Last generated" date line)
const beforeNormalized = before.replace(/\*\*Last generated\*\*:.*$/m, '');
const afterNormalized = after.replace(/\*\*Last generated\*\*:.*$/m, '');

if (beforeNormalized !== afterNormalized) {
  console.error('\n❌ THIRD-PARTY-NOTICES.md is out of date!\n');
  console.error('Run the following command to update it:\n');
  console.error('  npm run licenses:generate\n');
  console.error('Then commit the updated file.\n');
  process.exit(1);
}

console.log('\n✅ THIRD-PARTY-NOTICES.md is up to date\n');
