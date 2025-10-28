# Astro Extractor JSDoc Tags

Complete reference for JSDoc annotations supported by the Archlette `basic-astro` extractor.

## Overview

Archlette uses JSDoc comments in Astro frontmatter to extract architecture information:

```astro
---
/**
 * @component Button
 * Reusable button component
 *
 * @actor User {Person} {in} Clicks button
 * @uses Icon Displays icon
 */
---
```

## Component Declaration Tags

Declare which component an Astro file belongs to. Use one per file.

### `@component`

**Syntax:** `@component ComponentName [- Description]`

**Purpose:** Explicitly declare the component for this file.

**Examples:**

```astro
---
/**
 * @component Button
 * Reusable button component with multiple variants
 */
---
```

```astro
---
/**
 * @component Form - Handles user input and validation
 */
---
```

**When to use:**

- You want a specific component name that differs from the directory structure
- You want to document why this file belongs to a component
- Multiple Astro files represent a single logical component

### `@module`

**Syntax:** `@module path/to/module [- Description]`

**Purpose:** Standard JSDoc tag identifying the module. Works like `@component`.

**Examples:**

```astro
---
/**
 * @module ui/components/Button
 * Reusable button component for common actions
 */
---
```

**When to use:**

- You prefer standard JSDoc conventions
- You have nested component hierarchies
- You're documenting module paths

**Note:** For paths like `ui/components/Button`, Archlette extracts the last directory part as the component name (`components`).

### `@namespace`

**Syntax:** `@namespace NamespaceName [- Description]`

**Purpose:** Group related files under a namespace.

**Examples:**

```astro
---
/**
 * @namespace Forms
 * All form-related components and utilities
 */
---
```

**When to use:**

- You want to group components conceptually
- You have shared utilities or helper components
- You prefer "namespace" terminology

### Component Inference

If no `@component`, `@module`, or `@namespace` tag is present, Archlette infers the component from the directory structure:

```
src/
  components/
    Button.astro      → component: "components"
    Header.astro      → component: "components"
  pages/
    index.astro       → component: "pages"
    blog/
      [slug].astro    → component: "blog"
  Layout.astro        → component: ROOT (replaced with container name during IR mapping)
```

**Inference rules:**

- File in subdirectory → uses parent folder name
- File in root directory → uses ROOT_COMPONENT_MARKER (replaced with container name later)

## Actor Tags

Define external systems and users that interact with your components.

### `@actor`

**Syntax:** `@actor Name {Type} {Direction?} Description`

**Parts:**

- `Name` - Human-readable actor name (e.g., "User", "Database", "Email Service")
- `Type` - Either `Person` (users/roles) or `System` (external services)
- `Direction` - Optional: `in`, `out`, or `both`
  - `in` - Actor sends input to component
  - `out` - Component sends output to actor
  - `both` - Bidirectional interaction (default if omitted)
- `Description` - What role the actor plays

**Examples:**

```astro
---
/**
 * User interacting with button
 * @actor User {Person} {in} End user clicking button
 */
---
```

```astro
---
/**
 * Analytics tracking
 * @actor Analytics {System} {out} Receives click events
 * @actor Logger {System} {both} Logs UI interactions
 */
---
```

```astro
---
/**
 * Database storage (direction defaults to 'both' if omitted)
 * @actor Database {System} Stores and retrieves user data
 */
---
```

**When to use:**

- You want to document who/what uses your component
- You have external system dependencies
- You need to show actor-component interactions in diagrams

**Direction Guide:**

- `{in}` - Person filling form, User clicking button
- `{out}` - Component sending events to analytics, Logging to service
- `{both}` - Bidirectional - component receives from AND sends to actor

## Relationship Tags

Document dependencies between components.

### `@uses`

**Syntax:** `@uses TargetComponent [Description]`

**Purpose:** Declare that this component uses/depends on another component.

**Examples:**

```astro
---
/**
 * Button component
 * @uses Icon Displays icon inside button
 * @uses Tooltip Shows help text on hover
 */
---
```

```astro
---
/**
 * Form component
 * @uses FormField Individual form field components
 * @uses ValidationService Validates form inputs
 * @uses Database Persists form data
 */
---
```

**When to use:**

- You want to document explicit component dependencies
- You have shared utilities or services
- You want relationships to appear in diagrams

**Note:** Archlette also auto-detects component usage from template markup:

```astro
<Header /> <!-- Auto-detected dependency on Header -->
<Button>Click me</Button> <!-- Auto-detected dependency on Button -->
```

The `@uses` tag is useful for documenting non-template dependencies (services, utilities, external systems).

## Examples by Use Case

### Simple UI Component

```astro
---
/**
 * @component Button
 * Reusable button with multiple sizes and variants
 *
 * @actor User {Person} {in} Clicks to trigger action
 */

interface Props {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}
---

<button class={`btn btn-${variant} btn-${size}`}>
  <slot />
</button>
```

### Container Component

```astro
---
/**
 * @component Card
 * Container for grouping related content
 *
 * @uses Button Used for card actions
 * @uses Badge Shows card status
 */

interface Props {
  title: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}
---

<div class={`card card-${type}`}>
  <h3>{title}</h3>
  <slot />
  <div class="card-actions">
    <slot name="actions" />
  </div>
</div>
```

### Data-Fetching Component

```astro
---
/**
 * @component UserProfile
 * Displays user information
 *
 * @uses User {System} {out} Fetches user data
 * @uses Avatar Renders user photo
 * @actor Admin {Person} {in} Views user profile
 */

import { fetchUser } from '@/services/user-service';

interface Props {
  userId: string;
}

const user = await fetchUser(Astro.props.userId);
---

<div class="profile">
  <avatar src={user.avatar} />
  <h2>{user.name}</h2>
  <p>{user.bio}</p>
</div>
```

### Form with Services

```astro
---
/**
 * @module forms/ContactForm
 * Handles user contact inquiries
 *
 * @actor User {Person} {in} Submits contact form
 * @actor Email {System} {out} Sends confirmation email
 * @uses FormField Form input components
 * @uses ValidationService Validates inputs
 * @uses Database Stores submissions
 */

import { validateForm } from '@/services/validation';
import { sendEmail } from '@/services/email';

interface FormData {
  name: string;
  email: string;
  message: string;
}

let submitted = false;
let error = '';

if (Astro.request.method === 'POST') {
  const formData = await Astro.request.formData();
  // Process form...
}
---

<form method="POST">
  <!-- Form fields -->
</form>
```

### Multiple Files in One Component

When you have multiple Astro files representing one logical component, use explicit tags:

**Button/index.astro:**

```astro
---
/**
 * @component Button
 * Main button component
 */
---
```

**Button/ButtonGroup.astro:**

```astro
---
/**
 * @component Button
 * Container for related buttons
 */
---
```

**Button/variants.ts:**

```typescript
/**
 * @component Button
 * Button variant definitions and styles
 */

export const ButtonVariants = {
  primary: 'btn-primary',
  // ...
};
```

All three will be merged into one "Button" component in the extracted architecture.

## Best Practices

1. **Use one declaration tag per file** - Use `@component`, `@module`, OR `@namespace`, not multiple
2. **Be descriptive** - Add descriptions to tags to explain the "why"
3. **Document actors** - Always tag external systems and users your component interacts with
4. **Document dependencies** - Use `@uses` for non-obvious dependencies
5. **Prefer inference** - Let Archlette infer components from directories when possible
6. **Direction matters** - Specify actor direction accurately for correct diagrams
7. **Keep it current** - Update tags when component responsibilities change

## Common Mistakes

❌ **Multiple declaration tags:**

```astro
---
/**
 * @component Button
 * @module ui/Button
 * @namespace UI
 */
---
```

✅ **Use one:**

```astro
---
/**
 * @component Button
 * Reusable button component
 */
---
```

---

❌ **Ambiguous actors:**

```astro
---
/**
 * @actor User (who?)
 */
---
```

✅ **Be specific:**

```astro
---
/**
 * @actor Administrator {Person} {in} Configures system settings
 */
---
```

---

❌ **Forgetting direction:**

```astro
---
/**
 * @actor Database
 */
---
```

✅ **Specify direction:**

```astro
---
/**
 * @actor Database {System} {out} Stores and retrieves data
 */
---
```

## See Also

- [Archlette Annotations Guide](https://chrislyons-dev.github.io/archlette/guide/annotations/)
- [Basic-Node JSDoc Tags](../extractors/basic-node-annotations.md)
