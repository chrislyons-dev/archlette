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

## Config File Location

**Default:** Archlette looks for `templates/default.yaml` in its installation directory.

**Custom config:**

```bash
archlette -f .aac.yaml           # Current directory
archlette -f configs/dev.yaml    # Relative to current directory
archlette -f ~/configs/prod.yaml # Home directory
archlette -f /etc/archlette.yaml # Absolute path
```

**Config file path resolution:** The `-f` flag resolves paths from your current working directory (where you run the command).

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

**Path resolution:** Relative paths resolve from config file location.

**Examples:**

```yaml
# Relative to config file
paths:
  docs_out: docs/architecture        # ./docs/architecture from config location

# Absolute paths
paths:
  docs_out: /var/www/architecture    # exact location

# Home directory
paths:
  docs_out: ~/Documents/architecture # expands to user home
```

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

**Plugin Path Resolution:**

Plugin paths (`use:` field) are resolved relative to Archlette's installation directory. This allows using built-in plugins like `extractors/builtin/basic-node`.

**For custom plugins:**

- Relative paths (no leading `./` or `/`) resolve to Archlette installation
- `./` prefix resolves to project directory (not recommended for plugins)
- Absolute paths work as-is
- `~` expands to home directory

**Recommended pattern:** Install custom plugins in Archlette's plugin directory or use absolute paths:

```yaml
# Absolute path (recommended for project-specific plugins)
extractors:
  - use: /home/user/myproject/plugins/custom-extractor

# Home directory
extractors:
  - use: ~/shared-plugins/terraform-extractor
```

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

## Path Resolution Reference

Archlette uses different path resolution strategies depending on context. Understanding these helps you organize configs, plugins, and themes effectively.

### Config File Path (`-f` flag)

**Resolution:** From your current working directory (where you run `archlette`).

**Examples:**

```bash
# Current directory
archlette -f .aac.yaml

# Relative to CWD
archlette -f configs/dev.yaml

# Home directory
archlette -f ~/.config/archlette.yaml

# Absolute path
archlette -f /etc/archlette/config.yaml
```

**Why CWD-relative:** Users expect `-f ./config.yaml` to work from wherever they run the command.

### Output Paths (in config)

**Resolution:** From config file location.

**Examples:**

```yaml
# With config at: /home/user/project/.aac.yaml

paths:
  docs_out: docs/architecture        # → /home/user/project/docs/architecture
  docs_out: ../shared/docs           # → /home/user/shared/docs
  docs_out: ~/output/docs            # → /home/user/output/docs
  docs_out: /var/www/docs            # → /var/www/docs
```

**Why config-relative:** Keeps output near your project, regardless of where you run `archlette`.

### Plugin Paths (`use:` field)

**Resolution:** From Archlette installation directory.

**Examples:**

```yaml
# With Archlette installed at: /usr/local/lib/node_modules/archlette/

extractors:
  - use: extractors/builtin/basic-node
    # → /usr/local/lib/node_modules/archlette/extractors/builtin/basic-node

  - use: ~/plugins/terraform-extractor
    # → /home/user/plugins/terraform-extractor

  - use: /opt/company/plugins/custom-extractor
    # → /opt/company/plugins/custom-extractor
```

**Why CLI-relative:** Built-in plugins resolve automatically. Custom plugins use absolute paths or home directory.

### Theme Paths (in generator inputs)

**Resolution:** From config file location.

**Examples:**

```yaml
# With config at: /home/user/project/.aac.yaml

generators:
  - use: generators/builtin/structurizr
    inputs:
      theme: themes/custom.dsl       # → /home/user/project/themes/custom.dsl
      theme: ../shared-themes/dark.dsl # → /home/user/shared-themes/dark.dsl
      theme: ~/themes/brand.dsl      # → /home/user/themes/brand.dsl
      theme: /opt/themes/company.dsl # → /opt/themes/company.dsl
```

**Why config-relative:** Themes are project assets, kept alongside config files.

### Summary Table

| Context          | Base Directory            | Supports `~` | Supports `/` |
| ---------------- | ------------------------- | ------------ | ------------ |
| `-f` config file | Current working directory | ✓            | ✓            |
| Output paths     | Config file directory     | ✓            | ✓            |
| Plugin `use:`    | Archlette installation    | ✓            | ✓            |
| Theme paths      | Config file directory     | ✓            | ✓            |

---

## See Also

- [Quick Start](../getting-started/quick-start.md) — Working example
- [Annotations](annotations.md) — JSDoc tags reference
- [CLI Reference](../reference/cli.md) — Command-line options
- [Themes](../themes.md) — Custom theme configuration
