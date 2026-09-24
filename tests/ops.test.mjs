import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createAppServer, securityHeaders } from '../server.js';

let directory, server, origin;
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'camdiag-web-test-'));
  await mkdir(join(directory, 'assets'));
  await writeFile(join(directory, 'index.html'), '<!doctype html><title>Synthetic fixture</title>');
  await writeFile(join(directory, 'assets', 'fixture.js'), 'export const fixture=true;');
  await writeFile(join(directory, 'sw.js'), '// fixture');
  server = createAppServer(directory);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  // Only this test-created directory is ever removed.
  assert.ok(directory.startsWith(join(tmpdir(), 'camdiag-web-test-')));
  await rm(directory, { recursive: true, force: true });
});
test('web surfaces share Firebase Hosting headers', async () => {
  for (const path of ['/', '/scanner', '/assets/fixture.js', '/missing.js', '/healthz']) {
    const response = await fetch(`${origin}${path}`);
    for (const [name, value] of Object.entries(securityHeaders)) {
      if (name.toLowerCase() !== 'cache-control') assert.equal(response.headers.get(name), value, `${path}: ${name}`);
    }
  }
});
test('script policy excludes inline scripts and object embedding', () => {
  const csp = securityHeaders['Content-Security-Policy'];
  assert.ok(csp.includes("object-src 'none'"));
  assert.ok(csp.includes("frame-ancestors 'none'"));
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
});
test('only hashed build assets receive immutable caching', async () => {
  assert.equal((await fetch(`${origin}/scanner`)).headers.get('cache-control'), 'no-store');
  assert.match((await fetch(`${origin}/assets/fixture.js`)).headers.get('cache-control'), /immutable/);
  assert.equal((await fetch(`${origin}/sw.js`)).headers.get('cache-control'), 'no-cache');
});
test('readiness proves build presence and does not imply backend readiness', async () => {
  const response = await fetch(`${origin}/healthz`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', surface: 'web', clinicalBackendChecked: false });
});
test('HEAD sends no body and non-read methods are rejected', async () => {
  assert.equal(await (await fetch(origin, { method: 'HEAD' })).text(), '');
  assert.equal((await fetch(origin, { method: 'POST' })).status, 405);
});
test('malformed URL, hidden files and missing assets fail safely', async () => {
  for (const path of ['/%00', '/%GG', '/.env', '/%5C..%5C.env']) assert.equal((await fetch(`${origin}${path}`)).status, 400, path);
  assert.equal((await fetch(`${origin}/missing.js`)).status, 404);
});
test('service worker never forces reload or caches patient/API responses', async () => {
  const code = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
  assert.doesNotMatch(code, /self\.skipWaiting|client\.navigate|clients\.claim|cache\.put/);
  assert.doesNotMatch(code, /camdiag-logo-animation|camdiag-logo\.png/);
  assert.match(code, /OFFLINE_ASSETS = \['\/offline\.html', '\/offline\.css'\]/);
});

test('release smoke accepts configuration readiness without claiming provider health', async () => {
  const api = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(req.url === '/health'
      ? { status: 'ok' }
      : { status: 'configured', schemaVersion: 'clinical-v1', providerHealth: 'not_probed' }));
  });
  await new Promise((resolve) => api.listen(0, '127.0.0.1', resolve));
  try {
    const apiUrl = `http://127.0.0.1:${api.address().port}`;
    const cli = fileURLToPath(new URL('../tools/smoke-check.mjs', import.meta.url));
    const child = spawn(process.execPath, [cli], {
      env: { ...process.env, CAMDIAG_WEB_URL: origin, CAMDIAG_API_URL: apiUrl },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    for await (const chunk of child.stdout) output += chunk;
    const exitCode = await new Promise((resolve) => child.once('exit', resolve));
    assert.equal(exitCode, 0, output);
    assert.match(output, /"surface":"api_readiness","status":200,"ok":true/);
    assert.match(output, /does not establish model accuracy/);
  } finally {
    await new Promise((resolve) => api.close(resolve));
  }
});
