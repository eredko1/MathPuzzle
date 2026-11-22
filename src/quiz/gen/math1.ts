import type { Gen } from '../types'
import { F, M, fAdd, fMul, fSub, fTex, fVal, nearby, nz, pick, polyTex, randInt } from '../util'

const T = (x: number) => M(String(x))
const g = (level: 1 | 2 | 3, topic: string, make: Gen['make']): Gen => ({ level, topic, make })

/** SAT-level algebra, geometry, data analysis. */
export const math1: Gen[] = [
  g(1, 'Linear equations', rng => {
    const x = randInt(rng, -9, 12), a = pick(rng, [2, 3, 4, 5, 6, 7]), b = nz(rng, 1, 15)
    const c = a * x + b
    const lhs = `${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}`
    return {
      topic: 'Linear equations',
      prompt: `If ${M(`${lhs} = ${c}`)}, what is the value of ${M('x')}?`,
      correct: T(x),
      wrong: [T((c + b) / a), T(c - b), T((c - b) * a), T(x + 1), T(-x)].filter(s => s !== T(x)).concat(nearby(rng, x, [], T)),
      hint: 'Undo the constant first, then divide by the coefficient of x.',
      explanation: `Subtract ${b} from both sides: ${M(`${a}x = ${c - b}`)}. Divide by ${a}: ${M(`x = ${x}`)}.`,
    }
  }),
  g(1, 'Systems of equations', rng => {
    for (;;) {
      const x = randInt(rng, -5, 8), y = randInt(rng, -5, 8)
      const a = randInt(rng, 1, 4), b = nz(rng, 1, 4), d = randInt(rng, 1, 4), e = nz(rng, 1, 4)
      if (a * e - b * d === 0 || x === y || x === 0 || y === 0) continue
      const s = (p: number, q: number) => `${p === 1 ? '' : p}x ${q < 0 ? '-' : '+'} ${Math.abs(q) === 1 ? '' : Math.abs(q)}y`
      return {
        topic: 'Systems of equations',
        prompt: `${M(`${s(a, b)} = ${a * x + b * y}`)} and ${M(`${s(d, e)} = ${d * x + e * y}`)}. What is the value of ${M('x')}?`,
        correct: T(x),
        wrong: [T(y), T(x + y), T(x - y), T(-x), ...nearby(rng, x, [], T)],
        hint: 'Multiply one equation so the y-coefficients match, then add or subtract to eliminate y.',
        explanation: `Eliminate y (or x) and solve to get ${M(`x = ${x},\\ y = ${y}`)}; check by substituting into both equations.`,
      }
    }
  }),
  g(1, 'Slope & lines', rng => {
    for (;;) {
      const x1 = randInt(rng, -6, 4), y1 = randInt(rng, -6, 6), x2 = x1 + nz(rng, 1, 6), y2 = randInt(rng, -8, 8)
      const m = F(y2 - y1, x2 - x1)
      if (m.n === 0 || m.d === 1) continue
      return {
        topic: 'Slope & lines',
        prompt: `A line passes through ${M(`(${x1},${y1})`)} and ${M(`(${x2},${y2})`)}. What is its slope?`,
        correct: M(fTex(m)),
        wrong: [M(fTex(F(x2 - x1, y2 - y1))), M(fTex(F(y1 - y2, x2 - x1))), M(fTex(F(y2 + y1, x2 + x1 || 1))), M(fTex(F(x1 - x2, y2 - y1)))],
        hint: 'Slope is rise over run: change in y divided by change in x.',
        explanation: `${M(`m = \\frac{${y2} - (${y1})}{${x2} - (${x1})} = ${fTex(m)}`)}.`,
      }
    }
  }),
  g(1, 'Percents', rng => {
    const a = pick(rng, [20, 40, 50, 60, 80, 120, 200, 250]), p = pick(rng, [10, 15, 20, 25, 30, 40, 50, 60, 75])
    const inc = rng() < 0.5
    const b = Math.round(a * (inc ? 1 + p / 100 : 1 - p / 100) * 100) / 100
    return {
      topic: 'Percents',
      prompt: `A quantity ${inc ? 'increases' : 'decreases'} from ${a} to ${b}. By what percent did it ${inc ? 'increase' : 'decrease'}?`,
      correct: `${p}%`,
      wrong: [`${p + 5}%`, `${p - 5}%`, `${Math.round((Math.abs(b - a) / b) * 100)}%`, `${Math.abs(b - a)}%`, `${p * 2}%`],
      hint: 'Percent change = (change ÷ original) × 100. Which value is the original?',
      explanation: `Change = ${Math.abs(b - a)}; ${Math.abs(b - a)} ÷ ${a} = ${p / 100} = ${p}%.`,
    }
  }),
  g(1, 'Quadratics', rng => {
    const r1 = randInt(rng, -8, 8), r2 = randInt(rng, -8, 8)
    const b = -(r1 + r2), c = r1 * r2
    const which = pick(rng, ['sum', 'product'] as const)
    const ans = which === 'sum' ? r1 + r2 : r1 * r2
    return {
      topic: 'Quadratics',
      prompt: `What is the ${which} of the solutions of ${M(`${polyTex([c, b, 1])} = 0`)}?`,
      correct: T(ans),
      wrong: which === 'sum' ? [T(b), T(c), T(-c), T(r1 - r2)] : [T(-c), T(b), T(-b), T(r1 + r2)],
      hint: 'You can factor, or use Vieta: for x² + bx + c, the sum is −b and the product is c.',
      explanation: `The roots are ${r1} and ${r2}. Sum = ${r1 + r2}, product = ${r1 * r2}.`,
    }
  }),
  g(1, 'Parabolas', rng => {
    const h = randInt(rng, -6, 6), k = randInt(rng, -9, 9), a = pick(rng, [1, 1, 2, 3, -1, -2])
    const ask = pick(rng, ['x', 'y'] as const)
    const inner = h === 0 ? 'x' : `(x ${h < 0 ? '+' : '-'} ${Math.abs(h)})`
    const f = `${a === 1 ? '' : a === -1 ? '-' : a}${inner}${h === 0 ? '^2' : '^2'} ${k < 0 ? '-' : '+'} ${Math.abs(k)}`
    return {
      topic: 'Parabolas',
      prompt: `The graph of ${M(`y = ${f}`)} is a parabola. What is the ${ask}-coordinate of its vertex?`,
      correct: T(ask === 'x' ? h : k),
      wrong: [T(ask === 'x' ? -h : -k), T(ask === 'x' ? k : h), T(ask === 'x' ? a * h : a * k), ...nearby(rng, ask === 'x' ? h : k, [], T)],
      hint: 'Vertex form: y = a(x − h)² + k has vertex (h, k). Watch the sign inside the parentheses.',
      explanation: `The vertex is ${M(`(${h}, ${k})`)}.`,
    }
  }),
  g(1, 'Exponent rules', rng => {
    const a = randInt(rng, 2, 9), b = randInt(rng, 2, 9), c = randInt(rng, 1, a + b - 1)
    return {
      topic: 'Exponent rules',
      prompt: `Simplify ${M(`\\dfrac{x^{${a}} \\cdot x^{${b}}}{x^{${c}}}`)}.`,
      correct: M(`x^{${a + b - c}}`),
      wrong: [M(`x^{${a * b - c}}`), M(`x^{${a + b + c}}`), M(`x^{${a * b / c}}`.replace('.', '')), M(`x^{${a - b - c}}`), M(`x^{${a + b - c + 1}}`), M(`x^{${a + b - c - 1}}`)],
      hint: 'Multiplying powers with the same base adds exponents; dividing subtracts them.',
      explanation: `${M(`x^{${a}+${b}-${c}} = x^{${a + b - c}}`)}.`,
    }
  }),
  g(1, 'Function composition', rng => {
    const a = nz(rng, 1, 4), b = nz(rng, 1, 6), c = pick(rng, [2, 3, 4]), d = nz(rng, 1, 6), x = randInt(rng, -3, 4)
    const gx = c * x + d, ans = a * gx + b, wrongOrder = c * (a * x + b) + d
    return {
      topic: 'Function composition',
      prompt: `If ${M(`f(x) = ${polyTex([b, a])}`)} and ${M(`g(x) = ${polyTex([d, c])}`)}, what is ${M(`f(g(${x}))`)}?`,
      correct: T(ans),
      wrong: [T(wrongOrder), T(a * x + b + c * x + d), T(gx), T(ans + a), T(-ans)],
      hint: 'Work from the inside out: compute g(x) first, then plug that into f.',
      explanation: `${M(`g(${x}) = ${gx}`)}, so ${M(`f(${gx}) = ${ans}`)}.`,
    }
  }),
  g(1, 'Distance & midpoint', rng => {
    const [p, q, r] = pick(rng, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [9, 12, 15]])
    const x1 = randInt(rng, -5, 5), y1 = randInt(rng, -5, 5), flip = rng() < 0.5
    const x2 = x1 + (flip ? p : q), y2 = y1 + (flip ? q : p)
    if (rng() < 0.5)
      return {
        topic: 'Distance & midpoint',
        prompt: `What is the distance between ${M(`(${x1},${y1})`)} and ${M(`(${x2},${y2})`)}?`,
        correct: T(r),
        wrong: [T(p + q), T(p * q), T(r * r), T(r + 1), T(Math.abs(p - q))],
        hint: 'Treat the horizontal and vertical gaps as legs of a right triangle.',
        explanation: `${M(`\\sqrt{${p}^2 + ${q}^2} = \\sqrt{${r * r}} = ${r}`)}.`,
      }
    const mx = F(x1 + x2, 2), my = F(y1 + y2, 2)
    const sh = (f: ReturnType<typeof F>) => fTex(f)
    return {
      topic: 'Distance & midpoint',
      prompt: `What is the midpoint of ${M(`(${x1},${y1})`)} and ${M(`(${x2},${y2})`)}?`,
      correct: M(`(${sh(mx)}, ${sh(my)})`),
      wrong: [M(`(${sh(F(x2 - x1, 2))}, ${sh(F(y2 - y1, 2))})`), M(`(${x1 + x2}, ${y1 + y2})`), M(`(${sh(mx)}, ${sh(F(y2 - y1, 2))})`), M(`(${sh(my)}, ${sh(mx)})`)],
      hint: 'Average the x-coordinates and average the y-coordinates.',
      explanation: `${M(`\\left(\\frac{${x1}+${x2}}{2}, \\frac{${y1}+${y2}}{2}\\right)`)}.`,
    }
  }),
  g(1, 'Circles', rng => {
    const h = nz(rng, 1, 6), k = nz(rng, 1, 6), r = randInt(rng, 2, 9)
    const eq = `(x ${h < 0 ? '+' : '-'} ${Math.abs(h)})^2 + (y ${k < 0 ? '+' : '-'} ${Math.abs(k)})^2 = ${r * r}`
    return {
      topic: 'Circles',
      prompt: `A circle has equation ${M(eq)}. What is its radius?`,
      correct: T(r),
      wrong: [T(r * r), T(r * 2), T(Math.abs(h) + Math.abs(k)), T(Math.round(r * r / 2))],
      hint: 'The standard form is (x − h)² + (y − k)² = r². The right side is r², not r.',
      explanation: `${M(`r^2 = ${r * r}`)}, so ${M(`r = ${r}`)}.`,
    }
  }),
  g(1, 'Sequences', rng => {
    const a = randInt(rng, -10, 20), d = nz(rng, 2, 9), n = randInt(rng, 8, 30)
    const ans = a + (n - 1) * d
    return {
      topic: 'Sequences',
      prompt: `An arithmetic sequence begins ${[0, 1, 2, 3].map(i => a + i * d).join(', ')}, … What is term number ${n}?`,
      correct: T(ans),
      wrong: [T(a + n * d), T(a + (n - 2) * d), T(ans + d), T(a * n + d), T(n * d)],
      hint: 'The nth term is first term + (n − 1) × common difference.',
      explanation: `${M(`a_{${n}} = ${a} + (${n}-1)(${d}) = ${ans}`)}.`,
    }
  }),
  g(1, 'Statistics', rng => {
    const n = randInt(rng, 4, 8), m = randInt(rng, 10, 30), x = randInt(rng, 1, 50)
    const newMean = F(n * m + x, n + 1)
    const ok = newMean.d === 1
    if (!ok) {
      const data = Array.from({ length: 5 }, () => randInt(rng, 2, 40)).sort((p, q) => p - q)
      const mean = data.reduce((s, v) => s + v, 0) / 5
      return {
        topic: 'Statistics',
        prompt: `What is the median of the data set ${data.slice().sort(() => rng() - 0.5).join(', ')}?`,
        correct: T(data[2]),
        wrong: [T(Math.round(mean)), T(data[1]), T(data[3]), T(data[0] + data[4])],
        hint: 'Sort the values; the median is the middle one.',
        explanation: `Sorted: ${data.join(', ')}. The middle value is ${data[2]}.`,
      }
    }
    return {
      topic: 'Statistics',
      prompt: `The mean of ${n} numbers is ${m}. A new number, ${x}, is added. What is the new mean?`,
      correct: T(fVal(newMean)),
      wrong: [T(m + x), T((m + x) / 2), T(m), T(fVal(newMean) + 1)],
      hint: 'Mean × count = total. Add the new number to the total and divide by the new count.',
      explanation: `Total = ${n * m}. New total = ${n * m + x}. New mean = ${n * m + x} ÷ ${n + 1} = ${fVal(newMean)}.`,
    }
  }),
  g(1, 'Probability', rng => {
    const r = randInt(rng, 2, 9), b = randInt(rng, 2, 9), gr = randInt(rng, 1, 8), tot = r + b + gr
    const p = F(r, tot)
    return {
      topic: 'Probability',
      prompt: `A bag has ${r} red, ${b} blue, and ${gr} green marbles. One marble is drawn at random. What is the probability that it is red?`,
      correct: M(fTex(p)),
      wrong: [M(fTex(F(r, b + gr))), M(fTex(F(r, r + b))), M(fTex(F(b, tot))), M(fTex(F(1, 3)))],
      hint: 'Probability = favorable outcomes ÷ total outcomes.',
      explanation: `${r} red out of ${tot} total gives ${M(fTex(p))}.`,
    }
  }),
  g(1, 'Absolute value', rng => {
    const a = nz(rng, 1, 9), b = randInt(rng, 2, 9)
    const inner = `x ${a < 0 ? '+' : '-'} ${Math.abs(a)}`
    return {
      topic: 'Absolute value',
      prompt: `What is the sum of all solutions of ${M(`|${inner}| = ${b}`)}?`,
      correct: T(2 * a),
      wrong: [T(a), T(2 * b), T(a + b), T(-2 * a), T(0)],
      hint: 'Split into two cases: the inside equals b, or the inside equals −b.',
      explanation: `${M(`x = ${a + b}`)} or ${M(`x = ${a - b}`)}; the sum is ${2 * a}.`,
    }
  }),
  g(1, 'Complex numbers', rng => {
    const n = randInt(rng, 5, 120), r = n % 4
    const val = ['1', 'i', '-1', '-i'][r]
    return {
      topic: 'Complex numbers',
      prompt: `What is the value of ${M(`i^{${n}}`)}, where ${M('i = \\sqrt{-1}')}?`,
      correct: M(val),
      wrong: ['1', 'i', '-1', '-i'].filter(v => v !== val).map(M),
      hint: 'Powers of i repeat every 4: i, −1, −i, 1.',
      explanation: `${n} mod 4 = ${r}, so ${M(`i^{${n}} = ${val}`)}.`,
    }
  }),
  g(1, 'Geometry', rng => {
    const r = randInt(rng, 2, 9), h = randInt(rng, 2, 12)
    const k = pick(rng, ['cylinder', 'circle', 'cone'] as const)
    if (k === 'circle')
      return {
        topic: 'Geometry',
        prompt: `A circle has circumference ${M(`${2 * r}\\pi`)}. What is its area?`,
        correct: M(`${r * r}\\pi`),
        wrong: [M(`${2 * r * r}\\pi`), M(`${r}\\pi`), M(`${4 * r * r}\\pi`), M(`${2 * r}\\pi`)],
        hint: 'Circumference = 2πr gives r first. Then area = πr².',
        explanation: `${M(`2\\pi r = ${2 * r}\\pi \\Rightarrow r = ${r}`)}, so area = ${M(`${r * r}\\pi`)}.`,
      }
    if (k === 'cone')
      return {
        topic: 'Geometry',
        prompt: `What is the volume of a cone with radius ${r * 3} and height ${h}?`,
        correct: M(`${3 * r * r * h}\\pi`),
        wrong: [M(`${9 * r * r * h}\\pi`), M(`${6 * r * r * h}\\pi`), M(`${r * r * h}\\pi`), M(`${3 * r * h}\\pi`)],
        hint: 'Cone volume is one third of the matching cylinder: (1/3)πr²h.',
        explanation: `${M(`\\tfrac13 \\pi (${r * 3})^2 (${h}) = ${3 * r * r * h}\\pi`)}.`,
      }
    return {
      topic: 'Geometry',
      prompt: `What is the volume of a cylinder with radius ${r} and height ${h}?`,
      correct: M(`${r * r * h}\\pi`),
      wrong: [M(`${2 * r * h}\\pi`), M(`${r * h}\\pi`), M(`${Math.round(r * r * h / 3)}\\pi`), M(`${r * r * h * 2}\\pi`)],
      hint: 'Volume = (area of the circular base) × height.',
      explanation: `${M(`\\pi r^2 h = \\pi(${r})^2(${h}) = ${r * r * h}\\pi`)}.`,
    }
  }),
  g(1, 'Inequalities', rng => {
    const a = randInt(rng, 2, 6), b = randInt(rng, 1, 12), c = randInt(rng, 5, 40)
    const bound = Math.floor((c - b) / a)
    const ans = bound + 1
    return {
      topic: 'Inequalities',
      prompt: `What is the smallest integer ${M('x')} that satisfies ${M(`${a}x + ${b} > ${c}`)}?`,
      correct: T(ans),
      wrong: [T(bound), T(bound + 2), T(bound - 1), T(Math.ceil((c + b) / a))],
      hint: 'Solve like an equation, then remember the inequality is strict (>).',
      explanation: `${M(`x > ${fTex(F(c - b, a))}`)}, so the smallest integer is ${ans}.`,
    }
  }),
  g(1, 'Rates & proportions', rng => {
    const sp = pick(rng, [30, 40, 50, 60, 70, 36, 44]), t = F(randInt(rng, 3, 15), 2), t2 = F(randInt(rng, 3, 15), 2)
    const d = fMul(F(sp), t)
    const need = fVal(fMul(F(sp), t2))
    return {
      topic: 'Rates & proportions',
      prompt: `A car travels ${d.n} miles in ${fVal(t)} hours at a constant speed. At that speed, how many miles will it travel in ${fVal(t2)} hours?`,
      correct: T(need),
      wrong: [T(need + sp), T(need * 2), T(d.n + fVal(t2)), T(Math.round(need / 2))],
      hint: 'Find the unit rate (miles per hour) first.',
      explanation: `Rate = ${d.n} ÷ ${fVal(t)} = ${sp} mph. In ${fVal(t2)} h: ${need} miles.`,
    }
  }),
  g(1, 'Similar triangles', rng => {
    const k = pick(rng, [2, 3, 4, 5]), a = randInt(rng, 3, 9), b = randInt(rng, 4, 11), c = randInt(rng, 5, 12)
    return {
      topic: 'Similar triangles',
      prompt: `Triangles ABC and DEF are similar with AB = ${a}, BC = ${b}, and DE = ${a * k}. What is EF?`,
      correct: T(b * k),
      wrong: [T(b + k), T(b + a * k - a), T(Math.round(b / k * 10) / 10), T(c * k)].filter(s => s !== T(b * k)),
      hint: 'Corresponding sides of similar triangles are proportional.',
      explanation: `Scale factor = ${a * k} ÷ ${a} = ${k}, so EF = ${k} × ${b} = ${b * k}.`,
    }
  }),
  g(1, 'Counting', rng => {
    const a = randInt(rng, 3, 6), b = randInt(rng, 3, 6), c = randInt(rng, 2, 5)
    return {
      topic: 'Counting',
      prompt: `A diner offers ${a} entrées, ${b} sides, and ${c} drinks. A meal is one of each. How many different meals are possible?`,
      correct: T(a * b * c),
      wrong: [T(a + b + c), T(a * b + c), T(a * b), T(a * b * c + a)],
      hint: 'Independent choices multiply (the fundamental counting principle).',
      explanation: `${a} × ${b} × ${c} = ${a * b * c}.`,
    }
  }),
]

// Intermediate precalculus & discrete math.
export const math2a: Gen[] = [
  g(2, 'Logarithms', rng => {
    const b = pick(rng, [2, 3, 4, 5, 10]), p = randInt(rng, 2, 6), q = randInt(rng, 2, 5)
    return {
      topic: 'Logarithms',
      prompt: `Evaluate ${M(`\\log_{${b}}(${b ** p}) + \\log_{${b}}(${b ** q})`)}.`,
      correct: T(p + q),
      wrong: [T(p * q), T(b ** p + b ** q), T(p + q + 1), T(Math.abs(p - q))],
      hint: 'log_b(b^k) = k.',
      explanation: `${p} + ${q} = ${p + q}. (Equivalently, log of a product: ${M(`\\log_{${b}}(${b ** (p + q)})`)}.)`,
    }
  }),
  g(2, 'Exponential equations', rng => {
    const b = pick(rng, [2, 3, 5]), x = randInt(rng, 2, 6), k = randInt(rng, 1, 4)
    const val = b ** (x * 2 + k)
    return {
      topic: 'Exponential equations',
      prompt: `Solve ${M(`${b}^{2x + ${k}} = ${val}`)} for ${M('x')}.`,
      correct: T(x),
      wrong: [T(x * 2 + k), T(x + k), T(2 * x), T(x - 1)],
      hint: 'Match bases, then set the exponents equal.',
      explanation: `${M(`2x + ${k} = ${x * 2 + k}`)} so ${M(`x = ${x}`)}.`,
    }
  }),
  g(2, 'Trigonometry', rng => {
    const [ang, sin, cos, tan] = pick(rng, [
      [30, '\\frac12', '\\frac{\\sqrt3}{2}', '\\frac{\\sqrt3}{3}'],
      [45, '\\frac{\\sqrt2}{2}', '\\frac{\\sqrt2}{2}', '1'],
      [60, '\\frac{\\sqrt3}{2}', '\\frac12', '\\sqrt3'],
    ])
    const fn = pick(rng, ['sin', 'cos', 'tan'] as const)
    const val = { sin, cos, tan }[fn]
    const others = [sin, cos, tan].filter(v => v !== val).concat(['0', '\\frac{\\sqrt3}{2}', '\\frac12', '1'])
    return {
      topic: 'Trigonometry',
      prompt: `What is ${M(`\\${fn}(${ang}^\\circ)`)}?`,
      correct: M(val),
      wrong: others.map(M),
      hint: 'Recall the 30-60-90 and 45-45-90 triangles.',
      explanation: `${M(`\\${fn}(${ang}^\\circ) = ${val}`)}.`,
    }
  }),
  g(2, 'Unit circle', rng => {
    const S = '\\frac{\\sqrt3}{2}', H = '\\frac12', R = '\\frac{\\sqrt2}{2}'
    const table: Record<number, [string, string]> = {
      120: [S, `-${H}`], 135: [R, `-${R}`], 150: [H, `-${S}`], 210: [`-${H}`, `-${S}`], 225: [`-${R}`, `-${R}`],
      240: [`-${S}`, `-${H}`], 300: [`-${S}`, H], 315: [`-${R}`, R], 330: [`-${H}`, S],
    }
    const ang = pick(rng, Object.keys(table).map(Number)), fn = pick(rng, ['sin', 'cos'] as const)
    const val = table[ang][fn === 'sin' ? 0 : 1]
    const pool = [H, `-${H}`, S, `-${S}`, R, `-${R}`]
    return {
      topic: 'Unit circle',
      prompt: `What is ${M(`\\${fn}(${ang}^\\circ)`)}?`,
      correct: M(val),
      wrong: pool.filter(p => p !== val).map(M),
      hint: 'Find the reference angle (distance to the x-axis), then decide the sign from the quadrant.',
      explanation: `${M(`\\${fn}(${ang}^\\circ) = ${val}`)}.`,
    }
  }),
  g(2, 'Law of cosines', rng => {
    const [a, b] = [randInt(rng, 3, 9), randInt(rng, 3, 9)]
    const cases: [number, number, number][] = [[60, 1, a * a + b * b - a * b], [90, 0, a * a + b * b], [120, -1, a * a + b * b + a * b]]
    const [ang, , c2] = pick(rng, cases)
    return {
      topic: 'Law of cosines',
      prompt: `In a triangle, two sides have lengths ${a} and ${b} with an included angle of ${ang}°. What is the square of the third side?`,
      correct: T(c2),
      wrong: [T(a * a + b * b), T(a * a + b * b - 2 * a * b), T(a * a + b * b + 2 * a * b), T((a + b) ** 2), T(a * a + b * b + a * b), T(a * a + b * b - a * b)],
      hint: 'c² = a² + b² − 2ab·cos(C).',
      explanation: `${M(`c^2 = ${a}^2 + ${b}^2 - 2(${a})(${b})\\cos ${ang}^\\circ = ${c2}`)}.`,
    }
  }),
  g(2, 'Series', rng => {
    const a = randInt(rng, 2, 9), d = randInt(rng, 2, 7), n = randInt(rng, 10, 40)
    const s = (n * (2 * a + (n - 1) * d)) / 2
    return {
      topic: 'Series',
      prompt: `What is the sum of the first ${n} terms of the arithmetic sequence ${a}, ${a + d}, ${a + 2 * d}, …?`,
      correct: T(s),
      wrong: [T(n * (a + (n - 1) * d)), T(s + a), T(s - d), T((n * (2 * a + n * d)) / 2)],
      hint: 'Sum = (number of terms)/2 × (first + last).',
      explanation: `Last = ${a + (n - 1) * d}. Sum = ${n}/2 × (${a} + ${a + (n - 1) * d}) = ${s}.`,
    }
  }),
  g(2, 'Geometric series', rng => {
    const r = pick(rng, [F(1, 2), F(1, 3), F(2, 3), F(1, 4), F(3, 4)]), a = randInt(rng, 1, 9) * r.d
    const sum = F(a * r.d, r.d - r.n)
    return {
      topic: 'Geometric series',
      prompt: `What is the sum of the infinite series ${M(`${a} + ${fTex(fMul(F(a), r))} + ${fTex(fMul(F(a), fMul(r, r)))} + \\cdots`)}?`,
      correct: M(fTex(sum)),
      wrong: [M(fTex(F(a))), M(fTex(fMul(F(a), F(r.d, r.n)))), M(fTex(fAdd(sum, F(1)))), M(fTex(fSub(sum, F(1)))), M(fTex(fMul(sum, F(2))))],
      hint: 'For |r| < 1 the sum is a / (1 − r).',
      explanation: `${M(`r = ${fTex(r)}`)}, so the sum is ${M(`\\frac{${a}}{1 - ${fTex(r)}} = ${fTex(sum)}`)}.`,
    }
  }),
  g(2, 'Combinatorics', rng => {
    const n = randInt(rng, 6, 12), k = randInt(rng, 2, 4)
    const ch = (a: number, b: number) => { let r = 1; for (let i = 1; i <= b; i++) r = (r * (a - b + i)) / i; return Math.round(r) }
    let perm = 1
    for (let i = 0; i < k; i++) perm *= n - i
    const isC = rng() < 0.5
    return {
      topic: 'Combinatorics',
      prompt: isC
        ? `In how many ways can a committee of ${k} be chosen from ${n} people?`
        : `In how many ways can ${k} different prizes be awarded to ${n} people, if no one gets more than one?`,
      correct: T(isC ? ch(n, k) : perm),
      wrong: isC ? [T(perm), T(n ** k), T(ch(n, k) * 2), T(n * k)] : [T(ch(n, k)), T(n ** k), T(perm / 2), T(n * k)],
      hint: isC ? 'Order does not matter, so divide the permutations by k!.' : 'Order matters here: n × (n−1) × … for k factors.',
      explanation: isC ? `${M(`\\binom{${n}}{${k}} = ${ch(n, k)}`)}.` : `${M(`P(${n},${k}) = ${perm}`)}.`,
    }
  }),
  g(2, 'Conditional probability', rng => {
    const a = randInt(rng, 20, 60), b = randInt(rng, 10, 40), both = randInt(rng, 5, Math.min(a, b) - 2), tot = a + b - both + randInt(rng, 5, 30)
    return {
      topic: 'Conditional probability',
      prompt: `Of ${tot} students, ${a} take Spanish, ${b} take Art, and ${both} take both. A student who takes Spanish is chosen. What is the probability they also take Art?`,
      correct: M(fTex(F(both, a))),
      wrong: [M(fTex(F(both, b))), M(fTex(F(both, tot))), M(fTex(F(b, tot))), M(fTex(F(a, tot)))],
      hint: 'Condition on Spanish: restrict the sample space to the Spanish students.',
      explanation: `${M(`P(\\text{Art}\\mid\\text{Spanish}) = \\frac{${both}}{${a}}`)}.`,
    }
  }),
  g(2, 'Matrices', rng => {
    const [a, b, c, d] = [nz(rng, 1, 7), nz(rng, 1, 7), nz(rng, 1, 7), nz(rng, 1, 7)]
    return {
      topic: 'Matrices',
      prompt: `What is the determinant of ${M(`\\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}`)}?`,
      correct: T(a * d - b * c),
      wrong: [T(a * d + b * c), T(a * b - c * d), T(b * c - a * d), T(a + d - b - c)],
      hint: 'For a 2×2 matrix the determinant is ad − bc.',
      explanation: `${M(`(${a})(${d}) - (${b})(${c}) = ${a * d - b * c}`)}.`,
    }
  }),
  g(2, 'Vectors', rng => {
    const u = [nz(rng, 1, 6), nz(rng, 1, 6), nz(rng, 1, 6)], v = [nz(rng, 1, 6), nz(rng, 1, 6), nz(rng, 1, 6)]
    const dot = u[0] * v[0] + u[1] * v[1] + u[2] * v[2]
    const vec = (x: number[]) => M(`\\langle ${x.join(', ')}\\rangle`)
    return {
      topic: 'Vectors',
      prompt: `What is ${M('\\mathbf{u}\\cdot\\mathbf{v}')} for u = ${vec(u)} and v = ${vec(v)}?`,
      correct: T(dot),
      wrong: [T(u[0] * v[0] - u[1] * v[1] + u[2] * v[2]), T(u[0] * v[1] + u[1] * v[2] + u[2] * v[0]), T(-dot), T(dot + u[0])],
      hint: 'Multiply matching components and add them.',
      explanation: `${M(`(${u[0]})(${v[0]}) + (${u[1]})(${v[1]}) + (${u[2]})(${v[2]}) = ${dot}`)}.`,
    }
  }),
  g(2, 'Polar & complex', rng => {
    const a = randInt(rng, 1, 6), b = randInt(rng, 1, 6)
    return {
      topic: 'Polar & complex',
      prompt: `What is the product ${M(`(${a} + ${b}i)(${a} - ${b}i)`)}?`,
      correct: T(a * a + b * b),
      wrong: [T(a * a - b * b), T(a * a + b * b + 2 * a * b), T((a - b) ** 2), T(2 * a)],
      hint: 'Multiply by the conjugate: the cross terms cancel.',
      explanation: `${M(`${a}^2 - (${b}i)^2 = ${a * a} + ${b * b} = ${a * a + b * b}`)}.`,
    }
  }),
  g(2, 'Rational functions', rng => {
    const a = randInt(rng, 2, 6), b = randInt(rng, 1, 9), c = randInt(rng, 2, 6)
    return {
      topic: 'Rational functions',
      prompt: `What is the horizontal asymptote of ${M(`f(x) = \\dfrac{${a}x^2 + ${b}}{${c}x^2 - ${b + 1}}`)}?`,
      correct: M(`y = ${fTex(F(a, c))}`),
      wrong: [M(`y = ${a}`), M(`y = ${fTex(F(c, a))}`), M('y = 0'), M(`y = ${fTex(F(b, -(b + 1)))}`)],
      hint: 'Compare degrees. When they are equal, divide the leading coefficients.',
      explanation: `Equal degrees give ${M(`y = \\frac{${a}}{${c}}`)}.`,
    }
  }),
  g(2, 'Transformations', rng => {
    const h = nz(rng, 1, 5), k = nz(rng, 1, 5)
    return {
      topic: 'Transformations',
      prompt: `The graph of ${M('y = f(x)')} is shifted ${Math.abs(h)} units ${h > 0 ? 'right' : 'left'} and ${Math.abs(k)} units ${k > 0 ? 'up' : 'down'}. Which equation describes the new graph?`,
      correct: M(`y = f(x ${h > 0 ? '-' : '+'} ${Math.abs(h)}) ${k > 0 ? '+' : '-'} ${Math.abs(k)}`),
      wrong: [M(`y = f(x ${h > 0 ? '+' : '-'} ${Math.abs(h)}) ${k > 0 ? '+' : '-'} ${Math.abs(k)}`), M(`y = f(x ${h > 0 ? '-' : '+'} ${Math.abs(h)}) ${k > 0 ? '-' : '+'} ${Math.abs(k)}`), M(`y = f(x ${h > 0 ? '+' : '-'} ${Math.abs(h)}) ${k > 0 ? '-' : '+'} ${Math.abs(k)}`)],
      hint: 'A horizontal shift acts on x inside the function, and it works "backwards".',
      explanation: `Right by h is x − h; up by k is +k outside.`,
    }
  }),
  g(2, 'Binomial theorem', rng => {
    const n = randInt(rng, 4, 8), k = randInt(rng, 1, n - 1), a = randInt(rng, 2, 3)
    let c = 1
    for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i
    const coef = Math.round(c) * a ** k
    return {
      topic: 'Binomial theorem',
      prompt: `What is the coefficient of ${M(`x^{${k}}`)} in the expansion of ${M(`(1 + ${a}x)^{${n}}`)}?`,
      correct: T(coef),
      wrong: [T(Math.round(c)), T(Math.round(c) * a), T(a ** k), T(Math.round(c) * a ** (n - k))],
      hint: 'Term k is C(n,k)·(a)^k·x^k.',
      explanation: `${M(`\\binom{${n}}{${k}} ${a}^{${k}} = ${coef}`)}.`,
    }
  }),
]
