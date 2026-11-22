// One-time import of saved progress from the app's old web address.
// The old address now redirects here with the data in the URL fragment (#migrate=…). Saved data lives per
// web address, so without this the crossword progress, quiz streaks and settings would appear to vanish.
const KEYS = ['mc.progress', 'mc.settings', 'mc.quiz', 'mc.tests', 'mc.mode']

export function importMigratedData() {
  const m = location.hash.match(/^#migrate=(.+)$/)
  if (!m) return
  try {
    const bytes = Uint8Array.from(atob(decodeURIComponent(m[1])), c => c.charCodeAt(0))
    const data = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>
    for (const k of KEYS) {
      const v = data[k]
      // never overwrite anything already saved here
      if (typeof v === 'string' && localStorage.getItem(k) === null) {
        if (k !== 'mc.mode') JSON.parse(v) // must be valid JSON (mc.mode is a plain string)
        localStorage.setItem(k, v)
      }
    }
  } catch {
    /* ignore malformed data */
  }
  history.replaceState(null, '', location.pathname + location.search)
}
