#!/usr/bin/env node
/**
 * check_licenses.mjs — walk backend/frontend lockfiles and flag licenses.
 * Output: table + non-zero exit when a disallowed license is found.
 *
 * Policy (docs/ComplianceReport.md § Licenses):
 *   allow: MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, 0BSD, CC-BY-4.0,
 *          BlueOak-1.0.0, Unlicense, Python-2.0
 *   flag for review (**REQUIRES LEGAL REVIEW**): GPL*, LGPL*, AGPL*, MPL*,
 *          EPL*, EUPL*, "Unknown"
 *
 * Usage: node scripts/check_licenses.mjs [backend|frontend]
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ALLOW = new Set([
  'MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', '0BSD',
  'CC-BY-4.0', 'BlueOak-1.0.0', 'Unlicense', 'Python-2.0', 'CC0-1.0',
])
const REVIEW = /^(GPL|LGPL|AGPL|MPL|EPL|EUPL|CDDL|SSPL)/

const targets = process.argv[2] ? [process.argv[2]] : ['backend', 'frontend']
let flagged = 0

for (const target of targets) {
  const lockPath = join(target, 'package-lock.json')
  const pkgPath = join(target, 'package.json')
  if (!existsSync(lockPath)) {
    console.log(`⚠ ${target}: no package-lock.json — run "npm install" there first`)
    continue
  }
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'))
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const wanted = new Set(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }))

  console.log(`\n== ${target} (${wanted.size} direct dependencies) ==`)
  for (const name of [...wanted].sort()) {
    const entry = lock.packages?.[`node_modules/${name}`]
    const license = entry?.license ?? 'Unknown'
    const verdict = ALLOW.has(license) ? 'OK' : REVIEW.test(license) ? '**REQUIRES LEGAL REVIEW** (copyleft/unknown)' : 'Needs Attention'
    if (verdict !== 'OK') flagged++
    console.log(`${verdict.padEnd(40)} ${license.padEnd(14)} ${name}`)
  }
}

console.log(`\n${flagged} item(s) need attention.`)
process.exit(flagged > 0 ? 2 : 0)
