# Quick Start

Architecture shouldn't live in slides. Extract it from code.

---

## Three Steps

### 1. Install

```bash
npm install -D @chrislyons-dev/archlette
```

**Java required for rendering.** Archlette handles the rest.

> [Installation guide](installation.md) for platform-specific setup.

---

### 2. Annotate

Mark components in your code. Archlette extracts the rest.

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

Code speaks. Archlette listens.

---

### 3. Generate

```bash
npx archlette
```

**Pipeline runs:**

```
Extract → Validate → Generate → Render → Publish
```

**Creates:**

- `docs/architecture/README.md` — Overview with diagrams
- `docs/architecture/diagrams/*.png` — C4 architecture diagrams
- `docs/architecture/workspace.dsl` — Structurizr DSL
- `docs/architecture/ir.json` — Intermediate representation

First run downloads tools automatically. Cached for subsequent runs.

---

## Done

Open `docs/architecture/README.md`. Your architecture is documented.

**Always synchronized.** No manual updates. No drift.

---

## Configuration

Create `archlette.config.yaml` to customize behavior:

```yaml
project:
  name: MyProject

extractors:
  - use: extractors/builtin/basic-node
    inputs:
      include: ['src/**/*.ts']
```

See [Configuration Reference](../guide/configuration.md) for all options.

---

## Next: Choose Your Extractor

Archlette needs to know what to analyze:

**Building with JavaScript/TypeScript?** → [Basic Node](../extractors/basic-node.md)  
**Deploying to Cloudflare Workers?** → [Basic Wrangler](../extractors/basic-wrangler.md)  
**Need both? Not sure?** → [Help me choose](choosing-extractors.md)

---

## Common Patterns

### Monorepo

Multiple extractors, one per package:

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

### Selective Extraction

Focus on specific directories:

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

### Staged Execution

Run specific pipeline stages:

```bash
npx archlette extract   # Extraction only
npx archlette generate  # Through DSL generation
npx archlette render    # Through diagram rendering
```

**With custom config:**

```bash
npx archlette -f archlette.config.yaml
```

See [CLI Reference](../reference/cli.md) for all options.

---

## Learn More

**Enhance:**

- [Annotations Reference](../guide/annotations.md) — All JSDoc tags
- [Configuration](../guide/configuration.md) — Advanced options

**Automate:**

- [CI/CD Integration](../guide/ci-cd.md) — GitHub Actions, GitLab CI

**Extend:**

- [Plugin Development](../plugins/extractors.md) — Custom extractors
