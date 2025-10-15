# 🤝 Contributing to Archlette

Welcome!  
Archlette is a **repository-agnostic Architecture-as-Code toolkit** that turns infrastructure and source into living architecture docs.  
This guide explains how to contribute, test, and extend the plugin-based pipeline.

---

## 🧭 Project Capsule

| Area                 | Summary                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- |
| **Package**          | `@chrislyons-dev/archlette`                                                               |
| **License**          | MIT                                                                                       |
| **Config File**      | `aac.yaml` (repo root)                                                                    |
| **Core Scripts**     | `aac:init`, `aac:gen`, `aac:extract`, `aac:validate`, `aac:dsl`, `aac:images`, `aac:docs` |
| **Languages**        | Node (ESM), TypeScript, YAML                                                              |
| **Dependencies**     | `globby`, `yaml`, `execa`                                                                 |
| **Dev Dependencies** | `vitest`, `eslint`, `prettier`, `husky`, `commitlint`, `typescript`, `ajv`, `ajv-formats` |
| **Docs**             | Published to `gh-pages` via GitHub Actions                                                |

---

## 🧩 Code structure (plugin-based)

```

src/
core/
config.js           # load aac.yaml
context.js          # build ctx (fs/glob/sh helpers)
run.js              # runExtract/runValidate/runDsl/runImages/runDocs + generate
plugin.js           # resolve "use:" (local path, npm, builtin/*)
log.js
ir/
aggregate.js        # merge extractor results → IR
schema.json         # IR JSON Schema (2020-12)
extractors/
index.js            # registry + runner (built-ins resolved here)
builtin/
terraform.js
code-annotations.js
openapi.js
validators/
index.js
builtin/
schema.js         # Ajv 2020 validator for IR
generators/
dsl/
index.js
structurizr.js    # IR → Structurizr DSL
renderers/
index.js
builtin/
structurizr-cli.js# export SVG/PNG via Structurizr CLI
docs/
index.js
builtin/
index.js          # simple docs index writer

```

---

## 🧱 Stages & extension points

Each stage is a chain of plugins. Every plugin is an ESM module that exports `run(ctx)` and can read its `inputs` from `aac.yaml`.

### 1) **extract**

- **Goal:** produce IR fragments `{ entities, relations, artifacts }` merged into `.archlette/ir.json`.
- **Register:** `extractors: [ { use, inputs } ]`
- **Built-ins:** `builtin/terraform`, `builtin/code-annotations`, `builtin/openapi`

### 2) **validate**

- **Goal:** check IR schema + rules; fail fast with crisp errors.
- **Register:** `validators: [ { use, inputs } ]`
- **Built-ins:** `builtin/schema` (Ajv 2020-12)

### 3) **dsl**

- **Goal:** IR → view language (Structurizr DSL by default).
- **Register:** `dsl: [ { use, inputs } ]`
- **Built-ins:** `builtin/structurizr`

### 4) **images**

- **Goal:** render diagrams from DSL (PNG/SVG/PUML/Mermaid).
- **Register:** `images: [ { use, inputs } ]`
- **Built-ins:** `builtin/structurizr-cli`

### 5) **docs**

- **Goal:** write simple docs index / pages embedding outputs.
- **Register:** `docsStage: [ { use, inputs } ]`
- **Built-ins:** `builtin/index`

---

## 🔌 Plugin authoring

All plugins receive a **shared context**:

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
  inputs?: Record<string, unknown>;
};
```

Return values by stage:

- **extractors:** `{ entities?: any[], relations?: any[], artifacts?: any[], warnings?: string[] }`
- **validators:** `{ ok: boolean, errors?: { message: string; path?: string }[], warnings?: string[] }`
- **dsl:** `{ files: { path: string; kind: string }[] }`
- **images:** `{ outputs: string[] }`
- **docs:** `{ files: string[] }`

> Error handling: throw `Error` with a clear message; the runner prints stage + plugin name and exits non-zero (unless a future `--continue-on-error` is set).

---

## 🧪 Tests

**Integration fixture** under `tests/integration/archlette-minimal/` runs the full pipeline (IR → DSL → SVG → docs) without touching the repo root outputs.

```bash
npm test
```

---

## 🧑‍💻 Coding Standards

- **Linting:** `npm run lint` (ESLint v9 + Prettier)
- **Type checking:** `npm run typecheck`
- **Formatting:** `npm run format`
- **Pre-commit:** Husky + `lint-staged`
- **Conventional commits** (example):

```
feat(core): add plugin-based stages and Structurizr DSL generator

Introduce validators/dsl/renderers/docs registries and built-ins.
Wire CLI subcommands for extract/validate/dsl/images/docs.

Written-by: Chris Lyons
```

---

## 🚀 CI/CD

- **CI:** lint, typecheck, tests, and pipeline execution (optionally install Structurizr CLI for image export).
- **CD:** publish to npm on tags.
- **Docs:** publish `docs/architecture/` and site via GitHub Pages.

Thanks for helping Archlette evolve — where **code speaks, and architecture listens.**
