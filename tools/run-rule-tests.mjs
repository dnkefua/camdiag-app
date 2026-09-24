import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const configDirectory = await mkdtemp(join(tmpdir(), 'camdiag-firebase-config-'));
const emulatorCache = resolve('audit-output', 'emulator-cache');
await mkdir(emulatorCache, { recursive: true });
const cli = resolve('node_modules/firebase-tools/lib/bin/firebase.js');
const child = spawn(process.execPath, [cli, 'emulators:exec', '--only', 'firestore,storage', '--project', 'demo-camdiag-hardening', 'node node_modules/vitest/vitest.mjs run --config vitest.rules.config.ts'], {
  stdio: 'inherit',
  env: { ...process.env, XDG_CONFIG_HOME: configDirectory, FIREBASE_EMULATORS_PATH: process.env.FIREBASE_EMULATORS_PATH ?? emulatorCache, CI: 'true' },
});
const code = await new Promise((done) => {
  child.once('exit', (exitCode) => done(exitCode ?? 1));
  child.once('error', () => done(1));
});
if (configDirectory.startsWith(join(tmpdir(), 'camdiag-firebase-config-'))) await rm(configDirectory, { recursive: true, force: true });
process.exitCode = code;
