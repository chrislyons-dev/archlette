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
