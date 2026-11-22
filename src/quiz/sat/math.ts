import type { Gen, Level } from '../types'
import { F, M, fTex, nearby, num, nz, pick, polyTex, randInt, shuffle } from '../util'
import { math1, math2a } from '../gen/math1'

const T = (x: number | string) => M(String(x))
const FR = (n: number, d = 1) => M(fTex(F(n, d)))
const g = (level: Level, topic: string, make: Gen['make']): Gen => ({ level, topic, make })
const sg = (v: number) => `${v < 0 ? '-' : '+'} ${Math.abs(v)}`
const USD = (x: number) => `\\$${x}`
const fac = (v: string, n: number) => `(${v} ${n < 0 ? '+' : '-'} ${Math.abs(n)})`
const pre = (s: string) => '```\n' + s + '\n```'

/** SAT-domain tags (used for the results breakdown). */
export const SAT_MATH_DOMAIN: Record<string, string> = {}
const dom = (d: string, gens: Gen[]) => {
  gens.forEach(x => (SAT_MATH_DOMAIN[x.topic] = SAT_MATH_DOMAIN[x.topic] ?? d))
  return gens
}

const reuse = (src: Gen[], topics: string[]) => src.filter(x => topics.includes(x.topic))

const algebra: Gen[] = [
  ...reuse(math1, ['Linear equations', 'Systems of equations', 'Slope & lines', 'Absolute value', 'Inequalities']),
  g(2, 'Linear equations', rng => {
    const x = randInt(rng, -6, 9), a = randInt(rng, 2, 6)
    let d = randInt(rng, 1, 5)
    if (d === a) d += 1
    const b = randInt(rng, 1, 7), c = nz(rng, 1, 9), e = randInt(rng, 1, 7)
    const f = a * (x - b) + c - d * (x + e)
    return {
      topic: 'Linear equations',
      prompt: `If ${M(`${a}(x - ${b}) ${sg(c)} = ${d}(x + ${e}) ${sg(f)}`)}, what is the value of ${M('x')}?`,
      correct: T(x),
      wrong: [T(-x), T(x + 1), T(x - 1), ...nearby(rng, x, [], T)],
      hint: 'Distribute first, collect the x-terms on one side, then isolate x.',
      explanation: `Expanding and collecting terms gives ${M(`x = ${x}`)}.`,
    }
  }),
  g(2, 'Systems of equations', rng => {
    const ad = randInt(rng, 20, 90), kid = randInt(rng, 15, 80), pa = pick(rng, [8, 9, 10, 12, 15]), pk = pick(rng, [4, 5, 6, 7])
    const rev = pa * ad + pk * kid
    return {
      topic: 'Systems of equations',
      prompt: `A theater sold ${ad + kid} tickets for one show. Adult tickets cost ${USD(pa)} each and child tickets cost ${USD(pk)} each. Total sales were ${USD(rev)}. How many adult tickets were sold?`,
      correct: String(ad),
      wrong: [String(kid), String(ad + 1), String(ad - 1), String(Math.round(rev / (pa + pk)))],
      hint: 'Let a = adult tickets and c = child tickets. Write one equation for the count and one for the money.',
      explanation: `a + c = ${ad + kid} and ${pa}a + ${pk}c = ${rev} give a = ${ad}.`,
    }
  }),
  g(3, 'Systems of equations', rng => {
    const a = randInt(rng, 2, 7), b = randInt(rng, 2, 7), c = randInt(rng, 1, 12), m = randInt(rng, 2, 4)
    const d = m * c + nz(rng, 1, 5)
    return {
      topic: 'Systems of equations',
      prompt: `The system ${M(`${a}x + ${b}y = ${c}`)} and ${M(`kx + ${m * b}y = ${d}`)} has no solution. What is the value of ${M('k')}?`,
      correct: T(m * a),
      wrong: [T(a), T(m * b), T(m * c), T(a * b), T(m * a + 1)],
      hint: 'No solution means the lines are parallel: the x- and y-coefficients must be in the same ratio, but the constants are not.',
      explanation: `The y-coefficient was multiplied by ${m}, so k = ${m}·${a} = ${m * a} (and ${d} ≠ ${m}·${c}).`,
    }
  }),
  g(2, 'Linear models', rng => {
    const rate = randInt(rng, 12, 60), fee = randInt(rng, 20, 150), h1 = randInt(rng, 1, 3), h2 = h1 + randInt(rng, 2, 4)
    const t1 = fee + rate * h1, t2 = fee + rate * h2
    const askRate = rng() < 0.5
    return {
      topic: 'Linear models',
      prompt: `A technician charges a flat service fee plus an hourly rate. A ${h1}-hour job costs ${USD(t1)} and a ${h2}-hour job costs ${USD(t2)}. What is the ${askRate ? 'hourly rate' : 'flat service fee'}?`,
      correct: USD(askRate ? rate : fee),
      wrong: [USD(askRate ? fee : rate), USD(Math.round(t1 / h1)), USD(Math.round(t2 / h2)), USD(t2 - t1)],
      hint: 'The extra cost between the two jobs is the extra hours times the hourly rate.',
      explanation: `Rate = (${t2} − ${t1}) ÷ (${h2} − ${h1}) = ${rate}; fee = ${t1} − ${rate}·${h1} = ${fee}.`,
    }
  }),
  g(2, 'Inequalities', rng => {
    const budget = randInt(rng, 40, 90), a = randInt(rng, 3, 7), nb = randInt(rng, 2, 5), b = randInt(rng, 2, 4)
    const k = Math.floor((budget - a * nb) / b)
    return {
      topic: 'Inequalities',
      prompt: `Priya has ${USD(budget)} to spend. Notebooks cost ${USD(a)} each and pens cost ${USD(b)} each. If she buys ${nb} notebooks, what is the greatest number of pens she can buy?`,
      correct: String(k),
      wrong: [String(k + 1), String(k - 1), String(Math.floor(budget / b)), String(Math.floor(budget / (a + b)))],
      hint: `Set up ${a * nb} + ${b}p ≤ ${budget} and solve for p; the answer must be a whole number.`,
      explanation: `${b}p ≤ ${budget - a * nb}, so p ≤ ${num((budget - a * nb) / b)}; the greatest whole number is ${k}.`,
    }
  }),
  g(3, 'Perpendicular lines', rng => {
    const [p, q] = pick(rng, [[2, 3], [3, 4], [1, 2], [3, 5], [2, 5], [4, 3]]) as [number, number]
    const x0 = q * randInt(rng, 1, 3), y0 = randInt(rng, -6, 8)
    const m = F(q, p) // slope of the given line; the perpendicular slope is -p/q
    const c = y0 + (p * x0) / q // integer because x0 is a multiple of q
    const line = (sn: number, sd: number, cc: number) => {
      const s = sd === 1 ? (Math.abs(sn) === 1 ? '' : String(Math.abs(sn))) : `\\frac{${Math.abs(sn)}}{${sd}}`
      return M(`y = ${sn < 0 ? '-' : ''}${s}x ${sg(cc)}`)
    }
    const given = M(`y = ${fTex(m)}x + ${randInt(rng, 1, 9)}`)
    return {
      topic: 'Perpendicular lines',
      prompt: `Line ℓ has equation ${given}. Which equation represents the line perpendicular to ℓ that passes through the point ${M(`(${x0}, ${y0})`)}?`,
      correct: line(-p, q, c),
      wrong: [line(p, q, c), line(-q, p, c), line(-p, q, y0), line(q, p, c)],
      hint: 'Perpendicular slopes are negative reciprocals. Then use the point to find the intercept.',
      explanation: `Slope = −${p}/${q}; intercept = ${y0} + (${p}/${q})(${x0}) = ${c}.`,
    }
  }),
]

const advanced: Gen[] = [
  ...reuse(math1, ['Quadratics', 'Parabolas', 'Exponent rules', 'Function composition', 'Complex numbers']),
  ...reuse(math2a, ['Exponential equations', 'Transformations']),
  g(2, 'Quadratics', rng => {
    let r = nz(rng, 1, 6), s = nz(rng, 1, 6)
    while (s === r || r + s === 0) s = nz(rng, 1, 7)
    const b = -(r + s), c = r * s
    const eq = (bb: number, cc: number) => M(`${polyTex([cc, bb, 1])} = 0`)
    return {
      topic: 'Quadratics',
      prompt: `Which of the following equations has solutions ${M(`x = ${r}`)} and ${M(`x = ${s}`)}?`,
      correct: eq(b, c),
      wrong: [eq(-b, c), eq(b, -c), eq(-b, -c)],
      hint: 'If x = r is a solution then (x − r) is a factor. Multiply the two factors.',
      explanation: `${M(`${fac('x', r)}${fac('x', s)}`)} expands to ${M(polyTex([c, b, 1]))}.`,
    }
  }),
  g(2, 'Radical equations', rng => {
    let x = randInt(rng, 2, 20), b = randInt(rng, 2, 7), a = b * b - 2 * x
    while (a === 0) {
      x += 1
      a = b * b - 2 * x
    }
    return {
      topic: 'Radical equations',
      prompt: `If ${M(`\\sqrt{2x ${sg(a)}} = ${b}`)}, what is the value of ${M('x')}?`,
      correct: T(x),
      wrong: [T(b), T(b * b), T(x + 1), T(b * b - a), T(-x)],
      hint: 'Square both sides to remove the radical, then solve for x.',
      explanation: `2x ${sg(a)} = ${b * b}, so x = ${x}.`,
    }
  }),
  g(2, 'Exponential models', rng => {
    const A = pick(rng, [200, 500, 1200, 3000]), r = pick(rng, [4, 5, 6, 8, 12, 15])
    const base = num(1 + r / 100)
    return {
      topic: 'Exponential models',
      prompt: `The number of subscribers to a channel is modeled by ${M(`f(t) = ${A}(${base})^t`)}, where ${M('t')} is the number of years since the channel launched. Which statement best interprets the value ${M(base)} in this context?`,
      correct: `The number of subscribers increases by ${r}% each year.`,
      wrong: [`The number of subscribers increases by ${base}% each year.`, `The number of subscribers increases by ${r} each year.`, `The channel had ${base} subscribers at launch.`],
      hint: 'In y = a·bᵗ, the base b is the growth factor per period. Subtract 1 to get the percent growth rate.',
      explanation: `${base} = 1 + ${r / 100}, an increase of ${r}% per year.`,
    }
  }),
  g(2, 'Rational exponents', rng => {
    const [b, p, q, v] = pick(rng, [[8, 2, 3, 4], [16, 3, 4, 8], [27, 4, 3, 81], [32, 2, 5, 4], [9, 3, 2, 27], [64, 2, 3, 16], [4, 5, 2, 32], [81, 3, 4, 27], [125, 2, 3, 25], [1000, 2, 3, 100]]) as number[]
    return {
      topic: 'Rational exponents',
      prompt: `What is the value of ${M(`${b}^{${p}/${q}}`)}?`,
      correct: T(v),
      wrong: [T(Math.round(b ** (1 / q))), T(b ** p), T((b * p) / q), T(v * 2), T(v + 1)],
      hint: `The denominator ${q} is a root; the numerator ${p} is a power.`,
      explanation: `${M(`${b}^{${p}/${q}} = (\\sqrt[${q}]{${b}})^{${p}} = ${Math.round(b ** (1 / q))}^{${p}} = ${v}`)}.`,
    }
  }),
  g(3, 'Discriminant', rng => {
    if (rng() < 0.5) {
      const b = 2 * randInt(rng, 2, 6)
      return {
        topic: 'Discriminant',
        prompt: `For what value of ${M('c')} does ${M(`x^2 + ${b}x + c = 0`)} have exactly one real solution?`,
        correct: T((b * b) / 4),
        wrong: [T(b * b), T(b / 2), T((b * b) / 2), T(b)],
        hint: 'One real solution means the discriminant b² − 4ac equals zero.',
        explanation: `${b}² − 4(1)c = 0 → c = ${(b * b) / 4}.`,
      }
    }
    const a = randInt(rng, 1, 4), b = nz(rng, 1, 7), c = nz(rng, 1, 6)
    const disc = b * b - 4 * a * c
    const ans = disc > 0 ? 'Exactly two real solutions' : disc === 0 ? 'Exactly one real solution' : 'No real solutions'
    return {
      topic: 'Discriminant',
      prompt: `How many real solutions does ${M(`${polyTex([c, b, a])} = 0`)} have?`,
      correct: ans,
      wrong: ['No real solutions', 'Exactly one real solution', 'Exactly two real solutions', 'Infinitely many real solutions'].filter(x => x !== ans),
      hint: 'Compute the discriminant b² − 4ac. Positive: two; zero: one; negative: none.',
      explanation: `${M(`b^2 - 4ac = ${disc}`)}.`,
    }
  }),
  g(3, 'Completing the square', rng => {
    const h = randInt(rng, 1, 6), c = randInt(rng, -8, 12), b = 2 * h
    const k = c - h * h
    return {
      topic: 'Completing the square',
      prompt: `The expression ${M(`x^2 + ${b}x ${sg(c)}`)} can be written in the form ${M('(x + h)^2 + k')}. What is the value of ${M('k')}?`,
      correct: T(k),
      wrong: [T(c + h * h), T(c), T(-h * h), T(h * h), T(k + 1)],
      hint: `Half of ${b} is ${h}, so (x + ${h})² = x² + ${b}x + ${h * h}. Adjust the constant.`,
      explanation: `${M(`x^2 + ${b}x ${sg(c)} = (x + ${h})^2 ${sg(c - h * h)}`)}, so k = ${k}.`,
    }
  }),
  g(3, 'Factor theorem', rng => {
    const r = randInt(rng, 2, 7), k0 = nz(rng, 1, 6)
    const m = r * r + k0 * r
    return {
      topic: 'Factor theorem',
      prompt: `In the polynomial ${M(`p(x) = x^2 + kx ${sg(-m)}`)}, ${M('k')} is a constant. If ${M(`(x - ${r})`)} is a factor of ${M('p(x)')}, what is the value of ${M('k')}?`,
      correct: T(k0),
      wrong: [T(-k0), T(k0 + 1), T(m), T(r), T(k0 - 1)],
      hint: 'If (x − r) is a factor, then p(r) = 0.',
      explanation: `${r}² + ${r}k ${sg(-m)} = 0 → k = ${k0}.`,
    }
  }),
  g(3, 'Nonlinear systems', rng => {
    const h = randInt(rng, 1, 6), s = randInt(rng, 1, 6), m = randInt(rng, 1, 9)
    const k = s * s - m
    return {
      topic: 'Nonlinear systems',
      prompt: `The graphs of ${M(`y = (x - ${h})^2 - ${m}`)} and ${M(`y = ${k}`)} intersect at two points. What is the greater ${M('x')}-coordinate of the points of intersection?`,
      correct: T(h + s),
      wrong: [T(h - s), T(s), T(h), T(h + s + 1), T(2 * h)],
      hint: `Set the two expressions equal: (x − ${h})² = ${k + m}. Then take square roots.`,
      explanation: `(x − ${h})² = ${s * s}, so x = ${h} ± ${s}; the greater is ${h + s}.`,
    }
  }),
]

const data: Gen[] = [
  ...reuse(math1, ['Percents', 'Rates & proportions', 'Statistics', 'Probability']),
  g(2, 'Unit conversion', rng => {
    const v = 15 * randInt(rng, 2, 8)
    return {
      topic: 'Unit conversion',
      prompt: `A car travels at a constant speed of ${v} miles per hour. There are 5,280 feet in a mile. At this speed, how many feet does the car travel in one second?`,
      correct: T((v * 22) / 15),
      wrong: [T(v * 5280), T((v * 5280) / 60), T(num((v * 3600) / 5280, 3)), T(v * 22)],
      hint: 'Convert miles → feet and hours → seconds (3,600 s per hour).',
      explanation: `${v}·5280 ÷ 3600 = ${(v * 22) / 15} feet per second.`,
    }
  }),
  g(3, 'Successive percent change', rng => {
    const p = pick(rng, [10, 20, 25, 30, 40, 50])
    const net = (p * p) / 100
    return {
      topic: 'Successive percent change',
      prompt: `The price of a jacket was increased by ${p}%, and then the new price was decreased by ${p}%. Compared with the original price, the final price is`,
      correct: `${num(net)}% lower than the original price.`,
      wrong: ['the same as the original price.', `${p}% lower than the original price.`, `${num(net)}% higher than the original price.`, `${2 * p}% lower than the original price.`],
      hint: 'Use a concrete original price such as $100. The second change is applied to the new price.',
      explanation: `${M(`(1 + ${p / 100})(1 - ${p / 100}) = 1 - ${net / 100}`)}: a ${num(net)}% decrease.`,
    }
  }),
  g(2, 'Mean after removal', rng => {
    const n = randInt(rng, 5, 9), m = randInt(rng, 12, 40), d = nz(rng, 1, 5)
    const x = m + (n - 1) * d
    return {
      topic: 'Mean after removal',
      prompt: `The mean of ${n} numbers is ${m}. One of the numbers, ${x}, is removed. What is the mean of the remaining ${n - 1} numbers?`,
      correct: T(m - d),
      wrong: [T(m), T(m + d), T(m - 2 * d), T(Math.round((n * m - x) / n))],
      hint: `The total is ${n}·${m}. Subtract the removed number and divide by ${n - 1}.`,
      explanation: `(${n * m} − ${x}) ÷ ${n - 1} = ${m - d}.`,
    }
  }),
  g(2, 'Standard deviation', rng => {
    const pats: number[][] = [[-2, -1, 0, 1, 2], [-4, -2, 0, 2, 4], [-1, -1, 0, 1, 1], [-6, -3, 0, 3, 6], [-3, -3, 0, 3, 3], [-1, 0, 0, 0, 1]]
    const chosen = shuffle(rng, pats).slice(0, 3)
    const mu = randInt(rng, 10, 30)
    const sd = (p: number[]) => Math.sqrt(p.reduce((s, v) => s + v * v, 0) / p.length)
    const sets = chosen.map(p => shuffle(rng, p).map(v => v + mu))
    const best = sd(chosen[0]) >= Math.max(...chosen.map(sd)) ? 0 : sd(chosen[1]) >= Math.max(...chosen.map(sd)) ? 1 : 2
    const name = 'ABC'
    return {
      topic: 'Standard deviation',
      prompt: `Three data sets each have a mean of ${mu}:\n${sets.map((s, i) => `Set ${name[i]}: ${s.join(', ')}`).join('\n')}\nWhich set has the greatest standard deviation?`,
      correct: `Set ${name[best]}`,
      wrong: [...[0, 1, 2].filter(i => i !== best).map(i => `Set ${name[i]}`), 'All three sets have the same standard deviation'],
      hint: 'Standard deviation measures how far values are from the mean. Which set is the most spread out?',
      explanation: `Set ${name[best]} has the largest deviations from ${mu}, so it has the greatest standard deviation.`,
    }
  }),
  g(2, 'Two-way tables', rng => {
    const a = randInt(rng, 12, 60), b = randInt(rng, 12, 60), c = randInt(rng, 12, 60), d = randInt(rng, 12, 60)
    const tot = a + b + c + d
    const ans = F(d, b + d)
    return {
      topic: 'Two-way tables',
      prompt: `A survey asked ${tot} students when they prefer to study.\n${pre(`           Morning  Evening\nJuniors    ${String(a).padStart(5)}    ${String(b).padStart(5)}\nSeniors    ${String(c).padStart(5)}    ${String(d).padStart(5)}`)}If one of the students who prefer evening is chosen at random, what is the probability that the student is a senior?`,
      correct: FR(d, b + d),
      wrong: [FR(d, tot), FR(d, c + d), FR(b, b + d), FR(c, a + c)],
      hint: 'The sample space is only the students who prefer the evening.',
      explanation: `${d} seniors out of ${b + d} evening-preferring students: ${M(fTex(ans))}.`,
    }
  }),
  g(2, 'Line of best fit', rng => {
    const a = randInt(rng, 40, 70), b = randInt(rng, 2, 6), x = randInt(rng, 3, 10)
    if (rng() < 0.5)
      return {
        topic: 'Line of best fit',
        prompt: `A teacher models exam score ${M('\\hat{y}')} from hours studied ${M('x')} with the line of best fit ${M(`\\hat{y} = ${a} + ${b}x`)}. What is the predicted score for a student who studies ${x} hours?`,
        correct: T(a + b * x),
        wrong: [T(b * x), T(a + x), T(a * b + x), T(a + b + x)],
        hint: 'Substitute the number of hours for x.',
        explanation: `${a} + ${b}(${x}) = ${a + b * x}.`,
      }
    return {
      topic: 'Line of best fit',
      prompt: `A teacher models exam score ${M('\\hat{y}')} from hours studied ${M('x')} with the line of best fit ${M(`\\hat{y} = ${a} + ${b}x`)}. Which statement is the best interpretation of the number ${b} in the model?`,
      correct: `For each additional hour studied, the predicted exam score increases by ${b} points.`,
      wrong: [`A student who studies 0 hours is predicted to score ${b} points.`, `The average student studies ${b} hours.`, `Studying for ${b} hours guarantees a perfect score.`],
      hint: 'In a line of best fit, the slope is the predicted change in y for each one-unit increase in x.',
      explanation: `The slope ${b} is the predicted points gained per extra hour.`,
    }
  }),
  g(2, 'Margin of error', rng => {
    const p = randInt(rng, 30, 70), e = randInt(rng, 3, 6)
    return {
      topic: 'Margin of error',
      prompt: `In a random sample of 400 residents, ${p}% supported a new park. The margin of error for this estimate is ±${e} percentage points. Which of the following is a plausible value for the percent of all residents who support the park?`,
      correct: `${p + (rng() < 0.5 ? 1 : -1)}%`,
      wrong: [`${p + e + 3}%`, `${p - e - 4}%`, `${p + 2 * e + 2}%`, `${p - 2 * e - 1}%`],
      hint: `Plausible values lie within ${e} points of ${p}%.`,
      explanation: `The plausible range is ${p - e}% to ${p + e}%.`,
    }
  }),
  g(2, 'Exponential vs. linear', rng => {
    const a = pick(rng, [2, 3, 4, 5]), r = pick(rng, [2, 3])
    const ys = [0, 1, 2, 3].map(i => a * r ** i)
    const e = (s: string) => M(`y = ${s}`)
    return {
      topic: 'Exponential vs. linear',
      prompt: `The table shows values of ${M('x')} and ${M('y')}:\n${pre(`x  0  1  2  3\ny  ${ys.join('  ')}`)}Which equation best models the relationship?`,
      correct: e(`${a}(${r})^x`),
      wrong: [e(`${a} + ${a * r - a}x`), e(`${r}(${a})^x`), e(`${a}(${r + 1})^x`)],
      hint: 'Check whether y changes by a constant amount (linear) or a constant factor (exponential).',
      explanation: `Each step multiplies y by ${r}: ${M(`y = ${a}(${r})^x`)}.`,
    }
  }),
]

const geometry: Gen[] = [
  ...reuse(math1, ['Circles', 'Geometry', 'Distance & midpoint', 'Similar triangles']),
  ...reuse(math2a, ['Trigonometry']),
  g(1, 'Radians', rng => {
    const [rad, deg] = pick<[string, number]>(rng, [['\\frac{\\pi}{6}', 30], ['\\frac{\\pi}{4}', 45], ['\\frac{\\pi}{3}', 60], ['\\frac{\\pi}{2}', 90], ['\\frac{2\\pi}{3}', 120], ['\\pi', 180], ['\\frac{3\\pi}{4}', 135]])
    return {
      topic: 'Radians',
      prompt: `An angle measures ${M(rad)} radians. What is its measure in degrees?`,
      correct: T(deg),
      wrong: [T(deg / 2), T(deg * 2), T(deg + 30), T(deg - 15 > 0 ? deg - 15 : deg + 15)],
      hint: 'π radians = 180°.',
      explanation: `${M(`${rad}\\cdot\\frac{180}{\\pi} = ${deg}^\\circ`)}.`,
    }
  }),
  g(2, 'Right-triangle trigonometry', rng => {
    const [p, q, h] = pick(rng, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]) as number[]
    if (rng() < 0.5)
      return {
        topic: 'Right-triangle trigonometry',
        prompt: `In right triangle ABC, the right angle is at C and ${M(`\\sin A = \\frac{${p}}{${h}}`)}. What is the value of ${M('\\cos B')}?`,
        correct: FR(p, h),
        wrong: [FR(q, h), FR(p, q), FR(q, p), FR(h, p)],
        hint: 'The sine of one acute angle equals the cosine of the other (they are complementary).',
        explanation: `${M('\\cos B = \\sin A')} in a right triangle, so ${M(`\\cos B = \\frac{${p}}{${h}}`)}.`,
      }
    return {
      topic: 'Right-triangle trigonometry',
      prompt: `In right triangle ABC, the right angle is at C, ${M(`AC = ${q}`)}, and ${M(`BC = ${p}`)}. What is the value of ${M('\\tan A')}?`,
      correct: FR(p, q),
      wrong: [FR(q, p), FR(p, h), FR(q, h), FR(h, q)],
      hint: 'tan A = opposite ÷ adjacent. Which side is opposite angle A?',
      explanation: `Side opposite A is BC = ${p}; adjacent is AC = ${q}: ${M(`\\tan A = \\frac{${p}}{${q}}`)}.`,
    }
  }),
  g(2, 'Arc length & sectors', rng => {
    const r = randInt(rng, 2, 12), th = pick(rng, [30, 45, 60, 90, 120, 180]), arc = rng() < 0.5
    const val = arc ? F(r * th, 180) : F(r * r * th, 360)
    const bad = arc ? [F(r * th, 360), F(2 * r * th, 180), F(r * r * th, 180), F(r * th, 90)] : [F(r * r * th, 180), F(r * th, 360), F(2 * r * r * th, 360), F(r * r * th, 720)]
    return {
      topic: 'Arc length & sectors',
      prompt: `A circle has radius ${r}. A central angle of ${th}° intercepts ${arc ? 'an arc' : 'a sector'}. What is the ${arc ? 'length of the arc' : 'area of the sector'}?`,
      correct: M(`${fTex(val)}\\pi`),
      wrong: bad.map(x => M(`${fTex(x)}\\pi`)),
      hint: arc ? 'Arc = (θ/360) · 2πr.' : 'Sector area = (θ/360) · πr².',
      explanation: arc ? `${M(`\\frac{${th}}{360}\\cdot 2\\pi(${r}) = ${fTex(val)}\\pi`)}.` : `${M(`\\frac{${th}}{360}\\cdot \\pi(${r})^2 = ${fTex(val)}\\pi`)}.`,
    }
  }),
  g(2, 'Volume & rates', rng => {
    const l = randInt(rng, 3, 8), w = randInt(rng, 2, 6), h = 2 * randInt(rng, 1, 3)
    const vol = l * w * h
    const rate = pick(rng, [2, 3, 4, 5, 6, 8, 10, 12].filter(d => vol % d === 0))
    return {
      topic: 'Volume & rates',
      prompt: `A rectangular tank is ${l} feet long, ${w} feet wide, and ${h} feet tall. Water flows into the empty tank at a constant rate of ${rate} cubic feet per minute. How many minutes will it take to fill the tank?`,
      correct: T(vol / rate),
      wrong: [T(2 * (l * w + l * h + w * h) / rate), T(vol), T(vol / rate + 2), T((l + w + h) / rate)].filter(x => x !== T(vol / rate)),
      hint: 'Volume = length × width × height. Then divide by the flow rate.',
      explanation: `${l}·${w}·${h} = ${vol} ft³; ${vol} ÷ ${rate} = ${vol / rate} minutes.`,
    }
  }),
  g(3, 'Circle equations', rng => {
    const h = nz(rng, 1, 6), k = nz(rng, 1, 6), r = randInt(rng, 2, 9)
    const rhs = r * r - h * h - k * k
    return {
      topic: 'Circle equations',
      prompt: `The equation ${M(`x^2 + y^2 ${sg(-2 * h)}x ${sg(-2 * k)}y = ${rhs}`)} represents a circle in the xy-plane. What is the radius of the circle?`,
      correct: T(r),
      wrong: [T(r * r), T(r + 2), T(r - 1), T(Math.abs(rhs)), T(Math.abs(h) + Math.abs(k))].filter(x => x !== T(r)),
      hint: 'Complete the square in both x and y to reach (x − h)² + (y − k)² = r².',
      explanation: `${M(`${fac('x', h)}^2 + ${fac('y', k)}^2 = ${rhs} + ${h * h} + ${k * k} = ${r * r}`)}, so r = ${r}.`,
    }
  }),
]

export const satMath: Gen[] = [...dom('Algebra', algebra), ...dom('Advanced Math', advanced), ...dom('Problem-Solving & Data Analysis', data), ...dom('Geometry & Trigonometry', geometry)]
