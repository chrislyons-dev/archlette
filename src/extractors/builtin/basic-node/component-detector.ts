/**
 * Component identification from JSDoc annotations
 */

import type { SourceFile, Node, JSDoc, JSDocTag } from 'ts-morph';
import { SyntaxKind } from 'ts-morph';
import { nameToId } from '../../../core/constants.js';

export interface ComponentInfo {
  id: string;
  name: string;
  description?: string;
}

export interface ActorInfo {
  id: string;
  name: string;
  type: 'Person' | 'System';
  direction?: 'in' | 'out' | 'both';
  description?: string;
}

export interface RelationshipInfo {
  source: string; // Source component/actor ID (inferred from file)
  target: string; // Target component/actor name
  description?: string;
}

/**
 * Get JSDoc comments from a source file
 * Checks both the first statement and module-level JSDoc
 *
 * @param sourceFile - TypeScript source file to extract JSDoc from
 * @returns Array of JSDoc nodes (empty if none found)
 */
function getFileJsDocs(sourceFile: SourceFile): Node[] {
  const statements = sourceFile.getStatements();
  if (statements.length === 0) return [];

  // Check if first statement has leading JSDoc
  const firstStatement = statements[0];
  const jsDocs = firstStatement.getChildrenOfKind(SyntaxKind.JSDoc);

  // If found, return them; otherwise try module-level JSDoc
  if (jsDocs.length > 0) return jsDocs;
  return sourceFile.getChildrenOfKind(SyntaxKind.JSDoc);
}

/**
 * Extract component information from file-level JSDoc
 * Checks the first JSDoc comment in the file for @component, @module, or @namespace tags
 */
export function extractFileComponent(
  sourceFile: SourceFile,
): ComponentInfo | undefined {
  const jsDocs = getFileJsDocs(sourceFile);
  if (jsDocs.length === 0) return undefined;

  // Check the first JSDoc for component/module/namespace tags
  return extractComponentFromJsDoc(jsDocs[0]);
}

/**
 * Extract actors from file-level JSDoc
 * Looks for @actor tags in the format: @actor Name {Type} {Direction?} description
 * Examples:
 * - @actor User {Person} {in} End user who runs archlette commands
 * - @actor FileSystem {System} {out} File system for reading and writing files
 * - @actor Logger {System} {both} Shared logging service
 * - @actor Cache {System} Redis cache (defaults to {both} if direction omitted)
 */
export function extractFileActors(sourceFile: SourceFile): ActorInfo[] {
  const actors: ActorInfo[] = [];
  const jsDocs = getFileJsDocs(sourceFile);

  // Extract actors from all JSDoc comments
  for (const jsDoc of jsDocs) {
    const extracted = extractActorsFromJsDoc(jsDoc);
    actors.push(...extracted);
  }

  return actors;
}

/**
 * Extract relationships from file-level JSDoc
 * Looks for @uses tags to identify component dependencies
 * Example:
 * - @uses Extractor Analyzes source code to extract architecture components
 */
export function extractFileRelationships(sourceFile: SourceFile): RelationshipInfo[] {
  const relationships: RelationshipInfo[] = [];
  const jsDocs = getFileJsDocs(sourceFile);

  // Extract relationships from all JSDoc comments
  for (const jsDoc of jsDocs) {
    const extracted = extractRelationshipsFromJsDoc(jsDoc);
    relationships.push(...extracted);
  }

  return relationships;
}

/**
 * Extract component info from a JSDoc node
 */
function extractComponentFromJsDoc(jsDoc: Node): ComponentInfo | undefined {
  if (!jsDoc.getKind || jsDoc.getKind() !== SyntaxKind.JSDoc) {
    return undefined;
  }

  // Access JSDoc methods from ts-morph types
  const doc = jsDoc as JSDoc;
  const tags = doc.getTags();

  // Look for @component, @module, or @namespace (in that priority order)
  for (const tagName of ['component', 'module', 'namespace']) {
    const tag = tags.find((t) => t.getTagName() === tagName);
    if (tag) {
      const name = extractComponentName(tag);
      if (name) {
        return {
          id: nameToId(name),
          name,
          description: doc.getDescription ? doc.getDescription().trim() : undefined,
        };
      }
    }
  }

  return undefined;
}

/**
 * Extract actors from a JSDoc node
 * Parses @actor tags in the format: @actor Name {Type} description
 */
function extractActorsFromJsDoc(jsDoc: Node): ActorInfo[] {
  if (!jsDoc.getKind || jsDoc.getKind() !== SyntaxKind.JSDoc) {
    return [];
  }

  const actors: ActorInfo[] = [];
  const doc = jsDoc as JSDoc;
  const tags = doc.getTags();

  // Find all @actor tags
  const actorTags = tags.filter((t) => t.getTagName() === 'actor');

  for (const tag of actorTags) {
    const actor = parseActorTag(tag);
    if (actor) {
      actors.push(actor);
    }
  }

  return actors;
}

/**
 * Parse an @actor tag
 * Format: @actor Name {Type} {Direction?} description
 * Examples:
 * - @actor User {Person} {in} End user who runs archlette commands
 * - @actor FileSystem {System} {out} File system for reading and writing files
 * - @actor Logger {System} {both} Shared logging service
 * - @actor Cache {System} Redis cache (defaults to 'both' if direction omitted)
 */
function parseActorTag(tag: JSDocTag): ActorInfo | undefined {
  const text = tag.getCommentText() || '';
  if (!text) return undefined;

  const trimmed = text.trim();

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
      id: nameToId(name),
      name,
      type,
      direction,
      description,
    };
  }

  return undefined;
}

/**
 * Extract relationships from a JSDoc node
 * Parses @uses tags to identify component dependencies
 */
function extractRelationshipsFromJsDoc(jsDoc: Node): RelationshipInfo[] {
  if (!jsDoc.getKind || jsDoc.getKind() !== SyntaxKind.JSDoc) {
    return [];
  }

  const relationships: RelationshipInfo[] = [];
  const doc = jsDoc as JSDoc;
  const tags = doc.getTags();

  // Find all @uses tags
  const usesTags = tags.filter((t) => t.getTagName() === 'uses');
  for (const tag of usesTags) {
    const rel = parseUsesTag(tag);
    if (rel) {
      relationships.push(rel);
    }
  }

  return relationships;
}

/**
 * Parse a @uses tag
 * Format: @uses Target description
 * Example:
 * - @uses Extractor Analyzes source code
 */
function parseUsesTag(tag: JSDocTag): RelationshipInfo | undefined {
  const text = tag.getCommentText() || '';
  if (!text) return undefined;

  const trimmed = text.trim();

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
 * Extract component name from a JSDoc tag
 * Handles formats like:
 * - @component ComponentName
 * - @component ComponentName - Description
 * - @module path/to/module
 */
function extractComponentName(tag: JSDocTag): string | undefined {
  const text = tag.getCommentText() || '';
  if (!text) return undefined;

  // Remove leading/trailing whitespace
  const trimmed = text.trim();

  // Take everything up to the first dash or newline (for descriptions)
  const match = trimmed.match(/^([^\-\n]+)/);
  if (match) {
    return match[1].trim();
  }

  return trimmed;
}
