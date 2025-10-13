import fs from 'node:fs/promises';
import path from 'node:path';

const out = path.resolve('site');
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });

async function copy(src, destName) {
  const dst = path.join(out, destName);
  const data = await fs.readFile(src, 'utf8');
  await fs.writeFile(dst, data, 'utf8');
  console.log('→', destName);
}

// Generate a simple index from README with a header
const readme = await fs.readFile('README.md', 'utf8');
const index = `---
title: Archlette
---

${readme}
`;
await fs.writeFile(path.join(out, 'index.md'), index, 'utf8');

// Include CHANGELOG and NOTICE as additional pages
await copy('CHANGELOG.md', 'changelog.md');
await copy('NOTICE', 'notice.md');

// Provide a minimal landing page for CLI help
const usage = `# CLI

\`\`\`bash
archlette --help
archlette generate --verbose
\`\`\`
`;
await fs.writeFile(path.join(out, 'usage.md'), usage, 'utf8');

// Add .nojekyll to avoid Jekyll processing if not wanted
await fs.writeFile(path.join(out, '.nojekyll'), '');
console.log('Docs prepared in', out);
