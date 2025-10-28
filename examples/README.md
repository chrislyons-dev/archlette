# Archlette Configuration Examples

This directory contains example configuration files for different project types.

## Quick Start Examples

### Single Repository (Node.js/TypeScript)

**File:** `singlerepo.config.yaml`

Basic configuration for a single TypeScript/JavaScript project.

```bash
cp examples/singlerepo.config.yaml archlette.config.yaml
npx archlette all
```

### Monorepo

**File:** `monorepo.config.yaml`

Configuration for analyzing multiple packages in a monorepo structure.

```bash
cp examples/monorepo.config.yaml archlette.config.yaml
npx archlette all
```

### Astro Project (Quick Start)

**File:** `astro-quickstart.yaml`

Minimal configuration for analyzing an Astro project with both TypeScript and Astro files.

```bash
cp examples/astro-quickstart.yaml archlette.config.yaml
npx archlette all
```

**What it does:**

- Extracts TypeScript/JavaScript utilities using `basic-node` extractor
- Extracts Astro components using `basic-astro` extractor
- Automatically merges results into unified architecture model
- Generates diagrams and documentation

### Astro Project (Full Configuration)

**File:** `astro-project-config.yaml`

Comprehensive configuration for Astro projects with detailed examples and explanations.

**Features demonstrated:**

- Multiple extractor configuration
- Component detection via JSDoc tags (`@component`, `@module`, `@namespace`)
- Actor identification (`@actor`)
- Relationship mapping (`@uses`)
- Cross-extractor aggregation
- Complete pipeline: extract → validate → generate → render → docs

**Example JSDoc annotations:**

```typescript
// src/lib/api.ts
/**
 * API client for backend services
 * @component API
 * @actor Backend {System} {out} REST API backend service
 * @uses Database Stores application data
 */
export class ApiClient {
  async fetch(url: string) {
    /* ... */
  }
}
```

```astro
---
// src/components/Button.astro
/**
 * Reusable button component
 * @component Button
 * @uses Theme Applies theme colors
 */
interface Props {
  label: string;
  variant?: 'primary' | 'secondary';
}

const { label, variant = 'primary' } = Astro.props;
---
<button class={`btn-${variant}`}>{label}</button>
```

## Extractor Coverage

### Basic-Node Extractor

**Supported files:** `.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.mjs`, `.cts`, `.cjs`

**Extracts:**

- Classes, functions, methods
- Types, interfaces, enums
- JSDoc documentation
- Import relationships
- Components (via JSDoc tags)
- Actors (via `@actor` tags)

### Basic-Astro Extractor

**Supported files:** `.astro`

**Extracts:**

- Astro components
- Frontmatter TypeScript/JavaScript code (classes, functions, types, interfaces)
- JSDoc documentation from frontmatter
- Component usage in templates
- Import relationships
- Actors (via `@actor` tags)
- Component dependencies (via `@uses` tags)

### Basic-Python Extractor

**Supported files:** `.py`

**Extracts:**

- Classes, functions, methods
- Type hints
- Docstrings (Google-style, NumPy-style)
- Import relationships
- Components (via docstring tags)

### Basic-Wrangler Extractor

**Supported files:** `wrangler.toml`, `wrangler.json`

**Extracts:**

- Cloudflare Workers deployment configuration
- KV namespaces, Durable Objects, R2 buckets
- Environment bindings
- Route patterns

## Multi-Extractor Projects

For projects with multiple languages, configure multiple extractors. Results are automatically aggregated:

```yaml
extractors:
  # TypeScript backend
  - use: extractors/builtin/basic-node
    inputs:
      include: ['src/**/*.ts']
      exclude: ['**/*.astro']

  # Astro frontend
  - use: extractors/builtin/basic-astro
    inputs:
      include: ['src/**/*.astro']

  # Python microservices
  - use: extractors/builtin/basic-python
    inputs:
      include: ['services/**/*.py']

  # Cloudflare Workers
  - use: extractors/builtin/basic-wrangler
    inputs:
      include: ['workers/**/wrangler.toml']
```

## Output Structure

After running `npx archlette all`, you'll find:

```
architecture/              # or your configured output directory
├── ir.json               # Complete architecture IR (JSON)
├── dsl/
│   └── workspace.dsl    # Structurizr DSL
├── diagrams/
│   ├── system-context.png
│   ├── container.png
│   └── component-*.png
└── docs/
    ├── README.md        # Architecture documentation
    └── components/      # Per-component documentation
```

## Component Inference Rules

If no JSDoc tag is found, components are inferred from directory structure:

**Subdirectories:**

- `src/components/Button.astro` → component = `"components"`
- `src/utils/helpers.ts` → component = `"utils"`

**Root directory:**

- `src/Layout.astro` → component = package name or `"Application"`

## Tips

1. **Start simple:** Use the quickstart configs, then customize
2. **Exclude tests:** Always exclude `.test.*` and `.spec.*` files
3. **Annotate strategically:** Add JSDoc tags to key architectural components
4. **Multiple extractors:** Run different extractors for different file types
5. **Incremental adoption:** Start with one extractor, add more as needed

## Further Reading

- [Main Documentation](../docs/index.md)
- [Component Detection Guide](../docs/extractors/component-detection.md)
- [Configuration Reference](../docs/configuration.md)
