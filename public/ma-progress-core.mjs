// Counting rules for the MA tab — spec docs/sdd/ma-tabs R5–R7, R19, R23–R25.
// Shared by the page (public/index.html, live in the browser) and scripts/build-ma-progress.mjs.
// No Node-only imports: this file is served as-is to the browser.
const PROJECT = 'MA'
const SYSTEMS = ['MICA1', 'EVMS', 'ELMS', 'CBMS'] // display order; keys in the JSON
const AUTOMATED = 2 // Qase case.automation: 0 not automated, 1 to be automated, 2 automated
const PAGE = 100
const MAX_IN_FLIGHT = 8 // R38: Qase allows 50 requests per 10 s; the page also runs the old tab's loader

const norm = s => String(s || '').replace(/\s+/g, '').toUpperCase()
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0)
// R30: /run?status=complete already filters; Qase reports a finished run with failures as status 3 ("failed").
const isComplete = r => Boolean(r.end_time)

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
  const pages = new Array(offsets.length)
  let next = 0
  const worker = async () => {
    while (next < offsets.length) { const i = next++; pages[i] = await page(offsets[i]) }
  }
  await Promise.all(Array.from({ length: Math.min(MAX_IN_FLIGHT, offsets.length) }, worker))
  for (const r of pages) out.push(...(r.entities || []))
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

// R28: a page that fails with 5xx or a network error is tried again, at most twice; 4xx fails at once.
export function retryable(fetchJson, delayMs = 800) {
  return async path => {
    for (let attempt = 0; ; attempt++) {
      try { return await fetchJson(path) } catch (e) {
        const transient = e.status === undefined || e.status >= 500
        if (!transient || attempt >= 2) throw e
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1)))
      }
    }
  }
}

const TYPE_OPTIONS = { 1: 'happyPath', 2: 'failureScenario', 3: 'edgeCase', 4: 'exceptionalCase' }
const TYPE_ORDER = ['happyPath', 'failureScenario', 'edgeCase', 'exceptionalCase', 'empty']
const TYPE_FIELD_ID = 4

// Largest-remainder shares in tenths of a percent so the rows add to exactly 100.0 (OLS R19).
function shares(totals, sum) {
  const raw = totals.map(t => (sum ? (t * 1000) / sum : 0))
  const tenths = raw.map(Math.floor)
  let left = sum ? 1000 - tenths.reduce((a, b) => a + b, 0) : 0
  raw.map((v, i) => [v - tenths[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).forEach(([, i]) => { if (left > 0) { tenths[i]++; left-- } })
  return tenths.map(t => t / 10)
}

/** R31–R36: the four systems counted together, in the OLS card vocabulary. */
export async function buildMaOverview({ fetchJson, now = new Date() }) {
  const suites = await fetchAll(fetchJson, `/suite/${PROJECT}`)
  const cases = await fetchAll(fetchJson, `/case/${PROJECT}`)
  const runs = (await fetchAll(fetchJson, `/run/${PROJECT}?status=complete&include=cases`)).filter(isComplete)

  const children = new Map()
  for (const s of suites) {
    const p = s.parent_id || 0
    if (!children.has(p)) children.set(p, [])
    children.get(p).push(s.id)
  }
  const inSystems = new Set()
  for (const key of SYSTEMS) {
    const root = suites.find(s => !s.parent_id && norm(s.title) === key)
    if (!root) continue
    const stack = [root.id]
    while (stack.length) { const id = stack.pop(); inSystems.add(id); stack.push(...(children.get(id) || [])) }
  }
  const own = cases.filter(c => inSystems.has(c.suite_id))
  const ownIds = new Set(own.map(c => c.id))

  runs.sort((a, b) => String(b.end_time || '').localeCompare(String(a.end_time || '')) || b.id - a.id)
  const latest = runs.find(r => (r.cases || []).some(id => ownIds.has(id)))
  const last = new Map()
  if (latest) {
    for (const res of await fetchAll(fetchJson, `/result/${PROJECT}?run=${latest.id}`)) {
      if (!ownIds.has(res.case_id)) continue
      const prev = last.get(res.case_id)
      if (!prev || String(res.end_time || '') >= String(prev.end_time || '')) last.set(res.case_id, res)
    }
  }

  let passed = 0, waiting = 0, failed = 0, skipped = 0, notRun = 0
  const other = {}
  const statusOf = new Map()
  for (const c of own) {
    const res = last.get(c.id)
    if (!res && c.automation !== AUTOMATED) { waiting++; statusOf.set(c.id, 'waiting'); continue } // R32
    const st = String(res?.status || '').toLowerCase()
    if (!st) { notRun++; statusOf.set(c.id, 'notPassed') }
    else if (st === 'passed') { passed++; statusOf.set(c.id, 'passed') }
    else {
      statusOf.set(c.id, 'notPassed')
      if (st === 'failed') failed++
      else if (st === 'skipped') skipped++
      else other[st] = (other[st] || 0) + 1
    }
  }
  const total = own.length
  const notPassed = failed + skipped + notRun + Object.values(other).reduce((a, b) => a + b, 0)
  if (passed + notPassed + waiting !== total) throw new Error('status counts do not add up to the total')

  // R35: Qase custom field 4; one value per case; unknown value → no card, with the reason.
  const byType = Object.fromEntries(TYPE_ORDER.map(k => [k, { key: k, total: 0, passed: 0, notPassed: 0, waiting: 0 }]))
  let typesError = null
  for (const c of own) {
    const f = (c.custom_fields || []).find(x => Number(x.id) === TYPE_FIELD_ID)
    const raw = f && f.value !== '' && f.value != null ? String(f.value) : null
    let key = 'empty'
    if (raw !== null) {
      const parts = raw.split(',').map(x => x.trim())
      if (parts.length !== 1 || !TYPE_OPTIONS[parts[0]]) { typesError = `Test Case Type value "${raw}" is not one of 1–4`; break }
      key = TYPE_OPTIONS[parts[0]]
    }
    byType[key].total++; byType[key][statusOf.get(c.id)]++
  }
  let types = null
  if (!typesError) {
    const share = shares(TYPE_ORDER.map(k => byType[k].total), total)
    types = TYPE_ORDER.map((k, i) => ({ ...byType[k], sharePercent: share[i] }))
  }

  return {
    measuredAt: now.toISOString(), project: PROJECT,
    cases: { total, passed, notPassed, waiting, passedPercent: pct(passed, total), notPassedPercent: pct(notPassed, total), waitingPercent: pct(waiting, total) },
    breakdown: { failed, skipped, notRun, other },
    types, typesError,
    run: latest ? { title: latest.title, startedAt: latest.start_time || null, completedAt: latest.end_time } : null,
  }
}
