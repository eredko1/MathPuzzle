import type { Difficulty, Puzzle } from './engine/puzzle'

// localStorage can be unavailable (private mode, blocked storage) — never let that break the game.
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

export interface Settings {
  showTimer: boolean
  showMistakes: boolean
  theme: 'light' | 'dark'
  largeNumbers: boolean
  vibrate: boolean
}
const DEFAULT_SETTINGS: Settings = { showTimer: true, showMistakes: true, theme: 'light', largeNumbers: false, vibrate: true }
export const loadSettings = () => read('mc.settings', DEFAULT_SETTINGS)
export const saveSettings = (s: Settings) => write('mc.settings', s)

export interface Result {
  stars: number
  bestMs: number
}
export interface Progress {
  /** Next unplayed level per difficulty (1-based). */
  next: Record<Difficulty, number>
  levels: Record<string, Result>
  daily: Record<string, Result>
  streak: { count: number; lastDate: string }
  /** Difficulty of the last level opened, for the Continue button. */
  lastDiff?: Difficulty
}
const DEFAULT_PROGRESS: Progress = {
  next: { easy: 1, medium: 1, hard: 1 },
  levels: {},
  daily: {},
  streak: { count: 0, lastDate: '' },
}
export const loadProgress = () => read('mc.progress', DEFAULT_PROGRESS)
export const saveProgress = (p: Progress) => write('mc.progress', p)

export interface SavedGame {
  puzzle: Puzzle
  label: string
  /** Per slot (same order as puzzle.slots): tile id placed there, or null. */
  placed: (number | null)[]
  bankOrder: number[]
  hints: number
  elapsedMs: number
  updated: number
}

// In-progress games, keyed by puzzle key, so switching between a level and the
// daily puzzle never loses work. Only the most recent few are kept.
export function loadGames(): Record<string, SavedGame> {
  return read<Record<string, SavedGame>>('mc.games', {})
}
export function saveGameFor(key: string, g: SavedGame | null) {
  const games = loadGames()
  if (g) games[key] = g
  else delete games[key]
  const keep = Object.entries(games)
    .sort((a, b) => b[1].updated - a[1].updated)
    .slice(0, 8)
  write('mc.games', Object.fromEntries(keep))
}
export function latestGame(isSolved: (key: string) => boolean): [string, SavedGame] | null {
  const entries = Object.entries(loadGames())
    .filter(([key]) => !isSolved(key))
    .sort((a, b) => b[1].updated - a[1].updated)
  return entries[0] ?? null
}

export function todayString(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatTime(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
