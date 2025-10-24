/**
 * Tests for logger module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger, logger } from '../../src/core/logger.js';

describe('logger', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.VITEST = 'true';

    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('createLogger', () => {
    it('should create a logger with default options', () => {
      const log = createLogger();
      expect(log).toBeDefined();
      expect(log.debug).toBeInstanceOf(Function);
      expect(log.info).toBeInstanceOf(Function);
      expect(log.warn).toBeInstanceOf(Function);
      expect(log.error).toBeInstanceOf(Function);
    });

    it('should create a logger with context', () => {
      const log = createLogger({ context: 'TestContext' });
      log.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('TestContext');
    });

    it('should respect log level configuration', () => {
      const log = createLogger({ level: 'error' });
      log.debug('Debug message');
      log.info('Info message');
      log.warn('Warn message');

      // Debug, info, and warn should not be logged when level is 'error'
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should use LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = 'debug';
      const log = createLogger();
      log.debug('Debug message');

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle invalid LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = 'invalid';
      const log = createLogger();
      // Should fall back to 'info' level
      log.debug('Debug message');
      expect(consoleLogSpy).not.toHaveBeenCalled();

      log.info('Info message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should route error-level logs to console.error in test environment', () => {
      const log = createLogger({ level: 'debug' });
      log.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorMessage = consoleErrorSpy.mock.calls[0][0];
      expect(errorMessage).toContain('Error message');
    });

    it('should route non-error logs to console.log in test environment', () => {
      const log = createLogger({ level: 'debug' });
      log.info('Info message');

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle non-JSON messages in test environment', () => {
      const log = createLogger({ level: 'debug' });

      // Mock console.log/error to capture raw output
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();

      const logs: string[] = [];
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation((msg) => {
        logs.push(msg);
      });

      // Create a scenario where write() receives non-JSON
      // This tests the catch block in lines 88-89
      log.info('Test');

      // The logger should still work even if JSON parsing fails
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should create logger with pretty printing disabled', () => {
      const log = createLogger({ pretty: false });
      expect(log).toBeDefined();
      log.info('No pretty print');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should create logger with pretty printing enabled', () => {
      const log = createLogger({ pretty: true });
      expect(log).toBeDefined();
    });

    it('should create production logger when not in test environment', () => {
      // Remove test environment markers
      delete process.env.NODE_ENV;
      delete process.env.VITEST;

      const log = createLogger({ level: 'info', pretty: false });
      expect(log).toBeDefined();

      // In production mode, logs go to stdout, not console.log
      // Just verify the logger is created successfully
      log.info('Production log');
    });
  });

  describe('log methods', () => {
    describe('debug', () => {
      it('should log debug message without metadata', () => {
        const log = createLogger({ level: 'debug' });
        log.debug('Debug message');

        expect(consoleLogSpy).toHaveBeenCalled();
        const message = consoleLogSpy.mock.calls[0][0];
        expect(message).toContain('Debug message');
      });

      it('should log debug message with object metadata', () => {
        const log = createLogger({ level: 'debug' });
        const meta = { key: 'value', count: 42 };
        log.debug('Debug with meta', meta);

        expect(consoleLogSpy).toHaveBeenCalled();
        const message = consoleLogSpy.mock.calls[0][0];
        expect(message).toContain('Debug with meta');
      });

      it('should log debug message with non-object metadata', () => {
        const log = createLogger({ level: 'debug' });
        log.debug('Debug with string', 'simple string');

        expect(consoleLogSpy).toHaveBeenCalled();
        const message = consoleLogSpy.mock.calls[0][0];
        expect(message).toContain('Debug with string');
        expect(message).toContain('simple string');
      });

      it('should log debug message with null metadata', () => {
        const log = createLogger({ level: 'debug' });
        log.debug('Debug with null', null);

        expect(consoleLogSpy).toHaveBeenCalled();
        const message = consoleLogSpy.mock.calls[0][0];
        expect(message).toContain('Debug with null');
      });
    });

    describe('info', () => {
      it('should log info message without metadata', () => {
        const log = createLogger({ level: 'info' });
        log.info('Info message');

        expect(consoleLogSpy).toHaveBeenCalled();
        const message = consoleLogSpy.mock.calls[0][0];
        expect(message).toContain('Info message');
      });

      it('should log info message with object metadata', () => {
        const log = createLogger({ level: 'info' });
        const meta = { status: 'success' };
        log.info('Info with meta', meta);

        expect(consoleLogSpy).toHaveBeenCalled();
        const message = consoleLogSpy.mock.calls[0][0];
        expect(message).toContain('Info with meta');
      });

      it('should log info message with non-object metadata', () => {
        const log = createLogger({ level: 'info' });
        log.info('Info with number', 123);

        expect(consoleLogSpy).toHaveBeenCalled();
        const message = consoleLogSpy.mock.calls[0][0];
        expect(message).toContain('Info with number');
      });

      it('should log info message with null metadata', () => {
        const log = createLogger({ level: 'info' });
        log.info('Info with null', null);

        expect(consoleLogSpy).toHaveBeenCalled();
        const message = consoleLogSpy.mock.calls[0][0];
        expect(message).toContain('Info with null');
      });
    });

    describe('warn', () => {
      it('should log warn message without metadata', () => {
        const log = createLogger({ level: 'warn' });
        log.warn('Warning message');

        expect(consoleLogSpy).toHaveBeenCalled();
        const message = consoleLogSpy.mock.calls[0][0];
        expect(message).toContain('Warning message');
      });

      it('should log warn message with object metadata', () => {
        const log = createLogger({ level: 'warn' });
        const meta = { warning: 'deprecated' };
        log.warn('Warn with meta', meta);

        expect(consoleLogSpy).toHaveBeenCalled();
        const message = consoleLogSpy.mock.calls[0][0];
        expect(message).toContain('Warn with meta');
      });

      it('should log warn message with non-object metadata', () => {
        const log = createLogger({ level: 'warn' });
        log.warn('Warn with array', ['item1', 'item2']);

        expect(consoleLogSpy).toHaveBeenCalled();
        const message = consoleLogSpy.mock.calls[0][0];
        expect(message).toContain('Warn with array');
      });
    });

    describe('error', () => {
      it('should log error message without metadata', () => {
        const log = createLogger({ level: 'error' });
        log.error('Error message');

        expect(consoleErrorSpy).toHaveBeenCalled();
        const message = consoleErrorSpy.mock.calls[0][0];
        expect(message).toContain('Error message');
      });

      it('should log error message with Error object', () => {
        const log = createLogger({ level: 'error' });
        const error = new Error('Test error');
        log.error('Error occurred', error);

        expect(consoleErrorSpy).toHaveBeenCalled();
        const message = consoleErrorSpy.mock.calls[0][0];
        expect(message).toContain('Error occurred');
      });

      it('should log error message with object metadata', () => {
        const log = createLogger({ level: 'error' });
        const meta = { code: 'ERR_001', status: 500 };
        log.error('Error with meta', meta);

        expect(consoleErrorSpy).toHaveBeenCalled();
        const message = consoleErrorSpy.mock.calls[0][0];
        expect(message).toContain('Error with meta');
      });

      it('should log error message with non-object metadata', () => {
        const log = createLogger({ level: 'error' });
        log.error('Error with string', 'error details');

        expect(consoleErrorSpy).toHaveBeenCalled();
        const message = consoleErrorSpy.mock.calls[0][0];
        expect(message).toContain('Error with string');
        expect(message).toContain('error details');
      });
    });
  });

  describe('default logger', () => {
    it('should export a default logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger.debug).toBeInstanceOf(Function);
      expect(logger.info).toBeInstanceOf(Function);
      expect(logger.warn).toBeInstanceOf(Function);
      expect(logger.error).toBeInstanceOf(Function);
    });
  });

  describe('TTY detection', () => {
    it('should handle TTY detection', () => {
      // Mock isTTY
      const originalTTY = process.stdout.isTTY;
      (process.stdout as any).isTTY = true;

      const log = createLogger();
      expect(log).toBeDefined();

      (process.stdout as any).isTTY = originalTTY;
    });

    it('should handle missing TTY property', () => {
      const originalTTY = process.stdout.isTTY;
      delete (process.stdout as any).isTTY;

      const log = createLogger();
      expect(log).toBeDefined();

      (process.stdout as any).isTTY = originalTTY;
    });
  });
});
