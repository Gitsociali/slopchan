import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { resolvePort } from './dev-server-utils.mjs';

const isWindows = process.platform === 'win32';
const usePortless = process.env.PORTLESS !== '0' && !isWindows;
const binDir = join(process.cwd(), 'node_modules', '.bin');
const executableSuffix = isWindows ? '.cmd' : '';
const portlessBin = join(binDir, `portless${executableSuffix}`);
const viteBin = join(binDir, `vite${executableSuffix}`);
const fallbackHost = '127.0.0.1';
const fallbackUrlHost = '5chan.localhost';
const fallbackRequestedPort = 1355;

const command = usePortless && existsSync(portlessBin) ? portlessBin : viteBin;
let args;

if (command === portlessBin) {
  args = ['5chan', 'vite'];
} else {
  const port = await resolvePort(fallbackRequestedPort);
  const fallbackUrl = `http://${fallbackUrlHost}:${port}`;

  args = ['--host', fallbackHost, '--port', String(port), '--strictPort'];

  if (command !== portlessBin && process.env.PORTLESS !== '0') {
    console.warn(`portless unavailable on this platform, using vite directly on ${fallbackUrl}`);
  } else {
    console.log(`Starting Vite directly at ${fallbackUrl}`);
  }

  if (port !== fallbackRequestedPort) {
    console.log(`Preferred port ${fallbackRequestedPort} is busy, so this run will use ${fallbackUrl}.`);
  }
}

const child = spawn(command, args, {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
