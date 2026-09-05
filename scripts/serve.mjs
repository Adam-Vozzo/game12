import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.argv[2] || 'dist/client');
const basePath = process.argv[3] || '';
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.rsc': 'text/x-component',
  '.txt': 'text/plain; charset=utf-8',
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (basePath && url.pathname === basePath) {
      res.writeHead(301, { Location: basePath + '/' });
      res.end();
      return;
    }
    if (basePath && !url.pathname.startsWith(basePath + '/')) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    let file = resolve(
      root,
      '.' + decodeURIComponent(url.pathname.slice(basePath.length)),
    );
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const data = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () =>
  process.stdout.write(
    `Luma Tide is ready at http://localhost:${port}${basePath}/\n`,
  ),
);
