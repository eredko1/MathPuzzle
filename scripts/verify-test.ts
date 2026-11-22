// Verifies SAT test mode: content validity, balanced test construction, and scoring sanity.
import { SAT_MATH_DOMAIN, satMath } from '../src/quiz/sat/math'
import { SAT_RW_BANK, SAT_RW_DOMAIN, satTransitions } from '../src/quiz/sat/rw'
import { SAT_SIZES, buildSatTest, pCorrect, scoreSat, tierPlan } from '../src/quiz/test'
import { build, rngFor } from '../src/quiz/util'
import type { Gen, Level, Question } from '../src/quiz/types'
import { fail, state, validate } from './validate'

const N = Number(process.argv[2] ?? 150)
const failMsg = (msg: string) => fail(null, msg)

// 1. every SAT generator, many samples
const gens: [string, Gen[]][] = [['math', satMath], ['rw', satTransitions]]
for (const [sec, list] of gens)
  for (const g of list) {
    const rng = rngFor(`vt:${g.topic}:${g.level}`)
    for (let i = 0; i < N; i++) {
      try {
        validate(build(rng, sec === 'math' ? 'math' : 'english', g.level, g.make(rng)))
      } catch (e) {
        failMsg(`${sec}/${g.topic} L${g.level}: ${(e as Error).message.slice(0, 150)}`)
        break
      }
    }
  }
// 2. every Reading & Writing bank item: exactly 4 distinct options, renders
for (const b of SAT_RW_BANK) {
  const q: Question = { id: '', subject: 'english', topic: b.t, level: b.l, prompt: b.q, choices: [b.a, ...b.w], answer: 0, hint: b.h, explanation: b.e }
  validate(q)
}
// 3. coverage per section and tier
const tiers = [1, 2, 3] as Level[]
console.log('SAT pool sizes (generators + bank items):')
for (const t of tiers)
  console.log(`  tier ${t}: math gens ${satMath.filter(g => g.level === t).length} (${new Set(satMath.filter(g => g.level === t).map(g => g.topic)).size} topics) | R&W gens ${satTransitions.filter(g => g.level === t).length} + bank ${SAT_RW_BANK.filter(b => b.l === t).length}`)
const missingDomain = [...new Set([...satMath.map(g => g.topic)])].filter(t => !SAT_MATH_DOMAIN[t])
if (missingDomain.length) failMsg(`math topics without a domain: ${missingDomain}`)
const rwTopics = new Set(SAT_RW_BANK.map(b => b.t))
const noDom = [...rwTopics].filter(t => !SAT_RW_DOMAIN[t])
if (noDom.length) failMsg(`R&W topics without a domain: ${noDom}`)

// 4. test construction
for (const n of SAT_SIZES) {
  for (let i = 0; i < 60; i++) {
    const items = buildSatTest(n, `vt-${n}-${i}`)
    if (items.length !== n) failMsg(`test of ${n} has ${items.length} items`)
    items.forEach(it => validate(it.q))
    const rw = items.filter(x => x.section === 'rw').length
    if (rw !== Math.ceil(n / 2)) failMsg(`bad section split ${rw}/${n}`)
    if (new Set(items.map(x => x.q.prompt)).size !== n) failMsg(`duplicate prompt in a ${n}-question test`)
    const plan = [...tierPlan(rw), ...tierPlan(n - rw)].sort().join('')
    if (items.map(x => x.tier).sort().join('') !== plan) failMsg('tier mix does not match the plan')
  }
}

// 5. scoring sanity: monotonic, bounded, calibrated near the SAT average
for (const n of SAT_SIZES) {
  const items = buildSatTest(n, `score-${n}`)
  let prev = -1
  for (let right = 0; right <= n; right++) {
    // answer the first `right` questions correctly
    const ans = items.map((it, i) => (i < right ? it.q.answer : (it.q.answer + 1) % 4))
    const total = scoreSat(items, ans).total
    if (total < 400 || total > 1600 || total % 10 !== 0) failMsg(`score out of range: ${total}`)
    if (total < prev - 40) failMsg(`score fell sharply as correct answers rose (${prev} -> ${total})`) // order-dependent, allow small dips
    prev = total
  }
  // an average student (theta = 0) should land near the SAT mean (~1030)
  let sum = 0
  const T = 300
  for (let t = 0; t < T; t++) {
    const its = buildSatTest(n, `avg-${n}-${t}`)
    sum += scoreSat(its, its.map(it => (Math.random() < pCorrect(0, it.tier) ? it.q.answer : (it.q.answer + 1) % 4))).total
  }
  const avg = sum / T
  if (n >= 10 && Math.abs(avg - 1030) > 70) failMsg(`average student scores ${Math.round(avg)} on ${n} questions (expected ~1030)`)
  const all = scoreSat(items, items.map(i => i.q.answer))
  const none = scoreSat(items, items.map(() => null))
  console.log(`  n=${String(n).padStart(2)}: all correct ${all.total} (p${all.percentile}), none ${none.total} (p${none.percentile}), average student ≈ ${Math.round(avg)}`)
}
console.log(state.bad ? `\n${state.bad} problems found` : '\nAll SAT test checks passed')
process.exit(state.bad ? 1 : 0)
