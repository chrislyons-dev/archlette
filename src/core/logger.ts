/**
 * @module core
 * @description
 * Structured logging utilities for Archlette pipeline.
 * Provides consistent log formatting with timestamps, levels, and context.
 */

/**
 * Log level enumeration
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
  /** Enable colored output (default: true) */
  color?: boolean;
}

/**
 * ANSI color codes for console output
 */
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
} as const;

/**
 * Log level hierarchy for filtering
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Log level colors
 */
const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: COLORS.gray,
  info: COLORS.blue,
  warn: COLORS.yellow,
  error: COLORS.red,
};

/**
 * Log level labels (fixed width for alignment)
 */
const LEVEL_LABELS: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO ',
  warn: 'WARN ',
  error: 'ERROR',
};

/**
 * Format timestamp as ISO 8601 (local time)
 */
function formatTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Format log message with timestamp, level, and context
 */
function formatLogMessage(
  level: LogLevel,
  message: string,
  context?: string,
  useColor = true,
): string {
  const timestamp = formatTimestamp();
  const levelLabel = LEVEL_LABELS[level];
  const contextStr = context ? ` [${context}]` : '';

  if (useColor) {
    const color = LEVEL_COLORS[level];
    const dimColor = COLORS.gray;
    return `${dimColor}${timestamp}${COLORS.reset} ${color}${levelLabel}${COLORS.reset}${COLORS.cyan}${contextStr}${COLORS.reset} ${message}`;
  }

  return `${timestamp} ${levelLabel}${contextStr} ${message}`;
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
 * log.debug('Processing file', filePath);
 * log.error('Failed to parse', error);
 * ```
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const { level = 'info', context, color = true } = options;
  const minLevel = LOG_LEVELS[level];

  function shouldLog(msgLevel: LogLevel): boolean {
    return LOG_LEVELS[msgLevel] >= minLevel;
  }

  function log(msgLevel: LogLevel, message: string, ...args: unknown[]): void {
    if (!shouldLog(msgLevel)) return;

    const formatted = formatLogMessage(msgLevel, message, context, color);

    // Output to appropriate stream
    const stream = msgLevel === 'error' ? console.error : console.log;

    if (args.length > 0) {
      stream(formatted, ...args);
    } else {
      stream(formatted);
    }
  }

  return {
    debug: (message: string, ...args: unknown[]) => log('debug', message, ...args),
    info: (message: string, ...args: unknown[]) => log('info', message, ...args),
    warn: (message: string, ...args: unknown[]) => log('warn', message, ...args),
    error: (message: string, ...args: unknown[]) => log('error', message, ...args),
  };
}

/**
 * Default logger instance (no context)
 */
export const logger = createLogger();
