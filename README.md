# 🏗️ Archlette

> **Code speaks. Archlette listens. Architecture evolves.**

[![npm version](https://img.shields.io/npm/v/@chrislyons-dev/archlette?color=blue&logo=npm)](https://www.npmjs.com/package/@chrislyons-dev/archlette)
[![CI](https://github.com/chrislyons-dev/archlette/actions/workflows/ci.yml/badge.svg)](https://github.com/chrislyons-dev/archlette/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Architecture shouldn't live in slides. It should live with your code.

Archlette analyzes your TypeScript/JavaScript codebase and generates C4 architecture diagrams automatically. Your code is the source of truth. Your diagrams stay synchronized.

[Documentation](https://chrislyons-dev.github.io/archlette/) | [Quick Start](https://chrislyons-dev.github.io/archlette/getting-started/quick-start/)

---

## Why Archlette?

**Code as truth. Diagrams as artifacts.**

- Code is the source — diagrams follow automatically
- Zero boilerplate — annotations only when needed
- Multiple outputs — Structurizr DSL, PlantUML, Mermaid, PNG
- CI-native — runs wherever your code runs

See Archlette documenting itself: [architecture docs](docs/architecture/README.md).

---

## Quick Start

### Install

```bash
npm install -D @chrislyons-dev/archlette
```

**Requirements:** Node.js ≥ 18, Java ≥ 11

**Free and open-source** — MIT licensed. No accounts, no telemetry, no lock-in.

See [Installation Guide](https://chrislyons-dev.github.io/archlette/getting-started/installation/) for platform-specific setup.

### Annotate

Works with **TypeScript, JavaScript, and Astro** components:

**TypeScript/JavaScript:**

```typescript
/**
 * @module UserService
 * User authentication and management
 *
 * @actor User {Person} {in} End user accessing the system
 * @uses Database Stores user credentials
 */
export class UserService {
  async login(email: string, password: string) {
    // Implementation
  }
}
```

**Astro Components:**

```astro
---
/**
 * @component Button
 * Reusable button component with multiple variants
 *
 * @uses Icon Displays button icon
 * @actor User {Person} {in} Clicks button to trigger action
 */

interface Props {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const { variant = 'primary', disabled = false } = Astro.props;
---

<button class={`btn btn-${variant}`} disabled={disabled}>
  <slot />
</button>
```

### Configure

Create `.aac.yaml`:

```yaml
project:
  name: MyProject

extractors:
  - use: extractors/builtin/basic-node
    inputs:
      include: ['src/**/*.ts', 'src/**/*.js']
  - use: extractors/builtin/basic-astro
    inputs:
      include: ['src/**/*.astro']
```

**Note:** Use `basic-node` for TypeScript/JavaScript files and `basic-astro` for Astro components. Both produce compatible IR for aggregation.

### Generate

```bash
npx archlette
```

**Output:**

- `docs/architecture/README.md` — System overview
- `docs/architecture/diagrams/*.png` — C4 diagrams
- `docs/architecture/workspace.dsl` — Structurizr DSL

---

## Documentation

**Getting Started:**

- [Quick Start](https://chrislyons-dev.github.io/archlette/getting-started/quick-start/) — Complete walkthrough
- [Installation](https://chrislyons-dev.github.io/archlette/getting-started/installation/) — Requirements and setup

**User Guide:**

- [Annotations](https://chrislyons-dev.github.io/archlette/guide/annotations/) — JSDoc tags reference
- [Configuration](https://chrislyons-dev.github.io/archlette/guide/configuration/) — YAML configuration
- [CI/CD Integration](https://chrislyons-dev.github.io/archlette/guide/ci-cd/) — GitHub Actions, GitLab CI
- [Troubleshooting](https://chrislyons-dev.github.io/archlette/guide/troubleshooting/) — Common issues

**Reference:**

- [CLI Commands](https://chrislyons-dev.github.io/archlette/reference/cli/) — Command-line interface
- [Component Detection](https://chrislyons-dev.github.io/archlette/extractors/component-detection/) — How extraction works

**Extending:**

- [Plugin Development](https://chrislyons-dev.github.io/archlette/plugins/extractors/) — Write custom extractors
- [Security Guide](docs/guide/security.md) — Input validation and security model

**Contributing:**

- [How to Contribute](CONTRIBUTING.md) — Development setup
- [Security Guide](docs/guide/security.md) — Security architecture and best practices
- [Changelog](CHANGELOG.md) — Release history

---

## Extractors

Archlette includes built-in extractors for multiple languages:

### basic-node

Extracts architecture from **TypeScript and JavaScript** codebases using AST analysis with ts-morph.

- Detects components from directory structure or explicit `@component` tags
- Extracts classes, functions, types, and interfaces
- Parses JSDoc annotations for actors and relationships
- Identifies dependencies from import statements

**When to use:** TypeScript/JavaScript projects, Node.js backends, frontend libraries

### basic-astro

Extracts architecture from **Astro components** using the Astro compiler.

- Identifies components from Astro file names or `@component` tags
- Extracts component props, slots, and client directives
- Parses frontmatter code for additional type information
- Detects component composition from template markup
- Works seamlessly with basic-node for full-stack analysis

**When to use:** Astro-based projects, island architecture, mixed TypeScript + Astro applications

### basic-python

Extracts architecture from **Python** codebases using AST parsing (no runtime required).

- Supports Python 3.8+ syntax
- Detects classes, functions, and dependencies

**When to use:** Python projects, data science applications, mixed-language monorepos

### custom-extractors

Write your own extractor to support additional languages or frameworks. See [Plugin Development](https://chrislyons-dev.github.io/archlette/plugins/extractors/).

---

## Features

**Pipeline:**
Extract. Validate. Generate. Render. Docs.

**What it extracts:**

- Components, actors, relationships (from JSDoc tags)
- Classes, functions, types (static analysis)
- Dependencies (import statements)

**What it generates:**

- C4 architecture diagrams (System Context, Container, Component, Code)
- Structurizr DSL workspace
- PlantUML and Mermaid diagrams
- Markdown documentation with embedded diagrams

**Extensible:**
Write extractors. Write validators. Write generators. See [plugin development](https://chrislyons-dev.github.io/archlette/plugins/extractors/).

---

## Example

See the [architecture docs](docs/architecture/README.md) generated by Archlette for this project.

---

## License

MIT © 2025 Chris Lyons

See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for runtime dependencies (Structurizr CLI, PlantUML).

---

## Links

- **Documentation**: https://chrislyons-dev.github.io/archlette/
- **npm Package**: https://www.npmjs.com/package/@chrislyons-dev/archlette
- **GitHub Repository**: https://github.com/chrislyons-dev/archlette
- **Issue Tracker**: https://github.com/chrislyons-dev/archlette/issues
