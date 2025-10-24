/**
 * @module core
 * @description
 * Shared constants used across the Archlette pipeline.
 * Centralizes magic strings, tags, and configuration values.
 */

/**
 * Standard tags used in Structurizr DSL generation
 */
export const TAGS = {
  /** Tag for code-level elements (classes, functions) */
  CODE: 'Code',
  /** Tag for external systems */
  EXTERNAL: 'External',
  /** Tag for auto-generated containers/components */
  AUTO_GENERATED: 'Auto-generated',
} as const;

/**
 * Standard view names for Structurizr diagrams
 */
export const VIEW_NAMES = {
  /** System context view name */
  SYSTEM_CONTEXT: 'SystemContext',
  /** Container view name */
  CONTAINERS: 'Containers',
  /** Generate component view name for a container */
  COMPONENTS: (containerName: string) => `Components_${containerName}`,
  /** Generate class view name for a component */
  CLASSES: (componentName: string) => `Classes_${componentName}`,
} as const;

/**
 * Default container ID when none are defined
 */
export const DEFAULT_CONTAINER_ID = 'default-container';

/**
 * IR schema version
 */
export const IR_VERSION = '1.0';

/**
 * Convert a name to a normalized ID
 * Used for consistent ID generation across extractors and mappers
 *
 * @param name - The name to convert (component, actor, etc.)
 * @returns Normalized ID (lowercase, hyphenated, alphanumeric)
 *
 * @example
 * nameToId('Payment Processor') // 'payment-processor'
 * nameToId('payments/processor') // 'payments-processor'
 * nameToId('PaymentService') // 'paymentservice'
 */
export function nameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s/]+/g, '-') // Replace spaces and slashes with dashes
    .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric (except dashes)
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
}

/**
 * Sanitize ID for DSL and code identifiers (preserves underscores)
 * Used for Python code identifiers where underscores are significant
 *
 * @param id - The ID to sanitize
 * @returns Sanitized ID (lowercase alphanumeric and underscores only)
 *
 * @example
 * sanitizeId('my_function') // 'my_function'
 * sanitizeId('my-function') // 'my_function'
 * sanitizeId('MyClass') // 'myclass'
 * sanitizeId('123invalid') // '_123invalid'
 */
export function sanitizeId(id: string): string {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^[0-9]/, '_$&');
}
