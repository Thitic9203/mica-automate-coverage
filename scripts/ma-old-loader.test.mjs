// Spec docs/sdd/ma-tabs R39 — the old Qase loader must not run while MA / OLS is active.
// Run: node --test scripts/*.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8')

test('R39: showApp does not start the old loader for the MA or OLS tab', () => {
  const body = html.slice(html.indexOf('function showApp()'), html.indexOf('let oldLoaderStarted'))
  assert.match(body, /usesOldData\(activeView\)/)
  assert.equal(/^\s*loadFromCacheThenRefresh\(\)\s*$/m.test(body), false, 'unguarded call left in showApp')
  assert.equal(/setInterval\(fetchAndRender/.test(body), false, 'unguarded interval left in showApp')
})

test('R39: switching to a view that uses the old data starts the loader once', () => {
  const nav = html.slice(html.indexOf('function setupNav()'), html.indexOf('function renderView'))
  assert.match(nav, /ensureOldLoader\(\)/)
  assert.match(html, /function usesOldData\(view\) \{ return view !== 'ma' && view !== 'ols' \}/)
})
