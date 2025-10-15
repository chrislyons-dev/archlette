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

- **Plugin-based pipeline** with five stages:
  1. **extract** (build IR), 2) **validate** (IR schema & rules),
  2. **dsl** (generate Structurizr DSL), 4) **images** (export SVG/PNG),
  3. **docs** (write index/pages).
- **Composable plugins per stage**: built-ins plus user-provided modules.
- **Intermediate Representation (IR)** at `.archlette/ir.json`.
- **Structurizr DSL as the view layer** (stable layouts, C4 semantics); Mermaid/PUML export supported via tools.
- **Repo-agnostic CI/CD** templates and docs site publishing.

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

## 🔧 Configuration (aac.yaml)

Archlette loads `aac.yaml` from the repo root and runs each stage as a chain of plugins.

```yaml
project: { name: Archlette }

ir: { path: .archlette/ir.json, publish_copy: true }
docs: { out_dir: docs/architecture }

extractors:
  - use: builtin/terraform
    inputs: { include: ['iac/**'] }
  - use: builtin/code-annotations
    inputs:
      include: ['services/**', 'apps/**', '**/*.{ts,js,py}']
      annotations: ['@service', '@component', '@depends_on']
  - use: builtin/openapi
    inputs:
      include: ['apis/**/openapi*.{yml,yaml,json}']
      container_hint: 'container:api'

validators:
  - use: builtin/schema
  # - use: ./plugins/validators/no-dangling.js   # example custom rule

generators:
  - use: builtin/structurizr
    inputs:
      out_dir: build/structurizr
      views: ['C1', 'C2', 'C3']
      autolayout: { direction: lr, rankSeparation: 200 }
      styles:
        api: { background: '#e3f2fd', color: '#0d47a1', shape: 'RoundedBox' }
        infra: { background: '#f3e5f5', color: '#4a148c', shape: 'Hexagon' }

renderers:
  - use: builtin/structurizr-cli
    inputs:
      in: build/structurizr/workspace.dsl
      out_dir: docs/architecture/structurizr
      formats: ['svg']
      cli: structurizr

docs:
  - use: builtin/index
    inputs: { out_dir: docs/architecture }
```

---

## 🧠 Pipeline outputs

- **extract** → `.archlette/ir.json`
- **validate** → ensures IR matches JSON Schema + custom rules
- **dsl** → `build/structurizr/workspace.dsl`
- **images** → `docs/architecture/structurizr/*.svg|png`
- **docs** → `docs/architecture/index.md` (+ links to IR & images)

---

## 🧩 Built-in plugins

**Extractors**

- `builtin/terraform`: parse `.tf` into `infra:*`
- `builtin/code-annotations`: scan JS/TS/PY for `@service`, `@component`, `@depends_on`
- `builtin/openapi`: parse OpenAPI 3 → `api:*`, relations

**Validators**

- `builtin/schema`: Ajv (JSON Schema 2020-12) of IR

**DSL generators**

- `builtin/structurizr`: IR → Structurizr DSL workspace

**Renderers (images)**

- `builtin/structurizr-cli`: export PNG/SVG via Structurizr CLI

**Docs writers**

- `builtin/index`: minimal gallery + IR link

---

## 🧰 CLI

```
archlette init
archlette generate              # extract → validate → dsl → images → docs
archlette extract               # just build IR
archlette validate              # Ajv + custom rules
archlette dsl                   # IR → Structurizr DSL
archlette images                # DSL → SVG/PNG (Structurizr CLI)
archlette docs                  # write docs index
```

Flags: `--config <path>`, `--base-dir <dir>`, `--ir-only` (for `generate`), `--quiet`, `--verbose`.

---

## 🧪 Tests

An integration fixture runs the full pipeline in isolation:

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

- builds `.archlette/ir.json`
- generates `workspace.dsl` + SVGs
- asserts files exist

```bash
npm test
```

---

## 🧩 Extending Archlette (plugins)

All plugins are ESM modules that export `run(ctx)`.
The **context** gives you helpers to read/write files, glob, and shell out:

```ts
type ArchletteCtx = {
  repoRoot: string;
  cfg: any;
  paths: { ir: string; build: string; docsOut: string };
  artifacts: Map<string, unknown>;
  log: (...args: any[]) => void;
  readFile(path: string): Promise<string>;
  writeFile(path: string, text: string): Promise<void>;
  glob(patterns: string[]): Promise<string[]>;
  sh(cmd: string, args?: string[], opts?: object): Promise<void>;
  inputs?: Record<string, unknown>; // per-plugin inputs from aac.yaml
};
```

**Examples**

- **Validator** (no dangling edges):

```js
// plugins/validators/no-dangling.js
export async function run(ctx) {
  const ir = JSON.parse(await ctx.readFile(ctx.paths.ir));
  const ids = new Set(ir.entities.map((e) => e.id));
  const bad = (ir.relations || []).filter((r) => !ids.has(r.from) || !ids.has(r.to));
  return bad.length
    ? {
        ok: false,
        errors: bad.map((b) => ({ message: `dangling: ${b.from} -> ${b.to}` })),
      }
    : { ok: true };
}
```

- **Docs writer** (simple gallery):

```js
// plugins/docs/gallery.js
import path from 'node:path';
export async function run(ctx) {
  const out = ctx.inputs?.out_dir || ctx.paths.docsOut;
  const imgs = await ctx.glob([path.join(out, '**/*.svg'), path.join(out, '**/*.png')]);
  const rel = (p) => p.replace(out + path.sep, '').replace(out + '/', '');
  const md = [
    '# Architecture',
    '',
    `- [IR](./${path.relative(out, ctx.paths.ir).replace(/\\/g, '/')})`,
    '',
    ...imgs.map((p) => `![](${rel(p).replace(/\\/g, '/')})`),
  ].join('\n');
  await ctx.writeFile(path.join(out, 'index.md'), md);
  return { files: [path.join(out, 'index.md')] };
}
```

---

## 📄 License

MIT © 2025 Chris Lyons
