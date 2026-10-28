// Qase proxy — spec docs/sdd/qase-proxy-token. The token lives only in the Pages secret QASE_API_TOKEN.
export async function onRequest(context) {
  const method = context.request.method
  if (method !== 'GET' && method !== 'HEAD') { // R5: public proxy, write-capable token
    return new Response(JSON.stringify({ status: false, errorMessage: 'Method not allowed: the Qase proxy is read-only' }), {
      status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'GET, HEAD', 'Cache-Control': 'no-store' }
    })
  }
  const token = context.env && context.env.QASE_API_TOKEN
  if (!token) {
    return new Response(JSON.stringify({ status: false, errorMessage: 'Proxy misconfigured: QASE_API_TOKEN secret is not set' }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    })
  }
  const url = new URL(context.request.url)
  const path = url.pathname.replace('/api/qase', '') || '/'
  const qaseUrl = `https://api.qase.io/v1${path}${url.search}`

  const response = await fetch(qaseUrl, {
    method,
    headers: {
      'Token': token,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })

  const body = await response.text()
  return new Response(body, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      // No browser cache (so background refresh always gets fresh data); short
      // shared edge cache (60s) to absorb concurrent opens without hitting Qase
      // rate limits. Was max-age=300/s-maxage=300 → data could be ~5-10min stale.
      'Cache-Control': 'public, max-age=0, s-maxage=60'
    }
  })
}
