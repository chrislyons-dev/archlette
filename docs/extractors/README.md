# Extractors

**Extractors are the eyes of Archlette.** They analyze source code, configuration files, and infrastructure definitions to extract architectural information.

Each extractor understands a specific language or framework. Pick the ones that match your stack.

---

## Available Extractors

### Basic Node

**Path:** `extractors/builtin/basic-node`

Analyzes TypeScript and JavaScript codebases using JSDoc annotations.

**Extracts:**

- Components (modules, namespaces)
- Actors (users, external systems)
- Relationships (dependencies between components)
- Code elements (classes, functions)

**Best for:** Application code, services, APIs, libraries

→ [Full documentation](basic-node.md)

---

### Basic Wrangler

**Path:** `extractors/builtin/basic-wrangler`

Analyzes Cloudflare Wrangler configuration files to extract deployment topology.

**Extracts:**

- Containers (Cloudflare Workers)
- Deployments (production, staging, preview environments)
- Service bindings (worker-to-worker dependencies)
- Infrastructure bindings (KV, R2, D1, Durable Objects, Queues)

**Best for:** Cloudflare Workers microservices architecture

→ [Full documentation](basic-wrangler.md)

---

## Comparison

| Feature                    | basic-node            | basic-wrangler |
| -------------------------- | --------------------- | -------------- |
| **Language**               | TypeScript/JavaScript | TOML           |
| **Source**                 | Code annotations      | Config files   |
| **Extracts Components**    | ✅ Yes                | ❌ No          |
| **Extracts Containers**    | ⚠️ Optional           | ✅ Yes         |
| **Extracts Deployments**   | ❌ No                 | ✅ Yes         |
| **Extracts Relationships** | ✅ Yes                | ✅ Yes         |
| **Infrastructure Aware**   | ❌ No                 | ✅ Yes         |

---

## Configuration Pattern

**Typical setup:**

```yaml
extractors:
  - use: extractors/builtin/basic-node
    inputs:
      include: ['src/**/*.ts']
      exclude: ['**/*.test.ts']
```

**All extractors support:**

- `use` — Path to extractor module
- `name` — Optional friendly name
- `inputs` — File patterns (include/exclude)
- `props` — Extractor-specific configuration

---

## Multiple Extractors

**Extractors run in sequence.** Outputs merge into a single Intermediate Representation (IR).

**Example: Full-stack application**

```yaml
extractors:
  # Application code
  - use: extractors/builtin/basic-node
    name: app-code
    inputs:
      include: ['src/**/*.ts']

  # Deployment topology
  - use: extractors/builtin/basic-wrangler
    name: worker-deployment
    inputs:
      include: ['iac/workers/**/*.toml']
```

**Result:** One architecture with both logical components (from code) and physical deployments (from config).

---

## Coming Soon

**Planned extractors:**

- 🔸 **basic-python** — Python (Django, Flask, FastAPI)
- 🔸 **basic-terraform** — Infrastructure as Code (AWS, Azure, GCP)
- 🔸 **basic-docker** — Docker Compose
- 🔸 **basic-openapi** — REST API specifications
- 🔸 **basic-graphql** — GraphQL schemas

---

## Build Your Own

**Creating custom extractors is straightforward:**

1. Implement the `ArchletteExtractor` interface
2. Return `ArchletteIR` conforming to the schema
3. Register in your `.aac.yaml`

→ [Plugin Development Guide](../plugins/extractors.md)

---

## Need Help?

**Choosing an extractor?** → [Decision guide](../getting-started/choosing-extractors.md)  
**Configuration options?** → [Configuration reference](../guide/configuration.md)  
**Want to contribute?** → [Contributing guide](../../CONTRIBUTING.md)
