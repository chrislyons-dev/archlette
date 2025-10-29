# Security Guide

**Archlette validates all file paths and plugin locations to protect against malicious input.**

This guide explains how to configure security settings when using custom plugins or external file locations.

---

## Table of Contents

- [Security Model](#security-model)
- [Configuration: Allowing External Paths](#configuration-allowing-external-paths)
- [Built-in Security](#built-in-security)
- [Common Scenarios](#common-scenarios)
- [For Plugin Developers](#for-plugin-developers)

---

## Security Model

Archlette processes user-provided paths and loads plugins dynamically. The security model prevents:

- **Path traversal** — Reading files outside your project
- **Arbitrary code execution** — Loading untrusted plugins
- **Command injection** — Malicious filenames in subprocesses

### What Works Without Configuration

**✅ These work automatically:**

- Built-in extractors/generators/renderers
- Input files within your project directory
- Plugins in `~/.archlette/mods/` (standard user plugin directory)
- Relative paths in config files

**⚠️ These require explicit allowlisting:**

- Plugins outside `~/.archlette/mods/`
- Absolute file paths outside your project
- External dependencies in non-standard locations

---

## Configuration: Allowing External Paths

Add security allowlists at the **root level** of your `.aac.yaml`:

```yaml
# Root-level security configuration
allowedPluginPaths:
  - /opt/company/plugins
  - /usr/local/archlette-plugins

allowedAbsolutePaths:
  - /var/shared/themes
  - /mnt/external/configs

# Project configuration follows
project:
  name: MyProject

extractors:
  - use: /opt/company/plugins/custom-extractor # Allowed by allowedPluginPaths
    inputs:
      include: ['src/**/*.ts']
```

### `allowedPluginPaths`

**Purpose**: Allow loading plugins from external directories.

**Use when**: You need to load custom extractors, validators, or generators from paths outside:

- Built-in plugin directories (`extractors/builtin/...`)
- User plugin directory (`~/.archlette/mods/`)

**Example**:

```yaml
allowedPluginPaths:
  - /opt/company/archlette-plugins
  - ~/my-organization/shared-plugins

extractors:
  - use: /opt/company/archlette-plugins/terraform-extractor
  - use: ~/my-organization/shared-plugins/graphql-extractor
```

### `allowedAbsolutePaths`

**Purpose**: Allow reading files from external directories.

**Use when**: Your themes, configs, or input files are stored outside your project directory.

**Example**:

```yaml
allowedAbsolutePaths:
  - /var/company/themes
  - /mnt/shared/architecture

generators:
  - use: generators/builtin/structurizr
    inputs:
      theme: /var/company/themes/corporate.dsl # Allowed by allowedAbsolutePaths
```

---

## Built-in Security

### File Path Validation

All input files are validated before processing:

1. **Null bytes rejected** — `file\0.txt` always fails
2. **Path traversal blocked** — `../../etc/passwd` rejected by default
3. **Extensions validated** — `.py` files for Python extractor, `.dsl` for themes
4. **Existence checked** — Missing files logged as warnings

### Plugin Loading

All plugins are validated before loading:

1. **Built-in plugins** — Always allowed (from Archlette installation)
2. **User plugins** — Auto-allowed from `~/.archlette/mods/`
3. **External plugins** — Require explicit `allowedPluginPaths` entry

---

## Common Scenarios

### Standard Setup (No Allowlists Needed)

```yaml
project:
  name: MyProject

extractors:
  - use: extractors/builtin/basic-node # Built-in: always allowed
    inputs:
      include: ['src/**/*.ts'] # Project-relative: always allowed
```

**No security configuration needed.** Everything is within project boundaries.

---

### Using User Plugins

Create `~/.archlette/mods/` for custom plugins:

```bash
mkdir -p ~/.archlette/mods
```

Place your plugin:

```
~/.archlette/mods/
└── my-custom-extractor/
    └── index.ts
```

Configure:

```yaml
extractors:
  - use: ~/.archlette/mods/my-custom-extractor # Auto-allowed: in user directory
    inputs:
      include: ['src/**/*.ts']
```

**No allowlist needed.** Plugins in `~/.archlette/mods/` are automatically trusted.

---

### Using Company/Shared Plugins

If plugins are in a company directory like `/opt/company/plugins`:

```yaml
# Add to root of .aac.yaml
allowedPluginPaths:
  - /opt/company/plugins

extractors:
  - use: /opt/company/plugins/terraform-extractor
  - use: /opt/company/plugins/openapi-extractor
```

**Without `allowedPluginPaths`**, you'll get:

```
Error: Plugin path not in allowlist: /opt/company/plugins/terraform-extractor
Hint: Add to allowedPluginPaths in .aac.yaml
```

---

### Using External Themes

If your theme files are in a shared location:

```yaml
# Add to root of .aac.yaml
allowedAbsolutePaths:
  - /var/company/themes

generators:
  - use: generators/builtin/structurizr
    inputs:
      theme: /var/company/themes/corporate.dsl
```

**Without `allowedAbsolutePaths`**, you'll get:

```
Error: Absolute path not allowed: /var/company/themes/corporate.dsl
Hint: Add to allowedAbsolutePaths in .aac.yaml
```

---

### Monorepo with Shared Config

Root-level shared config:

```yaml
# /company-monorepo/.aac.yaml
allowedAbsolutePaths:
  - /company-monorepo/shared/themes

project:
  name: CompanyServices

extractors:
  - use: extractors/builtin/basic-node
    name: api-service
    inputs:
      include: ['services/api/**/*.ts']

  - use: extractors/builtin/basic-node
    name: web-app
    inputs:
      include: ['apps/web/**/*.tsx']

generators:
  - use: generators/builtin/structurizr
    inputs:
      theme: /company-monorepo/shared/themes/brand.dsl # Allowed
```

---

## Error Messages

Archlette fails loudly with clear guidance:

### Plugin Not Allowed

```
Error: Plugin path not in allowlist: /custom/plugins/extractor

Allowed locations:
  - Built-in plugins: extractors/builtin/*, generators/builtin/*
  - User plugins: ~/.archlette/mods/
  - Custom plugins: Add to allowedPluginPaths in config

Add this to your .aac.yaml:

allowedPluginPaths:
  - /custom/plugins
```

### Absolute Path Not Allowed

```
Error: Absolute path not allowed: /external/themes/custom.dsl

Add this to your .aac.yaml:

allowedAbsolutePaths:
  - /external/themes
```

### Path Traversal Detected

```
Warning: Path traversal detected: ../../etc/passwd
Skipping file for security reasons.
```

---

## Best Practices

### ✅ Recommended

1. **Use built-in plugins** when possible (no configuration needed)
2. **Put custom plugins in `~/.archlette/mods/`** (automatically allowed)
3. **Keep themes and configs in your project** (no allowlists needed)
4. **Use specific paths in allowlists** — `/opt/plugins`, not `/`
5. **Review allowlists regularly** — Remove unused entries

### ❌ Avoid

1. **Don't allowlist `/`** or other system directories
2. **Don't allowlist paths you don't control**
3. **Don't ignore security warnings** — investigate suspicious paths
4. **Don't disable validation** — Archlette doesn't provide a way to bypass security

---

## For Plugin Developers

If you're developing custom extractors, validators, or generators:

### Recommended Plugin Location

**Option 1: User directory** (easiest for end users)

```
~/.archlette/mods/
└── your-plugin-name/
    └── index.ts
```

Users can reference with `use: ~/.archlette/mods/your-plugin-name` (no allowlist needed).

**Option 2: npm package** (best for distribution)

Publish to npm as `@your-org/archlette-plugin-name`. Users install and reference:

```bash
npm install -D @your-org/archlette-plugin-name
```

```yaml
extractors:
  - use: node_modules/@your-org/archlette-plugin-name
```

**Option 3: Shared company directory**

Install to `/opt/company/archlette-plugins/`. Document that users must add:

```yaml
allowedPluginPaths:
  - /opt/company/archlette-plugins
```

### Input Validation

If your plugin processes user files, Archlette's security module validates paths automatically. You receive only validated paths.

### Documentation

Clearly document:

- Where users should install your plugin
- Any `allowedPluginPaths` or `allowedAbsolutePaths` requirements
- Supported file extensions and input formats

---

## Security Contact

Report security vulnerabilities to:

- **GitHub Issues** (for non-sensitive issues): https://github.com/chrislyons-dev/archlette/issues
- **Security Policy**: See `SECURITY.md` in repository

---

## Summary

**Most users don't need security configuration.** Built-in plugins and project-relative paths work automatically.

**Add allowlists when**:

- Using external plugins: Add `allowedPluginPaths`
- Using external files: Add `allowedAbsolutePaths`

**Configuration format**:

```yaml
# Root level of .aac.yaml
allowedPluginPaths:
  - /path/to/plugins

allowedAbsolutePaths:
  - /path/to/external/files

# Rest of config follows
project:
  name: MyProject
```

Archlette fails loudly with clear error messages. Follow the hints to fix configuration.
