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
  Pyrite: { // spec docs/sdd/pyrite-tab-pluton R10
    suites: [],
    cases: [...Array(10)].map((_, i) => kase(200 + i, 5, 0, i < 6 ? (i % 4) + 1 : null)),
    runs: [{ id: 9, title: 'Pyrite Automate · fixture run', start_time: '2026-11-28T10:00:00+07:00', end_time: '2026-11-28T10:20:00+07:00', cases: [200, 201, 202, 203] }],
    results: { 9: [{ case_id: 200, status: 'passed' }, { case_id: 201, status: 'passed' }, { case_id: 202, status: 'failed' }, { case_id: 203, status: 'blocked' }] },
  },
}
const page = (all, u) => {
  const limit = Number(u.searchParams.get('limit') || 100), offset = Number(u.searchParams.get('offset') || 0)
  return { status: true, result: { total: all.length, entities: all.slice(offset, offset + limit) } }
}

const fs = require('fs'), path = require('path')
const FONT_DIR = path.join(__dirname, 'fonts')
const FONT_CSS = fs.readFileSync(path.join(FONT_DIR, 'fonts.css'), 'utf8')
async function open(pageObj, view) {
  // fixed wall clock: the ticket card's 2 h staleness check and the pill time must not depend on when tests run
  await pageObj.clock.setFixedTime(new Date('2026-10-28T16:00:00.000Z'))
  await pageObj.route('https://www.gstatic.com/firebasejs/**/firebase-app.js', r => r.fulfill({ contentType: 'text/javascript', body: APP }))
  await pageObj.route('https://www.gstatic.com/firebasejs/**/firebase-auth.js', r => r.fulfill({ contentType: 'text/javascript', body: AUTH }))
  await pageObj.route('https://raw.githubusercontent.com/**/ols-tickets.json', r => r.fulfill({ contentType: 'application/json',
    body: JSON.stringify({ measuredAt: '2026-10-28T15:31:20.353Z', done: 684, withAutomatedCase: 292, percent: 42.7 }) }))
  await pageObj.route('**/api/pyrite-automated', r => r.fulfill({ contentType: 'application/json', // pyrite-automation-only R2
    body: JSON.stringify({ measuredAt: '2026-11-28T15:00:00.000Z', caseIds: [200, 201, 202, 203, 204] }) }))
  await pageObj.route('**/api/pyrite-tickets', r => r.fulfill({ contentType: 'application/json',
    body: JSON.stringify({ measuredAt: '2026-10-28T15:40:00.000Z', done: 33, withAutomatedCase: 32, percent: 97, filters: { automated: 24026, all: 24025 } }) }))
  await pageObj.route('**/api/qase/**', r => {
    const u = new URL(r.request().url())
    const [, , , kind, project] = u.pathname.split('/')
    const d = DATA[project]
    const body = kind === 'suite' ? page(d.suites, u) : kind === 'case' ? page(d.cases, u) : kind === 'run' ? page(d.runs, u)
      : kind === 'result' ? page(d.results[u.searchParams.get('run')] || [], u) : { status: false }
    return r.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
  // visual-flake R3: GSAP is a no-op under reduced motion (index.html motion guard), so it is not fetched from the CDN
  await pageObj.route('https://cdnjs.cloudflare.com/ajax/libs/gsap/**', r => r.fulfill({ contentType: 'text/javascript', body: '' }))
  // spec docs/sdd/visual-flake R1 (rev 2): web fonts come from tests/visual/fonts, never the network
  await pageObj.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: FONT_CSS }))
  await pageObj.route('https://fonts.gstatic.com/**', r => {
    const file = path.join(FONT_DIR, new URL(r.request().url()).pathname.slice(1).replace(/\//g, '_'))
    return fs.existsSync(file) ? r.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(file) }) : r.abort()
  })
  await pageObj.goto('/')
  if (view !== 'ma') await pageObj.locator(`.tab[data-view="${view}"]`).click()
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
    for (const view of ['ma', 'ols', 'pyrite']) {
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
        expect(await p.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
        // spec docs/sdd/ui-scale-70 R1: whole page at 70%; R3: #app still fills the window height
        expect(await p.evaluate(() => getComputedStyle(document.body).zoom)).toBe('0.7')
        const appH = await p.evaluate(() => document.getElementById('app').getBoundingClientRect().height)
        expect(appH).toBeGreaterThanOrEqual(899)
        // fullPage sizes the shot in unzoomed px under CSS zoom (900 px wide page -> 1286 px shot, unstable pixels
        // beyond the rendered area), so grow the viewport to the real document height and shoot the viewport.
        const docH = await p.evaluate(() => Math.ceil(document.documentElement.getBoundingClientRect().height))
        await p.setViewportSize({ width, height: Math.max(900, docH) })
        await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
        await expect(p).toHaveScreenshot(`${view}-${width}-${theme}.png`)
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
