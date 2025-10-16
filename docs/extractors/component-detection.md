# Component Detection in basic-node Extractor

The `basic-node` extractor can identify **Components** from JSDoc annotations in your TypeScript/JavaScript code.

## Supported JSDoc Tags

### `@component`

Custom tag for explicitly declaring components:

```typescript
/**
 * Payment processing functionality
 * @component Payment Processor
 */

export class PaymentService {
  process() {}
}

export function validatePayment() {}
```

### `@module`

Standard JSDoc tag for module documentation:

```typescript
/**
 * @module authentication/oauth
 * @description OAuth2 authentication module
 */

export function login() {}
export function logout() {}
```

### `@namespace`

Standard JSDoc tag for namespace documentation:

```typescript
/**
 * @namespace StringUtils
 * @description String manipulation utilities
 */

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

## How It Works

1. **File-Level Detection**: The extractor looks for JSDoc comments at the beginning of each file
2. **Tag Priority**: Checks for `@component`, `@module`, then `@namespace` (in that order)
3. **Component Creation**: Creates a Component in the ArchletteIR with:
   - `id`: Normalized version of the component name (lowercase, dashes for spaces/slashes)
   - `name`: The exact name from the JSDoc tag
   - `type`: Always set to `'module'`
   - `description`: Extracted from the JSDoc description (if provided)
4. **Code Association**: All code elements (classes, functions, methods) in that file are linked to the component via `componentId`
5. **Deduplication**: If multiple files declare the same component name, only one Component is created in the IR

## Examples

### Single Component

```typescript
// src/payments/processor.ts

/**
 * @component PaymentProcessor
 * @description Handles payment processing logic
 */

export class PaymentService {
  async process(order: Order): Promise<Result> {
    // implementation
  }
}

export function validateCard(card: Card): boolean {
  // implementation
}
```

**Result:**

- 1 Component: `PaymentProcessor` (id: `paymentprocessor`)
- 2 Code elements: `PaymentService` class and `validateCard` function
- Both code elements have `componentId: 'paymentprocessor'`

### Multiple Files, Same Component

```typescript
// src/auth/login.ts
/**
 * @component Authentication
 */
export function login() {}

// src/auth/logout.ts
/**
 * @component Authentication
 */
export function logout() {}

// src/auth/session.ts
/**
 * @component Authentication
 */
export class SessionManager {}
```

**Result:**

- 1 Component: `Authentication` (id: `authentication`)
- 3 Code elements: `login`, `logout`, `SessionManager`
- All have `componentId: 'authentication'`

### Files Without Component Tags

Files without JSDoc component tags still have their code extracted, but without a `componentId`:

```typescript
// src/utils/helpers.ts

export function formatDate(date: Date): string {
  return date.toISOString();
}
```

**Result:**

- 0 Components
- 1 Code element: `formatDate` function
- `componentId` is `undefined`

## Component ID Generation

Component IDs are normalized from the component name:

| Component Name         | Component ID           |
| ---------------------- | ---------------------- |
| `Payment Processor`    | `payment-processor`    |
| `authentication/oauth` | `authentication-oauth` |
| `StringUtils`          | `stringutils`          |
| `API Gateway`          | `api-gateway`          |

Rules:

- Convert to lowercase
- Replace spaces and slashes with dashes
- Remove non-alphanumeric characters (except dashes)
- Collapse multiple dashes
- Remove leading/trailing dashes

## Integration with Containers

Components require a `containerId` to link them to a Container. The `basic-node` extractor leaves `containerId` empty (empty string). This will be filled in by:

1. **IaC Extractors** (e.g., Terraform, Cloudflare Workers) that define containers
2. **Validators** that can infer or validate container relationships
3. **Manual configuration** in the AAC YAML file

## Configuration

No special configuration needed! Just add JSDoc tags to your code:

```yaml
# templates/default.yaml
extractors:
  - use: builtin/basic-node
    inputs:
      include:
        - 'src/**/*.ts'
        - 'src/**/*.js'
```

## Benefits

- ✅ **Explicit**: Developers control component boundaries
- ✅ **Standard**: Uses standard JSDoc tags (or custom `@component`)
- ✅ **Flexible**: Works with any project structure
- ✅ **No false positives**: Only extracts explicitly annotated components
- ✅ **Documentation-friendly**: JSDoc comments serve dual purpose (docs + architecture)
