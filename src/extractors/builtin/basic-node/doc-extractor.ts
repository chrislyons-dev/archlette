/**
 * Documentation extraction utilities
 * Extracts language-agnostic documentation from JSDoc comments
 */

import { type JSDoc, type JSDocTag } from 'ts-morph';
import type { DocInfo, DeprecationInfo } from './types.js';

/**
 * Extract documentation information from JSDoc
 */
export function extractDocumentation(jsDocs: JSDoc[]): DocInfo | undefined {
  if (jsDocs.length === 0) return undefined;

  const jsDoc = jsDocs[0]; // Usually only one JSDoc block per declaration
  const description = jsDoc.getDescription().trim();
  const tags = jsDoc.getTags();

  const examples: string[] = [];
  const remarks: string[] = [];
  const seeAlso: string[] = [];

  for (const tag of tags) {
    const tagName = tag.getTagName();
    const text = tag.getCommentText()?.trim();

    if (!text) continue;

    switch (tagName) {
      case 'example':
        examples.push(text);
        break;
      case 'remarks':
      case 'note':
        remarks.push(text);
        break;
      case 'see':
        seeAlso.push(text);
        break;
    }
  }

  if (
    !description &&
    examples.length === 0 &&
    remarks.length === 0 &&
    seeAlso.length === 0
  ) {
    return undefined;
  }

  return {
    summary: description || undefined,
    examples: examples.length > 0 ? examples : undefined,
    remarks: remarks.length > 0 ? remarks : undefined,
    seeAlso: seeAlso.length > 0 ? seeAlso : undefined,
  };
}

/**
 * Extract deprecation information from JSDoc
 */
export function extractDeprecation(jsDocs: JSDoc[]): DeprecationInfo | undefined {
  if (jsDocs.length === 0) return undefined;

  const jsDoc = jsDocs[0];
  const deprecatedTag = jsDoc.getTags().find((t) => t.getTagName() === 'deprecated');

  if (!deprecatedTag) return undefined;

  const reason = deprecatedTag.getCommentText()?.trim();

  // Try to extract alternative from the reason text
  // Common patterns: "Use XYZ instead", "Replaced by XYZ", "See XYZ"
  let alternative: string | undefined;
  if (reason) {
    const match = reason.match(/(?:use|see|replaced by)\s+([A-Za-z0-9_]+)/i);
    if (match) {
      alternative = match[1];
    }
  }

  return {
    reason: reason || 'This code is deprecated',
    alternative,
  };
}

/**
 * Extract parameter descriptions from JSDoc
 */
export function extractParameterDescriptions(jsDocs: JSDoc[]): Map<string, string> {
  const descriptions = new Map<string, string>();

  if (jsDocs.length === 0) return descriptions;

  const jsDoc = jsDocs[0];
  const paramTags = jsDoc.getTags().filter((t) => t.getTagName() === 'param');

  for (const tag of paramTags) {
    const name = extractParameterName(tag);
    const description = tag.getCommentText()?.trim();

    if (name && description) {
      descriptions.set(name, description);
    }
  }

  return descriptions;
}

/**
 * Extract return description from JSDoc
 */
export function extractReturnDescription(jsDocs: JSDoc[]): string | undefined {
  if (jsDocs.length === 0) return undefined;

  const jsDoc = jsDocs[0];
  const returnTag = jsDoc
    .getTags()
    .find((t) => t.getTagName() === 'returns' || t.getTagName() === 'return');

  return returnTag?.getCommentText()?.trim();
}

/**
 * Extract parameter name from @param tag
 * Handles formats like: @param name, @param {Type} name, @param name - description
 */
function extractParameterName(tag: JSDocTag): string | undefined {
  // Get the structure which contains the full text
  const structure = tag.getStructure();

  // For @param tags, the structure.text contains "paramName - description"
  if ('text' in structure && typeof structure.text === 'string') {
    const text = structure.text.trim();
    // Remove type annotation if present: {Type}
    const withoutType = text.replace(/^\{[^}]+\}\s*/, '');
    // Extract first word (parameter name) before - or whitespace
    const match = withoutType.match(/^([A-Za-z0-9_$.[\]]+)/);
    return match?.[1];
  }

  return undefined;
}
