# 🏗️ @chrislyons-dev/archlette

> **Architecture Documentation**
> Generated on 2025-10-17 08:41:12

## 📋 Overview

Architecture-as-Code toolkit for automated diagrams, docs, and releases.

---

## 📐 System Architecture

### System Context

The system context diagram shows how @chrislyons-dev/archlette fits into its environment, including external systems and users.

![System Context Diagram](./diagrams/structurizr-SystemContext.png)

---

## 🏢 Containers

The container diagram shows the high-level technology choices and how containers communicate.

![Container Diagram](./diagrams/structurizr-Containers.png)

<table>
<thead>
<tr>
<th>Container</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>@chrislyons-dev/archlette</strong></td>
<td><code>Application</code></td>
<td>Architecture-as-Code toolkit for automated diagrams, docs, and releases.</td>
</tr>
</tbody>
</table>


---

## 🧩 Components

The component diagram shows the internal structure of containers and their responsibilities.

![Component Diagram](./diagrams/structurizr-Components__chrislyons_dev_archlette.png)

<table>
<thead>
<tr>
<th>Component</th>
<th>Container</th>
<th>Type</th>
<th>Description</th>
<th>Details</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>CLI</strong></td>
<td>default-container</td>
<td><code>module</code></td>
<td>Archlette CLI - Architecture-as-Code toolkit</td>
<td><a href="./cli.md">View →</a></td>
</tr>
<tr>
<td><strong>extractors</strong></td>
<td>default-container</td>
<td><code>module</code></td>
<td>ArchletteIR aggregation utilities | Extraction stage of the AAC pipeline | TypeScript/JavaScript code extractor</td>
<td><a href="./extractors.md">View →</a></td>
</tr>
<tr>
<td><strong>validators</strong></td>
<td>default-container</td>
<td><code>module</code></td>
<td>Validation stage of the AAC pipeline | Base IR validator for Archlette pipeline</td>
<td><a href="./validators.md">View →</a></td>
</tr>
<tr>
<td><strong>generators</strong></td>
<td>default-container</td>
<td><code>module</code></td>
<td>Generation stage of the AAC pipeline | Structurizr DSL Generator</td>
<td><a href="./generators.md">View →</a></td>
</tr>
<tr>
<td><strong>renderers</strong></td>
<td>default-container</td>
<td><code>module</code></td>
<td>Render stage of the AAC pipeline | PlantUML image renderer | Structurizr DSL export renderer</td>
<td><a href="./renderers.md">View →</a></td>
</tr>
<tr>
<td><strong>docs</strong></td>
<td>default-container</td>
<td><code>module</code></td>
<td>Documentation stage of the AAC pipeline | Markdown documentation generator</td>
<td><a href="./docs.md">View →</a></td>
</tr>
<tr>
<td><strong>core</strong></td>
<td>default-container</td>
<td><code>module</code></td>
<td>Dynamic ESM module loader | Stage module interfaces for the AAC pipeline | Stage module loaders | Tool management for external rendering tools | Architecture-as-Code (AAC) configuration types and schemas | Archlette Intermediate Representation (IR) types and schemas | Core pipeline types</td>
<td><a href="./core.md">View →</a></td>
</tr>
</tbody>
</table>


---

## 👥 Actors

<table>
<thead>
<tr>
<th>Actor</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>User</strong></td>
<td><code>Person</code></td>
<td>End user who runs archlette commands</td>
</tr>
<tr>
<td><strong>FileSystem</strong></td>
<td><code>System</code></td>
<td>File system for reading and writing files</td>
</tr>
<tr>
<td><strong>Github Structurizr Repo</strong></td>
<td><code>System</code></td>
<td>The github repo hosting the Structurizr CLI releases. https://github.com/structurizr/cli/releases/download/v${TOOL_VERSIONS.structurizr}/structurizr-cli.zip</td>
</tr>
<tr>
<td><strong>Github PlantUML Repo</strong></td>
<td><code>System</code></td>
<td>The github repo hosting the PlantUML CLI releases. https://github.com/plantuml/plantuml/releases/download/v${TOOL_VERSIONS.plantuml}/plantuml-${TOOL_VERSIONS.plantuml}.jar</td>
</tr>
<tr>
<td><strong>Local System's unzip utility</strong></td>
<td><code>System</code></td>
<td>The zip extraction utility on the local system (unzip on Unix, Expand-Archive on Windows).</td>
</tr>
<tr>
<td><strong>File System</strong></td>
<td><code>System</code></td>
<td>The local file system for caching downloaded tools.</td>
</tr>
</tbody>
</table>


---

## 📚 Component Reference

Quick navigation to detailed component documentation:

- **[CLI](./cli.md)** — Archlette CLI - Architecture-as-Code toolkit
- **[extractors](./extractors.md)** — ArchletteIR aggregation utilities | Extraction stage of the AAC pipeline | TypeScript/JavaScript code extractor
- **[validators](./validators.md)** — Validation stage of the AAC pipeline | Base IR validator for Archlette pipeline
- **[generators](./generators.md)** — Generation stage of the AAC pipeline | Structurizr DSL Generator
- **[renderers](./renderers.md)** — Render stage of the AAC pipeline | PlantUML image renderer | Structurizr DSL export renderer
- **[docs](./docs.md)** — Documentation stage of the AAC pipeline | Markdown documentation generator
- **[core](./core.md)** — Dynamic ESM module loader | Stage module interfaces for the AAC pipeline | Stage module loaders | Tool management for external rendering tools | Architecture-as-Code (AAC) configuration types and schemas | Archlette Intermediate Representation (IR) types and schemas | Core pipeline types

---

<div align="center">
<sub>Generated with <a href="https://github.com/architectlabs/archlette">Archlette</a> Architecture-as-Code toolkit</sub>
</div>
