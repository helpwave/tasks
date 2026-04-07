import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(__dirname, '..')
const localesDir = path.join(webRoot, 'locales')

const KNOWN_DYNAMIC_KEYS = [
  'dashboardWelcomeMorning',
  'dashboardWelcomeNoon',
  'dashboardWelcomeAfternoon',
  'dashboardWelcomeEvening',
  'dashboardWelcomeNight',
]

const TRANSLATION_CALL_RE = /translation\s*\(\s*['"]([^'"]+)['"]/g

function loadArbKeys(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const json = JSON.parse(raw)
  return new Set(
    Object.keys(json).filter(
      (k) => !k.startsWith('@') && k !== '@@locale'
    )
  )
}

function allArbFiles() {
  const names = fs.readdirSync(localesDir)
  return names
    .filter((n) => n.endsWith('.arb') && !n.includes('/'))
    .map((n) => path.join(localesDir, n))
}

const SCAN_DIRS = ['components', 'pages', 'hooks', 'utils', 'providers', 'data']
const SKIP_DIRS = new Set(['node_modules', '.next', 'scripts', '__tests__', 'cache', 'link', 'mutations', 'storage', 'subscriptions'])

function collectKeysFromSource(dir, keys = new Set()) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (SKIP_DIRS.has(e.name)) continue
    if (e.isDirectory()) {
      collectKeysFromSource(full, keys)
      continue
    }
    if (!/\.(tsx?|jsx?|mjs|cjs)$/.test(e.name)) continue
    if (path.basename(full) === 'translations.ts') continue
    const content = fs.readFileSync(full, 'utf8')
    let m
    TRANSLATION_CALL_RE.lastIndex = 0
    while ((m = TRANSLATION_CALL_RE.exec(content)) !== null) {
      keys.add(m[1])
    }
  }
  return keys
}

function main() {
  const usedKeys = new Set()
  for (const subdir of SCAN_DIRS) {
    const dir = path.join(webRoot, subdir)
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      collectKeysFromSource(dir, usedKeys)
    }
  }
  KNOWN_DYNAMIC_KEYS.forEach((k) => usedKeys.add(k))

  const arbPaths = allArbFiles()
  if (arbPaths.length === 0) {
    console.error('No ARB files found in', localesDir)
    process.exit(1)
  }

  const localeKeys = new Map()
  for (const p of arbPaths) {
    const locale = path.basename(p, '.arb')
    localeKeys.set(locale, loadArbKeys(p))
  }

  const allLocales = [...localeKeys.keys()]
  const missing = []
  for (const key of usedKeys) {
    for (const locale of allLocales) {
      if (!localeKeys.get(locale).has(key)) {
        missing.push({ key, locale })
      }
    }
  }

  if (missing.length > 0) {
    console.error('Missing translation keys (used in code but not in ARB):\n')
    const byKey = new Map()
    for (const { key, locale } of missing) {
      if (!byKey.has(key)) byKey.set(key, [])
      byKey.get(key).push(locale)
    }
    for (const [key, locales] of byKey) {
      console.error(`  [${key}] missing in: ${locales.join(', ')}`)
    }
    process.exit(1)
  }

  console.log('All translation keys used in code exist in every locale.')
}

main()
