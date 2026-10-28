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
