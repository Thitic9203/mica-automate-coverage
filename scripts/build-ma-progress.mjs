#!/usr/bin/env node
// Builds public/ma-progress.json from Qase project MA — spec docs/sdd/ma-tabs R4–R9.
// Token: env QASE_API_TOKEN, else the file named by env QASE_TOKEN_FILE. The token is never printed.
// Usage: QASE_TOKEN_FILE=<path> node scripts/build-ma-progress.mjs
import { readFileSync, writeFileSync, renameSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { buildMaProgress } from '../public/ma-progress-core.mjs'

export { buildMaProgress }


function readToken() {
  if (process.env.QASE_API_TOKEN) return process.env.QASE_API_TOKEN.trim()
  if (process.env.QASE_TOKEN_FILE) return readFileSync(process.env.QASE_TOKEN_FILE, 'utf8').trim()
  throw new Error('Set QASE_API_TOKEN or QASE_TOKEN_FILE')
}

async function main() {
  const token = readToken()
  const base = process.env.QASE_BASE_URL || 'https://api.qase.io/v1'
  const fetchJson = async path => {
    const res = await fetch(base + path, { headers: { Token: token, Accept: 'application/json' } })
    if (!res.ok) throw new Error(`Qase ${path.split('?')[0]}: HTTP ${res.status}`)
    return res.json()
  }
  const data = await buildMaProgress({ fetchJson })
  const out = process.env.MA_PROGRESS_OUT || fileURLToPath(new URL('../public/ma-progress.json', import.meta.url))
  const tmp = out + '.tmp'
  writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n')
  renameSync(tmp, out) // R9: the old file is replaced only after a full, successful build
  const s = data.systems
  console.log(`wrote ${out}: ` + ['MICA1', 'EVMS', 'ELMS', 'CBMS'].map(k => `${k}=${s[k] ? `${s[k].totalAutomated}${s[k].run ? ` run ${s[k].run.passed}/${s[k].run.cases}` : ' no-run'}` : 'absent'}`).join(' · '))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(e => {
    // Never echo the token: messages above carry only paths and HTTP status.
    console.error('build-ma-progress failed: ' + (e && e.message ? e.message : 'error'))
    process.exit(1)
  })
}
