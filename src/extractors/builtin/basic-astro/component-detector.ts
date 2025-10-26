/**
 * @module basic-astro
 * Component identification from JSDoc annotations and file structure
 */

import { sanitizeId } from '../../../core/constants.js';
import type { ComponentInfo, ActorInfo, RelationshipInfo } from './types.js';

/**
 * Special marker used when file is in root directory
 * Will be replaced with container name during IR mapping
 */
export const ROOT_COMPONENT_MARKER = '__USE_CONTAINER_NAME__';

/**
 * Extract component information from frontmatter JSDoc
 * Checks for @component, @module, or @namespace tags
 * If no tags found, infers component from directory structure:
 * - Files in subdirectories use the immediate parent folder name
 * - Files in root directory use ROOT_COMPONENT_MARKER
 */
export function extractFileComponent(
  frontmatter: string,
  filePath: string,
): ComponentInfo | undefined {
  // TODO: Implement component extraction
  // 1. Parse JSDoc from frontmatter
  // 2. Look for @component, @module, @namespace tags
  // 3. If found, return component info
  // 4. If not found, infer from file path
  // 5. Use sanitizeId() for IDs

  return inferComponentFromPath(filePath);
}

/**
 * Extract actors from frontmatter JSDoc
 * Looks for @actor tags in the format: @actor Name {Type} {Direction?} description
 */
export function extractFileActors(frontmatter: string): ActorInfo[] {
  // TODO: Implement actor extraction
  // 1. Parse JSDoc from frontmatter
  // 2. Find all @actor tags
  // 3. Parse format: @actor Name {Person|System} {in|out|both}? description
  // 4. Use sanitizeId() for IDs
  // 5. Return ActorInfo[]

  return [];
}

/**
 * Extract relationships from frontmatter JSDoc
 * Looks for @uses tags to identify component dependencies
 */
export function extractFileRelationships(frontmatter: string): RelationshipInfo[] {
  // TODO: Implement relationship extraction
  // 1. Parse JSDoc from frontmatter
  // 2. Find all @uses tags
  // 3. Parse format: @uses Target description
  // 4. Return RelationshipInfo[]

  return [];
}

/**
 * Infer component name from file path
 * - Files in subdirectories use the immediate parent folder name
 * - Files in root directory use ROOT_COMPONENT_MARKER
 *
 * Examples:
 * - /path/to/project/src/components/Button.astro -> 'components'
 * - /path/to/project/src/Layout.astro -> ROOT_COMPONENT_MARKER
 */
function inferComponentFromPath(filePath: string): ComponentInfo {
  // Normalize path separators to forward slashes
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Split the path into parts
  const parts = normalizedPath.split('/').filter((p) => p.length > 0);

  // Get the directory name (second to last part, before the filename)
  // If there's only one part (just the filename), it's in root
  if (parts.length <= 1) {
    return {
      id: sanitizeId(ROOT_COMPONENT_MARKER),
      name: ROOT_COMPONENT_MARKER,
      description: 'Component inferred from root directory',
    };
  }

  // Get the immediate parent directory name
  const parentDir = parts[parts.length - 2];

  return {
    id: sanitizeId(parentDir),
    name: parentDir,
    description: `Component inferred from directory: ${parentDir}`,
  };
}
