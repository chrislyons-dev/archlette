# Archlette

> **Code speaks. Archlette listens. Architecture evolves.**

[![npm version](https://img.shields.io/npm/v/@chrislyons-dev/archlette?color=blue&logo=npm)](https://www.npmjs.com/package/@chrislyons-dev/archlette)
[![CI](https://github.com/chrislyons-dev/archlette/actions/workflows/ci.yml/badge.svg)](https://github.com/chrislyons-dev/archlette/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Architecture shouldn't live in slides. It should live with your code.

Archlette analyzes your TypeScript/JavaScript codebase and generates C4 architecture diagrams automatically. Your code is the source of truth. Your diagrams stay synchronized.

---

## Why Archlette?

**Code as truth. Diagrams as artifacts.**

- Code is the source — diagrams follow automatically
- Zero boilerplate — annotations only when you need them
- Multiple outputs — Structurizr DSL, PlantUML, Mermaid, SVG, PNG
- Plugin-based — extend every stage of the pipeline
- CI-native — runs wherever your code runs

See it in action: Archlette documents itself. Check the [architecture docs](docs/architecture/readme.md) it generates.

---

## Requirements

- **Node.js** ≥ 18.0.0
- **Java** ≥ 11 (required for diagram rendering)

Archlette automatically downloads Structurizr CLI and PlantUML on first run. You only need to install Java.

**Installation**:

```bash
# macOS
brew install openjdk@11

# Ubuntu/Debian
sudo apt install openjdk-11-jdk

# Windows
# Download from https://adoptium.net/
```

---

## Quick Start

### Installation

```bash
npm install -D @chrislyons-dev/archlette
```

### Initialize Configuration

Create a configuration file `.aac.yaml` in your project root:

```yaml
project:
  name: MyProject

paths:
  ir_out: docs/architecture/ir.json
  dsl_out: docs/architecture/workspace.dsl
  render_out: docs/architecture/diagrams
  docs_out: docs/architecture

extractors:
  - use: extractors/builtin/basic-node
    inputs:
      include: ['src/**/*.ts', 'src/**/*.js']
      exclude: ['**/*.test.ts', '**/*.spec.ts']

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

### Run

```bash
npx archlette -f .aac.yaml
```

### View Output

Run once. Get everything:

- `docs/architecture/index.md` — Documentation index
- `docs/architecture/diagrams/*.png` — C4 diagrams
- `docs/architecture/workspace.dsl` — Structurizr DSL
- `docs/architecture/ir.json` — Intermediate representation

---

## CLI Reference

```bash
archlette [-f <config.yaml>] [stage]
```

### Syntax

**Stage is optional** — defaults to `all` (full pipeline).

**Most common usage**:

```bash
npx archlette -f .aac.yaml     # Run full pipeline with your config
npx archlette                  # Run full pipeline with default config
```

### Stages

Each stage runs all previous stages automatically. Use specific stages for development and debugging.

**Full pipeline**:

```bash
npx archlette -f .aac.yaml     # all (default): Extract → Validate → Generate → Render → Docs
npx archlette -f .aac.yaml docs # docs: Alias for 'all'
```

**When developing extractors**:

```bash
npx archlette -f .aac.yaml extract  # Test IR extraction only
npx archlette -f .aac.yaml validate # Extract + validate (catch schema errors)
```

**When developing generators**:

```bash
npx archlette -f .aac.yaml generate # Extract + validate + generate DSL
```

**When debugging renderers**:

```bash
npx archlette -f .aac.yaml render   # Extract + validate + generate + render images
```

### Config Files

**Default config**: If no `-f` is specified, uses `templates/default.yaml` from the archlette installation.

**Custom config**: Use `-f` to point to your project config:

```bash
npx archlette -f .aac.yaml              # Project root config
npx archlette -f configs/production.yaml # Environment-specific config
```

---

## What Gets Extracted Automatically

Static analysis. No configuration required.

**Code Structure**:

- Classes (exports, inheritance, methods, properties)
- Functions (regular and arrow functions)
- Type aliases and interfaces
- Imports (file-to-file dependencies)

**Documentation**:

- JSDoc comments (summary, parameters, return types)
- Descriptions and examples
- Deprecation notices

**Metadata**:

- File paths and line numbers
- Visibility modifiers (public, private, protected)
- Type information (async, static, abstract, readonly)

---

## Architecture Annotations

Optional. Use them to define what code can't express — actors, external systems, architectural relationships.

### Component Declaration

Mark files as logical components:

```typescript
/**
 * @component UserService
 * User management and authentication service
 */

export class UserService {
  // ... implementation
}
```

Supported tags:

- `@component ComponentName` — Explicit component declaration
- `@module path/to/module` — Standard JSDoc module tag
- `@namespace NamespaceName` — Standard JSDoc namespace tag

All code in a file with a component tag belongs to that component.

### Actor Relationships

Define external actors and their interactions:

```typescript
/**
 * @component ApiGateway
 * API Gateway handling HTTP requests
 *
 * @actor User {Person} {in} End user making API requests
 * @actor Database {System} {out} PostgreSQL database for persistence
 * @actor Cache {System} {both} Redis cache for sessions
 */
```

**Syntax**: `@actor Name {Type} {Direction} Description`

**Types**:

- `{Person}` — Human user
- `{System}` — External system

**Directions**:

- `{in}` — Actor → Component (actor calls the component)
- `{out}` — Component → Actor (component calls the actor)
- `{both}` — Bidirectional (default if omitted)

### Component Dependencies

Define explicit component relationships:

```typescript
/**
 * @component OrderService
 * Handles order processing and fulfillment
 *
 * @uses PaymentService Processes payments for orders
 * @uses InventoryService Checks product availability
 */
```

---

## Configuration Reference

### Project Metadata

```yaml
project:
  name: MyProject # Project name (required)
  props: # Custom properties
    version: 1.0.0
    team: Platform
```

### Output Paths

```yaml
paths:
  ir_out: docs/architecture/ir.json # Intermediate representation
  dsl_out: docs/architecture/workspace.dsl # Structurizr DSL output
  render_out: docs/architecture/diagrams # Diagram output directory
  docs_out: docs/architecture # Documentation root
```

### Default Glob Patterns

```yaml
defaults:
  includes: ['**/*'] # Default file patterns to include
  excludes: # Default file patterns to exclude
    - 'node_modules/**'
    - '.git/**'
    - 'dist/**'
    - 'build/**'
```

### Stage Configuration

Each stage accepts an array of plugins to execute in order:

```yaml
extractors:
  - use: extractors/builtin/basic-node # Built-in plugin
    inputs:
      include: ['src/**/*.ts'] # Override default includes
      exclude: ['**/*.test.ts'] # Override default excludes

validators:
  - use: validators/builtin/base-validator # Built-in validator

generators:
  - use: generators/builtin/structurizr # Built-in generator

renderers:
  - use: renderers/builtin/structurizr-export # Order matters — export before render
  - use: renderers/builtin/plantuml-render # Renders exported PlantUML

docs:
  - use: docs/builtin/markdown-docs # Built-in docs generator
```

---

## Pipeline Architecture

Five stages. One direction. Extract. Validate. Generate. Render. Document.

```
Code Files → [Extract] → IR → [Validate] → IR → [Generate] → DSL → [Render] → Images → [Docs] → Pages
```

### Stage 1: Extract

**Input**: Source code, IaC files, OpenAPI specs
**Output**: Intermediate Representation (IR) in JSON
**Built-in**: `extractors/builtin/basic-node` — TypeScript/JavaScript analysis

The IR is language-agnostic. Systems, containers, components, code, relationships — all in one structure.

### Stage 2: Validate

**Input**: IR (JSON)
**Output**: Validated IR or error report
**Built-in**: `validators/builtin/base-validator` — Schema validation + custom rules

Catch errors early. Fail fast.

### Stage 3: Generate

**Input**: Validated IR
**Output**: DSL files (Structurizr, PlantUML, Mermaid)
**Built-in**: `generators/builtin/structurizr` — Structurizr DSL workspace

Transform data into diagrams. Stable layouts. C4 semantics.

### Stage 4: Render

**Input**: DSL files
**Output**: Diagram images (SVG, PNG)
**Built-in**:

- `renderers/builtin/structurizr-export` — Export to PlantUML/Mermaid
- `renderers/builtin/plantuml-render` — Render PNG images

Archlette automatically downloads and manages Structurizr CLI and PlantUML.

### Stage 5: Docs

**Input**: DSL files and images
**Output**: Documentation pages (Markdown, HTML)
**Built-in**: `docs/builtin/markdown-docs` — Index with embedded diagrams

Document once. Share everywhere.

---

## Plugin Development

Extend every stage. Write extractors, validators, generators, renderers, docs builders.

### Plugin Interface

All plugins are ESM modules exporting a default function:

```typescript
export default async function myExtractor(
  node: ResolvedStageNode,
): Promise<ArchletteIR> {
  // Extract architecture from custom source
  return {
    version: '1.0',
    system: { name: 'MySystem' },
    actors: [],
    containers: [],
    components: [],
    code: [],
    deployments: [],
    containerRelationships: [],
    componentRelationships: [],
    codeRelationships: [],
  };
}
```

### Using Custom Plugins

Reference plugins by path in your config:

```yaml
extractors:
  - use: ./custom/extractors/terraform-extractor
    inputs:
      include: ['**/*.tf']
```

### Plugin Types

**Extractors**: Produce `ArchletteIR` from various sources
**Validators**: Return `{ ok: boolean, errors?: Error[], warnings?: string[] }`
**Generators**: Return DSL as `string`
**Renderers**: Return `{ outputs: string[] }` (file paths)
**Docs**: Return `{ files: string[] }` (generated pages)

Build your own. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Architecture Documentation

on:
  push:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - run: npm ci

      - name: Generate architecture docs
        run: npx archlette -f .aac.yaml

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/architecture
```

### Pre-commit Hook

Keep docs synchronized with code:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npx archlette -f .aac.yaml && git add docs/architecture/"
    }
  }
}
```

---

## Troubleshooting

### Java not found

**Error**: "Java not found" when running renderers

**Solution**: Install Java 11 or higher:

```bash
# macOS
brew install openjdk@11

# Ubuntu/Debian
sudo apt install openjdk-11-jdk

# Verify installation
java -version
```

### TypeScript parsing errors

**Solution**: Archlette uses `ts-morph` which supports standard TypeScript. Check that:

- Your `tsconfig.json` is valid
- Files use standard TypeScript syntax
- No compilation errors exist

### Missing components

**Solution**: Ensure files have component annotations:

```typescript
/**
 * @component MyComponent
 * Component description
 */
```

Files without annotations are extracted as code elements but not grouped into components.

---

## Examples

See the [examples directory](https://github.com/chrislyons-dev/archlette/tree/main/examples) for sample projects using Archlette.

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, architecture guide, and PR process.

---

## License

MIT © 2025 Chris Lyons

---

## Links

- **Documentation**: https://chrislyons-dev.github.io/archlette/
- **npm Package**: https://www.npmjs.com/package/@chrislyons-dev/archlette
- **GitHub Repository**: https://github.com/chrislyons-dev/archlette
- **Issue Tracker**: https://github.com/chrislyons-dev/archlette/issues
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
