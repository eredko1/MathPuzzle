import type { Gen } from '../types'
import { F, M, fAdd, fMul, fSub, fTex, fVal, nearby, numDeriv, numInt, nz, pick, polyDeriv, polyEval, polyTex, randInt } from '../util'

const T = (x: number) => M(String(x))
const FR = (n: number, d = 1) => M(fTex(F(n, d)))
const g = (level: 1 | 2 | 3, topic: string, make: Gen['make']): Gen => ({ level, topic, make })
const sg = (v: number) => `${v < 0 ? '-' : '+'} ${Math.abs(v)}`
const co = (v: number) => (v === 1 ? '' : String(v))

/** Calc 1 / AP Calculus AB & BC. */
export const calc1: Gen[] = [
  g(2, 'Derivatives', rng => {
    const c = [nz(rng, 1, 9), nz(rng, 1, 9), nz(rng, 1, 6), nz(rng, 1, 4)], k = randInt(rng, -3, 4)
    const ans = polyEval(polyDeriv(c), k)
    const f = (x: number) => polyEval(c, x)
    return {
      topic: 'Derivatives',
      prompt: `If ${M(`f(x) = ${polyTex(c)}`)}, what is ${M(`f'(${k})`)}?`,
      correct: T(ans),
      wrong: [T(f(k)), T(polyEval(polyDeriv(polyDeriv(c)), k)), T(polyEval(polyDeriv(c), k + 1)), T(-ans), ...nearby(rng, ans, [], T)],
      hint: 'Power rule: the derivative of aₙxⁿ is n·aₙxⁿ⁻¹. Differentiate, then plug in.',
      explanation: `${M(`f'(x) = ${polyTex(polyDeriv(c))}`)}, so ${M(`f'(${k}) = ${ans}`)}.`,
      check: [ans, numDeriv(f, k)],
    }
  }),
  g(2, 'Chain rule', rng => {
    const a = randInt(rng, 2, 5), b = nz(rng, 1, 6), n = randInt(rng, 2, 5), k = randInt(rng, 0, 3)
    const inner = a * k + b
    const ans = n * a * inner ** (n - 1)
    return {
      topic: 'Chain rule',
      prompt: `Let ${M(`f(x) = (${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)})^{${n}}`)}. Find ${M(`f'(${k})`)}.`,
      correct: T(ans),
      wrong: [T(n * inner ** (n - 1)), T(inner ** n), T(n * a * inner ** n), T(a * inner ** (n - 1)), ...nearby(rng, ans, [], T)],
      hint: 'Outer derivative times inner derivative — don\'t forget the factor from the inside.',
      explanation: `${M(`f'(x) = ${n}(${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)})^{${n - 1}}\\cdot ${a}`)}. At x = ${k}: ${ans}.`,
      check: [ans, numDeriv(x => (a * x + b) ** n, k)],
    }
  }),
  g(2, 'Product rule', rng => {
    const a = nz(rng, 1, 5), b = nz(rng, 1, 5), m = randInt(rng, 2, 4), n = randInt(rng, 2, 4), k = randInt(rng, -2, 3)
    const f = (x: number) => (x ** m + a) * (x ** n + b)
    const ans = m * k ** (m - 1) * (k ** n + b) + (k ** m + a) * n * k ** (n - 1)
    return {
      topic: 'Product rule',
      prompt: `If ${M(`f(x) = (x^{${m}} ${sg(a)})(x^{${n}} ${sg(b)})`)}, what is ${M(`f'(${k})`)}?`,
      correct: T(ans),
      wrong: [T(m * k ** (m - 1) * n * k ** (n - 1)), T(f(k)), T(m * k ** (m - 1) * (k ** n + b)), T(ans + k), ...nearby(rng, ans, [], T)],
      hint: '(uv)′ = u′v + uv′. Evaluate each piece at the given x.',
      explanation: `${M(`f'(${k}) = u'v + uv' = ${m * k ** (m - 1)}(${k ** n + b}) + (${k ** m + a})(${n * k ** (n - 1)}) = ${ans}`)}.`,
      check: [ans, numDeriv(f, k)],
    }
  }),
  g(2, 'Quotient rule', rng => {
    const p = randInt(rng, 2, 4), a = randInt(rng, 1, 4), k = randInt(rng, 1, 3)
    const f = (x: number) => x ** p / (x + a)
    const ans = F(p * k ** (p - 1) * (k + a) - k ** p, (k + a) ** 2)
    return {
      topic: 'Quotient rule',
      prompt: `If ${M(`f(x) = \\dfrac{x^{${p}}}{x + ${a}}`)}, what is ${M(`f'(${k})`)}?`,
      correct: M(fTex(ans)),
      wrong: [FR(p * k ** (p - 1), 1), FR(p * k ** (p - 1) * (k + a) + k ** p, (k + a) ** 2), FR(k ** p - p * k ** (p - 1) * (k + a), (k + a) ** 2), FR(p * k ** (p - 1), k + a)],
      hint: '(u/v)′ = (u′v − uv′) / v².',
      explanation: `${M(`f'(x) = \\frac{${p}x^{${p - 1}}(x+${a}) - x^{${p}}}{(x+${a})^2}`)}. At ${k}: ${M(fTex(ans))}.`,
      check: [fVal(ans), numDeriv(f, k)],
    }
  }),
  g(2, 'Derivative rules', rng => {
    const a = randInt(rng, 2, 6)
    const forms: [string, string, string[]][] = [
      [`\\sin(${a}x)`, `${a}\\cos(${a}x)`, [`\\cos(${a}x)`, `-${a}\\cos(${a}x)`, `${a}\\sin(${a}x)`]],
      [`e^{${a}x}`, `${a}e^{${a}x}`, [`e^{${a}x}`, `${a}xe^{${a}x-1}`, `e^{${a}}`]],
      [`\\ln(${a}x)`, `\\frac1x`, [`\\frac{1}{${a}x}`, `\\frac{${a}}{x}`, `${a}\\ln x`]],
      [`\\cos(${a}x)`, `-${a}\\sin(${a}x)`, [`${a}\\sin(${a}x)`, `-\\sin(${a}x)`, `-${a}\\cos(${a}x)`]],
      [`\\tan x`, `\\sec^2 x`, [`\\sec x\\tan x`, `\\cot x`, `-\\csc^2 x`]],
      [`x^{${a}}`, `${a}x^{${a - 1}}`, [`x^{${a - 1}}`, `${a}x^{${a}}`, `${a - 1}x^{${a}}`]],
      [`${a}^x`, `${a}^x\\ln ${a}`, [`x${a}^{x-1}`, `${a}^x`, `\\frac{${a}^x}{\\ln ${a}}`]],
      [`\\arctan x`, `\\frac{1}{1+x^2}`, [`\\frac{1}{\\sqrt{1-x^2}}`, `\\frac{-1}{1+x^2}`, `\\sec^2 x`]],
    ]
    const [f, d, bad] = pick(rng, forms)
    return {
      topic: 'Derivative rules',
      prompt: `What is the derivative of ${M(`f(x) = ${f}`)}?`,
      correct: M(d),
      wrong: bad.map(M),
      hint: 'Recall the standard derivative, then multiply by the derivative of the inside.',
      explanation: `${M(`\\frac{d}{dx}\\left[${f}\\right] = ${d}`)}.`,
    }
  }),
  g(2, 'Implicit differentiation', rng => {
    const [x, y, r] = pick(rng, [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 6, 10]])
    const sx = rng() < 0.5 ? 1 : -1
    return {
      topic: 'Implicit differentiation',
      prompt: `Find ${M('\\frac{dy}{dx}')} at the point ${M(`(${sx * x}, ${y})`)} on the circle ${M(`x^2 + y^2 = ${r * r}`)}.`,
      correct: FR(-sx * x, y),
      wrong: [FR(sx * x, y), FR(y, sx * x), FR(-y, sx * x), FR(sx * x, -y)].concat([FR(-sx * x, y + 1)]),
      hint: 'Differentiate both sides with respect to x: 2x + 2y·y′ = 0.',
      explanation: `${M(`y' = -\\frac{x}{y} = ${fTex(F(-sx * x, y))}`)}.`,
    }
  }),
  g(2, 'Limits', rng => {
    const kind = pick(rng, ['factor', 'trig', 'inf'] as const)
    if (kind === 'factor') {
      const a = randInt(rng, 1, 9), b = randInt(rng, 2, 6), neg = rng() < 0.5
      const p = neg ? -a : a
      return {
        topic: 'Limits',
        prompt: `Evaluate ${M(`\\lim_{x\\to ${p}} \\dfrac{x^2 - ${a * a}}{x ${neg ? '+' : '-'} ${a}}`)}.`,
        correct: T(2 * p),
        wrong: [T(p), T(a * a), T(-2 * p), T(2 * p + b), 'The limit does not exist'],
        hint: 'Factor the numerator as a difference of squares and cancel the common factor.',
        explanation: `${M(`\\frac{(x-${a})(x+${a})}{x ${neg ? '+' : '-'} ${a}} = x ${neg ? '-' : '+'} ${a}`)} for x ≠ ${p}, which tends to ${2 * p}.`,
      }
    }
    if (kind === 'trig') {
      const a = randInt(rng, 2, 9), b = randInt(rng, 2, 9)
      const r = F(a, b)
      return {
        topic: 'Limits',
        prompt: `Evaluate ${M(`\\lim_{x\\to 0} \\dfrac{\\sin(${a}x)}{${b}x}`)}.`,
        correct: FR(a, b),
        wrong: [FR(b, a), FR(1, 1), FR(0, 1), FR(a * b, 1), FR(a + b, 1)],
        hint: 'Use lim sin(u)/u = 1 as u → 0, after matching the argument.',
        explanation: `${M(`\\frac{\\sin(${a}x)}{${b}x} = \\frac{${a}}{${b}}\\cdot\\frac{\\sin(${a}x)}{${a}x} \\to ${fTex(r)}`)}.`,
      }
    }
    const a = randInt(rng, 2, 9), b = randInt(rng, 2, 9)
    return {
      topic: 'Limits',
      prompt: `Evaluate ${M(`\\lim_{x\\to\\infty} \\dfrac{${a}x^2 + 3x}{${b}x^2 - 5}`)}.`,
      correct: FR(a, b),
      wrong: [FR(b, a), M('\\infty'), FR(0, 1), FR(a + 3, b - 5 || 1)],
      hint: 'Divide top and bottom by the highest power of x.',
      explanation: `Equal degrees → ratio of leading coefficients, ${M(fTex(F(a, b)))}.`,
    }
  }),
  g(2, 'Definite integrals', rng => {
    const c = [randInt(rng, 1, 5), randInt(rng, 0, 6), randInt(rng, 1, 6)], k = randInt(rng, 1, 4)
    let val = F(0)
    for (let p = 1; p <= c.length; p++) val = fAdd(val, F(c[p - 1] * k ** p, p))
    return {
      topic: 'Definite integrals',
      prompt: `Evaluate ${M(`\\int_0^{${k}} (${polyTex(c)})\\,dx`)}.`,
      correct: M(fTex(val)),
      wrong: [
        M(fTex(F(polyEval(c, k)))),
        M(fTex(F(polyEval(polyDeriv(c), k)))),
        M(fTex(fAdd(val, F(c[0])))),
        M(fTex(fMul(val, F(2)))),
      ],
      hint: 'Antiderivative of xⁿ is xⁿ⁺¹/(n+1). Evaluate at the top limit (the bottom is 0).',
      explanation: `Integrate term by term and evaluate at x = ${k} (the lower limit 0 contributes nothing): ${M(fTex(val))}.`,
      check: [fVal(val), numInt(x => polyEval(c, x), 0, k)],
    }
  }),
  g(2, 'u-substitution', rng => {
    const n = randInt(rng, 2, 4), m = randInt(rng, 1, 3)
    const val = F(m * (2 ** (n + 1) - 1), 2 * (n + 1))
    return {
      topic: 'u-substitution',
      prompt: `Evaluate ${M(`\\int_0^1 ${co(m)}x(x^2 + 1)^{${n}}\\,dx`)}.`,
      correct: M(fTex(val)),
      wrong: [FR(m * (2 ** (n + 1) - 1), n + 1), FR(m * 2 ** n, 2 * n), FR(m * (2 ** n - 1), 2 * n), FR(m * (3 ** (n + 1) - 1), 2 * (n + 1)), FR(m, 2 * (n + 1))],
      hint: 'Let u = x² + 1, so du = 2x dx. Change the limits too (0→1 becomes 1→2).',
      explanation: `${M(`\\frac{${m}}{2}\\int_1^2 u^{${n}}du = \\frac{${m}}{2}\\cdot\\frac{2^{${n + 1}}-1}{${n + 1}} = ${fTex(val)}`)}.`,
      check: [fVal(val), numInt(x => m * x * (x * x + 1) ** n, 0, 1)],
    }
  }),
  g(2, 'Fundamental theorem', rng => {
    const a = randInt(rng, 1, 6), k = randInt(rng, 1, 4)
    const ans = 2 * k * (k * k + a)
    return {
      topic: 'Fundamental theorem',
      prompt: `Let ${M(`G(x) = \\int_1^{x^2} (t + ${a})\\,dt`)}. What is ${M(`G'(${k})`)}?`,
      correct: T(ans),
      wrong: [T(k * k + a), T(k * (k * k + a)), T(2 * k * (k + a)), T(ans + k)],
      hint: 'FTC plus chain rule: G′(x) = f(upper limit) × (upper limit)′.',
      explanation: `${M(`G'(x) = (x^2 + ${a})\\cdot 2x`)}. At x = ${k}: ${ans}.`,
      check: [ans, numDeriv(x => numInt(t => t + a, 1, x * x), k, 1e-3)],
    }
  }),
  g(2, 'Average value', rng => {
    const b = randInt(rng, 2, 6), p = randInt(rng, 1, 3)
    const val = F(b ** p, p + 1)
    return {
      topic: 'Average value',
      prompt: `What is the average value of ${M(`f(x) = x^{${p}}`)} on the interval ${M(`[0, ${b}]`)}?`,
      correct: M(fTex(val)),
      wrong: [FR(b ** (p + 1), p + 1), FR(b ** p, 1), FR(b ** (p + 1), (p + 1) * b * 2), FR(b ** p, p + 2)],
      hint: 'Average value = (1 / (b − a)) × ∫ f.',
      explanation: `${M(`\\frac1{${b}}\\cdot\\frac{${b}^{${p + 1}}}{${p + 1}} = ${fTex(val)}`)}.`,
      check: [fVal(val), numInt(x => x ** p, 0, b) / b],
    }
  }),
  g(2, 'Tangent lines', rng => {
    const a = nz(rng, 1, 6), k = randInt(rng, -3, 4)
    const m = 2 * k + a, y0 = k * k + a * k, c = y0 - m * k
    const eq = (m_: number, c_: number) => M(`y = ${polyTex([c_, m_])}`)
    return {
      topic: 'Tangent lines',
      prompt: `What is the equation of the tangent line to ${M(`y = ${polyTex([0, a, 1])}`)} at ${M(`x = ${k}`)}?`,
      correct: eq(m, c),
      wrong: [eq(a, c), eq(m, y0), eq(k * k + a * k, c), eq(m + 1, c - k), eq(m + 2, c), eq(-m, c), eq(m, c + 3), eq(m, -c + 1), eq(m - 2, c + 1)],
      hint: 'Slope = y′ at that x. Then use point–slope form through (k, y(k)).',
      explanation: `${M(`y' = 2x ${sg(a)}`)} → slope ${m}; point ${M(`(${k},${y0})`)}. Line: ${eq(m, c)}.`,
    }
  }),
  g(2, 'Optimization', rng => {
    const kind = pick(rng, ['perim', 'fence'] as const)
    if (kind === 'perim') {
      const p = 4 * randInt(rng, 3, 15)
      return {
        topic: 'Optimization',
        prompt: `A rectangle has perimeter ${p}. What is the largest possible area?`,
        correct: T((p / 4) ** 2),
        wrong: [T((p / 2) ** 2), T(p * p / 8), T((p / 4) * (p / 4 + 1)), T(p * p / 16 / 2)],
        hint: 'Express area in one variable using the perimeter, then find the vertex of the parabola.',
        explanation: `Maximum occurs for a square of side ${p / 4}, area ${(p / 4) ** 2}.`,
      }
    }
    const L = 4 * randInt(rng, 3, 12)
    return {
      topic: 'Optimization',
      prompt: `A farmer has ${L} m of fence for three sides of a rectangular pen; the fourth side is a river. What is the maximum area?`,
      correct: T((L * L) / 8),
      wrong: [T((L / 4) ** 2), T((L / 3) ** 2), T((L * L) / 16), T((L * L) / 4)],
      hint: 'Let the two equal sides be x; the third is L − 2x. Maximize x(L − 2x).',
      explanation: `x = L/4 = ${L / 4}, so area = ${L / 4} × ${L / 2} = ${(L * L) / 8}.`,
    }
  }),
  g(2, 'Related rates', rng => {
    const r = randInt(rng, 2, 9), dr = randInt(rng, 1, 4)
    const sphere = rng() < 0.5
    return {
      topic: 'Related rates',
      prompt: sphere
        ? `The radius of a sphere increases at ${dr} cm/s. How fast is its volume increasing (in cm³/s) when the radius is ${r} cm?`
        : `The radius of a circle increases at ${dr} cm/s. How fast is its area increasing (in cm²/s) when the radius is ${r} cm?`,
      correct: M(sphere ? `${4 * r * r * dr}\\pi` : `${2 * r * dr}\\pi`),
      wrong: sphere
        ? [M(`${r * r * dr}\\pi`), M(`${Math.round((4 * r ** 3) / 3)}\\pi`), M(`${8 * r * dr}\\pi`)]
        : [M(`${r * r * dr}\\pi`), M(`${r * r}\\pi`), M(`${2 * r}\\pi`), M(`${r * dr}\\pi`)],
      hint: sphere ? 'Differentiate V = (4/3)πr³ with respect to t.' : 'Differentiate A = πr² with respect to t.',
      explanation: sphere ? `${M(`dV/dt = 4\\pi r^2\\,dr/dt = ${4 * r * r * dr}\\pi`)}.` : `${M(`dA/dt = 2\\pi r\\,dr/dt = ${2 * r * dr}\\pi`)}.`,
    }
  }),
  g(2, 'Motion', rng => {
    const a = randInt(rng, 1, 5), b = a + 2 * randInt(rng, 1, 3), k = randInt(rng, 1, 5)
    const s = [0, 3 * a * b, (-3 * (a + b)) / 2, 1]
    const acc = 6 * k - 3 * (a + b)
    return {
      topic: 'Motion',
      prompt: `A particle's position is ${M(`s(t) = ${polyTex(s, 't')}`)}. What is its acceleration at ${M(`t = ${k}`)}?`,
      correct: T(acc),
      wrong: [T(polyEval(polyDeriv(s), k)), T(6 * k), T(acc + 3), T(-acc)],
      hint: 'Acceleration is the second derivative of position.',
      explanation: `${M(`s''(t) = ${polyTex(polyDeriv(polyDeriv(s)), 't')}`)}; at t = ${k} that is ${acc}.`,
      check: [acc, numDeriv(t => numDeriv(x => polyEval(s, x), t, 1e-3), k, 1e-3)],
    }
  }),
  g(2, 'Area between curves', rng => {
    const k = randInt(rng, 2, 8)
    const val = F(k ** 3, 6)
    return {
      topic: 'Area between curves',
      prompt: `What is the area of the region bounded by ${M(`y = x^2`)} and ${M(`y = ${k}x`)}?`,
      correct: M(fTex(val)),
      wrong: [FR(k ** 3, 3), FR(k ** 3, 2), FR(k ** 2, 2), FR(k ** 3, 4)],
      hint: 'Find the intersections (x = 0 and x = k), then integrate (top − bottom).',
      explanation: `${M(`\\int_0^{${k}}(${k}x - x^2)dx = \\frac{${k}^3}{2} - \\frac{${k}^3}{3} = ${fTex(val)}`)}.`,
      check: [fVal(val), numInt(x => k * x - x * x, 0, k)],
    }
  }),
  g(2, 'Volumes of revolution', rng => {
    const k = randInt(rng, 1, 4), n = randInt(rng, 1, 3)
    const val = F(k ** (2 * n + 1), 2 * n + 1)
    return {
      topic: 'Volumes of revolution',
      prompt: `The region under ${M(`y = x^{${n}}`)} from ${M(`x = 0`)} to ${M(`x = ${k}`)} is revolved about the x-axis. What is the volume?`,
      correct: M(`${fTex(val)}\\pi`),
      wrong: [M(`${fTex(F(k ** (n + 1), n + 1))}\\pi`), M(`${fTex(F(2 * k ** (2 * n + 1), 2 * n + 1))}\\pi`), M(`${fTex(val)}`), M(`${fTex(F(k ** (2 * n), 2 * n))}\\pi`)],
      hint: 'Disk method: V = π∫ [f(x)]² dx.',
      explanation: `${M(`\\pi\\int_0^{${k}} x^{${2 * n}}dx = \\pi\\frac{${k}^{${2 * n + 1}}}{${2 * n + 1}}`)}.`,
      check: [fVal(val) * Math.PI, Math.PI * numInt(x => x ** (2 * n), 0, k)],
    }
  }),
  g(2, 'Euler’s method', rng => {
    const a = randInt(rng, 1, 3), b = randInt(rng, 1, 2), y0 = randInt(rng, 1, 3), h = pick(rng, [F(1, 2), F(1)])
    let x = F(0), y = F(y0)
    for (let i = 0; i < 2; i++) {
      const slope = fAdd(fMul(F(a), x), fMul(F(b), y))
      y = fAdd(y, fMul(h, slope))
      x = fAdd(x, h)
    }
    const y1 = fAdd(F(y0), fMul(h, F(b * y0)))
    return {
      topic: 'Euler’s method',
      prompt: `Given ${M(`\\frac{dy}{dx} = ${co(a)}x + ${co(b)}y`)} with ${M(`y(0) = ${y0}`)}, use Euler's method with step size ${M(`h = ${fTex(h)}`)} to approximate ${M(`y(${fTex(x)})`)} (two steps).`,
      correct: M(fTex(y)),
      wrong: [M(fTex(y1)), M(fTex(fAdd(y, F(1)))), M(fTex(fSub(y, h))), M(fTex(fMul(y, F(2))))],
      hint: 'Each step: y_new = y_old + h·(dy/dx at the old point).',
      explanation: `Step by step: start (0, ${y0}); two steps of size ${fTex(h)} give ${M(`y \\approx ${fTex(y)}`)}.`,
    }
  }),
  g(2, 'Mean Value Theorem', rng => {
    const a = randInt(rng, -4, 2), w = 2 * randInt(rng, 1, 4), b = a + w, k = nz(rng, 1, 3)
    return {
      topic: 'Mean Value Theorem',
      prompt: `For ${M(`f(x) = x^2 ${k < 0 ? '-' : '+'} ${Math.abs(k)}x`)} on ${M(`[${a}, ${b}]`)}, the Mean Value Theorem guarantees a point ${M('c')} where ${M("f'(c)")} equals the average slope. What is ${M('c')}?`,
      correct: T((a + b) / 2),
      wrong: [T(a), T(b), T((a + b) / 2 + k), T(((a + b) / 2) * 2)].filter(s => s !== T((a + b) / 2)),
      hint: 'Average slope = (f(b) − f(a)) / (b − a). Set f′(c) equal to it.',
      explanation: `For a quadratic the MVT point is the midpoint: ${(a + b) / 2}.`,
    }
  }),
  g(2, 'Concavity', rng => {
    const b3 = 3 * (randInt(rng, 1, 4) * (rng() < 0.5 ? 1 : -1)), c = nz(rng, 1, 9)
    return {
      topic: 'Concavity',
      prompt: `At what ${M('x')} does ${M(`f(x) = x^3 ${sg(b3)}x^2 ${sg(c)}x`)} have an inflection point?`,
      correct: T(-b3 / 3),
      wrong: [T(b3 / 3), T(-b3), T(-b3 / 6), T(-c / 3)],
      hint: 'Inflection points occur where f″ changes sign — set f″(x) = 0.',
      explanation: `${M(`f''(x) = 6x ${sg(2 * b3)}`)} → ${M(`x = ${-b3 / 3}`)}.`,
    }
  }),
  g(2, 'Extrema', rng => {
    const a = randInt(rng, 1, 5), c = randInt(rng, -9, 9)
    return {
      topic: 'Extrema',
      prompt: `For ${M(`f(x) = x^3 - ${3 * a}x^2 ${sg(c)}`)}, at which ${M('x')} does ${M('f')} have a local minimum?`,
      correct: T(2 * a),
      wrong: [T(0), T(a), T(3 * a), T(-2 * a)],
      hint: 'Find f′(x) = 0, then use the second derivative test to tell max from min.',
      explanation: `${M(`f'(x) = 3x(x - ${2 * a})`)}: critical points 0 and ${2 * a}. ${M(`f''(${2 * a}) > 0`)} → local min at ${2 * a}.`,
    }
  }),
]

