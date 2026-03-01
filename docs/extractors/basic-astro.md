# Basic Astro Extractor

**Extract architecture from Astro component files.**

The `basic-astro` extractor analyzes `.astro` files to discover components, actors, and relationships. Astro's component model maps naturally to C4 architecture.

---

## What It Extracts

**From Astro components:**

- 🔹 **Components** — Each .astro file becomes a component in the architecture
- 🔹 **Actors** — Users and external systems (via JSDoc `@actor` tags)
- 🔹 **Relationships** — Component dependencies detected from imports and `@uses` tags
- 🔹 **Code Elements** — Classes, functions, and types from frontmatter

**From frontmatter JSDoc:**

- 🔹 **Component metadata** — Name, description, purpose from `@component` or `@module` tags
- 🔹 **Actor declarations** — External system interactions via `@actor` tags
- 🔹 **Relationship tags** — Explicit dependencies via `@uses` tags

---

## Configuration

### Basic Setup

```yaml
extractors:
  - use: extractors/builtin/basic-astro
    inputs:
      include: ['src/**/*.astro']
      exclude: ['**/*.test.astro']
```

### Advanced Setup

```yaml
extractors:
  - use: extractors/builtin/basic-astro
    name: web-ui # Optional: names this container
    inputs:
      include:
        - 'src/components/**/*.astro'
        - 'src/pages/**/*.astro'
        - 'src/layouts/**/*.astro'
      exclude:
        - '**/*.test.astro'
        - '**/examples/**'
        - '**/drafts/**'
```

**Glob patterns use [minimatch](https://github.com/isaacs/minimatch) syntax.**

---

## Annotations Reference

### Component Tags

**Mark a component with metadata:**

```astro
---
/**
 * @component UserCard
 * Displays user profile information with avatar and bio
 */

interface Props {
  name: string;
  avatar: string;
  bio?: string;
}

const { name, avatar, bio } = Astro.props;
---

<div class="user-card">
  <img src={avatar} alt={name} />
  <h2>{name}</h2>
  {bio && <p>{bio}</p>}
</div>
```

**Also supports:**

- `@module ComponentName` — Alternative annotation style
- File name used if no annotation present

**What gets extracted:**

- Component with ID derived from file name (`user-card.astro` → `user-card`)
- Description from JSDoc comment
- Props interface as component contract
- Import relationships to other components

---

### Actor Tags

**Declare external interactions:**

```astro
---
/**
 * @component PaymentForm
 * Credit card payment interface
 *
 * @actor Customer {Person} {in} User entering payment details
 * @actor StripeAPI {System} {out} Payment processor
 */

interface Props {
  amount: number;
  currency: string;
}
---

<form>
  <!-- Payment form implementation -->
</form>
```

**Format:**

```
@actor ActorName {Person|System} {in|out} Description
```

**Direction:**

- `{in}` — Actor uses this component (user, viewer)
- `{out}` — This component uses actor (external API)

---

### Relationship Tags

**Declare dependencies explicitly:**

```astro
---
/**
 * @component ProductPage
 * Product detail page layout
 *
 * @uses ProductCard Displays product information
 * @uses ReviewList Shows customer reviews
 * @uses AddToCartButton Purchase action
 */

import ProductCard from '../components/ProductCard.astro';
import ReviewList from '../components/ReviewList.astro';
import AddToCartButton from '../components/AddToCartButton.astro';
---

<Layout>
  <ProductCard {...product} />
  <ReviewList reviews={reviews} />
  <AddToCartButton productId={product.id} />
</Layout>
```

**Format:**

```
@uses ComponentName Description
```

**Note:** Import statements create relationships automatically. Use `@uses` for documentation or non-imported dependencies.

---

## Complete Example

```astro
---
/**
 * Shopping cart component
 *
 * @component ShoppingCart
 * @description Displays cart items with checkout functionality
 *
 * @actor Customer {Person} {in} User managing cart items
 * @actor PaymentAPI {System} {out} Processes checkout payments
 * @actor InventoryService {System} {out} Validates item availability
 *
 * @uses CartItem Renders individual cart entries
 * @uses CheckoutButton Initiates purchase flow
 */

import CartItem from './CartItem.astro';
import CheckoutButton from './CheckoutButton.astro';

interface Props {
  items: CartItem[];
  total: number;
}

const { items, total } = Astro.props;
---

<div class="shopping-cart">
  <h2>Your Cart ({items.length} items)</h2>

  <div class="cart-items">
    {items.map(item => (
      <CartItem {...item} />
    ))}
  </div>

  <div class="cart-total">
    <span>Total:</span>
    <span>${total.toFixed(2)}</span>
  </div>

  <CheckoutButton disabled={items.length === 0} />
</div>

<style>
  .shopping-cart {
    border: 1px solid #ccc;
    padding: 1rem;
  }
</style>
```

**Extracted:**

- ✅ 1 Component: `ShoppingCart`
- ✅ 3 Actors: `Customer`, `PaymentAPI`, `InventoryService`
- ✅ 2 Import relationships: ShoppingCart → CartItem, CheckoutButton
- ✅ Props interface: `items`, `total`
- ✅ 6 Actor relationships (bidirectional)

---

## Component ID Generation

**Component IDs derive from file names:**

| File Path                    | Component ID    |
| ---------------------------- | --------------- |
| `components/UserCard.astro`  | `usercard`      |
| `components/user-card.astro` | `user-card`     |
| `layouts/BaseLayout.astro`   | `baselayout`    |
| `pages/products/[id].astro`  | `products-[id]` |
| `components/ui/Button.astro` | `ui-button`     |

**Rules:**

- Lowercase
- Remove `.astro` extension
- Preserve path structure in component name
- Keep hyphens and brackets

---

## Import Detection

**Automatically extracts relationships from imports:**

```astro
---
// ✅ Relative imports detected
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';

// ✅ Local component imports detected
import Button from './Button.astro';

// ⚠️ External package imports ignored (not architectural)
import { Icon } from 'astro-icon';

// ✅ Framework components detected
import ReactCounter from '../components/Counter.tsx';
---

<Layout>
  <Header />
  <main>
    <Button />
    <ReactCounter client:load />
  </main>
  <Footer />
</Layout>
```

**Creates relationships:**

- Layout → Header
- Layout → Footer
- Layout → Button
- Layout → ReactCounter

---

## Island Architecture

**Client directives indicate interactivity:**

```astro
---
import InteractiveMap from '../components/Map.tsx';
import SearchBar from '../components/SearchBar.tsx';
import Analytics from '../components/Analytics.tsx';
---

<!-- Static content (no island) -->
<header>
  <h1>Location Finder</h1>
</header>

<!-- Islands (hydrated on client) -->
<SearchBar client:load />
<InteractiveMap client:visible />
<Analytics client:idle />
```

**Extracted:**

- Static shell: header content
- 3 Islands: SearchBar (immediate), InteractiveMap (lazy), Analytics (idle)
- All mapped as component relationships

---

## Props as Contracts

**Props interfaces define component APIs:**

```astro
---
/**
 * @component ProductCard
 */

interface Props {
  id: string;          // Required
  name: string;        // Required
  price: number;       // Required
  image?: string;      // Optional
  discount?: number;   // Optional
}

const { id, name, price, image, discount } = Astro.props;
---

<article data-product={id}>
  {image && <img src={image} alt={name} />}
  <h3>{name}</h3>
  <p class="price">
    ${discount ? price * (1 - discount) : price}
  </p>
</article>
```

**Props captured in IR:**

```json
{
  "componentId": "productcard",
  "props": {
    "id": { "type": "string", "required": true },
    "name": { "type": "string", "required": true },
    "price": { "type": "number", "required": true },
    "image": { "type": "string", "required": false },
    "discount": { "type": "number", "required": false }
  }
}
```

---

## Layout Components

**Layouts are components with special semantics:**

```astro
---
/**
 * @component BaseLayout
 * Base page layout with header, footer, and SEO
 */

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content={description} />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

**Pages using this layout create relationships:**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Home" description="Welcome">
  <h1>Home Page</h1>
</BaseLayout>
```

**Extracted:** HomePage → BaseLayout relationship

---

## Framework Integration

**Astro supports React, Vue, Svelte, etc.:**

```astro
---
/**
 * @component Dashboard
 * Main dashboard with mixed frameworks
 */

import ReactChart from '../components/Chart.tsx';      // React
import VueTable from '../components/Table.vue';        // Vue
import SvelteWidget from '../components/Widget.svelte'; // Svelte
---

<div class="dashboard">
  <ReactChart client:load data={chartData} />
  <VueTable client:visible items={tableData} />
  <SvelteWidget client:idle config={widgetConfig} />
</div>
```

**All framework components treated equally:**

- Dashboard → Chart (React)
- Dashboard → Table (Vue)
- Dashboard → Widget (Svelte)

---

## Monorepo Configuration

**Extract UI separately from other layers:**

```yaml
extractors:
  # Astro UI Components
  - use: extractors/builtin/basic-astro
    name: web-ui
    inputs:
      include: ['ui/src/**/*.astro']

  # TypeScript Business Logic
  - use: extractors/builtin/basic-node
    name: api-layer
    inputs:
      include: ['api/src/**/*.ts']

  # Cloudflare Workers
  - use: extractors/builtin/basic-wrangler
    inputs:
      include: ['iac/workers/**/*.toml']
```

**Three containers:** UI, API, Infrastructure

---

## Best Practices

### ✅ Do

- **Annotate complex components** — Use JSDoc for components with business logic
- **Document actors** — Clarify user roles and external APIs
- **Use consistent naming** — Kebab-case file names (`user-card.astro`)
- **Organize by feature** — Group related components in directories
- **Declare props** — TypeScript interfaces document contracts

### ❌ Don't

- **Over-nest directories** — Keep paths shallow for readability
- **Mix conventions** — Choose PascalCase or kebab-case, stay consistent
- **Forget client directives** — Document which islands are interactive
- **Ignore imports** — Import relationships are architectural

---

## Troubleshooting

### Components Not Showing Up

**Check:**

1. File has `.astro` extension
2. File matches `include` patterns
3. File doesn't match `exclude` patterns
4. Frontmatter section exists (even if empty)

### Relationships Missing

**Check:**

1. Import statements use relative paths (`./` or `../`)
2. Imported file has `.astro` (or framework) extension
3. Target component exists in included files
4. Import path is correct (typos break extraction)

### Props Not Captured

**Check:**

1. `interface Props` defined in frontmatter
2. Using TypeScript syntax (not JSDoc types)
3. Props destructured from `Astro.props`

### Actor Tags Not Working

**Check:**

1. JSDoc comment is in frontmatter, not template section
2. Format matches: `@actor Name {Type} {Direction} Description`
3. Braces `{}` are present around type and direction

---

## What's Next?

**Combine with other extractors:**

- [Basic Node](basic-node.md) — Add backend TypeScript/JavaScript
- [Basic Wrangler](basic-wrangler.md) — Add Cloudflare deployment topology

**Learn more:**

- [Annotations Reference](../guide/annotations.md) — All supported JSDoc tags
- [Configuration Guide](../guide/configuration.md) — Advanced extractor options

**Extend Archlette:**

- [Plugin Development](../plugins/extractors.md) — Build custom extractors

---

## Astro-Specific Features

### Content Collections

**Astro content collections can be documented:**

```astro
---
/**
 * @component BlogPost
 * Individual blog post layout
 *
 * @uses ContentCollection Loads post data
 */

import { getEntry } from 'astro:content';

const post = await getEntry('blog', Astro.params.slug);
---

<article>
  <h1>{post.data.title}</h1>
  <time>{post.data.date}</time>
  <div>{post.body}</div>
</article>
```

### Dynamic Routes

**Dynamic route files are components:**

```
pages/
  products/
    [id].astro       → Component: products-[id]
    [...slug].astro  → Component: products-[...slug]
```

### View Transitions

**View transition relationships:**

```astro
---
/**
 * @component TransitionPage
 * Page with view transitions enabled
 */
---

<ViewTransitions />

<main transition:animate="slide">
  <h1>Content with transitions</h1>
</main>
```

**Note:** View transition analysis is experimental.
