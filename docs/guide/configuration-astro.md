# Configuration Guide

Complete reference for configuring Archlette with the Astro extractor.

## Overview

Archlette configuration is YAML-based. The configuration file specifies:

1. **Project metadata** - name, description
2. **Output paths** - where to write results
3. **Extractors** - which source files to analyze
4. **Pipeline stages** - validators, generators, renderers, doc generators

## Basic Structure

```yaml
project:
  name: MyProject
  description: Optional description

paths:
  output: ./output
  ir_out: ./output/ir.json
  dsl_out: ./output/dsl
  render_out: ./output/diagrams
  docs_out: ./output/docs

extractors:
  - use: extractors/builtin/basic-astro
    inputs:
      include: ['src/**/*.astro']

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

## Sections

### Project

Metadata about your project. Appears in generated documentation.

```yaml
project:
  name: My Application
  description: Description of what the application does
```

**Fields:**

- `name` (required) - Project name
- `description` (optional) - Project description

### Paths

Where Archlette writes output files.

```yaml
paths:
  output: ./output # Base directory (default)
  ir_out: ./output/ir.json # Intermediate representation
  dsl_out: ./output/dsl # Structurizr DSL
  render_out: ./output/diagrams # PNG diagram images
  docs_out: ./output/docs # Markdown documentation
```

**Rules:**

- Paths are relative to the config file location
- Can use `~` for home directory
- Can use absolute paths
- All paths except `output` are optional (above are the defaults)

### Extractors

**Purpose:** Analyze source code and produce ArchletteIR

Multiple extractors can run in parallel. Results are automatically aggregated.

#### basic-astro

Extracts architecture from Astro components.

```yaml
extractors:
  - use: extractors/builtin/basic-astro
    inputs:
      include:
        - 'src/**/*.astro'
      exclude:
        - '**/*.test.astro'
        - '**/node_modules/**'
```

**Fields:**

- `use` - Plugin path (always `extractors/builtin/basic-astro` for Astro)
- `name` - Optional extractor name (for logging)
- `inputs.include` - Glob patterns to include
- `inputs.exclude` - Glob patterns to exclude

**Include/Exclude Patterns:**

Patterns follow globby conventions:

- `src/**/*.astro` - All Astro files under src
- `components/**/*.astro` - Components directory
- `pages/**/*.astro` - Pages directory
- `**/*.test.astro` - All test files
- `**/node_modules/**` - Dependencies (exclude)
- `**/dist/**` - Build output (exclude)

**Component Detection:**

- Files in `src/components/` → component: "components"
- Files in `src/pages/` → component: "pages"
- Files in root → uses container name

See `docs/guide/astro-annotations.md` for JSDoc tag documentation.

#### basic-node

Extracts architecture from TypeScript/JavaScript.

```yaml
extractors:
  - use: extractors/builtin/basic-node
    inputs:
      include:
        - 'src/**/*.ts'
        - 'src/**/*.js'
      exclude:
        - '**/*.test.ts'
        - '**/node_modules/**'
```

#### Combining Multiple Extractors

Extract from both Astro and TypeScript:

```yaml
extractors:
  - use: extractors/builtin/basic-node
    name: Backend Services
    inputs:
      include:
        - 'src/api/**/*.ts'
        - 'src/services/**/*.ts'
      exclude:
        - '**/*.test.ts'

  - use: extractors/builtin/basic-astro
    name: Frontend Components
    inputs:
      include:
        - 'src/components/**/*.astro'
      exclude:
        - '**/*.test.astro'
```

Results are automatically merged into a single architecture.

### Validators

**Purpose:** Ensure extracted data is valid

```yaml
validators:
  - use: validators/builtin/base-validator
```

Validates that:

- All required IR fields are present
- Field types are correct
- IDs are properly formatted (lowercase, no special chars)

### Generators

**Purpose:** Convert IR to architecture description language

```yaml
generators:
  - use: generators/builtin/structurizr
```

Current generator:

- `structurizr` - Converts IR to Structurizr DSL (C4 diagrams)

### Renderers

**Purpose:** Convert DSL to visual diagrams

Renderers execute sequentially (order matters).

```yaml
renderers:
  - use: renderers/builtin/structurizr-export
  - use: renderers/builtin/plantuml-render
```

**Common pipeline:**

1. `structurizr-export` - Export Structurizr DSL to PlantUML format
2. `plantuml-render` - Render PlantUML to PNG images

### Docs

**Purpose:** Generate documentation

```yaml
docs:
  - use: docs/builtin/markdown-docs
```

Generates:

- README.md with system overview
- Separate markdown files for each diagram
- Embedded PNG images
- Architecture descriptions

## Example Configurations

### Astro-Only Project

```yaml
project:
  name: My Astro App

extractors:
  - use: extractors/builtin/basic-astro
    inputs:
      include: ['src/**/*.astro']
      exclude: ['**/*.test.astro']

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

See `examples/astro-only.config.yaml` for the full example.

### Full-Stack Project (TypeScript + Astro)

```yaml
project:
  name: Full-Stack App

extractors:
  - use: extractors/builtin/basic-node
    inputs:
      include: ['src/**/*.ts']
      exclude: ['**/*.test.ts']

  - use: extractors/builtin/basic-astro
    inputs:
      include: ['src/**/*.astro']
      exclude: ['**/*.test.astro']

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

See `examples/astro-typescript-mixed.config.yaml` for the full example.

### Advanced Configuration

```yaml
project:
  name: Advanced Project

paths:
  output: ./build/architecture
  ir_out: ./build/architecture/ir.json
  dsl_out: ./build/architecture/dsl
  render_out: ./build/architecture/diagrams
  docs_out: ./build/architecture/docs

extractors:
  - use: extractors/builtin/basic-node
    name: Services
    inputs:
      include: ['src/api/**/*.ts']
      exclude: ['**/*.test.ts']

  - use: extractors/builtin/basic-astro
    name: Components
    inputs:
      include: ['src/components/**/*.astro']
      exclude: ['**/*.test.astro']

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

See `examples/astro-advanced.config.yaml` for the full example.

## Running Archlette

### Extract Only

```bash
npx archlette extract --config archlette.config.yaml
```

Outputs: `ir.json`

### Full Pipeline

```bash
npx archlette --config archlette.config.yaml
```

Outputs:

- `ir.json` - Intermediate representation
- `dsl/workspace.dsl` - Structurizr DSL
- `diagrams/*.png` - C4 diagram images
- `docs/README.md` - Documentation

## Best Practices

### 1. Use Exclude Patterns

Always exclude:

- `**/node_modules/**` - Dependencies
- `**/dist/**` - Build output
- `**/*.test.*` - Test files
- `**/.astro/**` - Build cache

```yaml
extractors:
  - use: extractors/builtin/basic-astro
    inputs:
      include: ['src/**/*.astro']
      exclude:
        - '**/node_modules/**'
        - '**/dist/**'
        - '**/*.test.astro'
        - '**/.astro/**'
```

### 2. Organize Extractors by Concern

Use extractor names to clarify purpose:

```yaml
extractors:
  - use: extractors/builtin/basic-node
    name: API Services
    inputs: { include: ['api/**/*.ts'] }

  - use: extractors/builtin/basic-node
    name: UI Utilities
    inputs: { include: ['lib/**/*.ts'] }

  - use: extractors/builtin/basic-astro
    name: Components
    inputs: { include: ['components/**/*.astro'] }
```

### 3. Use Custom Paths for Organization

```yaml
paths:
  output: ./build/architecture
  ir_out: ./build/architecture/ir.json
  dsl_out: ./build/architecture/dsl
  render_out: ./build/architecture/diagrams
  docs_out: ./build/architecture/docs
```

### 4. Version Your Config

Include in git and update as project evolves:

```bash
git add archlette.config.yaml
git commit -m "docs: update architecture configuration"
```

### 5. Document Your Extractors

Use JSDoc tags in your code:

```astro
---
/**
 * @component Button
 * Reusable button component
 *
 * @actor User {Person} {in} Clicks button
 * @uses Icon Displays icon
 */
---
```

See `docs/guide/astro-annotations.md` for complete JSDoc reference.

## Configuration Examples in Repository

The `examples/` directory contains complete working configurations:

- `singlerepo.config.yaml` - Single repository setup
- `monorepo.config.yaml` - Monorepo with multiple services
- `astro-only.config.yaml` - Astro components only
- `astro-typescript-mixed.config.yaml` - TypeScript + Astro combined
- `astro-advanced.config.yaml` - Advanced configuration with custom paths

Each example includes comments explaining the configuration choices.

## Troubleshooting

### No files found

Check glob patterns:

```bash
# Test your patterns with globby
npx globby "src/**/*.astro" --exclude "**/*.test.astro"
```

### Component names are wrong

Verify JSDoc tags in files:

```astro
---
/**
 * @component CorrectName
 */
---
```

Or check directory structure:

- Components should be in subdirectories (src/components/Header.astro)
- Root files use container name

### Missing relationships

Add `@uses` tags to document dependencies:

```astro
---
/**
 * @component Button
 * @uses Icon Displays icon
 * @actor User {Person} {in} Clicks button
 */
---
```

## See Also

- [Astro Annotations Reference](astro-annotations.md) - JSDoc tag documentation
- [Examples Directory](../../examples/) - Working configuration examples
