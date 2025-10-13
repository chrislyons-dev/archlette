# Bond Math → AAC Kit Migration

## Option A — Use Reusable GitHub Workflow

1. Add this repo as a submodule or just reference it by URL.
2. In `bond-math/.github/workflows/architecture.yml`:

```yaml
name: Architecture Docs
on:
  push:
    branches: [main]
    paths:
      - 'iac/**'
      - 'services/**'
      - 'apps/**'
      - 'apis/**'
      - 'docs/adr/**'
  workflow_dispatch:

jobs:
  aac:
    uses: @chrislyons-dev/archlette/.github/workflows/aac-reusable.yml@v0.1.0
    with:
      docs_out_dir: docs/architecture
```

3. Commit `aac.yaml` at repo root and tune `inputs.*.paths`.

## Option B — Dev Dependency

1. `npm i -D @chrislyons-dev/archlette`
2. Add scripts:

```json
{
  "scripts": {
    "aac:gen": "aac generate",
    "aac:validate": "aac validate"
  }
}
```

3. Hook into pre-commit / CI as you prefer.

## Path Mapping

- `docs/adr/**` → preserved as-is.
- Generated artifacts → `docs/architecture/**`.
- Astro site can ingest `docs/architecture/**` as content or static assets.
