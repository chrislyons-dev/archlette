# core/config — Code View

[← Back to Container](./default-container.md) | [← Back to System](./README.md)

---

## Component Information

<table>
<tbody>
<tr>
<td><strong>Component</strong></td>
<td>core/config</td>
</tr>
<tr>
<td><strong>Container</strong></td>
<td>Application</td>
</tr>
<tr>
<td><strong>Type</strong></td>
<td><code>module</code></td>
</tr>
</tbody>
</table>

---

## Code Structure

### Class Diagram

![Class Diagram](./diagrams/structurizr-Classes_default_container__core_config.png)

### Code Elements

<details>
<summary><strong>5 code element(s)</strong></summary>



#### Functions

##### `resolveConfigFilePath()`

Resolve config file path from CLI arguments

<table>
<tbody>
<tr>
<td><strong>Type</strong></td>
<td><code>function</code></td>
</tr>
<tr>
<td><strong>Visibility</strong></td>
<td><code>public</code></td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>import("C:/Users/chris/git/archlette/src/core/config-resolver").ResolvedConfigFile</code> — Resolved config file information</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/config-resolver.ts:70</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `userProvidedPath`: <code>string</code> — - Path from -f argument (or undefined for default)
**Examples:**
```typescript

```

---
##### `resolveConfigBaseDir()`

Determine base directory for resolving config-relative paths

Logic:
- If using default template: CWD (user's project directory)
- If user provided config file: config file's directory
- Fallback: CWD

<table>
<tbody>
<tr>
<td><strong>Type</strong></td>
<td><code>function</code></td>
</tr>
<tr>
<td><strong>Visibility</strong></td>
<td><code>public</code></td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>string</code> — Base directory for config-relative path resolution</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/config-resolver.ts:117</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `configPath`: <code>string</code> — - Absolute path to config file (or undefined)- `isDefaultTemplate`: <code>boolean</code> — - Whether using default template
**Examples:**
```typescript

```

---
##### `loadYamlFile()`

Load and parse YAML config file

<table>
<tbody>
<tr>
<td><strong>Type</strong></td>
<td><code>function</code></td>
</tr>
<tr>
<td><strong>Visibility</strong></td>
<td><code>private</code></td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>unknown</code> — Parsed config object or null if file doesn't exist/is invalid</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/config-resolver.ts:141</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `filePath`: <code>string</code> — - Absolute path to YAML file

---
##### `createDefaultConfig()`

Create minimal default configuration when no config file is found

<table>
<tbody>
<tr>
<td><strong>Type</strong></td>
<td><code>function</code></td>
</tr>
<tr>
<td><strong>Visibility</strong></td>
<td><code>private</code></td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>import("C:/Users/chris/git/archlette/src/core/types-aac").ResolvedAACConfig</code> — Default configuration</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/config-resolver.ts:164</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `baseDir`: <code>string</code> — - Base directory for output paths

---
##### `loadConfig()`

Load configuration from file path (high-level API)

This is the main entry point for config loading. It handles:
1. Config file path resolution (default vs user-provided)
2. Base directory determination
3. YAML parsing
4. Config validation and resolution
5. Fallback to default config

<table>
<tbody>
<tr>
<td><strong>Type</strong></td>
<td><code>function</code></td>
</tr>
<tr>
<td><strong>Visibility</strong></td>
<td><code>public</code></td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>import("C:/Users/chris/git/archlette/src/core/config-resolver").LoadedConfig</code> — Loaded configuration with all metadata</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/config-resolver.ts:210</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `userProvidedPath`: <code>string</code> — - Path from -f argument (or undefined for default)
**Examples:**
```typescript

```

---

</details>

---

<div align="center">
<sub><a href="./default-container.md">← Back to Container</a> | <a href="./README.md">← Back to System</a> | Generated with <a href="https://github.com/architectlabs/archlette">Archlette</a></sub>
</div>
