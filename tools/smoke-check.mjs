const webUrl = process.env.CAMDIAG_WEB_URL || 'https://camdiag-c7e78.web.app';
const apiUrl = process.env.CAMDIAG_API_URL || 'https://us-central1-camdiag-c7e78.cloudfunctions.net/api';
const checks = [
  ['web', `${webUrl}/`, false],
  ['api_liveness', `${apiUrl}/health`, true],
  ['api_readiness', `${apiUrl}/ready`, true],
];
for (const [surface, url, json] of checks) {
  try {
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000), cache: 'no-store' });
    const result = { surface, status: response.status, ok: response.ok };
    if (json && response.ok) {
      const body = await response.json();
      result.ok = surface === 'api_liveness'
        ? body.status === 'ok'
        : body.status === 'configured' && body.schemaVersion === 'clinical-v1' && body.providerHealth === 'not_probed';
    }
    if (!json) {
      const csp = response.headers.get('content-security-policy') || '';
      result.headersOk = csp.includes("frame-ancestors 'none'") && !/script-src[^;]*'unsafe-inline'/.test(csp)
        && response.headers.get('x-content-type-options') === 'nosniff'
        && Boolean(response.headers.get('strict-transport-security'));
      result.ok &&= result.headersOk;
    }
    if (!result.ok) process.exitCode = 1;
    console.info(JSON.stringify(result));
  } catch { console.error(JSON.stringify({ surface, ok: false, reason: 'network_or_invalid_response' })); process.exitCode = 1; }
}
console.info('This smoke test does not establish model accuracy, IAM correctness, or clinical approval.');
