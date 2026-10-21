#!/usr/bin/env node
// Builds public/ma-progress.json from Qase project MA — spec docs/sdd/ma-tabs R4–R9.
// Token: env QASE_API_TOKEN, else the file named by env QASE_TOKEN_FILE. The token is never printed.
// Usage: QASE_TOKEN_FILE=<path> node scripts/build-ma-progress.mjs
import { readFileSync, writeFileSync, renameSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const PROJECT = 'MA'
const SYSTEMS = ['MICA1', 'EVMS', 'ELMS', 'CBMS'] // display order; keys in the JSON
const AUTOMATED = 2 // Qase case.automation: 0 not automated, 1 to be automated, 2 automated
const PAGE = 100

const norm = s => String(s || '').replace(/\s+/g, '').toUpperCase()
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0)
const isComplete = r => r.status === 1 || String(r.status_text || '').toLowerCase() === 'complete'

async function fetchAll(fetchJson, path) {
  const out = []
  for (let offset = 0; ; offset += PAGE) {
    const sep = path.includes('?') ? '&' : '?'
    const body = await fetchJson(`${path}${sep}limit=${PAGE}&offset=${offset}`)
    if (!body || body.status === false || !body.result) throw new Error(`Qase ${path.split('?')[0]}: unexpected response`)
    const ents = body.result.entities || []
    out.push(...ents)
    if (!ents.length || out.length >= (body.result.total ?? out.length)) return out
  }
}

/** Pure builder: fetchJson(path) → parsed Qase v1 JSON. Returns the ma-progress object (R8). */
export async function buildMaProgress({ fetchJson, now = new Date() }) {
  const suites = await fetchAll(fetchJson, `/suite/${PROJECT}`)
  const cases = await fetchAll(fetchJson, `/case/${PROJECT}`)
  const runs = (await fetchAll(fetchJson, `/run/${PROJECT}?status=complete&include=cases`)).filter(isComplete)

  const children = new Map()
  for (const s of suites) {
    const p = s.parent_id || 0
    if (!children.has(p)) children.set(p, [])
    children.get(p).push(s.id)
  }
  const tree = rootId => {
    const ids = new Set(), stack = [rootId]
    while (stack.length) { const id = stack.pop(); ids.add(id); stack.push(...(children.get(id) || [])) }
    return ids
  }

  // Latest first: end time, then id (R7).
  runs.sort((a, b) => String(b.end_time || '').localeCompare(String(a.end_time || '')) || b.id - a.id)
  const resultsCache = new Map()
  const resultsOf = async runId => {
    if (!resultsCache.has(runId)) resultsCache.set(runId, await fetchAll(fetchJson, `/result/${PROJECT}?run=${runId}`))
    return resultsCache.get(runId)
  }

  const systems = {}
  for (const key of SYSTEMS) {
    const suite = suites.find(s => !s.parent_id && norm(s.title) === key)
    if (!suite) continue // R8: absent
    const ids = tree(suite.id)
    const own = cases.filter(c => ids.has(c.suite_id))
    const ownIds = new Set(own.map(c => c.id))
    const totalAutomated = own.filter(c => c.automation === AUTOMATED).length

    let run = null
    const latest = runs.find(r => (r.cases || []).some(id => ownIds.has(id)))
    if (latest) {
      const inRun = (latest.cases || []).filter(id => ownIds.has(id))
      const last = new Map()
      for (const res of await resultsOf(latest.id)) {
        if (!ownIds.has(res.case_id)) continue
        const prev = last.get(res.case_id)
        if (!prev || String(res.end_time || '') >= String(prev.end_time || '')) last.set(res.case_id, res)
      }
      const n = inRun.length
      const passed = inRun.filter(id => String(last.get(id)?.status || '').toLowerCase() === 'passed').length
      const notPassed = n - passed
      run = {
        title: latest.title, completedAt: latest.end_time, cases: n, passed, notPassed,
        passedPercent: pct(passed, n), notPassedPercent: pct(notPassed, n),
      }
    }
    systems[key] = { suite: suite.title, totalAutomated, run }
  }
  return { measuredAt: now.toISOString(), project: PROJECT, systems }
}

function readToken() {
  if (process.env.QASE_API_TOKEN) return process.env.QASE_API_TOKEN.trim()
  if (process.env.QASE_TOKEN_FILE) return readFileSync(process.env.QASE_TOKEN_FILE, 'utf8').trim()
  throw new Error('Set QASE_API_TOKEN or QASE_TOKEN_FILE')
}

async function main() {
  const token = readToken()
  const base = process.env.QASE_BASE_URL || 'https://api.qase.io/v1'
  const fetchJson = async path => {
    const res = await fetch(base + path, { headers: { Token: token, Accept: 'application/json' } })
    if (!res.ok) throw new Error(`Qase ${path.split('?')[0]}: HTTP ${res.status}`)
    return res.json()
  }
  const data = await buildMaProgress({ fetchJson })
  const out = process.env.MA_PROGRESS_OUT || fileURLToPath(new URL('../public/ma-progress.json', import.meta.url))
  const tmp = out + '.tmp'
  writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n')
  renameSync(tmp, out) // R9: the old file is replaced only after a full, successful build
  const s = data.systems
  console.log(`wrote ${out}: ` + ['MICA1', 'EVMS', 'ELMS', 'CBMS'].map(k => `${k}=${s[k] ? `${s[k].totalAutomated}${s[k].run ? ` run ${s[k].run.passed}/${s[k].run.cases}` : ' no-run'}` : 'absent'}`).join(' · '))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(e => {
    // Never echo the token: messages above carry only paths and HTTP status.
    console.error('build-ma-progress failed: ' + (e && e.message ? e.message : 'error'))
    process.exit(1)
  })
}
