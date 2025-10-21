# Writing Extractors

Extend Archlette. Extract architecture from custom sources.

---

## Extractor Interface

All extractors export a default function:

```typescript
export default async function myExtractor(
  node: ResolvedStageNode,
): Promise<ArchletteIR> {
  // Extract architecture
  return {
    version: '1.0',
    system: { name: 'MySystem' },
    actors: [],
    containers: [],
    components: [],
    code: [],
    deployments: [],
    containerRelationships: [],
    componentRelationships: [],
    codeRelationships: [],
  };
}
```

**Input:** `ResolvedStageNode` — Configuration for this extractor

**Output:** `ArchletteIR` — Intermediate representation

---

## Example: Terraform Extractor

```typescript
import type { ResolvedStageNode, ArchletteIR } from '@chrislyons-dev/archlette';
import { glob } from 'glob';
import fs from 'node:fs/promises';

export default async function terraformExtractor(
  node: ResolvedStageNode,
): Promise<ArchletteIR> {
  const files = await glob(node.inputs.include, {
    ignore: node.inputs.exclude,
  });

  const components: ArchletteIR['components'] = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');

    // Parse Terraform resources
    const resourceMatches = content.matchAll(/resource\s+"([^"]+)"\s+"([^"]+)"/g);

    for (const [_, type, name] of resourceMatches) {
      components.push({
        id: `${type}-${name}`,
        name: `${type}.${name}`,
        type: 'infrastructure',
        description: `Terraform ${type}`,
        containerId: 'infrastructure',
      });
    }
  }

  return {
    version: '1.0',
    system: {
      name: node.context.config.project.name,
    },
    actors: [],
    containers: [
      {
        id: 'infrastructure',
        name: 'Infrastructure',
        type: 'Infrastructure',
        description: 'Terraform-managed infrastructure',
      },
    ],
    components,
    code: [],
    deployments: [],
    containerRelationships: [],
    componentRelationships: [],
    codeRelationships: [],
  };
}
```

---

## Using Custom Extractors

Reference in config:

```yaml
extractors:
  - use: ./custom/terraform-extractor
    inputs:
      include: ['**/*.tf']
      exclude: ['.terraform/**']
```

Path resolves relative to Archlette's src directory. Use `./` for project-relative paths.

---

## IR Schema

**System:**

```typescript
{
  name: string;
  description?: string;
  repository?: string;
}
```

**Containers:**

```typescript
{
  id: string;
  name: string;
  type: string;
  description?: string;
}
```

**Components:**

```typescript
{
  id: string;
  name: string;
  type: string;
  description?: string;
  containerId: string;
}
```

**Relationships:**

```typescript
{
  source: string;  // Component ID
  destination: string;  // Component ID
  description?: string;
  tags?: string[];
}
```

See `src/core/types-ir.ts` for complete schema.

---

## Best Practices

**Validate inputs** — Check file patterns before processing.

**Handle errors** — Catch and report parsing failures.

**Use stable IDs** — Same input, same ID.

**Describe relationships** — Make them meaningful.

**Validate schema** — Use Zod: `ArchletteIRSchema.parse(ir)`

---

## See Also

- [Configuration](../guide/configuration.md) — Using custom extractors
- [Quick Start](../getting-started/quick-start.md) — Basic extractor usage
