# System-Level Config & Hierarchical IDs

## Requirements

### 1. System-Level Configuration

Add a `system` section to the archlette.yaml spec with the following properties:

```yaml
system:
  name: string # System name
  description?: string # System description
  repository?: string # Repository URL
```

**Behavior**:

- If `system` is provided in archlette.yaml, use those values
- If `system` is NOT provided, generate from the first container processed:
  - `name` ← first container's name
  - `description` ← first container's description
  - `repository` ← undefined (or extract from first container's package.json if available)

**Example**:

```yaml
system:
  name: bond-math
  description: Bond mathematics calculation service with Cloudflare Workers
  repository: https://github.com/chrislyons-dev/bond-math.git

extractors:
  - use: extractors/builtin/basic-node
    inputs:
      include:
        - C:/Users/chris/git/bond-math/services/gateway/src/**/*.ts
        - C:/Users/chris/git/bond-math/services/daycount/src/**/*.ts
```

---

### 2. Hierarchical IDs

**ALWAYS** use hierarchical IDs, regardless of single-app or monorepo:

| Element   | ID Pattern | Example                                   |
| --------- | ---------- | ----------------------------------------- |
| Container | `x`        | `bond-math-gateway`                       |
| Component | `x::y`     | `bond-math-gateway::logger`               |
| Code      | `x::y::z`  | `bond-math-gateway::logger::createLogger` |

**Why**:

- **Prevents deduplication collisions** when IR aggregator merges multiple extractors
- **Ensures uniqueness** in Structurizr DSL
- **No conditional logic** - same pattern everywhere
- **Future-proof** - works for single apps, monorepos, distributed systems

**Example**:

```typescript
// Container
{
  id: "bond-math-gateway",
  name: "@bond-math/gateway",
  type: "Service"
}

// Component
{
  id: "bond-math-gateway::logger",
  name: "logger",
  containerId: "bond-math-gateway"
}

// Code
{
  id: "bond-math-gateway::logger::createLogger",
  name: "logger::createLogger",  // Prefixed for display clarity
  componentId: "bond-math-gateway::logger"
}
```

---

## Implementation Notes

### For basic-node Extractor

1. **Detect packages** via `package.json` files to determine container boundaries
2. **Create containers** - one per package.json found
3. **Apply hierarchical IDs**:
   - Components: `${containerId}::${componentName}`
   - Code items: `${componentId}::${codeName}`
4. **Update references**: When component IDs change, update `componentId` in code items

### Files to Modify

- `src/core/types-aac.ts` - Add `system` to config schema, add `_system` to `ResolvedStageNode`
- `src/extractors/builtin/basic-node/file-finder.ts` - Add package detection functions
- `src/extractors/builtin/basic-node/types.ts` - Add `PackageInfo` type and `packageInfo?` field
- `src/extractors/builtin/basic-node.ts` - Find packages, assign to files, pass to mapper
- `src/extractors/builtin/basic-node/to-ir-mapper.ts` - Create containers, apply hierarchical IDs

---

## Test Cases

### Single Package

```typescript
Input: 1 package.json at services/api/package.json
Expected:
  Container: { id: "api", name: "api" }
  Component: { id: "api::logger", name: "logger" }
  Code: { id: "api::logger::createLogger", name: "logger::createLogger" }
```

### Monorepo (bond-math)

```typescript
Input: 2 package.json files (gateway, daycount)
Expected:
  Container: { id: "bond-math-gateway", name: "@bond-math/gateway" }
  Container: { id: "bond-math-daycount", name: "@bond-math/daycount" }
  Component: { id: "bond-math-gateway::logger", name: "logger" }
  Component: { id: "bond-math-daycount::logger", name: "logger" }
  Code: { id: "bond-math-gateway::logger::createLogger", name: "logger::createLogger" }
  Code: { id: "bond-math-daycount::logger::createLogger", name: "logger::createLogger" }
```

### No package.json

```typescript
Input: 0 package.json files
Expected:
  Container: { id: "default", name: "Application" }
  Component: { id: "default::logger", name: "logger" }
  Code: { id: "default::logger::createLogger", name: "logger::createLogger" }
```
