// Crossmath puzzle engine: layout growth, value filling, blank selection and
// a deduction-only solver that proves every puzzle can be finished without guessing.

export type Op = '+' | '-' | '×' | '÷'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Dir = 'h' | 'v'

export interface Cell {
  r: number
  c: number
  kind: 'num' | 'op' | 'eq'
  /** Solution value for number cells. */
  value: number
  /** Operator symbol for op cells. */
  op?: Op
  /** True if the number is shown on the board; false means it is a blank slot. */
  given: boolean
}

export interface Equation {
  dir: Dir
  /** Indices into Puzzle.cells for the 5 cells: A, op, B, =, C. */
  cells: number[]
  op: Op
}

export interface Tile {
  id: number
  value: number
}

export interface Puzzle {
  key: string
  difficulty: Difficulty
  rows: number
  cols: number
  cells: Cell[]
  equations: Equation[]
  /** Cell indices of blank slots, in reading order. */
  slots: number[]
  /** Tiles to place; order is the initial (shuffled) bank order. */
  bank: Tile[]
  /** Cell indices in an order a person could deduce them; used for hints. */
  solveOrder: number[]
}

interface Config {
  size: number
  eqMin: number
  eqMax: number
  maxVal: number
  ops: [Op, number][]
  blankRatio: number
  pairDeductions: boolean
}

export const CONFIGS: Record<Difficulty, Config> = {
  easy: {
    size: 9, eqMin: 7, eqMax: 8, maxVal: 30,
    ops: [['+', 5], ['-', 4], ['×', 1]],
    blankRatio: 0.6, pairDeductions: false,
  },
  medium: {
    size: 11, eqMin: 11, eqMax: 13, maxVal: 60,
    ops: [['+', 4], ['-', 4], ['×', 2], ['÷', 1]],
    blankRatio: 0.75, pairDeductions: true,
  },
  hard: {
    size: 11, eqMin: 14, eqMax: 17, maxVal: 99,
    ops: [['+', 3], ['-', 3], ['×', 2], ['÷', 2]],
    blankRatio: 0.85, pairDeductions: true,
  },
}

// ---------- randomness ----------

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Rng = () => number
const randInt = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1))
const pick = <T,>(rng: Rng, arr: T[]): T => arr[Math.floor(rng() * arr.length)]
function shuffle<T>(rng: Rng, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
function weightedOps(rng: Rng, ops: [Op, number][]): Op[] {
  // Weighted shuffle: draw without replacement, proportional to weight.
  const pool = ops.slice()
  const out: Op[] = []
  while (pool.length) {
    const total = pool.reduce((s, [, w]) => s + w, 0)
    let x = rng() * total
    let i = 0
    while (x >= pool[i][1]) x -= pool[i++][1]
    out.push(pool[i][0])
    pool.splice(i, 1)
  }
  return out
}

// ---------- arithmetic ----------

export function evaluate(a: number, op: Op, b: number, c: number): boolean {
  switch (op) {
    case '+': return a + b === c
    case '-': return a - b === c
    case '×': return a * b === c
    case '÷': return b !== 0 && a % b === 0 && a / b === c
  }
}

/** Given two of A, B, C (the other undefined), compute the missing one, or null if impossible. */
export function solveMissing(a: number | undefined, op: Op, b: number | undefined, c: number | undefined): number | null {
  let v: number
  if (a === undefined) {
    if (op === '+') v = c! - b!
    else if (op === '-') v = c! + b!
    else if (op === '×') { if (c! % b!) return null; v = c! / b! }
    else v = c! * b!
  } else if (b === undefined) {
    if (op === '+') v = c! - a
    else if (op === '-') v = a - c!
    else if (op === '×') { if (c! % a) return null; v = c! / a }
    else { if (a % c!) return null; v = a / c! }
  } else {
    if (op === '+') v = a + b
    else if (op === '-') v = a - b
    else if (op === '×') v = a * b
    else { if (a % b) return null; v = a / b }
  }
  return Number.isInteger(v) && v >= 1 ? v : null
}

/**
 * Fill A op B = C respecting already-fixed positions. Every equation is mapped to
 * x + y = z (for + and -) or x * y = z (for × and ÷) so only two solvers are needed.
 */
function fillValues(rng: Rng, op: Op, fixed: (number | undefined)[], max: number): number[] | null {
  const [a, b, c] = fixed
  // map (a,b,c) -> (x,y,z)
  const swap = op === '-' || op === '÷'
  const x = swap ? c : a
  const y = b
  const z = swap ? a : c
  const res = op === '+' || op === '-' ? fillSum(rng, x, y, z, max) : fillProd(rng, x, y, z, max)
  if (!res) return null
  const [X, Y, Z] = res
  return swap ? [Z, Y, X] : [X, Y, Z]
}

function fillSum(rng: Rng, x?: number, y?: number, z?: number, max = 99): number[] | null {
  const ok = (v: number) => v >= 1 && v <= max
  if (x !== undefined && y !== undefined && z !== undefined) return x + y === z ? [x, y, z] : null
  if (x !== undefined && y !== undefined) return ok(x + y) ? [x, y, x + y] : null
  if (x !== undefined && z !== undefined) return ok(z - x) ? [x, z - x, z] : null
  if (y !== undefined && z !== undefined) return ok(z - y) ? [z - y, y, z] : null
  if (z !== undefined) {
    if (z < 2) return null
    const xx = randInt(rng, 1, z - 1)
    return [xx, z - xx, z]
  }
  if (x !== undefined || y !== undefined) {
    const k = (x ?? y)!
    if (k >= max) return null
    const other = randInt(rng, 1, Math.min(max - k, Math.max(9, Math.floor(max * 0.6))))
    return x !== undefined ? [k, other, k + other] : [other, k, k + other]
  }
  const zz = randInt(rng, Math.min(6, max), max)
  const xx = randInt(rng, 1, zz - 1)
  return [xx, zz - xx, zz]
}

function fillProd(rng: Rng, x?: number, y?: number, z?: number, max = 99): number[] | null {
  // factors are kept >= 2 so there are no trivial "× 1" / "÷ 1" equations
  const okF = (v: number) => Number.isInteger(v) && v >= 2 && v <= max
  const okZ = (v: number) => v >= 4 && v <= max
  if (x !== undefined && y !== undefined && z !== undefined) return x * y === z && okF(x) && okF(y) ? [x, y, z] : null
  if (x !== undefined && y !== undefined) return okF(x) && okF(y) && okZ(x * y) ? [x, y, x * y] : null
  if (x !== undefined && z !== undefined) return okF(x) && okF(z / x) ? [x, z / x, z] : null
  if (y !== undefined && z !== undefined) return okF(y) && okF(z / y) ? [z / y, y, z] : null
  if (z !== undefined) {
    const divs: number[] = []
    for (let d = 2; d * 2 <= z; d++) if (z % d === 0) divs.push(d)
    if (!divs.length) return null
    const d = pick(rng, divs)
    return [d, z / d, z]
  }
  if (x !== undefined || y !== undefined) {
    const k = (x ?? y)!
    const hi = Math.min(12, Math.floor(max / k))
    if (k < 2 || hi < 2) return null
    const other = randInt(rng, 2, hi)
    return x !== undefined ? [k, other, k * other] : [other, k, k * other]
  }
  const xx = randInt(rng, 2, Math.min(12, Math.floor(max / 2)))
  const yy = randInt(rng, 2, Math.min(12, Math.floor(max / xx)))
  return [xx, yy, xx * yy]
}

// ---------- layout growth ----------

interface Draft {
  size: number
  // grid cell -> { kind, value/op }
  grid: Map<number, { kind: 'num' | 'op' | 'eq'; value: number; op?: Op }>
  eqs: { dir: Dir; r: number; c: number; op: Op }[]
}

const KIND_AT = ['num', 'op', 'num', 'eq', 'num'] as const

function eqCells(dir: Dir, r: number, c: number): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i < 5; i++) out.push(dir === 'h' ? [r, c + i] : [r + i, c])
  return out
}

/** Every maximal run of 2+ cells in a row/column must be exactly one equation. */
function layoutValid(d: Draft): boolean {
  const { size, grid } = d
  const spans = new Set(d.eqs.map(e => `${e.dir}${e.r},${e.c}`))
  for (const dir of ['h', 'v'] as Dir[]) {
    for (let line = 0; line < size; line++) {
      let start = -1
      for (let i = 0; i <= size; i++) {
        const [r, c] = dir === 'h' ? [line, i] : [i, line]
        const occ = i < size && grid.has(r * size + c)
        if (occ && start < 0) start = i
        if (!occ && start >= 0) {
          const len = i - start
          if (len >= 2) {
            if (len !== 5) return false
            const key = dir === 'h' ? `h${line},${start}` : `v${start},${line}`
            if (!spans.has(key)) return false
          }
          start = -1
        }
      }
    }
  }
  return true
}

function tryPlace(d: Draft, rng: Rng, cfg: Config, dir: Dir, r: number, c: number): boolean {
  const { size, grid } = d
  if (r < 0 || c < 0) return false
  if (dir === 'h' ? c + 4 >= size : r + 4 >= size) return false
  if (d.eqs.some(e => e.dir === dir && e.r === r && e.c === c)) return false
  const cells = eqCells(dir, r, c)
  const fixed: (number | undefined)[] = [undefined, undefined, undefined]
  let shared = 0
  for (let i = 0; i < 5; i++) {
    const [rr, cc] = cells[i]
    const ex = grid.get(rr * size + cc)
    if (!ex) continue
    if (KIND_AT[i] !== 'num' || ex.kind !== 'num') return false
    fixed[i / 2] = ex.value
    shared++
  }
  if (d.eqs.length && !shared) return false
  for (const op of weightedOps(rng, cfg.ops)) {
    const vals = fillValues(rng, op, fixed, cfg.maxVal)
    if (!vals || vals.some(v => v < 1 || v > cfg.maxVal)) continue
    // tentatively place
    const added: number[] = []
    for (let i = 0; i < 5; i++) {
      const k = cells[i][0] * size + cells[i][1]
      if (grid.has(k)) continue
      added.push(k)
      if (i % 2 === 0) grid.set(k, { kind: 'num', value: vals[i / 2] })
      else if (i === 1) grid.set(k, { kind: 'op', value: 0, op })
      else grid.set(k, { kind: 'eq', value: 0 })
    }
    d.eqs.push({ dir, r, c, op })
    if (layoutValid(d)) return true
    d.eqs.pop()
    for (const k of added) grid.delete(k)
    return false // layout invalid regardless of op
  }
  return false
}

function growLayout(rng: Rng, cfg: Config, target: number): Draft {
  const size = cfg.size
  const d: Draft = { size, grid: new Map(), eqs: [] }
  const dir0: Dir = rng() < 0.5 ? 'h' : 'v'
  // start somewhere near the top-left so the shape has room to spread
  const r0 = dir0 === 'h' ? randInt(rng, 0, 2) : randInt(rng, 0, size - 5)
  const c0 = dir0 === 'h' ? randInt(rng, 0, size - 5) : randInt(rng, 0, 2)
  while (!tryPlace(d, rng, cfg, dir0, r0, c0)) { /* first placement only fails on bad ops; retry */ }
  let tries = 0
  while (d.eqs.length < target && tries++ < 600) {
    const base = pick(rng, d.eqs)
    const p = pick(rng, [0, 2, 4])
    const [ar, ac] = eqCells(base.dir, base.r, base.c)[p]
    const dir: Dir = base.dir === 'h' ? 'v' : 'h'
    const q = pick(rng, [0, 2, 4])
    const r = dir === 'v' ? ar - q : ar
    const c = dir === 'h' ? ac - q : ac
    tryPlace(d, rng, cfg, dir, r, c)
  }
  return d
}

function layoutScore(d: Draft): number {
  let minR = 99, maxR = -1, minC = 99, maxC = -1
  for (const k of d.grid.keys()) {
    const r = Math.floor(k / d.size), c = k % d.size
    minR = Math.min(minR, r); maxR = Math.max(maxR, r)
    minC = Math.min(minC, c); maxC = Math.max(maxC, c)
  }
  const shared = d.eqs.length * 5 - d.grid.size // cells counted twice
  const loops = shared - (d.eqs.length - 1)
  const area = (maxR - minR + 1) * (maxC - minC + 1)
  const squareness = Math.min(maxR - minR + 1, maxC - minC + 1) / Math.max(maxR - minR + 1, maxC - minC + 1)
  // favour many equations, closed loops, and a roughly square board that fills the space
  return d.eqs.length * 10 + loops * 6 + squareness * 25 + (area / (d.size * d.size)) * 20 + (d.grid.size / area) * 10
}

// ---------- solver ----------

interface SolveResult {
  solved: boolean
  order: number[]
}

/**
 * Deduction-only solver. `known[i]` is the value of cell i, or 0 if it is a blank.
 * Uses (1) equations with a single blank and optionally (2) equations with two
 * blanks where exactly one assignment from the remaining tiles works.
 */
export function solveByDeduction(
  equations: Equation[],
  cellValue: number[],
  blanks: Set<number>,
  pairDeductions: boolean,
): SolveResult {
  const known = new Map<number, number>()
  const bank = new Map<number, number>()
  for (const i of blanks) bank.set(cellValue[i], (bank.get(cellValue[i]) ?? 0) + 1)
  const val = (i: number) => (blanks.has(i) ? known.get(i) : cellValue[i])
  const order: number[] = []
  const assign = (i: number, v: number) => {
    known.set(i, v)
    bank.set(v, bank.get(v)! - 1)
    order.push(i)
  }
  let remaining = blanks.size
  let progress = true
  while (remaining && progress) {
    progress = false
    // singles first: they're what a person naturally looks for
    for (const e of equations) {
      const nums = [e.cells[0], e.cells[2], e.cells[4]]
      const vs = nums.map(val)
      const unknown = vs.filter(v => v === undefined).length
      if (unknown !== 1) continue
      const v = solveMissing(vs[0], e.op, vs[1], vs[2])
      const idx = nums[vs.indexOf(undefined)]
      if (v === null || !bank.get(v)) return { solved: false, order }
      assign(idx, v)
      remaining--
      progress = true
    }
    if (progress || !pairDeductions) continue
    for (const e of equations) {
      const nums = [e.cells[0], e.cells[2], e.cells[4]]
      const vs = nums.map(val)
      const unk = [0, 1, 2].filter(j => vs[j] === undefined)
      if (unk.length !== 2) continue
      const [p, q] = unk
      const sols: [number, number][] = []
      for (const [v, n] of bank) {
        if (n <= 0) continue
        const t = vs.slice()
        t[p] = v
        const w = solveMissing(t[0], e.op, t[1], t[2])
        if (w === null) continue
        const need = w === v ? 2 : 1
        if ((bank.get(w) ?? 0) >= need) sols.push([v, w])
        if (sols.length > 1) break
      }
      if (sols.length === 1) {
        assign(nums[p], sols[0][0])
        assign(nums[q], sols[0][1])
        remaining -= 2
        progress = true
        break // re-run singles, which are more natural
      }
    }
  }
  return { solved: remaining === 0, order }
}

// ---------- puzzle assembly ----------

export function generatePuzzle(key: string, difficulty: Difficulty): Puzzle {
  const cfg = CONFIGS[difficulty]
  const rng = mulberry32(hashString(key))
  const target = randInt(rng, cfg.eqMin, cfg.eqMax)

  // Grow several candidate layouts and keep the nicest one.
  let best: Draft | null = null
  let bestScore = -Infinity
  for (let k = 0; k < 12; k++) {
    const d = growLayout(rng, cfg, target)
    const s = layoutScore(d)
    if (d.eqs.length >= cfg.eqMin && s > bestScore) { best = d; bestScore = s }
  }
  if (!best) {
    // extremely unlikely; fall back to the largest draft we can grow
    best = growLayout(rng, cfg, target)
  }

  // Crop to bounding box.
  const d = best
  let minR = 99, maxR = -1, minC = 99, maxC = -1
  for (const k of d.grid.keys()) {
    const r = Math.floor(k / d.size), c = k % d.size
    minR = Math.min(minR, r); maxR = Math.max(maxR, r)
    minC = Math.min(minC, c); maxC = Math.max(maxC, c)
  }
  const rows = maxR - minR + 1
  const cols = maxC - minC + 1
  const keys = [...d.grid.keys()].sort((a, b) => a - b)
  const indexOf = new Map<number, number>()
  const cells: Cell[] = keys.map((k, i) => {
    indexOf.set(k, i)
    const g = d.grid.get(k)!
    return {
      r: Math.floor(k / d.size) - minR,
      c: (k % d.size) - minC,
      kind: g.kind,
      value: g.value,
      op: g.op,
      given: true,
    }
  })
  const equations: Equation[] = d.eqs.map(e => ({
    dir: e.dir,
    op: e.op,
    cells: eqCells(e.dir, e.r, e.c).map(([r, c]) => indexOf.get(r * d.size + c)!),
  }))

  // Choose blanks: try removing numbers in random order, keep a removal if the
  // puzzle stays solvable by deduction.
  const numIdx = cells.map((c, i) => (c.kind === 'num' ? i : -1)).filter(i => i >= 0)
  const targetBlanks = Math.round(numIdx.length * cfg.blankRatio)
  const values = cells.map(c => c.value)
  const blanks = new Set<number>()
  for (let pass = 0; pass < 2 && blanks.size < targetBlanks; pass++) {
    for (const i of shuffle(rng, numIdx.slice())) {
      if (blanks.size >= targetBlanks) break
      if (blanks.has(i)) continue
      blanks.add(i)
      if (!solveByDeduction(equations, values, blanks, cfg.pairDeductions).solved) blanks.delete(i)
    }
  }
  const { order } = solveByDeduction(equations, values, blanks, cfg.pairDeductions)
  for (const i of blanks) cells[i].given = false

  const slots = [...blanks].sort((a, b) => a - b)
  const bank: Tile[] = shuffle(rng, slots.map(i => values[i])).map((value, id) => ({ id, value }))
  return { key, difficulty, rows, cols, cells, equations, slots, bank, solveOrder: order }
}

export function levelKey(difficulty: Difficulty, level: number) {
  return `level:${difficulty}:${level}`
}

export function dailyKey(difficulty: Difficulty, date: string) {
  return `daily:${difficulty}:${date}`
}
