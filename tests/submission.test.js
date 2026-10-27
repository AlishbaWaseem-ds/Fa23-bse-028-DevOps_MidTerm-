const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createServer } = require('../server');

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-'));
  const server = createServer(path.join(dir, 'submissions.json'));
  return new Promise((resolve) => server.listen(0, () => resolve({ server, base: `http://localhost:${server.address().port}` })));
}
const post = (base, body) => fetch(base + '/api/submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const valid = { name: 'Ali Khan', regNo: 'FA23-BSE-028', title: 'DevOps Lab 1', url: 'https://github.com/ali/lab1' };

test('Complete details and a valid URL are saved and appear in the list', async () => {
  const { server, base } = await setup();
  try {
    const res = await post(base, valid);
    assert.equal(res.status, 201);
    const list = await (await fetch(base + '/api/submissions')).json();
    assert.equal(list.length, 1);
    assert.equal(list[0].regNo, valid.regNo);
    assert.equal(list[0].url, valid.url);
  } finally { server.close(); }
});

test('Missing registration number is rejected with a validation message', async () => {
  const { server, base } = await setup();
  try {
    const res = await post(base, { ...valid, regNo: '' });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.errors.regNo && body.errors.regNo.length > 0);
  } finally { server.close(); }
});

test('Invalid submission URL is rejected and not saved', async () => {
  const { server, base } = await setup();
  try {
    const res = await post(base, { ...valid, url: 'not-a-url' });
    assert.equal(res.status, 400);
    const list = await (await fetch(base + '/api/submissions')).json();
    assert.equal(list.length, 0);
  } finally { server.close(); }
});
