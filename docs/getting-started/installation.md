# Installation

Two requirements. Node and Java.

---

## Node.js

**Minimum version:** 18.0.0

Check your version:

```bash
node --version
```

**Install or upgrade:**

**macOS:**

```bash
brew install node@20
```

**Ubuntu/Debian:**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
Download from [nodejs.org](https://nodejs.org/)

---

## Java

**Minimum version:** 11

Required for diagram rendering (Structurizr CLI and PlantUML both need Java).

Check your version:

```bash
java -version
```

**Install:**

**macOS:**

```bash
brew install openjdk@17
```

**Ubuntu/Debian:**

```bash
sudo apt-get install openjdk-17-jre
```

**Windows:**
Download from [Adoptium](https://adoptium.net/)

Archlette will verify Java is available before rendering. Clear error messages if missing.

---

## Archlette

Install as dev dependency:

```bash
npm install -D @chrislyons-dev/archlette
```

Or use directly via npx (no install needed):

```bash
npx @chrislyons-dev/archlette --help
```

---

## Verify Installation

```bash
npx archlette --version
```

Should print the current version number.

---

## Tool Auto-Download

First run downloads external tools to `~/.archlette/tools/`:

- **Structurizr CLI** (v2025.05.28) — DSL export
- **PlantUML** (v1.2025.8) — Diagram rendering

Downloads happen once. Cached for all subsequent runs.

**Cache location:**

- macOS/Linux: `~/.archlette/tools/`
- Windows: `%USERPROFILE%\.archlette\tools\`

Clear cache to re-download:

```bash
rm -rf ~/.archlette/tools/
```

---

## Next Steps

- [Quick Start](quick-start.md) — Generate your first diagram
- [Configuration](../guide/configuration.md) — Customize Archlette for your project
