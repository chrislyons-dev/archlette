/**
 * File discovery for wrangler.toml files
 */

import { globby } from 'globby';
import type { ExtractorInputs } from './types.js';

/**
 * Find wrangler.toml files based on include/exclude patterns
 *
 * @param inputs - Optional include/exclude patterns
 * @returns Array of absolute file paths to wrangler.toml files
 */
export async function findWranglerFiles(inputs?: ExtractorInputs): Promise<string[]> {
  const includePatterns = inputs?.include || ['**/wrangler.toml', '**/*.toml'];
  const excludePatterns = inputs?.exclude || ['**/node_modules/**'];

  const files = await globby(includePatterns, {
    ignore: excludePatterns,
    absolute: true,
    onlyFiles: true,
  });

  return files;
}
