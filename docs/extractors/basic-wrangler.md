# Basic Wrangler Extractor

**Extract deployment topology from Cloudflare Workers configuration.**

The `basic-wrangler` extractor analyzes `wrangler.toml` files to discover Workers, environments, service bindings, and infrastructure dependencies. It captures **how your Workers deploy**, not just what code they contain.

---

## What It Extracts

**From wrangler.toml files:**

- 🔹 **Containers** — Cloudflare Workers as deployable units
- 🔹 **Deployments** — Environments (production, staging, preview)
- 🔹 **Container Instances** — Deployed instances per environment
- 🔹 **Service Bindings** — Worker-to-worker dependencies
- 🔹 **Infrastructure Bindings** — KV, R2, D1, Durable Objects, Queues
- 🔹 **Relationships** — Both logical (container→container) and physical (instance→instance)

---

## Configuration

### Basic Setup

```yaml
extractors:
  - use: extractors/builtin/basic-wrangler
    inputs:
      include: ['wrangler.toml']
```

### Multiple Workers

```yaml
extractors:
  - use: extractors/builtin/basic-wrangler
    inputs:
      include:
        - 'workers/gateway/wrangler.toml'
        - 'workers/api/wrangler.toml'
        - 'workers/auth/wrangler.toml'
```

### Monorepo Pattern

```yaml
extractors:
  - use: extractors/builtin/basic-wrangler
    inputs:
      include: ['iac/workers/**/*.toml']
      exclude: ['**/wrangler.dev.toml']
```

---

## What Gets Extracted

### Containers

**One per wrangler.toml file:**

```toml
# workers/gateway/wrangler.toml
name = "bond-math-gateway"
main = "src/index.ts"
compatibility_date = "2024-01-01"
```

**Becomes:**

```json
{
  "id": "bond-math-gateway",
  "name": "bond-math-gateway",
  "type": "Cloudflare Worker",
  "technology": "TypeScript",
  "layer": "Application",
  "tags": ["cloudflare-worker"]
}
```

---

### Deployments & Environments

**Extracts all environment configurations:**

```toml
# Root level = production
name = "gateway"
main = "src/index.ts"

[env.development]
name = "gateway-dev"

[env.preview]
name = "gateway-preview"
```

**Creates 3 deployments:**

- `production` (from root)
- `development`
- `preview`

---

### Service Bindings

**Worker-to-worker dependencies:**

```toml
[[services]]
binding = "SVC_DAYCOUNT"
service = "bond-math-daycount"
environment = "production"

[[services]]
binding = "SVC_PRICING"
service = "bond-math-pricing"
environment = "production"
```

**Creates:**

1. **Logical relationship:** gateway → daycount
2. **Logical relationship:** gateway → pricing
3. **Physical relationship:** production**gateway → production**daycount
4. **Physical relationship:** production**gateway → production**pricing

---

### Infrastructure Bindings

**KV Namespaces:**

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "abc123..."
```

**R2 Buckets:**

```toml
[[r2_buckets]]
binding = "DOCUMENTS"
bucket_name = "my-documents"
```

**D1 Databases:**

```toml
[[d1_databases]]
binding = "DB"
database_name = "production_db"
database_id = "xyz789..."
```

**Durable Objects:**

```toml
[[durable_objects.bindings]]
name = "RATE_LIMITER"
class_name = "RateLimiter"
script_name = "rate-limiter-worker"
```

**Queues:**

```toml
[[queues.producers]]
binding = "EVENTS"
queue = "event-queue"
```

All captured in container instance metadata.

---

## Environment Overrides

**Environment-specific configurations:**

```toml
name = "gateway"
main = "src/index.ts"

[vars]
API_URL = "https://api.prod.example.com"
TIMEOUT = "30"

[env.development]
name = "gateway-dev"
vars = { API_URL = "https://api.dev.example.com", TIMEOUT = "5" }

[env.preview]
vars = { API_URL = "https://api.preview.example.com" }
```

**Each environment instance gets correct vars:**

- `production__gateway` → `API_URL="https://api.prod...`, `TIMEOUT="30"`
- `development__gateway` → `API_URL="https://api.dev..."`, `TIMEOUT="5"`
- `preview__gateway` → `API_URL="https://api.preview..."`, `TIMEOUT="30"`

---

## Container Instance IDs

**Simple pattern:** `{environment}__{service}`

| Worker Name   | Environment | Instance ID            |
| ------------- | ----------- | ---------------------- |
| `gateway`     | production  | `production__gateway`  |
| `gateway`     | development | `development__gateway` |
| `daycount`    | production  | `production__daycount` |
| `pricing-api` | staging     | `staging__pricing-api` |

**Why this pattern?**

- Simple and predictable
- Easy to reference in other tools
- No deep hierarchies
- Scales to any number of services

---

## Complete Example

### wrangler.toml

```toml
name = "api-gateway"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
LOG_LEVEL = "info"
INTERNAL_JWT_TTL = "90"

[[services]]
binding = "SVC_AUTH"
service = "auth-service"
environment = "production"

[[services]]
binding = "SVC_DATA"
service = "data-service"
environment = "production"

[[kv_namespaces]]
binding = "CACHE"
id = "abc123..."

[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "user-uploads"

[env.development]
name = "api-gateway-dev"
vars = { LOG_LEVEL = "debug" }

[[env.development.services]]
binding = "SVC_AUTH"
service = "auth-service"
environment = "development"

[[env.development.services]]
binding = "SVC_DATA"
service = "data-service"
environment = "development"
```

### Extracted Architecture

**Containers (3):**

- `api-gateway` (Cloudflare Worker)
- `auth-service` (inferred from binding)
- `data-service` (inferred from binding)

**Deployments (2):**

- `production` with 3 instances
- `development` with 3 instances

**Container Instances (6):**

- `production__api-gateway` (with CACHE KV, UPLOADS R2, SVC_AUTH, SVC_DATA)
- `production__auth-service`
- `production__data-service`
- `development__api-gateway` (with SVC_AUTH, SVC_DATA)
- `development__auth-service`
- `development__data-service`

**Logical Relationships (2):**

- api-gateway → auth-service
- api-gateway → data-service

**Physical Relationships (4):**

- production**api-gateway → production**auth-service
- production**api-gateway → production**data-service
- development**api-gateway → development**auth-service
- development**api-gateway → development**data-service

---

## Combining with Code Analysis

**Use with basic-node for complete picture:**

```yaml
extractors:
  # Extract application code
  - use: extractors/builtin/basic-node
    inputs:
      include: ['src/**/*.ts']

  # Extract deployment topology
  - use: extractors/builtin/basic-wrangler
    inputs:
      include: ['wrangler.toml']
```

**Result:**

- Components and actors from code annotations
- Containers and deployments from wrangler config
- Complete logical + physical architecture

---

## Routes & Triggers

**HTTP Routes:**

```toml
routes = [
  { pattern = "api.example.com/*", zone_name = "example.com" }
]
```

**Cron Triggers:**

```toml
[triggers]
crons = ["0 0 * * *", "*/15 * * * *"]
```

Both captured in container instance metadata.

---

## Observability

**Logging and monitoring configuration:**

```toml
[observability]
enabled = true
head_sampling_rate = 0.1
```

Captured as instance metadata.

---

## Best Practices

### ✅ Do

- **Keep wrangler.toml files discoverable** — Use consistent naming
- **Document service bindings** — Clear binding names help diagrams
- **Use environment overrides** — Keep config DRY
- **Explicit environments** — Define all environments you deploy to
- **Combine with code analysis** — Use basic-node for complete view

### ❌ Don't

- **Spread configuration** — Keep related workers in discoverable locations
- **Use cryptic names** — `SVC_1` worse than `SVC_AUTH`
- **Forget includes** — Ensure patterns match your files
- **Mix production secrets** — basic-wrangler extracts vars (use secrets for sensitive data)

---

## Troubleshooting

### Workers Not Showing Up

**Check:**

1. wrangler.toml file has `name` field
2. File matches `include` patterns
3. File doesn't match `exclude` patterns
4. TOML syntax is valid

### Service Bindings Missing

**Check:**

1. Using `[[services]]` array syntax
2. `binding` and `service` fields present
3. Service name matches target worker's `name`

### Environments Not Created

**Check:**

1. Using `[env.environment_name]` syntax
2. Environment has deployable configuration (routes, vars, or bindings)
3. Root level has content (implies production environment)

---

## What's Next?

**Combine with code:**

- [Basic Node](basic-node.md) — Add application logic
- [Configuration Guide](../guide/configuration.md) — Advanced options

**Understand architecture:**

- [Cloudflare Requirements](../reqs/reqs-extractor-cloudflare-wrangler.md) — Technical spec

**Extend:**

- [Plugin Development](../plugins/extractors.md) — Custom extractors
