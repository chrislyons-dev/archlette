# License Management

Archlette tracks every dependency. Automatically.

**NPM packages** — From `package.json`
**Runtime tools** — Downloaded on first use

All captured in `THIRD_PARTY_LICENSES.md`.

---

## Runtime Tools

Archlette downloads tools to `~/.archlette/tools/` when needed:

**Structurizr CLI** (Apache-2.0)
Exports DSL to PlantUML and Mermaid formats
[github.com/structurizr/cli](https://github.com/structurizr/cli)

**PlantUML** (GPL-3.0-or-later)
Renders diagrams to PNG images
[github.com/plantuml/plantuml](https://github.com/plantuml/plantuml)

---

## Commands

Generate license file:

```bash
npm run licenses:generate
```

Check if current:

```bash
npm run licenses:check
```

CI runs the check automatically. Check fails. Run generate. Commit. Done.

---

## Adding Runtime Tools

Three steps:

**1. Update tool manager** (`src/core/tool-manager.ts`):

```typescript
const TOOL_VERSIONS = {
  structurizr: '2025.05.28',
  plantuml: '1.2025.8',
  newtool: '1.0.0', // Add here
};
```

**2. Update license script** (`scripts/generate-licenses.mjs`):

```javascript
const RUNTIME_TOOLS = [
  {
    name: 'NewTool',
    version: TOOL_VERSIONS.newtool,
    url: 'https://github.com/org/newtool',
    license: 'MIT',
    licenseUrl: 'https://github.com/org/newtool/blob/main/LICENSE',
    description: 'Tool description',
    downloadedAt: 'Runtime (on first use)',
  },
];
```

**3. Regenerate**:

```bash
npm run licenses:generate
git add THIRD_PARTY_LICENSES.md
git commit -m "docs: add new runtime tool license"
```

---

## Acceptable Licenses

MIT, ISC, Apache-2.0, BSD-2-Clause, BSD-3-Clause, CC0-1.0, Unlicense.

Non-standard licenses are flagged for manual review. The script exits with error. Review. Approve. Document exceptions.

---

## Troubleshooting

**CI check fails**
Run `npm run licenses:generate`. Commit updated file.

**Non-standard license detected**
Find alternative dependency. If none exists, document why it's needed in this file.

**Version extraction fails**
Update regex patterns in `scripts/generate-licenses.mjs`. Test with `npm run licenses:generate`.

---

## Resources

- [Choose a License](https://choosealicense.com/)
- [SPDX License List](https://spdx.org/licenses/)
- [NPM License Checker](https://github.com/davglass/license-checker)
