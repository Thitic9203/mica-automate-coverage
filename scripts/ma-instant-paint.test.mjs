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

function load({ stored, live }) {
  const content = { innerHTML: '', dataset: {} }
  const store = new Map(stored ? [['mica-ma-overview', JSON.stringify(stored)]] : [])
  const snapshots = []
  const env = {
    document: { getElementById: () => content },
    localStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
    escapeHtml: s => String(s), formatBkkTime: d => d.toISOString(),
    animateOls: () => {}, maTypesCard: () => '', activeView: 'ma',
    MA_PAGE_TIMEOUT_MS: 10000, AbortSignal: { timeout: () => undefined },
    importCore: async () => ({ retryable: f => f, hedged: f => f, buildMaOverview: live }),
  }
  const src = block.replace("await import('/ma-progress-core.mjs')", 'await importCore()')
  const fn = new Function(...Object.keys(env), `${src}; return { renderMa, snap: () => 0 }`)
  const api = fn(...Object.values(env))
  return { api, content, store, snapshots }
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
