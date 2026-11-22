// Timed/untimed "test mode": builds a balanced set of questions and scores it.
// The SAT is the first test kind; the same shapes are meant to host others (e.g. an IQ-style test).
import { SAT_MATH_DOMAIN, satMath } from './sat/math'
import { SAT_RW_BANK, SAT_RW_DOMAIN, satTransitions } from './sat/rw'
import { english2 } from './gen/english2'
import type { BankItem, Gen, Level, Question } from './types'
import { build, rngFor, shuffle, type Rng } from './util'

export type SatSection = 'rw' | 'math'
export const SAT_SECTION_NAME: Record<SatSection, string> = { rw: 'Reading & Writing', math: 'Math' }
export const SAT_SIZES = [5, 10, 15, 20] as const

export interface TestItem {
  q: Question
  section: SatSection
  tier: Level
  domain: string
}

/** Seconds the real Digital SAT allows per question (RW ≈ 71 s, Math ≈ 95 s). */
export const SECONDS_PER_ITEM: Record<SatSection, number> = { rw: 71, math: 95 }
export const timeLimitFor = (items: TestItem[]) => items.reduce((s, it) => s + SECONDS_PER_ITEM[it.section], 0)

// ---------------------------------------------------------------- building

const MATH_GENS: Gen[] = satMath
const RW_GENS: Gen[] = [...satTransitions, ...english2.filter(g => g.topic === 'Subject–verb agreement' || g.topic === 'Irregular verbs')]
const RW_BANK: BankItem[] = SAT_RW_BANK

/** How many easy / medium / hard questions a section of k questions gets. */
export function tierPlan(k: number): Level[] {
  if (k <= 0) return []
  const easy = k >= 2 ? Math.max(1, Math.round(k * 0.3)) : 1
  const hard = k >= 3 ? Math.max(1, Math.round(k * 0.25)) : 0
  const med = k - easy - hard
  return [...Array(easy).fill(1), ...Array(med).fill(2), ...Array(hard).fill(3)] as Level[]
}

type Cand = { gen?: Gen; item?: BankItem; topic: string }

function candidates(section: SatSection, tier: Level): Cand[] {
  const gens = (section === 'math' ? MATH_GENS : RW_GENS).filter(g => g.level === tier).map<Cand>(gen => ({ gen, topic: gen.topic }))
  const bank = section === 'math' ? [] : RW_BANK.filter(b => b.l === tier).map<Cand>(item => ({ item, topic: item.t }))
  return [...gens, ...bank]
}

function pickSection(section: SatSection, k: number, rng: Rng, used: Set<string>, avoid?: (prompt: string) => boolean): TestItem[] {
  const out: TestItem[] = []
  for (const tier of tierPlan(k)) {
    const pool = shuffle(rng, candidates(section, tier))
    const fresh = (c: Cand) => !(c.item && (used.has(`p:${c.item.q}`) || avoid?.(c.item.q)))
    const unused = (c: Cand) => !(c.item && used.has(`p:${c.item.q}`))
    let chosen = pool.find(c => !used.has(`t:${c.topic}`) && fresh(c))
    chosen ??= pool.find(fresh) ?? pool.find(unused) ?? pool[0]
    used.add(`t:${chosen.topic}`)
    let q: Question
    if (chosen.item) {
      const b = chosen.item
      used.add(`p:${b.q}`)
      const choices = shuffle(rng, [b.a, ...b.w])
      q = { id: '', subject: 'english', topic: b.t, level: tier, prompt: b.q, choices, answer: choices.indexOf(b.a), hint: b.h, explanation: b.e }
    } else {
      // regenerate until this exact prompt hasn't appeared in the test yet
      let spec = chosen.gen!.make(rng)
      for (let i = 0; i < 12 && (used.has(`p:${spec.prompt}`) || avoid?.(spec.prompt)); i++) spec = chosen.gen!.make(rng)
      used.add(`p:${spec.prompt}`)
      q = build(rng, section === 'math' ? 'math' : 'english', tier, spec)
    }
    const domains = section === 'math' ? SAT_MATH_DOMAIN : SAT_RW_DOMAIN
    out.push({ q, section, tier, domain: domains[q.topic] ?? 'Other' })
  }
  return out
}

/** Build an n-question SAT-style test: Reading & Writing first, then Math, easy → hard within each. */
export function buildSatTest(n: number, seed = `sat:${Date.now()}:${Math.floor(Math.random() * 1e9)}`, avoid?: (prompt: string) => boolean): TestItem[] {
  const rng = rngFor(seed)
  const used = new Set<string>()
  const rwN = Math.ceil(n / 2)
  const items = [...pickSection('rw', rwN, rng, used, avoid), ...pickSection('math', n - rwN, rng, used, avoid)]
  items.forEach((it, i) => (it.q.id = `${seed}|${i}`))
  return items
}

// ---------------------------------------------------------------- scoring

/** Item difficulty (logits; 0 = the average SAT test-taker) for each tier. */
export const TIER_DIFFICULTY: Record<Level, number> = { 1: -1.1, 2: 0.1, 3: 1.4 }
const GUESS = 0.2 // floor for a 4-choice question once obvious wrong answers are discounted
const SLOPE = 1.7
const PRIOR_SD = 1.8 // a wide prior: a few questions shouldn't pin an extreme score, but shouldn't cap it either
const SECTION_MEAN = 515
const SECTION_SD = 110
const TOTAL_MEAN = 1030
const TOTAL_SD = 210

export const pCorrect = (theta: number, tier: Level) => GUESS + (1 - GUESS) / (1 + Math.exp(-SLOPE * (theta - TIER_DIFFICULTY[tier])))

/** Posterior mean and SD of ability (in population SD units) given right/wrong responses. */
export function estimateAbility(resp: { tier: Level; correct: boolean }[]): { theta: number; sd: number } {
  let z = 0, m1 = 0, m2 = 0
  for (let t = -4; t <= 4.0001; t += 0.05) {
    let w = Math.exp(-(t * t) / (2 * PRIOR_SD * PRIOR_SD))
    for (const r of resp) {
      const p = pCorrect(t, r.tier)
      w *= r.correct ? p : 1 - p
    }
    z += w
    m1 += w * t
    m2 += w * t * t
  }
  const theta = m1 / z
  return { theta, sd: Math.sqrt(Math.max(0, m2 / z - theta * theta)) }
}

/** Standard normal CDF (Abramowitz & Stegun 7.1.26). */
export function normCdf(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return z > 0 ? 1 - p : p
}
export const percentileOf = (score: number, mean: number, sd: number) => Math.min(99, Math.max(1, Math.round(normCdf((score - mean) / sd) * 100)))
const round10 = (x: number) => Math.round(x / 10) * 10
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

export interface SectionScore {
  section: SatSection
  n: number
  correct: number
  score: number
  low: number
  high: number
  percentile: number
}
export interface SatResult {
  n: number
  correct: number
  total: number
  low: number
  high: number
  percentile: number
  sections: SectionScore[]
  byTier: Record<Level, { c: number; n: number }>
  byDomain: Record<string, { c: number; n: number }>
  /** Plain-language caveats about how much this result can be trusted. */
  notes: string[]
}

export function scoreSat(items: TestItem[], answers: (number | null)[]): SatResult {
  const resp = items.map((it, i) => ({ it, correct: answers[i] === it.q.answer }))
  const sections: SectionScore[] = (['rw', 'math'] as SatSection[]).map(section => {
    const mine = resp.filter(r => r.it.section === section)
    const { theta, sd } = estimateAbility(mine.map(r => ({ tier: r.it.tier, correct: r.correct })))
    const score = clamp(round10(SECTION_MEAN + SECTION_SD * theta), 200, 800)
    return {
      section,
      n: mine.length,
      correct: mine.filter(r => r.correct).length,
      score,
      low: clamp(round10(SECTION_MEAN + SECTION_SD * (theta - sd)), 200, 800),
      high: clamp(round10(SECTION_MEAN + SECTION_SD * (theta + sd)), 200, 800),
      percentile: percentileOf(score, SECTION_MEAN, SECTION_SD),
    }
  })
  const total = sections[0].score + sections[1].score
  // the two sections' errors are roughly independent, so their variances add
  const spread = Math.sqrt(sections.reduce((s, x) => s + ((x.high - x.low) / 2) ** 2, 0))
  const byTier = { 1: { c: 0, n: 0 }, 2: { c: 0, n: 0 }, 3: { c: 0, n: 0 } } as SatResult['byTier']
  const byDomain: SatResult['byDomain'] = {}
  for (const r of resp) {
    byTier[r.it.tier].n++
    const d = (byDomain[r.it.domain] ??= { c: 0, n: 0 })
    d.n++
    if (r.correct) {
      byTier[r.it.tier].c++
      d.c++
    }
  }
  return {
    n: items.length,
    correct: resp.filter(r => r.correct).length,
    total,
    low: clamp(round10(total - spread), 400, 1600),
    high: clamp(round10(total + spread), 400, 1600),
    percentile: percentileOf(total, TOTAL_MEAN, TOTAL_SD),
    sections,
    byTier,
    byDomain,
    notes: notesFor(items.length, resp.filter(r => r.correct).length, spread),
  }
}

function notesFor(n: number, correct: number, spread: number): string[] {
  const notes = [
    `With only ${n} questions this is a rough estimate (likely within about ±${Math.round(spread / 10) * 10} points). The official SAT uses about 98 questions and an adaptive format, and College Board percentiles are published separately.`,
  ]
  if (correct / n <= 0.3) notes.push('Results this low can’t be told apart from guessing with so few questions, so treat the low end of the range as most likely.')
  if (correct === n) notes.push('A perfect score on a short test can’t prove a perfect SAT score; there simply aren’t enough questions to separate the very top.')
  return notes
}
