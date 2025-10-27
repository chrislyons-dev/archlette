# basic-python — Code View

[← Back to Container](./default-container.md) | [← Back to System](./README.md)

---

## Component Information

<table>
<tbody>
<tr>
<td><strong>Component</strong></td>
<td>basic-python</td>
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
<td>Basic Python Extractor for Archlette
Extracts architecture information from Python source code</td>
</tr>
</tbody>
</table>

---

## Code Structure

### Class Diagram

![Class Diagram](./diagrams/structurizr-Classes_default_container__basic_python.png)

### Code Elements

<details>
<summary><strong>28 code element(s)</strong></summary>



#### Functions

##### `createEmptyIR()`

Create empty IR when no files found

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
<td><code>z.infer<any></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python.ts:150</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `systemName`: <code>string</code>

---
##### `basicPython()`

Basic Python extractor
Analyzes Python source code and extracts architectural components

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
<td><code>Promise<z.infer<any>></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python.ts:26</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `node`: <code>any</code>- `ctx`: <code>import("C:/Users/chris/git/archlette/src/core/types").PipelineContext</code>

---
##### `findSourceFiles()`

Find source files matching include/exclude patterns

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
<td><code>Promise<string[]></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-finder.ts:26</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `inputs`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").ExtractorInputs</code>

---
##### `findPyProjectFiles()`

Find pyproject.toml files within the search paths

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
<td><code>Promise<string[]></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-finder.ts:42</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `inputs`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").ExtractorInputs</code>

---
##### `readPyProjectInfo()`

Read and parse pyproject.toml file

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
<td><code>Promise<import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-finder").PyProjectInfo></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-finder.ts:91</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `filePath`: <code>string</code>

---
##### `parsePyProjectToml()`

Parse pyproject.toml using smol-toml library
Handles full TOML spec including multiline strings, arrays, and nested tables

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
<td><code>PyProjectToml</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-finder.ts:142</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `content`: <code>string</code>

---
##### `findNearestPyProject()`

Find the nearest parent pyproject.toml for a given file

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-finder").PyProjectInfo</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-finder.ts:156</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `filePath`: <code>string</code>- `pyprojects`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-finder").PyProjectInfo[]</code>

---
##### `parseFiles()`

Parse Python files using Python AST parser script

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
<td><code>Promise<import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").FileExtraction[]></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-parser.ts:29</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `filePaths`: <code>string[]</code>- `pythonPath`: <code>string</code>

---
##### `runPythonParser()`

Run Python parser script and return JSON output

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
<td><code>Promise<string></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-parser.ts:95</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `scriptPath`: <code>string</code>- `filePaths`: <code>string[]</code>- `pythonPath`: <code>string</code>

---
##### `mapToFileExtraction()`

Map Python parser output to FileExtraction format

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").FileExtraction</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-parser.ts:187</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `file`: <code>{ filePath: string; component?: { name: string; description?: string; }; actors: { name: string; type: "Person" | "System"; direction?: "in" | "out" | "both"; description?: string; }[]; relationships: { target: string; description?: string; }[]; classes: { name: string; baseClasses: string[]; decorators: string[]; decoratorDetails: import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").DecoratorInfo[]; line: number; docstring?: string; methods: { name: string; isStatic: boolean; isAsync: boolean; isClassMethod: boolean; isAbstract: boolean; decorators: string[]; decoratorDetails: import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").DecoratorInfo[]; line: number; docstring?: string; parsedDoc?: { summary?: string; description?: string; args?: { name: string; type?: string; description?: string; }[]; returns?: { type?: string; description?: string; }; raises?: { type: string; description?: string; }[]; examples?: string; }; parameters: { name: string; annotation?: string; default?: string; }[]; returnAnnotation?: string; }[]; properties: { name: string; type?: "property" | "class_variable"; annotation?: string; default?: string; line: number; docstring?: string; isReadonly?: boolean; hasGetter?: boolean; hasSetter?: boolean; hasDeleter?: boolean; }[]; }[]; functions: { name: string; isAsync: boolean; decorators: string[]; decoratorDetails: import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").DecoratorInfo[]; line: number; docstring?: string; parsedDoc?: { summary?: string; description?: string; args?: { name: string; type?: string; description?: string; }[]; returns?: { type?: string; description?: string; }; raises?: { type: string; description?: string; }[]; examples?: string; }; parameters: { name: string; annotation?: string; default?: string; }[]; returnAnnotation?: string; }[]; types: { name: string; category: "TypeAlias" | "TypedDict" | "Protocol" | "Enum" | "NewType"; line: number; definition?: string; docstring?: string; }[]; imports: { source: string; names: string[]; isRelative: boolean; level?: number; category: "stdlib" | "third_party" | "local"; }[]; parseError?: string; }</code>

---
##### `mapClass()`

Map Python class to ExtractedClass

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").ExtractedClass</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-parser.ts:254</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `cls`: <code>{ name: string; baseClasses: string[]; decorators: string[]; decoratorDetails: import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").DecoratorInfo[]; line: number; docstring?: string; methods: { name: string; isStatic: boolean; isAsync: boolean; isClassMethod: boolean; isAbstract: boolean; decorators: string[]; decoratorDetails: import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").DecoratorInfo[]; line: number; docstring?: string; parsedDoc?: { summary?: string; description?: string; args?: { name: string; type?: string; description?: string; }[]; returns?: { type?: string; description?: string; }; raises?: { type: string; description?: string; }[]; examples?: string; }; parameters: { name: string; annotation?: string; default?: string; }[]; returnAnnotation?: string; }[]; properties: { name: string; type?: "property" | "class_variable"; annotation?: string; default?: string; line: number; docstring?: string; isReadonly?: boolean; hasGetter?: boolean; hasSetter?: boolean; hasDeleter?: boolean; }[]; }</code>- `filePath`: <code>string</code>

---
##### `mapMethod()`

Map Python method to ExtractedMethod

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").ExtractedMethod</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-parser.ts:279</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `method`: <code>{ name: string; isStatic: boolean; isAsync: boolean; isClassMethod: boolean; isAbstract: boolean; decorators: string[]; decoratorDetails: import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").DecoratorInfo[]; line: number; docstring?: string; parsedDoc?: { summary?: string; description?: string; args?: { name: string; type?: string; description?: string; }[]; returns?: { type?: string; description?: string; }; raises?: { type: string; description?: string; }[]; examples?: string; }; parameters: { name: string; annotation?: string; default?: string; }[]; returnAnnotation?: string; }</code>- `filePath`: <code>string</code>

---
##### `mapProperty()`

Map Python property to ExtractedProperty

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").ExtractedProperty</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-parser.ts:314</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `prop`: <code>{ name: string; type?: "property" | "class_variable"; annotation?: string; default?: string; line: number; docstring?: string; isReadonly?: boolean; hasGetter?: boolean; hasSetter?: boolean; hasDeleter?: boolean; }</code>- `filePath`: <code>string</code>

---
##### `mapFunction()`

Map Python function to ExtractedFunction

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").ExtractedFunction</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-parser.ts:344</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `func`: <code>{ name: string; isAsync: boolean; decorators: string[]; decoratorDetails: import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").DecoratorInfo[]; line: number; docstring?: string; parsedDoc?: { summary?: string; description?: string; args?: { name: string; type?: string; description?: string; }[]; returns?: { type?: string; description?: string; }; raises?: { type: string; description?: string; }[]; examples?: string; }; parameters: { name: string; annotation?: string; default?: string; }[]; returnAnnotation?: string; }</code>- `filePath`: <code>string</code>

---
##### `mapType()`

Map Python type definition to ExtractedType

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").ExtractedType</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-parser.ts:373</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `type`: <code>{ name: string; category: "TypeAlias" | "TypedDict" | "Protocol" | "Enum" | "NewType"; line: number; definition?: string; docstring?: string; }</code>- `filePath`: <code>string</code>

---
##### `mapParameter()`

Map Python parameter to ParameterInfo

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").ParameterInfo</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-parser.ts:395</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `param`: <code>{ name: string; annotation?: string; default?: string; }</code>- `parsedParam`: <code>{ name: string; type?: string; description?: string; }</code>

---
##### `parseDocstring()`

Parse Python docstring into DocInfo
Enhanced in Phase 2 to use parsed Google/NumPy/Sphinx docstrings

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").DocInfo</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-parser.ts:412</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `docstring`: <code>string</code>- `parsedDoc`: <code>{ summary?: string; description?: string; args?: { name: string; type?: string; description?: string; }[]; returns?: { type?: string; description?: string; }; raises?: { type: string; description?: string; }[]; examples?: string; }</code>

---
##### `extractDeprecation()`

Extract deprecation info from docstring

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
<td><code>{ reason?: string; alternative?: string; }</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-parser.ts:448</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `docstring`: <code>string</code>

---
##### `extractReturnDescription()`

Extract return description from docstring

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-parser.ts:464</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `docstring`: <code>string</code>

---
##### `getVisibility()`

Determine visibility from Python name convention
- __name: private
- _name: protected
- name: public

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
<td><code>"public" | "private" | "protected"</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-parser.ts:477</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `name`: <code>string</code>

---
##### `mapToIR()`

Map file extractions to ArchletteIR

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
<td><code>z.infer<any></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/to-ir-mapper.ts:43</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `extractions`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").FileExtraction[]</code>- `pyprojects`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/file-finder").PyProjectInfo[]</code>- `systemInfo`: <code>SystemInfo</code>

---
##### `mapActorToIR()`

Map ActorInfo to Actor

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
<td><code>z.infer<any></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/to-ir-mapper.ts:274</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `actor`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").ActorInfo</code>- `actorTargets`: <code>Map<string, string[]></code>

---
##### `mapRelationshipsToIR()`

Map relationships to Relationship[]
Creates bidirectional actor relationships

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
<td><code>z.infer<any>[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/to-ir-mapper.ts:288</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `relationships`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").RelationshipInfo[]</code>- `componentMap`: <code>Map<string, z.infer<any>></code>- `actorMap`: <code>Map<string, import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").ActorInfo></code>- `actorTargets`: <code>Map<string, string[]></code>

---
##### `deduplicateRelationships()`

Deduplicate relationships by source+destination

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
<td><code>z.infer<any>[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/to-ir-mapper.ts:335</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `relationships`: <code>z.infer<any>[]</code>

---
##### `mapClassToCodeItem()`

Map ExtractedClass to CodeItem

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
<td><code>z.infer<any></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/to-ir-mapper.ts:350</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `cls`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").ExtractedClass</code>- `componentId`: <code>string</code>

---
##### `mapMethodToCodeItem()`

Map ExtractedMethod to CodeItem

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
<td><code>z.infer<any></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/to-ir-mapper.ts:375</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `method`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").ExtractedMethod</code>- `className`: <code>string</code>- `componentId`: <code>string</code>

---
##### `mapFunctionToCodeItem()`

Map ExtractedFunction to CodeItem

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
<td><code>z.infer<any></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/to-ir-mapper.ts:410</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `func`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").ExtractedFunction</code>- `componentId`: <code>string</code>

---
##### `mapTypeToCodeItem()`

Map ExtractedType to CodeItem

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
<td><code>z.infer<any></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/to-ir-mapper.ts:441</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `type`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-python/types").ExtractedType</code>- `componentId`: <code>string</code>

---

</details>

---

<div align="center">
<sub><a href="./default-container.md">← Back to Container</a> | <a href="./README.md">← Back to System</a> | Generated with <a href="https://github.com/architectlabs/archlette">Archlette</a></sub>
</div>
