# basic_wrangler — Code View

[← Back to Container](./default-container.md) | [← Back to System](./README.md)

---

## Component Information

<table>
<tbody>
<tr>
<td><strong>Component</strong></td>
<td>basic_wrangler</td>
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
<td>Cloudflare Wrangler deployment extractor</td>
</tr>
</tbody>
</table>

---

## Code Structure

### Class Diagram

![Class Diagram](./diagrams/structurizr-Classes_default_container__basicwrangler.png)

### Code Elements

<details>
<summary><strong>12 code element(s)</strong></summary>

#### Functions

##### `basic_wrangler__basicWranglerExtractor()`

Extract deployment topology from Cloudflare Wrangler configuration files

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
<td><code>Promise<z.infer<any>></code> — Promise resolving to ArchletteIR with containers, deployments, and relationships</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler.ts:68</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `node`: <code>any</code> — - Configuration node with include/exclude patterns- `ctx`: <code>import("C:/Users/chris/git/archlette/src/core/types").PipelineContext</code> — - Optional pipeline context with logger
  **Examples:**

```typescript

```

---

##### `basic_wrangler__findWranglerFiles()`

Find wrangler.toml files based on include/exclude patterns

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
<td><code>Promise<string[]></code> — Array of absolute file paths to wrangler.toml files</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/file-finder.ts:15</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `inputs`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").ExtractorInputs</code> — - Optional include/exclude patterns

---

##### `basic_wrangler__mapToIR()`

Map wrangler configurations to ArchletteIR

This creates:

- Containers: One per wrangler.toml file
- Deployments: One per environment (production, dev, preview, etc.)
- Container Instances: One per container per environment
- Container Relationships: Logical dependencies from service bindings
- Deployment Relationships: Physical instance-to-instance connections

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
<td><code>z.infer<any></code> — Complete ArchletteIR</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/to-ir-mapper.ts:30</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `configs`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").WranglerConfig[]</code> — - Parsed wrangler.toml configurations- `systemInfo`: <code>z.infer<any></code> — - Optional system-level metadata

---

##### `basic_wrangler__extractContainers()`

Extract containers from wrangler configurations

Creates one container per wrangler.toml file.
Each container represents a Cloudflare Worker.

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
<td><code>{ id: string; name: string; type: string; layer: string; description: string; tags: string[]; props: { technology: string; filePath: string; }; }[]</code> — Array of Container objects</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/to-ir-mapper.ts:77</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `configs`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").WranglerConfig[]</code> — - Parsed wrangler configurations

---

##### `basic_wrangler__buildContainerDescription()`

Build a descriptive summary for a container

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
<td><code>string</code> — Description string</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/to-ir-mapper.ts:102</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `config`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").WranglerConfig</code> — - Wrangler configuration

---

##### `basic_wrangler__extractDeploymentsAndInstances()`

Extract deployments and container instances

Creates:

- One deployment per environment
- Container instances for each container in each environment

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
<td><code>{ deployments: { name: string; environment: string; platform: string; instances: z.infer<any>[]; }[]; instances: z.infer<any>[]; }</code> — Deployments and container instances</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/to-ir-mapper.ts:127</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `configs`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").WranglerConfig[]</code> — - Parsed wrangler configurations- `environments`: <code>string[]</code> — - Unique environment names

---

##### `basic_wrangler__extractContainerRelationships()`

Extract container relationships from service bindings

Creates logical dependencies between containers based on service bindings.
Deduplicates relationships across all environments.

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
<td><code>z.infer<any>[]</code> — Array of container relationships</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/to-ir-mapper.ts:271</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `configs`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").WranglerConfig[]</code> — - Parsed wrangler configurations

---

##### `basic_wrangler__extractDeploymentRelationships()`

Extract deployment relationships from container instances

Creates physical instance-to-instance relationships based on service bindings.
Each relationship represents an actual runtime dependency in a specific environment.

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
<td><code>z.infer<any>[]</code> — Array of deployment relationships</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/to-ir-mapper.ts:317</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `instances`: <code>z.infer<any>[]</code> — - Container instances

---

##### `basic_wrangler__parseWranglerFile()`

Parse a wrangler.toml file

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
<td><code>Promise<import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").WranglerConfig></code> — Parsed wrangler configuration</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/wrangler-parser.ts:27</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `filePath`: <code>string</code> — - Absolute path to wrangler.toml file

---

##### `basic_wrangler__normalizeServiceBindings()`

Normalize service bindings from various formats

Wrangler supports multiple binding formats:

- [[services]] array (TOML array of tables)
- services = [{ binding = "...", service = "..." }]

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").ServiceBinding[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/wrangler-parser.ts:83</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `services`: <code>unknown</code>

---

##### `basic_wrangler__getEnvironments()`

Get all environments from a wrangler config

Returns a list of environment names, including:

- "production" (from root-level config if it has deployable content)
- All keys from env.\* sections

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
<td><code>string[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/wrangler-parser.ts:104</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `config`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").WranglerConfig</code>

---

##### `basic_wrangler__getEnvironmentConfig()`

Get configuration for a specific environment

Merges root-level config with environment-specific overrides.
Environment config takes precedence.

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
<td><code>{ name: string; vars?: Record<string, string>; services?: import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").ServiceBinding[]; kv_namespaces?: import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").KVBinding[]; r2_buckets?: import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").R2Binding[]; d1_databases?: import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").D1Binding[]; durable_objects?: { bindings: import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").DurableObjectBinding[]; }; queues?: { producers?: import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").QueueBinding[]; consumers?: import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").QueueBinding[]; }; routes?: string[]; triggers?: { crons?: string[]; }; observability?: Record<string, unknown>; }</code> — Merged environment configuration</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/wrangler-parser.ts:145</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `config`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-wrangler/types").WranglerConfig</code> — - Parsed wrangler config- `envName`: <code>string</code> — - Environment name (e.g., "production", "development")

---

</details>

---

<div align="center">
<sub><a href="./default-container.md">← Back to Container</a> | <a href="./README.md">← Back to System</a> | Generated with <a href="https://github.com/architectlabs/archlette">Archlette</a></sub>
</div>
