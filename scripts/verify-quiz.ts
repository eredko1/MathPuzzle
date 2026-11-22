// Stress-tests the quiz engine: structural validity, LaTeX renders, numeric cross-checks,
// and how many distinct questions a player would see across two years of daily play.
import katex from 'katex'
import { SUBJECTS, dailyPick, makeQuestion, practicePick, topicsFor } from '../src/quiz'
import { GENS } from '../src/quiz/gen'
import { BANKS } from '../src/quiz/bank'
import { tokenize } from '../src/quiz/rich'
import { rngFor } from '../src/quiz/util'
import type { Level, Question } from '../src/quiz/types'

const N = Number(process.argv[2] ?? 300)
let bad = 0
const fail = (q: Question | null, msg: string) => {
  bad++
  if (bad <= 40) console.log(`FAIL [${q?.subject}/${q?.topic}/L${q?.level}] ${msg}\n   ${q?.prompt.slice(0, 160)}`)
}

function validate(q: Question) {
  if (q.choices.length !== 4) fail(q, 'need 4 choices')
  if (new Set(q.choices).size !== 4) fail(q, `duplicate choices: ${q.choices.join(' | ')}`)
  if (q.answer < 0 || q.answer > 3) fail(q, 'answer index out of range')
  const text = [q.prompt, q.hint, q.explanation, ...q.choices].join('\n')
  if (/NaN|undefined|Infinity|\[object|-0\b(?!\.)|\+ -|- -/.test(text)) fail(q, `suspicious text: ${text.match(/NaN|undefined|Infinity|\[object|-0\b|\+ -|- -/)![0]}`)
  if (!q.hint || !q.explanation) fail(q, 'missing hint/explanation')
  for (const s of [q.prompt, q.explanation, q.hint, ...q.choices]) {
    for (const t of tokenize(s)) {
      if (t.k === 'math') {
        try {
          let warned = ''
          const w = console.warn
          console.warn = (m: string) => (warned = String(m))
          try {
            katex.renderToString(t.s, { throwOnError: true, strict: 'ignore' })
          } finally {
            console.warn = w
          }
          if (warned) fail(q, `KaTeX warning: ${warned.slice(0, 100)} in «${t.s}»`)
        } catch (e) {
          fail(q, `KaTeX: ${(e as Error).message.slice(0, 120)} in «${t.s}»`)
        }
      }
    }
  }
  if (q.check) {
    const [a, b] = q.check
    if (!(Math.abs(a - b) <= 1e-3 * Math.max(1, Math.abs(a)))) fail(q, `numeric mismatch: closed=${a} numeric=${b}`)
  }
}

console.log(`Sampling ${N} questions per subject per level…`)
for (const subject of SUBJECTS) {
  if (!GENS[subject].length && !BANKS[subject].length) {
    console.log(`${subject.padEnd(8)} (no content yet)`)
    continue
  }
  const t0 = performance.now()
  for (const level of [1, 2, 3] as Level[]) {
    for (let i = 0; i < N; i++) {
      try {
        const q = makeQuestion({ ...practicePick(subject, level), seed: `v${i}`, cursor: i })
        validate(q)
        // determinism
        const again = makeQuestion({ subject, level, seed: `v${i}`, cursor: i })
        if (JSON.stringify(q) !== JSON.stringify(again)) fail(q, 'not deterministic')
      } catch (e) {
        fail(null, `${subject} L${level} threw: ${(e as Error).message}`)
      }
    }
  }
  const dt = performance.now() - t0
  // two years of daily play
  const start = Date.UTC(2026, 10, 22)
  const seen = new Set<string>()
  const perLevel = [0, 0, 0, 0]
  const days = 730
  for (let d = 0; d < days; d++) {
    const date = new Date(start + d * 86400000).toISOString().slice(0, 10)
    try {
      const q = makeQuestion(dailyPick(date, subject))
      seen.add(q.prompt)
      perLevel[q.level]++
    } catch (e) {
      fail(null, `${subject} daily ${date} threw: ${(e as Error).message.slice(0, 140)}`)
    }
  }
  console.log(
    `${subject.padEnd(8)} gens=${String(GENS[subject].length).padStart(3)} bank=${String(BANKS[subject].length).padStart(4)} topics=${String(topicsFor(subject).length).padStart(3)} ` +
      `distinct in 730 days=${seen.size} (E/M/H ${perLevel[1]}/${perLevel[2]}/${perLevel[3]})  ${Math.round(dt)}ms`,
  )
}
// every generator should be individually exercised
for (const subject of SUBJECTS) {
  for (const g of GENS[subject]) {
    const rng = rngFor(`gen:${g.topic}:${g.level}`)
    for (let i = 0; i < 60; i++) {
      try {
        const s = g.make(rng)
        const q: Question = { id: '', subject, topic: s.topic, level: g.level, prompt: s.prompt, choices: [], answer: 0, hint: s.hint, explanation: s.explanation, check: s.check }
        const built = (() => {
          // reuse validation through build()
          return makeBuilt(subject, g.level, s, rng)
        })()
        validate(built ?? q)
      } catch (e) {
        fail(null, `${subject}/${g.topic} L${g.level} threw: ${(e as Error).message}`)
        break
      }
    }
  }
}
import { build } from '../src/quiz/util'
import type { Spec, Rng } from '../src/quiz/types'
function makeBuilt(subject: Question['subject'], level: Level, s: Spec, rng: Rng) {
  return build(rng, subject, level, s)
}
console.log(bad ? `\n${bad} problems found` : '\nAll checks passed')
process.exit(bad ? 1 : 0)
