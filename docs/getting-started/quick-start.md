# Quick Start

Install. Annotate. Generate. Done.

---

## Install

```bash
npm install -D @chrislyons-dev/archlette
```

**Requirements:**

- Node.js ≥ 18
- Java ≥ 11 (for diagram rendering)

See [Installation](installation.md) for platform-specific setup.

---

## Annotate

Mark architectural components in your code:

```typescript
/**
 * @module UserService
 * User authentication and management
 *
 * @actor User {Person} {in} End user accessing the system
 * @uses Database Stores user credentials and profiles
 */
export class UserService {
  async login(email: string, password: string) {
    // Implementation
  }
}
```

Archlette extracts these annotations automatically. No configuration needed.

---

## Configure

Create `.aac.yaml` in your project root:

```yaml
project:
  name: MyProject

paths:
  docs_out: docs/architecture

extractors:
  - use: extractors/builtin/basic-node
    inputs:
      include: ['src/**/*.ts']
      exclude: ['**/*.test.ts']
```

That's it. Sensible defaults everywhere.

---

## Generate

```bash
npx archlette
```

**Output:**

- `docs/architecture/README.md` — System overview with diagrams
- `docs/architecture/diagrams/*.png` — C4 architecture diagrams
- `docs/architecture/workspace.dsl` — Structurizr DSL source
- `docs/architecture/ir.json` — Intermediate representation

First run downloads Structurizr CLI and PlantUML automatically. Cached for subsequent runs.

---

## View

Open `docs/architecture/README.md` in your browser or editor.

**System Context** shows actors and external systems.
**Container Diagram** shows deployable units.
**Component Diagram** shows logical architecture.

All synchronized with your code. Always current.

---

## Next Steps

**Enhance your architecture:**

- [Annotations Reference](../guide/annotations.md) — All supported JSDoc tags
- [Configuration](../guide/configuration.md) — Paths, plugins, customization

**Automate:**

- [CI/CD Integration](../guide/ci-cd.md) — Run in GitHub Actions, GitLab CI

**Extend:**

- [Plugin Development](../plugins/extractors.md) — Write custom extractors

---

## Common Patterns

**Monorepo:**
Configure multiple extractors, one per package:

```yaml
extractors:
  - use: extractors/builtin/basic-node
    name: api-service
    inputs:
      include: ['packages/api/**/*.ts']

  - use: extractors/builtin/basic-node
    name: web-app
    inputs:
      include: ['packages/web/**/*.tsx']
```

**Selective extraction:**
Only extract specific directories:

```yaml
extractors:
  - use: extractors/builtin/basic-node
    inputs:
      include:
        - 'src/domain/**/*.ts'
        - 'src/services/**/*.ts'
      exclude:
        - '**/*.test.ts'
        - '**/mocks/**'
```

**Run specific stages:**

```bash
npx archlette extract   # Just extraction
npx archlette generate  # Extract + validate + generate DSL
npx archlette render    # Full pipeline through rendering
```

See [CLI Reference](../reference/cli.md) for all commands.
