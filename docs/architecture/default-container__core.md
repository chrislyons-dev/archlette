# core — Code View

[← Back to Container](./default-container.md) | [← Back to System](./README.md)

---

## Component Information

<table>
<tbody>
<tr>
<td><strong>Component</strong></td>
<td>core</td>
</tr>
<tr>
<td><strong>Container</strong></td>
<td>Application</td>
</tr>
<tr>
<td><strong>Type</strong></td>
<td><code>module</code></td>
</tr>
<tr>
<td><strong>Description</strong></td>
<td>Dynamic ESM module loader | Stage module interfaces for the AAC pipeline | Stage module loaders | Tool management for external rendering tools | Architecture-as-Code (AAC) configuration types and schemas | Archlette Intermediate Representation (IR) types and schemas | Core pipeline types</td>
</tr>
</tbody>
</table>

---

## Code Structure

### Class Diagram

![Class Diagram](./diagrams/structurizr-Classes_default_container__core.png)

### Code Elements

<details>
<summary><strong>30 code element(s)</strong></summary>



#### Functions

##### `core__nameToId()`

Convert a name to a normalized ID
Used for consistent ID generation across extractors and mappers

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
<td><code>string</code> — Normalized ID (lowercase, hyphenated, alphanumeric)</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/constants.ts:56</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `name`: <code>string</code> — - The name to convert (component, actor, etc.)
**Examples:**
```typescript

```

---
##### `core__isTTY()`

Determine if we're in a TTY environment (for pretty printing)

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
<td><code>boolean</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/logger.ts:43</code></td>
</tr>
</tbody>
</table>



---
##### `core__getDefaultLogLevel()`

Get default log level from environment or fallback to 'info'

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
<td><code>import("C:/Users/chris/git/archlette/src/core/logger").LogLevel</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/logger.ts:50</code></td>
</tr>
</tbody>
</table>



---
##### `core__createPinoLogger()`

Create a Pino logger instance with optional pretty printing

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
<td><code>PinoLogger</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/logger.ts:66</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `level`: <code>import("C:/Users/chris/git/archlette/src/core/logger").LogLevel</code>- `pretty`: <code>boolean</code>

---
##### `core__createLogger()`

Create a logger instance

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
<td><code>import("C:/Users/chris/git/archlette/src/core/logger").Logger</code> — Logger instance</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/logger.ts:131</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `options`: <code>import("C:/Users/chris/git/archlette/src/core/logger").LoggerOptions</code> — - Logger configuration
**Examples:**
```typescript

```

---
##### `core__loadModuleFromPath()`

Dynamically load an ESM module from a path or module specifier

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
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<import("C:/Users/chris/git/archlette/src/core/module-loader").LoadedModule<T>></code> — Promise resolving to loaded module with metadata</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/module-loader.ts:62</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `spec`: <code>string</code> — - Module specifier (relative path, absolute path, or ~/ path)- `exts`: <code>(".ts" | ".js")[]</code> — - File extensions to probe (in order of preference)
**Examples:**
```typescript

```

---
##### `core__getCliDir()`


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
<td><code>string</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/path-resolver.ts:17</code></td>
</tr>
</tbody>
</table>



---
##### `core__expandTilde()`


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
<td><code>string</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/path-resolver.ts:24</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `p`: <code>string</code>- `homeDir`: <code>string</code>

---
##### `core__resolveArchlettePath()`

Core path resolver honoring Archlette rules (no file existence checks).
- "~"  -> user home
- "/"  -> absolute
- else -> relative to CLI dir

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
<td><code>string</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/path-resolver.ts:42</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `input`: <code>string</code>- `opts`: <code>{ cliDir: string; }</code>

---
##### `core__resolveModuleEntry()`

Resolve a module entry by probing:
1) Exact path
2) With extensions: .ts then .js
3) If directory: index.ts then index.js

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
<td><code>string</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/path-resolver.ts:64</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `input`: <code>string</code>- `opts`: <code>{ cliDir: string; wantedExts?: (".ts" | ".js")[]; }</code>

---
##### `core__toFileUrl()`


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
<td><code>string</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/path-resolver.ts:100</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `p`: <code>string</code>

---
##### `core__writeFile()`

Write content to a file, creating parent directories if needed.

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
<td><code>void</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/path-resolver.ts:110</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `filename`: <code>string</code> — - Absolute path to the file- `content`: <code>string</code> — - Content to write

---
##### `core__loadExtractorModule()`


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
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<{ entry: Function; resolved: string; }></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/stage-module-loader.ts:13</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `modulePath`: <code>string</code>

---
##### `core__loadValidatorModule()`


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
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<{ entry: Function; resolved: string; }></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/stage-module-loader.ts:26</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `modulePath`: <code>string</code>

---
##### `core__loadGeneratorModule()`


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
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<{ entry: Function; resolved: string; }></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/stage-module-loader.ts:39</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `modulePath`: <code>string</code>

---
##### `core__loadRendererModule()`


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
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<{ entry: Function; resolved: string; }></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/stage-module-loader.ts:52</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `modulePath`: <code>string</code>

---
##### `core__loadDocModule()`


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
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<{ entry: Function; resolved: string; }></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/stage-module-loader.ts:65</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `modulePath`: <code>string</code>

---
##### `core__getCacheDir()`

Get the Archlette cache directory

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
<td><code>string</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/tool-manager.ts:64</code></td>
</tr>
</tbody>
</table>



---
##### `core__ensureCacheDir()`

Ensure cache directory exists

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
<td><code>string</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/tool-manager.ts:72</code></td>
</tr>
</tbody>
</table>



---
##### `core__commandExistsInPath()`

Check if a command exists in PATH

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
<td><code>string</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/tool-manager.ts:83</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `command`: <code>string</code>

---
##### `core__downloadFile()`

Download a file from URL to destination

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
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<void></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/tool-manager.ts:102</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `url`: <code>string</code>- `dest`: <code>string</code>- `log`: <code>import("C:/Users/chris/git/archlette/src/core/logger").Logger</code>

---
##### `core__extractZip()`

Extract a ZIP file (simple extraction for Structurizr CLI)

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
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<void></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/tool-manager.ts:144</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `zipPath`: <code>string</code>- `destDir`: <code>string</code>- `log`: <code>import("C:/Users/chris/git/archlette/src/core/logger").Logger</code>

---
##### `core__makeExecutable()`

Make file executable (Unix only)

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
<td><code>void</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/tool-manager.ts:171</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `filePath`: <code>string</code>

---
##### `core__downloadStructurizr()`

Download and install Structurizr CLI to cache

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
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<string></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/tool-manager.ts:180</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `cacheDir`: <code>string</code>- `log`: <code>import("C:/Users/chris/git/archlette/src/core/logger").Logger</code>

---
##### `core__downloadPlantUML()`

Download and install PlantUML to cache

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
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<string></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/tool-manager.ts:218</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `cacheDir`: <code>string</code>- `log`: <code>import("C:/Users/chris/git/archlette/src/core/logger").Logger</code>

---
##### `core__findStructurizrCLI()`

Find or download Structurizr CLI

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
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<string></code> — Path to structurizr executable/script</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/tool-manager.ts:244</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `log`: <code>import("C:/Users/chris/git/archlette/src/core/logger").Logger</code> — - Optional logger

---
##### `core__findPlantUML()`

Find or download PlantUML JAR

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
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<string></code> — Path to plantuml.jar</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/tool-manager.ts:284</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `log`: <code>import("C:/Users/chris/git/archlette/src/core/logger").Logger</code> — - Optional logger

---
##### `core__checkJava()`

Verify Java is available

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
<td><code>string</code> — Java version string if available, null otherwise</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/tool-manager.ts:313</code></td>
</tr>
</tbody>
</table>



---
##### `core__requireJava()`

Validate Java is installed (throw if not)

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
<td><code>void</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/tool-manager.ts:334</code></td>
</tr>
</tbody>
</table>



---
##### `core__resolveConfig()`

For each stage, resolve includes/excludes for each node:
  - If node omits includes/excludes, inherit from defaults.

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
<td><code>import("C:/Users/chris/git/archlette/src/core/types-aac").ResolvedAACConfig</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/types-aac.ts:139</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `raw`: <code>unknown</code>

---

</details>

---

<div align="center">
<sub><a href="./default-container.md">← Back to Container</a> | <a href="./README.md">← Back to System</a> | Generated with <a href="https://github.com/architectlabs/archlette">Archlette</a></sub>
</div>
