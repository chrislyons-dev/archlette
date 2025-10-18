# Contributing to Archlette

> **Code speaks. Archlette listens. Architecture evolves.**

Welcome. This guide covers development setup, architecture, and contribution workflow for builders who want to extend Archlette.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Development Setup](#development-setup)
- [Architecture](#architecture)
- [Plugin Development](#plugin-development)
- [Testing](#testing)
- [Code Standards](#code-standards)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [CI/CD](#cicd)
- [Release Process](#release-process)

---

## Project Overview

| Area               | Details                     |
| ------------------ | --------------------------- |
| **Package**        | `@chrislyons-dev/archlette` |
| **License**        | MIT                         |
| **Language**       | TypeScript (ESM modules)    |
| **Node Version**   | ≥ 18.0.0                    |
| **Config Format**  | YAML (`.aac.yaml`)          |
| **Build Tool**     | TypeScript Compiler (`tsc`) |
| **Test Framework** | Vitest                      |
| **Linting**        | ESLint v9 + Prettier        |
| **Git Hooks**      | Husky + lint-staged         |
| **CI/CD**          | GitHub Actions              |
| **Docs**           | Published to GitHub Pages   |

### Core Dependencies

- **ts-morph** — TypeScript static analysis
- **nunjucks** — Template engine for docs generation
- **globby** — File pattern matching
- **execa** — Process execution
- **yaml** — YAML parsing
- **zod** — Schema validation

---

## Development Setup

### Prerequisites

- Node.js ≥ 18.0.0
- npm or pnpm
- Git

### Clone and Install

```bash
git clone https://github.com/chrislyons-dev/archlette.git
cd archlette
npm install
```

### Build

```bash
npm run build
```

This compiles TypeScript to `dist/` and copies templates.

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Run Locally

```bash
# Run CLI in development mode
npx tsx src/cli.ts all

# Or use the npm scripts
npm run aac:all           # Run full pipeline
npm run aac:extract       # Extract IR from code
npm run aac:val           # Extract + validate
npm run aac:gen           # Extract + validate + generate
npm run aac:render        # Extract + validate + generate + render
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

### Pre-commit Hooks

Husky automatically runs lint-staged on commit, which:

- Formats code with Prettier
- Lints with ESLint
- Validates commit messages (Conventional Commits)

---

## Architecture

Plugin-based pipeline. Five stages. Each stage transforms data from the last.

### Pipeline Flow

```
┌─────────────┐
│ Source Code │
│  IaC Files  │
│ OpenAPI etc │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│  Stage 1: Extract    │  Plugins: builtin/basic-node, custom extractors
│  Output: IR (JSON)   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Stage 2: Validate   │  Plugins: builtin/base-validator
│  Output: Valid IR    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Stage 3: Generate   │  Plugins: builtin/structurizr
│  Output: DSL         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Stage 4: Render     │  Plugins: builtin/structurizr-export, builtin/plantuml-render
│  Output: Images      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Stage 5: Docs       │  Plugins: builtin/markdown-docs
│  Output: Pages       │
└──────────────────────┘
```

### Directory Structure

```
archlette/
├── src/
│   ├── cli.ts                          # CLI entry point
│   ├── 1-extract/
│   │   ├── index.ts                    # Extract stage orchestrator
│   │   └── aggregator.ts               # IR aggregation
│   ├── 2-validate/
│   │   └── index.ts                    # Validate stage orchestrator
│   ├── 3-generate/
│   │   └── index.ts                    # Generate stage orchestrator
│   ├── 4-render/
│   │   └── index.ts                    # Render stage orchestrator
│   ├── 5-docs/
│   │   └── index.ts                    # Docs stage orchestrator
│   ├── core/
│   │   ├── types.ts                    # Core type definitions
│   │   ├── types-ir.ts                 # IR schema (Zod)
│   │   ├── types-aac.ts                # Config schema (Zod)
│   │   ├── module-loader.ts            # ESM module loader
│   │   ├── stage-module-loader.ts      # Stage plugin loader
│   │   ├── logger.ts                   # Logging utilities
│   │   ├── tool-manager.ts             # External tool management
│   │   └── path-resolver.ts            # Path resolution
│   ├── extractors/
│   │   └── builtin/
│   │       └── basic-node/             # TypeScript/JavaScript extractor
│   │           ├── file-finder.ts      # File discovery
│   │           ├── file-parser.ts      # ts-morph parsing
│   │           ├── class-extractor.ts  # Class extraction
│   │           ├── function-extractor.ts # Function extraction
│   │           ├── type-extractor.ts   # Type extraction
│   │           ├── import-extractor.ts # Import extraction
│   │           ├── doc-extractor.ts    # JSDoc extraction
│   │           ├── component-detector.ts # Component detection
│   │           └── to-ir-mapper.ts     # Map to IR format
│   ├── validators/
│   │   └── builtin/
│   │       └── base-validator.ts       # JSON Schema validation
│   ├── generators/
│   │   └── builtin/
│   │       └── structurizr.ts          # Structurizr DSL generator
│   ├── renderers/
│   │   └── builtin/
│   │       ├── structurizr-export.ts   # Export DSL to PUML/Mermaid
│   │       └── plantuml-render.ts      # Render PUML to images
│   ├── docs/
│   │   └── builtin/
│   │       └── markdown-docs.ts        # Markdown docs generator
│   └── templates/
│       ├── default.yaml                # Default config
│       ├── full-example.yaml           # Full config example
│       └── monorepo-example.yaml       # Monorepo config example
├── test/                                # Test suite (mirrors src/)
├── docs/architecture/                   # Generated architecture docs
├── dist/                                # Compiled output
└── package.json
```

### Core Concepts

#### Intermediate Representation (IR)

Language-agnostic JSON. C4 model elements. One canonical format:

```typescript
type ArchletteIR = {
  version: string;
  system: System; // The software system
  actors: Actor[]; // External users/systems
  containers: Container[]; // Deployable units
  components: Component[]; // Logical groupings
  code: CodeItem[]; // Classes, functions, methods
  deployments: Deployment[]; // Infrastructure topology
  containerRelationships: Relationship[];
  componentRelationships: Relationship[];
  codeRelationships: Relationship[];
};
```

**Design principles**:

- Language-agnostic — works with any programming language
- Schema-validated — Zod at runtime, JSON Schema for tooling
- C4-native — system → container → component → code

#### Plugin System

ESM modules. Default export. Stage-specific interfaces.

**Common context** (passed to all plugins):

```typescript
type PipelineContext = {
  config: ResolvedAACConfig | null; // Parsed .aac.yaml config
  state: Record<string, unknown>; // Shared state across stages
  log: Logger; // Contextual logger
};
```

---

## Plugin Development

### Extractor Plugins

**Purpose**: Analyze source materials and produce `ArchletteIR`

**Interface**:

```typescript
export default async function myExtractor(
  node: ResolvedStageNode,
): Promise<ArchletteIR> {
  const inputs = node.inputs as { include?: string[]; exclude?: string[] };

  // 1. Find files
  const files = await findFiles(inputs.include, inputs.exclude);

  // 2. Extract architecture
  const entities = await analyzeFiles(files);

  // 3. Return IR
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

**Example use cases**:

- Parse Terraform/CDK for infrastructure components
- Extract API definitions from OpenAPI specs
- Analyze Docker Compose files for container topology
- Parse database schemas for data models

### Validator Plugins

**Purpose**: Validate and enrich IR

**Interface**:

```typescript
export default async function myValidator(
  ir: ArchletteIR,
  node: ResolvedStageNode,
): Promise<{ ok: boolean; errors?: Error[]; warnings?: string[] }> {
  const errors: Error[] = [];

  // Validate IR
  if (!ir.system.name) {
    errors.push(new Error('System must have a name'));
  }

  return { ok: errors.length === 0, errors };
}
```

**Example use cases**:

- Enforce naming conventions
- Validate relationship integrity
- Check for orphaned components
- Detect circular dependencies

### Generator Plugins

**Purpose**: Transform IR into DSL formats

**Interface**:

```typescript
export default function myGenerator(ir: ArchletteIR, node: ResolvedStageNode): string {
  // Generate DSL
  const lines: string[] = [];
  lines.push(`system ${ir.system.name} {`);
  // ... generate content
  lines.push('}');

  return lines.join('\n');
}
```

**Example use cases**:

- Generate PlantUML directly from IR
- Generate Mermaid diagrams
- Generate GraphViz DOT files
- Generate custom DSL formats

### Renderer Plugins

**Purpose**: Convert DSL to visual formats

**Interface**:

```typescript
export default async function myRenderer(
  ctx: PipelineContext,
  node: ResolvedStageNode,
): Promise<{ outputs: string[] }> {
  const dslPath = ctx.config?.paths.dsl_out;
  const outputDir = ctx.config?.paths.render_out;

  // Read DSL
  const dsl = await fs.readFile(dslPath, 'utf-8');

  // Render images
  await renderToSvg(dsl, outputDir);

  return { outputs: [`${outputDir}/diagram.svg`] };
}
```

**Example use cases**:

- Render Mermaid to SVG using mermaid-cli
- Render GraphViz to PNG
- Generate interactive HTML diagrams
- Export to PDF

### Docs Plugins

**Purpose**: Generate documentation from DSL and images

**Interface**:

```typescript
export default async function myDocsGenerator(
  ctx: PipelineContext,
  node: ResolvedStageNode,
): Promise<{ files: string[] }> {
  const docsDir = ctx.config?.paths.docs_out;

  // Generate docs
  await generateIndex(docsDir);
  await generateComponentPages(docsDir);

  return { files: ['index.md', 'components/cli.md'] };
}
```

**Example use cases**:

- Generate HTML docs with search
- Generate Markdown docs with navigation
- Generate PDF documentation
- Generate API reference pages

### Registering Plugins

Add plugins to `.aac.yaml`:

```yaml
extractors:
  # Built-in plugin (resolved from src/)
  - use: builtin/basic-node
    inputs:
      include: ['src/**/*.ts']

  # Local custom plugin (relative to project root)
  - use: ./custom/extractors/terraform-extractor
    inputs:
      include: ['**/*.tf']

  # npm package plugin
  - use: @myorg/archlette-graphql-extractor
    inputs:
      schema: schema.graphql
```

Plugin resolution order:

1. Check if path starts with `builtin/` → resolve from `src/` directory
2. Check if path starts with `.` or `/` → resolve relative to project root
3. Otherwise → resolve as npm package

---

## Testing

### Test Structure

Tests mirror the `src/` directory structure:

```
test/
├── cli.test.ts
├── core/
│   ├── types-ir.test.ts
│   ├── types-aac.test.ts
│   └── module-loader.test.ts
├── extractors/
│   └── builtin/
│       ├── basic-node.test.ts
│       └── component-detection.test.ts
└── generators/
    └── builtin/
        └── structurizr.test.ts
```

### Writing Tests

Use Vitest with `describe` and `test` blocks:

```typescript
import { describe, test, expect } from 'vitest';
import { myFunction } from '../src/module.js';

describe('myFunction', () => {
  test('should handle valid input', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  test('should throw on invalid input', () => {
    expect(() => myFunction('')).toThrow('Invalid input');
  });
});
```

### Test Coverage

Aim for:

- **Unit tests**: 80%+ coverage for core logic
- **Integration tests**: Test full pipeline stages
- **Edge cases**: Invalid inputs, empty data, errors

Run coverage report:

```bash
npm run test:coverage
```

### Fixtures

Use test fixtures in `test/fixtures/`:

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

const fixtureDir = join(__dirname, '../fixtures');
const sampleIR = JSON.parse(readFileSync(join(fixtureDir, 'sample-ir.json'), 'utf-8'));
```

---

## Code Standards

Archlette follows strict coding standards to ensure quality, security, and maintainability.

### Core Principles

- **SOLID** — Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
- **DRY** — Don't repeat yourself
- **KISS** — Keep it simple
- **YAGNI** — You aren't gonna need it

### Security

Validate inputs. Sanitize outputs. Handle errors safely. Never trust unverified data.

### Design

Keep functions small (<50 lines). Limit complexity (<10 cyclomatic). Separate concerns. Compose, don't inherit. Inject dependencies.

### Error Handling

Fail fast. Fail loud. Add context. Log everything.

```typescript
// Good
if (!config.paths.ir_out) {
  throw new Error('Config validation failed: paths.ir_out is required');
}

// Bad
if (!config.paths.ir_out) {
  console.log('Missing path');
  return;
}
```

### Performance

Think Big-O. Minimize I/O. Stream large files. Cache when safe.

### Type Safety

Strict TypeScript. No `any`. Use `unknown` for dynamic types. Validate with Zod.

```typescript
// Good
function processIR(ir: ArchletteIR): string {
  return generateDSL(ir);
}

// Bad
function processIR(ir: any) {
  return generateDSL(ir);
}
```

### Naming Conventions

- **Files**: kebab-case (`module-loader.ts`)
- **Directories**: kebab-case (`builtin/`, `basic-node/`)
- **Functions**: camelCase (`loadModule`, `generateDSL`)
- **Types/Interfaces**: PascalCase (`ArchletteIR`, `PipelineContext`)
- **Constants**: UPPER_SNAKE_CASE (`STAGE_ORDER`, `DEFAULT_YAML_PATH`)

### Imports

- Use explicit file extensions (`.js` for compiled `.ts` files)
- Group imports: Node built-ins → External → Internal
- Use type-only imports when possible

```typescript
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import type { ArchletteIR } from './types-ir.js';
import { loadModule } from './module-loader.js';
```

---

## Documentation

Document intent. Explain why, not what. JSDoc for exports.

### File-Level Documentation

Every file must have a module-level JSDoc comment:

````typescript
/**
 * Brief description of module purpose
 *
 * @module path/to/module
 * @description
 * Detailed explanation of the module's role in the system. Explain the "why"
 * behind the implementation, not just the "what".
 *
 * @example
 * ```typescript
 * import { myFunction } from './module.js';
 * const result = await myFunction('input');
 * ```
 */
````

### Function Documentation

All **exported** functions and public methods require JSDoc:

````typescript
/**
 * Generate Structurizr DSL from ArchletteIR
 *
 * @param ir - The validated ArchletteIR to transform
 * @param node - Configuration node from .aac.yaml
 * @returns Structurizr DSL as a string
 *
 * @throws {Error} If IR is missing required fields
 *
 * @example
 * ```typescript
 * const dsl = structurizrGenerator(ir, configNode);
 * await writeFile('workspace.dsl', dsl);
 * ```
 */
export default function structurizrGenerator(
  ir: ArchletteIR,
  node: ResolvedStageNode,
): string {
  // Implementation
}
````

**Required elements**:

- Brief description (first line)
- `@param` for each parameter with description
- `@returns` for return value with description
- `@throws` for any errors with conditions
- `@example` showing typical usage

### Inline Comments

Use inline comments to explain **WHY**, not WHAT:

```typescript
// Good — explains reasoning
// Use two-pass detection to handle forward references in JSDoc
const components = detectComponents(files);

// Bad — states the obvious
// Loop through files
for (const file of files) {
}
```

### Special Tags

```typescript
/**
 * @deprecated Use newFunction() instead. Will be removed in v2.0.0
 * @internal For internal use only — not part of public API
 * @experimental API may change without notice in minor versions
 */
```

### Documentation Checklist

Before submitting a PR:

- [ ] All new files have module-level JSDoc
- [ ] All exported functions documented
- [ ] Complex logic has explanatory comments
- [ ] Examples provided for public APIs
- [ ] Special conditions documented (`@throws`, `@deprecated`)

---

## Pull Request Process

### Before Submitting

1. **Run the full test suite**:

   ```bash
   npm test
   ```

2. **Run linting and type checks**:

   ```bash
   npm run lint
   npm run typecheck
   ```

3. **Build successfully**:

   ```bash
   npm run build
   ```

4. **Update documentation** if adding features or changing APIs

5. **Add tests** for new functionality

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:

- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation changes
- `refactor` — Code refactoring (no functional changes)
- `test` — Adding or updating tests
- `chore` — Build process, dependencies, tooling
- `perf` — Performance improvements

**Examples**:

```
feat(extractors): add terraform extractor plugin

Extracts containers and deployments from Terraform files.
Supports AWS, Azure, and GCP providers.
```

```
fix(generators): escape special characters in DSL strings

Fixes issue where quotes in descriptions broke Structurizr DSL parsing.

Closes #42
```

### PR Template

When creating a PR, include:

```markdown
## Summary

Brief description of changes

## Changes

- Added X feature
- Fixed Y bug
- Refactored Z module

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Documentation

- [ ] README updated
- [ ] JSDoc comments added
- [ ] Examples added

## Breaking Changes

None | List breaking changes
```

### Code Review Process

1. **Automated checks** must pass (CI, linting, tests)
2. **One approving review** required from maintainer
3. **Address feedback** — respond to all comments
4. **Squash and merge** — keep history clean

---

## CI/CD

### Continuous Integration

GitHub Actions runs on every push and PR:

```yaml
# .github/workflows/ci.yml
- Checkout code
- Setup Node.js 18
- Install dependencies
- Run linting (ESLint + Prettier)
- Run type checking (tsc)
- Run tests with coverage
- Run build
- Upload coverage to Codecov
```

**All checks must pass** before merging.

### Continuous Deployment

On tags matching `v*.*.*`:

```yaml
# .github/workflows/cd.yml
- Run CI checks
- Build package
- Publish to npm with provenance
- Deploy docs to GitHub Pages
```

### Pre-commit Hooks

Husky + lint-staged runs on commit:

```json
{
  "lint-staged": {
    "*.{js,ts,json,md,yml,yaml}": ["prettier --write", "eslint --fix"]
  }
}
```

---

## Release Process

### Versioning

Archlette follows [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0 → 2.0.0) — Breaking changes
- **Minor** (1.0.0 → 1.1.0) — New features (backward compatible)
- **Patch** (1.0.0 → 1.0.1) — Bug fixes (backward compatible)

### Creating a Release

1. **Update version** in `package.json`:

   ```bash
   npm version major|minor|patch
   ```

2. **Update CHANGELOG.md** with release notes

3. **Commit changes**:

   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: release v1.2.0"
   ```

4. **Create and push tag**:

   ```bash
   git tag v1.2.0
   git push origin main --tags
   ```

5. **GitHub Actions** automatically publishes to npm and deploys docs

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Tag pushed to GitHub
- [ ] npm package published successfully
- [ ] GitHub release created with notes

---

## Getting Help

- **Documentation**: https://chrislyons-dev.github.io/archlette/
- **Issues**: https://github.com/chrislyons-dev/archlette/issues
- **Discussions**: https://github.com/chrislyons-dev/archlette/discussions

---

## Code of Conduct

Be respectful. Be inclusive. Be professional.

---

## License

Contributions are licensed under MIT.

---

Thanks for building with us.
