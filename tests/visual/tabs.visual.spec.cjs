// Spec docs/sdd/live-qase-tabs R14 — screenshot baselines of both tabs at 390 / 900 / 1440 px.
// Firebase is stubbed (signed-in team member), Qase answers from fixed fixtures, motion is off.
const { test, expect } = require('@playwright/test')

const APP = 'export const initializeApp = () => ({})'
const AUTH = `
export const getAuth = () => ({})
export class GoogleAuthProvider { setCustomParameters() {} }
export const signInWithPopup = async () => ({})
export const signOut = async () => {}
export const setPersistence = async () => {}
export const browserLocalPersistence = {}
export const onAuthStateChanged = (a, cb) => { setTimeout(() => cb({ email: 'thitichaya@skilllane.com' }), 0); return () => {} }`

const kase = (id, suite_id, automation, type) => ({ id, suite_id, automation, custom_fields: type ? [{ id: 4, value: String(type) }] : [] })
const DATA = {
  MA: {
    suites: [{ id: 1, title: 'MICA1', parent_id: null }, { id: 2, title: 'EVMS', parent_id: null }],
    cases: [...Array(20)].map((_, i) => kase(i + 1, i % 2 ? 2 : 1, 0, (i % 4) + 1)),
    runs: [{ id: 2, title: 'Fixture run', start_time: '2026-10-28T12:00:00+07:00', end_time: '2026-10-28T12:30:00+07:00', cases: [1, 2, 3, 4, 5, 6, 7] }],
    results: { 2: [1, 2, 3, 4, 5, 6].map(id => ({ case_id: id, status: 'passed' })).concat([{ case_id: 7, status: 'failed' }]) },
  },
  OLS: {
    suites: [],
    cases: [...Array(12)].map((_, i) => kase(100 + i, 9, i < 8 ? 2 : 0, i % 3 ? (i % 4) + 1 : null)),
    runs: [{ id: 8, title: 'Fixture OLS run', start_time: '2026-10-28T10:00:00+07:00', end_time: '2026-10-28T10:40:00+07:00', cases: [100, 101, 102, 103, 104, 105] }],
    results: { 8: [{ case_id: 100, status: 'passed' }, { case_id: 101, status: 'passed' }, { case_id: 102, status: 'failed' }, { case_id: 103, status: 'skipped' }, { case_id: 104, status: 'passed' }, { case_id: 105, status: 'blocked' }] },
  },
}
const page = (all, u) => {
  const limit = Number(u.searchParams.get('limit') || 100), offset = Number(u.searchParams.get('offset') || 0)
  return { status: true, result: { total: all.length, entities: all.slice(offset, offset + limit) } }
}

async function open(pageObj, view) {
  await pageObj.route('https://www.gstatic.com/firebasejs/**/firebase-app.js', r => r.fulfill({ contentType: 'text/javascript', body: APP }))
  await pageObj.route('https://www.gstatic.com/firebasejs/**/firebase-auth.js', r => r.fulfill({ contentType: 'text/javascript', body: AUTH }))
  await pageObj.route('**/api/qase/**', r => {
    const u = new URL(r.request().url())
    const [, , , kind, project] = u.pathname.split('/')
    const d = DATA[project]
    const body = kind === 'suite' ? page(d.suites, u) : kind === 'case' ? page(d.cases, u) : kind === 'run' ? page(d.runs, u)
      : kind === 'result' ? page(d.results[u.searchParams.get('run')] || [], u) : { status: false }
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
  await pageObj.goto('/')
  if (view === 'ols') await pageObj.locator('.tab[data-view="ols"]').click()
  await expect(pageObj.locator('#live-sub')).toHaveText('Refreshes each time you open this tab')
  // rule 21: never shoot before every web font face in use has finished loading
  await pageObj.waitForLoadState('networkidle')
  await pageObj.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.fonts].filter(f => f.status === 'loading').map(f => f.loaded))
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  })
  await expect.poll(() => pageObj.evaluate(() => document.fonts.status)).toBe('loaded')
}

for (const theme of ['light', 'dark']) {
  for (const width of [390, 900, 1440]) {
    for (const view of ['ma', 'ols']) {
      test(`${view} @ ${width}px · ${theme}`, async ({ page: p }) => {
        await p.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
        await p.setViewportSize({ width, height: 900 })
        await open(p, view)
        expect(await p.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe(theme)
        await expect(p.locator('#theme-btn')).toHaveAttribute('aria-pressed', String(theme === 'dark'))
        // freeze the two wall-clock texts so their width cannot move anything (no masks needed)
        await p.evaluate(() => {
          document.getElementById('last-updated').textContent = 'Updated Date: 28/Oct/2026 12:00 PM'
          document.querySelector('.ols-note dd').textContent = '28/Oct/2026 12:00 PM'
        })
        await expect(p).toHaveScreenshot(`${view}-${width}-${theme}.png`, { fullPage: true })
        expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
        await p.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js' })
        const v = await p.evaluate(async () => (await window.axe.run(document.getElementById('app'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(x => x.id + ':' + x.nodes.map(n => n.target.join(' ')).join('|')))
        expect(v).toEqual([])
      })
    }
  }
}

test('theme toggle: choice beats the system and survives reload', async ({ page: p }) => {
  await p.emulateMedia({ colorScheme: 'light' })
  await open(p, 'ma')
  await p.locator('#theme-btn').click()
  await expect(p.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(p.locator('#theme-btn')).toHaveAttribute('aria-pressed', 'true')
  await p.reload()
  await expect(p.locator('html')).toHaveAttribute('data-theme', 'dark')
})
