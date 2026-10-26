// Stress-tests the puzzle generator: validity, solvability, speed and variety.
import { generatePuzzle, evaluate, solveByDeduction, levelKey, dailyKey, CONFIGS, type Difficulty } from '../src/engine/puzzle.ts'

const diffs: Difficulty[] = ['easy', 'medium', 'hard']
const count = Number(process.argv[2] ?? 200)
let failures = 0
const fail = (key: string, msg: string) => { failures++; if (failures < 30) console.error(`FAIL ${key}: ${msg}`) }

for (const d of diffs) {
  const stats = { eqs: [] as number[], blanks: [] as number[], nums: [] as number[], ms: [] as number[], dims: [] as string[] }
  const keys: string[] = []
  for (let n = 1; n <= count; n++) keys.push(levelKey(d, n))
  for (let i = 0; i < 30; i++) keys.push(dailyKey(d, new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10)))
  const shapes = new Set<string>()
  for (const key of keys) {
    const t0 = performance.now()
    const p = generatePuzzle(key, d)
    const ms = performance.now() - t0
    stats.ms.push(ms)
    if (ms > 50) fail(key, `slow ${ms.toFixed(1)}ms`)
    const p2 = generatePuzzle(key, d)
    if (JSON.stringify(p) !== JSON.stringify(p2)) fail(key, 'not deterministic')
    for (const e of p.equations) {
      const [a, , b, , c] = e.cells.map(i => p.cells[i])
      if (e.cells.length !== 5) fail(key, 'eq length')
      if (![a, b, c].every(x => x.kind === 'num' && Number.isInteger(x.value) && x.value >= 1)) fail(key, 'bad number')
      if (p.cells[e.cells[1]].kind !== 'op' || p.cells[e.cells[3]].kind !== 'eq') fail(key, 'bad symbols')
      if (!evaluate(a.value, e.op, b.value, c.value)) fail(key, `eq false ${a.value}${e.op}${b.value}=${c.value}`)
      if (c.value > CONFIGS[d].maxVal) fail(key, 'value too large')
    }
    const occ = new Set<string>()
    for (const c of p.cells) {
      const k = `${c.r},${c.c}`
      if (occ.has(k)) fail(key, 'duplicate cell'); occ.add(k)
      if (c.r < 0 || c.c < 0 || c.r >= p.rows || c.c >= p.cols) fail(key, 'cell out of bounds')
    }
    if (p.bank.length !== p.slots.length) fail(key, 'bank size mismatch')
    if (new Set(p.bank.map(t => t.id)).size !== p.bank.length) fail(key, 'dup tile id')
    const bankVals = p.bank.map(t => t.value).sort((a, b) => a - b).join()
    const slotVals = p.slots.map(i => p.cells[i].value).sort((a, b) => a - b).join()
    if (bankVals !== slotVals) fail(key, 'bank values mismatch')
    const solved = solveByDeduction(p.equations, p.cells.map(c => c.value), new Set(p.slots), CONFIGS[d].pairDeductions)
    if (!solved.solved) fail(key, 'not solvable by deduction')
    if (p.solveOrder.length !== p.slots.length) fail(key, 'solveOrder incomplete')
    if (p.cols > CONFIGS[d].size || p.rows > CONFIGS[d].size) fail(key, 'too big')
    shapes.add(p.cells.map(c => `${c.r},${c.c}`).join(';'))
    stats.eqs.push(p.equations.length)
    stats.blanks.push(p.slots.length)
    stats.nums.push(p.cells.filter(c => c.kind === 'num').length)
    stats.dims.push(`${p.rows}x${p.cols}`)
  }
  const avg = (a: number[]) => (a.reduce((s, x) => s + x, 0) / a.length).toFixed(1)
  const range = (a: number[]) => `${Math.min(...a)}-${Math.max(...a)} (avg ${avg(a)})`
  console.log(`${d}: ${keys.length} puzzles, eqs ${range(stats.eqs)}, blanks ${range(stats.blanks)} of nums ${range(stats.nums)}, gen ms max ${Math.max(...stats.ms).toFixed(1)} avg ${avg(stats.ms)}, unique shapes ${shapes.size}`)
}
console.log(failures ? `${failures} FAILURES` : 'ALL PASSED')
process.exit(failures ? 1 : 0)
