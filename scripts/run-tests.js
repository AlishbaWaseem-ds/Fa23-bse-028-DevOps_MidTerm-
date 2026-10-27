// Runs the real tests, builds a JSON report, POSTs it to the receiver (if configured),
// and exits non-zero when any test fails.
const { run } = require('node:test');
const fs = require('fs');
const path = require('path');

const env = process.env;
const files = fs.readdirSync(path.join(__dirname, '..', 'tests')).filter((f) => f.endsWith('.test.js')).map((f) => path.join(__dirname, '..', 'tests', f));

async function main() {
  const tests = [];
  const stream = run({ files, concurrency: false });
  stream.on('test:pass', (e) => { if (e.nesting === 0 || true) tests.push({ name: e.name, result: 'passed', failureMessage: null }); });
  stream.on('test:fail', (e) => {
    const err = e.details && e.details.error;
    tests.push({ name: e.name, result: 'failed', failureMessage: err ? String(err.cause && err.cause.message || err.message) : 'Unknown failure' });
  });
  stream.on('test:stderr', (e) => process.stderr.write(e.message));
  stream.on('test:stdout', (e) => process.stdout.write(e.message));
  // consume stream
  // eslint-disable-next-line no-unused-vars
  for await (const _ of stream) { /* drain */ }

  const passed = tests.filter((t) => t.result === 'passed').length;
  const failed = tests.length - passed;
  const report = {
    repository: env.GITHUB_REPOSITORY || path.basename(process.cwd()),
    branch: env.GITHUB_REF_NAME || 'local',
    commitSha: env.GITHUB_SHA || 'local',
    pipelineRunId: env.GITHUB_RUN_ID || 'local',
    timestamp: new Date().toISOString(),
    tests,
    summary: { total: tests.length, passed, failed, status: failed === 0 && tests.length > 0 ? 'passed' : 'failed' },
  };

  // Fixed to test-report.json
  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
  console.log(`\nTests: ${passed}/${tests.length} passed -> ${report.summary.status.toUpperCase()}`);

  if (env.RECEIVER_URL) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (env.RECEIVER_TOKEN) headers['X-Report-Token'] = env.RECEIVER_TOKEN;
      const res = await fetch(env.RECEIVER_URL, { method: 'POST', headers, body: JSON.stringify(report) });
      console.log(`Report delivered to receiver: HTTP ${res.status}`);
    } catch (e) {
      console.error('Could not deliver report to receiver:', e.message);
    }
  } else {
    console.log('RECEIVER_URL not set; report saved to test-report.json only.');
  }
  process.exit(report.summary.status === 'passed' ? 0 : 1);
}
main();