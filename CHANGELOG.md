# Changelog

All notable changes to **Archlette** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## [1.0.1](https://github.com/chrislyons-dev/archlette/compare/v1.0.0...v1.0.1) (2025-10-25)

### Bug Fixes

- release-please format issue ([#26](https://github.com/chrislyons-dev/archlette/issues/26)) ([13c16d5](https://github.com/chrislyons-dev/archlette/commit/13c16d553d701efaf9b296db7f453e1e31bd3468))

## 1.0.0 (2025-10-25)

### Features

- implement basic-python extractor and improve test coverage ([#1](https://github.com/chrislyons-dev/archlette/issues/1)) ([c71c17a](https://github.com/chrislyons-dev/archlette/commit/c71c17a55521ecca18ad69191130b182d88f7a45))
- implement cloudflare wrangler extractor [#3](https://github.com/chrislyons-dev/archlette/issues/3) ([178d54e](https://github.com/chrislyons-dev/archlette/commit/178d54e3a17441437ac03d3b21f42bc537f18703))
- Initial Archlette Implementation ([#4](https://github.com/chrislyons-dev/archlette/issues/4)) ([d228150](https://github.com/chrislyons-dev/archlette/commit/d228150640cfe3fb4e3be88bab9642f23531ac1a))
- migrate to mkdocs material and automate doc generation ([0de2199](https://github.com/chrislyons-dev/archlette/commit/0de21994c0fee0d537ea7071db1557256f7e08fc))
- prepare for npm publish and fix path security validation ([#24](https://github.com/chrislyons-dev/archlette/issues/24)) ([c9d07d7](https://github.com/chrislyons-dev/archlette/commit/c9d07d707773d32ef7e82bd989b5b6b9316532e2))

### Bug Fixes

- correct mkdocs.yml config to restore GitHub Pages deploy ([aceb833](https://github.com/chrislyons-dev/archlette/commit/aceb8334ecdac009be20de63b8ccd81c5f7e5a3b))

## [Unreleased]

### Added

- (placeholder) New features since last release

### Fixed

- (placeholder) Bug fixes since last release

### Changed

- (placeholder) Breaking or notable changes

---

## [0.1.0] - 2025-10-13

### Added

- Initial public scaffold for `@chrislyons-dev/archlette`
- CLI with `init`, `generate`, `validate`, `publish`
- Banner, `--verbose` / `--quiet` / `--help` / `--version`
- Extract architecure information from:
  - Javascript applications
  - Cloudflare Wrangler toml files
- Structurizr CLI, PlantUML, and Mermaid wiring (opt-in via `aac.yaml`)
- Reusable GitHub Action + pre-commit example
- MIT `LICENSE`, `NOTICE`, and `THIRD_PARTY_LICENSES.md` scaffolding

[Unreleased]: https://github.com/chrislyons-dev/archlette/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/chrislyons-dev/archlette/releases/tag/v0.1.0
