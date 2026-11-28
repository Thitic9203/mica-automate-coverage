// Pyrite scripted case ids, live — spec docs/sdd/pyrite-automation-only R1, R2.
// Secret (Pages, set by the owner): GITHUB_TOKEN = read-only contents of pyrite-qa-e2e.
import { parseTar, automatedCaseIds } from '../../lib/pyrite-tickets-core.mjs'

const REPO = 'Thitic9203/pyrite-qa-e2e'
const EDGE_TTL = 300 // R2: edge-cached 5 min

const json = (status, body, extra = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
})

export async function onRequest(context) {
  const { request, env } = context
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json(405, { status: false, errorMessage: 'Method not allowed' }, { Allow: 'GET, HEAD' })
  }
  const cache = caches.default
  const cacheKey = new Request(new URL(request.url).origin + '/api/pyrite-automated', { method: 'GET' })
  const hit = await cache.match(cacheKey)
  if (hit) return new Response(hit.body, { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

  if (!env.GITHUB_TOKEN) return json(500, { status: false, errorMessage: 'Not configured: GITHUB_TOKEN secret must be set' })
  let caseIds
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/tarball/main`, {
      headers: { Authorization: 'Bearer ' + env.GITHUB_TOKEN, Accept: 'application/vnd.github+json', 'User-Agent': 'pluton-automate-coverage' },
    })
    if (!r.ok || !r.body) throw new Error('GitHub tarball HTTP ' + r.status)
    const tar = new Uint8Array(await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer())
    caseIds = automatedCaseIds(parseTar(tar))
  } catch (e) {
    return json(502, { status: false, errorMessage: String(e.message || e) })
  }
  const body = JSON.stringify({ measuredAt: new Date().toISOString(), caseIds })
  context.waitUntil(cache.put(cacheKey, new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${EDGE_TTL}` } })))
  return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}
