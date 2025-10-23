# Structurizr Theme Customization

Archlette supports Structurizr themes to customize the visual appearance of your architecture diagrams.

## Default Theme

By default, Archlette uses a professional blue gradient theme:

- **Systems**: Dark blue (#1168bd)
- **Containers**: Medium blue (#438dd5)
- **Components**: Light blue (#85bbf0)
- **Cloudflare Workers**: Orange highlight (#f6821f)
- **Actors**: Person shapes with distinct styling
- **External Systems**: Gray (#999999)

## Custom Themes

You can override the default theme by providing a custom Structurizr theme DSL file.

### Configuration

In your `archlette.config.yaml`:

```yaml
generators:
  - use: generators/builtin/structurizr
    inputs:
      theme: path/to/custom-theme.dsl
```

**Path Resolution:**
Theme paths are resolved relative to your config file location. This allows you to keep themes alongside your configuration.

**Examples:**

```yaml
# Relative to config file (recommended)
theme: themes/custom.dsl           # ./themes/custom.dsl from config location
theme: ../shared-themes/dark.dsl   # shared themes in parent directory

# Absolute paths
theme: /opt/company/themes/brand.dsl

# Home directory
theme: ~/archlette-themes/custom.dsl
```

### Theme File Format

A theme file is a Structurizr DSL file containing style definitions. Example:

```dsl
/**
 * Custom Dark Mode Theme
 */

theme default

styles {
    // Person/Actor styles
    element "Person" {
        background #2c3e50
        color #ecf0f1
        shape Person
        fontSize 22
    }

    // System styles
    element "Software System" {
        background #34495e
        color #ecf0f1
        shape RoundedBox
        fontSize 22
    }

    // Container styles
    element "Container" {
        background #7f8c8d
        color #ecf0f1
        shape RoundedBox
        fontSize 20
    }

    // Component styles
    element "Component" {
        background #95a5a6
        color #2c3e50
        shape RoundedBox
        fontSize 18
    }

    // Relationship styles
    relationship "Relationship" {
        routing Curved
        fontSize 18
    }
}
```

### Element Tags

You can style elements with specific tags:

- `Person` - Human actors in the system
- `Software System` - System-level components
- `Container` - Application/service containers
- `Component` - Code components
- `External System` - External dependencies
- `Cloudflare Worker` - Cloudflare Worker containers

### Available Properties

#### Element Styles

- `background` - Background color (hex)
- `color` - Text color (hex)
- `shape` - Visual shape (Person, RoundedBox, Box, Cylinder, etc.)
- `fontSize` - Text size in points
- `border` - Border style

#### Relationship Styles

- `routing` - Line routing (Direct, Curved, Orthogonal)
- `fontSize` - Label text size
- `thickness` - Line thickness
- `color` - Line color
- `dashed` - Whether to use dashed lines (true/false)

## Fallback Behavior

If a custom theme file is not found at the specified path, Archlette will:

1. Log a warning message
2. Fall back to the default theme
3. Continue processing without errors

## Examples

### Dark Mode Theme

See `custom-theme-test.dsl` for a complete dark mode example with:

- Dark backgrounds (#2c3e50, #34495e)
- Light text (#ecf0f1)
- Muted accent colors (#7f8c8d, #95a5a6)

### Brand Colors

You can create themes matching your company brand:

```dsl
element "Software System" {
    background #FF6B35  // Brand orange
    color #FFFFFF
}

element "Container" {
    background #004E89  // Brand blue
    color #FFFFFF
}
```

## Best Practices

1. **Color Accessibility**: Ensure sufficient contrast between text and backgrounds
2. **Consistency**: Use a cohesive color palette across all element types
3. **Hierarchy**: Use color intensity to show architectural hierarchy (dark systems → light components)
4. **External Distinction**: Style external systems differently to show boundaries
5. **Actor Visibility**: Use Person shapes and distinct colors for human actors

## References

- [Structurizr DSL Styles Documentation](https://docs.structurizr.com/dsl/cookbook/styling-elements/)
- [Structurizr Shape Reference](https://docs.structurizr.com/ui/diagrams/notation)
