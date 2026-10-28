// Counting rules for the MA tab — spec docs/sdd/ma-tabs R5–R7, R19, R23–R25.
// Shared by the page (public/index.html, live in the browser) and scripts/build-ma-progress.mjs.
// No Node-only imports: this file is served as-is to the browser.
const PROJECT = 'MA'
const SYSTEMS = ['MICA1', 'EVMS', 'ELMS', 'CBMS'] // display order; keys in the JSON
const AUTOMATED = 2 // Qase case.automation: 0 not automated, 1 to be automated, 2 automated
const PAGE = 100

const norm = s => String(s || '').replace(/\s+/g, '').toUpperCase()
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0)
const isComplete = r => r.status === 1 || String(r.status_text || '').toLowerCase() === 'complete'

// R25: first page tells the total; the remaining pages go out together and land in offset order.
async function fetchAll(fetchJson, path) {
  const sep = path.includes('?') ? '&' : '?'
  const page = async offset => {
    const body = await fetchJson(`${path}${sep}limit=${PAGE}&offset=${offset}`)
    if (!body || body.status === false || !body.result) throw new Error(`Qase ${path.split('?')[0]}: unexpected response`)
    return body.result
  }
  const first = await page(0)
  const out = [...(first.entities || [])]
  const total = first.total ?? out.length
  if (!out.length || out.length >= total) return out
  const offsets = []
  for (let o = PAGE; o < total; o += PAGE) offsets.push(o)
  for (const r of await Promise.all(offsets.map(page))) out.push(...(r.entities || []))
  return out
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
    const totalCases = own.length // R19: every case in the suite tree, whatever its automation value
    const totalAutomated = own.filter(c => c.automation === AUTOMATED).length
    if (totalAutomated > totalCases) throw new Error(`${key}: automated ${totalAutomated} > cases ${totalCases}`) // R19 guard → R9

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
    systems[key] = { suite: suite.title, totalCases, totalAutomated, run }
  }
  return { measuredAt: now.toISOString(), project: PROJECT, systems }
}
