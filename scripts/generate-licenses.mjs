#!/usr/bin/env node

/**
 * Generate comprehensive third-party license file with full license texts
 *
 * Combines:
 * 1. NPM dependencies with full license texts (via license-checker)
 * 2. Runtime-downloaded tools (Structurizr CLI, PlantUML)
 *
 * Compliant with MIT, ISC, BSD, Apache-2.0, BlueOak-1.0.0 distribution requirements:
 * - Includes full copyright notices and license texts
 * - Provides direct links to licenses for all dependencies
 * - Ensures notices are included for bundled/distributed artifacts
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputFile = path.join(rootDir, 'THIRD-PARTY-NOTICES.md');

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
    license: 'Apache-2.0 (see upstream LICENSE)',
    description: 'Command-line tool for Structurizr workspace export',
    downloadedAt: 'Runtime (on first use)',
    notes:
      'Downloaded to `~/.archlette/tools/` when rendering diagrams. The upstream Apache-2.0 license and NOTICE\n  file are preserved in the download location.',
  },
  {
    name: 'PlantUML',
    version: TOOL_VERSIONS.plantuml,
    url: 'https://github.com/plantuml/plantuml',
    license: "GPL-3.0-or-later with PlantUML's output exception (see upstream LICENSE / PlantUML licensing guidance)",
    description: 'Diagram rendering tool for converting PlantUML text to images',
    downloadedAt: 'Runtime (on first use)',
    notes:
      'Archlette downloads PlantUML from the official upstream release URL at runtime and stores it under\n  `~/.archlette/tools/` (not bundled in the npm package). PlantUML describes an output exception intended to allow\n  distribution of generated diagrams under terms independent of PlantUML itself; see https://plantuml.com/license for details.',
  },
];

// Generate NPM dependencies with full license texts
console.log('🔍 Scanning NPM dependencies...');
let npmLicenses = '';
let detailedLicenses = '';
let packageCount = 0;

try {
  // Get ALL production dependencies with full details
  const allLicenseData = execSync('npx license-checker-rseidelsohn --production --json', {
    encoding: 'utf8',
    cwd: rootDir,
  });

  const allLicenses = JSON.parse(allLicenseData);
  // Exclude the archlette package itself (not a third-party dependency)
  const allPackages = Object.entries(allLicenses).filter(
    ([pkg]) => !pkg.startsWith('@chrislyons-dev/archlette@') && !pkg.startsWith('archlette@')
  );
  packageCount = allPackages.length;

  console.log(`✓ Found ${packageCount} production dependencies\n`);

  // Check for non-standard licenses
  const nonStandardData = execSync(
    'npx license-checker-rseidelsohn --production --json --excludeLicenses "MIT,ISC,Apache-2.0,BSD-3-Clause,BSD-2-Clause,CC0-1.0,Unlicense,BlueOak-1.0.0"',
    { encoding: 'utf8', cwd: rootDir },
  );

  const nonStandardLicenses = JSON.parse(nonStandardData);
  const nonStandardCount = Object.keys(nonStandardLicenses).length;

  if (nonStandardCount > 0) {
    console.warn(`⚠️  Found ${nonStandardCount} packages with non-standard licenses:`);
    npmLicenses += '\n### ⚠️ Non-Standard Licenses\n\n';
    npmLicenses +=
      'The following dependencies use licenses that require additional review:\n\n';
    npmLicenses += '| Package | Version | License | License Link |\n';
    npmLicenses += '|---------|---------|---------|-------------|\n';

    for (const [pkg, info] of Object.entries(nonStandardLicenses)) {
      const [name, version] = pkg.split('@').filter(Boolean);
      const licenseId = info.licenses || 'Unknown';
      
      // Add direct links to known license types
      let licenseLink = 'N/A';
      if (licenseId === 'BlueOak-1.0.0') {
        licenseLink = '[BlueOak-1.0.0](https://blueoakcouncil.org/license/1.0.0)';
      } else if (info.licenseFile) {
        licenseLink = `See below`;
      }
      
      npmLicenses += `| ${name} | ${version} | ${licenseId} | ${licenseLink} |\n`;
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

  // Generate detailed license texts section
  detailedLicenses += '\n---\n\n## Full License Texts and Copyright Notices\n\n';
  detailedLicenses +=
    'The following section includes the complete copyright notices and license texts for all production dependencies, as required by their respective licenses (MIT, ISC, BSD, Apache-2.0, etc.).\n\n';
  detailedLicenses += '---\n\n';

  // Sort packages alphabetically for easier reference
  const sortedPackages = allPackages.sort(([a], [b]) => a.localeCompare(b));

  for (const [pkg, info] of sortedPackages) {
    const [name, version] = pkg.split('@').filter(Boolean);
    detailedLicenses += `### ${name}@${version}\n\n`;
    detailedLicenses += `- **License**: ${info.licenses || 'Unknown'}\n`;
    detailedLicenses += `- **Repository**: ${info.repository || 'N/A'}\n`;
    
    if (info.publisher) {
      detailedLicenses += `- **Publisher**: ${info.publisher}\n`;
    }
    
    detailedLicenses += '\n';

    // Include full license text if available
    if (info.licenseFile && fs.existsSync(info.licenseFile)) {
      try {
        // Read license file exactly as-is, preserving all formatting
        const licenseText = fs.readFileSync(info.licenseFile, 'utf8');
        
        detailedLicenses += '**License Text:**\n\n';
        detailedLicenses += '```\n';
        detailedLicenses += licenseText;
        detailedLicenses += '\n```\n\n';
      } catch {
        detailedLicenses += `_License file exists but could not be read: ${info.licenseFile}_\n\n`;
      }
    } else {
      detailedLicenses += `_No license file found in package_\n\n`;
    }
    
    // Include NOTICE file if present (required for Apache-2.0)
    const packageDir = path.dirname(info.licenseFile || '');
    const noticeFile = path.join(packageDir, 'NOTICE');
    if (fs.existsSync(noticeFile)) {
      try {
        // Read NOTICE file exactly as-is, preserving all formatting
        const noticeText = fs.readFileSync(noticeFile, 'utf8');
        detailedLicenses += '**NOTICE:**\n\n';
        detailedLicenses += '```\n';
        detailedLicenses += noticeText;
        detailedLicenses += '\n```\n\n';
      } catch {
        detailedLicenses += `_NOTICE file exists but could not be read: ${noticeFile}_\n\n`;
      }
    }

    detailedLicenses += '---\n\n';
  }

  console.log('✓ NPM dependencies scanned\n');
} catch (err) {
  console.error('Error scanning NPM dependencies:', err.message);
  npmLicenses = '\n_Error generating NPM license summary_\n';
  detailedLicenses = '\n_Error generating detailed license texts_\n';
}

// Build the complete markdown file
const markdown = `# Third-Party Licenses

> This file is generated by \`npm run licenses:generate\`. Do not edit by hand.

This document lists third-party software used by Archlette and includes the **complete copyright notices and license texts**
as required by the applicable licenses.

> **Note:** License texts are reproduced verbatim from upstream files. Some may contain unusual formatting (including triple quotes, separators, etc.).

## Distribution Method

Archlette is distributed as an **npm package** containing:
- Compiled TypeScript in the \`dist/\` directory
- This license file (\`THIRD-PARTY-NOTICES.md\`)
- References to runtime tools (Structurizr CLI, PlantUML) that are **downloaded at runtime** (not bundled)

In standard npm installations, license texts for dependencies are typically available within \`node_modules/\`.
This file consolidates those notices to support redistribution scenarios where \`node_modules/\` may not be present
(e.g., bundled artifacts, compiled binaries, or repackaged distributions).

---

## License Categories

This file includes:
- **NPM Dependencies**: All **production dependencies (direct + transitive)** included in the published npm package, with full license texts below
- **Runtime Tools**: Downloaded automatically on first use (not redistributed in the npm package)

---

## Runtime-Downloaded Tools

Archlette automatically downloads the following tools to \`~/.archlette/tools/\` when needed for diagram rendering.
**These tools are NOT bundled or redistributed** with the Archlette npm package. They are listed here for transparency;
if you redistribute these tools separately, you must follow their upstream license terms.

${RUNTIME_TOOLS.map(
  (tool) => `
### ${tool.name} v${tool.version}

- **Project**: ${tool.url}
- **License**: ${tool.license}
- **Description**: ${tool.description}
- **Downloaded**: ${tool.downloadedAt}
${tool.notes ? `- **Notes**: ${tool.notes}` : ''}
`,
).join('\n')}

---

## NPM Dependencies

The following packages are included as **production dependencies (direct + transitive)** in the published npm package:

${npmLicenses}

${detailedLicenses}

---

## Regenerating This File

To regenerate this file with the latest dependency information:

\`\`\`bash
npm run licenses:generate
\`\`\`

This script:
1. Extracts tool versions from \`src/core/tool-manager.ts\`
2. Scans **production dependencies only** via \`license-checker-rseidelsohn --production\`
3. Excludes the Archlette package itself (not a third-party dependency)
4. Extracts full license texts from each dependency's LICENSE/COPYING file
5. Includes NOTICE files when present (required for Apache-2.0 compliance)
6. Combines into this comprehensive license document with complete copyright notices

---

**Last generated**: ${new Date().toISOString().split('T')[0]}
`;

// Write the file
fs.writeFileSync(outputFile, markdown, 'utf8');
console.log(`✅ License file generated: ${outputFile}`);
console.log(`   File includes full license texts for all ${packageCount} dependencies\n`);

// Warn about non-standard licenses — does not fail the script so callers
// (check-licenses.mjs, CI) can still compare file contents and decide policy.
if (npmLicenses.includes('⚠️')) {
  console.warn(
    '⚠️  Some dependencies use non-standard licenses. Please review manually.\n',
  );
}
