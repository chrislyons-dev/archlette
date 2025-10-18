# Monorepo Support Implementation Status

## Completed ✅

### 1. System-Level Config (DONE)

**Branch**: `3-cloudflare-wrangler-extractor`
**Commit**: `fa42539`

**What was implemented**:

- Added `system` section to archlette.yaml schema with `name`, `description`, `repository` fields
- Added `description` and `repository` to `project` section for backward compatibility
- Extended `ResolvedStageNode` to include `_system` field
- Updated `resolveConfig()` to pass system info through to extractors

**Files modified**:

- `src/core/types-aac.ts` - Schema updates

**How to use**:

```yaml
# archlette.yaml
system:
  name: bond-math
  description: Bond mathematics calculation service
  repository: https://github.com/chrislyons-dev/bond-math.git
```

---

### 2. Package Detection (DONE)

**Branch**: `3-cloudflare-wrangler-extractor`
**Commit**: `fa42539`

**What was implemented**:

- Added `PackageInfo` type to track package.json files
- Implemented `findPackageJsonFiles()` to discover packages from include patterns
- Implemented `readPackageInfo()` to parse package.json files
- Implemented `findNearestPackage()` to assign files to their parent package
- Extended `FileExtraction` to include `packageInfo` field
- Updated `basic-node.ts` to detect packages and assign files
- Updated `mapToIR()` signature to accept `packages` and `systemInfo`

**Files modified**:

- `src/extractors/builtin/basic-node/types.ts` - Added PackageInfo
- `src/extractors/builtin/basic-node/file-finder.ts` - Added package detection functions
- `src/extractors/builtin/basic-node.ts` - Integrated package detection
- `src/extractors/builtin/basic-node/to-ir-mapper.ts` - Updated signature

**How it works**:

```typescript
// Detects package.json from include patterns
include: ['C:/foo/services/gateway/src/**/*.ts']
→ searches: C:/foo/services/gateway/package.json

// Assigns files to nearest parent package
file: C:/foo/services/gateway/src/logger.ts
→ packageInfo: { name: '@bond-math/gateway', dir: 'C:/foo/services/gateway' }
```

---

## In Progress 🚧

### 3. Hierarchical IDs (TODO)

**Target**: Same branch (`3-cloudflare-wrangler-extractor`)

**What needs to be implemented**:
Apply `x::y::z` pattern to all IDs:

- Container: `x` (e.g., `bond-math-gateway`)
- Component: `x::y` (e.g., `bond-math-gateway::logger`)
- Code: `x::y::z` (e.g., `bond-math-gateway::logger::createLogger`)

**Files to modify**:

- `src/extractors/builtin/basic-node/to-ir-mapper.ts` - Main implementation

---

## Implementation Plan: Hierarchical IDs

### File: `src/extractors/builtin/basic-node/to-ir-mapper.ts`

The `mapToIR()` function currently:

1. ✅ Receives `packages` and `systemInfo` parameters
2. ✅ Has access to all file extractions with `packageInfo`
3. ❌ Does NOT create containers from packages
4. ❌ Does NOT apply hierarchical IDs

### Step-by-Step Implementation

#### Step 1: Create Containers from Packages

After component deduplication (around line 165), add:

```typescript
// Create containers from packages
const containers: Container[] = [];
const componentIdMap = new Map<string, string>(); // old ID -> new ID

if (packages && packages.length > 0) {
  // Create one container per package
  for (const pkg of packages) {
    const containerId = nameToId(pkg.name);
    containers.push({
      id: containerId,
      name: pkg.name,
      type: 'Service',
      layer: 'Application',
      description: pkg.description || `Service: ${pkg.name}`,
      tags: [TAGS.AUTO_GENERATED],
    });
  }
}
```

#### Step 2: Apply Hierarchical IDs to Components

```typescript
// Apply hierarchical IDs to components: container::component
for (const component of components) {
  const fileWithComponent = extractions.find((e) => e.component?.id === component.id);
  if (fileWithComponent?.packageInfo) {
    const pkg = fileWithComponent.packageInfo;
    const containerId = nameToId(pkg.name);

    const oldId = component.id;
    component.containerId = containerId;
    component.id = `${containerId}::${oldId}`;
    componentIdMap.set(oldId, component.id);
  }
}
```

#### Step 3: Update Code Item componentId References

```typescript
// Update code items: componentId must match new hierarchical component IDs
for (const codeItem of codeItems) {
  if (codeItem.componentId && componentIdMap.has(codeItem.componentId)) {
    codeItem.componentId = componentIdMap.get(codeItem.componentId);
  }
}
```

#### Step 4: Apply Hierarchical IDs to Code Items

```typescript
// Apply hierarchical IDs to code items: container::component::code
for (const codeItem of codeItems) {
  if (codeItem.componentId) {
    // Extract code name from current ID (usually filename:functionname)
    const parts = codeItem.id.split(':');
    const codeName = parts[parts.length - 1] || codeItem.name;

    // Build hierarchical ID: container::component::code
    codeItem.id = `${codeItem.componentId}::${codeName}`;

    // Update name for display: component::code
    const component = components.find((c) => c.id === codeItem.componentId);
    if (component) {
      // Extract component name without container prefix
      const componentName = component.name;
      codeItem.name = `${componentName}::${codeName}`;
    }
  }
}
```

#### Step 5: Handle Components Without Package

```typescript
// Handle components without packageInfo (orphans)
const orphanComponents = components.filter((c) => !c.containerId);
if (orphanComponents.length > 0) {
  const defaultContainer: Container = {
    id: DEFAULT_CONTAINER_ID,
    name: systemInfo?.name || 'Application',
    type: 'Application',
    layer: 'Application',
    description: systemInfo?.description || 'Main application container',
    tags: [TAGS.AUTO_GENERATED],
  };
  containers.push(defaultContainer);

  for (const component of orphanComponents) {
    component.containerId = DEFAULT_CONTAINER_ID;
    // Apply same hierarchical ID pattern
    const oldId = component.id;
    component.id = `${DEFAULT_CONTAINER_ID}::${oldId}`;
    componentIdMap.set(oldId, component.id);
  }
}
```

#### Step 6: System Info Priority

```typescript
// Determine system info
// Priority: 1) provided systemInfo, 2) first container, 3) default
let system: System;
if (systemInfo) {
  system = systemInfo;
} else if (containers.length > 0) {
  const firstContainer = containers[0];
  system = {
    name: firstContainer.name,
    description: firstContainer.description,
  };
} else {
  system = getDefaultSystem();
}
```

#### Step 7: Return Updated IR

```typescript
return {
  version: IR_VERSION,
  system,
  actors,
  containers, // Now populated!
  components, // With hierarchical IDs!
  code: codeItems, // With hierarchical IDs!
  deployments: [],
  containerRelationships: [],
  componentRelationships: uniqueComponentRelationships,
  codeRelationships: relationships,
};
```

---

## Expected Behavior After Implementation

### Example: bond-math Monorepo

**Input**:

- 2 package.json files: `@bond-math/gateway`, `@bond-math/daycount`
- Both have `logger.ts` with `createLogger` function

**Before (Current)**:

```typescript
{
  containers: [],  // Empty!
  components: [
    { id: "logger", name: "logger" }  // Only one! (deduplicated)
  ],
  code: [
    { id: "gateway/src/logger.ts:createLogger", name: "createLogger" },
    { id: "daycount/src/logger.ts:createLogger", name: "createLogger" }
  ]
}
```

→ **Problem**: Component collision, no container info

**After (With Hierarchical IDs)**:

```typescript
{
  containers: [
    { id: "bond-math-gateway", name: "@bond-math/gateway" },
    { id: "bond-math-daycount", name: "@bond-math/daycount" }
  ],
  components: [
    { id: "bond-math-gateway::logger", name: "logger", containerId: "bond-math-gateway" },
    { id: "bond-math-daycount::logger", name: "logger", containerId: "bond-math-daycount" }
  ],
  code: [
    {
      id: "bond-math-gateway::logger::createLogger",
      name: "logger::createLogger",
      componentId: "bond-math-gateway::logger"
    },
    {
      id: "bond-math-daycount::logger::createLogger",
      name: "logger::createLogger",
      componentId: "bond-math-daycount::logger"
    }
  ]
}
```

→ **Solution**: All IDs unique, containers populated, ready for Structurizr DSL

---

## Testing Plan

### Test Case 1: Single Package

```bash
# Create test with single package.json
services/api/package.json: { "name": "api" }
services/api/src/logger.ts

# Expected output:
Container: { id: "api", name: "api" }
Component: { id: "api::logger", name: "logger" }
Code: { id: "api::logger::createLogger", name: "logger::createLogger" }
```

### Test Case 2: Monorepo (bond-math)

```bash
# Use real bond-math repo
cd bond-math
npm run aac:extract

# Expected:
- 2 containers (gateway, daycount)
- Distinct components with hierarchical IDs
- No Structurizr DSL errors
```

### Test Case 3: No package.json

```bash
# No package.json files found

# Expected:
Container: { id: "default", name: "<from systemInfo or 'Application'>" }
Component: { id: "default::logger", name: "logger" }
```

---

## Next Session Tasks

1. ✅ Review this implementation plan
2. 🚧 Implement Steps 1-7 in `to-ir-mapper.ts`
3. 🚧 Run typecheck
4. 🚧 Test with bond-math
5. 🚧 Verify Structurizr DSL generation works
6. 🚧 Commit hierarchical IDs implementation
7. 🚧 Move to wrangler deployment extraction or smart aggregation

---

## Notes

- **Container type logic**: If package.json exists, use `"Service"`. Could be enhanced later to detect type from package.json (e.g., `"types": "module"` → different type)
- **Name vs ID**: Container ID uses `nameToId()` for safe identifier (e.g., `@bond-math/gateway` → `bond-math-gateway`), but name stays as package name
- **Code item names**: Using `component::code` pattern for display clarity in diagrams
- **Backward compat**: Still works if `packages` is undefined/empty (uses default container)

---

_Status as of session end. Ready to implement hierarchical IDs in next session._
