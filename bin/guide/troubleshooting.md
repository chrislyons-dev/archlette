# Troubleshooting

Common issues. Quick fixes.

---

## Java not found

Renderers need Java. Install 11 or higher.

```bash
# macOS
brew install openjdk@17

# Ubuntu/Debian
sudo apt install openjdk-17-jre

# Windows
# Download from https://adoptium.net/

# Verify
java -version
```

---

## TypeScript parsing errors

Extractor fails on valid TypeScript? Check these:

- `tsconfig.json` is valid
- Files use standard TypeScript syntax
- No compilation errors exist
- File encoding is UTF-8

Archlette uses `ts-morph`. Standard TypeScript only.

---

## Missing components

Components don't appear in diagrams? Add annotations.

```typescript
/**
 * @component MyComponent
 * Component description
 */
```

Files without annotations are extracted as code elements. Not grouped into components.

---

## Empty diagrams

Diagrams render but nothing appears?

**Common causes:**

- No components defined (add `@component` tags)
- Extractor includes/excludes wrong files
- IR validation failed

**Debug:**

```bash
# Check IR output
npx archlette -f .aac.yaml extract
cat docs/architecture/ir.json

# Run validation
npx archlette -f .aac.yaml validate
```

---

## Tool download fails

Structurizr CLI or PlantUML won't download?

1. Check internet connection
2. Check firewall/proxy settings
3. Manually download to `~/.archlette/tools/`:
   - [Structurizr CLI](https://github.com/structurizr/cli/releases)
   - [PlantUML](https://github.com/plantuml/plantuml/releases)

---

## Diagram rendering slow

PlantUML taking minutes?

**Speed it up:**

- Cache tools in CI (see [CI/CD Guide](ci-cd.md))
- Use smaller diagrams (filter with tags)
- Run specific stages: `npx archlette render` (skips docs)

---

## Path resolution errors

"File not found" or "Cannot write to path"?

Check path configuration:

```yaml
paths:
  ir_out: docs/architecture/ir.json # Relative to config file location
  dsl_out: docs/architecture/workspace.dsl
```

Paths resolve relative to config file directory. Not current working directory.

---

## See Also

- [Installation](../getting-started/installation.md) — Setup requirements
- [Configuration](configuration.md) — Path and plugin configuration
- [Quick Start](../getting-started/quick-start.md) — Working example
