// Pyrite Done-ticket figure, live — spec docs/sdd/pyrite-tab-pluton R4, R9.
// Secrets (Pages, set by the owner): JIRA_BASIC = "email:token", GITHUB_TOKEN = read-only contents of pyrite-qa-e2e.
import { parseTar, annotatedKeys, automatedJql, ticketFigure } from '../../lib/pyrite-tickets-core.mjs'

const JIRA = 'https://skilllane.atlassian.net/rest/api/3/'
const ALL_FILTER = 24025 // "Pyrite Automate · Done tickets (board scope)" = filter 24024
const AUTOMATED_FILTER = 24026 // "Pyrite Automate · Done tickets with an automated case", rewritten here (R4d)
const REPO = 'Thitic9203/pyrite-qa-e2e'
const EDGE_TTL = 300 // R4: edge-cached 5 min

const json = (status, body, extra = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
})

async function jiraDoneKeys(auth) {
  const keys = []
  let nextPageToken
  do {
    const r = await fetch(JIRA + 'search/jql', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ jql: `filter = ${ALL_FILTER}`, fields: ['key'], maxResults: 100, nextPageToken }),
    })
    if (!r.ok) throw new Error('Jira search HTTP ' + r.status)
    const j = await r.json()
    keys.push(...(j.issues || []).map(i => i.key))
    nextPageToken = j.nextPageToken
  } while (nextPageToken)
  return keys
}

async function annotatedFromRepo(token) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/tarball/main`, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'User-Agent': 'pluton-automate-coverage' },
  })
  if (!r.ok || !r.body) throw new Error('GitHub tarball HTTP ' + r.status)
  const tar = new Uint8Array(await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer())
  return annotatedKeys(parseTar(tar))
}

async function syncAutomatedFilter(auth, keys) {
  const url = JIRA + 'filter/' + AUTOMATED_FILTER
  const cur = await fetch(url, { headers: { Authorization: auth, Accept: 'application/json' } })
  if (!cur.ok) throw new Error('Jira filter HTTP ' + cur.status)
  const f = await cur.json()
  const jql = automatedJql(ALL_FILTER, keys)
  if (f.jql === jql) return
  const put = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ name: f.name, jql }),
  })
  if (!put.ok) throw new Error('Jira filter update HTTP ' + put.status)
}

export async function onRequest(context) {
  const { request, env } = context
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json(405, { status: false, errorMessage: 'Method not allowed' }, { Allow: 'GET, HEAD' }) // R4e
  }
  const cache = caches.default
  const cacheKey = new Request(new URL(request.url).origin + '/api/pyrite-tickets', { method: 'GET' })
  const hit = await cache.match(cacheKey)
  if (hit) return new Response(hit.body, { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

  if (!env.JIRA_BASIC || !env.GITHUB_TOKEN) {
    return json(500, { status: false, errorMessage: 'Not configured: JIRA_BASIC and GITHUB_TOKEN secrets must be set' })
  }
  const auth = 'Basic ' + btoa(env.JIRA_BASIC)
  let fig
  try {
    const [doneKeys, annotated] = await Promise.all([jiraDoneKeys(auth), annotatedFromRepo(env.GITHUB_TOKEN)])
    fig = ticketFigure(doneKeys, annotated)
    await syncAutomatedFilter(auth, fig.automatedKeys) // R4d: the filter always equals the card
  } catch (e) {
    return json(502, { status: false, errorMessage: String(e.message || e) })
  }
  const body = JSON.stringify({
    measuredAt: new Date().toISOString(),
    done: fig.done,
    withAutomatedCase: fig.withAutomatedCase,
    percent: fig.percent,
    filters: { automated: AUTOMATED_FILTER, all: ALL_FILTER },
  })
  context.waitUntil(cache.put(cacheKey, new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${EDGE_TTL}` } })))
  return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}
