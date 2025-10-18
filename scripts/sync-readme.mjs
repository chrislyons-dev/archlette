#!/usr/bin/env node

/**
 * Sync README.md to docs/index.md with link transformations
 *
 * Transformations:
 * - `](docs/` → `](` (remove docs/ prefix since index.md is already in docs/)
 * - `](CONTRIBUTING.md)` → `](CONTRIBUTING.md)` (no change, same level)
 * - `](CHANGELOG.md)` → `](CHANGELOG.md)` (no change, same level)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const readmePath = path.join(rootDir, 'README.md');
const indexPath = path.join(rootDir, 'docs', 'index.md');

console.log('📄 Syncing README.md → docs/index.md...\n');

// Read README.md
if (!fs.existsSync(readmePath)) {
  console.error('❌ README.md not found');
  process.exit(1);
}

let content = fs.readFileSync(readmePath, 'utf8');

// Transform links
const transformations = [
  {
    pattern: /\]\(docs\/architecture\/readme\.md\)/gi,
    replacement: '](architecture/README.md)',
    description: 'Fix architecture readme link (remove docs/ prefix and fix case)',
  },
  {
    pattern: /\]\(docs\//g,
    replacement: '](',
    description: 'Remove docs/ prefix from other links',
  },
  {
    pattern: /\]\(LICENSE\)/g,
    replacement: '](https://github.com/chrislyons-dev/archlette/blob/main/LICENSE)',
    description: 'Convert LICENSE to absolute GitHub URL',
  },
];

let changeCount = 0;
for (const { pattern, replacement, description } of transformations) {
  const before = content;
  content = content.replace(pattern, replacement);
  const matches = (before.match(pattern) || []).length;
  if (matches > 0) {
    console.log(`  ✓ ${description}: ${matches} occurrence(s)`);
    changeCount += matches;
  }
}

// Ensure docs directory exists
const docsDir = path.dirname(indexPath);
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Write docs/index.md
fs.writeFileSync(indexPath, content, 'utf8');

console.log(`\n✅ Synced with ${changeCount} link transformation(s)`);
console.log(`   ${readmePath}`);
console.log(`   → ${indexPath}\n`);
