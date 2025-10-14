// src/core/exec.js
import { execa } from 'execa';
import { log } from './log.js';

/**
 * Run a command with args. Inherits stdio by default (good for local + CI logs).
 * Throws on non-zero exit with error.code and error.stderr.
 */
export async function sh(cmd, args = [], opts = {}) {
  const options = {
    stdio: 'inherit',
    windowsHide: true,
    ...opts,
  };
  log.verbose?.(`$ ${cmd} ${args.join(' ')}`);
  try {
    const res = await execa(cmd, args, options);
    return res;
  } catch (err) {
    // surface a concise message but keep original error for higher layers
    const code = err.exitCode ?? err.code ?? 'unknown';
    const msg = (err.stderr || err.stdout || err.message || '').toString().trim();
    throw new Error(
      `[exec] ${cmd} ${args.join(' ')} (exit ${code})${msg ? `\n${msg}` : ''}`,
    );
  }
}

/**
 * Run a shell string. Useful for pipes/redirection (e.g., inframap -> DOT).
 * On Windows this uses cmd.exe, on POSIX /bin/sh.
 */
export async function shShell(command, opts = {}) {
  const options = {
    stdio: 'inherit',
    shell: true,
    windowsHide: true,
    ...opts,
  };
  log.verbose?.(`$ ${command}`);
  try {
    const res = await execa(command, { ...options });
    return res;
  } catch (err) {
    const code = err.exitCode ?? err.code ?? 'unknown';
    const msg = (err.stderr || err.stdout || err.message || '').toString().trim();
    throw new Error(`[shell] ${command} (exit ${code})${msg ? `\n${msg}` : ''}`);
  }
}
