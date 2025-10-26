# core/path — Code View

[← Back to Container](./default-container.md) | [← Back to System](./README.md)

---

## Component Information

<table>
<tbody>
<tr>
<td><strong>Component</strong></td>
<td>core/path</td>
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

![Class Diagram](./diagrams/structurizr-Classes_default_container__core_path.png)

### Code Elements

<details>
<summary><strong>4 code element(s)</strong></summary>



#### Functions

##### `validatePathSecurity()`

Validate path for security issues

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
<td><code>{ isSecure: boolean; warnings: string[]; }</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/path-security.ts:58</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `userPath`: <code>string</code>- `resolvedPath`: <code>string</code>- `baseDir`: <code>string</code>- `strategy`: <code>import("C:/Users/chris/git/archlette/src/core/path-security").PathResolutionStrategy</code>- `allowedAbsolutePaths`: <code>string[]</code>

---
##### `resolveSecurePath()`

Securely resolve a user-provided path with validation

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
<td><code>import("C:/Users/chris/git/archlette/src/core/path-security").ResolvedSecurePath</code> — Resolved path with security metadata</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/path-security.ts:203</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `userPath`: <code>string</code> — - Path provided by user (from config, CLI, etc.)- `options`: <code>import("C:/Users/chris/git/archlette/src/core/path-security").SecurePathOptions</code> — - Resolution and validation options
**Examples:**
```typescript

```

---
##### `resolveUserContentPath()`

Convenience function for resolving user content paths (themes, input files)
Uses 'config-relative' strategy by default

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
<td><code>import("C:/Users/chris/git/archlette/src/core/path-security").ResolvedSecurePath</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/path-security.ts:289</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `userPath`: <code>string</code>- `configBaseDir`: <code>string</code>- `allowedExtensions`: <code>string[]</code>- `allowedAbsolutePaths`: <code>string[]</code>

---
##### `resolvePluginPath()`

Convenience function for resolving plugin paths
Uses 'cli-relative' strategy by default

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
<td><code>import("C:/Users/chris/git/archlette/src/core/path-security").ResolvedSecurePath</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/core/path-security.ts:308</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `userPath`: <code>string</code>- `cliDir`: <code>string</code>- `allowedExtensions`: <code>string[]</code>- `allowedAbsolutePaths`: <code>string[]</code>

---

</details>

---

<div align="center">
<sub><a href="./default-container.md">← Back to Container</a> | <a href="./README.md">← Back to System</a> | Generated with <a href="https://github.com/architectlabs/archlette">Archlette</a></sub>
</div>
