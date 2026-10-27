// Local HTTP receiver: saves the posted test report as test-report.json
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.RECEIVER_PORT || 4000;
const TOKEN = process.env.RECEIVER_TOKEN || '';
const OUT = path.join(__dirname, '..', 'test-report.json');

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/report') {
    if (TOKEN && req.headers['x-report-token'] !== TOKEN) { res.writeHead(401); return res.end('Unauthorized'); }
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 2e6) req.destroy(); });
    req.on('end', () => {
      try {
        const report = JSON.parse(body);
        fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
        console.log(`[${new Date().toLocaleTimeString()}] Saved ${OUT} (status: ${report.summary && report.summary.status}, commit: ${String(report.commitSha).slice(0, 7)})`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"saved":true}');
      } catch (e) { res.writeHead(400); res.end('Invalid JSON'); }
    });
    return;
  }
  res.writeHead(404); res.end('POST reports to /report');
}).listen(PORT, () => console.log(`Receiver listening on http://localhost:${PORT}/report`));
