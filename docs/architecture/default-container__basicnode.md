# basic_node

[← Back to System Overview](./README.md)

---

## Component Information

<table>
<tbody>
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
<td>TypeScript/JavaScript code extractor</td>
</tr>
</tbody>
</table>

---

## Architecture

![Component Diagram](./diagrams/structurizr-Components_Application.png)

---

## Code Structure

### Class Diagram

![Class Diagram](./diagrams/structurizr-Classes_default_container__basicnode.png)

### Code Elements

<details>
<summary><strong>42 code element(s)</strong></summary>



#### Functions

##### `basic_node__basicNodeExtractor()`

Extract architecture information from a Node.js/TypeScript codebase

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
<td><code>Promise<z.infer<any>></code> — Promise resolving to ArchletteIR with code, components, and relationships</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node.ts:72</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `node`: <code>any</code> — - Configuration node with include/exclude patterns- `ctx`: <code>import("C:/Users/chris/git/archlette/src/core/types").PipelineContext</code> — - Optional pipeline context with logger
**Examples:**
```typescript

```

---
##### `basic_node__extractClasses()`

Extract all class declarations from a source file

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedClass[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/class-extractor.ts:32</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `sourceFile`: <code>SourceFile</code>

---
##### `basic_node__extractClass()`

Extract information from a single class declaration

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedClass</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/class-extractor.ts:53</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `cls`: <code>ClassDeclaration</code>- `filePath`: <code>string</code>

---
##### `basic_node__extractMethod()`

Extract method information from a class

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedMethod</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/class-extractor.ts:92</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `method`: <code>MethodDeclaration</code>- `filePath`: <code>string</code>

---
##### `basic_node__extractProperty()`

Extract property information from a class

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedProperty</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/class-extractor.ts:121</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `prop`: <code>PropertyDeclaration</code>- `filePath`: <code>string</code>

---
##### `basic_node__extractMethodParameter()`

Extract parameter information

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ParameterInfo</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/class-extractor.ts:147</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `param`: <code>any</code>- `descriptions`: <code>Map<string, string></code>

---
##### `basic_node__mapVisibility()`

Map ts-morph Scope to our visibility string

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/class-extractor.ts:168</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `scope`: <code>any</code>

---
##### `basic_node__getFileJsDocs()`

Get JSDoc comments from a source file
Checks both the first statement and module-level JSDoc

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
<td><code>Node[]</code> — Array of JSDoc nodes (empty if none found)</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector.ts:37</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `sourceFile`: <code>SourceFile</code> — - TypeScript source file to extract JSDoc from

---
##### `basic_node__extractFileComponent()`

Extract component information from file-level JSDoc
Checks the first JSDoc comment in the file for

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector").ComponentInfo</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector.ts:54</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `sourceFile`: <code>SourceFile</code>

---
##### `basic_node__extractFileActors()`

Extract actors from file-level JSDoc
Looks for

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector").ActorInfo[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector.ts:73</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `sourceFile`: <code>SourceFile</code>

---
##### `basic_node__extractFileRelationships()`

Extract relationships from file-level JSDoc
Looks for

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector").RelationshipInfo[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector.ts:92</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `sourceFile`: <code>SourceFile</code>

---
##### `basic_node__extractComponentFromJsDoc()`

Extract component info from a JSDoc node

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector").ComponentInfo</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector.ts:108</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `jsDoc`: <code>Node</code>

---
##### `basic_node__extractActorsFromJsDoc()`

Extract actors from a JSDoc node
Parses

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector").ActorInfo[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector.ts:139</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `jsDoc`: <code>Node</code>

---
##### `basic_node__parseActorTag()`

Parse an

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector").ActorInfo</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector.ts:170</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `tag`: <code>JSDocTag</code>

---
##### `basic_node__extractRelationshipsFromJsDoc()`

Extract relationships from a JSDoc node
Parses

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector").RelationshipInfo[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector.ts:207</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `jsDoc`: <code>Node</code>

---
##### `basic_node__parseUsesTag()`

Parse a

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector").RelationshipInfo</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector.ts:234</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `tag`: <code>JSDocTag</code>

---
##### `basic_node__extractComponentName()`

Extract component name from a JSDoc tag
Handles formats like:
-

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/component-detector.ts:265</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `tag`: <code>JSDocTag</code>

---
##### `basic_node__extractDocumentation()`

Extract documentation information from JSDoc

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").DocInfo</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/doc-extractor.ts:13</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `jsDocs`: <code>JSDoc[]</code>

---
##### `basic_node__extractDeprecation()`

Extract deprecation information from JSDoc

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").DeprecationInfo</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/doc-extractor.ts:64</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `jsDocs`: <code>JSDoc[]</code>

---
##### `basic_node__extractParameterDescriptions()`

Extract parameter descriptions from JSDoc

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
<td><code>Map<string, string></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/doc-extractor.ts:93</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `jsDocs`: <code>JSDoc[]</code>

---
##### `basic_node__extractReturnDescription()`

Extract return description from JSDoc

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/doc-extractor.ts:116</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `jsDocs`: <code>JSDoc[]</code>

---
##### `basic_node__extractParameterName()`

Extract parameter name from

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/doc-extractor.ts:131</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `tag`: <code>JSDocTag</code> — Handles formats like:

---
##### `basic_node__findSourceFiles()`

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/file-finder.ts:32</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `inputs`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractorInputs</code>

---
##### `basic_node__findPackageJsonFiles()`

Find package.json files within the search paths

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/file-finder.ts:48</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `inputs`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractorInputs</code>

---
##### `basic_node__readPackageInfo()`

Read and parse package.json file

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
<td><code>Promise<import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").PackageInfo></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/file-finder.ts:86</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `filePath`: <code>string</code>

---
##### `basic_node__findNearestPackage()`

Find the nearest parent package.json for a given file

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").PackageInfo</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/file-finder.ts:110</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `filePath`: <code>string</code>- `packages`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").PackageInfo[]</code>

---
##### `basic_node__parseFiles()`

Parse and extract information from source files

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
<td><code>Promise<import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").FileExtraction[]></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/file-parser.ts:24</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `filePaths`: <code>string[]</code>

---
##### `basic_node__extractFunctions()`

Extract all function declarations from a source file

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedFunction[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/function-extractor.ts:21</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `sourceFile`: <code>SourceFile</code>

---
##### `basic_node__extractFunction()`

Extract information from a single function declaration

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedFunction</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/function-extractor.ts:44</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `func`: <code>FunctionDeclaration</code>- `filePath`: <code>string</code>

---
##### `basic_node__extractFunctionParameter()`

Extract parameter information

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ParameterInfo</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/function-extractor.ts:80</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `param`: <code>any</code>- `descriptions`: <code>Map<string, string></code>

---
##### `basic_node__extractArrowFunctions()`

Extract arrow functions assigned to const/let/var
Examples:
  const handleClick = () => {}
  export const createUser = async (data) => {}

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedFunction[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/function-extractor.ts:104</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `sourceFile`: <code>SourceFile</code>

---
##### `basic_node__extractImports()`

Extract all import declarations from a source file

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedImport[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/import-extractor.ts:15</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `sourceFile`: <code>SourceFile</code>

---
##### `basic_node__mapToIR()`

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/to-ir-mapper.ts:34</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `extractions`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").FileExtraction[]</code>- `packages`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").PackageInfo[]</code>- `systemInfo`: <code>z.infer<any></code>

---
##### `basic_node__deduplicateRelationships()`

Deduplicate relationships by source+destination+stereotype combination
First occurrence wins - preserves description from first relationship
This allows multiple relationships between the same elements with different stereotypes

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/to-ir-mapper.ts:358</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `relationships`: <code>z.infer<any>[]</code>

---
##### `basic_node__mapFunction()`

Map a function to a CodeItem

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/to-ir-mapper.ts:372</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `func`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedFunction</code>- `filePath`: <code>string</code>- `componentId`: <code>string</code>

---
##### `basic_node__mapClass()`

Map a class to a CodeItem

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/to-ir-mapper.ts:400</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `cls`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedClass</code>- `filePath`: <code>string</code>- `componentId`: <code>string</code>

---
##### `basic_node__mapMethod()`

Map a class method to a CodeItem

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/to-ir-mapper.ts:429</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `method`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedMethod</code>- `className`: <code>string</code>- `filePath`: <code>string</code>- `componentId`: <code>string</code>

---
##### `basic_node__mapImportRelationships()`

Map imports to relationships

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/to-ir-mapper.ts:463</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `imp`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedImport</code>- `filePath`: <code>string</code>

---
##### `basic_node__generateId()`

Generate a unique ID for a code element
Format: filePath:symbolName

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/to-ir-mapper.ts:486</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `filePath`: <code>string</code>- `symbolName`: <code>string</code>

---
##### `basic_node__getDefaultSystem()`

Get default system info from package.json if available

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/to-ir-mapper.ts:495</code></td>
</tr>
</tbody>
</table>



---
##### `basic_node__extractTypeAliases()`

Extract type aliases from a source file
Examples:
  type UserRole = 'admin' | 'user' | 'guest'
  export type ApiResponse<T> = { data: T; status: number }

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedType[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/type-extractor.ts:19</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `sourceFile`: <code>SourceFile</code>

---
##### `basic_node__extractInterfaces()`

Extract interfaces from a source file
Examples:
  interface User { id: string; name: string }
  export interface ApiClient { get<T>(url: string): Promise<T> }

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedInterface[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/type-extractor.ts:59</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `sourceFile`: <code>SourceFile</code>

---

</details>

---

<div align="center">
<sub><a href="./README.md">← Back to System Overview</a> | Generated with <a href="https://github.com/architectlabs/archlette">Archlette</a></sub>
</div>
