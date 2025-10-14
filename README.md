# 🏗️ Archlette

> **Architecture-as-Code toolkit for automated diagrams, docs, and releases.**  
> _Code speaks. Archlette listens. Architecture evolves._

[![npm version](https://img.shields.io/npm/v/@chrislyons-dev/archlette?color=blue&logo=npm)](https://www.npmjs.com/package/@chrislyons-dev/archlette)
[![CI](https://github.com/chrislyons-dev/archlette/actions/workflows/ci.yml/badge.svg)](https://github.com/chrislyons-dev/archlette/actions/workflows/ci.yml)
[![CD](https://github.com/chrislyons-dev/archlette/actions/workflows/cd.yml/badge.svg)](https://github.com/chrislyons-dev/archlette/actions/workflows/cd.yml)
[![Docs](https://img.shields.io/badge/docs-gh--pages-success?logo=github)](https://chrislyons-dev.github.io/archlette/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A repo-agnostic, drop-in toolkit to generate and publish architecture docs (C4 diagrams, IaC graphs, ADRs) directly from code and infrastructure.

---

## ✨ Features

- **Single `aac.yaml` config** drives discovery, extraction, generation, and publishing
- **Composable extractor framework** (Terraform, code annotations, OpenAPI, etc.)
- **Intermediate Representation (IR)** stored as `.archlette/ir.json`
- **Pluggable generators** (Mermaid C4, PlantUML C4, Inframap)
- **Repo-agnostic GitHub Actions workflows** for CI/CD
- **Pre-commit integration** via Husky or `pre-commit` hooks
- **Templates** for ADRs and docs index pages

---

## 🚀 Quick start

```bash
git clone <this-repo>
npm ci
npm run aac:init
npm run aac:gen
```

Or install from npm in another project:

```bash
npm i -D @chrislyons-dev/archlette
npx archlette init
npx archlette generate
```

---

## 🧩 Extractors

Archlette discovers architecture elements from code and infra through a **configurable pipeline** defined in `aac.yaml`.  
Each extractor reads files, emits standardized entities (systems, containers, components, relations), and merges them into an IR (`.archlette/ir.json`).

### Built-in extractors

| Extractor                                         | Purpose                                                                 | Default Inputs                                         | Output Entities                            |
| ------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------ |
| **Terraform** (`builtin/terraform`)               | Parses `.tf` files to detect infra components                           | `iac/**/*.tf`                                          | `infra:*` entities                         |
| **Code Annotations** (`builtin/code-annotations`) | Scans source files for `@service`, `@component`, and `@depends_on` tags | `services/**`, `apps/**`, `libs/**`, `**/*.{ts,js,py}` | `container:*`, `component:*`, `relation:*` |
| **OpenAPI** (`builtin/openapi`)                   | Extracts API surface and relations from OpenAPI 3 specs                 | `apis/**/openapi*.{yml,yaml,json}`                     | `api:*`, `container:*`, `relation:*`       |

---

### Intermediate Representation (IR)

All extractor results are aggregated into a single JSON file:

```
.archlette/ir.json
```

This file contains:

- `entities` – systems, containers, components, APIs, infra
- `relations` – edges between entities (e.g. `depends_on`, `served_by`)
- `meta` – project name, timestamps, config details

---

## 🔧 Extending Archlette

You can register **custom extractors** via the same interface as built-ins.

### Example: `extractors/python-docstrings.js`

```js
export async function run(ctx) {
  const { globby } = await import('globby');
  const files = await globby('src/**/*.py');
  const entities = [];
  for (const file of files) {
    const text = await ctx.readFile(file);
    if (text.includes('@api')) {
      entities.push({
        id: `component:${file}`,
        type: 'component',
        props: { tech: 'Python Docstring' },
      });
    }
  }
  return { entities };
}
```

Then wire it into your `aac.yaml`:

```yaml
extractors:
  - use: ./extractors/python-docstrings.js
    name: docs
    inputs:
      include: ['src/**/*.py']
```

---

## 🧪 Tests

Archlette includes **fixtures + Vitest integration tests** to validate the extractor pipeline and the full `runGenerate` flow.

### Integration Fixture

```
tests/integration/archlette-minimal/
├─ aac.yaml
├─ iac/main.tf
├─ services/bond/index.ts
├─ apps/worker/handler.py
├─ apis/bond-api/openapi.yaml
├─ docs/architecture/
└─ archlette.integration.spec.js
```

### How it works

1. Loads `aac.yaml` in the fixture directory
2. Executes `runGenerate(cfg, { irOnly: true })` to build `.archlette/ir.json`
3. Executes `runGenerate(cfg, { irOnly: false })` to generate diagrams
4. Asserts both files exist and contain valid output

---

## ⚙️ CI/CD Integration

- **CI** – runs linting, type-checks, and tests (including extractor pipeline)
- **CD** – builds and publishes to npm on tagged releases
- **Docs** – publishes static docs to GitHub Pages

---

## 📄 License

MIT © 2025 Chris Lyons
