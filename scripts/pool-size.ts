// Estimates how many distinct questions each subject can produce (a lower bound from sampling),
// and how long that lasts at a few questions a day.
import { SUBJECTS, dailyPick, makeQuestion, practicePick } from '../src/quiz'
import type { Level } from '../src/quiz/types'

const N = Number(process.argv[2] ?? 30000)
console.log(`Sampling ${N.toLocaleString()} random questions per subject…`)
let total = 0
for (const subject of SUBJECTS) {
  const seen = new Set<string>()
  const growth: number[] = []
  for (let i = 0; i < N; i++) {
    const level = ((i % 3) + 1) as Level
    seen.add(makeQuestion(practicePick(subject, level)).prompt)
    if ((i + 1) % (N / 3) === 0) growth.push(seen.size)
  }
  // daily: distinct over 5 years
  const daily = new Set<string>()
  const start = Date.UTC(2026, 10, 22)
  for (let d = 0; d < 1826; d++) daily.add(makeQuestion(dailyPick(new Date(start + d * 86400000).toISOString().slice(0, 10), subject)).prompt)
  total += seen.size
  console.log(`${subject.padEnd(8)} distinct ≥ ${String(seen.size).padStart(6)}  (growth ${growth.join(' → ')})   daily over 5 years: ${daily.size}/1826 distinct`)
}
console.log(`\nAcross all subjects: at least ${total.toLocaleString()} distinct questions (still growing for most).`)
