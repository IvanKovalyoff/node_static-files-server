'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(process.cwd(), 'public');

function createServer() {
  const server = http.createServer((req, res) => {
    let { pathname } = new URL(req.url, 'http://localhost');

    // 🚫 duplicated slashes
    if (pathname.startsWith('/file/') && pathname.includes('//')) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');

      return;
    }

    // ℹ️ /file hint
    if (pathname === '/file') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Hint: load files using /file/<path-to-file>');
      pathname = '/file/';

      return;
    }

    // ℹ️ invalid routes
    if (!pathname.startsWith('/file/')) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Hint: load files using /file/<path-to-file>');

      return;
    }

    // map files
    let relativePath = pathname.slice(6);

    if (!relativePath) {
      relativePath = 'index.html';
    }

    const filePath = path.join(PUBLIC_DIR, relativePath);
    const resolvedPath = path.resolve(filePath);
    const resolvedPublicDir = path.resolve(PUBLIC_DIR);

    // 🚫 traversal protection
    if (!resolvedPath.startsWith(resolvedPublicDir)) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Bad Request');

      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');

        return;
      }

      fs.createReadStream(filePath)
        .on('error', () => {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
        })
        .pipe(res);
    });
  });

  return server;
}

module.exports = {
  createServer,
};
