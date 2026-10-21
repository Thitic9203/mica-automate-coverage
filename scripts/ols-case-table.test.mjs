// Spec docs/sdd/ols-tab R17c/R18: the case table is hidden when its rows disagree with any card figure.
// Known answers against the page's own ocConflicts() (extracted from public/index.html).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8')
const grab = re => { const m = html.match(re); assert.ok(m, `not found: ${re}`); return m[0] }
const src = [
  grab(/const OLS_TYPES = \[[^\n]+\]/),
  grab(/function ocConflicts\(d, rows\) \{[\s\S]*?\n\}\n/),
].join('\n')
const ocConflicts = new Function(`${src}; return ocConflicts`)()

const row = (status, type = 'Happy Path') => ({ status, type, role: ['Guest'], caseKey: 'K' })
const rows = [row('PASSED'), row('FAILED'), row('FLAKY', 'Edge Case'), row('SKIPPED'), row('NOT RUN'), row('TO BE AUTOMATED')]
const d = {
  cases: { total: 6, passed: 1, notPassed: 4, waiting: 1 },
  notPassedBreakdown: { failed: 1, flaky: 1, skipped: 1, notRun: 1 },
  caseTypes: {
    happyPath: { total: 5, passed: 1, notPassed: 3, waiting: 1 },
    failureScenario: { total: 0, passed: 0, notPassed: 0, waiting: 0 },
    edgeCase: { total: 1, passed: 0, notPassed: 1, waiting: 0 },
    exceptionalCase: { total: 0, passed: 0, notPassed: 0, waiting: 0 },
  },
}

test('agreeing rows and cards: no conflict', () => assert.deepEqual(ocConflicts(d, rows), []))
test('a FLAKY row shown as FAILED is a conflict', () =>
  assert.ok(ocConflicts(d, rows.map(r => (r.status === 'FLAKY' ? { ...r, status: 'FAILED' } : r))).length > 0))
test('a missing row is a conflict', () => assert.ok(ocConflicts(d, rows.slice(1)).length > 0))
test('type x status drift is a conflict', () =>
  assert.ok(ocConflicts(d, rows.map((r, i) => (i === 0 ? { ...r, type: 'Edge Case' } : i === 2 ? { ...r, type: 'Happy Path' } : r))).length > 0))
