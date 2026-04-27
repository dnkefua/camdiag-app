// Simple static file server for Firebase App Hosting (Cloud Run)
// Serves the Vite build output and handles SPA routing
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const DIST_DIR = join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.webp': 'image/webp',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.wasm': 'application/wasm',
};

const sendFile = async (res, filePath, status = 200) => {
  try {
    const data = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(status, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
};

const serve = async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let filePath;

  // Serve static files from dist
  if (url.pathname.startsWith('/assets/') || extname(url.pathname)) {
    filePath = join(DIST_DIR, url.pathname);
    await sendFile(res, filePath);
    return;
  }

  // Serve index.html for all other routes (SPA routing)
  filePath = join(DIST_DIR, 'index.html');
  const indexStat = await stat(filePath).catch(() => null);
  if (!indexStat) {
    res.writeHead(503);
    res.end('dist/index.html not found — run npm run build first');
    return;
  }

  const indexContent = await readFile(filePath, 'utf-8');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(indexContent);
};

const server = createServer(serve);
server.listen(PORT, () => {
  console.log(`CamDiag server running on port ${PORT}`);
  console.log(`Serving static files from: ${DIST_DIR}`);
});
