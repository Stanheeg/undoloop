import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT || 4173);
const root = process.cwd();
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.md':'text/markdown; charset=utf-8' };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/') rel = '/index.html';
    const safe = normalize(rel).replace(/^([.][.][/\\])+/, '');
    const file = join(root, safe);
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not file');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`UndoLoop http://127.0.0.1:${port}`));
