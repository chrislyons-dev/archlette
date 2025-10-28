# CI/CD Integration

Architecture in your pipeline. Automatically.

---

## GitHub Actions

### Basic Workflow

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
          node-version: '20'

      - run: npm ci

      - name: Generate architecture docs
        run: npx archlette -f archlette.config.yaml

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/architecture
```

### With Java Setup

Archlette requires Java for diagram rendering:

```yaml
- uses: actions/setup-java@v5
  with:
    distribution: 'temurin'
    java-version: '17'

- name: Generate architecture docs
  run: npx archlette -f archlette.config.yaml
```

### Tool Caching

Cache downloaded tools (Structurizr CLI, PlantUML):

```yaml
- name: Cache Archlette tools
  uses: actions/cache@v4
  with:
    path: ~/.archlette/tools
    key: archlette-tools-${{ hashFiles('archlette.config.yaml') }}

- name: Generate architecture docs
  run: npx archlette -f archlette.config.yaml
```

First run downloads tools. 3-5 minutes.
Cached runs: 30-60 seconds.

---

## GitLab CI

```yaml
architecture-docs:
  image: node:20
  before_script:
    - apt-get update && apt-get install -y openjdk-17-jre
    - npm ci
  script:
    - npx archlette -f archlette.config.yaml
  artifacts:
    paths:
      - docs/architecture
  only:
    - main
```

### With Caching

```yaml
architecture-docs:
  image: node:20
  cache:
    paths:
      - node_modules/
      - ~/.archlette/tools/
  before_script:
    - apt-get update && apt-get install -y openjdk-17-jre
    - npm ci
  script:
    - npx archlette -f archlette.config.yaml
  artifacts:
    paths:
      - docs/architecture
```

---

## Pre-commit Hook

Keep docs synchronized with code changes:

### Using Husky

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npx archlette -f .aac.yaml && git add docs/architecture/"
    }
  }
}
```

### Manual Hook

`.git/hooks/pre-commit`:

```bash
#!/bin/sh

# Generate architecture docs
npx archlette -f .aac.yaml

# Add generated files
git add docs/architecture/

exit 0
```

Make executable:

```bash
chmod +x .git/hooks/pre-commit
```

---

## Pull Request Validation

Check if architecture docs are up to date:

```yaml
name: Validate Architecture Docs

on: pull_request

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - run: npm ci

      - name: Generate docs
        run: npx archlette -f .aac.yaml

      - name: Check for changes
        run: |
          if ! git diff --quiet docs/architecture/; then
            echo "Architecture docs are out of date"
            echo "Run: npx archlette -f .aac.yaml"
            exit 1
          fi
```

PR fails if docs are stale. Regenerate. Push.

---

## Docker

### Dockerfile

```dockerfile
FROM node:20-alpine

# Install Java for diagram rendering
RUN apk add --no-cache openjdk17-jre

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npx", "archlette", "-f", ".aac.yaml"]
```

### Usage

```bash
docker build -t archlette-docs .
docker run -v $(pwd)/docs:/app/docs archlette-docs
```

---

## Monorepo Patterns

### Nx Workspace

```json
{
  "targets": {
    "docs": {
      "executor": "@nx/workspace:run-commands",
      "options": {
        "command": "npx archlette -f .aac.yaml"
      }
    }
  }
}
```

Run:

```bash
nx run myproject:docs
```

### Turborepo

```json
{
  "pipeline": {
    "docs": {
      "outputs": ["docs/architecture/**"]
    }
  }
}
```

Run:

```bash
turbo run docs
```

---

## See Also

- [Configuration](configuration.md) — Configure Archlette for your project
- [Quick Start](../getting-started/quick-start.md) — Working example
