# Third-Party Licenses

This document lists all third-party software used by Archlette, including:

- **NPM Dependencies**: Listed in `package.json` and installed via `npm install`
- **Runtime Tools**: Downloaded automatically by Archlette during first use

---

## Runtime-Downloaded Tools

Archlette automatically downloads the following tools to `~/.archlette/tools/` when needed for diagram rendering:

### Structurizr CLI v2025.05.28

- **Project**: [https://github.com/structurizr/cli](https://github.com/structurizr/cli)
- **License**: [Apache-2.0](https://github.com/structurizr/cli/blob/master/LICENSE)
- **Description**: Command-line tool for Structurizr workspace export
- **Downloaded**: Runtime (on first use)
- **Notes**: Automatically downloaded to ~/.archlette/tools/ when rendering diagrams

### PlantUML v1.2025.8

- **Project**: [https://github.com/plantuml/plantuml](https://github.com/plantuml/plantuml)
- **License**: [GPL-3.0-or-later (with exceptions)](https://github.com/plantuml/plantuml/blob/master/LICENSE)
- **Description**: Diagram rendering tool for converting PlantUML text to images
- **Downloaded**: Runtime (on first use)
- **Notes**: Automatically downloaded to ~/.archlette/tools/ when rendering diagrams. PlantUML includes various components under different licenses (Apache 2.0, MIT, LGPL).

---

## NPM Dependencies

The following packages are installed as production dependencies via `package.json`:

### NPM Dependencies Summary

```
├─ MIT: 76
├─ ISC: 10
├─ BSD-3-Clause: 2
├─ Apache-2.0: 1
└─ BSD-2-Clause: 1
```

---

## Regenerating This File

To regenerate this file with the latest dependency information:

```bash
npm run licenses:generate
```

This script:

1. Extracts tool versions from `src/core/tool-manager.ts`
2. Scans production dependencies via `license-checker`
3. Combines into this comprehensive license document

---

**Last generated**: 2025-10-26
