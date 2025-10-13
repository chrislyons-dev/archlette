import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { expect, test } from 'vitest';

const bin = path.resolve('bin/aac.mjs');

test('prints version', () => {
  const out = execFileSync('node', [bin, '--version']).toString().trim();
  expect(out).toMatch(/\d+\.\d+\.\d+/);
});
