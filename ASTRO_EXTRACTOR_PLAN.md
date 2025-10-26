# Astro Extractor Implementation Plan

**Goal:** Create `basic-astro` extractor that produces IR compatible with `basic-node` results.

**Branch:** `feature/astro-extractor`

---

## Phase 1: Setup & Scaffolding

### 1.1 Project Structure

- [x] Create directory structure:
  - `src/extractors/builtin/basic-astro/`
  - `src/extractors/builtin/basic-astro/index.ts`
  - `src/extractors/builtin/basic-astro/types.ts`
  - `src/extractors/builtin/basic-astro/file-finder.ts`
  - `src/extractors/builtin/basic-astro/file-parser.ts`
  - `src/extractors/builtin/basic-astro/component-detector.ts`
  - `src/extractors/builtin/basic-astro/to-ir-mapper.ts`

**Commit:** `feat: scaffold basic-astro extractor directory structure`

### 1.2 TypeScript Types

- [x] Define core types in `types.ts`:
  - `ExtractorInputs` (include, exclude, astroCompilerPath?)
  - `FileExtraction` (matches basic-node pattern)
  - `ExtractedComponent` (Astro component metadata)
  - `ExtractedProp` (component props from frontmatter)
  - `ExtractedSlot` (named slots)
  - `ComponentInfo`, `ActorInfo`, `RelationshipInfo`
  - `AstroParserOutput` (AST structure from compiler)

**Commit:** `feat: add TypeScript types for basic-astro extractor`

### 1.3 Dependencies

- [x] Add `@astrojs/compiler` to package.json
- [x] Run `npm install`
- [x] Verify TypeScript imports work (added import in file-parser.ts)
- [x] Type checking passes
- [x] Tests still passing

**Commit:** `feat: add @astrojs/compiler dependency for Astro parsing`

### 1.4 Basic Smoke Tests

- [x] Create `test/extractors/builtin/basic-astro.test.ts`
- [x] Test extractor can be loaded
- [x] Test extractor returns valid IR structure
- [x] Test ROOT_COMPONENT_MARKER is exported
- [x] Test handles empty inputs gracefully
- [x] All tests passing (34 test files, 480 tests)

**Commit:** `test: add basic smoke tests for Astro extractor scaffold`

---

## Phase 2: File Discovery

### 2.1 File Finder

- [ ] Implement `findSourceFiles()` in `file-finder.ts`:
  - Use glob to find `**/*.astro` files
  - Support include/exclude patterns
  - Follow basic-node pattern

- [ ] Implement `findPackageJson()`:
  - Find package.json files in the workspace
  - Extract package metadata (name, version, description)
  - Assign files to nearest package

**Commit:** `feat: implement Astro file discovery and package detection`

### 2.2 Testing File Finder

- [ ] Create test fixtures in `test/extractors/builtin/basic-astro/`
- [ ] Write tests for file discovery
- [ ] Test package.json detection

**Commit:** `test: add tests for Astro file finder`

---

## Phase 3: AST Parsing

### 3.1 Astro Compiler Integration

- [ ] Implement `parseFiles()` in `file-parser.ts`:
  - Call `@astrojs/compiler.parse()` for each .astro file
  - Extract AST structure
  - Handle parse errors gracefully
  - Return `AstroParserOutput`

**Commit:** `feat: integrate @astrojs/compiler for AST parsing`

### 3.2 Frontmatter Extraction

- [ ] Extract TypeScript/JavaScript from frontmatter section
- [ ] Parse component props (interface/type definitions)
- [ ] Extract imports from frontmatter
- [ ] Identify exported functions/constants

**Commit:** `feat: extract frontmatter code from Astro components`

### 3.3 Template Analysis

- [ ] Extract component usage from template (imported components)
- [ ] Identify slots (default and named)
- [ ] Extract client directives (`client:load`, `client:idle`, etc.)

**Commit:** `feat: analyze Astro template for component usage and slots`

### 3.4 Testing Parser

- [ ] Create sample .astro files with various patterns
- [ ] Test frontmatter extraction
- [ ] Test template parsing
- [ ] Test error handling

**Commit:** `test: add tests for Astro AST parser`

---

## Phase 4: Component Detection

### 4.1 JSDoc Tag Extraction

- [ ] Implement `extractFileComponent()` in `component-detector.ts`:
  - Parse frontmatter for JSDoc comments
  - Support `@component`, `@module`, `@namespace` tags
  - Extract component name and description
  - Use `sanitizeId()` for IDs

- [ ] Implement `extractFileActors()`:
  - Parse `@actor` tags from frontmatter JSDoc
  - Format: `@actor Name {Person|System} {in|out|both}? description`
  - Use `sanitizeId()` for actor IDs

- [ ] Implement `extractFileRelationships()`:
  - Parse `@uses` tags from frontmatter JSDoc
  - Create component dependencies

**Commit:** `feat: implement JSDoc tag extraction for Astro components`

### 4.2 Folder-Based Inference

- [ ] Implement `inferComponentFromPath()`:
  - Use immediate parent folder name as component
  - Use `ROOT_COMPONENT_MARKER` for root directory files
  - Match basic-node behavior exactly

**Commit:** `feat: add folder-based component name inference`

### 4.3 Testing Component Detection

- [ ] Test explicit `@component` tags
- [ ] Test folder-based inference
- [ ] Test root directory handling
- [ ] Test `@actor` and `@uses` tags

**Commit:** `test: add tests for Astro component detection`

---

## Phase 5: Code Extraction

### 5.1 TypeScript Code Extraction

- [ ] Extract classes from frontmatter
- [ ] Extract functions from frontmatter
- [ ] Extract interfaces/types (component props)
- [ ] Extract constants/variables
- [ ] Follow basic-node code extraction patterns

**Commit:** `feat: extract TypeScript code items from Astro frontmatter`

### 5.2 Documentation Extraction

- [ ] Extract JSDoc from classes/functions
- [ ] Support `@example`, `@remarks`, `@deprecated`
- [ ] Extract parameter descriptions
- [ ] Extract return types/descriptions

**Commit:** `feat: extract documentation from Astro component code`

### 5.3 Component Metadata

- [ ] Extract component props (TypeScript interface)
- [ ] Extract slots (named and default)
- [ ] Extract client directives (affects architecture)
- [ ] Store as code item metadata

**Commit:** `feat: extract Astro-specific component metadata (props, slots, directives)`

### 5.4 Testing Code Extraction

- [ ] Test class extraction
- [ ] Test function extraction
- [ ] Test prop interface extraction
- [ ] Test documentation extraction

**Commit:** `test: add tests for code extraction from Astro files`

---

## Phase 6: IR Mapping

### 6.1 Basic IR Structure

- [ ] Implement `mapToIR()` in `to-ir-mapper.ts`:
  - Aggregate components, actors, relationships
  - Create code items array
  - Follow basic-node mapping pattern exactly

**Commit:** `feat: implement basic IR mapping for Astro extractor`

### 6.2 Container Detection

- [ ] Map files to nearest package.json
- [ ] Create containers from packages
- [ ] Handle files without packages (default container)
- [ ] Match basic-node container logic

**Commit:** `feat: implement container detection and assignment`

### 6.3 Hierarchical IDs

- [ ] Build `componentIdMap` (old ID → new ID)
- [ ] Apply container-level IDs: `${containerId}__${componentId}`
- [ ] Handle `ROOT_COMPONENT_MARKER` replacement
- [ ] Apply code-level IDs: `${componentId}__${codeName}`
- [ ] Update all relationship references

**Commit:** `feat: implement hierarchical ID system for Astro IR`

### 6.4 Relationship Mapping

- [ ] Map component → component relationships
- [ ] Map component → actor relationships
- [ ] Handle actor direction (in/out/both)
- [ ] Deduplicate relationships

**Commit:** `feat: map Astro component relationships to IR`

### 6.5 Testing IR Mapping

- [ ] Test component mapping
- [ ] Test hierarchical ID generation
- [ ] Test ROOT_COMPONENT_MARKER replacement
- [ ] Test relationship mapping
- [ ] Test container assignment

**Commit:** `test: add comprehensive IR mapping tests`

---

## Phase 7: Main Extractor Entry Point

### 7.1 Orchestration

- [ ] Implement main extractor in `index.ts`:
  - Parse inputs (include, exclude patterns)
  - Call file finder
  - Call parser
  - Call IR mapper
  - Handle errors gracefully
  - Add appropriate logging

**Commit:** `feat: implement main Astro extractor orchestration`

### 7.2 Export Configuration

- [ ] Export as default for dynamic loading
- [ ] Implement `ArchletteExtractor` interface
- [ ] Match basic-node/basic-python patterns

**Commit:** `feat: configure Astro extractor for dynamic loading`

---

## Phase 8: Integration Testing

### 8.1 End-to-End Tests

- [ ] Create realistic test Astro project structure
- [ ] Test full extraction pipeline
- [ ] Verify IR structure matches expectations
- [ ] Test with package.json detection
- [ ] Test without package.json (default container)

**Commit:** `test: add end-to-end integration tests for Astro extractor`

### 8.2 Compatibility Tests

- [ ] Verify IR is compatible with basic-node output
- [ ] Test aggregation with basic-node results
- [ ] Test DSL generation works
- [ ] Test diagram rendering works

**Commit:** `test: verify Astro extractor IR compatibility with basic-node`

### 8.3 Edge Cases

- [ ] Empty .astro files
- [ ] Astro files with syntax errors
- [ ] Mixed TypeScript/JavaScript frontmatter
- [ ] Files without frontmatter
- [ ] Deeply nested component structures

**Commit:** `test: add edge case tests for Astro extractor`

---

## Phase 9: Documentation

### 9.1 Code Documentation

- [ ] Add JSDoc to all public functions
- [ ] Add module-level documentation
- [ ] Document complex algorithms
- [ ] Add inline comments for non-obvious code

**Commit:** `docs: add comprehensive code documentation to Astro extractor`

### 9.2 User Documentation

- [ ] Update main README.md with Astro extractor info
- [ ] Create examples in `examples/astro/`
- [ ] Document supported JSDoc tags
- [ ] Add usage examples in CLAUDE.md

**Commit:** `docs: add user documentation for Astro extractor`

### 9.3 Configuration Examples

- [ ] Create sample `archlette.config.yaml` with Astro
- [ ] Document extractor configuration options
- [ ] Show example outputs

**Commit:** `docs: add configuration examples for Astro extractor`

---

## Phase 10: Polish & Release

### 10.1 Code Quality

- [ ] Run linting: `npm run lint`
- [ ] Run type checking: `npm run typecheck`
- [ ] Run all tests: `npm test`
- [ ] Fix any issues

**Commit:** `chore: fix linting and type errors in Astro extractor`

### 10.2 Performance Review

- [ ] Profile parsing performance on large codebases
- [ ] Optimize if needed
- [ ] Add benchmarks

**Commit:** `perf: optimize Astro extractor performance`

### 10.3 Final Integration

- [ ] Test with bond-math or other real project
- [ ] Generate full documentation
- [ ] Verify diagrams render correctly
- [ ] Update changelog

**Commit:** `feat: complete Astro extractor implementation`

---

## Success Criteria

- ✅ All tests pass (100% of new code covered)
- ✅ TypeScript compiles without errors
- ✅ IR structure matches basic-node format
- ✅ Can be aggregated with basic-node results
- ✅ Generates valid Structurizr DSL
- ✅ Renders diagrams correctly
- ✅ Documentation complete

---

## Notes

- Follow existing patterns from `basic-node` and `basic-python`
- Use `sanitizeId()` for all IDs
- Commit after each logical unit of work
- Run tests before committing
- Keep commits focused and atomic
- Update this file's checkboxes as you progress
