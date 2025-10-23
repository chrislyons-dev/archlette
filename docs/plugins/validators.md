# Writing Validators

Extend Archlette. Validate and enrich architecture data.

---

## Validator Interface

All validators export a default function:

```typescript
export default async function myValidator(
  ir: ArchletteIR,
  node: ResolvedStageNode,
): Promise<{ ok: boolean; errors?: Error[]; warnings?: string[] }> {
  const errors: Error[] = [];
  const warnings: string[] = [];

  // Validate IR
  if (!ir.system.name) {
    errors.push(new Error('System must have a name'));
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
```

**Input:** `ArchletteIR` — Extracted architecture, `ResolvedStageNode` — Configuration

**Output:** Validation result with errors and warnings

---

## Example: Naming Convention Validator

```typescript
import type { ArchletteIR, ResolvedStageNode } from '@chrislyons-dev/archlette';

export default async function namingValidator(
  ir: ArchletteIR,
  node: ResolvedStageNode,
): Promise<{ ok: boolean; errors?: Error[]; warnings?: string[] }> {
  const errors: Error[] = [];
  const warnings: string[] = [];

  // Validate component naming conventions
  for (const component of ir.components) {
    // Check kebab-case IDs
    if (!/^[a-z0-9-]+$/.test(component.id)) {
      errors.push(new Error(`Component ID "${component.id}" must be kebab-case`));
    }

    // Check PascalCase names
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(component.name)) {
      warnings.push(`Component name "${component.name}" should be PascalCase`);
    }
  }

  // Validate relationship descriptions
  for (const rel of ir.componentRelationships) {
    if (!rel.description || rel.description.length < 10) {
      warnings.push(
        `Relationship ${rel.source} → ${rel.destination} needs descriptive text`,
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
```

---

## Example: Relationship Integrity Validator

```typescript
import type { ArchletteIR, ResolvedStageNode } from '@chrislyons-dev/archlette';

export default async function relationshipValidator(
  ir: ArchletteIR,
  node: ResolvedStageNode,
): Promise<{ ok: boolean; errors?: Error[]; warnings?: string[] }> {
  const errors: Error[] = [];
  const warnings: string[] = [];

  const componentIds = new Set(ir.components.map((c) => c.id));

  // Check for orphaned relationships
  for (const rel of ir.componentRelationships) {
    if (!componentIds.has(rel.source)) {
      errors.push(new Error(`Relationship references unknown source: ${rel.source}`));
    }
    if (!componentIds.has(rel.destination)) {
      errors.push(
        new Error(`Relationship references unknown destination: ${rel.destination}`),
      );
    }
  }

  // Check for orphaned components (no relationships)
  for (const component of ir.components) {
    const hasRelationship = ir.componentRelationships.some(
      (r) => r.source === component.id || r.destination === component.id,
    );

    if (!hasRelationship) {
      warnings.push(`Component "${component.name}" has no relationships`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
```

---

## Using Custom Validators

Reference in config:

```yaml
validators:
  - use: validators/builtin/base-validator # Schema validation
  - use: ./custom/naming-validator # Custom naming rules
  - use: ./custom/relationship-validator # Relationship integrity
```

Validators run sequentially. Each receives output from previous.

---

## Validation vs Enrichment

**Validation:** Check correctness, return errors/warnings

**Enrichment:** Modify IR (advanced use case)

```typescript
export default async function enrichmentValidator(
  ir: ArchletteIR,
  node: ResolvedStageNode,
): Promise<{ ok: boolean; errors?: Error[]; warnings?: string[] }> {
  // Infer missing container IDs
  for (const component of ir.components) {
    if (!component.containerId) {
      // Infer from file path or naming pattern
      component.containerId = inferContainerId(component);
    }
  }

  return { ok: true, errors: [], warnings: [] };
}
```

**Caution:** Enrichment modifies shared IR. Use sparingly.

---

## Best Practices

**Fail fast** — Return errors for critical issues.

**Warn generously** — Help users improve quality.

**Validate schema** — Use Zod: `ArchletteIRSchema.parse(ir)`

**Check referential integrity** — Ensure IDs reference valid elements.

**Document validation rules** — Explain what triggers errors/warnings.

**Be deterministic** — Same input, same output.

---

## Common Validation Patterns

**ID uniqueness:**

```typescript
const ids = new Set<string>();
for (const component of ir.components) {
  if (ids.has(component.id)) {
    errors.push(new Error(`Duplicate component ID: ${component.id}`));
  }
  ids.add(component.id);
}
```

**Required fields:**

```typescript
if (!ir.system.name || ir.system.name.trim() === '') {
  errors.push(new Error('System name is required'));
}
```

**Pattern matching:**

```typescript
const VALID_ID_PATTERN = /^[a-z0-9-]+$/;
if (!VALID_ID_PATTERN.test(component.id)) {
  errors.push(new Error(`Invalid component ID format: ${component.id}`));
}
```

---

## See Also

- [Configuration](../guide/configuration.md) — Using custom validators
- [IR Schema](../../src/core/types-ir.ts) — Complete schema reference
