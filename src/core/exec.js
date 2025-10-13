import { execa } from 'execa';

export async function sh(cmd, args = [], opts = {}) {
  const proc = execa(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  await proc;
}

export async function shShell(line, opts = {}) {
  // run through shell for complex pipelines
  const proc = execa(line, { stdio: 'inherit', shell: true, ...opts });
  await proc;
}
