# Basic Node Extractor

**Extract architecture from TypeScript and JavaScript codebases.**

The `basic-node` extractor analyzes your code's JSDoc annotations to discover components, actors, and relationships. No framework lock-in. No runtime overhead. Just annotations.

---

## What It Extracts

**From JSDoc annotations:**

- 🔹 **Components** — Logical modules and services (`@module`, `@component`, `@namespace`)
- 🔹 **Actors** — Users and external systems (`@actor`)
- 🔹 **Relationships** — Dependencies between components (`@uses`)
- 🔹 **Code Elements** — Classes and functions (detected automatically)

---

## Configuration

### Basic Setup

```yaml
extractors:
  - use: extractors/builtin/basic-node
    inputs:
      include: ['src/**/*.ts']
      exclude: ['**/*.test.ts']
```

### Advanced Setup

```yaml
extractors:
  - use: extractors/builtin/basic-node
    name: api-service # Optional: names this container
    inputs:
      include:
        - 'src/**/*.ts'
        - 'src/**/*.tsx'
        - 'lib/**/*.js'
      exclude:
        - '**/*.test.ts'
        - '**/*.spec.ts'
        - '**/*.stories.tsx'
        - '**/node_modules/**'
        - '**/mocks/**'
```

**Glob patterns use [minimatch](https://github.com/isaacs/minimatch) syntax.**

---

## Annotations Reference

### Component Tags

**Mark a file as a component:**

```typescript
/**
 * @module UserService
 * User authentication and management
 */
```

**Also supports:**

- `@component ComponentName` — Custom tag for components
- `@namespace NamespaceName` — Standard JSDoc namespace tag

**Priority:** `@component` > `@module` > `@namespace`

**What gets extracted:**

- Component with normalized ID (`user-service`)
- Description from JSDoc comment
- All classes/functions in the file linked to this component

→ [Component detection details](component-detection.md)

---

### Actor Tags

**Declare external actors:**

```typescript
/**
 * @module PaymentService
 * @actor User {Person} {in} Customer making purchases
 * @actor StripeAPI {System} {out} Payment processing service
 */
```

**Format:**

```
@actor ActorName {Person|System} {in|out} Description
```

**Direction:**

- `{in}` — Actor uses this component (user, client)
- `{out}` — This component uses actor (external API, service)

**Relationships created automatically:**

- Actor ↔ Component (bidirectional)

---

### Relationship Tags

**Declare dependencies:**

```typescript
/**
 * @module OrderService
 * @uses PaymentService Processes payments
 * @uses InventoryService Checks stock availability
 * @uses NotificationService Sends order confirmations
 */
```

**Format:**

```
@uses TargetComponent Description
```

**Creates:** Component → Component relationship

---

## Complete Example

```typescript
/**
 * Payment processing service
 *
 * @module PaymentService
 * @description Handles credit card transactions and refunds
 *
 * @actor Customer {Person} {in} End user making purchases
 * @actor StripeAPI {System} {out} Third-party payment processor
 * @actor AdminUser {Person} {in} Admin processing refunds
 *
 * @uses Database Stores transaction records
 * @uses NotificationService Sends payment confirmations
 * @uses AuditLog Records payment activities
 */

export class PaymentProcessor {
  async processPayment(order: Order): Promise<Result> {
    // Implementation
  }

  async refund(transactionId: string): Promise<Result> {
    // Implementation
  }
}

export function validateCard(cardNumber: string): boolean {
  // Implementation
}

export function formatAmount(cents: number): string {
  // Implementation
}
```

**Extracted:**

- ✅ 1 Component: `PaymentService`
- ✅ 3 Actors: `Customer`, `StripeAPI`, `AdminUser`
- ✅ 3 Relationships: PaymentService → Database, NotificationService, AuditLog
- ✅ 6 Actor relationships (bidirectional)
- ✅ 3 Code elements: `PaymentProcessor` class, `validateCard` function, `formatAmount` function

---

## Component ID Generation

**Component names normalize to IDs:**

| Component Name    | Component ID      |
| ----------------- | ----------------- |
| `UserService`     | `userservice`     |
| `Payment Service` | `payment-service` |
| `auth/oauth`      | `auth-oauth`      |
| `API_Gateway`     | `api-gateway`     |

**Rules:**

- Lowercase
- Spaces/slashes → dashes
- Remove special characters
- Collapse multiple dashes

---

## Code Detection

**Automatically extracts:**

- ✅ Class declarations
- ✅ Function declarations (`function foo() {}`)
- ⚠️ Const/arrow functions limited (known limitation)

**Example:**

```typescript
/**
 * @module Utils
 */

// ✅ Extracted
export class StringHelper {
  format() {}
}

// ✅ Extracted
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ⚠️ Not currently extracted
export const lowercase = (str: string) => str.toLowerCase();
```

---

## Multi-File Components

**Multiple files can share the same component:**

```typescript
// src/auth/login.ts
/**
 * @module Authentication
 */
export function login() {}

// src/auth/logout.ts
/**
 * @module Authentication
 */
export function logout() {}

// src/auth/session.ts
/**
 * @module Authentication
 */
export class SessionManager {}
```

**Result:** 1 component with 3 code elements.

---

## Files Without Annotations

**Files without JSDoc tags still have code extracted:**

```typescript
// src/utils/helpers.ts
export function formatDate(date: Date): string {
  return date.toISOString();
}
```

**Result:**

- Code element extracted
- No component created
- `componentId` is undefined

**Tip:** Add `@module` tags to organize code into components.

---

## Monorepo Configuration

**Extract multiple packages:**

```yaml
extractors:
  # API Service
  - use: extractors/builtin/basic-node
    name: api-service
    inputs:
      include: ['packages/api/src/**/*.ts']

  # Web App
  - use: extractors/builtin/basic-node
    name: web-app
    inputs:
      include: ['packages/web/src/**/*.tsx']

  # Shared Library
  - use: extractors/builtin/basic-node
    name: shared-lib
    inputs:
      include: ['packages/shared/**/*.ts']
```

**Each extractor becomes a separate container.**

---

## Best Practices

### ✅ Do

- **Annotate entry points** — Put `@module` tags on main files
- **Use descriptive names** — `UserAuthenticationService` better than `Service1`
- **Document actors** — Clarify who/what interacts with your system
- **Declare dependencies** — Use `@uses` to show relationships
- **Keep annotations current** — Update JSDoc when architecture changes

### ❌ Don't

- **Over-annotate** — Not every file needs `@module`
- **Duplicate tags** — One `@module` per file
- **Mix annotation styles** — Pick `@module` or `@component`, stay consistent
- **Forget direction** — Use `{in}` and `{out}` on actor tags

---

## Troubleshooting

### Components Not Showing Up

**Check:**

1. File has JSDoc comment at the top
2. Comment includes `@module`, `@component`, or `@namespace`
3. File matches `include` patterns
4. File doesn't match `exclude` patterns

### Relationships Missing

**Check:**

1. Target component exists (typos in `@uses` tag)
2. JSDoc comment is above module-level, not inside functions
3. Format is correct: `@uses TargetName Description`

### Code Elements Missing

**Check:**

1. Using function declarations, not arrow functions
2. Classes are exported or at top level
3. Files are included in `include` patterns

---

## What's Next?

**Combine with infrastructure:**

- [Basic Wrangler](basic-wrangler.md) — Add deployment topology
- [Configuration Guide](../guide/configuration.md) — Advanced options

**Enhance annotations:**

- [Annotations Reference](../guide/annotations.md) — All supported tags
- [Component Detection](component-detection.md) — Deep dive into detection logic

**Extend Archlette:**

- [Plugin Development](../plugins/extractors.md) — Build custom extractors
