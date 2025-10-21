# Node.js/TypeScript Code Extractor Requirements

## Overview

The basic-node extractor analyzes TypeScript and JavaScript codebases using **static analysis**, producing comprehensive ArchletteIR containing code elements, components, relationships, and documentation. It focuses on **code-level architecture** through AST parsing, not runtime or deployment concerns.

---

## Core Principles

1. **AST-driven**: Parse source files with ts-morph for precise structural analysis
2. **JSDoc-based components**: Use annotations (`@component`, `@module`, `@namespace`) for logical grouping
3. **Package-aware**: Map files to npm packages for container boundaries
4. **Documentation-first**: Extract JSDoc comments, descriptions, examples, and metadata
5. **Relationship discovery**: Capture imports, actor interactions, and component dependencies
6. **Multi-level extraction**: Code (classes/functions) → Components (modules) → Containers (packages) → System

---

## What to Extract

### 1. System Information

From `package.json` and configuration:

```typescript
{
  name: "archlette",
  description: "Architecture as Code toolkit",
  version: "1.0.0",
  repository: {
    type: "git",
    url: "https://github.com/user/archlette"
  }
}
```

**Source**: Primary package.json at workspace root, or from extractor configuration

---

### 2. Containers (Package Level)

Create one container per `package.json` found:

```typescript
{
  id: "archlette",
  name: "archlette",
  type: "Node.js Package",
  technology: "TypeScript",
  description: "Architecture as Code toolkit",
  version: "1.0.0",
  tags: ["npm-package"]
}
```

**Metadata extracted**:

- Name, version, description from package.json
- Entry point from `main` field
- Technology inferred from file extensions (.ts → TypeScript, .js → JavaScript)
- Dependencies (dev/peer/prod) for relationship mapping

---

### 3. Components (Module Level)

Identified via **file-level JSDoc annotations**:

```typescript
/**
 * @component Extractor
 * Analyzes source code to extract architecture components
 */
```

**Supported tags** (priority order):

1. `@component ComponentName` - Explicit component declaration
2. `@module path/to/module` - Standard JSDoc module tag
3. `@namespace NamespaceName` - Standard JSDoc namespace tag

**Component structure**:

```typescript
{
  id: "extractor",                // Normalized from name
  containerId: "archlette",        // Package it belongs to
  name: "Extractor",
  type: "module",
  description: "Analyzes source code to extract architecture components",
  tags: []
}
```

**Rules**:

- Check first JSDoc comment in file (before first statement or at module level)
- All code in a file belongs to that file's component
- Files without component tags are still extracted but grouped under default container

---

### 4. Code Elements (Class/Function Level)

Extract all exported classes, functions, and methods:

**Classes**:

```typescript
{
  id: "cli::run",                  // Hierarchical: component::className
  componentId: "cli",
  name: "run",
  type: "function",
  description: "Main CLI entry point",
  documentation: {
    summary: "Runs archlette command pipeline",
    remarks: "Handles errors and exits with proper code",
    examples: ["await run()"]
  },
  parameters: [
    { name: "args", type: "string[]", optional: false, description: "CLI arguments" }
  ],
  returnType: "Promise<void>",
  returnDescription: "Completes when pipeline finishes",
  tags: []
}
```

**Functions**:

- Include standalone functions and arrow functions
- Extract parameter types, return types, optional/default values
- Capture JSDoc comments, @param, @returns, @example tags

**Methods**:

- Extract from class declarations
- Include visibility (public/private/protected)
- Static vs instance methods
- Constructor methods

**Properties**:

- Class properties with types and initializers
- Visibility and readonly modifiers

---

### 5. Actors (External Systems/Users)

Declared via `@actor` JSDoc tag:

```typescript
/**
 * @actor User {Person} {in} End user who runs archlette commands
 * @actor FileSystem {System} {out} File system for reading/writing files
 * @actor Logger {System} {both} Shared logging service
 */
```

**Format**: `@actor Name {Type} {Direction?} description`

**Types**:

- `Person` - Human user or role
- `System` - External software system

**Directions**:

- `in` - Actor calls/uses this component (Actor → Component)
- `out` - Component calls/uses this actor (Component → Actor)
- `both` - Bidirectional relationship (default if omitted)

**Actor structure**:

```typescript
{
  id: "user",
  name: "User",
  type: "Person",
  description: "End user who runs archlette commands",
  targets: ["cli", "runner"],     // Component IDs this actor interacts with
  tags: []
}
```

---

### 6. Relationships

**Import Relationships** (File-to-File):

```typescript
{
  source: "cli.ts",
  destination: "runner.ts",
  stereotype: "import",
  description: "imports from",
  tags: ["code-dependency"]
}
```

**Component Relationships** (via @uses tag):

```typescript
/**
 * @uses Validator Validates IR structure before generation
 */
```

Maps to:

```typescript
{
  source: "generator",
  destination: "validator",
  description: "Validates IR structure before generation",
  tags: ["component-dependency"]
}
```

**Actor Relationships** (from @actor direction):

- `{in}`: Creates Actor → Component relationship
- `{out}`: Creates Component → Actor relationship
- `{both}`: Creates both relationships

---

## Configuration

**archlette.yaml**:

```yaml
extractors:
  - use: builtin/basic-node
    inputs:
      include:
        - 'src/**/*.ts'
        - 'src/**/*.js'
      exclude:
        - '**/*.test.ts'
        - '**/*.spec.ts'
        - '**/node_modules/**'
        - '**/dist/**'
```

**Inputs**:

- `include` - Glob patterns for source files to analyze
- `exclude` - Glob patterns to skip (tests, build artifacts, dependencies)

**Defaults**:

- Include: `['src/**/*.ts', 'src/**/*.js']`
- Exclude: `['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**']`

---

## File Scanning Strategy

1. **Find source files**: Match include/exclude patterns using fast-glob
2. **Find package.json files**: Scan workspace for all package.json files
3. **Parse source files**: Use ts-morph to create AST for each file
4. **Map to packages**: Associate each file with its nearest package.json
5. **Extract metadata**: Pull code elements, components, actors, relationships
6. **Build IR**: Construct ArchletteIR with normalized IDs and references

**Package resolution**:

- Walk up directory tree from source file
- Stop at first package.json found
- Files outside packages map to default container

---

## JSDoc Parsing Rules

### Component Detection

- Check first JSDoc comment in file (leading comment on first statement)
- Fallback to module-level JSDoc if first statement has none
- Priority: `@component` > `@module` > `@namespace`
- Extract component name from tag text (before dash or newline)

### Actor Detection

- Scan all JSDoc comments in file
- Parse `@actor` tags with regex: `Name {Type} {Direction?} description`
- Validate Type is Person or System
- Default direction to 'both' if omitted
- Merge descriptions for actors declared in multiple files

### Relationship Detection

- Find `@uses` tags in file-level JSDoc
- Parse format: `@uses TargetName description`
- Source is inferred from file's component
- Target is component name from tag

---

## Code Element Extraction

### Functions

- Standalone function declarations
- Arrow functions assigned to exports
- Async functions
- Generator functions

### Classes

- Class declarations (exported and internal)
- Properties (fields with types)
- Methods (instance and static)
- Constructors
- Getters/setters
- Abstract classes and methods

### Methods

- Extract from class bodies
- Capture visibility modifiers (public/private/protected)
- Parameters with types and optional flags
- Return types and JSDoc @returns

### Documentation

- JSDoc summary (first paragraph)
- @param with name, type, description
- @returns with type and description
- @example with code blocks
- @deprecated flag
- @see references
- @remarks for extended notes

---

## Technology Detection

**Inferred from**:

1. File extension (`.ts` → TypeScript, `.js` → JavaScript)
2. package.json `type` field ("module" vs "commonjs")
3. Presence of tsconfig.json → TypeScript project
4. Dependencies in package.json (React, Vue, Angular, etc.)

**Container technology**:

- Default: "Node.js Package"
- If React: "React Application"
- If Express: "Express Server"
- Extensible via configuration

---

## ID Normalization

**Container IDs**: From package name with hyphens → underscores

- `@scope/package-name` → `scope_package_name`

**Component IDs**: From component name, lowercased, special chars to underscores

- `FileParser` → `fileparser`
- `file-parser` → `file_parser`

**Code IDs**: Hierarchical format `component::codeName`

- Function in Extractor component → `extractor::parsefiles`
- Method in FileParser class → `fileparser::FileParser::parse`

**Actor IDs**: From actor name, normalized

- `User` → `user`
- `File System` → `file_system`

---

## Deduplication Strategy

**Components**:

- Merge if same ID appears in multiple files
- Combine descriptions (union of unique descriptions)
- Keep first occurrence's metadata

**Actors**:

- Merge if same ID appears in multiple files
- Combine descriptions and targets
- Accumulate relationships

**Code elements**:

- Keep all occurrences (no deduplication)
- Each file's functions/classes are separate

**Relationships**:

- Deduplicate by (source, destination) pair
- Keep first occurrence's description

---

## Error Handling

**Parse errors**:

- Log file path and error message
- Mark extraction as failed
- Continue processing other files
- Report success/error counts

**Missing package.json**:

- Warn but continue
- Map files to default container
- System name from configuration or "unknown"

**Invalid JSDoc**:

- Skip malformed tags
- Log warning
- Extract what's parsable

**Circular imports**:

- Detect and report
- Include in relationships (no filtering)

---

## Output IR Structure

```typescript
{
  version: "1.0.0",
  system: {
    name: "archlette",
    description: "Architecture as Code toolkit",
    repository: { type: "git", url: "..." }
  },
  containers: [
    { id: "archlette", name: "archlette", type: "Node.js Package", ... }
  ],
  components: [
    { id: "extractor", containerId: "archlette", name: "Extractor", ... }
  ],
  code: [
    { id: "extractor::parsefiles", componentId: "extractor", type: "function", ... }
  ],
  actors: [
    { id: "user", name: "User", type: "Person", targets: ["cli"], ... }
  ],
  containerRelationships: [],      // Populated by other extractors
  componentRelationships: [
    { source: "generator", destination: "validator", description: "...", ... }
  ],
  codeRelationships: [
    { source: "cli.ts", destination: "runner.ts", stereotype: "import", ... }
  ],
  deployments: [],                  // Populated by IaC extractors
  deploymentRelationships: []       // Populated by IaC extractors
}
```

---

## Integration Points

**With Aggregator**:

- Provides code/component/actor data
- Aggregator merges with IaC extractor outputs
- Deduplicates components and actors across extractors

**With Validators**:

- Validates IR schema compliance
- Checks for orphaned components (no container)
- Warns about missing relationships

**With Generators**:

- Code elements map to Structurizr components with "Code" tag
- Components map to Structurizr components
- Containers map to Structurizr containers
- Actors map to Structurizr persons or external systems

---

## Success Criteria

Running basic-node on a typical TypeScript project should produce:

✅ System metadata from package.json
✅ One container per package found
✅ Components for all files with `@component`, `@module`, or `@namespace` tags
✅ All exported classes, functions, methods extracted
✅ Complete JSDoc documentation captured
✅ Import relationships between all source files
✅ Component relationships from `@uses` tags
✅ Actor definitions from `@actor` tags
✅ Actor-component relationships based on direction
✅ Proper hierarchical IDs (container → component → code)
✅ Deduplication of components and actors
✅ Error handling for parse failures without stopping extraction

---

## Performance Considerations

**Optimization strategies**:

- Parallel file parsing (Promise.all)
- Lazy AST traversal (only visit needed nodes)
- Cache package.json lookups
- Skip node_modules by default
- Limit parse depth for very large files

**Expected throughput**:

- ~100-500 files/second depending on complexity
- Memory usage scales with file count and AST size
- Consider streaming for very large monorepos

---

## Future Enhancements

**Potential additions**:

1. Type relationship extraction (interface implementations, generic constraints)
2. Call graph analysis (function → function calls)
3. Dependency injection detection (constructor parameters)
4. React component hierarchy (parent → child)
5. Test coverage mapping (test → production code)
6. Complexity metrics (cyclomatic, cognitive)
7. Dead code detection (unused exports)
8. Breaking change analysis (public API changes)

**Not in scope**:

- Runtime behavior analysis
- Code execution or evaluation
- External API calls
- Database schema extraction
- Build process analysis

---

## Testing Strategy

**Unit tests**:

- Component detector with various JSDoc formats
- Actor parser with all direction combinations
- ID normalization edge cases
- Import relationship extraction
- Error handling for malformed code

**Integration tests**:

- Full extraction on sample TypeScript project
- Multi-package monorepo scenario
- Files with missing JSDoc
- Circular import detection
- Large file handling

**Property-based tests**:

- ID uniqueness guarantees
- Relationship consistency (source/dest exist)
- Documentation completeness

---

_This document defines the requirements for the basic-node extractor, which analyzes TypeScript and JavaScript codebases through static AST analysis to produce comprehensive architecture information._
