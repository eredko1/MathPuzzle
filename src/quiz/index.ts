import { BANKS } from './bank'
import { GENS } from './gen'
import { SUBJECTS, type Level, type Question, type Subject } from './types'
import { build, hashString, pick, rngFor, shuffle } from './util'

export * from './types'

/** Days since 1970-01-01 for a YYYY-MM-DD string (timezone-free). */
export function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000)
}

/** Which difficulty a subject gets on a given day (stable for everybody). */
export function dailyLevel(date: string, subject: Subject): Level {
  const x = rngFor(`dlevel:${date}:${subject}`)()
  return x < 0.34 ? 1 : x < 0.76 ? 2 : 3
}

export interface Pick {
  subject: Subject
  level: Level
  /** Any string; the same seed always yields the same question. */
  seed: string
  /** Position in the (shuffled) hand-written bank so consecutive days never repeat. */
  cursor: number
  /** Optional topic filter, for weak-spot practice. */
  topic?: string
}

export const encodePick = (p: Pick) => [p.subject, p.level, p.cursor, p.topic ?? '', p.seed].join('|')
export function decodePick(id: string): Pick {
  const [subject, level, cursor, topic, ...seed] = id.split('|')
  return { subject: subject as Subject, level: Number(level) as Level, cursor: Number(cursor), topic: topic || undefined, seed: seed.join('|') }
}

function pool(subject: Subject, level: Level, topic?: string) {
  const gens = GENS[subject].filter(g => g.level === level && (!topic || g.topic === topic))
  const bank = BANKS[subject].filter(b => b.l === level && (!topic || b.t === topic))
  return { gens, bank }
}

/** Build the question for a pick. Deterministic. Falls back to nearby levels if a pool is empty. */
export function makeQuestion(p: Pick): Question {
  let { gens, bank } = pool(p.subject, p.level, p.topic)
  let level = p.level
  for (const alt of [2, 1, 3, 2] as Level[]) {
    if (gens.length || bank.length) break
    level = alt
    ;({ gens, bank } = pool(p.subject, alt, p.topic))
  }
  if (!gens.length && !bank.length) ({ gens, bank } = pool(p.subject, p.level))
  const rng = rngFor(`q:${p.seed}:${p.subject}:${p.level}`)
  const useBank = bank.length > 0 && (gens.length === 0 || rng() < bankShare(bank.length, gens.length))
  let q: Question
  if (useBank) {
    const order = shuffle(rngFor(`bank:${p.subject}:${level}:${p.topic ?? ''}`), bank)
    const b = order[((p.cursor % order.length) + order.length) % order.length]
    const choices = shuffle(rng, [b.a, ...b.w])
    q = { id: '', subject: p.subject, topic: b.t, level, prompt: b.q, choices, answer: choices.indexOf(b.a), hint: b.h, explanation: b.e }
  } else {
    const gen = pick(rng, gens)
    q = build(rng, p.subject, level, gen.make(rng))
  }
  q.id = encodePick(p)
  q.level = p.level
  return q
}

/** Fewer generator templates → lean on the hand-written bank, and vice versa. */
function bankShare(bank: number, gens: number) {
  return Math.min(0.75, Math.max(0.25, bank / (bank + gens * 40)))
}

function basePick(date: string, subject: Subject, attempt: number): Pick {
  return {
    subject,
    level: dailyLevel(date, subject),
    seed: `daily:${date}:${subject}${attempt ? ':' + attempt : ''}`,
    cursor: dayNumber(date) + attempt * 7919,
  }
}

const EPOCH = dayNumber('2026-01-01')
const dateOf = (day: number) => new Date(day * 86400000).toISOString().slice(0, 10)
const history = new Map<Subject, { seen: Set<string>; picks: Pick[] }>()

/**
 * The day's pick for a subject. Walks forward from a fixed epoch so no prompt repeats on a later day
 * until a pool is truly exhausted. Deterministic: every device computes the same history.
 */
export function dailyPick(date: string, subject: Subject): Pick {
  const d = dayNumber(date) - EPOCH
  if (d < 0 || d > 4000) return basePick(date, subject, 0)
  let h = history.get(subject)
  if (!h) history.set(subject, (h = { seen: new Set(), picks: [] }))
  while (h.picks.length <= d) {
    const day = dateOf(EPOCH + h.picks.length)
    let pick = basePick(day, subject, 0)
    for (let attempt = 0; attempt < 80; attempt++) {
      pick = basePick(day, subject, attempt)
      if (!h.seen.has(makeQuestion(pick).prompt)) break
    }
    h.seen.add(makeQuestion(pick).prompt)
    h.picks.push(pick)
  }
  return h.picks[d]
}

export function practicePick(subject: Subject, level: Level, topic?: string): Pick {
  const seed = `p:${Date.now()}:${Math.floor(Math.random() * 1e9)}`
  return { subject, level, seed, cursor: hashString(seed), topic }
}

/** A practice pick whose question this device hasn't seen yet (falls back to any once a pool is exhausted). */
export function freshPractice(subject: Subject, level: Level, topic: string | undefined, isSeen: (prompt: string) => boolean): Pick {
  let pick = practicePick(subject, level, topic)
  for (let i = 0; i < 40; i++) {
    if (!isSeen(makeQuestion(pick).prompt)) return pick
    pick = practicePick(subject, level, topic)
  }
  return pick
}

/** All topics for a subject, for the weak-spot view. */
export function topicsFor(subject: Subject): string[] {
  const s = new Set<string>()
  GENS[subject].forEach(g => s.add(g.topic))
  BANKS[subject].forEach(b => s.add(b.t))
  return [...s].sort()
}

export { SUBJECTS }
