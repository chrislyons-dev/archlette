# Annotations Reference

Mark architectural components in your code. Define actors. Declare relationships.

Archlette extracts automatically. Annotations guide what it sees.

---

## What Gets Extracted Automatically

Static analysis. No configuration required.

**Code Structure:**

- Classes (exports, inheritance, methods, properties)
- Functions (regular and arrow functions)
- Type aliases and interfaces
- Imports (file-to-file dependencies)

**Documentation:**

- JSDoc comments (summary, parameters, return types)
- Descriptions and examples
- Deprecation notices

**Metadata:**

- File paths and line numbers
- Visibility modifiers (public, private, protected)
- Type information (async, static, abstract, readonly)

---

## Component Declaration

Mark files as logical components using JSDoc tags.

### @component

Explicit component declaration:

```typescript
/**
 * @component UserService
 * User management and authentication service
 */

export class UserService {
  async login(email: string, password: string) {
    // Implementation
  }
}
```

### @module

Standard JSDoc module tag:

```typescript
/**
 * @module authentication/oauth
 * @description OAuth2 authentication module
 */

export function login() {}
export function logout() {}
```

### @namespace

Standard JSDoc namespace tag:

```typescript
/**
 * @namespace StringUtils
 * @description String manipulation utilities
 */

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

**Priority:** Archlette checks for `@component`, `@module`, then `@namespace` (in that order).

All code in a file with a component tag belongs to that component.

---

## Actor Relationships

Define external actors and their interactions.

### Syntax

```
@actor Name {Type} {Direction} Description
```

**Types:**

- `{Person}` — Human user
- `{System}` — External system

**Directions:**

- `{in}` — Actor → Component (actor calls the component)
- `{out}` — Component → Actor (component calls the actor)
- `{both}` — Bidirectional (default if omitted)

### Examples

**Person actor (user):**

```typescript
/**
 * @component ApiGateway
 * API Gateway handling HTTP requests
 *
 * @actor User {Person} {in} End user making API requests
 */
```

**System actors (external dependencies):**

```typescript
/**
 * @component OrderService
 * Order processing and fulfillment
 *
 * @actor Database {System} {out} PostgreSQL database for persistence
 * @actor Cache {System} {both} Redis cache for sessions
 * @actor PaymentGateway {System} {out} Stripe API for payments
 */
```

**Bidirectional relationships:**

```typescript
/**
 * @component SyncService
 * Bidirectional sync with external system
 *
 * @actor ExternalAPI {System} {both} External service for data synchronization
 */
```

Archlette automatically creates bidirectional relationships in the IR:

- Actor → Component (stored in `actor.targets`)
- Component → Actor (stored in `componentRelationships`)

---

## Component Dependencies

Define explicit component relationships using `@uses`.

### Syntax

```
@uses TargetComponent Description
```

### Examples

**Service dependencies:**

```typescript
/**
 * @component OrderService
 * Handles order processing and fulfillment
 *
 * @uses PaymentService Processes payments for orders
 * @uses InventoryService Checks product availability
 * @uses NotificationService Sends order confirmation emails
 */
```

**Multiple dependencies:**

```typescript
/**
 * @component AuthenticationService
 * User authentication and session management
 *
 * @uses UserRepository Loads user data from database
 * @uses TokenService Generates and validates JWT tokens
 * @uses AuditLogger Records authentication events
 */
```

Dependencies appear in component relationship diagrams.

---

## Complete Example

Full component with all annotation types:

```typescript
/**
 * @module OrderProcessingService
 * Handles end-to-end order processing workflow
 *
 * @actor Customer {Person} {in} Customer placing orders
 * @actor Admin {Person} {in} Administrator managing orders
 * @actor PaymentProvider {System} {out} External payment processing system
 * @actor EmailService {System} {out} Email notification system
 *
 * @uses InventoryService Validates product availability
 * @uses PaymentService Processes customer payments
 * @uses ShippingService Arranges order fulfillment
 * @uses NotificationService Sends status updates
 */

export class OrderProcessingService {
  /**
   * Create a new order
   * @param customerId - Customer identifier
   * @param items - Order line items
   * @returns Created order with confirmation number
   */
  async createOrder(customerId: string, items: OrderItem[]): Promise<Order> {
    // Implementation
  }

  /**
   * Cancel an existing order
   * @param orderId - Order identifier
   * @returns Cancellation confirmation
   */
  async cancelOrder(orderId: string): Promise<void> {
    // Implementation
  }
}
```

This generates:

- **Component**: OrderProcessingService
- **Actors**: Customer, Admin, PaymentProvider, EmailService
- **Dependencies**: InventoryService, PaymentService, ShippingService, NotificationService
- **Code elements**: createOrder(), cancelOrder() methods
- **Relationships**: All automatically extracted and linked

---

## Best Practices

**Be explicit:** Use annotations to capture architectural intent, not just code structure.

**Keep it current:** Update annotations when component responsibilities change.

**One component per file:** Simplifies extraction and improves clarity.

**Describe relationships:** Make descriptions meaningful ("Validates product availability" vs "Uses inventory")

**Use standard JSDoc:** Prefer `@module` and `@namespace` when they fit. Use `@component` for explicit architectural declarations.

---

## See Also

- [Component Detection](../extractors/component-detection.md) — Technical details on how extraction works
- [Configuration](configuration.md) — Configure which files to extract
- [Quick Start](../getting-started/quick-start.md) — Working example
