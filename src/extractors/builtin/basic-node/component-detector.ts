/**
 * Component identification from JSDoc annotations
 */

import type { SourceFile, Node } from 'ts-morph';
import { SyntaxKind } from 'ts-morph';

export interface ComponentInfo {
  id: string;
  name: string;
  description?: string;
}

export interface ActorInfo {
  id: string;
  name: string;
  type: 'Person' | 'System';
  description?: string;
}

export interface RelationshipInfo {
  source: string; // Source component/actor ID (inferred from file)
  target: string; // Target component/actor name
  description?: string;
  direction: 'outbound' | 'inbound'; // @uses = outbound, @usedBy = inbound
}

/**
 * Extract component information from file-level JSDoc
 * Checks the first JSDoc comment in the file for @component, @module, or @namespace tags
 */
export function extractFileComponent(
  sourceFile: SourceFile,
): ComponentInfo | undefined {
  // Get all statements in the file
  const statements = sourceFile.getStatements();

  if (statements.length === 0) return undefined;

  // Check if first statement has leading JSDoc
  const firstStatement = statements[0];
  const jsDocs = firstStatement.getChildrenOfKind(SyntaxKind.JSDoc);

  if (jsDocs.length === 0) {
    // Try to get JSDoc from the module itself
    const moduleJsDocs = sourceFile.getChildrenOfKind(SyntaxKind.JSDoc);
    if (moduleJsDocs.length > 0) {
      return extractComponentFromJsDoc(moduleJsDocs[0]);
    }
    return undefined;
  }

  // Check the first JSDoc for component/module/namespace tags
  return extractComponentFromJsDoc(jsDocs[0]);
}

/**
 * Extract actors from file-level JSDoc
 * Looks for @actor tags in the format: @actor Name {Type} description
 * Examples:
 * - @actor User {Person} End user who runs archlette commands
 * - @actor FileSystem {System} File system for reading and writing files
 */
export function extractFileActors(sourceFile: SourceFile): ActorInfo[] {
  const actors: ActorInfo[] = [];

  // Get all statements in the file
  const statements = sourceFile.getStatements();
  if (statements.length === 0) return actors;

  // Check if first statement has leading JSDoc
  const firstStatement = statements[0];
  let jsDocs = firstStatement.getChildrenOfKind(SyntaxKind.JSDoc);

  if (jsDocs.length === 0) {
    // Try to get JSDoc from the module itself
    jsDocs = sourceFile.getChildrenOfKind(SyntaxKind.JSDoc);
  }

  // Extract actors from all JSDoc comments
  for (const jsDoc of jsDocs) {
    const extracted = extractActorsFromJsDoc(jsDoc);
    actors.push(...extracted);
  }

  return actors;
}

/**
 * Extract relationships from file-level JSDoc
 * Looks for @uses and @usedBy tags
 * Examples:
 * - @uses Extractor Analyzes source code to extract architecture components
 * - @usedBy CLI For reading configuration files and writing output
 */
export function extractFileRelationships(sourceFile: SourceFile): RelationshipInfo[] {
  const relationships: RelationshipInfo[] = [];

  // Get all statements in the file
  const statements = sourceFile.getStatements();
  if (statements.length === 0) return relationships;

  // Check if first statement has leading JSDoc
  const firstStatement = statements[0];
  let jsDocs = firstStatement.getChildrenOfKind(SyntaxKind.JSDoc);

  if (jsDocs.length === 0) {
    // Try to get JSDoc from the module itself
    jsDocs = sourceFile.getChildrenOfKind(SyntaxKind.JSDoc);
  }

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

  // Cast to any to access JSDoc methods (ts-morph types)
  const doc = jsDoc as any;
  const tags = doc.getTags ? doc.getTags() : [];

  // Look for @component, @module, or @namespace (in that priority order)
  for (const tagName of ['component', 'module', 'namespace']) {
    const tag = tags.find((t: any) => t.getTagName() === tagName);
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
  const doc = jsDoc as any;
  const tags = doc.getTags ? doc.getTags() : [];

  // Find all @actor tags
  const actorTags = tags.filter((t: any) => t.getTagName() === 'actor');

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
 * Format: @actor Name {Type} description
 * Examples:
 * - @actor User {Person} End user who runs archlette commands
 * - @actor FileSystem {System} File system for reading and writing files
 */
function parseActorTag(tag: any): ActorInfo | undefined {
  const text = tag.getCommentText ? tag.getCommentText() : '';
  if (!text) return undefined;

  const trimmed = text.trim();

  // Match pattern: Name {Type} description
  // Group 1: Name (everything before {)
  // Group 2: Type (Person or System)
  // Group 3: Description (everything after })
  const match = trimmed.match(/^([^{]+)\{(Person|System)\}\s*(.*)$/);

  if (match) {
    const name = match[1].trim();
    const type = match[2] as 'Person' | 'System';
    const description = match[3].trim() || undefined;

    return {
      id: nameToId(name),
      name,
      type,
      description,
    };
  }

  return undefined;
}

/**
 * Extract relationships from a JSDoc node
 * Parses @uses and @usedBy tags
 */
function extractRelationshipsFromJsDoc(jsDoc: Node): RelationshipInfo[] {
  if (!jsDoc.getKind || jsDoc.getKind() !== SyntaxKind.JSDoc) {
    return [];
  }

  const relationships: RelationshipInfo[] = [];
  const doc = jsDoc as any;
  const tags = doc.getTags ? doc.getTags() : [];

  // Find all @uses tags (outbound relationships)
  const usesTags = tags.filter((t: any) => t.getTagName() === 'uses');
  for (const tag of usesTags) {
    const rel = parseRelationshipTag(tag, 'outbound');
    if (rel) {
      relationships.push(rel);
    }
  }

  // Find all @usedBy tags (inbound relationships)
  const usedByTags = tags.filter((t: any) => t.getTagName() === 'usedBy');
  for (const tag of usedByTags) {
    const rel = parseRelationshipTag(tag, 'inbound');
    if (rel) {
      relationships.push(rel);
    }
  }

  return relationships;
}

/**
 * Parse a @uses or @usedBy tag
 * Format: @uses Target description
 * Format: @usedBy Source description
 * Examples:
 * - @uses Extractor Analyzes source code
 * - @usedBy CLI For reading configuration
 */
function parseRelationshipTag(
  tag: any,
  direction: 'outbound' | 'inbound',
): RelationshipInfo | undefined {
  const text = tag.getCommentText ? tag.getCommentText() : '';
  if (!text) return undefined;

  const trimmed = text.trim();

  // Match pattern: TargetName optional {Type} description
  // For @uses: target is the first word, rest is description
  // For @usedBy: source is the first word, rest is description
  const match = trimmed.match(/^(\S+)(?:\s+\{[^}]+\})?\s*(.*)$/);

  if (match) {
    const targetOrSource = match[1].trim();
    const description = match[2].trim() || undefined;

    return {
      source: '', // Will be filled by mapper with the current file's component ID
      target: targetOrSource,
      description,
      direction,
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
function extractComponentName(tag: any): string | undefined {
  const text = tag.getCommentText ? tag.getCommentText() : '';
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

/**
 * Convert component name to ID
 * Examples:
 * - "Payment Processor" -> "payment-processor"
 * - "payments/processor" -> "payments-processor"
 * - "PaymentService" -> "paymentservice"
 */
function nameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s/]+/g, '-') // Replace spaces and slashes with dashes
    .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric (except dashes)
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
}
