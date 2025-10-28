# basic-astro — Code View

[← Back to Container](./default-container.md) | [← Back to System](./README.md)

---

## Component Information

<table>
<tbody>
<tr>
<td><strong>Component</strong></td>
<td>basic-astro</td>
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
<td>Astro component extractor</td>
</tr>
</tbody>
</table>

---

## Code Structure

### Class Diagram

![Class Diagram](./diagrams/structurizr-Classes_default_container__basic_astro.png)

### Code Elements

<details>
<summary><strong>25 code element(s)</strong></summary>



#### Functions

##### `basicAstroExtractor()`

Extract architecture information from an Astro codebase

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
<td><code>Promise<z.infer<any>></code> — Promise resolving to ArchletteIR with components, code, and relationships</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro.ts:71</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `node`: <code>any</code> — - Configuration node with include/exclude patterns- `ctx`: <code>import("C:/Users/chris/git/archlette/src/core/types").PipelineContext</code> — - Pipeline context with logger and config
**Examples:**
```typescript

```

---
##### `extractCodeFromFrontmatter()`

Extract TypeScript/JavaScript code from Astro frontmatter

Parses the frontmatter section (code between --- markers) as TypeScript
and extracts code elements using the basic-node AST extractors:
- Classes and their methods
- Functions (both regular and arrow functions)
- Type aliases (type X = ...)
- TypeScript interfaces

Returns empty result if frontmatter is empty or parsing fails (errors are logged).
Graceful error handling ensures one malformed Astro file doesn't break the extraction pipeline.

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/code-extractor").CodeExtractionResult</code> — CodeExtractionResult with extracted classes, functions, types, and interfaces</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/code-extractor.ts:61</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `frontmatter`: <code>string</code> — - The frontmatter code (TypeScript/JavaScript between --- markers)- `filePath`: <code>string</code> — - Original Astro file path (used for error reporting and virtual TS path)
**Examples:**
```typescript

```

---
##### `createSyntheticRenderFunction()`

Create a synthetic render function for an Astro component

Every Astro component is fundamentally a server-side render function that:
1. Receives props (if Props interface is defined)
2. Processes the component logic (frontmatter code)
3. Renders the template to HTML
4. Returns an HTML string

Since Astro's compiler doesn't explicitly define this, we create a synthetic function
to represent the component's executable behavior in the IR.

The function is named after the file (without .astro extension):
- Button.astro → function Button()
- index.astro → function index()
- settings/Profile.astro → function Profile()

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedFunction</code> — Synthetic ExtractedFunction representing the component's render behavior</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/code-extractor.ts:153</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `filePath`: <code>string</code> — - Absolute path to the Astro file- `interfaces`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedInterface[]</code> — - Extracted interfaces from frontmatter (used to detect Props interface)
**Examples:**
```typescript

```

---
##### `extractJSDocBlocks()`

Extract all JSDoc comment blocks from source code
Matches /** ... *\/ style comments and parses their tags

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
<td><code>JSDocBlock[]</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/component-detector.ts:27</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `source`: <code>string</code>

---
##### `parseJSDocBlock()`

Parse a single JSDoc comment block into description and tags

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
<td><code>JSDocBlock</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/component-detector.ts:49</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `comment`: <code>string</code>

---
##### `extractFileComponent()`

Extract component information from frontmatter JSDoc

Attempts to identify the component in this file using JSDoc tags:
1. Checks for

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/types").ComponentInfo</code> — ComponentInfo with id, name, and optional description, or undefined</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/component-detector.ts:118</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `frontmatter`: <code>string</code> — - TypeScript/JavaScript code from frontmatter section- `filePath`: <code>string</code> — - Absolute path to the Astro file (used for inference)
**Examples:**
```typescript

```

---
##### `extractComponentName()`

Extract component name from a JSDoc tag value

Parses the tag value to extract the component name, handling various formats:
- Simple name: ComponentName
- With description: ComponentName - Description
- Module path: path/to/module (extracts last directory component)
- Dashes preserved: My-Component-Name

For module paths like "utils/helpers", extracts "utils" (the last directory
before the filename) to enable component grouping.

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
<td><code>string</code> — Extracted component name, or undefined if value is empty</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/component-detector.ts:191</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `value`: <code>string</code> — - The JSDoc tag value (text after
**Examples:**
```typescript

```

---
##### `extractFileActors()`

Extract actors from frontmatter JSDoc

Identifies external actors (users, systems) that interact with the component.
Actors are specified using

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/types").ActorInfo[]</code> — Array of identified actors, or empty array if none found</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/component-detector.ts:250</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `frontmatter`: <code>string</code> — - TypeScript/JavaScript code from frontmatter
**Examples:**
```typescript

```

---
##### `parseActorTag()`

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/types").ActorInfo</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/component-detector.ts:277</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `value`: <code>string</code>

---
##### `extractFileRelationships()`

Extract relationships from frontmatter JSDoc

Identifies component dependencies using

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/types").RelationshipInfo[]</code> — Array of identified relationships, or empty array if none found</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/component-detector.ts:333</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `frontmatter`: <code>string</code> — - TypeScript/JavaScript code from frontmatter
**Examples:**
```typescript

```

---
##### `parseUsesTag()`

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/types").RelationshipInfo</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/component-detector.ts:357</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `value`: <code>string</code>

---
##### `inferComponentFromPath()`

Infer component name from file path

When no explicit

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/types").ComponentInfo</code> — ComponentInfo with inferred component name</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/component-detector.ts:400</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `filePath`: <code>string</code> — - Absolute path to the Astro file
**Examples:**
```typescript

```

---
##### `findSourceFiles()`

Find Astro source files matching the given patterns

Locates all .astro files in the workspace using glob patterns.
Returns absolute paths to enable downstream processing.

Default patterns include src directory and exclude node_modules, dist, build, and .astro.

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
<td><code>Promise<string[]></code> — Promise resolving to array of absolute file paths</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/file-finder.ts:39</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `options`: <code>{ include?: string[]; exclude?: string[]; }</code> — - Configuration object
**Examples:**
```typescript

```

---
##### `findPackageJsonFiles()`

Find all package.json files in the workspace

Extracts base directories from include patterns and searches multiple directory levels
to locate all package.json files. Useful for identifying container boundaries and
package metadata (name, version, description).

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
<td><code>Promise<string[]></code> — Promise resolving to array of absolute paths to package.json files</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/file-finder.ts:73</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `options`: <code>{ include?: string[]; exclude?: string[]; }</code> — - Configuration object
**Examples:**
```typescript

```

---
##### `readPackageInfo()`

Read package.json and extract metadata

Parses a package.json file and extracts key metadata fields: name, version, and description.
Returns null on read or parse errors (logged as warnings).

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
<td><code>Promise<import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/types").PackageInfo></code> — Promise resolving to PackageInfo object or null on error</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/file-finder.ts:134</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `filePath`: <code>string</code> — - Absolute path to package.json file
**Examples:**
```typescript

```

---
##### `findNearestPackage()`

Find the nearest package.json for a given file

Searches through all known packages and finds the one whose directory is the closest
parent of the given file. Packages are sorted by depth (deepest first) to prioritize
monorepo sub-packages over workspace root packages.

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/types").PackageInfo</code> — The closest parent package, or null if file is not within any package</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/file-finder.ts:172</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `filePath`: <code>string</code> — - Absolute path to the file- `packages`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/types").PackageInfo[]</code> — - Array of discovered package.json metadata objects
**Examples:**
```typescript

```

---
##### `parseFiles()`

Parse Astro files using

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
<td><code>Promise<import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/types").FileExtraction[]></code> — Promise resolving to FileExtraction array (one per file)</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/file-parser.ts:48</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `filePaths`: <code>string[]</code> — - Array of absolute paths to Astro files
**Examples:**
```typescript

```

---
##### `extractFrontmatter()`

Extract frontmatter content from Astro file

Astro files have two sections separated by --- markers:
- Frontmatter: TypeScript/JavaScript code at the top (server-side)
- Template: HTML markup and component usage (client-side)

This function extracts only the frontmatter section. Returns empty string if no frontmatter.
Handles both Unix and Windows line endings for cross-platform compatibility.

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
<td><code>string</code> — Frontmatter code between the --- markers, or empty string</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/file-parser.ts:157</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `content`: <code>string</code> — - Full Astro file content
**Examples:**
```typescript

```

---
##### `extractImports()`

Extract import statements from frontmatter

Parses all import declarations using regex and categorizes them:
- Default imports: import Foo from 'bar'
- Named imports: import { Foo, Bar } from 'baz'
- Namespace imports: import * as Foo from 'bar'

Also handles aliased imports like: import { Foo as F } from 'bar'

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
<td><code>{ source: string; importedNames: string[]; isDefault: boolean; isNamespace: boolean; }[]</code> — Array of import declarations with categorization</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/file-parser.ts:183</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `frontmatter`: <code>string</code> — - TypeScript/JavaScript code from frontmatter
**Examples:**
```typescript

```

---
##### `findSlots()`

Find slot tags in the template

Astro components can define slots to allow content projection:
- Default slot: <slot /> (unnamed)
- Named slot: <slot name="header" />

Returns location information (line number) for each slot found.

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
<td><code>{ name: string; line: number; }[]</code> — Array of slots with names and line numbers</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/file-parser.ts:255</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `content`: <code>string</code> — - Full Astro file content (used to calculate line numbers)
**Examples:**
```typescript

```

---
##### `findClientDirective()`

Find client directive in component usage

Astro allows hydration directives to run components on the client:
- client:load - Eager hydration
- client:idle - Hydrate when browser is idle
- client:visible - Hydrate when component enters viewport
- client:media - Hydrate when media query matches
- client:only - Hydrate only on client (no SSR)

Returns the first directive found. Used to indicate interactive components.

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
<td><code>string</code> — The directive found (e.g., 'client:load'), or undefined</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/file-parser.ts:291</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `content`: <code>string</code> — - Full Astro file content
**Examples:**
```typescript

```

---
##### `extractComponentUsage()`

Extract component usage from template

Identifies which imported components are actually used in the template markup.
Only includes components that:
1. Start with an uppercase letter (C4 naming convention)
2. Are found in the import statements
3. Appear in the template markup

Component names in Astro are PascalCase by convention (e.g., Header, Footer).
This function uses the import list to avoid false positives from HTML elements.

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
<td><code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/types").ExtractedComponent[]</code> — Array of ExtractedComponent objects for used components</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/file-parser.ts:317</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `content`: <code>string</code> — - Full Astro file content- `imports`: <code>{ source: string; importedNames: string[]; }[]</code> — - List of imports from extractImports()- `filePath`: <code>string</code> — - File path (used for location tracking)
**Examples:**
```typescript

```

---
##### `mapToIR()`

Map file extractions to ArchletteIR

Transforms extracted Astro component data into standardized ArchletteIR format.
This is the final step before DSL generation and diagram rendering.

Algorithm (4 main steps):

1. **Aggregation** - Combine all file extractions:
   - Register components, actors, code items from all files
   - Detect and merge duplicates (same component in multiple files)
   - Build relationship graph from

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
<td><code>z.infer<any></code> — ArchletteIR ready for DSL generation</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/to-ir-mapper.ts:73</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `extractions`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/types").FileExtraction[]</code> — - Array of FileExtraction (from parseFiles)- `packages`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/types").PackageInfo[]</code> — - Optional array of PackageInfo for container detection- `systemInfo`: <code>z.infer<any></code> — - Optional system metadata (name, description, repository)
**Examples:**
```typescript

```

---
##### `mapClassToCodeItems()`

Map a class to code items (class + methods)

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/to-ir-mapper.ts:508</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `cls`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedClass</code>- `componentId`: <code>string</code>- `filePath`: <code>string</code>

---
##### `mapFunctionToCodeItem()`

Map a function to a code item

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
<td><code>C:/Users/chris/git/archlette/src/extractors/builtin/basic-astro/to-ir-mapper.ts:555</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `func`: <code>import("C:/Users/chris/git/archlette/src/extractors/builtin/basic-node/types").ExtractedFunction</code>- `componentId`: <code>string</code>- `filePath`: <code>string</code>

---

</details>

---

<div align="center">
<sub><a href="./default-container.md">← Back to Container</a> | <a href="./README.md">← Back to System</a> | Generated with <a href="https://github.com/chrislyons-dev/archlette">Archlette</a></sub>
</div>
