import * as terraform from './builtin/terraform.js';
import * as code from './builtin/code-annotations.js';
import * as openapi from './builtin/openapi.js';

/**
 * Registry mapping `use:` strings in aac.yaml to extractor functions.
 * Example: { use: 'builtin/terraform', name: 'tf', inputs: {...} }
 */
export const registry = {
  'builtin/terraform': terraform.run,
  'builtin/code-annotations': code.run,
  'builtin/openapi': openapi.run,
};
