const http = require('http');
const fs = require('fs');
const path = require('path');
const { Store } = require('./lib/store');
const { validateSubmission } = require('./public/validation');

const PUBLIC = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };

function createServer(dataFile = path.join(__dirname, 'data', 'submissions.json')) {
  const store = new Store(dataFile);

  const json = (res, code, body) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (url.pathname === '/api/submissions' && req.method === 'GET') {
      return json(res, 200, store.all());
    }

    if (url.pathname === '/api/submissions' && req.method === 'POST') {
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 1e5) req.destroy(); });
      req.on('end', () => {
        let payload;
        try { payload = JSON.parse(body || '{}'); } catch (e) { return json(res, 400, { errors: { _: 'Invalid JSON.' } }); }
        const result = validateSubmission(payload);
        if (!result.valid) return json(res, 400, { errors: result.errors });
        return json(res, 201, store.add(result.clean));
      });
      return;
    }

    if (req.method === 'GET') {
      const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      const file = path.join(PUBLIC, rel);
      if (file.startsWith(PUBLIC) && fs.existsSync(file) && fs.statSync(file).isFile()) {
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
        return fs.createReadStream(file).pipe(res);
      }
    }
    json(res, 404, { error: 'Not found' });
  });
}

module.exports = { createServer };

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createServer().listen(port, () => console.log(`Portal running at http://localhost:${port}`));
}
