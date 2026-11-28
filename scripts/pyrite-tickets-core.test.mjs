// Tests for lib/pyrite-tickets-core.mjs — spec docs/sdd/pyrite-tab-pluton R4.
// Run: node --test scripts/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseTar, annotatedKeys, automatedJql, ticketFigure, automatedCaseIds } from '../lib/pyrite-tickets-core.mjs'

function tarOf(files) {
  const dir = mkdtempSync(join(tmpdir(), 'pyr-tar-'))
  const root = join(dir, 'Thitic9203-pyrite-qa-e2e-abc1234')
  for (const [name, body] of Object.entries(files)) {
    mkdirSync(join(root, name, '..'), { recursive: true })
    writeFileSync(join(root, name), body)
  }
  // GitHub tarballs carry a pax global header and one top folder; -c with --format=pax gives both shapes
  return new Uint8Array(execFileSync('tar', ['-c', '--format=pax', '-C', dir, 'Thitic9203-pyrite-qa-e2e-abc1234']))
}

test('R4b: parseTar returns regular files with their path below the top folder', () => {
  const files = parseTar(tarOf({ 'tests/a/x.spec.ts': 'hello ไทย', 'README.md': 'r' }))
  const byName = Object.fromEntries(files.map(f => [f.name, f.text]))
  assert.equal(byName['tests/a/x.spec.ts'], 'hello ไทย')
  assert.equal(byName['README.md'], 'r')
})

test('R4b: only tickets annotations in tests/**/*.spec.ts count, every PYR key in the description', () => {
  const files = [
    { name: 'tests/a/one.spec.ts', text: "annotation: { type: 'tickets', description: 'PYR-951, PYR-781' }" },
    { name: 'tests/b/two.spec.ts', text: 'annotation: [{ type: "tickets", description: "PYR-789" }, { type: \'issue\', description: \'PYR-5\' }]' },
    { name: 'tests/pages/Page.ts', text: "{ type: 'tickets', description: 'PYR-1' }" },
    { name: 'docs/x.spec.ts', text: "{ type: 'tickets', description: 'PYR-2' }" },
  ]
  assert.deepEqual([...annotatedKeys(files)].sort(), ['PYR-781', 'PYR-789', 'PYR-951'])
})

test('R4d: JQL lists keys sorted by number; no key uses a clause that matches nothing', () => {
  assert.equal(automatedJql(24025, ['PYR-1000', 'PYR-99', 'PYR-341']), 'filter = 24025 AND issuekey in (PYR-99, PYR-341, PYR-1000)')
  assert.equal(automatedJql(24025, []), 'filter = 24025 AND created < "1970-01-01"')
})

test('R4c: figure counts Done keys that are annotated; percent has one decimal', () => {
  const f = ticketFigure(['PYR-1', 'PYR-2', 'PYR-3'], new Set(['PYR-2', 'PYR-3', 'PYR-77']))
  assert.deepEqual([f.done, f.withAutomatedCase, f.percent], [3, 2, 66.7])
  assert.deepEqual(f.automatedKeys, ['PYR-2', 'PYR-3'])
  assert.equal(ticketFigure([], new Set()).percent, 0)
})

// ── spec docs/sdd/pyrite-automation-only ──
test('pyrite-automation-only R1: case ids come from `PYRITE-<id> — ` test titles in tests/**/*.spec.ts, ascending, unique', () => {
  const files = parseTar(tarOf({
    'tests/a/x.spec.ts': "test(`PYRITE-2754 — ${tc('PYRITE-2754').title} (PYR-789)`, async () => {})\n  test(`PYRITE-12 — ${tc('PYRITE-12').title}`, () => {})",
    'tests/b/y.spec.ts': "test.describe('g', () => { test(`PYRITE-2754 — again`, () => {}) })\ntest(`PYR-951-AC05 — no case`, () => {})",
    'tests/data/notes.ts': "`PYRITE-999 — not a spec file`",
    'README.md': "`PYRITE-998 — readme`",
  }))
  assert.deepEqual(automatedCaseIds(files), [12, 2754])
})
