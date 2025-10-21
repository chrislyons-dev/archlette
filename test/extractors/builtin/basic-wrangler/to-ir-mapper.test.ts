/**
 * Unit tests for wrangler to-IR mapper
 */
import { describe, it, expect } from 'vitest';
import { mapToIR } from '../../../../src/extractors/builtin/basic-wrangler/to-ir-mapper.js';
import type { WranglerConfig } from '../../../../src/extractors/builtin/basic-wrangler/types.js';

describe('to-ir-mapper', () => {
  describe('mapToIR', () => {
    it('should create empty IR for empty config array', () => {
      const ir = mapToIR([]);

      expect(ir.version).toBe('1.0');
      expect(ir.system.name).toBe('Unknown System');
      expect(ir.containers).toEqual([]);
      expect(ir.deployments).toEqual([]);
      expect(ir.containerRelationships).toEqual([]);
      expect(ir.deploymentRelationships).toEqual([]);
    });

    it('should extract containers from wrangler configs', () => {
      const configs: WranglerConfig[] = [
        {
          filePath: '/workers/api.toml',
          name: 'api-worker',
          main: 'src/index.ts',
          compatibility_date: '2024-01-01',
        },
        {
          filePath: '/workers/auth.toml',
          name: 'auth-worker',
          compatibility_date: '2024-01-01',
        },
      ];

      const ir = mapToIR(configs);

      expect(ir.containers).toHaveLength(2);
      expect(ir.containers[0]).toMatchObject({
        id: 'api-worker',
        name: 'api-worker',
        type: 'Cloudflare Worker',
        layer: 'Application',
        tags: ['cloudflare', 'worker'],
      });
      expect(ir.containers[0].props).toEqual({
        technology: 'Cloudflare Workers',
        filePath: '/workers/api.toml',
      });
      expect(ir.containers[0].description).toBe(
        'Entry: src/index.ts | Compatibility: 2024-01-01',
      );

      expect(ir.containers[1]).toMatchObject({
        id: 'auth-worker',
        name: 'auth-worker',
        type: 'Cloudflare Worker',
        layer: 'Application',
      });
    });

    it('should extract unique environments across all configs', () => {
      const configs: WranglerConfig[] = [
        {
          filePath: '/workers/api.toml',
          name: 'api-worker',
          services: [{ binding: 'AUTH', service: 'auth-worker' }], // Has root config -> production
          env: {
            development: { name: 'api-worker-dev' },
            preview: { name: 'api-worker-preview' },
          },
        },
        {
          filePath: '/workers/auth.toml',
          name: 'auth-worker',
          vars: { KEY: 'value' }, // Has root config -> production
          env: {
            development: { name: 'auth-worker-dev' },
            staging: { name: 'auth-worker-staging' },
          },
        },
      ];

      const ir = mapToIR(configs);

      expect(ir.deployments).toHaveLength(4);
      const envNames = ir.deployments.map((d) => d.name);
      expect(envNames).toContain('production');
      expect(envNames).toContain('development');
      expect(envNames).toContain('preview');
      expect(envNames).toContain('staging');
    });

    it('should create deployments with correct structure', () => {
      const configs: WranglerConfig[] = [
        {
          filePath: '/workers/api.toml',
          name: 'api-worker',
          services: [{ binding: 'AUTH', service: 'auth-worker' }],
        },
      ];

      const ir = mapToIR(configs);

      expect(ir.deployments).toHaveLength(1);
      expect(ir.deployments[0]).toMatchObject({
        name: 'production',
        environment: 'production',
        platform: 'Cloudflare Workers',
      });
      expect(ir.deployments[0].instances).toBeDefined();
      expect(ir.deployments[0].instances).toHaveLength(1);
    });

    it('should create container instances with service bindings', () => {
      const configs: WranglerConfig[] = [
        {
          filePath: '/workers/gateway.toml',
          name: 'gateway',
          services: [
            { binding: 'SVC_AUTH', service: 'auth', environment: 'production' },
            { binding: 'SVC_DATA', service: 'data' },
          ],
          vars: { API_KEY: 'secret' },
          routes: ['example.com/*'],
          triggers: { crons: ['0 0 * * *'] },
        },
      ];

      const ir = mapToIR(configs);

      const deployment = ir.deployments[0];
      expect(deployment.instances).toHaveLength(1);

      const instance = deployment.instances![0];
      expect(instance.id).toBe('production__gateway');
      expect(instance.containerRef).toBe('gateway');
      expect(instance.name).toBe('gateway');
      expect(instance.type).toBe('Cloudflare Worker');

      expect(instance.bindings).toHaveLength(2);
      expect(instance.bindings![0]).toMatchObject({
        type: 'service',
        binding: 'SVC_AUTH',
        service: 'auth',
        environment: 'production',
      });
      expect(instance.bindings![1]).toMatchObject({
        type: 'service',
        binding: 'SVC_DATA',
        service: 'data',
      });

      expect(instance.vars).toEqual({ API_KEY: 'secret' });
      expect(instance.routes).toEqual(['example.com/*']);
      expect(instance.triggers).toEqual([{ type: 'cron', schedule: '0 0 * * *' }]);
    });

    it('should create container instances with KV bindings', () => {
      const configs: WranglerConfig[] = [
        {
          filePath: '/workers/cache.toml',
          name: 'cache-worker',
          kv_namespaces: [
            { binding: 'CACHE', id: 'kv-abc123' },
            { binding: 'SESSION', id: 'kv-def456' },
          ],
        },
      ];

      const ir = mapToIR(configs);

      const instance = ir.deployments[0].instances![0];
      expect(instance.bindings).toHaveLength(2);
      expect(instance.bindings![0]).toMatchObject({
        type: 'kv',
        binding: 'CACHE',
        namespace: 'kv-abc123',
      });
      expect(instance.bindings![1]).toMatchObject({
        type: 'kv',
        binding: 'SESSION',
        namespace: 'kv-def456',
      });
    });

    it('should create container instances with R2 bindings', () => {
      const configs: WranglerConfig[] = [
        {
          filePath: '/workers/storage.toml',
          name: 'storage-worker',
          r2_buckets: [{ binding: 'ASSETS', bucket_name: 'my-bucket' }],
        },
      ];

      const ir = mapToIR(configs);

      const instance = ir.deployments[0].instances![0];
      expect(instance.bindings).toHaveLength(1);
      expect(instance.bindings![0]).toMatchObject({
        type: 'r2',
        binding: 'ASSETS',
        bucket: 'my-bucket',
      });
    });

    it('should create container instances with D1 bindings', () => {
      const configs: WranglerConfig[] = [
        {
          filePath: '/workers/db.toml',
          name: 'db-worker',
          d1_databases: [
            { binding: 'DB', database_name: 'main', database_id: 'db-123' },
          ],
        },
      ];

      const ir = mapToIR(configs);

      const instance = ir.deployments[0].instances![0];
      expect(instance.bindings).toHaveLength(1);
      expect(instance.bindings![0]).toMatchObject({
        type: 'd1',
        binding: 'DB',
        database: 'main',
      });
    });

    it('should create container instances with Durable Object bindings', () => {
      const configs: WranglerConfig[] = [
        {
          filePath: '/workers/stateful.toml',
          name: 'stateful-worker',
          vars: { KEY: 'value' }, // Need some root config to create production env
          durable_objects: {
            bindings: [
              {
                binding: 'COUNTER',
                class_name: 'Counter',
                script_name: 'counter-do',
              },
            ],
          },
        },
      ];

      const ir = mapToIR(configs);

      const instance = ir.deployments[0].instances![0];
      expect(instance.bindings).toHaveLength(1);
      expect(instance.bindings![0]).toMatchObject({
        type: 'durable_object',
        binding: 'COUNTER',
        className: 'Counter',
        scriptName: 'counter-do',
      });
    });

    it('should create container instances with queue bindings', () => {
      const configs: WranglerConfig[] = [
        {
          filePath: '/workers/queue.toml',
          name: 'queue-worker',
          vars: { KEY: 'value' }, // Need some root config to create production env
          queues: {
            producers: [{ binding: 'JOBS', queue: 'job-queue' }],
            consumers: [{ binding: 'task-queue', queue: 'task-queue' }],
          },
        },
      ];

      const ir = mapToIR(configs);

      const instance = ir.deployments[0].instances![0];
      expect(instance.bindings).toHaveLength(2);
      expect(instance.bindings![0]).toMatchObject({
        type: 'queue_producer',
        binding: 'JOBS',
        queue: 'job-queue',
      });
      expect(instance.bindings![1]).toMatchObject({
        type: 'queue_consumer',
        binding: 'task-queue',
        queue: 'task-queue',
      });
    });

    it('should create container instances for each environment', () => {
      const configs: WranglerConfig[] = [
        {
          filePath: '/workers/api.toml',
          name: 'api-worker',
          services: [{ binding: 'AUTH', service: 'auth' }],
          env: {
            development: {
              name: 'api-worker-dev',
              services: [{ binding: 'AUTH', service: 'auth', environment: 'dev' }],
            },
            preview: {
              name: 'api-worker-preview',
            },
          },
        },
      ];

      const ir = mapToIR(configs);

      expect(ir.deployments).toHaveLength(3);

      const prodDeployment = ir.deployments.find((d) => d.name === 'production');
      expect(prodDeployment?.instances).toHaveLength(1);
      expect(prodDeployment?.instances![0].id).toBe('production__api-worker');

      const devDeployment = ir.deployments.find((d) => d.name === 'development');
      expect(devDeployment?.instances).toHaveLength(1);
      expect(devDeployment?.instances![0].id).toBe('development__api-worker');
      expect(devDeployment?.instances![0].name).toBe('api-worker-dev');

      const previewDeployment = ir.deployments.find((d) => d.name === 'preview');
      expect(previewDeployment?.instances).toHaveLength(1);
      expect(previewDeployment?.instances![0].id).toBe('preview__api-worker');
    });

    it('should extract container relationships from service bindings', () => {
      const configs: WranglerConfig[] = [
        {
          filePath: '/workers/gateway.toml',
          name: 'gateway',
          services: [
            { binding: 'SVC_AUTH', service: 'auth' },
            { binding: 'SVC_DATA', service: 'data' },
          ],
        },
        {
          filePath: '/workers/auth.toml',
          name: 'auth',
          services: [{ binding: 'SVC_USER', service: 'user-service' }],
        },
      ];

      const ir = mapToIR(configs);

      expect(ir.containerRelationships).toHaveLength(3);
      expect(ir.containerRelationships[0]).toMatchObject({
        source: 'gateway',
        destination: 'auth',
        description: 'Service binding: SVC_AUTH',
        tags: ['service-binding'],
      });
      expect(ir.containerRelationships[1]).toMatchObject({
        source: 'gateway',
        destination: 'data',
        description: 'Service binding: SVC_DATA',
        tags: ['service-binding'],
      });
      expect(ir.containerRelationships[2]).toMatchObject({
        source: 'auth',
        destination: 'user-service',
      });
    });

    it('should deduplicate container relationships across environments', () => {
      const configs: WranglerConfig[] = [
        {
          filePath: '/workers/gateway.toml',
          name: 'gateway',
          services: [{ binding: 'SVC_AUTH', service: 'auth' }],
          env: {
            development: {
              services: [{ binding: 'SVC_AUTH', service: 'auth' }],
            },
            preview: {
              services: [{ binding: 'SVC_AUTH', service: 'auth' }],
            },
          },
        },
      ];

      const ir = mapToIR(configs);

      // Should only have one container relationship despite 3 environments
      expect(ir.containerRelationships).toHaveLength(1);
      expect(ir.containerRelationships[0]).toMatchObject({
        source: 'gateway',
        destination: 'auth',
      });
    });

    it('should extract deployment relationships from container instances', () => {
      const configs: WranglerConfig[] = [
        {
          filePath: '/workers/gateway.toml',
          name: 'gateway',
          services: [
            { binding: 'SVC_AUTH', service: 'auth' },
            { binding: 'SVC_DATA', service: 'data' },
          ],
        },
      ];

      const ir = mapToIR(configs);

      expect(ir.deploymentRelationships).toHaveLength(2);
      expect(ir.deploymentRelationships[0]).toMatchObject({
        source: 'production__gateway',
        destination: 'production__auth',
        description: 'Service binding: SVC_AUTH',
        tags: ['service-binding', 'runtime'],
      });
      expect(ir.deploymentRelationships[1]).toMatchObject({
        source: 'production__gateway',
        destination: 'production__data',
        description: 'Service binding: SVC_DATA',
        tags: ['service-binding', 'runtime'],
      });
    });

    it('should handle cross-environment service bindings', () => {
      const configs: WranglerConfig[] = [
        {
          filePath: '/workers/gateway.toml',
          name: 'gateway',
          env: {
            development: {
              services: [
                { binding: 'SVC_AUTH', service: 'auth', environment: 'production' },
              ],
            },
          },
        },
      ];

      const ir = mapToIR(configs);

      const devRelationships = ir.deploymentRelationships.filter((r) =>
        r.source.startsWith('development__'),
      );
      expect(devRelationships).toHaveLength(1);
      expect(devRelationships[0]).toMatchObject({
        source: 'development__gateway',
        destination: 'production__auth', // Cross-environment binding
      });
    });

    it('should use custom system metadata if provided', () => {
      const configs: WranglerConfig[] = [
        {
          filePath: '/workers/api.toml',
          name: 'api-worker',
        },
      ];

      const customSystem = {
        name: 'Custom System',
        description: 'Custom description',
        repository: 'https://github.com/custom/repo',
      };

      const ir = mapToIR(configs, customSystem);

      expect(ir.system).toEqual(customSystem);
    });

    it('should handle multiple workers with complex bindings', () => {
      const configs: WranglerConfig[] = [
        {
          filePath: '/workers/gateway.toml',
          name: 'gateway',
          services: [
            { binding: 'SVC_AUTH', service: 'auth' },
            { binding: 'SVC_PRICING', service: 'pricing' },
          ],
          kv_namespaces: [{ binding: 'CACHE', id: 'kv-123' }],
          vars: { API_VERSION: 'v1' },
        },
        {
          filePath: '/workers/auth.toml',
          name: 'auth',
          d1_databases: [
            { binding: 'DB', database_name: 'users', database_id: 'db-456' },
          ],
          services: [{ binding: 'SVC_EMAIL', service: 'email-service' }],
        },
        {
          filePath: '/workers/pricing.toml',
          name: 'pricing',
          r2_buckets: [{ binding: 'DATA', bucket_name: 'pricing-data' }],
        },
      ];

      const ir = mapToIR(configs);

      expect(ir.containers).toHaveLength(3);
      expect(ir.deployments).toHaveLength(1);
      expect(ir.deployments[0].instances).toHaveLength(3);
      expect(ir.containerRelationships).toHaveLength(3);

      // Gateway should have 3 bindings: 2 services + 1 KV
      const gatewayInstance = ir.deployments[0].instances!.find(
        (i) => i.containerRef === 'gateway',
      );
      expect(gatewayInstance?.bindings).toHaveLength(3);

      // Auth should have 2 bindings: 1 D1 + 1 service
      const authInstance = ir.deployments[0].instances!.find(
        (i) => i.containerRef === 'auth',
      );
      expect(authInstance?.bindings).toHaveLength(2);

      // Pricing should have 1 binding: R2
      const pricingInstance = ir.deployments[0].instances!.find(
        (i) => i.containerRef === 'pricing',
      );
      expect(pricingInstance?.bindings).toHaveLength(1);
    });
  });
});
