/**
 * Integration tests for basic-wrangler extractor
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import basicWranglerExtractor from '../../../../src/extractors/builtin/basic-wrangler.js';
import type { ResolvedStageNode } from '../../../../src/core/types-aac.js';

const TEST_DIR = join(process.cwd(), 'test-tmp-integration');

// Helper to convert paths to forward slashes for globby
const toGlobPattern = (path: string) => path.replace(/\\/g, '/');

describe('basic-wrangler integration', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('should extract from a single wrangler.toml file', async () => {
    const filePath = join(TEST_DIR, 'worker.toml');
    writeFileSync(
      filePath,
      `
name = "api-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
API_URL = "https://api.example.com"

[[services]]
binding = "SVC_AUTH"
service = "auth-service"
`,
    );

    const node: ResolvedStageNode = {
      use: 'builtin/basic-wrangler',
      name: 'test-extractor',
      props: {},
      inputs: {
        include: [toGlobPattern(join(TEST_DIR, '*.toml'))],
      },
      _effective: {
        includes: [],
        excludes: [],
      },
    };

    const ir = await basicWranglerExtractor(node);

    expect(ir.version).toBe('1.0');
    expect(ir.containers).toHaveLength(1);
    expect(ir.containers[0]).toMatchObject({
      id: 'api-worker',
      name: 'api-worker',
      type: 'Cloudflare Worker',
      layer: 'Application',
    });

    expect(ir.deployments).toHaveLength(1);
    expect(ir.deployments[0].name).toBe('production');
    expect(ir.deployments[0].instances).toHaveLength(1);
    expect(ir.deployments[0].instances![0].vars).toEqual({
      API_URL: 'https://api.example.com',
    });

    expect(ir.containerRelationships).toHaveLength(1);
    expect(ir.containerRelationships[0]).toMatchObject({
      source: 'api-worker',
      destination: 'auth-service',
    });

    expect(ir.deploymentRelationships).toHaveLength(1);
    expect(ir.deploymentRelationships[0]).toMatchObject({
      source: 'production::api-worker',
      destination: 'production::auth-service',
    });
  });

  it('should extract from multiple wrangler.toml files', async () => {
    mkdirSync(join(TEST_DIR, 'workers'), { recursive: true });

    writeFileSync(
      join(TEST_DIR, 'workers', 'gateway.toml'),
      `
name = "gateway"

[[services]]
binding = "SVC_AUTH"
service = "auth"

[[services]]
binding = "SVC_DATA"
service = "data"
`,
    );

    writeFileSync(
      join(TEST_DIR, 'workers', 'auth.toml'),
      `
name = "auth"

[[d1_databases]]
binding = "DB"
database_name = "users"
database_id = "db-123"
`,
    );

    writeFileSync(
      join(TEST_DIR, 'workers', 'data.toml'),
      `
name = "data"

[[kv_namespaces]]
binding = "CACHE"
id = "kv-456"
`,
    );

    const node: ResolvedStageNode = {
      use: 'builtin/basic-wrangler',
      name: 'test-extractor',
      props: {},
      inputs: {
        include: [toGlobPattern(join(TEST_DIR, 'workers', '*.toml'))],
      },
      _effective: {
        includes: [],
        excludes: [],
      },
    };

    const ir = await basicWranglerExtractor(node);

    expect(ir.containers).toHaveLength(3);
    const containerNames = ir.containers.map((c) => c.name);
    expect(containerNames).toContain('gateway');
    expect(containerNames).toContain('auth');
    expect(containerNames).toContain('data');

    expect(ir.deployments).toHaveLength(1);
    expect(ir.deployments[0].instances).toHaveLength(3);

    expect(ir.containerRelationships).toHaveLength(2);
    expect(ir.deploymentRelationships).toHaveLength(2);

    // Verify bindings are extracted
    const authInstance = ir.deployments[0].instances!.find(
      (i) => i.containerRef === 'auth',
    );
    expect(authInstance?.bindings).toHaveLength(1);
    expect(authInstance?.bindings![0].type).toBe('d1');

    const dataInstance = ir.deployments[0].instances!.find(
      (i) => i.containerRef === 'data',
    );
    expect(dataInstance?.bindings).toHaveLength(1);
    expect(dataInstance?.bindings![0].type).toBe('kv');
  });

  it('should handle multiple environments correctly', async () => {
    const filePath = join(TEST_DIR, 'multi-env.toml');
    writeFileSync(
      filePath,
      `
name = "multi-env-worker"

[[services]]
binding = "SVC_DB"
service = "database"

[env.development]
name = "multi-env-worker-dev"

[[env.development.services]]
binding = "SVC_DB"
service = "database"
environment = "development"

[env.preview]
name = "multi-env-worker-preview"

[[env.preview.services]]
binding = "SVC_DB"
service = "database"
environment = "preview"
`,
    );

    const node: ResolvedStageNode = {
      use: 'builtin/basic-wrangler',
      name: 'test-extractor',
      props: {},
      inputs: {
        include: [toGlobPattern(join(TEST_DIR, '*.toml'))],
      },
      _effective: {
        includes: [],
        excludes: [],
      },
    };

    const ir = await basicWranglerExtractor(node);

    expect(ir.containers).toHaveLength(1);
    expect(ir.deployments).toHaveLength(3);

    const envNames = ir.deployments.map((d) => d.name).sort();
    expect(envNames).toEqual(['development', 'preview', 'production']);

    // Each deployment should have one instance
    expect(ir.deployments[0].instances).toHaveLength(1);
    expect(ir.deployments[1].instances).toHaveLength(1);
    expect(ir.deployments[2].instances).toHaveLength(1);

    // Deployment relationships should reference correct environments
    const devRel = ir.deploymentRelationships.find((r) =>
      r.source.startsWith('development::'),
    );
    expect(devRel).toBeDefined();
    expect(devRel?.destination).toBe('development::database');

    const previewRel = ir.deploymentRelationships.find((r) =>
      r.source.startsWith('preview::'),
    );
    expect(previewRel).toBeDefined();
    expect(previewRel?.destination).toBe('preview::database');
  });

  it('should return empty IR when no files found', async () => {
    const node: ResolvedStageNode = {
      use: 'builtin/basic-wrangler',
      name: 'test-extractor',
      props: {},
      inputs: {
        include: [toGlobPattern(join(TEST_DIR, 'nonexistent', '*.toml'))],
      },
      _effective: {
        includes: [],
        excludes: [],
      },
    };

    const ir = await basicWranglerExtractor(node);

    expect(ir.containers).toEqual([]);
    expect(ir.deployments).toEqual([]);
    expect(ir.containerRelationships).toEqual([]);
    expect(ir.deploymentRelationships).toEqual([]);
  });

  it('should use system metadata if provided', async () => {
    const filePath = join(TEST_DIR, 'worker.toml');
    writeFileSync(filePath, 'name = "test-worker"');

    const node: ResolvedStageNode = {
      use: 'builtin/basic-wrangler',
      name: 'test-extractor',
      props: {},
      inputs: {
        include: [toGlobPattern(join(TEST_DIR, '*.toml'))],
      },
      _effective: {
        includes: [],
        excludes: [],
      },
      _system: {
        name: 'Custom System',
        description: 'Custom description',
        repository: 'https://github.com/custom/repo',
      },
    };

    const ir = await basicWranglerExtractor(node);

    expect(ir.system.name).toBe('Custom System');
    expect(ir.system.description).toBe('Custom description');
    expect(ir.system.repository).toBe('https://github.com/custom/repo');
  });

  it('should handle complex real-world scenario', async () => {
    mkdirSync(join(TEST_DIR, 'iac', 'workers'), { recursive: true });

    // Gateway worker - talks to all services
    writeFileSync(
      join(TEST_DIR, 'iac', 'workers', 'gateway.toml'),
      `
name = "bond-math-gateway"
main = "../../services/gateway/src/index.ts"
compatibility_date = "2024-11-01"

[[services]]
binding = "SVC_DAYCOUNT"
service = "bond-math-daycount"
environment = "production"

[[services]]
binding = "SVC_PRICING"
service = "bond-math-pricing"
environment = "production"

[vars]
INTERNAL_JWT_TTL = "90"

[env.development]
name = "bond-math-gateway-dev"

[[env.development.services]]
binding = "SVC_DAYCOUNT"
service = "bond-math-daycount"
environment = "development"
`,
    );

    // Daycount worker - standalone
    writeFileSync(
      join(TEST_DIR, 'iac', 'workers', 'daycount.toml'),
      `
name = "bond-math-daycount"
main = "../../services/daycount/src/index.ts"

[[kv_namespaces]]
binding = "CONVENTIONS"
id = "kv-conventions"

[env.development]
name = "bond-math-daycount-dev"
`,
    );

    // Pricing worker - uses data storage
    writeFileSync(
      join(TEST_DIR, 'iac', 'workers', 'pricing.toml'),
      `
name = "bond-math-pricing"

[[r2_buckets]]
binding = "PRICING_DATA"
bucket_name = "pricing-historical"

[[d1_databases]]
binding = "BONDS"
database_name = "bond_catalog"
database_id = "db-bonds"
`,
    );

    const node: ResolvedStageNode = {
      use: 'builtin/basic-wrangler',
      name: 'test-extractor',
      props: {},
      inputs: {
        include: [toGlobPattern(join(TEST_DIR, 'iac', 'workers', '*.toml'))],
      },
      _effective: {
        includes: [],
        excludes: [],
      },
    };

    const ir = await basicWranglerExtractor(node);

    // Verify containers
    expect(ir.containers).toHaveLength(3);
    expect(ir.containers.map((c) => c.name).sort()).toEqual([
      'bond-math-daycount',
      'bond-math-gateway',
      'bond-math-pricing',
    ]);

    // Verify deployments
    expect(ir.deployments).toHaveLength(2);
    const prodDeployment = ir.deployments.find((d) => d.name === 'production');
    const devDeployment = ir.deployments.find((d) => d.name === 'development');

    expect(prodDeployment?.instances).toHaveLength(3);
    expect(devDeployment?.instances).toHaveLength(2); // Only gateway and daycount have dev

    // Verify gateway production instance bindings
    const gatewayProdInstance = prodDeployment?.instances!.find(
      (i) => i.containerRef === 'bond-math-gateway',
    );
    expect(gatewayProdInstance?.bindings).toHaveLength(2);
    expect(gatewayProdInstance?.vars).toEqual({ INTERNAL_JWT_TTL: '90' });

    // Verify pricing instance has both R2 and D1 bindings
    const pricingInstance = prodDeployment?.instances!.find(
      (i) => i.containerRef === 'bond-math-pricing',
    );
    expect(pricingInstance?.bindings).toHaveLength(2);
    expect(pricingInstance?.bindings!.some((b) => b.type === 'r2')).toBe(true);
    expect(pricingInstance?.bindings!.some((b) => b.type === 'd1')).toBe(true);

    // Verify container relationships (logical)
    expect(ir.containerRelationships).toHaveLength(2);
    expect(
      ir.containerRelationships.some(
        (r) =>
          r.source === 'bond-math-gateway' && r.destination === 'bond-math-daycount',
      ),
    ).toBe(true);
    expect(
      ir.containerRelationships.some(
        (r) =>
          r.source === 'bond-math-gateway' && r.destination === 'bond-math-pricing',
      ),
    ).toBe(true);

    // Verify deployment relationships (physical)
    // Production: 2 relationships from gateway
    const prodRels = ir.deploymentRelationships.filter((r) =>
      r.source.startsWith('production::'),
    );
    expect(prodRels).toHaveLength(2);

    // Development: 1 relationship from gateway
    const devRels = ir.deploymentRelationships.filter((r) =>
      r.source.startsWith('development::'),
    );
    expect(devRels).toHaveLength(1);
    expect(devRels[0].destination).toBe('development::bond-math-daycount');
  });
});
