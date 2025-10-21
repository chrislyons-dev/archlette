# Choosing Extractors

**Extractors analyze source code and configuration to understand your architecture.**

Each extractor speaks a different language. Pick the ones that match your stack.

---

## By Language & Framework

| Extractor                                         | Analyzes               | Best For                                    |
| ------------------------------------------------- | ---------------------- | ------------------------------------------- |
| [basic-node](../extractors/basic-node.md)         | TypeScript, JavaScript | Application code, services, APIs, libraries |
| [basic-wrangler](../extractors/basic-wrangler.md) | Wrangler TOML          | Cloudflare Workers deployment topology      |

---

## By Architecture Pattern

### Monolithic Application

**Single codebase, one repository:**

```yaml
project:
  name: MyMonolith

extractors:
  - use: extractors/builtin/basic-node
    inputs:
      include: ['src/**/*.ts']
      exclude: ['**/*.test.ts']
```

**Extracts:** Components, actors, relationships from JSDoc annotations.

---

### Microservices on Cloudflare

**Multiple Workers, deployed independently:**

```yaml
project:
  name: WorkerMicroservices

extractors:
  - use: extractors/builtin/basic-wrangler
    inputs:
      include: ['workers/**/*.toml']
```

**Extracts:** Workers as containers, service bindings, infrastructure dependencies (KV, R2, D1, Queues).

---

### Full-Stack Application

**Code + deployment topology:**

```yaml
project:
  name: FullStackApp

extractors:
  # Application logic
  - use: extractors/builtin/basic-node
    inputs:
      include: ['src/**/*.ts']
      exclude: ['**/*.test.ts']

  # Infrastructure
  - use: extractors/builtin/basic-wrangler
    inputs:
      include: ['iac/workers/**/*.toml']
```

**Extracts:** Both logical architecture (from code) and physical deployment (from Wrangler config).

---

### Monorepo

**Multiple packages, shared repository:**

```yaml
project:
  name: MyMonorepo

extractors:
  # API service
  - use: extractors/builtin/basic-node
    name: api-service
    inputs:
      include: ['packages/api/src/**/*.ts']
      exclude: ['**/*.test.ts']

  # Web application
  - use: extractors/builtin/basic-node
    name: web-app
    inputs:
      include: ['packages/web/src/**/*.tsx']
      exclude: ['**/*.test.ts', '**/*.stories.tsx']

  # Shared library
  - use: extractors/builtin/basic-node
    name: shared-lib
    inputs:
      include: ['packages/shared/**/*.ts']
      exclude: ['**/*.test.ts']
```

**Tip:** Name each extractor to distinguish containers in diagrams.

---

## What Extractors Don't Do

**Extractors analyze structure, not behavior:**

- ❌ Don't trace runtime execution
- ❌ Don't measure performance
- ❌ Don't detect security vulnerabilities
- ❌ Don't analyze database schemas (yet)

**They extract static architecture:**

- ✅ Components and their boundaries
- ✅ Dependencies and relationships
- ✅ Deployment topology
- ✅ Infrastructure bindings

---

## Coming Soon

**Planned extractors:**

- 🔸 **basic-python** — Python packages (Django, Flask, FastAPI)
- 🔸 **basic-terraform** — AWS, Azure, GCP infrastructure
- 🔸 **basic-docker** — Docker Compose orchestration
- 🔸 **basic-openapi** — REST API contracts

Want to build your own? → [Plugin Development](../plugins/extractors.md)

---

## Need Help?

**Still not sure?** → [Configuration Guide](../guide/configuration.md)  
**Want examples?** → Check the [examples directory](https://github.com/chrislyons-dev/archlette/tree/main/examples)  
**Have questions?** → [Open an issue](https://github.com/chrislyons-dev/archlette/issues)
