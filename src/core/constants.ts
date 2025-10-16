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
  /** Generate class view name for a container */
  CLASSES: (containerName: string) => `Classes_${containerName}`,
} as const;

/**
 * Default container ID when none are defined
 */
export const DEFAULT_CONTAINER_ID = 'default-container';

/**
 * IR schema version
 */
export const IR_VERSION = '1.0';
