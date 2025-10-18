# CLI Reference

Command-line interface for Archlette.

---

## Syntax

```bash
archlette [-f <config.yaml>] [stage]
```

Stage defaults to `all`. Full pipeline.

---

## Options

**`-f, --file <path>`**
Path to configuration file. Defaults to `templates/default.yaml` from archlette installation.

```bash
npx archlette -f .aac.yaml
npx archlette -f configs/production.yaml
```

---

## Stages

Stages chain automatically. Each runs all previous stages.

**`all`** (default)
Run full pipeline: Extract → Validate → Generate → Render → Docs

```bash
npx archlette
npx archlette -f .aac.yaml
npx archlette -f .aac.yaml all
```

**`extract`**
Extract architecture from source code. Produces IR JSON.

```bash
npx archlette -f .aac.yaml extract
```

**`validate`**
Extract + validate IR against schema.

```bash
npx archlette -f .aac.yaml validate
```

**`generate`**
Extract + validate + generate DSL files.

```bash
npx archlette -f .aac.yaml generate
```

**`render`**
Extract + validate + generate + render diagrams to images.

```bash
npx archlette -f .aac.yaml render
```

**`docs`**
Alias for `all`. Full pipeline.

```bash
npx archlette -f .aac.yaml docs
```

---

## Usage Patterns

**Development:**

```bash
# Test extraction
npx archlette -f .aac.yaml extract

# Check validation
npx archlette -f .aac.yaml validate

# Test DSL generation
npx archlette -f .aac.yaml generate
```

**Production:**

```bash
# Full pipeline
npx archlette -f .aac.yaml
```

**CI/CD:**

```bash
# With specific config
npx archlette -f .aac.yaml all
```

---

## Exit Codes

- `0` — Success
- `1` — Error (validation failed, file not found, etc.)

---

## Environment Variables

None currently supported.

---

## See Also

- [Configuration](../guide/configuration.md) — Config file reference
- [Quick Start](../getting-started/quick-start.md) — Working example
