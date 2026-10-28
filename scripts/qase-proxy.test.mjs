// Tests for functions/api/qase/[[path]].js — spec docs/sdd/qase-proxy-token R1–R3.
// Run: node --test scripts/*.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { onRequest } from '../functions/api/qase/[[path]].js'

const req = url => ({ request: new Request(url), env: { QASE_API_TOKEN: 'tok_from_env' } })

test('R1: no Qase token is committed in the proxy source', () => {
  const src = readFileSync(new URL('../functions/api/qase/[[path]].js', import.meta.url), 'utf8')
  assert.equal(/[0-9a-f]{40,}/i.test(src), false)
})

test('R1/R3: token comes from env; path and query forwarded; headers kept', async t => {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, init) => { calls.push({ url, init }); return new Response('{"status":true}', { status: 200 }) })
  const res = await onRequest(req('https://x.dev/api/qase/case/MA?limit=100&offset=200'))
  assert.equal(calls[0].url, 'https://api.qase.io/v1/case/MA?limit=100&offset=200')
  assert.equal(calls[0].init.headers.Token, 'tok_from_env')
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*')
  assert.equal(await res.text(), '{"status":true}')
})

test('R2: missing secret → 500 JSON naming it, Qase not called', async t => {
  const f = t.mock.method(globalThis, 'fetch', async () => new Response('x'))
  const res = await onRequest({ request: new Request('https://x.dev/api/qase/project/MA'), env: {} })
  assert.equal(res.status, 500)
  assert.match(await res.text(), /QASE_API_TOKEN/)
  assert.equal(f.mock.callCount(), 0)
})

for (const method of ['DELETE', 'POST', 'PUT', 'PATCH']) {
  test(`R5: ${method} → 405 with Allow, Qase not called`, async t => {
    const f = t.mock.method(globalThis, 'fetch', async () => new Response('{}'))
    const res = await onRequest({ request: new Request('https://x.dev/api/qase/case/MA/1', { method }), env: { QASE_API_TOKEN: 'tok' } })
    assert.equal(res.status, 405)
    assert.equal(res.headers.get('Allow'), 'GET, HEAD')
    assert.equal(f.mock.callCount(), 0)
  })
}

test('R5: HEAD is forwarded as HEAD', async t => {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, init) => { calls.push(init.method); return new Response(null, { status: 200 }) })
  const res = await onRequest({ request: new Request('https://x.dev/api/qase/project/MA', { method: 'HEAD' }), env: { QASE_API_TOKEN: 'tok' } })
  assert.equal(res.status, 200)
  assert.deepEqual(calls, ['HEAD'])
})

test('R6: the page holds no Qase token and sends no Token header', () => {
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8')
  assert.equal(/[0-9a-f]{64}/i.test(html), false)
  assert.equal(/['"]Token['"]\s*:/.test(html), false)
})
