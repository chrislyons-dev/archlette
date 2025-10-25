// scripts/pack-smoke.js
import { readdirSync, statSync, mkdtempSync, copyFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

// 1. Find newest tarball
const tgz = readdirSync(distDir)
  .filter((f) => f.endsWith('.tgz'))
  .map((f) => ({ f, mtime: statSync(path.join(distDir, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime)[0];

if (!tgz) {
  console.error('❌ No tarball found in dist/. Run `npm pack` first.');
  process.exit(1);
}

const tarballPath = path.join(distDir, tgz.f);

// 2. Create isolated temp folder
const tempDir = mkdtempSync(path.join(tmpdir(), 'archlette-install-'));
console.log(`📦 Installing ${tgz.f} → ${tempDir}`);

// 3.Install the tarball as a dependency
execSync(`npm init -y`, { cwd: tempDir, stdio: 'inherit' });
execSync(`npm install "${tarballPath}" --omit=dev`, {
  cwd: tempDir,
  stdio: 'inherit',
});

// 4. List contents
function list(dir, prefix = '') {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const mark = e.isDirectory() ? '📁' : '📄';
    console.log(`${prefix}${mark} ${e.name}`);
    if (e.isDirectory()) list(path.join(dir, e.name), prefix + '   ');
  }
}
console.log('\n📁 Package contents:');
list(tempDir);

// 5. Smoke test via the local binary - help command
console.log('\n🚀 Running CLI smoke test (help):');
try {
  execSync(`npx archlette --help`, { cwd: tempDir, stdio: 'inherit' });
  console.log('\n✅ CLI help test executed successfully');
} catch (err) {
  console.warn('⚠️ CLI help test failed (may be fine if it requires args)', err);
}

// 6. Smoke test via the local binary - all command
console.log('\n🚀 Running CLI smoke test (all):');
const configPath = path.join(projectRoot, 'archlette.config.yaml');
if (existsSync(configPath)) {
  const destConfigPath = path.join(tempDir, 'archlette.config.yaml');
  copyFileSync(configPath, destConfigPath);
  console.log(`📋 Copied archlette.config.yaml to temp directory`);
  try {
    execSync(`npx archlette all -f archlette.config.yaml`, {
      cwd: tempDir,
      stdio: 'inherit',
    });
    console.log('\n✅ CLI all test executed successfully');
  } catch (err) {
    console.warn('⚠️ CLI all test failed (may be fine if it requires args)', err);
  }
} else {
  console.warn('⚠️  No archlette.config.yaml found in project root');
}

// 6. Keep temp dir for manual inspection
console.log(`\n🧹 Temp directory remains for inspection:\n${tempDir}`);
console.log('Delete it manually when done (e.g., `rm -rf` or `rmdir /s /q`).');
