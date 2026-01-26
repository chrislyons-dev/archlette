# Integration Tests

This folder contains integration tests for different rendering configurations. Each test validates a specific rendering path with real source code extraction and diagram generation.

## Links to results

1. [graphviz-theme](./graphviz-theme/output/docs/README.md)
2. [mermaid](./mermaid/output/docs/README.md)
3. [mixed-formats](./mixed-formats/output/docs/README.md)
4. [plantuml](./plantuml/output/docs/README.md)
5. [structurizr-direct](./structurizr-direct/output/docs/README.md)
6. [structurizr-graphviz](./structurizr-graphviz/output/docs/README.md)
7. [theme-override](./theme-override/output/docs/README.md)

## Test Scenarios

### 1. structurizr-direct

**New default rendering path**

Renders Structurizr DSL directly to PNG images, preserving themes.

```bash
cd test-integration/structurizr-direct
npx tsx ../../src/cli.ts -f archlette.config.yaml all
```

**Expected Output:**

- `output/ir.json` - Extracted architecture IR
- `output/workspace.dsl` - Structurizr DSL
- `output/diagrams/*.png` - PNG diagrams
- `output/docs/*.md` - Markdown documentation

---

### 2. plantuml

**Classic PlantUML rendering path**

Exports DSL to PlantUML, then renders to PNG.

```bash
cd test-integration/plantuml
npx tsx ../../src/cli.ts -f archlette.config.yaml all
```

**Expected Output:**

- `output/ir.json` - Extracted architecture IR
- `output/workspace.dsl` - Structurizr DSL
- `output/diagrams/plantuml/*.puml` - PlantUML files
- `output/diagrams/*.png` - PNG diagrams
- `output/docs/*.md` - Markdown documentation

---

### 3. mermaid

**New Mermaid rendering path**

Exports DSL to Mermaid, then renders to SVG.

**Prerequisites:**

```bash
npm install -g @mermaid-js/mermaid-cli
```

```bash
cd test-integration/mermaid
npx tsx ../../src/cli.ts -f archlette.config.yaml all
```

**Expected Output:**

- `output/ir.json` - Extracted architecture IR
- `output/workspace.dsl` - Structurizr DSL
- `output/diagrams/mermaid/*.mmd` - Mermaid files
- `output/diagrams/*.svg` - SVG diagrams (forest theme, 1200x800)
- `output/docs/*.md` - Markdown documentation

---

### 4. theme-override

**Theme override functionality**

Tests renderer-level theme override.

```bash
cd test-integration/theme-override
npx tsx ../../src/cli.ts -f archlette.config.yaml all
```

**Expected Output:**

- Diagrams using `custom-theme.dsl` instead of default theme
- Blue components, dashed relationships

---

### 5. mixed-formats

**Multiple export formats**

Exports to both PlantUML and Mermaid, renders with PlantUML.

```bash
cd test-integration/mixed-formats
npx tsx ../../src/cli.ts -f archlette.config.yaml all
```

**Expected Output:**

- `output/diagrams/plantuml/*.puml` - PlantUML files
- `output/diagrams/mermaid/*.mmd` - Mermaid files
- `output/diagrams/*.png` - PNG diagrams (from PlantUML)

---

## Running All Tests

From the project root:

```bash
# Run each test
for dir in test-integration/*/; do
  echo "Running $(basename $dir)..."
  (cd "$dir" && npx tsx ../../src/cli.ts -f archlette.config.yaml all)
done
```

## Output Validation

Each test has its own `output/` directory, making it easy to:

- Compare outputs between rendering paths
- Validate theme override worked correctly
- Experiment with different configurations
- Clean up individual test outputs

## Cleaning Up

Remove all test outputs:

```bash
rm -rf test-integration/*/output
```

Or clean individual tests:

```bash
rm -rf test-integration/structurizr-direct/output
```

## Adding New Tests

1. Create a new folder under `test-integration/`
2. Add `archlette.config.yaml` with unique `output` path
3. Add source files to `src/`
4. Update this README
