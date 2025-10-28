# Astro Example Project

This is an example Astro project demonstrating how to use Archlette's `basic-astro` extractor for automatic architecture documentation.

## Project Structure

```
src/components/
  ├── Header.astro       # Main header with @actor and @uses tags
  ├── Button.astro       # Reusable button with @component and type definitions
  ├── Card.astro         # Flexible card container component
  └── FormUtils.astro    # Form utilities with exported functions
```

## Key Features Demonstrated

### 1. Component Identification

Components can be identified in two ways:

**Explicit Tags:**

```astro
---
/**
 * @component Button
 * Reusable button component
 */
---
```

**Directory Inference:**

- `src/components/Header.astro` → component "components"
- Files in subdirectories use parent folder name as component

### 2. External Actors

Define who/what interacts with your components:

```astro
---
/**
 * @actor User {Person} {in} End user of the application
 * @actor Analytics {System} {out} Sends tracking events
 */
---
```

Direction indicators:

- `{in}` - Actor sends input to component
- `{out}` - Component sends output to actor
- `{both}` - Bidirectional interaction

### 3. Component Dependencies

Document component relationships:

```astro
---
/**
 * @uses Icon Displays icon inside button
 * @uses Theme Uses theme colors
 */
---
```

### 4. Props and Types

Component props are automatically extracted from TypeScript interfaces:

```astro
---
interface Props {
  variant: 'primary' | 'secondary';
  disabled?: boolean;
}
---
```

### 5. Slots

Named and default slots are detected from the template:

```astro
<div class="card">
  <div class="header"><slot /></div>
  <div class="footer"><slot name="footer" /></div>
</div>
```

## Running Extraction

### Extract Architecture

```bash
# Extract components and generate IR
npx archlette extract --config archlette.config.yaml

# View extracted IR
cat archlette-output/ir.json
```

### Generate Documentation

```bash
# Full pipeline: extract → validate → generate → render → docs
npx archlette --config archlette.config.yaml
```

### Output

Generated files:

- `archlette-output/ir.json` - Intermediate representation
- `archlette-output/dsl/workspace.dsl` - Structurizr DSL
- `archlette-output/diagrams/*.png` - C4 diagrams
- `archlette-output/docs/README.md` - Generated documentation

## JSDoc Tags Reference

### Component Declaration

| Tag          | Syntax                     | Example                        |
| ------------ | -------------------------- | ------------------------------ |
| `@component` | `@component ComponentName` | `@component Button`            |
| `@module`    | `@module path/to/module`   | `@module ui/components/Button` |
| `@namespace` | `@namespace NamespaceName` | `@namespace UI`                |

Use only one per file. If none specified, component name is inferred from directory.

### Actors (External Systems)

```astro
/**
 * @actor Name {Type} {Direction?} description
 *
 * Types: Person or System
 * Direction: in | out | both (defaults to both if omitted)
 */
```

Examples:

```astro
/**
 * @actor User {Person} {in} End user of the application
 * @actor Database {System} {out} Stores user data
 * @actor Logger {System} {both} Logs events
 */
```

### Dependencies

```astro
/**
 * @uses TargetComponent description
 * @uses AnotherComponent Used for rendering content
 */
```

## Extracted Architecture Example

For this example project, extraction produces:

**Components:**

- `components` (container inferred from directory)
  - `Header` - Main application header
  - `Button` - Reusable button component
  - `Card` - Card container component
  - `FormUtils` - Form utilities and helpers

**Actors:**

- `User` (Person) - End user interacting with UI
- `Analytics` (System) - Tracking events

**Relationships:**

- Header → User (bidirectional interaction)
- Button → User (user clicks buttons)
- Button → Analytics (sends click events)
- Button → Icon (component dependency)

**Generated Diagrams:**

- System Context - Overview of user and analytics interactions
- Container - Component organization
- Component - Individual component relationships

## Comparing with TypeScript

The basic-astro extractor works alongside `basic-node`:

```yaml
extractors:
  - use: extractors/builtin/basic-node
    inputs:
      include: ['src/**/*.ts', 'src/**/*.js']

  - use: extractors/builtin/basic-astro
    inputs:
      include: ['src/**/*.astro']
```

Results are automatically aggregated into a single architecture representation.

## Learn More

- [Archlette Documentation](https://chrislyons-dev.github.io/archlette/)
- [JSDoc Annotations Guide](https://chrislyons-dev.github.io/archlette/guide/annotations/)
- [Astro Documentation](https://docs.astro.build/)
