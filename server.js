import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
// Firebase Hosting and App Hosting share the same checked-in security policy.
const config = JSON.parse(await readFile(resolve(root, 'firebase.json'), 'utf8'));
export const securityHeaders = Object.fromEntries(config.hosting.headers.find((rule) => rule.source === '**').headers.map(({ key, value }) => [key, value]));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain; charset=utf-8' };

export const createAppServer = (distDirectory = resolve(root, 'dist')) => createServer(async (req, res) => {
  for (const [key, value] of Object.entries(securityHeaders)) res.setHeader(key, value);
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').some((part) => part.startsWith('.') && part !== '.well-known')) {
      res.writeHead(400); res.end(); return;
    }
    const isHealth = pathname === '/healthz';
    const asset = extname(pathname) || pathname.startsWith('/assets/');
    const filePath = resolve(distDirectory, asset && !isHealth ? `.${pathname}` : 'index.html');
    if (!filePath.startsWith(`${resolve(distDirectory)}${sep}`)) { res.writeHead(400); res.end(); return; }
    const data = await readFile(filePath);
    if (isHealth) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ status: 'ok', surface: 'web', clinicalBackendChecked: false })); return;
    }
    res.setHeader('Content-Type', MIME[extname(filePath).toLowerCase()] || 'application/octet-stream');
    if (pathname.startsWith('/assets/')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (pathname === '/sw.js') res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Length', data.length);
    res.writeHead(200); res.end(req.method === 'HEAD' ? undefined : data);
  } catch (error) {
    const missing = error?.code === 'ENOENT';
    const status = missing ? (req.url === '/healthz' || !extname(req.url) ? 503 : 404) : 400;
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : status === 503 ? 'Application build unavailable' : 'Not found');
  }
});

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8080);
  createAppServer().listen(port, '0.0.0.0', () => console.info(`CamDiag web listening on ${port}`));
}
