# Writing Generators

Extend Archlette. Transform IR to custom DSL formats.

---

## Generator Interface

All generators export a default function:

```typescript
export default function myGenerator(ir: ArchletteIR, node: ResolvedStageNode): string {
  // Transform IR to DSL
  return 'workspace { ... }';
}
```

**Input:** `ArchletteIR` — Validated architecture, `ResolvedStageNode` — Configuration

**Output:** String containing DSL content

---

## Example: PlantUML Generator

```typescript
import type { ArchletteIR, ResolvedStageNode } from '@chrislyons-dev/archlette';

export default function plantumlGenerator(
  ir: ArchletteIR,
  node: ResolvedStageNode,
): string {
  const lines: string[] = [];

  lines.push('@startuml');
  lines.push(`title ${ir.system.name} - Component Diagram`);
  lines.push('');

  // Generate components
  for (const component of ir.components) {
    lines.push(`component [${component.name}] as ${component.id}`);
  }

  lines.push('');

  // Generate relationships
  for (const rel of ir.componentRelationships) {
    const desc = rel.description ? ` : ${rel.description}` : '';
    lines.push(`${rel.source} --> ${rel.destination}${desc}`);
  }

  lines.push('@enduml');

  return lines.join('\n');
}
```

---

## Example: Mermaid Generator

```typescript
import type { ArchletteIR, ResolvedStageNode } from '@chrislyons-dev/archlette';

export default function mermaidGenerator(
  ir: ArchletteIR,
  node: ResolvedStageNode,
): string {
  const lines: string[] = [];

  lines.push('graph TD');
  lines.push(`  %% ${ir.system.name}`);
  lines.push('');

  // Generate components
  for (const component of ir.components) {
    const label = component.description
      ? `${component.name}<br/>${component.description}`
      : component.name;
    lines.push(`  ${component.id}[${label}]`);
  }

  lines.push('');

  // Generate relationships
  for (const rel of ir.componentRelationships) {
    const label = rel.description ? `|${rel.description}|` : '';
    lines.push(`  ${rel.source} --> ${label} ${rel.destination}`);
  }

  return lines.join('\n');
}
```

---

## Example: GraphViz DOT Generator

```typescript
import type { ArchletteIR, ResolvedStageNode } from '@chrislyons-dev/archlette';

export default function dotGenerator(ir: ArchletteIR, node: ResolvedStageNode): string {
  const lines: string[] = [];

  lines.push('digraph architecture {');
  lines.push('  rankdir=LR;');
  lines.push('  node [shape=box, style=rounded];');
  lines.push('');

  // Generate components
  for (const component of ir.components) {
    const label = component.description
      ? `${component.name}\\n${component.description}`
      : component.name;
    lines.push(`  ${component.id} [label="${label}"];`);
  }

  lines.push('');

  // Generate relationships
  for (const rel of ir.componentRelationships) {
    const label = rel.description ? `label="${rel.description}"` : '';
    lines.push(`  ${rel.source} -> ${rel.destination} [${label}];`);
  }

  lines.push('}');

  return lines.join('\n');
}
```

---

## Using Custom Generators

Reference in config:

```yaml
generators:
  - use: generators/builtin/structurizr # Structurizr DSL
  - use: ./custom/plantuml-generator # PlantUML
  - use: ./custom/mermaid-generator # Mermaid
```

Multiple generators can run. Each produces separate output file.

---

## Template Engines

Use Nunjucks for complex DSL generation:

```typescript
import nunjucks from 'nunjucks';
import type { ArchletteIR, ResolvedStageNode } from '@chrislyons-dev/archlette';

export default function templateGenerator(
  ir: ArchletteIR,
  node: ResolvedStageNode,
): string {
  const template = `
workspace "{{ system.name }}" {
  {% for component in components %}
  component "{{ component.name }}" {
    description "{{ component.description }}"
  }
  {% endfor %}
}
  `.trim();

  return nunjucks.renderString(template, ir);
}
```

**Built-in Structurizr generator** uses this approach. See `src/generators/builtin/structurizr.ts`.

---

## Multi-File Generators

Return object for multiple files:

```typescript
import type {
  ArchletteIR,
  ResolvedStageNode,
  GeneratorOutput,
} from '@chrislyons-dev/archlette';

export default function multiFileGenerator(
  ir: ArchletteIR,
  node: ResolvedStageNode,
): GeneratorOutput {
  return {
    files: [
      {
        path: 'workspace.dsl',
        content: generateWorkspace(ir),
      },
      {
        path: 'views.dsl',
        content: generateViews(ir),
      },
    ],
  };
}
```

---

## Best Practices

**Escape special characters** — Prevent DSL syntax errors.

**Use stable output** — Same IR, same DSL.

**Add comments** — Help users understand generated DSL.

**Validate IR** — Check for required fields before generation.

**Handle edge cases** — Empty descriptions, missing relationships.

**Test with real data** — Use Archlette's own IR for testing.

---

## Common Patterns

**Escaping strings:**

```typescript
function escape(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
```

**Conditional output:**

```typescript
const description = component.description
  ? `description "${escape(component.description)}"`
  : '';
```

**Filtering empty arrays:**

```typescript
if (ir.components.length === 0) {
  console.warn('No components to generate');
  return '// No components found';
}
```

**Grouping by container:**

```typescript
const byContainer = new Map<string, Component[]>();
for (const component of ir.components) {
  if (!byContainer.has(component.containerId)) {
    byContainer.set(component.containerId, []);
  }
  byContainer.get(component.containerId)!.push(component);
}
```

---

## Output Configuration

Generators write to path configured in `.aac.yaml`:

```yaml
paths:
  dsl_out: docs/architecture/workspace.dsl  # Single file
  # or
  dsl_out: docs/architecture/dsl  # Directory for multi-file
```

Generator doesn't handle file I/O. Returns string. Pipeline writes to disk.
