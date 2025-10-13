const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let level = 'info'; // 'silent' | 'info' | 'verbose'

export function setLevel(l) {
  level = l;
}
export function getLevel() {
  return level;
}

function out(enabled, prefix, color, ...args) {
  if (!enabled) return;
  const p = color ? color + prefix + colors.reset : prefix;
  console.log(p, ...args);
}

export const log = {
  info: (...args) => out(level !== 'silent', 'ℹ', colors.cyan, ...args),
  ok: (...args) => out(level !== 'silent', '✓', colors.green, ...args),
  warn: (...args) => out(level !== 'silent', '⚠', colors.yellow, ...args),
  err: (...args) => out(true, '✖', colors.red, ...args),
  verbose: (...args) => out(level === 'verbose', '…', colors.dim, ...args),
  raw: (...args) => console.log(...args),
  colors,
};
