const { spawn } = require('node:child_process');

process.env.VITE_E2E_AUTH_BYPASS = 'true';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const child = spawn(npm, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5175'], {
  env: process.env,
  stdio: 'inherit',
  shell: true,
});

const shutdown = (signal) => {
  if (!child.killed) child.kill(signal);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
