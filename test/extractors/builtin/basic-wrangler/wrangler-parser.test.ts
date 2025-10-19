/**
 * Unit tests for wrangler.toml parser
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseWranglerFile,
  normalizeServiceBindings,
  getEnvironments,
  getEnvironmentConfig,
} from '../../../../src/extractors/builtin/basic-wrangler/wrangler-parser.js';

const TEST_DIR = join(process.cwd(), 'test-tmp');

describe('wrangler-parser', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe('parseWranglerFile', () => {
    it('should parse minimal wrangler.toml file', async () => {
      const filePath = join(TEST_DIR, 'minimal.toml');
      writeFileSync(
        filePath,
        `
name = "test-worker"
compatibility_date = "2024-01-01"
`,
      );

      const config = await parseWranglerFile(filePath);

      expect(config.filePath).toBe(filePath);
      expect(config.name).toBe('test-worker');
      expect(config.compatibility_date).toBe('2024-01-01');
      expect(config.services).toBeUndefined();
      expect(config.env).toBeUndefined();
    });

    it('should parse wrangler.toml with service bindings', async () => {
      const filePath = join(TEST_DIR, 'services.toml');
      writeFileSync(
        filePath,
        `
name = "gateway"
main = "src/index.ts"

[[services]]
binding = "SVC_AUTH"
service = "auth-service"
environment = "production"

[[services]]
binding = "SVC_DATA"
service = "data-service"
`,
      );

      const config = await parseWranglerFile(filePath);

      expect(config.name).toBe('gateway');
      expect(config.main).toBe('src/index.ts');
      expect(config.services).toHaveLength(2);
      expect(config.services![0]).toEqual({
        binding: 'SVC_AUTH',
        service: 'auth-service',
        environment: 'production',
      });
      expect(config.services![1]).toEqual({
        binding: 'SVC_DATA',
        service: 'data-service',
        environment: undefined,
      });
    });

    it('should parse wrangler.toml with KV bindings', async () => {
      const filePath = join(TEST_DIR, 'kv.toml');
      writeFileSync(
        filePath,
        `
name = "cache-worker"

[[kv_namespaces]]
binding = "CACHE"
id = "abc123"
preview_id = "def456"
`,
      );

      const config = await parseWranglerFile(filePath);

      expect(config.kv_namespaces).toHaveLength(1);
      expect(config.kv_namespaces![0]).toEqual({
        binding: 'CACHE',
        id: 'abc123',
        preview_id: 'def456',
      });
    });

    it('should parse wrangler.toml with R2 bindings', async () => {
      const filePath = join(TEST_DIR, 'r2.toml');
      writeFileSync(
        filePath,
        `
name = "storage-worker"

[[r2_buckets]]
binding = "ASSETS"
bucket_name = "my-bucket"
preview_bucket_name = "my-preview-bucket"
`,
      );

      const config = await parseWranglerFile(filePath);

      expect(config.r2_buckets).toHaveLength(1);
      expect(config.r2_buckets![0]).toEqual({
        binding: 'ASSETS',
        bucket_name: 'my-bucket',
        preview_bucket_name: 'my-preview-bucket',
      });
    });

    it('should parse wrangler.toml with D1 bindings', async () => {
      const filePath = join(TEST_DIR, 'd1.toml');
      writeFileSync(
        filePath,
        `
name = "database-worker"

[[d1_databases]]
binding = "DB"
database_name = "main-db"
database_id = "xyz789"
`,
      );

      const config = await parseWranglerFile(filePath);

      expect(config.d1_databases).toHaveLength(1);
      expect(config.d1_databases![0]).toEqual({
        binding: 'DB',
        database_name: 'main-db',
        database_id: 'xyz789',
        preview_database_id: undefined,
      });
    });

    it('should parse wrangler.toml with Durable Object bindings', async () => {
      const filePath = join(TEST_DIR, 'durable.toml');
      writeFileSync(
        filePath,
        `
name = "stateful-worker"

[durable_objects]
bindings = [
  { binding = "COUNTER", class_name = "Counter", script_name = "counter-worker" }
]
`,
      );

      const config = await parseWranglerFile(filePath);

      expect(config.durable_objects?.bindings).toHaveLength(1);
      expect(config.durable_objects!.bindings[0]).toEqual({
        binding: 'COUNTER',
        class_name: 'Counter',
        script_name: 'counter-worker',
      });
    });

    it('should parse wrangler.toml with queue bindings', async () => {
      const filePath = join(TEST_DIR, 'queues.toml');
      writeFileSync(
        filePath,
        `
name = "queue-worker"

[queues]
producers = [{ binding = "JOBS", queue = "job-queue" }]
consumers = [{ queue = "task-queue", binding = "TASKS" }]
`,
      );

      const config = await parseWranglerFile(filePath);

      expect(config.queues?.producers).toHaveLength(1);
      expect(config.queues?.producers![0]).toEqual({
        binding: 'JOBS',
        queue: 'job-queue',
      });
      expect(config.queues?.consumers).toHaveLength(1);
      expect(config.queues?.consumers![0]).toEqual({
        queue: 'task-queue',
        binding: 'TASKS',
      });
    });

    it('should parse wrangler.toml with vars', async () => {
      const filePath = join(TEST_DIR, 'vars.toml');
      writeFileSync(
        filePath,
        `
name = "config-worker"

[vars]
API_URL = "https://api.example.com"
TIMEOUT = "5000"
DEBUG = "true"
`,
      );

      const config = await parseWranglerFile(filePath);

      expect(config.vars).toEqual({
        API_URL: 'https://api.example.com',
        TIMEOUT: '5000',
        DEBUG: 'true',
      });
    });

    it('should parse wrangler.toml with routes and triggers', async () => {
      const filePath = join(TEST_DIR, 'routes.toml');
      writeFileSync(
        filePath,
        `
name = "route-worker"
routes = ["example.com/*", "*.example.com/api/*"]

[triggers]
crons = ["0 0 * * *", "0 */6 * * *"]
`,
      );

      const config = await parseWranglerFile(filePath);

      expect(config.routes).toEqual(['example.com/*', '*.example.com/api/*']);
      expect(config.triggers?.crons).toEqual(['0 0 * * *', '0 */6 * * *']);
    });

    it('should parse wrangler.toml with multiple environments', async () => {
      const filePath = join(TEST_DIR, 'envs.toml');
      writeFileSync(
        filePath,
        `
name = "multi-env-worker"

[vars]
ENV = "production"

[[services]]
binding = "SVC_AUTH"
service = "auth-prod"

[env.development]
name = "multi-env-worker-dev"

[env.development.vars]
ENV = "development"

[[env.development.services]]
binding = "SVC_AUTH"
service = "auth-dev"

[env.preview]
name = "multi-env-worker-preview"
`,
      );

      const config = await parseWranglerFile(filePath);

      expect(config.name).toBe('multi-env-worker');
      expect(config.vars?.ENV).toBe('production');
      expect(config.services![0].service).toBe('auth-prod');

      expect(config.env).toBeDefined();
      expect(config.env!.development).toBeDefined();
      expect(config.env!.development.name).toBe('multi-env-worker-dev');
      expect(config.env!.development.vars?.ENV).toBe('development');
      expect(config.env!.development.services![0].service).toBe('auth-dev');

      expect(config.env!.preview).toBeDefined();
      expect(config.env!.preview.name).toBe('multi-env-worker-preview');
    });

    it('should throw error for invalid TOML', async () => {
      const filePath = join(TEST_DIR, 'invalid.toml');
      writeFileSync(filePath, 'invalid [ toml content');

      await expect(parseWranglerFile(filePath)).rejects.toThrow(
        'Failed to parse wrangler.toml',
      );
    });

    it('should handle missing name field with default', async () => {
      const filePath = join(TEST_DIR, 'noname.toml');
      writeFileSync(filePath, 'compatibility_date = "2024-01-01"');

      const config = await parseWranglerFile(filePath);

      expect(config.name).toBe('unknown');
    });
  });

  describe('normalizeServiceBindings', () => {
    it('should normalize array of service bindings', () => {
      const services = [
        { binding: 'SVC_A', service: 'service-a', environment: 'prod' },
        { binding: 'SVC_B', service: 'service-b' },
      ];

      const result = normalizeServiceBindings(services);

      expect(result).toEqual([
        { binding: 'SVC_A', service: 'service-a', environment: 'prod' },
        { binding: 'SVC_B', service: 'service-b', environment: undefined },
      ]);
    });

    it('should return undefined for null/undefined input', () => {
      expect(normalizeServiceBindings(null)).toBeUndefined();
      expect(normalizeServiceBindings(undefined)).toBeUndefined();
    });

    it('should return undefined for non-array input', () => {
      expect(normalizeServiceBindings({ binding: 'test' } as any)).toBeUndefined();
      expect(normalizeServiceBindings('not-an-array' as any)).toBeUndefined();
    });

    it('should handle empty array', () => {
      const result = normalizeServiceBindings([]);
      expect(result).toEqual([]);
    });
  });

  describe('getEnvironments', () => {
    it('should return production when root has services', () => {
      const config = {
        name: 'test',
        filePath: '/test.toml',
        services: [{ binding: 'SVC', service: 'test-service' }],
      };

      const envs = getEnvironments(config as any);

      expect(envs).toEqual(['production']);
    });

    it('should return production when root has vars', () => {
      const config = {
        name: 'test',
        filePath: '/test.toml',
        vars: { KEY: 'value' },
      };

      const envs = getEnvironments(config as any);

      expect(envs).toEqual(['production']);
    });

    it('should return production when root has KV bindings', () => {
      const config = {
        name: 'test',
        filePath: '/test.toml',
        kv_namespaces: [{ binding: 'KV', id: 'abc' }],
      };

      const envs = getEnvironments(config as any);

      expect(envs).toEqual(['production']);
    });

    it('should return production when root has routes', () => {
      const config = {
        name: 'test',
        filePath: '/test.toml',
        routes: ['example.com/*'],
      };

      const envs = getEnvironments(config as any);

      expect(envs).toEqual(['production']);
    });

    it('should not return production if explicit env.production exists', () => {
      const config = {
        name: 'test',
        filePath: '/test.toml',
        services: [{ binding: 'SVC', service: 'test' }],
        env: {
          production: { name: 'test-prod' },
        },
      };

      const envs = getEnvironments(config as any);

      expect(envs).toEqual(['production']);
      expect(envs).toHaveLength(1);
    });

    it('should return named environments from env config', () => {
      const config = {
        name: 'test',
        filePath: '/test.toml',
        env: {
          development: { name: 'test-dev' },
          preview: { name: 'test-preview' },
        },
      };

      const envs = getEnvironments(config as any);

      expect(envs).toContain('development');
      expect(envs).toContain('preview');
    });

    it('should return both production and named environments', () => {
      const config = {
        name: 'test',
        filePath: '/test.toml',
        services: [{ binding: 'SVC', service: 'test' }],
        env: {
          development: { name: 'test-dev' },
        },
      };

      const envs = getEnvironments(config as any);

      expect(envs).toContain('production');
      expect(envs).toContain('development');
      expect(envs).toHaveLength(2);
    });

    it('should return empty array for config without deployable content', () => {
      const config = {
        name: 'test',
        filePath: '/test.toml',
      };

      const envs = getEnvironments(config as any);

      expect(envs).toEqual([]);
    });
  });

  describe('getEnvironmentConfig', () => {
    it('should return root config for production environment', () => {
      const config = {
        name: 'test-worker',
        filePath: '/test.toml',
        vars: { KEY: 'prod-value' },
        services: [{ binding: 'SVC', service: 'prod-service' }],
      };

      const envConfig = getEnvironmentConfig(config as any, 'production');

      expect(envConfig.name).toBe('test-worker');
      expect(envConfig.vars).toEqual({ KEY: 'prod-value' });
      expect(envConfig.services).toEqual([{ binding: 'SVC', service: 'prod-service' }]);
    });

    it('should merge root and env-specific vars', () => {
      const config = {
        name: 'test-worker',
        filePath: '/test.toml',
        vars: { ROOT_KEY: 'root', SHARED: 'root-value' },
        env: {
          development: {
            vars: { DEV_KEY: 'dev', SHARED: 'dev-value' },
          },
        },
      };

      const envConfig = getEnvironmentConfig(config as any, 'development');

      expect(envConfig.vars).toEqual({
        ROOT_KEY: 'root',
        SHARED: 'dev-value', // env takes precedence
        DEV_KEY: 'dev',
      });
    });

    it('should override services with env-specific services', () => {
      const config = {
        name: 'test-worker',
        filePath: '/test.toml',
        services: [{ binding: 'SVC', service: 'prod-service' }],
        env: {
          development: {
            services: [{ binding: 'SVC', service: 'dev-service' }],
          },
        },
      };

      const envConfig = getEnvironmentConfig(config as any, 'development');

      expect(envConfig.services).toEqual([{ binding: 'SVC', service: 'dev-service' }]);
    });

    it('should override name with env-specific name', () => {
      const config = {
        name: 'test-worker',
        filePath: '/test.toml',
        env: {
          development: {
            name: 'test-worker-dev',
          },
        },
      };

      const envConfig = getEnvironmentConfig(config as any, 'development');

      expect(envConfig.name).toBe('test-worker-dev');
    });

    it('should override all binding types with env-specific bindings', () => {
      const config = {
        name: 'test-worker',
        filePath: '/test.toml',
        kv_namespaces: [{ binding: 'KV', id: 'root-kv' }],
        r2_buckets: [{ binding: 'R2', bucket_name: 'root-bucket' }],
        d1_databases: [
          { binding: 'DB', database_name: 'root-db', database_id: 'root-id' },
        ],
        env: {
          development: {
            kv_namespaces: [{ binding: 'KV', id: 'dev-kv' }],
            r2_buckets: [{ binding: 'R2', bucket_name: 'dev-bucket' }],
            d1_databases: [
              { binding: 'DB', database_name: 'dev-db', database_id: 'dev-id' },
            ],
          },
        },
      };

      const envConfig = getEnvironmentConfig(config as any, 'development');

      expect(envConfig.kv_namespaces).toEqual([{ binding: 'KV', id: 'dev-kv' }]);
      expect(envConfig.r2_buckets).toEqual([
        { binding: 'R2', bucket_name: 'dev-bucket' },
      ]);
      expect(envConfig.d1_databases).toEqual([
        { binding: 'DB', database_name: 'dev-db', database_id: 'dev-id' },
      ]);
    });

    it('should handle environment without overrides', () => {
      const config = {
        name: 'test-worker',
        filePath: '/test.toml',
        vars: { KEY: 'value' },
      };

      const envConfig = getEnvironmentConfig(config as any, 'staging');

      expect(envConfig.name).toBe('test-worker');
      expect(envConfig.vars).toEqual({ KEY: 'value' });
    });
  });
});
