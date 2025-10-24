# Security Guide

**Archlette's security architecture protects against malicious input while enabling legitimate extensibility.**

This guide documents input validation strategies, security validation points, and best practices for contributors adding new extractors, generators, or plugins.

---

## Table of Contents

- [Security Model Overview](#security-model-overview)
- [Path Security Module](#path-security-module)
- [Input Validation Points](#input-validation-points)
- [Plugin Directory Convention](#plugin-directory-convention)
- [Best Practices for Contributors](#best-practices-for-contributors)
- [Security Checklist](#security-checklist)

---

## Security Model Overview

Archlette processes user-provided paths and dynamically loads code. The security model balances:

1. **Protection**: Prevent path traversal, command injection, and arbitrary code execution
2. **Usability**: Enable legitimate use cases (custom themes, external plugins, monorepos)
3. **Clarity**: Make security boundaries explicit and violations loud

### Core Principles

- **Validate Early**: Check all external input at system boundaries
- **Fail Loudly**: Security violations throw errors with clear messages
- **Allow by Default**: Built-in plugins and standard patterns work without configuration
- **Explicit for External**: External resources require explicit allowlisting

---

## Path Security Module

**Location**: `src/core/path-security.ts`

The path security module provides centralized validation for all user-provided file paths.

### Resolution Strategies

Four strategies balance security and flexibility:

| Strategy           | Use Case                                  | Behavior                                         |
| ------------------ | ----------------------------------------- | ------------------------------------------------ |
| `restricted`       | User input files confined to project      | Blocks paths outside base directory              |
| `config-relative`  | User content (themes, inputs)             | Allows config-relative paths, warns on traversal |
| `cli-relative`     | Built-in plugins                          | Paths relative to Archlette installation         |
| `absolute-allowed` | Advanced users with external dependencies | Allows absolute paths with warnings              |

### Key Functions

#### `resolveSecurePath(userPath, options)`

Main validation function. Returns `ResolvedSecurePath` with:

- `absolutePath`: Normalized absolute path
- `exists`: Whether path exists on filesystem
- `type`: 'file', 'directory', or 'unknown'
- `isSecure`: Whether path passed validation
- `warnings`: Non-fatal security warnings

**Example:**

```typescript
import { resolveSecurePath } from './core/path-security.js';

// Validate theme file (user content)
const theme = resolveSecurePath('./themes/corporate.dsl', {
  baseDir: ctx.configBaseDir,
  strategy: 'config-relative',
  allowedExtensions: ['.dsl'],
  mustExist: true,
});

if (theme.warnings.length > 0) {
  log.warn(`Security warnings: ${theme.warnings.join(', ')}`);
}
```

#### Convenience Functions

- **`resolveUserContentPath()`**: For themes, custom configs (config-relative)
- **`resolvePluginPath()`**: For plugin modules (cli-relative)

### Validation Rules

The module checks for:

1. **Null bytes** (`\0`) - Always rejected
2. **Directory traversal** patterns (`../`, `/../`, etc.) - Strategy-dependent
3. **Absolute paths** - Validated against allowlist (external plugins)
4. **File extensions** - Optional enforcement (e.g., `.dsl` for themes)
5. **Tilde expansion** - `~/` resolved to user home directory

---

## Input Validation Points

All external input is validated at system boundaries:

### 1. Extractor Input Files

**Location**: `src/extractors/builtin/basic-python.ts`, `basic-node.ts`

**Validation**: Files discovered by glob patterns are validated before parsing.

```typescript
// From basic-python.ts (lines 49-91)
const validatedPaths: string[] = [];
const invalidPaths: string[] = [];

for (const filePath of filePaths) {
  try {
    const resolved = resolveSecurePath(filePath, {
      baseDir: ctx.configBaseDir,
      strategy: 'config-relative',
      allowedExtensions: ['.py', '.pyi'],
      mustExist: true,
    });

    if (resolved.warnings.length > 0) {
      log.warn(`Security warnings for ${filePath}...`);
    }

    validatedPaths.push(resolved.absolutePath);
  } catch (error) {
    log.warn(`Skipping invalid path ${filePath}: ${error.message}`);
    invalidPaths.push(filePath);
  }
}
```

**Why**: Prevents malicious glob patterns from causing the Python/TypeScript parsers to process files outside project boundaries.

### 2. Dynamically Loaded Modules

**Location**: `src/core/module-loader.ts`

**Validation**: All plugin modules validated before dynamic import.

```typescript
// From module-loader.ts (lines 111-160)
// Build default allowlist: ~/.archlette/mods + user-provided paths
const defaultUserDir = getDefaultUserPluginDir();
const fullAllowlist = allowedAbsolutePaths ? [...allowedAbsolutePaths] : [];

if (defaultUserDir && !fullAllowlist.some((p) => p === defaultUserDir)) {
  fullAllowlist.push(defaultUserDir);
}

const secureResult = resolvePluginPath(spec, cliDir, fullAllowlist);

// Verify resolved path matches security-validated path
if (!normalizedResolved.startsWith(normalizedSecure)) {
  throw new Error('Security validation mismatch...');
}
```

**Why**: Prevents arbitrary code execution via malicious plugin paths in config files.

### 3. Theme Files

**Location**: `src/generators/builtin/structurizr.ts`

**Validation**: Custom theme paths validated before file read.

```typescript
// From structurizr.ts (lines 95+)
const baseDir = node._configBaseDir || process.cwd();
const pathResult = resolveUserContentPath(customThemePath, baseDir, ['.dsl']);

if (!pathResult.exists) {
  throw new Error(`Theme file not found: ${pathResult.absolutePath}`);
}
```

**Why**: Prevents theme paths from reading sensitive files outside project.

### 4. Command Execution

**Location**: `src/extractors/builtin/basic-python/file-parser.ts`

**Protection**: Python parser receives only validated file paths.

```typescript
// After validation in basic-python.ts
const extractions = await parseFiles(validatedPaths, pythonPath);

// In file-parser.ts (line 64)
const args = [scriptPath, ...filePaths]; // filePaths already validated
const process = spawn(pythonPath, args);
```

**Why**: Prevents command injection via malicious filenames in Python subprocess.

---

## Plugin Directory Convention

**User plugins default to `~/.archlette/mods/`**

This standardizes external plugin location and simplifies security:

### Directory Structure

```
~/.archlette/
├── mods/              # User plugins (automatically allowed)
│   ├── my-extractor/
│   │   └── index.ts
│   └── custom-validator.ts
└── themes/            # User themes (optional)
    └── corporate.dsl
```

### Plugin Types

| Type        | Path Pattern                     | Security                      |
| ----------- | -------------------------------- | ----------------------------- |
| Built-in    | `extractors/builtin/basic-node`  | Always allowed (CLI-relative) |
| User Plugin | `~/.archlette/mods/my-extractor` | Automatically allowed         |
| External    | `/custom/plugins/extractor`      | Requires explicit allowlist   |

### Configuration Example

```yaml
extractors:
  # Built-in plugin (no special config needed)
  - use: extractors/builtin/basic-python

  # User plugin from ~/.archlette/mods/ (auto-allowed)
  - use: ~/.archlette/mods/my-custom-extractor

  # External plugin (requires allowlist in CLI invocation)
  - use: /opt/company/plugins/proprietary-extractor
    # Requires: allowedPluginPaths: ['/opt/company/plugins']
```

### Loading Behavior

```typescript
// module-loader.ts automatically adds ~/.archlette/mods to allowlist
const defaultUserDir = expandTilde('~/.archlette/mods');
const fullAllowlist = [...allowedAbsolutePaths, defaultUserDir];
```

---

## Best Practices for Contributors

### Adding a New Extractor

**✅ DO:**

1. **Validate all input files** before parsing:

```typescript
const validatedPaths: string[] = [];
for (const filePath of foundFiles) {
  try {
    const resolved = resolveSecurePath(filePath, {
      baseDir: ctx.configBaseDir,
      strategy: 'config-relative',
      allowedExtensions: ['.ext'], // Your file extensions
      mustExist: true,
    });
    validatedPaths.push(resolved.absolutePath);
  } catch (error) {
    log.warn(`Skipping invalid path: ${error.message}`);
  }
}
```

2. **Log security warnings** to alert users:

```typescript
if (resolved.warnings.length > 0) {
  log.warn(
    `Security warnings for ${filePath}:\n` +
      resolved.warnings.map((w) => `  - ${w}`).join('\n'),
  );
}
```

3. **Handle validation failures gracefully**:

```typescript
if (validatedPaths.length === 0) {
  log.warn('No valid files after security validation');
  return createEmptyIR(); // Don't throw, return empty result
}
```

**❌ DON'T:**

- Pass user-provided paths directly to parsers or child processes
- Suppress security warnings
- Assume globby/filesystem APIs validate paths
- Allow arbitrary file extensions without validation

### Adding External Tool Integration

**✅ DO:**

1. **Sanitize arguments** before spawning processes:

```typescript
// Validate all paths in args array
const safeArgs = args.map((arg) => {
  if (isFilePath(arg)) {
    const resolved = resolveSecurePath(arg, options);
    return resolved.absolutePath;
  }
  return arg;
});

spawn(toolPath, safeArgs);
```

2. **Use allowlists** for tool paths:

```typescript
const ALLOWED_TOOL_PATHS = [
  '/usr/bin/python',
  '/usr/local/bin/python3',
  'C:\\Python39\\python.exe',
];

if (!ALLOWED_TOOL_PATHS.includes(toolPath)) {
  throw new Error(`Tool path not in allowlist: ${toolPath}`);
}
```

**❌ DON'T:**

- Use shell execution (`shell: true`) with user input
- Concatenate user input into command strings
- Trust file paths from config without validation

### Adding Plugin Support

**✅ DO:**

1. **Use existing module loader** (handles security automatically):

```typescript
import { loadModuleFromPath } from './core/module-loader.js';

const { module } = await loadModuleFromPath(userProvidedPath);
```

2. **Provide clear error messages**:

```typescript
try {
  const plugin = await loadModuleFromPath(pluginPath);
} catch (error) {
  throw new Error(
    `Failed to load plugin '${pluginPath}':\n${error.message}\n\n` +
      `Hint: User plugins should be in ~/.archlette/mods/\n` +
      `External plugins require explicit allowlist.`,
  );
}
```

**❌ DON'T:**

- Use raw `import()` or `require()` with user paths
- Bypass module loader security validation
- Allow plugin paths without documentation

---

## Security Checklist

Use this checklist when reviewing code or adding features:

### Input Validation

- [ ] All user-provided paths validated with `resolveSecurePath()`
- [ ] Appropriate strategy chosen (config-relative, cli-relative, etc.)
- [ ] File extension validation enforced where applicable
- [ ] Validation failures logged and handled gracefully
- [ ] Security warnings logged to user

### Command Execution

- [ ] No shell execution (`shell: true`) with user input
- [ ] Arguments sanitized before `spawn()` or `exec()`
- [ ] No string concatenation of user input into commands
- [ ] Tool paths validated against allowlist

### Path Operations

- [ ] No direct file reads of user-provided paths without validation
- [ ] Tilde expansion handled correctly (`~/`)
- [ ] Relative paths resolved from correct base directory
- [ ] Symbolic links considered (validation checks resolved path)

### Plugin Loading

- [ ] Use `loadModuleFromPath()` (not raw `import()`)
- [ ] External plugins documented with allowlist requirements
- [ ] Error messages guide users to `~/.archlette/mods/`
- [ ] Plugin interface validated after loading

### Error Handling

- [ ] Security violations throw errors (don't fail silently)
- [ ] Error messages don't leak sensitive paths
- [ ] Validation failures logged at appropriate level (warn/error)
- [ ] Users guided to fix configuration issues

### Testing

- [ ] Test with malicious paths (e.g., `../../etc/passwd`)
- [ ] Test with null bytes (`file\0.txt`)
- [ ] Test with absolute paths outside project
- [ ] Test with non-existent files
- [ ] Test with symbolic links (if applicable)

---

## Summary

Archlette's security model:

1. **Validates all external input** at system boundaries
2. **Uses path-security module** for consistent validation across codebase
3. **Establishes `~/.archlette/mods/`** as standard user plugin directory
4. **Fails loudly** with clear error messages on violations
5. **Enables extensibility** while preventing common attacks

When in doubt:

- **Validate paths** with `resolveSecurePath()`
- **Use module loader** for dynamic imports
- **Log security warnings** to users
- **Fail loudly** on validation errors
- **Document allowlists** clearly

For questions or security concerns, consult:

- `src/core/path-security.ts` - Path validation implementation
- `src/core/module-loader.ts` - Plugin loading with security
- `test/core/path-security.test.ts` - Security test examples
