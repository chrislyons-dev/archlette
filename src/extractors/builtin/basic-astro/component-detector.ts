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
 * Checks for @component, @module, or @namespace tags
 * If no tags found, infers component from directory structure:
 * - Files in subdirectories use the immediate parent folder name
 * - Files in root directory use ROOT_COMPONENT_MARKER
 * - Uses any JSDoc description found in the frontmatter
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
      };
    }
  }

  return inferredComponent;
}

/**
 * Extract component name from a JSDoc tag value
 * Handles formats like:
 * - ComponentName
 * - ComponentName - Description (space-dash-space separator)
 * - path/to/module
 * - My-Component (dashes in names are preserved)
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
 * Looks for @actor tags in the format: @actor Name {Type} {Direction?} description
 * Examples:
 * - @actor User {Person} {in} End user who runs archlette commands
 * - @actor FileSystem {System} {out} File system for reading and writing files
 * - @actor Logger {System} {both} Shared logging service
 * - @actor Cache {System} Redis cache (defaults to {both} if direction omitted)
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
 * Looks for @uses tags to identify component dependencies
 * Example:
 * - @uses Extractor Analyzes source code to extract architecture components
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
