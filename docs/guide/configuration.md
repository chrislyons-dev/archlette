# Configuration Reference

Configure Archlette via YAML. Control paths, plugins, extraction patterns.

---

## Minimal Configuration

```yaml
project:
  name: MyProject

extractors:
  - use: extractors/builtin/basic-node
    inputs:
      include: ['src/**/*.ts']
```

That's it. Sensible defaults for everything else.

---

## Project Metadata

```yaml
project:
  name: MyProject # Required - project name
  props: # Optional - custom properties
    version: 1.0.0
    team: Platform
    owner: engineering@example.com
```

Properties appear in generated documentation and DSL.

---

## Output Paths

```yaml
paths:
  ir_out: docs/architecture/ir.json # Intermediate representation
  dsl_out: docs/architecture/workspace.dsl # Structurizr DSL
  render_out: docs/architecture/diagrams # Diagram images
  docs_out: docs/architecture # Documentation pages
```

**Path resolution:**

- Relative paths resolve to project directory (where config file lives)
- Absolute paths work as-is
- `~` expands to home directory

**Defaults:**

- `ir_out`: `./aac-ir.json`
- `dsl_out`: `./aac.dsl`
- `render_out`: `./diagrams`
- `docs_out`: `./docs`

---

## Default Glob Patterns

Set defaults for all extractors:

```yaml
defaults:
  includes: ['**/*'] # Include everything by default
  excludes: # Exclude common non-source directories
    - 'node_modules/**'
    - '.git/**'
    - 'dist/**'
    - 'build/**'
    - 'coverage/**'
    - '**/*.test.ts'
    - '**/*.spec.ts'
```

Extractors inherit these unless overridden.

---

## Extractors

Configure source code analysis:

```yaml
extractors:
  - use: extractors/builtin/basic-node
    name: main-codebase # Optional - for logging
    inputs:
      include:
        - 'src/**/*.ts'
        - 'src/**/*.tsx'
      exclude:
        - '**/*.test.ts'
        - '**/mocks/**'
```

**Built-in extractors:**

- `extractors/builtin/basic-node` — TypeScript/JavaScript (via ts-morph)

**Multiple extractors:**

```yaml
extractors:
  # First extractor provides system metadata
  - use: extractors/builtin/basic-node
    name: root
    inputs:
      include: ['package.json', 'README.md']

  # Subsequent extractors add components
  - use: extractors/builtin/basic-node
    name: api-service
    inputs:
      include: ['packages/api/**/*.ts']

  - use: extractors/builtin/basic-node
    name: web-app
    inputs:
      include: ['packages/web/**/*.tsx']
```

**Extractor execution:**

- Run in order
- First extractor defines system name/description
- Subsequent extractors contribute containers/components
- Results aggregated and deduplicated

---

## Validators

Configure validation and enrichment:

```yaml
validators:
  - use: validators/builtin/base-validator # Schema validation
```

**Built-in validators:**

- `validators/builtin/base-validator` — Zod schema validation

**Execution:**

- Run sequentially
- Each validator receives output from previous
- Chain transforms: IR → Validator1 → Modified IR → Validator2 → Final IR

**Custom validators:**

```yaml
validators:
  - use: validators/builtin/base-validator
  - use: ./custom/validators/business-rules
```

---

## Generators

Configure DSL generation:

```yaml
generators:
  - use: generators/builtin/structurizr # Structurizr workspace
```

**Built-in generators:**

- `generators/builtin/structurizr` — Structurizr DSL workspace

**Multiple generators:**

```yaml
generators:
  - use: generators/builtin/structurizr
  - use: ./custom/generators/mermaid-direct # Custom generator
```

---

## Renderers

Configure diagram rendering:

```yaml
renderers:
  - use: renderers/builtin/structurizr-export # Export DSL to PlantUML/Mermaid
  - use: renderers/builtin/plantuml-render # Render PlantUML to PNG
```

**Built-in renderers:**

- `renderers/builtin/structurizr-export` — Export to PlantUML and Mermaid
- `renderers/builtin/plantuml-render` — Render PlantUML to PNG

**Order matters:**
Export before render. Structurizr DSL → PlantUML → PNG.

**Tool management:**
Renderers automatically download tools to `~/.archlette/tools/`:

- Structurizr CLI (for export)
- PlantUML (for rendering)

First run downloads. Subsequent runs use cache.

---

## Docs

Configure documentation generation:

```yaml
docs:
  - use: builtin/markdown-docs # System overview + component pages
```

**Built-in docs generators:**

- `builtin/markdown-docs` — Markdown pages with embedded diagrams

**Output:**

- `README.md` — System overview
- `{component-id}.md` — Individual component pages

---

## Complete Example

Full configuration with all stages:

```yaml
project:
  name: MyProject
  props:
    version: 1.0.0
    team: Platform

paths:
  ir_out: docs/architecture/ir.json
  dsl_out: docs/architecture/workspace.dsl
  render_out: docs/architecture/diagrams
  docs_out: docs/architecture

defaults:
  includes: ['**/*']
  excludes:
    - 'node_modules/**'
    - '.git/**'
    - 'dist/**'
    - '**/*.test.ts'

extractors:
  - use: extractors/builtin/basic-node
    inputs:
      include:
        - 'src/**/*.ts'
        - 'src/**/*.tsx'
      exclude:
        - '**/mocks/**'

validators:
  - use: validators/builtin/base-validator

generators:
  - use: generators/builtin/structurizr

renderers:
  - use: renderers/builtin/structurizr-export
  - use: renderers/builtin/plantuml-render

docs:
  - use: docs/builtin/markdown-docs
```

---

## Monorepo Pattern

Multiple extractors for multi-package repos:

```yaml
project:
  name: MyMonorepo

extractors:
  # Root package provides system metadata
  - use: extractors/builtin/basic-node
    name: system-root
    inputs:
      include: ['package.json', 'README.md']

  # Each package becomes a container
  - use: extractors/builtin/basic-node
    name: gateway
    inputs:
      include: ['services/gateway/**/*.ts']

  - use: extractors/builtin/basic-node
    name: pricing
    inputs:
      include: ['services/pricing/**/*.ts']

  - use: extractors/builtin/basic-node
    name: ui
    inputs:
      include: ['apps/web/**/*.tsx']
```

**Result:**
One system with multiple containers (gateway, pricing, ui).

---

## Custom Plugins

Reference custom plugins by path:

```yaml
extractors:
  - use: ./plugins/terraform-extractor
    inputs:
      include: ['**/*.tf']

  - use: ./plugins/openapi-extractor
    inputs:
      include: ['api-spec.yaml']

validators:
  - use: ./plugins/business-rules-validator

generators:
  - use: ./plugins/custom-dsl-generator
```

**Path resolution:**

- Relative paths resolve to archlette installation directory
- Use `./` for plugins in project directory
- Use full paths for external plugins

---

## Environment-Specific Configs

Create multiple config files:

```
.aac.yaml              # Default
.aac.dev.yaml          # Development
.aac.prod.yaml         # Production
```

Run with specific config:

```bash
npx archlette -f .aac.dev.yaml
npx archlette -f .aac.prod.yaml
```

---

## See Also

- [Quick Start](../getting-started/quick-start.md) — Working example
- [Annotations](annotations.md) — JSDoc tags reference
- [CLI Reference](../reference/cli.md) — Command-line options
