import { expect, test } from 'vitest';
import { aggregateIR } from '../src/ir/aggregate.js';
import { registry } from '../src/extractors/index.js';

test('aggregates include/exclude correctly', async () => {
  const cfg = {
    project: { name: 'Test' },
    ir: { path: '.archlette/ir.json', publish_copy: false },
    extractors: [
      {
        use: 'builtin/terraform',
        name: 'tf',
        inputs: { include: ['tests/fixtures/iac/**'] },
      },
      {
        use: 'builtin/code-annotations',
        name: 'code',
        inputs: { include: ['tests/fixtures/**'] },
      },
    ],
  };
  const ir = await aggregateIR(cfg, process.cwd(), registry);
  const ids = ir.entities.map((e) => e.id);
  expect(ids.find((id) => id.startsWith('infra:'))).toBeTruthy();
  expect(ids).toContain('container:api');
  expect(ids).toContain('container:worker');
});

test('openapi extractor emits api entity and relation', async () => {
  const cfg = {
    project: { name: 'Test' },
    ir: { path: '.archlette/ir.json', publish_copy: false },
    extractors: [
      {
        use: 'builtin/openapi',
        name: 'api',
        inputs: { include: ['tests/fixtures/apis/**'] },
      },
    ],
  };
  const { aggregateIR } = await import('../src/ir/aggregate.js');
  const { registry } = await import('../src/extractors/index.js');
  const ir = await aggregateIR(cfg, process.cwd(), registry);
  const ids = ir.entities.map((e) => e.id);
  expect(ids).toContain('api:bond-math-api');
});
