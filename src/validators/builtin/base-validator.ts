/**
 * Base IR validator for Archlette pipeline
 *
 * @module validators
 * @description
 * Validates the aggregated ArchletteIR against the canonical Zod schema.
 * Throws an error if the IR is invalid. No mutation or enrichment is performed.
 *
 * This is intended as the first validator in the pipeline, ensuring that
 * downstream validators and generators always receive a valid IR.
 *
 * @example
 * import baseValidator from './validators/base-validator';
 * const validIR = baseValidator(ir);
 */

import { zArchletteIR } from '../../core/types-ir.js';
import type { ArchletteValidator } from '../../core/stage-interfaces.js';

/**
 * Validates the IR against the Zod schema. Throws if invalid.
 * @param ir - The input ArchletteIR
 * @returns The same IR if valid
 * @throws Error if the IR is invalid
 */
const baseValidator: ArchletteValidator = (ir) => {
  const result = zArchletteIR.safeParse(ir);
  if (!result.success) {
    throw new Error('ArchletteIR validation failed: ' + result.error.toString());
  }
  return ir;
};

export default baseValidator;
