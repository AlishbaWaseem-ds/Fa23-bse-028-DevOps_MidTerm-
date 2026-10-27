# Assignment Submission Portal (CSC418 Lab Midterm)

Plain HTML/CSS/JavaScript frontend + dependency-free Node.js (20+) backend. Students submit name, registration number, assignment title and a submission URL; valid submissions are saved and listed.

## Structure
- `public/` – frontend (`index.html`, `style.css`, `app.js`, shared `validation.js`)
- `server.js`, `lib/store.js` – API (`GET/POST /api/submissions`), data saved in `data/submissions.json`
- `tests/` – automated tests (Node built-in test runner)
- `scripts/run-tests.js` – runs the tests, builds the JSON report, POSTs it to the receiver
- `receiver/receiver.js` – local HTTP receiver that saves `test-report.json`
- `.github/workflows/ci.yml` – CI pipeline (tests, optional email, conditional Pages deploy)

## Run the application
```bash
npm start        # http://localhost:3000
```

## Run the tests
```bash
npm test         # exits non-zero if any test fails; writes report.json
```

## Start the receiver
```bash
npm run receiver          # listens on http://localhost:4000/report
# optional: RECEIVER_TOKEN=secret RECEIVER_PORT=4000 npm run receiver
```
Test locally: `RECEIVER_URL=http://localhost:4000/report npm test` → `test-report.json` appears in the project root.

## Reaching your computer from GitHub Actions
A hosted runner's `localhost` is the runner itself, so expose the receiver with a tunnel:
```bash
npm run receiver
ngrok http 4000            # or: cloudflared tunnel --url http://localhost:4000
```
Then in GitHub: **Settings → Secrets and variables → Actions → Secrets** add
- `RECEIVER_URL` = `https://<your-tunnel-host>/report`
- `RECEIVER_TOKEN` = any shared secret (also set it when starting the receiver)

Keep the receiver and tunnel running during the demo. The report is sent for passing and failing runs (the script posts before exiting non-zero).

## Report format (`test-report.json`)
`repository, branch, commitSha, pipelineRunId, timestamp, tests[{name, result, failureMessage}], summary{total, passed, failed, status}`

## Demo workflow
1. Push → all tests pass → `test-report.json` updates (status `passed`).
2. Introduce a defect, e.g. in `public/validation.js` delete the line `if (!clean.regNo) ...`; push → pipeline fails, `test-report.json` shows the failing test and message.
3. Restore the line; push → passing again.

## Bonus: GitHub Pages (conditional deploy)
Repo **Settings → Pages → Source: GitHub Actions**. The `deploy` job runs only on `main` and only if `test` succeeded, so a failing run leaves the previous deployment untouched. The static site runs in demo mode (saves to browser localStorage). URL: `https://<user>.github.io/<repo>/`

## Bonus: Email report
Set Actions **Secrets**: `SMTP_SERVER` (e.g. smtp.gmail.com), `SMTP_USERNAME`, `SMTP_PASSWORD` (app password). Set Actions **Variable** `EMAIL_TO` to the recipient. The email job runs after passing and failing tests, with commit SHA, result, counts, per-test results and `report.json` attached.
