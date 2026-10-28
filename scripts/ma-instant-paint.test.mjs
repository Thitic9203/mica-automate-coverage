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
  const store = new Map(stored ? [[key, JSON.stringify(stored)]] : [])
  const snapshots = []
  const env = {
    document: { getElementById: id => id === 'content' ? content : (els[id] ||= { textContent: '' }) },
    localStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
    escapeHtml: s => String(s), formatBkkTime: d => d.toISOString(),
    animateOls: () => {}, maTypesCard: () => '', activeView: view,
    MA_PAGE_TIMEOUT_MS: 10000, AbortSignal: { timeout: () => undefined },
    importCore: async () => ({ retryable: f => f, hedged: f => f, buildMaOverview: live, buildOlsOverview: live }),
    fetch: async () => tickets ? { ok: true, json: async () => tickets } : { ok: false, status: 404 },
  }
  const src = block.replace("await import('/ma-progress-core.mjs')", 'await importCore()')
  const fn = new Function(...Object.keys(env), `${src}; return { renderMa, renderOls, snap: () => 0 }`)
  const api = fn(...Object.values(env))
  return { api, content, store, snapshots, els }
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

test('live R7: OLS ticket card comes from ols-progress.json with that file\'s own measured time', async () => {
  const tickets = { measuredAt: '2026-10-22T05:17:06.324Z', tickets: { done: 660, withAutomatedCase: 244, percent: 37 } }
  const { api, content } = load({ view: 'ols', key: 'mica-ols-overview', stored: null, tickets, live: async () => ({ ...sample(4, '2026-10-28T11:00:00.000Z'), project: 'OLS' }) })
  await api.renderOls()
  assert.match(content.innerHTML, /244 of 660 tickets/)
  assert.match(content.innerHTML, /2026-10-22T05:17:06\.324Z/)
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
