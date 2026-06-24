export async function onRequest(context) {
  const url = new URL(context.request.url)
  const path = url.pathname.replace('/api/qase', '') || '/'
  const qaseUrl = `https://api.qase.io/v1${path}${url.search}`

  const response = await fetch(qaseUrl, {
    method: context.request.method,
    headers: {
      'Token': '50c6e3fb93f0d51bd387d50d91f2282b1cec3d9aab0c44f4b64c4cf02b02e71f',
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
      'Cache-Control': 'public, max-age=300, s-maxage=300'
    }
  })
}
