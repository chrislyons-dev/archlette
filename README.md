# 🏗️ Archlette

> **Architecture-as-Code toolkit for automated diagrams, docs, and releases.**  
> _Code speaks. Archlette listens. Architecture evolves._

[![npm version](https://img.shields.io/npm/v/@chrislyons-dev/archlette?color=blue&logo=npm)](https://www.npmjs.com/package/@chrislyons-dev/archlette)
[![CI](https://github.com/chrislyons-dev/archlette/actions/workflows/ci.yml/badge.svg)](https://github.com/chrislyons-dev/archlette/actions/workflows/ci.yml)
[![CD](https://github.com/chrislyons-dev/archlette/actions/workflows/cd.yml/badge.svg)](https://github.com/chrislyons-dev/archlette/actions/workflows/cd.yml)
[![Docs](https://img.shields.io/badge/docs-gh--pages-success?logo=github)](https://chrislyons-dev.github.io/archlette/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A repo‑agnostic, drop‑in toolkit to generate and publish architecture docs (C4 diagrams, IaC graphs, ADRs) from code and infrastructure.

## Features

- Single `archlette.yaml` config drives discovery, generation, and publishing
- Pluggable generators (Mermaid C4, PlantUML C4, Inframap)
- Reusable GitHub Action workflow
- Pre‑commit integration examples (Husky or pre‑commit)
- Templates for ADRs and index pages

## Quick start

```bash
# as a repo you own
git clone <this-repo>
npm ci
npm run archlette:init
npm run archlette:gen
```

Or install via `npm` in a consumer repo (after you publish this package):

```bash
npm i -D @chrislyons-dev/archlette
npx archlette init
npx archlette generate
```

See `examples/bond-math-migration.md` for a migration checklist.

---

## License

MIT © 2025 Chris Lyons

This project may **call** external tools (PlantUML, Graphviz, Mermaid CLI, Inframap) which
retain their own licenses and are **not** redistributed by this repository. See `NOTICE`
and `THIRD_PARTY_LICENSES.md` for details.

## CLI

```
archlette --help
archlette --version
archlette generate --verbose
archlette validate --quiet
```

- Banner shows on top-level commands unless `--quiet` or `CI=true`.

## Docs

This repo publishes a tiny static site from `README.md`, `CHANGELOG.md`, and `NOTICE`
to the **`gh-pages`** branch via GitHub Actions (`docs.yml`).

- Workflow: `.github/workflows/docs.yml`
- Build step: `node scripts/build-docs.mjs` creates `/site` with Markdown files
- Deployment: `peaceiris/actions-gh-pages` pushes `/site` -> `gh-pages`

Once enabled in **Settings → Pages → Source: `gh-pages`**, your docs will be served at:
`https://<owner>.github.io/<repo>/`
