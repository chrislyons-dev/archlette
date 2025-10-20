/**
 * @module core
 * @description
 * Structured logging utilities for Archlette pipeline.
 * Uses Pino for fast, structured JSON logging with pretty-printing support.
 */

import { pino } from 'pino';
import type { Logger as PinoLogger } from 'pino';

/**
 * Log level enumeration (matches Pino levels)
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger interface for pipeline stages
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  /** Minimum log level to output */
  level?: LogLevel;
  /** Context/prefix for log messages (e.g., "Extract", "Validate") */
  context?: string;
  /** Enable colored output (default: true in development) */
  color?: boolean;
  /** Enable pretty printing (default: true if TTY, false otherwise) */
  pretty?: boolean;
}

/**
 * Determine if we're in a TTY environment (for pretty printing)
 */
function isTTY(): boolean {
  return process.stdout.isTTY ?? false;
}

/**
 * Create a Pino logger instance with optional pretty printing
 */
function createPinoLogger(level: LogLevel, pretty: boolean): PinoLogger {
  const baseOptions = {
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  // In test environments, write JSON logs to console.log/console.error for test mocks
  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
    // Custom writable stream that routes to console.log/console.error
    const testStream = {
      write(msg: string) {
        // Parse level from JSON to determine console target
        try {
          const parsed = JSON.parse(msg);
          if (parsed.level >= 50) {
            // error level (50) and fatal (60)
            console.error(msg);
          } else {
            console.log(msg);
          }
        } catch {
          // Fallback if not JSON
          console.log(msg);
        }
      },
    };

    return pino(baseOptions, testStream as any);
  }

  if (pretty) {
    // Use pino-pretty for human-readable output
    return pino({
      ...baseOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  // Production mode: structured JSON logs
  return pino(baseOptions);
}

/**
 * Create a logger instance
 *
 * @param options - Logger configuration
 * @returns Logger instance
 *
 * @example
 * ```typescript
 * const log = createLogger({ context: 'Extract', level: 'info' });
 * log.info('Starting extraction...');
 * log.debug('Processing file', { filePath });
 * log.error('Failed to parse', { error });
 * ```
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const { level = 'info', context, pretty = isTTY() } = options;

  // Create base Pino logger
  const pinoLogger = createPinoLogger(level, pretty);

  // Create child logger with context if provided
  const logger = context ? pinoLogger.child({ context }) : pinoLogger;

  // Wrap Pino logger to match our interface
  return {
    debug: (message: string, ...args: unknown[]) => {
      if (args.length > 0) {
        // If args are provided, treat first arg as metadata object
        const [meta] = args;
        if (typeof meta === 'object' && meta !== null) {
          logger.debug(meta, message);
        } else {
          logger.debug({ args }, message);
        }
      } else {
        logger.debug(message);
      }
    },
    info: (message: string, ...args: unknown[]) => {
      if (args.length > 0) {
        const [meta] = args;
        if (typeof meta === 'object' && meta !== null) {
          logger.info(meta, message);
        } else {
          logger.info({ args }, message);
        }
      } else {
        logger.info(message);
      }
    },
    warn: (message: string, ...args: unknown[]) => {
      if (args.length > 0) {
        const [meta] = args;
        if (typeof meta === 'object' && meta !== null) {
          logger.warn(meta, message);
        } else {
          logger.warn({ args }, message);
        }
      } else {
        logger.warn(message);
      }
    },
    error: (message: string, ...args: unknown[]) => {
      if (args.length > 0) {
        const [meta] = args;
        if (typeof meta === 'object' && meta !== null) {
          // Handle Error objects specially
          if (meta instanceof Error) {
            logger.error({ err: meta }, message);
          } else {
            logger.error(meta, message);
          }
        } else {
          logger.error({ args }, message);
        }
      } else {
        logger.error(message);
      }
    },
  };
}

/**
 * Default logger instance (no context)
 */
export const logger = createLogger();
