# 🧩 docs

[← Back to System Overview](./README.md)

---

## 📋 Component Information

<table>
<tbody>
<tr>
<td><strong>Container</strong></td>
<td>@chrislyons-dev/archlette</td>
</tr>
<tr>
<td><strong>Type</strong></td>
<td><code>module</code></td>
</tr>
<tr>
<td><strong>Description</strong></td>
<td>Documentation stage of the AAC pipeline</td>
</tr>
</tbody>
</table>

---

## 🏗️ Component Architecture

![Component Diagram](../diagrams/structurizr-Components__chrislyons_dev_archlette-key.png)
![Component Diagram](../diagrams/structurizr-Components__chrislyons_dev_archlette.png)

---

## 💻 Code Structure

### Class Diagram

![Class Diagram](../diagrams/structurizr-Classes_docs-key.png)
![Class Diagram](../diagrams/structurizr-Classes_docs.png)

### Code Elements

<details>
<summary><strong>5 code element(s)</strong></summary>



#### Functions

##### `run()`

Execute the documentation stage

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
<td><code>Promise<void></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/5-docs/index.ts:35</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `ctx`: <code>import("C:/Users/chris/git/archlette/src/core/types").PipelineContext</code>

---
##### `markdownDocs()`

Generate markdown documentation

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
<td><code>Promise<void></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/docs/builtin/markdown-docs.ts:33</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `ctx`: <code>import("C:/Users/chris/git/archlette/src/core/types").PipelineContext</code>

---
##### `findDiagramsForView()`

Find diagram files for a specific view type

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
<td><code>string[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/docs/builtin/markdown-docs.ts:195</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `rendererOutputs`: <code>any[]</code>- `diagramsDir`: <code>string</code>- `docsDir`: <code>string</code>- `viewType`: <code>string</code>

---
##### `findDiagramsForComponent()`

Find component diagrams for a specific component

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
<td><code>string[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/docs/builtin/markdown-docs.ts:223</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `rendererOutputs`: <code>any[]</code>- `diagramsDir`: <code>string</code>- `docsDir`: <code>string</code>- `_component`: <code>z.infer<any></code>

---
##### `findClassDiagramsForComponent()`

Find class diagrams for a specific component

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
<td><code>string[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/docs/builtin/markdown-docs.ts:252</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `rendererOutputs`: <code>any[]</code>- `diagramsDir`: <code>string</code>- `docsDir`: <code>string</code>- `component`: <code>z.infer<any></code>

---

</details>

---

<div align="center">
<sub><a href="./README.md">← Back to System Overview</a> | Generated with <a href="https://github.com/architectlabs/archlette">Archlette</a></sub>
</div>
