#!/usr/bin/env node

/**
 * Generate comprehensive third-party license file
 *
 * Combines:
 * 1. NPM dependencies (via license-checker)
 * 2. Runtime-downloaded tools (Structurizr CLI, PlantUML)
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputFile = path.join(rootDir, 'THIRD_PARTY_LICENSES.md');

// Read tool versions from tool-manager.ts
const toolManagerPath = path.join(rootDir, 'src/core/tool-manager.ts');
const toolManagerContent = fs.readFileSync(toolManagerPath, 'utf8');

// Extract versions using regex
const structurizrMatch = toolManagerContent.match(/structurizr:\s*'([^']+)'/);
const plantumlMatch = toolManagerContent.match(/plantuml:\s*'([^']+)'/);

const TOOL_VERSIONS = {
  structurizr: structurizrMatch ? structurizrMatch[1] : 'unknown',
  plantuml: plantumlMatch ? plantumlMatch[1] : 'unknown',
};

console.log('📄 Generating third-party licenses...\n');

// Runtime-downloaded tools (not in package.json)
const RUNTIME_TOOLS = [
  {
    name: 'Structurizr CLI',
    version: TOOL_VERSIONS.structurizr,
    url: 'https://github.com/structurizr/cli',
    license: 'Apache-2.0',
    licenseUrl: 'https://github.com/structurizr/cli/blob/master/LICENSE',
    description: 'Command-line tool for Structurizr workspace export',
    downloadedAt: 'Runtime (on first use)',
    notes: 'Automatically downloaded to ~/.archlette/tools/ when rendering diagrams',
  },
  {
    name: 'PlantUML',
    version: TOOL_VERSIONS.plantuml,
    url: 'https://github.com/plantuml/plantuml',
    license: 'GPL-3.0-or-later (with exceptions)',
    licenseUrl: 'https://github.com/plantuml/plantuml/blob/master/LICENSE',
    description: 'Diagram rendering tool for converting PlantUML text to images',
    downloadedAt: 'Runtime (on first use)',
    notes:
      'Automatically downloaded to ~/.archlette/tools/ when rendering diagrams. PlantUML includes various components under different licenses (Apache 2.0, MIT, LGPL).',
  },
];

// Generate NPM dependencies table
console.log('🔍 Scanning NPM dependencies...');
let npmLicenses = '';
try {
  // Get production dependencies only
  const licenseData = execSync(
    'npx license-checker-rseidelsohn --production --json --excludeLicenses "MIT,ISC,Apache-2.0,BSD-3-Clause,BSD-2-Clause,CC0-1.0,Unlicense"',
    { encoding: 'utf8', cwd: rootDir },
  );

  const licenses = JSON.parse(licenseData);
  const packageCount = Object.keys(licenses).length;

  if (packageCount > 0) {
    console.warn(`⚠️  Found ${packageCount} packages with non-standard licenses:`);
    npmLicenses += '\n### ⚠️ Non-Standard Licenses\n\n';
    npmLicenses +=
      'The following dependencies use licenses that require additional review:\n\n';
    npmLicenses += '| Package | Version | License | Repository |\n';
    npmLicenses += '|---------|---------|---------|------------|\n';

    for (const [pkg, info] of Object.entries(licenses)) {
      const [name, version] = pkg.split('@').filter(Boolean);
      npmLicenses += `| ${name} | ${version} | ${info.licenses || 'Unknown'} | ${info.repository || 'N/A'} |\n`;
    }
    npmLicenses += '\n';
  }

  // Get summary of all production dependencies
  const summary = execSync('npx license-checker-rseidelsohn --production --summary', {
    encoding: 'utf8',
    cwd: rootDir,
  });

  npmLicenses += '### NPM Dependencies Summary\n\n';
  npmLicenses += '```\n' + summary.trim() + '\n```\n';

  console.log('✓ NPM dependencies scanned\n');
} catch (err) {
  console.error('Error scanning NPM dependencies:', err.message);
  npmLicenses = '\n_Error generating NPM license summary_\n';
}

// Build the complete markdown file
const markdown = `# Third-Party Licenses

This document lists all third-party software used by Archlette, including:
- **NPM Dependencies**: Listed in \`package.json\` and installed via \`npm install\`
- **Runtime Tools**: Downloaded automatically by Archlette during first use

---

## Runtime-Downloaded Tools

Archlette automatically downloads the following tools to \`~/.archlette/tools/\` when needed for diagram rendering:

${RUNTIME_TOOLS.map(
  (tool) => `
### ${tool.name} v${tool.version}

- **Project**: [${tool.url}](${tool.url})
- **License**: [${tool.license}](${tool.licenseUrl})
- **Description**: ${tool.description}
- **Downloaded**: ${tool.downloadedAt}
${tool.notes ? `- **Notes**: ${tool.notes}` : ''}
`,
).join('\n')}

---

## NPM Dependencies

The following packages are installed as production dependencies via \`package.json\`:

${npmLicenses}

---

## Regenerating This File

To regenerate this file with the latest dependency information:

\`\`\`bash
npm run licenses:generate
\`\`\`

This script:
1. Extracts tool versions from \`src/core/tool-manager.ts\`
2. Scans production dependencies via \`license-checker\`
3. Combines into this comprehensive license document

---

**Last generated**: ${new Date().toISOString().split('T')[0]}
`;

// Write the file
fs.writeFileSync(outputFile, markdown, 'utf8');
console.log(`✅ License file generated: ${outputFile}\n`);

// Check for concerning licenses
if (npmLicenses.includes('⚠️')) {
  console.warn(
    '⚠️  Some dependencies use non-standard licenses. Please review manually.\n',
  );
  process.exit(1);
}
