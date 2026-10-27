// Uses the Node API when available; falls back to localStorage (static demo, e.g. GitHub Pages).
const form = document.getElementById('form');
const list = document.getElementById('list');
const msg = document.getElementById('msg');
const modeLabel = document.getElementById('mode');
const LS_KEY = 'submissions';
let useApi = true;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function load() {
  try {
    const r = await fetch('api/submissions');
    if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) throw new Error('no api');
    useApi = true;
    modeLabel.textContent = '(server)';
    return await r.json();
  } catch (e) {
    useApi = false;
    modeLabel.textContent = '(demo mode: saved in this browser)';
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e2) { return []; }
  }
}

function render(items) {
  if (!items.length) { list.innerHTML = '<li class="empty">No submissions yet.</li>'; return; }
  list.innerHTML = items.slice().reverse().map((s) =>
    `<li><strong>${esc(s.title)}</strong><div class="meta">${esc(s.name)} · ${esc(s.regNo)} · ${esc(new Date(s.submittedAt).toLocaleString())}</div><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a></li>`
  ).join('');
}

function showErrors(errors) {
  document.querySelectorAll('.err').forEach((e) => (e.textContent = ''));
  document.querySelectorAll('input').forEach((i) => i.classList.remove('invalid'));
  Object.entries(errors).forEach(([k, v]) => {
    const el = document.querySelector(`.err[data-for="${k}"]`);
    if (el) el.textContent = v;
    const inp = document.getElementById(k);
    if (inp) inp.classList.add('invalid');
  });
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  msg.textContent = ''; msg.className = '';
  const data = Object.fromEntries(new FormData(form));
  const result = Validation.validateSubmission(data);
  showErrors(result.errors);
  if (!result.valid) { msg.textContent = 'Please fix the errors above.'; msg.className = 'bad'; return; }

  if (useApi) {
    const r = await fetch('api/submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result.clean) });
    if (!r.ok) { const b = await r.json(); showErrors(b.errors || {}); msg.textContent = 'Submission rejected.'; msg.className = 'bad'; return; }
  } else {
    const items = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    items.push({ ...result.clean, submittedAt: new Date().toISOString() });
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }
  form.reset();
  msg.textContent = 'Submission saved!'; msg.className = 'ok';
  render(await load());
});

load().then(render);
