# Astro Extractor Implementation Plan

**Goal:** Create `basic-astro` extractor that produces IR compatible with `basic-node` results.

**Branch:** `feature/astro-extractor`

---

## Phase 1: Setup & Scaffolding

### 1.1 Project Structure

- [x] Create directory structure:
  - `src/extractors/builtin/basic-astro.ts` (entry point)
  - `src/extractors/builtin/basic-astro/` (helper modules)
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

- [x] Implement `findSourceFiles()` in `file-finder.ts`:
  - Use globby to find `**/*.astro` files
  - Support include/exclude patterns
  - Follow basic-node pattern
  - Return absolute paths

- [x] Implement `findPackageJsonFiles()`:
  - Find package.json files in the workspace
  - Extract base dirs from include patterns
  - Search multiple levels deep

- [x] Implement `readPackageInfo()`:
  - Read and parse package.json
  - Extract name, version, description
  - Handle errors gracefully

- [x] Implement `findNearestPackage()`:
  - Find closest parent package.json for a file
  - Sort packages by depth
  - Use relative path calculation

**Commit:** `feat: implement Astro file discovery and package detection`

### 2.2 Testing File Finder

- [x] Create test fixtures with Astro files and package.json files
- [x] Write tests for `findSourceFiles()` (3 tests)
- [x] Write tests for `findPackageJsonFiles()` (1 test)
- [x] Write tests for `readPackageInfo()` (3 tests)
- [x] Write tests for `findNearestPackage()` (3 tests)
- [x] All 10 tests passing
- [x] Total test count: 35 files, 490 tests

**Commit:** `test: add tests for Astro file finder`

---

## Phase 3: AST Parsing

### 3.1 Astro Compiler Integration

- [x] Implement `parseFiles()` in `file-parser.ts`:
  - Call `@astrojs/compiler.parse()` for each .astro file
  - Extract AST structure
  - Handle parse errors gracefully
  - Return `FileExtraction[]`

**Commit:** `feat: integrate @astrojs/compiler for AST parsing`

### 3.2 Frontmatter Extraction

- [x] Extract TypeScript/JavaScript from frontmatter section
- [x] Parse component props (interface/type definitions)
- [x] Extract imports from frontmatter
- [x] Identify exported functions/constants

**Commit:** `feat: extract frontmatter code from Astro components`

### 3.3 Template Analysis

- [x] Extract component usage from template (imported components)
- [x] Identify slots (default and named)
- [x] Extract client directives (`client:load`, `client:idle`, etc.)

**Commit:** `feat: analyze Astro template for component usage and slots`

### 3.4 Testing Parser

- [x] Create sample .astro files with various patterns
- [x] Test frontmatter extraction
- [x] Test template parsing
- [x] Test error handling

**Commit:** `test: add tests for Astro AST parser`

---

## Phase 4: Component Detection

### 4.1 JSDoc Tag Extraction

- [x] Implement `extractFileComponent()` in `component-detector.ts`:
  - Parse frontmatter for JSDoc comments
  - Support `@component`, `@module`, `@namespace` tags
  - Extract component name and description
  - Use `sanitizeId()` for IDs

- [x] Implement `extractFileActors()`:
  - Parse `@actor` tags from frontmatter JSDoc
  - Format: `@actor Name {Person|System} {in|out|both}? description`
  - Use `sanitizeId()` for actor IDs

- [x] Implement `extractFileRelationships()`:
  - Parse `@uses` tags from frontmatter JSDoc
  - Create component dependencies

**Commit:** `feat: implement JSDoc tag extraction for Astro components`

### 4.2 Folder-Based Inference

- [x] Implement `inferComponentFromPath()`:
  - Use immediate parent folder name as component
  - Use `ROOT_COMPONENT_MARKER` for root directory files
  - Match basic-node behavior exactly

**Commit:** `feat: add folder-based component name inference`

### 4.3 Testing Component Detection

- [x] Test explicit `@component` tags
- [x] Test folder-based inference
- [x] Test root directory handling
- [x] Test `@actor` and `@uses` tags

**Commit:** `test: add tests for Astro component detection`

---

## Phase 5: Code Extraction

### 5.1 TypeScript Code Extraction

- [x] Extract classes from frontmatter
- [x] Extract functions from frontmatter
- [x] Extract interfaces/types (component props)
- [x] Extract constants/variables
- [x] Follow basic-node code extraction patterns

**Commit:** `feat: extract TypeScript code items from Astro frontmatter`

### 5.2 Documentation Extraction

- [x] Extract JSDoc from classes/functions
- [x] Support `@example`, `@remarks`, `@deprecated`
- [x] Extract parameter descriptions
- [x] Extract return types/descriptions

**Commit:** `feat: extract documentation from Astro component code`

### 5.3 Component Metadata

- [x] Extract component props (TypeScript interface)
- [x] Extract slots (named and default)
- [x] Extract client directives (affects architecture)
- [x] Store as code item metadata

**Commit:** `feat: extract Astro-specific component metadata (props, slots, directives)`

### 5.4 Testing Code Extraction

- [x] Test class extraction
- [x] Test function extraction
- [x] Test prop interface extraction
- [x] Test documentation extraction

**Commit:** `test: add tests for code extraction from Astro files`

---

## Phase 6: IR Mapping

### 6.1 Basic IR Structure

- [x] Implement `mapToIR()` in `to-ir-mapper.ts`:
  - Aggregate components, actors, relationships
  - Create code items array
  - Follow basic-node mapping pattern exactly

**Commit:** `feat: implement basic IR mapping for Astro extractor`

### 6.2 Container Detection

- [x] Map files to nearest package.json
- [x] Create containers from packages
- [x] Handle files without packages (default container)
- [x] Match basic-node container logic

**Commit:** `feat: implement container detection and assignment`

### 6.3 Hierarchical IDs

- [x] Build `componentIdMap` (old ID → new ID)
- [x] Apply container-level IDs: `${containerId}__${componentId}`
- [x] Handle `ROOT_COMPONENT_MARKER` replacement
- [x] Apply code-level IDs: `${componentId}__${codeName}`
- [x] Update all relationship references

**Commit:** `feat: implement hierarchical ID system for Astro IR`

### 6.4 Relationship Mapping

- [x] Map component → component relationships
- [x] Map component → actor relationships
- [x] Handle actor direction (in/out/both)
- [x] Deduplicate relationships

**Commit:** `feat: map Astro component relationships to IR`

### 6.5 Testing IR Mapping

- [x] Test component mapping
- [x] Test hierarchical ID generation
- [x] Test ROOT_COMPONENT_MARKER replacement
- [x] Test relationship mapping
- [x] Test container assignment

**Commit:** `test: add comprehensive IR mapping tests`

---

## Phase 7: Main Extractor Entry Point

### 7.1 Orchestration

- [x] Implement main extractor in `index.ts`:
  - Parse inputs (include, exclude patterns)
  - Call file finder
  - Call parser
  - Call IR mapper
  - Handle errors gracefully
  - Add appropriate logging

**Commit:** `feat: implement main Astro extractor orchestration`

### 7.2 Export Configuration

- [x] Export as default for dynamic loading
- [x] Implement `ArchletteExtractor` interface
- [x] Match basic-node/basic-python patterns

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

- [x] Add JSDoc to all public functions
- [x] Add module-level documentation
- [x] Document complex algorithms
- [x] Add inline comments for non-obvious code

**Commit:** `docs: add comprehensive code documentation to Astro extractor`

Added comprehensive JSDoc documentation to all files in basic-astro extractor:

- **file-finder.ts**: 4 functions documented with parameter descriptions and examples
- **types.ts**: 11 interfaces documented with field descriptions and usage patterns
- **file-parser.ts**: 6 functions documented with algorithm explanations
- **component-detector.ts**: 5 functions documented with parsing logic and examples
- **code-extractor.ts**: 2 functions documented with synthetic function generation details
- **to-ir-mapper.ts**: mapToIR() function documented with 4-step algorithm breakdown
- **basic-astro.ts**: Main entry point already documented with JSDoc

All 550 tests passing ✅

### 9.2 User Documentation

- [x] Update main README.md with Astro extractor info
- [x] Create examples in `examples/astro/`
- [x] Document supported JSDoc tags
- [x] Add usage examples in CLAUDE.md

**Commit:** `docs: add user documentation for Astro extractor`

Added comprehensive user-facing documentation:

- **README.md**: Added Astro annotation example, multi-extractor config, and Extractors section describing all built-in extractors
- **examples/astro/**: Created complete example project with:
  - 4 example Astro components (Header, Button, Card, FormUtils)
  - package.json for container detection
  - archlette.config.yaml for full pipeline
  - Comprehensive README explaining features and JSDoc tags
- **docs/guide/astro-annotations.md**: Complete reference guide for Astro JSDoc tags:
  - Component declaration tags (@component, @module, @namespace)
  - Actor definitions (@actor) with direction indicators
  - Relationships (@uses)
  - Examples for each use case
  - Best practices and common mistakes
- **CLAUDE.md**: Updated with:
  - Astro extractor in directory structure
  - Plugin system documentation for basic-astro
  - Configuration examples with both basic-node and basic-astro
  - Important notes about Astro extractor

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
