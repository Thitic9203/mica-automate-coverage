// Tests for public/ma-progress-core.mjs — spec docs/sdd/ma-tabs R23–R25.
// Run: node --test scripts/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildMaProgress } from '../public/ma-progress-core.mjs'
import { buildMaProgress as fromBuilder } from './build-ma-progress.mjs'

const NOW = new Date('2026-10-28T10:00:00.000Z')

test('R24: core has no Node-only imports and the builder re-exports the same function', () => {
  const src = readFileSync(new URL('../public/ma-progress-core.mjs', import.meta.url), 'utf8')
  assert.equal(/from\s+['"]node:/.test(src), false)
  assert.equal(fromBuilder, buildMaProgress)
})

test('R25: pages after the first are fetched concurrently and kept in offset order', async () => {
  const suites = [{ id: 1, title: 'MICA1', parent_id: null }]
  const cases = Array.from({ length: 350 }, (_, i) => ({ id: i + 1, suite_id: 1, automation: i < 120 ? 2 : 0 }))
  let inFlight = 0, maxInFlight = 0
  const caseOffsets = []
  const fetchJson = async path => {
    const url = new URL('http://x' + path)
    const limit = Number(url.searchParams.get('limit')), offset = Number(url.searchParams.get('offset'))
    const all = url.pathname.startsWith('/suite/') ? suites : url.pathname.startsWith('/case/') ? cases : []
    if (url.pathname.startsWith('/case/')) caseOffsets.push(offset)
    inFlight++; maxInFlight = Math.max(maxInFlight, inFlight)
    // Later pages answer first, so a naive push would scramble the order.
    await new Promise(r => setTimeout(r, 40 - offset / 10))
    inFlight--
    return { status: true, result: { total: all.length, entities: all.slice(offset, offset + limit) } }
  }
  const out = await buildMaProgress({ fetchJson, now: NOW })
  assert.deepEqual(out.systems.MICA1, { suite: 'MICA1', totalCases: 350, totalAutomated: 120, run: null })
  assert.deepEqual([...caseOffsets].sort((a, b) => a - b), [0, 100, 200, 300])
  assert.ok(maxInFlight >= 3, `expected concurrent pages, max in flight was ${maxInFlight}`)
})

test('R23: a failed page rejects the whole computation (no partial numbers)', async () => {
  const fetchJson = async path => {
    if (path.includes('offset=100')) throw new Error('HTTP 429')
    const all = path.startsWith('/case/') ? Array.from({ length: 150 }, (_, i) => ({ id: i, suite_id: 1, automation: 0 })) : [{ id: 1, title: 'MICA1', parent_id: null }]
    return { status: true, result: { total: all.length, entities: all.slice(0, 100) } }
  }
  await assert.rejects(buildMaProgress({ fetchJson, now: NOW }), /429/)
})

test('R28: retryable() retries 5xx/network failures up to 2 more times, never 4xx', async () => {
  const { retryable } = await import('../public/ma-progress-core.mjs')
  let n = 0
  const flaky = retryable(async () => { n++; if (n < 3) { const e = new Error('HTTP 521'); e.status = 521; throw e } return 'ok' }, 0)
  assert.equal(await flaky('/x'), 'ok'); assert.equal(n, 3)
  let m = 0
  const down = retryable(async () => { m++; const e = new Error('HTTP 521'); e.status = 521; throw e }, 0)
  await assert.rejects(down('/x'), /521/); assert.equal(m, 3)
  let k = 0
  const auth = retryable(async () => { k++; const e = new Error('HTTP 401'); e.status = 401; throw e }, 0)
  await assert.rejects(auth('/x'), /401/); assert.equal(k, 1)
})

test('R29: an aborted (timed-out) request has no status and is retried', async () => {
  const { retryable } = await import('../public/ma-progress-core.mjs')
  let n = 0
  const slowOnce = retryable(async () => { n++; if (n === 1) throw new DOMException('signal timed out', 'TimeoutError'); return 'ok' }, 0)
  assert.equal(await slowOnce('/x'), 'ok'); assert.equal(n, 2)
})

// ── R30–R35: overview (all systems together) ──
import { buildMaOverview } from '../public/ma-progress-core.mjs'
const OV_SUITES = [
  { id: 1, title: 'MICA1', parent_id: null }, { id: 2, title: 'Child', parent_id: 1 },
  { id: 3, title: 'CBMS', parent_id: null }, { id: 9, title: 'Other', parent_id: null },
]
const cf = v => (v === null ? [] : [{ id: 4, value: v }])
const kase = (id, suite_id, automation, type = null) => ({ id, suite_id, automation, custom_fields: cf(type) })
function ovMock({ cases, runs = [], results = {} }) {
  const page = (all, url) => {
    const limit = Number(url.searchParams.get('limit')), offset = Number(url.searchParams.get('offset'))
    return { status: true, result: { total: all.length, entities: all.slice(offset, offset + limit) } }
  }
  return async path => {
    const url = new URL('http://x' + path)
    if (url.pathname.startsWith('/suite/')) return page(OV_SUITES, url)
    if (url.pathname.startsWith('/case/')) return page(cases, url)
    if (url.pathname.startsWith('/run/')) return page(runs, url)
    if (url.pathname.startsWith('/result/')) return page(results[url.searchParams.get('run')] || [], url)
    throw new Error('unexpected ' + path)
  }
}
const NOW2 = new Date('2026-10-28T10:00:00.000Z')

test('R30: a completed run with status 3 (failed) and an end_time is used', async () => {
  const cases = [kase(1, 1, 2, '1')]
  const runs = [{ id: 1, title: 'R', status: 3, status_text: 'failed', start_time: '2026-10-27T19:13:31+07:00', end_time: '2026-10-27T19:13:42+07:00', cases: [1] }]
  const o = await buildMaOverview({ fetchJson: ovMock({ cases, runs, results: { 1: [{ case_id: 1, status: 'failed' }] } }), now: NOW2 })
  assert.equal(o.run.title, 'R')
  assert.equal(o.cases.notPassed, 1)
})

test('R31/R32/R33: systems counted together; a result in the run wins; no result → NOT RUN or waiting', async () => {
  const cases = [kase(1, 1, 2), kase(2, 2, 2), kase(3, 3, 2), kase(4, 3, 2), kase(5, 3, 2), kase(6, 1, 0), kase(7, 3, 1), kase(8, 9, 2)]
  const runs = [{ id: 1, title: 'R', status: 1, end_time: '2026-10-27 10:00:00', start_time: '2026-10-27 09:00:00', cases: [1, 2, 3, 4, 6] }]
  const results = { 1: [
    { case_id: 1, status: 'passed' }, { case_id: 2, status: 'failed' }, { case_id: 3, status: 'skipped' },
    { case_id: 4, status: 'blocked' }, { case_id: 6, status: 'passed' }, // 6 is not automated → still waiting
  ] }
  const o = await buildMaOverview({ fetchJson: ovMock({ cases, runs, results }), now: NOW2 })
  assert.equal(o.cases.total, 7) // case 8 is in "Other", not a system
  assert.equal(o.cases.waiting, 1) // 7 (no result, not automated); case 6 has a passed result → PASSED
  assert.equal(o.cases.passed, 2) // 1 and 6
  assert.equal(o.cases.notPassed, 4) // failed 1 + skipped 1 + blocked 1 + not run 1 (case 5)
  assert.deepEqual(o.breakdown, { failed: 1, skipped: 1, notRun: 1, other: { blocked: 1 } })
  assert.equal(o.cases.passed + o.cases.notPassed + o.cases.waiting, o.cases.total)
  assert.equal(o.cases.passedPercent, 28.6)
})

test('R35: types from custom field 4 with Empty row; shares add to exactly 100.0; bad value hides card', async () => {
  const cases = [kase(1, 1, 0, '1'), kase(2, 1, 0, '1'), kase(3, 1, 0, '2'), kase(4, 1, 0, '3'), kase(5, 1, 0, '4'), kase(6, 1, 0, null), kase(7, 1, 0, null)]
  const o = await buildMaOverview({ fetchJson: ovMock({ cases }), now: NOW2 })
  assert.equal(o.typesError, null)
  assert.deepEqual(o.types.map(t => [t.key, t.total]), [['happyPath', 2], ['failureScenario', 1], ['edgeCase', 1], ['exceptionalCase', 1], ['empty', 2]])
  assert.equal(o.types.reduce((s, t) => s + t.sharePercent, 0).toFixed(1), '100.0')
  const bad = await buildMaOverview({ fetchJson: ovMock({ cases: [kase(1, 1, 0, '9')] }), now: NOW2 })
  assert.equal(bad.types, null)
  assert.match(bad.typesError, /9/)
})

test('R32: no run at all → run null, every automated case NOT RUN', async () => {
  const o = await buildMaOverview({ fetchJson: ovMock({ cases: [kase(1, 1, 2), kase(2, 1, 0)] }), now: NOW2 })
  assert.equal(o.run, null)
  assert.deepEqual(o.breakdown, { failed: 0, skipped: 0, notRun: 1, other: {} })
})

test('R38: at most 8 requests in flight, pages still in offset order', async () => {
  const suites = [{ id: 1, title: 'MICA1', parent_id: null }]
  const cases = Array.from({ length: 3100 }, (_, i) => ({ id: i + 1, suite_id: 1, automation: 0, custom_fields: [] }))
  let inFlight = 0, maxInFlight = 0
  const fetchJson = async path => {
    const url = new URL('http://x' + path)
    const limit = Number(url.searchParams.get('limit')), offset = Number(url.searchParams.get('offset'))
    const all = url.pathname.startsWith('/suite/') ? suites : url.pathname.startsWith('/case/') ? cases : []
    inFlight++; maxInFlight = Math.max(maxInFlight, inFlight)
    await new Promise(r => setTimeout(r, 30 - (offset / 3100) * 25)) // later pages answer first
    inFlight--
    return { status: true, result: { total: all.length, entities: all.slice(offset, offset + limit) } }
  }
  const o = await buildMaOverview({ fetchJson, now: NOW2 })
  assert.equal(o.cases.total, 3100)
  assert.ok(maxInFlight <= 8, `max in flight was ${maxInFlight}`)
  assert.ok(maxInFlight >= 6, `expected near the cap, was ${maxInFlight}`)
})

test('R40: a request unanswered after the threshold is sent again; first success wins', async () => {
  const { hedged } = await import('../public/ma-progress-core.mjs')
  let calls = 0
  const slowThenFast = hedged(async () => { const n = ++calls; await new Promise(r => setTimeout(r, n === 1 ? 300 : 10)); return 'call' + n }, 50)
  const t0 = Date.now()
  assert.equal(await slowThenFast('/x'), 'call2')
  assert.ok(Date.now() - t0 < 200, 'hedge answer should win before the slow one')
  assert.equal(calls, 2)
})

test('R40: a fast answer sends no second request', async () => {
  const { hedged } = await import('../public/ma-progress-core.mjs')
  let calls = 0
  const fast = hedged(async () => { calls++; return 'ok' }, 50)
  assert.equal(await fast('/x'), 'ok')
  await new Promise(r => setTimeout(r, 80))
  assert.equal(calls, 1)
})

test('R40: both attempts failing rejects', async () => {
  const { hedged } = await import('../public/ma-progress-core.mjs')
  const bad = hedged(async () => { await new Promise(r => setTimeout(r, 70)); throw Object.assign(new Error('HTTP 521'), { status: 521 }) }, 20)
  await assert.rejects(bad('/x'), /521/)
})

// ── spec docs/sdd/live-qase-tabs ──
import * as core from '../public/ma-progress-core.mjs'
const run = (id, end, cases, title = 'Run ' + id) => ({ id, title, status: 1, start_time: end, end_time: end, cases })

test('live R2: a case only in an older run keeps that result when the newest run omits it', async () => {
  const cases = [kase(1, 1, 2), kase(2, 3, 2)]
  const runs = [run(1, '2026-10-20 10:00:00', [1, 2]), run(2, '2026-10-27 10:00:00', [2])]
  const results = { 1: [{ case_id: 1, status: 'passed' }, { case_id: 2, status: 'failed' }], 2: [{ case_id: 2, status: 'passed' }] }
  const o = await buildMaOverview({ fetchJson: ovMock({ cases, runs, results }), now: NOW2 })
  assert.equal(o.cases.passed, 2) // case 1 from run 1, case 2 from newer run 2
  assert.equal(o.cases.notPassed, 0)
  assert.equal(o.run.title, 'Run 2')
  assert.equal(o.runsUsed, 2)
})

test('live R2: a 1-case retest run does not touch other cases', async () => {
  const cases = [kase(1, 1, 2), kase(2, 1, 2), kase(3, 1, 2)]
  const runs = [run(8, '2026-10-22 05:00:00', [1, 2, 3]), run(9, '2026-10-23 05:00:00', [3])]
  const results = { 8: [{ case_id: 1, status: 'passed' }, { case_id: 2, status: 'failed' }, { case_id: 3, status: 'failed' }], 9: [{ case_id: 3, status: 'passed' }] }
  const o = await buildMaOverview({ fetchJson: ovMock({ cases, runs, results }), now: NOW2 })
  assert.deepEqual([o.cases.passed, o.cases.notPassed, o.cases.waiting], [2, 1, 0])
})

test('live R4: the result walk stops once the newest run covers every listed case', async () => {
  const cases = [kase(1, 1, 2), kase(2, 1, 0)]
  const runs = [run(1, '2026-10-20 10:00:00', [1]), run(2, '2026-10-27 10:00:00', [1])]
  const base = ovMock({ cases, runs, results: { 1: [{ case_id: 1, status: 'failed' }], 2: [{ case_id: 1, status: 'passed' }] } })
  const resultCalls = []
  const o = await buildMaOverview({ fetchJson: async p => { if (p.startsWith('/result/')) resultCalls.push(p); return base(p) }, now: NOW2 })
  assert.equal(o.cases.passed, 1)
  assert.equal(o.cases.waiting, 1) // case 2: no run lists it, not automated
  assert.equal(resultCalls.length, 1)
  assert.match(resultCalls[0], /run=2/)
})

test('live R2: inside one run the latest result of a case wins; results of out-of-scope ids are ignored', async () => {
  const cases = [kase(1, 1, 2)]
  const runs = [run(1, '2026-10-27 10:00:00', [1, 99])]
  const results = { 1: [{ case_id: 1, status: 'failed', end_time: '2026-10-27 09:00:00' }, { case_id: 1, status: 'passed', end_time: '2026-10-27 09:30:00' }, { case_id: 99, status: 'failed' }] }
  const o = await buildMaOverview({ fetchJson: ovMock({ cases, runs, results }), now: NOW2 })
  assert.deepEqual([o.cases.total, o.cases.passed], [1, 1])
})

test('live R1/R5: OLS overview counts every case in the project, typed by field 4', async () => {
  assert.equal(typeof core.buildOlsOverview, 'function')
  const cases = [kase(1, 1, 2, '1'), kase(2, 9, 2, '2'), kase(3, 9, 0, null)]
  const runs = [run(6, '2026-10-21 16:11:37', [1, 2])]
  const results = { 6: [{ case_id: 1, status: 'passed' }, { case_id: 2, status: 'failed' }] }
  const o = await core.buildOlsOverview({ fetchJson: ovMock({ cases, runs, results }), now: NOW2 })
  assert.equal(o.project, 'OLS')
  assert.deepEqual([o.cases.total, o.cases.passed, o.cases.notPassed, o.cases.waiting], [3, 1, 1, 1])
  assert.deepEqual(o.types.map(t => [t.key, t.total]), [['happyPath', 1], ['failureScenario', 1], ['edgeCase', 0], ['exceptionalCase', 0], ['empty', 1]])
})

test('pyrite-tab-pluton R2: Pyrite overview reads Qase project Pyrite, every case', async () => {
  assert.equal(typeof core.buildPyriteOverview, 'function')
  const paths = []
  const mock = ovMock({ cases: [kase(1, 1, 0, '1'), kase(2, 9, 0, null)], runs: [run(3, '2026-11-27 10:00:00', [1], 'Pyrite Automate · fixture')], results: { 3: [{ case_id: 1, status: 'passed' }] } })
  const o = await core.buildPyriteOverview({ fetchJson: p => { paths.push(p); return mock(p) }, now: NOW2, automatedIds: [1] }) // pyrite-automation-only
  assert.equal(o.project, 'Pyrite')
  assert.ok(paths.every(p => !/\/(case|run|result|suite)\//.test(p) || /\/(case|run|result|suite)\/Pyrite\b/.test(p)), paths.join(' '))
  assert.deepEqual([o.cases.total, o.cases.passed, o.cases.notPassed, o.cases.waiting], [2, 1, 0, 1])
})

test('live R12: HTTP 429 is retried up to 3 more times, honouring Retry-After', async () => {
  const waits = []
  const realST = globalThis.setTimeout
  globalThis.setTimeout = (fn, ms) => { waits.push(ms); return realST(fn, 0) }
  try {
    let n = 0
    const limited = core.retryable(async () => { n++; if (n < 4) { const e = new Error('Qase HTTP 429'); e.status = 429; e.retryAfter = n === 1 ? 3 : undefined; throw e } return 'ok' }, 0)
    assert.equal(await limited('/x'), 'ok'); assert.equal(n, 4)
    assert.deepEqual(waits, [3000, 4000, 6000])
    let m = 0
    const always = core.retryable(async () => { m++; const e = new Error('Qase HTTP 429'); e.status = 429; throw e }, 0)
    await assert.rejects(always('/x'), /429/); assert.equal(m, 4)
  } finally { globalThis.setTimeout = realST }
})

// ── spec docs/sdd/tab-load-5s ──
test('tab-load-5s R1: a run result list is sized by Qase "filtered", not the project-wide "total"', async () => {
  const cases = [kase(1, 1, 2), kase(2, 1, 2)]
  const runs = [run(50, '2026-10-27 10:00:00', [1, 2])]
  const resultCalls = []
  const fetchJson = async path => {
    const url = new URL('http://x' + path)
    if (url.pathname.startsWith('/result/')) {
      resultCalls.push(path)
      const offset = Number(url.searchParams.get('offset'))
      const ents = offset === 0 ? [{ case_id: 1, status: 'passed' }, { case_id: 2, status: 'failed' }] : []
      return { status: true, result: { total: 1019, filtered: 2, count: ents.length, entities: ents } }
    }
    return ovMock({ cases, runs })(path)
  }
  const o = await buildMaOverview({ fetchJson, now: NOW2 })
  assert.equal(resultCalls.length, 1, `result requests: ${resultCalls.length}`)
  assert.deepEqual([o.cases.passed, o.cases.notPassed], [1, 1])
})

test('tab-load-5s R2: suites, cases and runs are requested together', async () => {
  const base = ovMock({ cases: [kase(1, 1, 2)], runs: [] })
  const started = []
  let release
  const gate = new Promise(r => { release = r })
  const p = buildMaOverview({ fetchJson: async path => { started.push(path.split('?')[0].split('/')[1]); await gate; return base(path) }, now: NOW2 })
  await new Promise(r => setTimeout(r, 10))
  assert.deepEqual([...new Set(started)].sort(), ['case', 'run', 'suite'])
  release(); await p
})

test('tab-load-5s R3/R4: planned run results load concurrently (max 8 in flight) and equal the serial walk', async () => {
  const N = 30
  const cases = Array.from({ length: N }, (_, i) => kase(i + 1, 1, 2))
  // run k (newer = higher k) lists case k only, so all 30 runs are needed
  const runs = Array.from({ length: N }, (_, i) => run(i + 1, `2026-10-${String(1 + (i % 27)).padStart(2, '0')} ${String(10 + Math.floor(i / 27)).padStart(2, '0')}:00:00`, [i + 1]))
  const results = Object.fromEntries(runs.map(r => [r.id, [{ case_id: r.id, status: r.id % 3 ? 'passed' : 'failed' }]]))
  const base = ovMock({ cases, runs, results })
  let inFlight = 0, max = 0, maxResults = 0, resultsInFlight = 0
  const fetchJson = async path => {
    const isRes = path.startsWith('/result/')
    inFlight++; max = Math.max(max, inFlight)
    if (isRes) { resultsInFlight++; maxResults = Math.max(maxResults, resultsInFlight) }
    await new Promise(r => setTimeout(r, 5))
    inFlight--; if (isRes) resultsInFlight--
    return base(path)
  }
  const o = await buildMaOverview({ fetchJson, now: NOW2 })
  assert.ok(max <= 8, `max in flight ${max}`)
  assert.ok(maxResults >= 6, `results should overlap, max ${maxResults}`)
  assert.equal(o.runsUsed, N)
  assert.equal(o.cases.passed, runs.filter(r => r.id % 3).length)
  assert.equal(o.cases.notPassed, runs.filter(r => !(r.id % 3)).length)
})

// ── spec docs/sdd/pyrite-automation-only ──
test('pyrite-automation-only R3/R4: only "Pyrite Automate ·" runs count; scripted case with no result = not run; others = to be automated', async () => {
  const cases = [kase(1, 1, 0), kase(2, 1, 0), kase(3, 1, 0), kase(4, 1, 2)]
  const runs = [
    run(10, '2026-11-20 10:00:00', [1, 3], 'PYR-779 manual retest'),
    run(11, '2026-11-28 20:59:53', [1], 'Pyrite Automate · dev · filter 24024 first round · 28 Nov 2026 20:57'),
  ]
  const results = { 10: [{ case_id: 1, status: 'failed' }, { case_id: 3, status: 'passed' }], 11: [{ case_id: 1, status: 'passed' }] }
  const resultCalls = []
  const base = ovMock({ cases, runs, results })
  const o = await core.buildPyriteOverview({ fetchJson: p => { if (p.startsWith('/result/')) resultCalls.push(p); return base(p) }, now: NOW2, automatedIds: Promise.resolve([1, 2]) })
  // case 1 passed (automated run), case 2 scripted but not run, case 3 only manual -> to be automated, case 4 automation=2 ignored
  assert.deepEqual([o.cases.passed, o.cases.notPassed, o.cases.waiting], [1, 1, 2])
  assert.equal(o.breakdown.notRun, 1)
  assert.equal(o.run.title.startsWith('Pyrite Automate ·'), true)
  assert.ok(resultCalls.every(p => /run=11/.test(p)), resultCalls.join(' '))
})

test('pyrite-automation-only R5: no automated id list -> the build rejects (no partial numbers)', async () => {
  const base = ovMock({ cases: [kase(1, 1, 0)], runs: [] })
  await assert.rejects(core.buildPyriteOverview({ fetchJson: base, now: NOW2, automatedIds: Promise.reject(new Error('Pyrite automated ids: HTTP 502')) }), /automated ids/)
  await assert.rejects(core.buildPyriteOverview({ fetchJson: base, now: NOW2 }), /automated ids/)
})

test('live-qase-tabs R3a: OLS reads "Automation Status" custom field 97, not the system automation field', async () => {
  const k = (id, auto, f97) => ({ id, suite_id: 9, automation: auto, custom_fields: f97 === null ? [] : [{ id: 97, value: f97 }] })
  const cases = [k(1, 0, '2'), k(2, 0, '2'), k(3, 2, '1'), k(4, 0, '2')]
  const runs = [run(5, '2026-11-27 10:00:00', [4])]
  const o = await core.buildOlsOverview({ fetchJson: ovMock({ cases, runs, results: { 5: [{ case_id: 4, status: 'passed' }] } }), now: NOW2 })
  // 1, 2: field 97 Automated, no result -> not run; 3: system field says automated but field 97 Manual -> to be automated; 4: passed
  assert.deepEqual([o.cases.passed, o.cases.notPassed, o.cases.waiting, o.breakdown.notRun], [1, 2, 1, 2])
})
