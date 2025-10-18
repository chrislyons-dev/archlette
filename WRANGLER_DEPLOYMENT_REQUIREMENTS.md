# Cloudflare Wrangler Deployment Requirements

## Overview

The basic-wrangler extractor should extract **everything it can from wrangler.toml files** in isolation, without assuming other extractors will fill in gaps. It focuses on **IaC-based deployment topology** rather than code analysis.

---

## Core Principles

1. **Self-sufficient**: Extract containers, deployments, and relationships from wrangler.toml alone
2. **Deployment-focused**: Emphasis on physical deployment topology (environments, instances, bindings)
3. **Simple IDs**: Use `environment::service` pattern, not deep hierarchies
4. **Both relationship levels**: Capture logical (container-to-container) AND physical (instance-to-instance)
5. **Platform as metadata**: "Cloudflare Edge" is a property/tag, not part of ID hierarchy

---

## What to Extract

### 1. Containers (Logical Layer)

Create one container per wrangler.toml file:

```typescript
{
  id: "bond-math-gateway",           // from wrangler.name
  name: "bond-math-gateway",
  type: "Cloudflare Worker",
  technology: "TypeScript",           // inferred from main file extension
  layer: "Application",
  tags: ["cloudflare-worker"]
}
```

**Source**: `name` and `main` fields from wrangler.toml

---

### 2. Deployments (Physical Layer)

Create one deployment per environment defined in wrangler.toml:

```typescript
{
  name: "production",                 // environment name
  environment: "production",
  platform: "Cloudflare Edge",        // metadata, not hierarchy
  instances: ContainerInstance[]      // see below
}
```

**Environments to extract**:

- Root level (implicitly "production")
- `env.development`
- `env.preview`
- `env.production`
- Any other `env.*` sections

---

### 3. Container Instances

For each environment, create instances:

```typescript
{
  id: "production::gateway",          // Simple: {environment}::{service}
  containerRef: "bond-math-gateway",  // References logical container
  name: "bond-math-gateway",          // from wrangler.name (or env override)
  type: "worker",
  bindings: [
    {
      type: "service",
      binding: "SVC_DAYCOUNT",
      service: "bond-math-daycount",
      environment: "production"
    },
    // ... other bindings
  ],
  vars: {                             // from [vars]
    "INTERNAL_JWT_TTL": "90"
  },
  routes: [],                         // from routes (if uncommented)
  triggers: [],                       // from triggers.crons
  tags: ["cloudflare-worker"]
}
```

**Instance metadata includes**:

- **bindings**: All service bindings, KV, R2, D1, Durable Objects from that environment
- **vars**: Environment variables (non-sensitive)
- **routes**: HTTP routes (if defined)
- **triggers**: Cron schedules (if defined)
- **observability**: Observability settings (if defined)

---

### 4. Logical Relationships (Container Level)

From service bindings, create container-to-container relationships:

```typescript
{
  source: "bond-math-gateway",
  destination: "bond-math-daycount",
  description: "Internal service call via SVC_DAYCOUNT",
  technology: "HTTP/RPC",
  tags: ["service-binding"]
}
```

**Deduplication**: If gateway has SVC_DAYCOUNT in production, development, and preview, create **one** logical relationship.

---

### 5. Deployment Relationships (Instance Level)

From service bindings in each environment, create instance-to-instance relationships:

```typescript
{
  source: "production::gateway",
  destination: "production::daycount",
  binding: "SVC_DAYCOUNT",
  technology: "HTTP",
  tags: ["service-binding", "production"]
}
```

**Create one relationship per environment** where the binding is defined.

---

## IR Schema Changes Required

### Add to `types-ir.ts`:

```typescript
// New: Container Instance type
export const zContainerInstance = zWithMeta.extend({
  id: z.string(), // e.g., "production::gateway"
  containerRef: z.string(), // References Container.id
  name: z.string().optional(), // Instance-specific name override
  type: z.string().optional(), // e.g., "worker"
  bindings: z
    .array(
      z.object({
        type: z.string(), // "service", "kv", "r2", "d1", "durable_object"
        binding: z.string(), // Variable name in code
        service: z.string().optional(), // For service bindings
        environment: z.string().optional(),
        // ... other binding-specific fields
      }),
    )
    .optional(),
  vars: z.record(z.string()).optional(),
  routes: z.array(z.string()).optional(),
  triggers: z.array(z.any()).optional(),
  observability: z.any().optional(),
});
export type ContainerInstance = z.infer<typeof zContainerInstance>;

// Enhanced: Deployment type
export const zDeployment = zWithMeta.extend({
  name: z.string(),
  environment: z.string(),
  platform: z.string().optional(), // e.g., "Cloudflare Edge"
  instances: z.array(zContainerInstance).optional(),
});
export type Deployment = z.infer<typeof zDeployment>;

// Add to ArchletteIR:
export const zArchletteIR = z.object({
  // ... existing fields
  deployments: z.array(zDeployment),
  deploymentRelationships: z.array(zRelationship), // NEW
});
```

---

## Example: gateway.toml + daycount.toml

### Input Files

**gateway.toml**:

- `name = "bond-math-gateway"`
- `main = "../../services/gateway/src/index.ts"`
- Service bindings: SVC_DAYCOUNT, SVC_VALUATION, SVC_METRICS, SVC_PRICING
- Environments: root (production), development, preview

**daycount.toml**:

- `name = "bond-math-daycount"`
- `main = "../../services/daycount/src/index.ts"`
- No service bindings
- Environments: production, dev, preview

### Output IR

```typescript
{
  containers: [
    { id: "bond-math-gateway", name: "bond-math-gateway", type: "Cloudflare Worker" },
    { id: "bond-math-daycount", name: "bond-math-daycount", type: "Cloudflare Worker" }
  ],

  containerRelationships: [
    {
      source: "bond-math-gateway",
      destination: "bond-math-daycount",
      description: "Internal service call via SVC_DAYCOUNT",
      tags: ["service-binding"]
    }
    // Note: Only ONE relationship for daycount, even though it appears in 3 environments
  ],

  deployments: [
    {
      name: "production",
      environment: "production",
      platform: "Cloudflare Edge",
      instances: [
        {
          id: "production::gateway",
          containerRef: "bond-math-gateway",
          name: "bond-math-gateway",
          bindings: [
            { type: "service", binding: "SVC_DAYCOUNT", service: "bond-math-daycount", environment: "production" }
          ]
        },
        {
          id: "production::daycount",
          containerRef: "bond-math-daycount",
          name: "bond-math-daycount",
          bindings: []
        }
      ]
    },
    {
      name: "development",
      environment: "development",
      platform: "Cloudflare Edge",
      instances: [
        {
          id: "development::gateway",
          containerRef: "bond-math-gateway",
          name: "bond-math-gateway-dev",
          bindings: [
            { type: "service", binding: "SVC_DAYCOUNT", service: "bond-math-daycount", environment: "development" }
          ]
        },
        {
          id: "development::daycount",
          containerRef: "bond-math-daycount",
          name: "bond-math-daycount-dev",
          bindings: []
        }
      ]
    }
    // ... preview environment similar
  ],

  deploymentRelationships: [
    {
      source: "production::gateway",
      destination: "production::daycount",
      binding: "SVC_DAYCOUNT",
      tags: ["service-binding", "production"]
    },
    {
      source: "development::gateway",
      destination: "development::daycount",
      binding: "SVC_DAYCOUNT",
      tags: ["service-binding", "development"]
    }
    // ... preview relationship
  ]
}
```

---

## Open Questions & Decisions

### 1. Services Referenced But Not Found

Gateway references `bond-math-valuation`, `bond-math-metrics`, `bond-math-pricing` but we don't have wrangler.toml files for them.

**Decision**: Create container references and relationships anyway. This shows the architectural intent even if deployment details are incomplete.

```typescript
containers: [
  {
    id: 'bond-math-valuation',
    name: 'bond-math-valuation',
    type: 'Cloudflare Worker',
    tags: ['inferred'],
  },
];
```

### 2. Environment Name Normalization

Gateway uses `env.development`, daycount uses `env.dev`.

**Decision**:

- Extract environments exactly as named in wrangler.toml
- No normalization (keep `development` and `dev` separate)
- Generator/validator can warn about inconsistencies

### 3. Extract All Environments?

Should we extract all environments by default or make it configurable?

**Decision**: Extract all environments by default. Users can filter in archlette.yaml if needed (future enhancement).

### 4. Commented Configuration

Gateway has commented `routes` section.

**Decision**: Ignore commented configuration. Only extract active config.

### 5. Root Level as "production"?

Root-level configuration (outside `env.*`) typically means production.

**Decision**:

- If explicit `env.production` exists, use that
- If not, treat root level as "production" environment
- If root level AND `env.production` both exist, merge them (env.production overrides root)

---

## File Scanning Strategy

The extractor should accept:

1. **Single wrangler.toml**: Extract that one file
2. **Directory**: Scan for `**/wrangler.toml` or `**/*.toml` files
3. **Multiple files via config**: User specifies list of wrangler files

**Example archlette.yaml**:

```yaml
extractors:
  - use: extractors/builtin/basic-wrangler
    inputs:
      include:
        - C:/Users/chris/git/bond-math/iac/workers/gateway.toml
        - C:/Users/chris/git/bond-math/iac/workers/daycount.toml
```

---

## Success Criteria

After implementation, running basic-wrangler on gateway.toml + daycount.toml should produce:

✅ 2 containers (gateway, daycount)
✅ 4 additional containers for referenced services (valuation, metrics, pricing, plus any others)
✅ 3 deployments (production, development, preview)
✅ 6 container instances (2 per environment)
✅ 4 container relationships (gateway → daycount, valuation, metrics, pricing)
✅ 12 deployment relationships (4 bindings × 3 environments)
✅ All bindings, vars, and metadata captured per instance

---

## Next Steps

1. Update `types-ir.ts` with new schemas
2. Implement enhanced wrangler config parsing
3. Build deployment extraction logic
4. Update Structurizr generator to handle deploymentRelationships
5. Add tests with real bond-math wrangler files
6. Update documentation

---

_This document defines the requirements for enhancing basic-wrangler to extract complete deployment topology from Cloudflare Wrangler configurations._
