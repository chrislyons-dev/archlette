# Aggregator Deduplication Strategy

## Problem

When users run **both code extractors** (basic-node) **and IaC extractors** (basic-wrangler) on the same system, the IR aggregator will receive duplicate entities:

**Example: bond-math with both extractors**

**basic-node** extracts:

- Container: `bond-math-gateway` (from package.json)
- Components: logger, jwt, middleware, router (from code)
- Code items: functions and classes
- Relationships: inferred from imports

**basic-wrangler** extracts:

- Container: `bond-math-gateway` (from wrangler.toml)
- Deployments: production, development, preview
- Instances: per-environment workers
- Relationships: from service bindings

**Duplicates**:

- ✅ Container `bond-math-gateway` appears twice
- ✅ Relationship `gateway → daycount` might appear from both

---

## Goal

**Merge extractors to produce the UNION of information**, not replacement. We want:

- Complete container metadata (name, type, technology from both sources)
- All relationships (code-inferred + IaC-declared)
- Code-level details (components, functions) from code extractors
- Deployment topology (environments, instances) from IaC extractors

---

## Deduplication Rules

### 1. Containers

**Strategy**: Merge by ID, combine metadata

```typescript
// From basic-node
{
  id: "bond-math-gateway",
  name: "@bond-math/gateway",
  type: "Service",
  technology: "TypeScript + Hono",
  description: "External API gateway",
  layer: "Application"
}

// From basic-wrangler
{
  id: "bond-math-gateway",
  name: "bond-math-gateway",
  type: "Cloudflare Worker",
  technology: "TypeScript",
  tags: ["cloudflare-worker"]
}

// Merged result
{
  id: "bond-math-gateway",
  name: "@bond-math/gateway",                    // Prefer package.json name
  type: "Cloudflare Worker",                     // More specific
  technology: "TypeScript + Hono on Cloudflare", // Combine
  description: "External API gateway",           // From code (more detailed)
  layer: "Application",
  tags: ["cloudflare-worker"],
  sources: ["basic-node", "basic-wrangler"]      // Track provenance
}
```

**Merge Rules**:

- **ID**: Must match (deduplication key)
- **Name**: Prefer package.json name (more semantic) over wrangler name
- **Type**: Prefer more specific type (IaC typically more specific)
- **Technology**: Combine both (e.g., "TypeScript + Hono on Cloudflare")
- **Description**: Prefer longer/richer description, or combine with " | " separator
- **Layer**: Keep if present
- **Tags**: Union of all tags from both sources

---

### 2. Components

**Strategy**: Code-only, no deduplication needed

Components only come from code extractors (basic-node). IaC extractors don't produce components.

**Action**: Keep all components as-is.

---

### 3. Code Items

**Strategy**: Code-only, no deduplication needed

Code items only come from code extractors. IaC extractors don't analyze code.

**Action**: Keep all code items as-is.

---

### 4. Deployments

**Strategy**: IaC-only, no deduplication needed

Deployments only come from IaC extractors (basic-wrangler). Code extractors don't know about deployment topology.

**Action**: Keep all deployments as-is.

---

### 5. Container Relationships (Logical)

**Strategy**: Merge by source+destination, combine metadata

```typescript
// From basic-node (inferred from code)
{
  source: "bond-math-gateway",
  destination: "bond-math-daycount",
  description: "HTTP call to daycount service",
  technology: "fetch API",
  tags: ["code-inferred"]
}

// From basic-wrangler (declared in IaC)
{
  source: "bond-math-gateway",
  destination: "bond-math-daycount",
  description: "Internal service call via SVC_DAYCOUNT",
  technology: "HTTP/RPC",
  tags: ["service-binding"]
}

// Merged result
{
  source: "bond-math-gateway",
  destination: "bond-math-daycount",
  description: "HTTP call to daycount service | Internal service call via SVC_DAYCOUNT",
  technology: "HTTP/RPC",
  tags: ["code-inferred", "service-binding", "verified"],  // 'verified' = both sources agree
  sources: ["basic-node", "basic-wrangler"],
  confidence: "high"  // Both code and IaC confirm this relationship
}
```

**Merge Rules**:

- **Deduplication key**: `source + destination + stereotype`
- **Description**: Combine with " | " separator if both present
- **Technology**: Prefer IaC (more authoritative for deployment)
- **Tags**: Union of all tags, plus add `verified` if from multiple sources
- **Confidence**: Add metadata indicating sources agree

**Special case**: If relationship appears in code but NOT in IaC:

```typescript
{
  tags: ["code-inferred", "unverified"],
  confidence: "medium"  // Code sees it, but IaC doesn't declare it
}
```

**Special case**: If relationship appears in IaC but NOT in code:

```typescript
{
  tags: ["service-binding", "unused"],
  confidence: "low"  // IaC declares it, but code doesn't use it (potential dead config)
}
```

---

### 6. Component Relationships

**Strategy**: Code-only, no deduplication needed

Component relationships only come from code extractors.

**Action**: Keep all component relationships as-is.

---

### 7. Deployment Relationships (Physical)

**Strategy**: IaC-only, no deduplication needed

Deployment relationships only come from IaC extractors.

**Action**: Keep all deployment relationships as-is.

---

## Aggregator Implementation

### Current aggregator.ts

```typescript
export function aggregateIRs(irs: ArchletteIR[]): ArchletteIR {
  // Current: Simple deduplication by ID
  const containers = deduplicateById(irs.flatMap((ir) => ir.containers));
  const components = deduplicateById(irs.flatMap((ir) => ir.components));
  // ...
}
```

### Enhanced aggregator.ts

```typescript
export function aggregateIRs(irs: ArchletteIR[]): ArchletteIR {
  // Track sources for provenance
  const irSources = irs.map((ir, idx) => ({ ir, source: `extractor-${idx}` }));

  // CONTAINERS: Smart merge
  const containers = mergeContainers(
    irSources.flatMap(({ ir, source }) =>
      ir.containers.map((c) => ({ ...c, _source: source })),
    ),
  );

  // COMPONENTS: Code-only (no merge needed)
  const components = deduplicateById(irs.flatMap((ir) => ir.components));

  // CODE: Code-only (no merge needed)
  const code = deduplicateById(irs.flatMap((ir) => ir.code));

  // DEPLOYMENTS: IaC-only (no merge needed)
  const deployments = irs.flatMap((ir) => ir.deployments);

  // CONTAINER RELATIONSHIPS: Smart merge with verification
  const containerRelationships = mergeRelationships(
    irSources.flatMap(({ ir, source }) =>
      ir.containerRelationships.map((r) => ({ ...r, _source: source })),
    ),
  );

  // COMPONENT RELATIONSHIPS: Code-only (no merge needed)
  const componentRelationships = deduplicateRelationships(
    irs.flatMap((ir) => ir.componentRelationships),
  );

  // DEPLOYMENT RELATIONSHIPS: IaC-only (no merge needed)
  const deploymentRelationships = irs.flatMap((ir) => ir.deploymentRelationships);

  return {
    version: base.version,
    system: base.system,
    actors,
    containers,
    components,
    code,
    deployments,
    containerRelationships,
    componentRelationships,
    codeRelationships,
    deploymentRelationships,
  };
}
```

### New merge functions

```typescript
/**
 * Merge containers by ID, combining metadata from all sources
 */
function mergeContainers(containers: ContainerWithSource[]): Container[] {
  const grouped = new Map<string, ContainerWithSource[]>();

  for (const container of containers) {
    if (!grouped.has(container.id)) {
      grouped.set(container.id, []);
    }
    grouped.get(container.id)!.push(container);
  }

  return Array.from(grouped.values()).map((group) => {
    if (group.length === 1) {
      return group[0];
    }

    // Multiple sources for same container - merge them
    const merged: Container = {
      id: group[0].id,
      name: group.find((c) => c._source === 'basic-node')?.name || group[0].name,
      type: group.find((c) => c.type?.includes('Worker'))?.type || group[0].type,
      technology: group
        .map((c) => c.technology)
        .filter(Boolean)
        .join(' on '),
      description: mergeDescriptions(group.map((c) => c.description)),
      layer: group.find((c) => c.layer)?.layer,
      tags: [...new Set(group.flatMap((c) => c.tags || []))],
    };

    return merged;
  });
}

/**
 * Merge relationships, tracking sources and adding verification tags
 */
function mergeRelationships(relationships: RelationshipWithSource[]): Relationship[] {
  const grouped = new Map<string, RelationshipWithSource[]>();

  for (const rel of relationships) {
    const key = `${rel.source}::${rel.destination}::${rel.stereotype || ''}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(rel);
  }

  return Array.from(grouped.values()).map((group) => {
    if (group.length === 1) {
      const rel = group[0];
      // Single source - tag accordingly
      if (rel._source?.includes('node')) {
        rel.tags = [...(rel.tags || []), 'code-inferred', 'unverified'];
      } else if (rel._source?.includes('wrangler')) {
        rel.tags = [...(rel.tags || []), 'service-binding', 'unused'];
      }
      return rel;
    }

    // Multiple sources - merge and mark as verified
    const merged: Relationship = {
      source: group[0].source,
      destination: group[0].destination,
      description: mergeDescriptions(group.map((r) => r.description)),
      technology:
        group.find((r) => r._source?.includes('wrangler'))?.technology ||
        group[0].technology,
      stereotype: group[0].stereotype,
      tags: [...new Set(group.flatMap((r) => r.tags || [])), 'verified'],
    };

    return merged;
  });
}

/**
 * Merge descriptions from multiple sources
 */
function mergeDescriptions(descriptions: (string | undefined)[]): string | undefined {
  const unique = [...new Set(descriptions.filter(Boolean))];
  return unique.length > 0 ? unique.join(' | ') : undefined;
}
```

---

## Recommended Extractor Combinations

### Scenario 1: Code + IaC (Most Complete)

```yaml
extractors:
  # Extract code structure
  - use: extractors/builtin/basic-node
    inputs:
      include:
        - C:/Users/chris/git/bond-math/services/gateway/src/**/*.ts
        - C:/Users/chris/git/bond-math/services/daycount/src/**/*.ts

  # Extract deployment topology
  - use: extractors/builtin/basic-wrangler
    inputs:
      include:
        - C:/Users/chris/git/bond-math/iac/workers/gateway.toml
        - C:/Users/chris/git/bond-math/iac/workers/daycount.toml
```

**Result**:

- ✅ Complete containers (name from code, type from IaC)
- ✅ Code structure (components, functions)
- ✅ Deployment topology (environments, instances)
- ✅ Verified relationships (both sources agree)

---

### Scenario 2: Code Only

```yaml
extractors:
  - use: extractors/builtin/basic-node
    inputs:
      include:
        - C:/Users/chris/git/bond-math/services/**/*.ts
```

**Result**:

- ✅ Containers from package.json
- ✅ Code structure
- ❌ No deployment details
- ⚠️ Relationships tagged as `code-inferred`, `unverified`

---

### Scenario 3: IaC Only

```yaml
extractors:
  - use: extractors/builtin/basic-wrangler
    inputs:
      include:
        - C:/Users/chris/git/bond-math/iac/workers/*.toml
```

**Result**:

- ✅ Containers from wrangler.toml
- ✅ Deployment topology
- ❌ No code structure
- ⚠️ Relationships tagged as `service-binding`, `unused` (not verified by code)

---

## Benefits of This Strategy

1. **Completeness**: Union of all information from all extractors
2. **Verification**: Relationships confirmed by multiple sources are tagged as `verified`
3. **Quality signals**: Can detect discrepancies:
   - IaC declares binding that code doesn't use (dead config)
   - Code uses service that IaC doesn't declare (missing binding)
4. **Flexibility**: Works with any combination of extractors
5. **Provenance**: Track which extractor contributed what
6. **No information loss**: Combine descriptions rather than replace

---

## Future Enhancements

1. **Conflict detection**: Warn when code and IaC disagree (e.g., different relationship types)
2. **Confidence scoring**: Weight relationships based on number of sources
3. **Missing binding warnings**: Alert when code references a binding not in wrangler.toml
4. **Dead config warnings**: Alert when wrangler.toml has bindings not used in code
5. **Extractor priority**: Allow users to specify which extractor "wins" for specific fields

---

_This strategy ensures that running multiple extractors produces a richer, more accurate architecture model than any single extractor alone._
