// Known-answer tests for scripts/build-ma-progress.mjs — spec docs/sdd/ma-tabs R4–R9.
// Run: node --test scripts/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { buildMaProgress } from './build-ma-progress.mjs'

const NOW = new Date('2026-10-21T10:00:00.000Z')

// Mock Qase: routes by path, honours limit/offset like the real API (entities + total).
function mockQase({ suites = [], cases = [], runs = [], results = {} }) {
  const page = (all, url) => {
    const limit = Number(url.searchParams.get('limit') || 10)
    const offset = Number(url.searchParams.get('offset') || 0)
    return { status: true, result: { total: all.length, entities: all.slice(offset, offset + limit) } }
  }
  return async path => {
    const url = new URL('https://x' + path)
    if (url.pathname === '/suite/MA') return page(suites, url)
    if (url.pathname === '/case/MA') return page(cases, url)
    if (url.pathname === '/run/MA') return page(runs, url)
    if (url.pathname === '/result/MA') return page(results[url.searchParams.get('run')] || [], url)
    throw new Error('unexpected path ' + path)
  }
}

const SUITES = [
  { id: 1, title: 'EVMS', parent_id: null },
  { id: 4, title: 'MICA1', parent_id: null },
  { id: 5, title: 'Login', parent_id: 4 },
  { id: 6, title: 'Deep', parent_id: 5 },
  { id: 9, title: 'Other', parent_id: null },
]
const auto = (id, suite_id, automation = 2) => ({ id, suite_id, automation })

test('R5/R6/R8: no run → run null; missing suite → system absent', async () => {
  const cases = [auto(1, 4), auto(2, 5), auto(3, 6), auto(4, 6, 0), auto(5, 1), auto(6, 9)]
  const out = await buildMaProgress({ fetchJson: mockQase({ suites: SUITES, cases }), now: NOW })
  assert.equal(out.measuredAt, NOW.toISOString())
  assert.equal(out.project, 'MA')
  assert.deepEqual(Object.keys(out.systems), ['MICA1', 'EVMS'])
  assert.deepEqual(out.systems.MICA1, { suite: 'MICA1', totalAutomated: 3, run: null })
  assert.deepEqual(out.systems.EVMS, { suite: 'EVMS', totalAutomated: 1, run: null })
  assert.equal('ELMS' in out.systems, false)
  assert.equal('CBMS' in out.systems, false)
})

test('R5: suite title match is case-insensitive and ignores spaces', async () => {
  const suites = [{ id: 1, title: 'Elms', parent_id: null }, { id: 2, title: 'c b m s', parent_id: 0 }]
  const out = await buildMaProgress({ fetchJson: mockQase({ suites, cases: [auto(1, 1), auto(2, 2)] }), now: NOW })
  assert.deepEqual(out.systems.ELMS, { suite: 'Elms', totalAutomated: 1, run: null })
  assert.deepEqual(out.systems.CBMS, { suite: 'c b m s', totalAutomated: 1, run: null })
})

test('R7: latest completed run containing the system; mixed statuses; latest result per case', async () => {
  const cases = [auto(1, 4), auto(2, 5), auto(3, 6), auto(4, 4), auto(5, 1)]
  const runs = [
    { id: 10, title: 'Old', status: 1, status_text: 'complete', end_time: '2026-10-01 10:00:00', cases: [1, 2, 3, 4] },
    { id: 11, title: 'Newest MICA1', status: 1, status_text: 'complete', end_time: '2026-10-20 08:30:00', cases: [1, 2, 3, 4] },
    { id: 12, title: 'Active', status: 0, status_text: 'active', end_time: null, cases: [1, 2, 3, 4, 5] },
    { id: 13, title: 'EvMS only', status: 1, status_text: 'complete', end_time: '2026-10-21 01:00:00', cases: [5] },
  ]
  const results = {
    11: [
      { case_id: 1, status: 'passed', end_time: '2026-10-20 08:00:00' },
      { case_id: 2, status: 'failed', end_time: '2026-10-20 08:00:00' },
      { case_id: 2, status: 'passed', end_time: '2026-10-20 08:10:00' }, // retest wins
      { case_id: 3, status: 'skipped', end_time: '2026-10-20 08:00:00' },
      // case 4 has no result → untested → not passed
    ],
    13: [{ case_id: 5, status: 'blocked', end_time: '2026-10-21 00:59:00' }],
  }
  const out = await buildMaProgress({ fetchJson: mockQase({ suites: SUITES, cases, runs, results }), now: NOW })
  assert.deepEqual(out.systems.MICA1.run, {
    title: 'Newest MICA1', completedAt: '2026-10-20 08:30:00',
    cases: 4, passed: 2, notPassed: 2, passedPercent: 50, notPassedPercent: 50,
  })
  assert.deepEqual(out.systems.EVMS.run, {
    title: 'EvMS only', completedAt: '2026-10-21 01:00:00',
    cases: 1, passed: 0, notPassed: 1, passedPercent: 0, notPassedPercent: 100,
  })
})

test('R7: percents are one decimal', async () => {
  const cases = [auto(1, 4), auto(2, 4), auto(3, 4)]
  const runs = [{ id: 1, title: 'R', status: 1, end_time: '2026-10-20 00:00:00', cases: [1, 2, 3] }]
  const results = { 1: [{ case_id: 1, status: 'passed' }, { case_id: 2, status: 'failed' }, { case_id: 3, status: 'invalid' }] }
  const out = await buildMaProgress({ fetchJson: mockQase({ suites: SUITES, cases, runs, results }), now: NOW })
  assert.equal(out.systems.MICA1.run.passedPercent, 33.3)
  assert.equal(out.systems.MICA1.run.notPassedPercent, 66.7)
})

test('R4/R9: CLI never prints the token and exits non-zero on API failure', () => {
  const secret = 'tok_SHOULD_NEVER_APPEAR_123'
  const script = fileURLToPath(new URL('./build-ma-progress.mjs', import.meta.url))
  const r = spawnSync(process.execPath, [script], {
    env: { ...process.env, QASE_API_TOKEN: secret, QASE_BASE_URL: 'http://127.0.0.1:9/v1', MA_PROGRESS_OUT: '/nonexistent/should-not-write.json' },
    encoding: 'utf8', timeout: 20000,
  })
  assert.notEqual(r.status, 0)
  assert.equal((r.stdout + r.stderr).includes(secret), false)
})

test('R4: CLI exits non-zero with no token configured', () => {
  const script = fileURLToPath(new URL('./build-ma-progress.mjs', import.meta.url))
  const env = { ...process.env }
  delete env.QASE_API_TOKEN; delete env.QASE_TOKEN_FILE
  const r = spawnSync(process.execPath, [script], { env, encoding: 'utf8', timeout: 20000 })
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /QASE_API_TOKEN|QASE_TOKEN_FILE/)
})
