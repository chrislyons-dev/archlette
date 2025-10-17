/**
 * Tests for actor direction handling
 */
import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import { extractFileActors } from '../../../../src/extractors/builtin/basic-node/component-detector.js';

describe('extractFileActors - direction parsing', () => {
  it('extracts actor with {in} direction', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      /**
       * @component UserService
       * @actor User {Person} {in} End user who calls the API
       */
      export class UserService {}
      `,
    );

    const actors = extractFileActors(sourceFile);

    expect(actors).toHaveLength(1);
    expect(actors[0].name).toBe('User');
    expect(actors[0].type).toBe('Person');
    expect(actors[0].direction).toBe('in');
    expect(actors[0].description).toBe('End user who calls the API');
  });

  it('extracts actor with {out} direction', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      /**
       * @component DataService
       * @actor Database {System} {out} PostgreSQL database for persistence
       */
      export class DataService {}
      `,
    );

    const actors = extractFileActors(sourceFile);

    expect(actors).toHaveLength(1);
    expect(actors[0].name).toBe('Database');
    expect(actors[0].type).toBe('System');
    expect(actors[0].direction).toBe('out');
    expect(actors[0].description).toBe('PostgreSQL database for persistence');
  });

  it('extracts actor with {both} direction', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      /**
       * @component LoggingService
       * @actor Logger {System} {both} Shared logging service
       */
      export class LoggingService {}
      `,
    );

    const actors = extractFileActors(sourceFile);

    expect(actors).toHaveLength(1);
    expect(actors[0].name).toBe('Logger');
    expect(actors[0].type).toBe('System');
    expect(actors[0].direction).toBe('both');
    expect(actors[0].description).toBe('Shared logging service');
  });

  it('defaults to {both} when direction is omitted', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      /**
       * @component CacheService
       * @actor Cache {System} Redis cache for session storage
       */
      export class CacheService {}
      `,
    );

    const actors = extractFileActors(sourceFile);

    expect(actors).toHaveLength(1);
    expect(actors[0].name).toBe('Cache');
    expect(actors[0].type).toBe('System');
    expect(actors[0].direction).toBe('both');
    expect(actors[0].description).toBe('Redis cache for session storage');
  });

  it('extracts multiple actors with different directions', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      /**
       * @component ApiGateway
       * @actor User {Person} {in} End user making requests
       * @actor Database {System} {out} PostgreSQL database
       * @actor MessageQueue {System} {both} RabbitMQ message broker
       * @actor Cache {System} Redis cache (default direction)
       */
      export class ApiGateway {}
      `,
    );

    const actors = extractFileActors(sourceFile);

    expect(actors).toHaveLength(4);

    expect(actors[0].name).toBe('User');
    expect(actors[0].direction).toBe('in');

    expect(actors[1].name).toBe('Database');
    expect(actors[1].direction).toBe('out');

    expect(actors[2].name).toBe('MessageQueue');
    expect(actors[2].direction).toBe('both');

    expect(actors[3].name).toBe('Cache');
    expect(actors[3].direction).toBe('both');
  });

  it('handles actor with description containing braces', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      /**
       * @component AuthService
       * @actor User {Person} {in} User with credentials {username, password}
       */
      export class AuthService {}
      `,
    );

    const actors = extractFileActors(sourceFile);

    expect(actors).toHaveLength(1);
    expect(actors[0].name).toBe('User');
    expect(actors[0].type).toBe('Person');
    expect(actors[0].direction).toBe('in');
    expect(actors[0].description).toBe('User with credentials {username, password}');
  });
});
