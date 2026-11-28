// Pure helpers for functions/api/pyrite-tickets.js — spec docs/sdd/pyrite-tab-pluton R4.
// No Node-only imports: the Pages Function bundles this file, node tests import it.

const dec = new TextDecoder()
const str = (b, from, len) => { const s = dec.decode(b.subarray(from, from + len)); const z = s.indexOf('\0'); return z < 0 ? s : s.slice(0, z) }

/** R4b: regular files of an (uncompressed) GitHub tarball, path without the top folder. */
export function parseTar(bytes) {
  const out = []
  let off = 0, paxPath = null
  while (off + 512 <= bytes.length) {
    const h = bytes.subarray(off, off + 512)
    if (h.every(x => x === 0)) break
    const name = str(h, 0, 100), prefix = str(h, 345, 155)
    const size = parseInt(str(h, 124, 12).trim() || '0', 8)
    const type = String.fromCharCode(h[156] || 48)
    const body = bytes.subarray(off + 512, off + 512 + size)
    off += 512 + Math.ceil(size / 512) * 512
    if (type === 'x') { // pax extended header: "<len> path=<value>\n" records
      const m = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(dec.decode(body))
      paxPath = m ? m[1] : null
      continue
    }
    if (type === 'g') continue
    const full = paxPath || (prefix ? prefix + '/' + name : name)
    paxPath = null
    if (type !== '0' && type !== '\0') continue
    const rel = full.split('/').slice(1).join('/')
    if (rel) out.push({ name: rel, text: dec.decode(body) })
  }
  return out
}

const ANNOTATION = /type:\s*['"]tickets['"]\s*,\s*description:\s*['"]([^'"]+)['"]/g

/** R4b: every PYR key named by a tickets annotation in tests/**\/*.spec.ts. */
export function annotatedKeys(files) {
  const keys = new Set()
  for (const f of files) {
    if (!/^tests\/.+\.spec\.ts$/.test(f.name)) continue
    for (const m of f.text.matchAll(ANNOTATION)) for (const k of m[1].match(/PYR-\d+/g) || []) keys.add(k)
  }
  return keys
}

const CASE_TITLE = /`PYRITE-(\d+) — /g

/** pyrite-automation-only R1: Qase case ids named by `PYRITE-<id> — ` test titles in tests/**\/*.spec.ts, ascending. */
export function automatedCaseIds(files) {
  const ids = new Set()
  for (const f of files) {
    if (!/^tests\/.+\.spec\.ts$/.test(f.name)) continue
    for (const m of f.text.matchAll(CASE_TITLE)) ids.add(Number(m[1]))
  }
  return [...ids].sort((a, b) => a - b)
}

const byNumber = (a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1])

/** R4d: the JQL the AUTOMATED filter must carry. Jira rejects `issuekey is EMPTY`, so no key = a clause matching nothing. */
export function automatedJql(allFilterId, keys) {
  const sorted = [...keys].sort(byNumber)
  return sorted.length
    ? `filter = ${allFilterId} AND issuekey in (${sorted.join(', ')})`
    : `filter = ${allFilterId} AND created < "1970-01-01"`
}

/** R4c: Done keys of the ALL filter that a test names. */
export function ticketFigure(doneKeys, annotated) {
  const automatedKeys = doneKeys.filter(k => annotated.has(k)).sort(byNumber)
  const done = doneKeys.length, withAutomatedCase = automatedKeys.length
  return { done, withAutomatedCase, percent: done ? Math.round((withAutomatedCase / done) * 1000) / 10 : 0, automatedKeys }
}
