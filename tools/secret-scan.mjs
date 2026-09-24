import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const findings = [];
const patterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['service account private key', /"private_key"\s*:\s*"[^"\n]{20,}/],
  ['GitHub token', /\b(?:ghp|gho|ghs|ghu)_[A-Za-z0-9]{30,}\b/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Stripe live secret', /\bsk_live_[A-Za-z0-9]{20,}\b/],
];
for (const file of new Set(files)) {
  if (/\.(?:keystore|jks|p12|pfx|dpapi)$/i.test(file) || /(?:service-account|credentials).*\.json$/i.test(file)) {
    findings.push({ file, reason: 'credential/signing file must not be tracked' }); continue;
  }
  if (/^(?:node_modules|functions\/node_modules|audit-output|grant_outputs|Logo and Vids)\//.test(file)) continue;
  try {
    const info = await stat(file);
    if (!info.isFile() || info.size > 5 * 1024 * 1024) continue;
    const value = await readFile(file, 'utf8');
    for (const [reason, pattern] of patterns) if (pattern.test(value)) findings.push({ file, reason });
  } catch { /* Deleted files are not new exposures. */ }
}
// Values are never printed. This is defense in depth, not a complete secret detector.
if (findings.length) { console.error(JSON.stringify({ findings }, null, 2)); process.exitCode = 1; }
else console.info(`Secret/signing scan passed (${new Set(files).size} paths; no secret values emitted).`);
