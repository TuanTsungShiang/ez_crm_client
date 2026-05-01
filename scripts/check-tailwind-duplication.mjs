#!/usr/bin/env node
// Enforces ARCHITECTURE.md 規矩 1 + 規矩 2:
//   1. 同一個 Tailwind class 字串若在 ≥3 處出現,必須抽成 component
//   2. 單一 class 串 ≥10 utility = 違規 (純 layout class 例外)
//
// Why: ESLint is per-file and Tailwind v4 has no JS config, so eslint-plugin-tailwindcss
// is not viable here. A standalone scan integrated into `npm run lint` covers
// both rules cheaply.
//
// Run: npm run lint:tailwind
// CI: invoked via npm run lint

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'

const CWD = process.cwd()
const ROOT = resolve(CWD, 'src')

const DUPLICATE_THRESHOLD = 3 // 規矩 1: ≥3 處重複 = 違規
const UTILITY_LIMIT = 10 // 規矩 2: ≥10 utility = 違規
const MIN_CLASS_LENGTH = 40 // 短字串 (e.g. "flex items-center") 不檢查

// 純 layout / 排版 utility — 即使重複或數量多也不算違規
// (規矩 1 / 規矩 2 的明文例外)
const LAYOUT_PREFIXES = [
  'flex',
  'inline-flex',
  'grid',
  'block',
  'inline-block',
  'inline',
  'hidden',
  'items-',
  'justify-',
  'gap-',
  'space-',
  'mt-',
  'mb-',
  'ml-',
  'mr-',
  'mx-',
  'my-',
  'm-',
  'pt-',
  'pb-',
  'pl-',
  'pr-',
  'px-',
  'py-',
  'p-',
  'w-',
  'h-',
  'min-w-',
  'min-h-',
  'max-w-',
  'max-h-',
  'col-',
  'row-',
  'order-',
  'place-',
  'self-',
  'shrink',
  'grow',
  'basis-',
  'overflow-',
  'sm:',
  'md:',
  'lg:',
  'xl:',
  'relative',
  'absolute',
  'fixed',
  'sticky',
  'top-',
  'bottom-',
  'left-',
  'right-',
  'inset-',
  'z-',
]

function isLayoutToken(token) {
  return LAYOUT_PREFIXES.some((p) => token === p || token.startsWith(p))
}

function nonLayoutTokenCount(classStr) {
  return classStr
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !isLayoutToken(t)).length
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const s = statSync(full)
    if (s.isDirectory()) yield* walk(full)
    else if (s.isFile()) yield full
  }
}

function collectClassStrings() {
  // Map<classString, Array<{ file, line }>>
  const map = new Map()
  // Array<{ file, line, classStr, count }> for over-limit single-class violations
  const overLimit = []

  for (const file of walk(ROOT)) {
    if (!['.vue'].includes(extname(file))) continue
    const text = readFileSync(file, 'utf8')
    const lines = text.split(/\r?\n/)
    lines.forEach((line, idx) => {
      // Match plain `class="..."` (skip `:class` bindings — they're expressions, not literals)
      const re = /(?<![:\w])class="([^"]+)"/g
      let m
      while ((m = re.exec(line)) !== null) {
        const classStr = m[1].trim()
        if (classStr.length < MIN_CLASS_LENGTH) continue

        // 規矩 1: 重複偵測 — 累計同一字串出現位置
        if (!map.has(classStr)) map.set(classStr, [])
        map.get(classStr).push({ file, line: idx + 1 })

        // 規矩 2: 單一字串 utility 數量
        const count = nonLayoutTokenCount(classStr)
        if (count >= UTILITY_LIMIT) {
          overLimit.push({ file, line: idx + 1, classStr, count })
        }
      }
    })
  }

  return { map, overLimit }
}

function relPath(p) {
  return relative(CWD, p).replace(/\\/g, '/')
}

function main() {
  const { map, overLimit } = collectClassStrings()
  const violations = []

  // 規矩 1
  for (const [classStr, occurrences] of map) {
    if (occurrences.length >= DUPLICATE_THRESHOLD) {
      violations.push({
        rule: 1,
        message: `Tailwind class 字串重複 ${occurrences.length} 次 (≥${DUPLICATE_THRESHOLD} = 違規)`,
        classStr,
        locations: occurrences,
      })
    }
  }

  // 規矩 2 (去重: 同個 string 同個位置不重報)
  const seenOverLimit = new Set()
  for (const item of overLimit) {
    const key = `${item.file}:${item.line}:${item.classStr}`
    if (seenOverLimit.has(key)) continue
    seenOverLimit.add(key)
    violations.push({
      rule: 2,
      message: `單一 class 串含 ${item.count} 個非 layout utility (≥${UTILITY_LIMIT} = 違規)`,
      classStr: item.classStr,
      locations: [{ file: item.file, line: item.line }],
    })
  }

  if (violations.length === 0) {
    console.log('[check-tailwind-duplication] OK — no violations of ARCHITECTURE.md 規矩 1/2.')
    process.exit(0)
  }

  console.error(`[check-tailwind-duplication] 發現 ${violations.length} 項違規:\n`)
  for (const v of violations) {
    console.error(`規矩 ${v.rule}: ${v.message}`)
    console.error(`  class: "${v.classStr}"`)
    for (const loc of v.locations) {
      console.error(`    at ${relPath(loc.file)}:${loc.line}`)
    }
    console.error('')
  }
  console.error(
    '修復方法: 抽成 src/components/ui/ primitive, 或拆 variant prop。詳見 ARCHITECTURE.md。',
  )
  process.exit(1)
}

main()
