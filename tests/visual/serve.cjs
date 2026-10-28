// Static server for the visual tests: serves public/ only. Qase and Firebase are stubbed in the test.
const http = require('node:http')
const { readFile } = require('node:fs/promises')
const { extname, join, normalize } = require('node:path')
const root = normalize(join(__dirname, '..', '..', 'public'))
const types = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json' }
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x')
  const p = normalize(join(root, u.pathname === '/' ? 'index.html' : u.pathname))
  if (!p.startsWith(root)) { res.writeHead(403); res.end(); return }
  try { const b = await readFile(p); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() }
}).listen(Number(process.env.PORT || 4173), '127.0.0.1')
