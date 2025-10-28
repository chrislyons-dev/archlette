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
 * Represents a parsed JSDoc comment block
 */
interface JSDocBlock {
  description: string;
  tags: Array<{ name: string; value: string }>;
}

/**
 * Extract all JSDoc comment blocks from source code
 * Matches /** ... *\/ style comments and parses their tags
 */
function extractJSDocBlocks(source: string): JSDocBlock[] {
  const blocks: JSDocBlock[] = [];

  // Match JSDoc comments: /** ... */
  const jsDocRegex = /\/\*\*[\s\S]*?\*\//g;
  const matches = source.match(jsDocRegex);

  if (!matches) return blocks;

  for (const match of matches) {
    const block = parseJSDocBlock(match);
    if (block) {
      blocks.push(block);
    }
  }

  return blocks;
}

/**
 * Parse a single JSDoc comment block into description and tags
 */
function parseJSDocBlock(comment: string): JSDocBlock | null {
  // Remove /** and */ and leading * from each line
  // Handle both Unix (\n) and Windows (\r\n) line endings
  const cleaned = comment
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .replace(/\r\n/g, '\n') // Normalize Windows line endings to Unix
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .join('\n')
    .trim();

  const lines = cleaned.split('\n');
  const description: string[] = [];
  const tags: Array<{ name: string; value: string }> = [];

  for (const line of lines) {
    // Check if line starts with @tag
    const tagMatch = line.match(/^@(\w+)\s+(.*)$/);
    if (tagMatch) {
      tags.push({
        name: tagMatch[1],
        value: tagMatch[2].trim(),
      });
    } else if (tags.length === 0) {
      // Before any tags, it's part of the description
      description.push(line);
    } else {
      // After tags started, append to the last tag's value
      if (tags.length > 0) {
        tags[tags.length - 1].value += ' ' + line.trim();
      }
    }
  }

  return {
    description: description.join('\n').trim(),
    tags,
  };
}

/**
 * Extract component information from frontmatter JSDoc
 *
 * Attempts to identify the component in this file using JSDoc tags:
 * 1. Checks for @component tag (explicit component declaration)
 * 2. Falls back to @module or @namespace tags
 * 3. If no tags found, infers from directory structure
 *
 * Inference rules:
 * - Files in subdirectories: parent folder name becomes component
 * - Files in root directory: uses ROOT_COMPONENT_MARKER (replaced during IR mapping)
 *
 * Preserves any JSDoc description for the component's documentation.
 *
 * @param frontmatter - TypeScript/JavaScript code from frontmatter section
 * @param filePath - Absolute path to the Astro file (used for inference)
 * @returns ComponentInfo with id, name, and optional description, or undefined
 *
 * @example
 * // With explicit @component tag
 * const fm = '/** @component Button *\/ import ...';
 * const comp = extractFileComponent(fm, '/path/Button.astro');
 * // Returns: { id: 'button', name: 'Button', _inferred: false }
 *
 * // With inference from directory
 * const comp = extractFileComponent('', '/path/components/Header.astro');
 * // Returns: { id: 'components', name: 'components', _inferred: true }
 */
export function extractFileComponent(
  frontmatter: string,
  filePath: string,
): ComponentInfo | undefined {
  const jsDocBlocks = extractJSDocBlocks(frontmatter);

  // Look for @component, @module, or @namespace tags (in priority order)
  for (const block of jsDocBlocks) {
    for (const tagName of ['component', 'module', 'namespace']) {
      const tag = block.tags.find((t) => t.name === tagName);
      if (tag) {
        const name = extractComponentName(tag.value);
        if (name) {
          // Convert empty string to undefined for consistency with basic-node
          const description =
            block.description && block.description.trim()
              ? block.description.trim()
              : undefined;

          return {
            id: sanitizeId(name),
            name,
            description,
            _inferred: false, // Explicitly tagged
          };
        }
      }
    }
  }

  // If no explicit component tag found, infer from file path
  // But still use any JSDoc description found in the frontmatter
  const inferredComponent = inferComponentFromPath(filePath);

  // Look for any JSDoc block with a description (even without @component tag)
  for (const block of jsDocBlocks) {
    if (block.description && block.description.trim()) {
      return {
        ...inferredComponent,
        description: block.description.trim(),
        _inferred: true, // Inferred from path
      };
    }
  }

  return { ...inferredComponent, _inferred: true };
}

/**
 * Extract component name from a JSDoc tag value
 *
 * Parses the tag value to extract the component name, handling various formats:
 * - Simple name: ComponentName
 * - With description: ComponentName - Description
 * - Module path: path/to/module (extracts last directory component)
 * - Dashes preserved: My-Component-Name
 *
 * For module paths like "utils/helpers", extracts "utils" (the last directory
 * before the filename) to enable component grouping.
 *
 * @param value - The JSDoc tag value (text after @component, @module, or @namespace)
 * @returns Extracted component name, or undefined if value is empty
 *
 * @example
 * extractComponentName('Button');
 * // Returns: 'Button'
 *
 * extractComponentName('Button - A reusable button component');
 * // Returns: 'Button'
 *
 * extractComponentName('components/forms/Button');
 * // Returns: 'forms'
 */
function extractComponentName(value: string): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();

  // Take everything up to " - " (space-dash-space) or newline (for descriptions)
  // This preserves dashes in names like "My-Component"
  const match = trimmed.match(/^([^\n]+?)\s+-\s+/);
  if (match) {
    return match[1].trim();
  }

  // If no description separator, take everything up to first newline
  const firstLine = trimmed.split('\n')[0].trim();

  // For @module tags that follow the pattern "directory/filename",
  // extract just the last directory component for deduplication
  // Examples:
  // - "core/config-resolver" -> "core"
  // - "components/Button" -> "components"
  // - "utils" -> "utils" (no change if no slash)
  if (firstLine.includes('/')) {
    const parts = firstLine.split('/');
    // Return the last directory part (before the filename)
    // For deeply nested paths like "a/b/c/file", return "c"
    return parts[parts.length - 2] || parts[parts.length - 1];
  }

  return firstLine;
}

/**
 * Extract actors from frontmatter JSDoc
 *
 * Identifies external actors (users, systems) that interact with the component.
 * Actors are specified using @actor tags in JSDoc comments.
 *
 * Format: @actor Name {Type} {Direction?} description
 * - Name: Human-readable actor name
 * - Type: Person (user role) or System (external service)
 * - Direction: in (inputs to component), out (receives outputs), both
 * - Description: What role the actor plays
 *
 * @param frontmatter - TypeScript/JavaScript code from frontmatter
 * @returns Array of identified actors, or empty array if none found
 *
 * @example
 * const fm = '/** @actor User {Person} {in} End user *\/ ...';
 * const actors = extractFileActors(fm);
 * // Returns: [
 * //   {
 * //     id: 'user',
 * //     name: 'User',
 * //     type: 'Person',
 * //     direction: 'in',
 * //     description: 'End user'
 * //   }
 * // ]
 */
export function extractFileActors(frontmatter: string): ActorInfo[] {
  const actors: ActorInfo[] = [];
  const jsDocBlocks = extractJSDocBlocks(frontmatter);

  // Extract actors from all JSDoc blocks
  for (const block of jsDocBlocks) {
    const actorTags = block.tags.filter((t) => t.name === 'actor');
    for (const tag of actorTags) {
      const actor = parseActorTag(tag.value);
      if (actor) {
        actors.push(actor);
      }
    }
  }

  return actors;
}

/**
 * Parse an @actor tag value
 * Format: @actor Name {Type} {Direction?} description
 * Examples:
 * - User {Person} {in} End user who runs archlette commands
 * - FileSystem {System} {out} File system for reading and writing files
 * - Logger {System} {both} Shared logging service
 * - Cache {System} Redis cache (defaults to 'both' if direction omitted)
 */
function parseActorTag(value: string): ActorInfo | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();

  // Match pattern: Name {Type} {Direction?} description
  // Group 1: Name (everything before first {)
  // Group 2: Type (Person or System)
  // Group 3: Direction (in|out|both) - optional
  // Group 4: Description (everything after last })
  const match = trimmed.match(
    /^([^{]+)\{(Person|System)\}\s*(?:\{(in|out|both)\}\s*)?(.*)$/,
  );

  if (match) {
    const name = match[1].trim();
    const type = match[2] as 'Person' | 'System';
    const direction = (match[3] as 'in' | 'out' | 'both' | undefined) || 'both';
    const description = match[4].trim() || undefined;

    return {
      id: sanitizeId(name),
      name,
      type,
      direction,
      description,
    };
  }

  return undefined;
}

/**
 * Extract relationships from frontmatter JSDoc
 *
 * Identifies component dependencies using @uses tags.
 * Relationships represent that this component uses/depends on another component.
 *
 * Format: @uses TargetName description
 * - TargetName: Name of the component being used
 * - Description: Why or how it's used (optional)
 *
 * @param frontmatter - TypeScript/JavaScript code from frontmatter
 * @returns Array of identified relationships, or empty array if none found
 *
 * @example
 * const fm = '/** @uses Logger For debug output *\/ ...';
 * const rels = extractFileRelationships(fm);
 * // Returns: [
 * //   {
 * //     source: '', // Filled during IR mapping
 * //     target: 'Logger',
 * //     description: 'For debug output'
 * //   }
 * // ]
 */
export function extractFileRelationships(frontmatter: string): RelationshipInfo[] {
  const relationships: RelationshipInfo[] = [];
  const jsDocBlocks = extractJSDocBlocks(frontmatter);

  // Extract relationships from all JSDoc blocks
  for (const block of jsDocBlocks) {
    const usesTags = block.tags.filter((t) => t.name === 'uses');
    for (const tag of usesTags) {
      const rel = parseUsesTag(tag.value);
      if (rel) {
        relationships.push(rel);
      }
    }
  }

  return relationships;
}

/**
 * Parse a @uses tag value
 * Format: @uses Target description
 * Example:
 * - Extractor Analyzes source code
 */
function parseUsesTag(value: string): RelationshipInfo | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();

  // Match pattern: TargetName description
  // Target is the first word, rest is description
  const match = trimmed.match(/^(\S+)\s*(.*)$/);

  if (match) {
    const target = match[1].trim();
    const description = match[2].trim() || undefined;

    return {
      source: '', // Will be filled by mapper with the current file's component ID
      target,
      description,
    };
  }

  return undefined;
}

/**
 * Infer component name from file path
 *
 * When no explicit @component tag is found, derives component from directory structure:
 * - Subdirectory files: Uses the immediate parent folder name
 * - Root directory files: Uses ROOT_COMPONENT_MARKER (replaced during IR mapping)
 *
 * This enables automatic component organization without explicit annotations.
 * Used as fallback in extractFileComponent().
 *
 * @param filePath - Absolute path to the Astro file
 * @returns ComponentInfo with inferred component name
 *
 * @example
 * inferComponentFromPath('/project/src/components/Button.astro');
 * // Returns: { id: 'components', name: 'components', description: '...' }
 *
 * inferComponentFromPath('/project/Layout.astro');
 * // Returns: { id: '__use_container_name__', name: '__USE_CONTAINER_NAME__' }
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
