// Remembers which questions this device has shown, so practice and tests can avoid repeats.
// Stores a short hash of each prompt (not the text), capped so storage stays small.
import { hashString } from './util'

const KEY = 'mc.seen'
const CAP = 8000
let cache: Set<number> | null = null

function load(): Set<number> {
  if (cache) return cache
  try {
    const a = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    cache = new Set(Array.isArray(a) ? a : [])
  } catch {
    cache = new Set()
  }
  return cache
}
export const hasSeen = (prompt: string) => load().has(hashString(prompt))
export function markSeen(prompt: string) {
  let s = load()
  s.add(hashString(prompt))
  if (s.size > CAP) cache = s = new Set([...s].slice(-CAP)) // drop the oldest
  try {
    localStorage.setItem(KEY, JSON.stringify([...s]))
  } catch {
    /* ignore */
  }
}
export const seenCount = () => load().size
