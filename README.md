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
  1. **extract** build an intermediate representation (IR) of the system
  2. **validate** validates the IR schema & rules
  3. **generate** generates Structurizr DSL from the IR
  4. **render** export Mermaid/PUML and SVG/PNG
  5. **docs** write index/pages
- **Composable plugins per stage**: built-ins plus user-provided modules.
- **Intermediate Representation (IR)** in a JSON format
- **Structurizr DSL as the view layer** providing stable layouts and C4 semantics
- **Produces document-friendly visual representations of the architecture** Mermaid/PUML and PNG exports supported via tools.
- **Repo-agnostic CI/CD** templates and docs site publishing.

---

## 🚀 Quick start

```bash
git clone <this-repo>
npm ci
npm run aac:all
```

Or install from npm in another project:

```bash
npm i -D @chrislyons-dev/archlette
npx archlette all
```

---

## 📝 Architecture annotations

Archlette follows a **code-driven** approach—your code structure defines the architecture, with optional JSDoc annotations for relationships and actors.

### Supported JSDoc tags

**Component identification** (file-level):

```typescript
/**
 * @component UserService
 * User management and authentication
 */
```

Also supported: `@module`, `@namespace`

**Actor relationships** (file-level):

```typescript
/**
 * @component ApiGateway
 * @actor User {Person} {in} End user making API requests
 * @actor Database {System} {out} PostgreSQL for persistence
 * @actor MessageQueue {System} {both} RabbitMQ broker
 * @actor Cache {System} Redis (defaults to bidirectional)
 */
```

- **Direction control**:
  - `{in}`: Actor → Component (actor uses/calls the component)
  - `{out}`: Component → Actor (component uses/calls the actor)
  - `{both}` or omitted: Bidirectional (default)

**Component dependencies** (file-level):

```typescript
/**
 * @component OrderService
 * @uses PaymentService Processes payments for orders
 * @uses InventoryService Checks product availability
 */
```

### What gets extracted automatically

Archlette extracts from your code without annotations:

- **Classes** (exports, inheritance, methods, properties)
- **Functions** (regular and arrow functions)
- **Type aliases** and **interfaces**
- **Imports** (code-level dependencies)

Annotations are **optional**—use them to define system-level relationships and actors.

---

## 🔧 Configuration (aac.yaml)

Archlette loads `aac.yaml` from the repo root and runs each stage as a chain of plugins.

```yaml
# Default AAC YAML configuration
# (Add your default config values here)
project: { name: Archlette }

paths:
  ir_out: ../docs/architecture/aac-ir.json
  dsl_out: ../docs/architecture/aac.dsl
  render_out: ../docs/architecture/diagrams
  docs_out: ../docs/architecture

# config yaml in, ir json out
extractors:
  # each extractor receives the specified inputs and produces ir json
  - use: ./extractors/builtin/basic-node
    inputs: { include: ['src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'] }

# ir json in, ir json out (or errors)
validators:
  - use: validators/builtin/base-validator

# ir json in, dsl out
generators:
  - use: generators/builtin/structurizr

# dsl in, images out
# Renderers run sequentially - order matters!
# 1. Export DSL to PlantUML/Mermaid
# 2. Render PlantUML to PNG images
renderers:
  - use: renderers/builtin/structurizr-export
  - use: renderers/builtin/plantuml-render

# dsl & images in, docs out
docs:
  - use: docs/builtin/markdown-docs
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
archlette extract: create the interim representation
archlette val: extract and validate
archlette gen: extract, validate, and generate the Structurizr DSL
archlette render: extract, validate, generate, and render images
archlette docs: run the whole pipeline
archlette all: run the whole pipeline
```

Flags: `--config <path>`, `--base-dir <dir>`, `--ir-only` (for `generate`), `--quiet`, `--verbose`.

---

## 🧩 Extending Archlette (plugins)

All plugins are ESM modules that export `run(ctx)`.

**TODO**: Describe the ESM modules for various stages

---

## 📄 License

MIT © 2025 Chris Lyons
