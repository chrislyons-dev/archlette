/**
 * Tests for actor relationship creation based on direction
 */
import { describe, it, expect } from 'vitest';
import { parseFiles } from '../../../../src/extractors/builtin/basic-node/file-parser.js';
import { mapToIR } from '../../../../src/extractors/builtin/basic-node/to-ir-mapper.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

describe('Actor relationships - direction handling', () => {
  const testDir = join(process.cwd(), 'test-temp-actor-dir');

  // Helper to create test file and extract
  async function testActorRelationship(fileContent: string) {
    // Clean up and create test directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      console.warn('Could not clean up test directory');
    }
    mkdirSync(testDir, { recursive: true });

    const testFile = join(testDir, 'test.ts');
    writeFileSync(testFile, fileContent);

    const extractions = await parseFiles([testFile]);
    const ir = mapToIR(extractions);

    // Clean up
    rmSync(testDir, { recursive: true, force: true });

    return ir;
  }

  it('creates actor → component relationship for {in} direction', async () => {
    const fileContent = `
      /**
       * @component UserService
       * @actor User {Person} {in} End user who calls the API
       */
      export class UserService {}
    `;

    const ir = await testActorRelationship(fileContent);

    // Should have one actor
    expect(ir.actors).toHaveLength(1);
    expect(ir.actors[0].name).toBe('User');

    // Actor should have the component in its targets (actor → component)
    expect(ir.actors[0].targets).toContain('userservice');

    // Should NOT have component → actor relationship
    const componentToActorRel = ir.componentRelationships.find(
      (rel) => rel.source === 'userservice' && rel.destination === 'user',
    );
    expect(componentToActorRel).toBeUndefined();
  });

  it('creates component → actor relationship for {out} direction', async () => {
    const fileContent = `
      /**
       * @component DataService
       * @actor Database {System} {out} PostgreSQL database
       */
      export class DataService {}
    `;

    const ir = await testActorRelationship(fileContent);

    // Should have one actor
    expect(ir.actors).toHaveLength(1);
    expect(ir.actors[0].name).toBe('Database');

    // Actor should NOT have the component in its targets (no actor → component)
    expect(ir.actors[0].targets).not.toContain('dataservice');

    // Should have component → actor relationship
    const componentToActorRel = ir.componentRelationships.find(
      (rel) => rel.source === 'dataservice' && rel.destination === 'database',
    );
    expect(componentToActorRel).toBeDefined();
    expect(componentToActorRel?.description).toContain('Database');
  });

  it('creates bidirectional relationships for {both} direction', async () => {
    const fileContent = `
      /**
       * @component LoggingService
       * @actor Logger {System} {both} Shared logging service
       */
      export class LoggingService {}
    `;

    const ir = await testActorRelationship(fileContent);

    // Should have one actor
    expect(ir.actors).toHaveLength(1);
    expect(ir.actors[0].name).toBe('Logger');

    // Actor should have the component in its targets (actor → component)
    expect(ir.actors[0].targets).toContain('loggingservice');

    // Should have component → actor relationship
    const componentToActorRel = ir.componentRelationships.find(
      (rel) => rel.source === 'loggingservice' && rel.destination === 'logger',
    );
    expect(componentToActorRel).toBeDefined();
  });

  it('defaults to bidirectional when direction is omitted', async () => {
    const fileContent = `
      /**
       * @component CacheService
       * @actor Cache {System} Redis cache
       */
      export class CacheService {}
    `;

    const ir = await testActorRelationship(fileContent);

    // Should have one actor
    expect(ir.actors).toHaveLength(1);
    expect(ir.actors[0].name).toBe('Cache');

    // Actor should have the component in its targets (actor → component)
    expect(ir.actors[0].targets).toContain('cacheservice');

    // Should have component → actor relationship
    const componentToActorRel = ir.componentRelationships.find(
      (rel) => rel.source === 'cacheservice' && rel.destination === 'cache',
    );
    expect(componentToActorRel).toBeDefined();
  });

  it('handles multiple actors with different directions', async () => {
    const fileContent = `
      /**
       * @component ApiGateway
       * @actor User {Person} {in} End user making requests
       * @actor Database {System} {out} PostgreSQL database
       * @actor MessageQueue {System} {both} RabbitMQ message broker
       */
      export class ApiGateway {}
    `;

    const ir = await testActorRelationship(fileContent);

    // Should have three actors
    expect(ir.actors).toHaveLength(3);

    // User {in}: only actor → component
    const userActor = ir.actors.find((a) => a.name === 'User');
    expect(userActor?.targets).toContain('apigateway');
    const apiToUser = ir.componentRelationships.find(
      (rel) => rel.source === 'apigateway' && rel.destination === 'user',
    );
    expect(apiToUser).toBeUndefined();

    // Database {out}: only component → actor
    const dbActor = ir.actors.find((a) => a.name === 'Database');
    expect(dbActor?.targets).not.toContain('apigateway');
    const apiToDb = ir.componentRelationships.find(
      (rel) => rel.source === 'apigateway' && rel.destination === 'database',
    );
    expect(apiToDb).toBeDefined();

    // MessageQueue {both}: bidirectional
    const mqActor = ir.actors.find((a) => a.name === 'MessageQueue');
    expect(mqActor?.targets).toContain('apigateway');
    const apiToMq = ir.componentRelationships.find(
      (rel) => rel.source === 'apigateway' && rel.destination === 'messagequeue',
    );
    expect(apiToMq).toBeDefined();
  });
});
