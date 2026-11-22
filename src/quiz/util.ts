import { hashString, mulberry32 } from '../engine/puzzle'
import type { Level, Question, Rng, Spec, Subject } from './types'

export type { Rng, Spec }
export { hashString, mulberry32 }

export const rngFor = (seed: string): Rng => mulberry32(hashString(seed))
export const randInt = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1))
export const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]
export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
/** Random non-zero integer in [-hi, -lo] ∪ [lo, hi]. */
export function nz(rng: Rng, lo: number, hi: number) {
  const v = randInt(rng, lo, hi)
  return rng() < 0.5 ? -v : v
}

export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
export const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b)
export const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1))
export const choose = (n: number, k: number) => {
  let r = 1
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i
  return Math.round(r)
}

// ---------- number formatting ----------

/** Round to sig figures, strip trailing zeros, no exponent for ordinary sizes. */
export function num(x: number, sig = 3): string {
  if (!isFinite(x)) return String(x)
  if (x === 0) return '0'
  const ax = Math.abs(x)
  if (ax >= 1e5 || ax < 1e-3) return sci(x, sig)
  const s = Number(x.toPrecision(sig))
  return String(s).replace('-', '−')
}
/** LaTeX scientific notation, e.g. 3.2\times10^{-5}. */
export function sci(x: number, sig = 3): string {
  if (x === 0) return '0'
  const e = Math.floor(Math.log10(Math.abs(x)))
  const m = Number((x / 10 ** e).toPrecision(sig))
  const mm = Math.abs(m) >= 10 ? Number((m / 10).toPrecision(sig)) : m
  const ee = Math.abs(m) >= 10 ? e + 1 : e
  const ms = String(mm).replace('-', '−')
  return ee === 0 ? ms : `${ms}\\times10^{${ee}}`
}
/** Wrap in math delimiters. */
export const M = (s: string) => `$${s}$`
export const fmt = (x: number) => String(x).replace('-', '−')

// ---------- fractions ----------

export interface Frac {
  n: number
  d: number
}
export function F(n: number, d = 1): Frac {
  if (d < 0) {
    n = -n
    d = -d
  }
  const g = gcd(n, d) || 1
  return { n: n / g, d: d / g }
}
export const fAdd = (a: Frac, b: Frac) => F(a.n * b.d + b.n * a.d, a.d * b.d)
export const fSub = (a: Frac, b: Frac) => F(a.n * b.d - b.n * a.d, a.d * b.d)
export const fMul = (a: Frac, b: Frac) => F(a.n * b.n, a.d * b.d)
export const fDiv = (a: Frac, b: Frac) => F(a.n * b.d, a.d * b.n)
export const fVal = (a: Frac) => a.n / a.d
/** LaTeX for a fraction (no delimiters). */
export function fTex(a: Frac): string {
  if (a.d === 1) return fmtI(a.n)
  const s = a.n < 0 ? '-' : ''
  return `${s}\\frac{${Math.abs(a.n)}}{${a.d}}`
}
const fmtI = (n: number) => String(n)

/** "3x^2 - 5x + 2" style polynomial, coefficients indexed by power (ascending). */
export function polyTex(coefs: number[], v = 'x'): string {
  let out = ''
  for (let p = coefs.length - 1; p >= 0; p--) {
    const c = coefs[p]
    if (c === 0) continue
    const sign = c < 0 ? '-' : '+'
    const a = Math.abs(c)
    const body =
      p === 0 ? String(a) : `${a === 1 ? '' : a}${v}${p === 1 ? '' : p > 9 ? `^{${p}}` : `^${p}`}`
    out += out === '' ? (c < 0 ? '-' : '') + body : ` ${sign} ${body}`
  }
  return out || '0'
}
export const polyEval = (coefs: number[], x: number) => coefs.reduce((s, c, p) => s + c * x ** p, 0)
export const polyDeriv = (coefs: number[]) => coefs.slice(1).map((c, i) => c * (i + 1))
export const polyInt = (coefs: number[]) => [0, ...coefs.map((c, i) => c / (i + 1))]

// ---------- numeric cross-check helpers (dev verification) ----------

export const numDeriv = (f: (x: number) => number, x: number, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h)
export function numInt(f: (x: number) => number, a: number, b: number, n = 2000) {
  const h = (b - a) / n
  let s = f(a) + f(b)
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2)
  return (s * h) / 3
}

// ---------- question builder ----------

/** Build a Question from a spec, shuffling choices deterministically. */
export function build(rng: Rng, subject: Subject, level: Level, s: Spec): Question {
  const seen = new Set([s.correct])
  const wrong: string[] = []
  for (const w of s.wrong) {
    if (!seen.has(w)) {
      seen.add(w)
      wrong.push(w)
    }
    if (wrong.length === 3) break
  }
  if (wrong.length < 3) for (const w of mutate(rng, s.correct)) {
    if (!seen.has(w)) {
      seen.add(w)
      wrong.push(w)
    }
    if (wrong.length === 3) break
  }
  if (wrong.length < 3) throw new Error(`not enough distinct distractors for ${s.topic}: ${s.prompt}`)
  const order = shuffle(rng, [s.correct, ...wrong])
  return {
    id: '',
    subject,
    topic: s.topic,
    level,
    prompt: s.prompt,
    choices: order,
    answer: order.indexOf(s.correct),
    hint: s.hint,
    explanation: s.explanation,
    check: s.check,
  }
}

/**
 * Distractor numbers near a correct value: common slips first (given), then
 * scaled/offset variants. Returns formatted strings via `f`.
 */
export function nearby(rng: Rng, correct: number, slips: number[], f: (x: number) => string, step = 1): string[] {
  const out: string[] = []
  const add = (x: number) => {
    if (isFinite(x)) out.push(f(x))
  }
  slips.forEach(add)
  const cands = [correct + step, correct - step, correct * 2, correct / 2, -correct, correct + 2 * step, correct - 2 * step, correct * 3]
  shuffle(rng, cands).forEach(add)
  return out.filter(s => s !== f(correct))
}

/** Plausible look-alike answers made by nudging each integer in the correct answer. */
function mutate(rng: Rng, correct: string): string[] {
  const re = /\d+/g
  const spots: { i: number; len: number; v: number }[] = []
  for (let m = re.exec(correct); m; m = re.exec(correct)) {
    // skip digits glued to a letter-exponent like x^{3} only when part of LaTeX commands (none have digits)
    if (/(\^\{?-?|_\{?)$/.test(correct.slice(0, m.index))) continue // leave exponents/subscripts alone
    spots.push({ i: m.index, len: m[0].length, v: Number(m[0]) })
  }
  if (!spots.length) return []
  const out: string[] = []
  const deltas = (v: number) => [v + 1, Math.max(0, v - 1), v * 2, v + 2, v * 3, Math.max(0, v - 2), v + 5, v === 0 ? 7 : v * 5]
  for (const sp of shuffle(rng, spots)) {
    for (const nv of shuffle(rng, deltas(sp.v))) {
      if (nv !== sp.v) out.push(correct.slice(0, sp.i) + nv + correct.slice(sp.i + sp.len))
    }
  }
  if (correct.startsWith('$-')) out.push('$' + correct.slice(2))
  else if (correct.startsWith('$') && /\d/.test(correct)) out.push('$-' + correct.slice(1))
  return out.filter(w => !/^\$?-0(?![.\d])/.test(w))
}
