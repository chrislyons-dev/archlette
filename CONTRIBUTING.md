# 🤝 Contributing to Archlette

Welcome!  
Archlette is a **repository-agnostic Architecture-as-Code toolkit** that turns your infrastructure and source into living architecture docs.  
This guide explains how to contribute, test, and extend the system.

---

## 🧭 Project Capsule

| Area                 | Summary                                                             |
| -------------------- | ------------------------------------------------------------------- |
| **Package**          | `@chrislyons-dev/archlette`                                         |
| **License**          | MIT                                                                 |
| **Config File**      | `aac.yaml` (repo root)                                              |
| **Key Scripts**      | `aac:init`, `aac:gen`, `aac:validate`, `aac:publish`                |
| **Languages**        | Node (ESM), TypeScript, YAML                                        |
| **Dependencies**     | `globby`, `yaml`, `execa`                                           |
| **Dev Dependencies** | `vitest`, `eslint`, `prettier`, `husky`, `commitlint`, `typescript` |
| **Docs**             | Auto-published to `gh-pages` via GitHub Actions                     |

---

## 🧩 Extractor Framework

Archlette uses a **pluggable extractor system** to discover architecture metadata from code and infrastructure.

**Files & structure**

```
src/
  extractors/
    index.js
    util/glob.js
    builtin/
      terraform.js
      code-annotations.js
      openapi.js
  ir/aggregate.js
  core/
    run.js
    c4map.js
```

**Built-in extractors**
| Extractor | Purpose | Output Entities |
|------------|----------|-----------------|
| `builtin/terraform` | Parses `.tf` files for infra resources | `infra:*` |
| `builtin/code-annotations` | Scans JS/TS/PY for `@service`, `@component`, `@depends_on` | `container:*`, `component:*`, `relation:*` |
| `builtin/openapi` | Reads OpenAPI 3 specs → APIs + relations | `api:*`, `container:*`, `relation:*` |

All extractors emit a standard object:

```js
{ entities: [], relations: [] }
```

These are merged into the **Intermediate Representation (IR)**:

```
.archlette/ir.json
```

---

## 🧠 IR Aggregation & Generation

- `aggregateIR()` collects results from all extractors.
- `runGenerate()` orchestrates the pipeline:
  1. Load config (`aac.yaml`)
  2. Aggregate IR
  3. Generate diagrams (Mermaid C4, PlantUML, Inframap)

C4 mapping (`c4map.js`) automatically projects APIs → containers with technology `"HTTP API (OpenAPI)"`.

---

## 🧪 Tests

**Integration fixture:**

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

**Behavior**

- Builds `.archlette/ir.json`
- Generates Mermaid C4 diagram in `docs/architecture/`
- Verifies file creation and contents

**Run tests**

```bash
npm test
```

---

## 🧑‍💻 Coding Standards

- **Linting:** `npm run lint` (ESLint v9 + Prettier)
- **Type checking:** `npm run typecheck`
- **Formatting:** `npm run format`
- **Pre-commit:** enforced via Husky + `lint-staged`
- **Commits:** Conventional style
  - Example:

    ```
    feat(core): add modular extractor framework and IR generation

    Implements the standardized extractor architecture for Archlette.

    Written-by: Chris Lyons
    ```

---

## 🚀 CI/CD

- **CI (`.github/workflows/ci.yml`)** – lint, typecheck, and tests (including integration fixture)
- **CD (`.github/workflows/cd.yml`)** – publishes package to npm
- **Docs (`.github/workflows/docs.yml`)** – builds and publishes site to GitHub Pages

---

## 🧩 Extending Archlette

Create your own extractor by exporting a `run(ctx)` function:

```js
// extractors/my-extractor.js
export async function run(ctx) {
  const { globby } = await import('globby');
  const files = await globby('src/**/*.js');
  const entities = files.map((f) => ({ id: `component:${f}`, type: 'component' }));
  return { entities };
}
```

Then register it in `aac.yaml`:

```yaml
extractors:
  - use: ./extractors/my-extractor.js
    name: myExtractor
    inputs:
      include: ['src/**/*.js']
```

---

## 🙌 Pull Requests

1. Create a feature branch
   ```bash
   git checkout -b feat/<feature-name>
   ```
2. Run pre-commit hooks locally
3. Ensure all tests pass (`npm test`)
4. Submit a PR with a clear title and short body

Thank you for helping Archlette evolve — where **code speaks, and architecture listens.**
