// Spec docs/sdd/ma-tabs R41 — runs the page's MA script block against a minimal fake DOM.
// Run: node --test scripts/*.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8')
const start = html.indexOf('function maValid(d)')
const end = html.indexOf('// Spec ma-tabs R35')
const block = html.slice(start, end)

const sample = (passed, at) => ({
  measuredAt: at, project: 'MA',
  cases: { total: 10, passed, notPassed: 10 - passed - 2, waiting: 2, passedPercent: passed * 10, notPassedPercent: (8 - passed) * 10, waitingPercent: 20 },
  breakdown: { failed: 8 - passed, skipped: 0, notRun: 0, other: {} },
  types: null, typesError: 'x', run: null,
})

function load({ stored, live, view = 'ma', key = 'mica-ma-overview', tickets = null }) {
  const content = { innerHTML: '', dataset: {} }
  const els = {}
  const urls = []
  const store = new Map(stored ? [[key, JSON.stringify(stored)]] : [])
  const snapshots = []
  const env = {
    document: { getElementById: id => id === 'content' ? content : (els[id] ||= { textContent: '' }) },
    localStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
    escapeHtml: s => String(s), formatBkkTime: d => d.toISOString(),
    animateOls: () => {}, maTypesCard: () => '', activeView: view,
    MA_PAGE_TIMEOUT_MS: 10000, AbortSignal: { timeout: () => undefined },
    importCore: async () => ({ retryable: f => f, hedged: f => f, buildMaOverview: live, buildOlsOverview: live }),
    fetch: async u => { urls.push(u); return tickets ? { ok: true, json: async () => tickets } : { ok: false, status: 404 } },
  }
  const src = block.replace("await import('/ma-progress-core.mjs')", 'await importCore()')
  const fn = new Function(...Object.keys(env), `${src}; return { renderMa, renderOls, snap: () => 0 }`)
  const api = fn(...Object.values(env))
  return { api, content, store, snapshots, els, urls }
}

test('R41: saved numbers paint before Qase answers, then live numbers replace them', async () => {
  let release
  const live = () => new Promise(r => { release = () => r(sample(7, '2026-10-28T11:00:00.000Z')) })
  const { api, content, store } = load({ stored: sample(5, '2026-10-28T10:00:00.000Z'), live })
  const done = api.renderMa()
  await new Promise(r => setTimeout(r, 0))
  assert.match(content.innerHTML, /data-count="5"/)
  assert.match(content.innerHTML, /updating from Qase/)
  release(); await done
  assert.match(content.innerHTML, /data-count="7"/)
  assert.doesNotMatch(content.innerHTML, /updating from Qase/)
  assert.equal(JSON.parse(store.get('mica-ma-overview')).cases.passed, 7)
})

test('R41: a failed live load keeps the saved numbers and says so', async () => {
  const { api, content } = load({ stored: sample(5, '2026-10-28T10:00:00.000Z'), live: async () => { throw new Error('Qase HTTP 521') } })
  await api.renderMa()
  assert.match(content.innerHTML, /data-count="5"/)
  assert.match(content.innerHTML, /failed: Qase HTTP 521/)
})

test('R41/R27: no saved numbers → loading, then live', async () => {
  const { api, content } = load({ stored: null, live: async () => sample(6, '2026-10-28T11:00:00.000Z') })
  const p = api.renderMa()
  assert.match(content.innerHTML, /Loading Qase MA/)
  await p
  assert.match(content.innerHTML, /data-count="6"/)
})

test('R41: an older render that finishes late does not overwrite a newer one', async () => {
  const resolvers = []
  const live = () => new Promise(r => resolvers.push(r))
  const { api, content } = load({ stored: null, live })
  const first = api.renderMa(); const second = api.renderMa()
  await new Promise(r => setTimeout(r, 0))
  resolvers[1](sample(9, '2026-10-28T12:00:00.000Z')); await second
  resolvers[0](sample(1, '2026-10-28T11:00:00.000Z')); await first
  assert.match(content.innerHTML, /data-count="9"/)
})

// ── spec docs/sdd/live-qase-tabs ──
test('live R1/R8: OLS tab is computed live, saved under its own key, MA cache untouched', async () => {
  const { api, content, store } = load({ view: 'ols', key: 'mica-ols-overview', stored: null, live: async () => ({ ...sample(4, '2026-10-28T11:00:00.000Z'), project: 'OLS' }) })
  await api.renderOls()
  assert.match(content.innerHTML, /OLS · Automation progress/)
  assert.match(content.innerHTML, /data-count="4"/)
  assert.match(content.innerHTML, /Qase project OLS/)
  assert.equal(JSON.parse(store.get('mica-ols-overview')).cases.passed, 4)
  assert.equal(store.has('mica-ma-overview'), false)
})

test('live R16: OLS ticket card reads the published site-data file on every open', async () => {
  const tickets = { measuredAt: new Date().toISOString(), done: 684, withAutomatedCase: 292, percent: 42.7 }
  const { api, content, urls } = load({ view: 'ols', key: 'mica-ols-overview', stored: null, tickets, live: async () => ({ ...sample(4, '2026-10-28T11:00:00.000Z'), project: 'OLS' }) })
  await api.renderOls()
  assert.match(content.innerHTML, /292 of 684 tickets<\/div>[\s\S]*updated automatically/) // R19: second line
  assert.doesNotMatch(content.innerHTML, /not live|over 2 h/)
  await api.renderOls()
  assert.equal(urls.filter(u => /site-data\/ols-tickets\.json$/.test(u)).length, 2)
})

test('live R16: a stale or missing ticket file says so and shows no number', async () => {
  const old = { measuredAt: '2026-10-01T00:00:00.000Z', done: 10, withAutomatedCase: 5, percent: 50 }
  const a = load({ view: 'ols', key: 'mica-ols-overview', stored: null, tickets: old, live: async () => ({ ...sample(4, '2026-10-28T11:00:00.000Z'), project: 'OLS' }) })
  await a.api.renderOls()
  assert.match(a.content.innerHTML, /publisher has not reported for over 2 h/)
  const b = load({ view: 'ols', key: 'mica-ols-overview', stored: null, tickets: null, live: async () => ({ ...sample(4, '2026-10-28T11:00:00.000Z'), project: 'OLS' }) })
  await b.api.renderOls()
  assert.match(b.content.innerHTML, /Ticket figure not available \(HTTP 404\)/)
})

test('live R10: the top-right pill shows Updated Date and the refresh line', async () => {
  let release
  const live = () => new Promise(r => { release = () => r(sample(7, '2026-10-28T13:52:00.000Z')) })
  const { api, els } = load({ stored: sample(5, '2026-10-28T10:00:00.000Z'), live })
  const done = api.renderMa()
  await new Promise(r => setTimeout(r, 0))
  assert.equal(els['last-updated'].textContent, 'Updated Date: 2026-10-28T10:00:00.000Z')
  assert.equal(els['live-sub'].textContent, 'Updating from Qase…')
  release(); await done
  assert.equal(els['last-updated'].textContent, 'Updated Date: 2026-10-28T13:52:00.000Z')
  assert.equal(els['live-sub'].textContent, 'Refreshes each time you open this tab')
})

test('live R10: a failed update says so in the pill and keeps the last date', async () => {
  const { api, els } = load({ stored: sample(5, '2026-10-28T10:00:00.000Z'), live: async () => { throw new Error('Qase HTTP 521') } })
  await api.renderMa()
  assert.equal(els['last-updated'].textContent, 'Updated Date: 2026-10-28T10:00:00.000Z')
  assert.equal(els['live-sub'].textContent, 'Update failed — showing the last numbers')
})

test('live R11: a tiny non-zero status still shows its colour and reads <0.1%', async () => {
  const d = { measuredAt: '2026-10-28T13:00:00.000Z', project: 'MA', runsUsed: 1,
    cases: { total: 2011, passed: 586, notPassed: 1, waiting: 1424, passedPercent: 29.1, notPassedPercent: 0, waitingPercent: 70.8 },
    breakdown: { failed: 1, skipped: 0, notRun: 0, other: {} }, types: null, typesError: 'x', run: null }
  const { api, content } = load({ stored: null, live: async () => d })
  await api.renderMa()
  const fail = content.innerHTML.match(/<span class="ols-seg-fail"[^>]*>/)
  assert.ok(fail, 'not-passed segment rendered')
  assert.match(fail[0], /flex:1 1 0/)
  assert.match(fail[0], /min-width:6px/)
  assert.match(content.innerHTML, /<span class="ols-pct">&lt;0\.1%<\/span>|<span class="ols-pct"><0\.1%<\/span>/)
  assert.doesNotMatch(content.innerHTML, /amber">[^]*?<span class="ols-pct">0%</)
})

test('live R11: a zero status has no bar segment', async () => {
  const d = { measuredAt: '2026-10-28T13:00:00.000Z', project: 'MA', runsUsed: 1,
    cases: { total: 10, passed: 10, notPassed: 0, waiting: 0, passedPercent: 100, notPassedPercent: 0, waitingPercent: 0 },
    breakdown: { failed: 0, skipped: 0, notRun: 0, other: {} }, types: null, typesError: 'x', run: null }
  const { api, content } = load({ stored: null, live: async () => d })
  await api.renderMa()
  assert.doesNotMatch(content.innerHTML, /<span class="ols-seg-fail"/)
  assert.doesNotMatch(content.innerHTML, /<span class="ols-seg-wait"/)
  assert.match(content.innerHTML, /<span class="ols-seg-pass" style="flex:10 1 0;min-width:6px">/)
})

test('live R6: notes name the newest run and how many completed runs were used, even when one', async () => {
  const d = { measuredAt: '2026-10-28T13:00:00.000Z', project: 'MA', runsUsed: 1,
    cases: { total: 1, passed: 1, notPassed: 0, waiting: 0, passedPercent: 100, notPassedPercent: 0, waitingPercent: 0 },
    breakdown: { failed: 0, skipped: 0, notRun: 0, other: {} }, types: null, typesError: 'x',
    run: { title: 'Run X', startedAt: '2026-10-28T12:00:00Z', completedAt: '2026-10-28T12:30:00Z' } }
  const { api, content } = load({ stored: null, live: async () => d })
  await api.renderMa()
  assert.match(content.innerHTML, /latest: Run X/)
  assert.match(content.innerHTML, /1 completed run used, each case from its newest/)
})

test('live R18: a type row with 0 cases is not shown; Total still matches', async () => {
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8')
  const fnSrc = html.slice(html.indexOf('const MA_TYPE_LABELS'), html.indexOf('\n}\n', html.indexOf('function maTypesCard')) + 2)
  const card = new Function('escapeHtml', `${fnSrc}; return maTypesCard`)(s => String(s))
  const d = { cases: { total: 3, passed: 1, notPassed: 1, waiting: 1 }, types: [
    { key: 'happyPath', total: 2, passed: 1, notPassed: 1, waiting: 0, sharePercent: 66.7 },
    { key: 'failureScenario', total: 1, passed: 0, notPassed: 0, waiting: 1, sharePercent: 33.3 },
    { key: 'edgeCase', total: 0, passed: 0, notPassed: 0, waiting: 0, sharePercent: 0 },
    { key: 'exceptionalCase', total: 0, passed: 0, notPassed: 0, waiting: 0, sharePercent: 0 },
    { key: 'empty', total: 0, passed: 0, notPassed: 0, waiting: 0, sharePercent: 0 } ] }
  const out = card(d, v => String(v))
  assert.match(out, /Happy Path/); assert.match(out, /Failure Scenario/)
  assert.doesNotMatch(out, /Edge Case|Exceptional Case|>Empty</)
  assert.match(out, /rowheader">Total/)
})

test('live R19: wording, legend shares, zero sub-statuses hidden', async () => {
  const d = { measuredAt: '2026-10-28T13:00:00.000Z', project: 'OLS', runsUsed: 2,
    cases: { total: 639, passed: 235, notPassed: 199, waiting: 205, passedPercent: 36.8, notPassedPercent: 31.1, waitingPercent: 32.1 },
    breakdown: { failed: 61, skipped: 0, notRun: 80, other: { blocked: 58 } }, types: null, typesError: 'x', run: null }
  const { api, content } = load({ view: 'ols', key: 'mica-ols-overview', stored: null, live: async () => d })
  await api.renderOls()
  const h = content.innerHTML
  assert.match(h, /All cases of project OLS on Qase\.io/)
  assert.match(h, /no automated test script yet/)
  assert.match(h, /not run \(script ready\) <b>80<\/b>/)
  assert.match(h, /failed <b>61<\/b>/); assert.match(h, /blocked <b>58<\/b>/)
  assert.doesNotMatch(h, /flaky/); assert.doesNotMatch(h, /skipped <b>0<\/b>/)
  assert.match(h, /Passed \(36\.8%\)/); assert.match(h, /Not passed \(31\.1%\)/); assert.match(h, /To be automated \(32\.1%\)/)
})
test('live R19: MA scope wording', async () => {
  const { api, content } = load({ stored: null, live: async () => sample(5, '2026-10-28T11:00:00.000Z') })
  await api.renderMa()
  assert.match(content.innerHTML, /All cases of project MA on Qase\.io/)
})
test('live R19: ticket card puts "updated automatically" on its own line', async () => {
  const tickets = { measuredAt: new Date().toISOString(), done: 684, withAutomatedCase: 292, percent: 42.7 }
  const { api, content } = load({ view: 'ols', key: 'mica-ols-overview', stored: null, tickets, live: async () => ({ ...sample(4, '2026-10-28T11:00:00.000Z'), project: 'OLS' }) })
  await api.renderOls()
  assert.match(content.innerHTML, /292 of 684 tickets<\/div>\s*<div class="card-sub">updated automatically, measured/)
})
