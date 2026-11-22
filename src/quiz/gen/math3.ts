import type { Gen } from '../types'
import { F, M, fAdd, fMul, fSub, fTex, fVal, fact, nearby, numDeriv, numInt, nz, pick, randInt } from '../util'

const T = (x: number) => M(String(x))
const FR = (n: number, d = 1) => M(fTex(F(n, d)))
const g = (level: 1 | 2 | 3, topic: string, make: Gen['make']): Gen => ({ level, topic, make })
const co = (v: number) => (v === 1 ? '' : v === -1 ? '-' : String(v))
const sg = (v: number) => `${v < 0 ? '-' : '+'} ${Math.abs(v)}`

/** Calc 2, multivariable (Calc 3), vector calculus, linear algebra, ODEs (Calc 4), probability. */
export const upper: Gen[] = [
  // ---------- Calc 2 ----------
  g(3, 'Integration by parts', rng => {
    const table: [string, string, string[]][] = [
      ['\\int_0^{\\pi} x\\sin x\\,dx', '\\pi', ['-\\pi', '0', '2', '1']],
      ['\\int_0^{\\pi} x\\cos x\\,dx', '-2', ['2', '0', '\\pi', '-\\pi']],
      ['\\int_0^1 x e^{x}\\,dx', '1', ['e', 'e-1', '0', '\\frac12']],
      ['\\int_1^{e} \\ln x\\,dx', '1', ['e', 'e-1', '0', '\\frac1e']],
      ['\\int_1^{e} x\\ln x\\,dx', '\\frac{e^2+1}{4}', ['\\frac{e^2-1}{4}', '\\frac{e^2}{2}', '\\frac{e^2+1}{2}', '1']],
      ['\\int_0^1 x e^{-x}\\,dx', '1-\\frac2e', ['1-\\frac1e', '\\frac2e-1', '1', '\\frac1e']],
      ['\\int_0^{1} \\arctan x\\,dx', '\\frac{\\pi}{4}-\\frac{\\ln 2}{2}', ['\\frac{\\pi}{4}', '\\frac{\\pi}{4}+\\frac{\\ln 2}{2}', '\\ln 2', '\\frac{\\pi}{2}-\\ln 2']],
    ]
    const [q, a, w] = pick(rng, table)
    return {
      topic: 'Integration by parts',
      prompt: `Evaluate ${M(q)}.`,
      correct: M(a),
      wrong: w.map(M),
      hint: 'Use ∫u dv = uv − ∫v du. Choose u to be the factor that gets simpler when differentiated (LIATE).',
      explanation: `Integration by parts gives ${M(a)}.`,
    }
  }),
  g(3, 'Partial fractions', rng => {
    const a = randInt(rng, 1, 6), b = a + randInt(rng, 1, 5)
    const A = F(1, a - b)
    return {
      topic: 'Partial fractions',
      prompt: `Write ${M(`\\dfrac{1}{(x-${a})(x-${b})} = \\dfrac{A}{x-${a}} + \\dfrac{B}{x-${b}}`)}. What is ${M('A')}?`,
      correct: M(fTex(A)),
      wrong: [FR(1, b - a), FR(1, a), FR(1, b), FR(a - b, 1), FR(b, a - b)],
      hint: 'Cover-up method: set x = a in everything except the (x − a) factor.',
      explanation: `${M(`A = \\frac{1}{${a}-${b}} = ${fTex(A)}`)}.`,
    }
  }),
  g(3, 'Improper integrals', rng => {
    const kind = pick(rng, ['inf', 'zero'] as const)
    if (kind === 'inf') {
      const p = randInt(rng, 2, 6)
      return {
        topic: 'Improper integrals',
        prompt: `Evaluate ${M(`\\int_1^{\\infty} x^{-${p}}\\,dx`)}.`,
        correct: FR(1, p - 1),
        wrong: [FR(1, p), M('\\infty'), FR(-1, p - 1), FR(1, p + 1)],
        hint: 'Compute ∫₁ᵇ and take b → ∞. It converges when the power is below −1.',
        explanation: `${M(`\\left[\\frac{x^{${1 - p}}}{${1 - p}}\\right]_1^\\infty = \\frac{1}{${p - 1}}`)}.`,
      }
    }
    const q = randInt(rng, 2, 5)
    return {
      topic: 'Improper integrals',
      prompt: `Evaluate ${M(`\\int_0^1 x^{-1/${q}}\\,dx`)}.`,
      correct: FR(q, q - 1),
      wrong: [M('\\infty'), FR(q - 1, q), FR(1, q - 1), FR(q, q + 1)],
      hint: 'The exponent −1/q is greater than −1, so it converges. Integrate and evaluate with a limit at 0.',
      explanation: `${M(`\\left[\\frac{x^{1-1/${q}}}{1-1/${q}}\\right]_0^1 = \\frac{${q}}{${q - 1}}`)}.`,
    }
  }),
  g(3, 'Series convergence', rng => {
    const a = randInt(rng, 2, 5), p = randInt(rng, 2, 4)
    const items: [string, boolean][] = [
      [`\\sum \\frac{1}{n^{${p}}}`, true],
      [`\\sum \\frac{1}{\\sqrt[${p}]{n}}`, false],
      [`\\sum \\frac{${a}^n}{n!}`, true],
      [`\\sum \\frac{n}{${a}^n}`, true],
      [`\\sum \\left(\\frac{${a + 1}}{${a}}\\right)^n`, false],
      [`\\sum \\frac{1}{n}`, false],
      [`\\sum \\frac{n!}{${a}^n}`, false],
      [`\\sum (-1)^n\\frac{1}{n}`, true],
    ]
    const conv = items.filter(i => i[1]), div = items.filter(i => !i[1])
    const ask = rng() < 0.5
    const pickOne = pick(rng, ask ? conv : div)
    const others = ask ? div : conv
    const dist = [...others].sort(() => rng() - 0.5).slice(0, 3)
    return {
      topic: 'Series convergence',
      prompt: `Which of the following series ${ask ? 'converges' : 'diverges'}?`,
      correct: M(pickOne[0]),
      wrong: dist.map(d => M(d[0])),
      hint: 'Think p-series, ratio test, and the alternating series test.',
      explanation: `${M(pickOne[0])} ${ask ? 'converges' : 'diverges'} (p-series / ratio test / alternating series test).`,
    }
  }),
  g(3, 'Radius of convergence', rng => {
    const a = randInt(rng, 2, 9), kind = pick(rng, ['n', 'n2', 'fact'] as const)
    const term = kind === 'n' ? `\\frac{x^n}{${a}^n}` : kind === 'n2' ? `\\frac{x^n}{n^2\\, ${a}^n}` : `\\frac{n!\\,x^n}{${a}^n}`
    const R = kind === 'fact' ? '0' : String(a)
    return {
      topic: 'Radius of convergence',
      prompt: `What is the radius of convergence of ${M(`\\sum_{n=1}^{\\infty} ${term}`)}?`,
      correct: M(R),
      wrong: [M(kind === 'fact' ? String(a) : '0'), M(`\\frac1{${a}}`), M('\\infty'), M(String(a * a))].filter(s => s !== M(R)),
      hint: 'Use the ratio test: |aₙ₊₁/aₙ| → L|x|, then solve L|x| < 1.',
      explanation: kind === 'fact' ? `The n! makes the ratio grow like n, so it only converges at x = 0 → R = 0.` : `The ratio tends to |x|/${a}, so converges for |x| < ${a}: R = ${a}.`,
    }
  }),
  g(3, 'Taylor series', rng => {
    const a = randInt(rng, 2, 4), n = randInt(rng, 2, 5)
    const kind = pick(rng, ['exp', 'sin', 'geom', 'ln'] as const)
    if (kind === 'exp')
      return {
        topic: 'Taylor series',
        prompt: `What is the coefficient of ${M(`x^{${n}}`)} in the Maclaurin series of ${M(`e^{${a}x}`)}?`,
        correct: FR(a ** n, fact(n)),
        wrong: [FR(1, fact(n)), FR(a, fact(n)), FR(a ** n, n), FR(a ** n, fact(n - 1))],
        hint: 'Substitute ax into e^u = Σ uⁿ/n!.',
        explanation: `${M(`\\frac{(${a}x)^{${n}}}{${n}!}`)} → coefficient ${M(`\\frac{${a ** n}}{${fact(n)}}`)} (reduced).`,
      }
    if (kind === 'sin') {
      const m = pick(rng, [3, 5]), sgn = m === 3 ? -1 : 1
      return {
        topic: 'Taylor series',
        prompt: `What is the coefficient of ${M(`x^{${m}}`)} in the Maclaurin series of ${M(`\\sin(${a}x)`)}?`,
        correct: FR(sgn * a ** m, fact(m)),
        wrong: [FR(-sgn * a ** m, fact(m)), FR(sgn, fact(m)), FR(sgn * a ** m, m), FR(sgn * a, fact(m))],
        hint: 'sin u = u − u³/3! + u⁵/5! − …, with u = ax.',
        explanation: `${M(`\\frac{${sgn < 0 ? '-' : ''}(${a})^{${m}}}{${m}!}`)}.`,
      }
    }
    if (kind === 'geom')
      return {
        topic: 'Taylor series',
        prompt: `What is the coefficient of ${M(`x^{${n}}`)} in the Maclaurin series of ${M(`\\dfrac{1}{1-${a}x}`)}?`,
        correct: T(a ** n),
        wrong: [T(a), T(a * n), T(a ** n / fact(n)), T(n ** a)].filter(s => s !== T(a ** n)),
        hint: 'This is a geometric series with ratio ax.',
        explanation: `${M(`\\sum (${a}x)^n`)} so the coefficient is ${a ** n}.`,
      }
    return {
      topic: 'Taylor series',
      prompt: `What is the coefficient of ${M(`x^{${n}}`)} in the Maclaurin series of ${M('\\ln(1+x)')}?`,
      correct: FR(n % 2 ? 1 : -1, n),
      wrong: [FR(n % 2 ? -1 : 1, n), FR(n % 2 ? 1 : -1, fact(n)), FR(1, 1), FR(n % 2 ? 1 : -1, n - 1)],
      hint: 'ln(1+x) = x − x²/2 + x³/3 − …',
      explanation: `The terms are ${M('\\frac{(-1)^{n+1}}{n}x^n')}.`,
    }
  }),
  g(3, 'Parametric curves', rng => {
    const a = randInt(rng, 1, 4), b = randInt(rng, 1, 5), k = randInt(rng, 1, 3)
    const ans = F(3 * b * k, 2 * a)
    return {
      topic: 'Parametric curves',
      prompt: `A curve is given by ${M(`x = ${co(a)}t^2`)}, ${M(`y = ${co(b)}t^3`)}. What is ${M('\\frac{dy}{dx}')} at ${M(`t = ${k}`)}?`,
      correct: M(fTex(ans)),
      wrong: [FR(2 * a, 3 * b * k), FR(3 * b * k * k, 2 * a * k), FR(3 * b * k, a), FR(3 * b * k * k, 2 * a)],
      hint: 'dy/dx = (dy/dt) / (dx/dt).',
      explanation: `${M(`\\frac{${3 * b}t^2}{${2 * a}t} = \\frac{${3 * b}t}{${2 * a}}`)} → at t=${k}: ${M(fTex(ans))}.`,
      check: [fVal(ans), numDeriv(t => b * t ** 3, k) / numDeriv(t => a * t * t, k)],
    }
  }),
  g(3, 'Polar area', rng => {
    const a = randInt(rng, 1, 5)
    const kind = pick(rng, ['circle', 'cardioid', 'rose'] as const)
    const [curve, val] =
      kind === 'circle' ? [`r = ${a}`, `${a * a}\\pi`] : kind === 'cardioid' ? [`r = ${a}(1+\\cos\\theta)`, `\\frac{${3 * a * a}\\pi}{2}`] : [`r = ${a}\\cos 2\\theta`, `\\frac{${a * a}\\pi}{2}`]
    const wrong = [`${2 * a * a}\\pi`, `\\frac{${a * a}\\pi}{2}`, `${3 * a * a}\\pi`, `\\frac{${a * a}\\pi}{4}`, `${4 * a * a}\\pi`, `\\frac{${3 * a * a}\\pi}{4}`]
    return {
      topic: 'Polar area',
      prompt: `What is the total area enclosed by the polar curve ${M(curve)}?`,
      correct: M(val),
      wrong: wrong.filter(w => w !== val).map(M),
      hint: 'A = ½∫ r² dθ over one full traversal of the curve.',
      explanation: `${M(`A = \\tfrac12\\int r^2\\,d\\theta = ${val}`)}.`,
    }
  }),
  g(3, 'Arc length', rng => {
    const k = pick(rng, [3, 8, 15, 24])
    const v = Math.round((k + 1) ** 1.5)
    const ans = F(2 * (v - 1), 3)
    return {
      topic: 'Arc length',
      prompt: `What is the length of the curve ${M('y = \\tfrac23 x^{3/2}')} from ${M('x = 0')} to ${M(`x = ${k}`)}?`,
      correct: M(fTex(ans)),
      wrong: [FR(2 * v, 3), FR(2 * (v - 1), 1), FR(v - 1, 3), FR(2 * (k + 1), 3)],
      hint: 'L = ∫√(1 + (y′)²) dx. Here y′ = √x, so the integrand is √(1 + x).',
      explanation: `${M(`\\int_0^{${k}}\\sqrt{1+x}\\,dx = \\frac23\\left[(1+x)^{3/2}\\right]_0^{${k}} = ${fTex(ans)}`)}.`,
      check: [fVal(ans), numInt(x => Math.sqrt(1 + x), 0, k)],
    }
  }),

  // ---------- Multivariable calculus (Calc 3) ----------
  g(3, 'Partial derivatives', rng => {
    const a = randInt(rng, 1, 4), b = nz(rng, 1, 4), p = randInt(rng, 1, 3), q = randInt(rng, 1, 3)
    const f = (x: number, y: number) => a * x * x * y + b * x * y ** 3
    const wrt = pick(rng, ['x', 'y'] as const)
    const ans = wrt === 'x' ? 2 * a * p * q + b * q ** 3 : a * p * p + 3 * b * p * q * q
    return {
      topic: 'Partial derivatives',
      prompt: `If ${M(`f(x,y) = ${co(a)}x^2y ${sg(b)}xy^3`)}, what is ${M(`f_${wrt}(${p},${q})`)}?`,
      correct: T(ans),
      wrong: [T(wrt === 'x' ? a * p * p + 3 * b * p * q * q : 2 * a * p * q + b * q ** 3), T(f(p, q)), T(-ans), ...nearby(rng, ans, [], T)],
      hint: `Treat the other variable as a constant and differentiate with respect to ${wrt}.`,
      explanation: `${M(`f_x = ${2 * a}xy ${sg(b)}y^3,\\quad f_y = ${co(a)}x^2 ${sg(3 * b)}xy^2`)}. At (${p},${q}): ${ans}.`,
      check: [ans, wrt === 'x' ? numDeriv(x => f(x, q), p) : numDeriv(y => f(p, y), q)],
    }
  }),
  g(3, 'Directional derivative', rng => {
    const a = randInt(rng, 1, 3), b = randInt(rng, 1, 3), p = randInt(rng, 1, 3), q = randInt(rng, 1, 3)
    const [u, v, w] = pick(rng, [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13]])
    const ans = F(u * 2 * a * p + v * 2 * b * q, w)
    return {
      topic: 'Directional derivative',
      prompt: `For ${M(`f(x,y) = ${co(a)}x^2 + ${co(b)}y^2`)}, find the rate of change at ${M(`(${p},${q})`)} in the direction of the unit vector ${M(`\\langle \\frac{${u}}{${w}}, \\frac{${v}}{${w}}\\rangle`)}.`,
      correct: M(fTex(ans)),
      wrong: [M(fTex(F(2 * a * p + 2 * b * q, 1))), M(fTex(F(v * 2 * a * p + u * 2 * b * q, w))), M(fTex(F(u * a * p + v * b * q, w))), M(fTex(F(Math.round(Math.hypot(2 * a * p, 2 * b * q) * 1000), 1000)))],
      hint: 'D_u f = ∇f · u. Compute the gradient first.',
      explanation: `${M(`\\nabla f = \\langle ${2 * a}x, ${2 * b}y\\rangle = \\langle ${2 * a * p}, ${2 * b * q}\\rangle`)}; dot with u gives ${M(fTex(ans))}.`,
    }
  }),
  g(3, 'Multiple integrals', rng => {
    const a = randInt(rng, 1, 4), b = randInt(rng, 1, 4), c = randInt(rng, 1, 4)
    if (rng() < 0.5) {
      const val = F(a * a * b * b + 4 * c * a * b, 4)
      return {
        topic: 'Multiple integrals',
        prompt: `Evaluate ${M(`\\int_0^{${a}}\\int_0^{${b}} (xy + ${c})\\,dy\\,dx`)}.`,
        correct: M(fTex(val)),
        wrong: [FR(a * a * b * b, 4), FR(a * b * (a + b) + c, 1), FR(a * a * b * b + c * a * b, 2), FR(a * a * b * b + 4 * c, 4)],
        hint: 'Integrate the inside variable first, then the outside.',
        explanation: `${M(`\\frac{a^2b^2}{4} + c\\,ab = \\frac{${a * a * b * b}}{4} + ${c * a * b}`)} = ${M(fTex(val))}.`,
        check: [fVal(val), numInt(x => numInt(y => x * y + c, 0, b, 40), 0, a, 40)],
      }
    }
    const val = F(a * b * c * (a + b + c), 2)
    return {
      topic: 'Multiple integrals',
      prompt: `Evaluate the triple integral of ${M('x + y + z')} over the box ${M(`0\\le x\\le${a},\\ 0\\le y\\le${b},\\ 0\\le z\\le${c}`)}.`,
      correct: M(fTex(val)),
      wrong: [FR(a * b * c, 1), FR(a * b * c * (a + b + c), 1), FR(a * b * c * (a + b + c), 3), FR(a + b + c, 2)],
      hint: 'By symmetry, each variable integrates to (its upper limit)²/2 times the other two lengths.',
      explanation: `${M(`abc\\cdot\\frac{a+b+c}{2} = ${fTex(val)}`)}.`,
    }
  }),
  g(3, 'Lagrange multipliers', rng => {
    const kind = pick(rng, ['xy', 'dist'] as const)
    if (kind === 'xy') {
      const s = 2 * randInt(rng, 2, 10)
      return {
        topic: 'Lagrange multipliers',
        prompt: `Maximize ${M('f(x,y) = xy')} subject to ${M(`x + y = ${s}`)}. What is the maximum value?`,
        correct: T((s / 2) ** 2),
        wrong: [T(s * s / 2), T(s / 2), T(s * s / 8), T(s * s / 4 + 1)].filter(x => x !== T((s / 2) ** 2)),
        hint: '∇f = λ∇g gives y = λ and x = λ, so x = y.',
        explanation: `x = y = ${s / 2}, so xy = ${(s / 2) ** 2}.`,
      }
    }
    const a = randInt(rng, 1, 3), b = randInt(rng, 1, 3), c = randInt(rng, 3, 12)
    const val = F(c * c, a * a + b * b)
    return {
      topic: 'Lagrange multipliers',
      prompt: `What is the minimum value of ${M('x^2 + y^2')} on the line ${M(`${co(a)}x + ${co(b)}y = ${c}`)}?`,
      correct: M(fTex(val)),
      wrong: [FR(c, a * a + b * b), FR(c * c, a + b), FR(c * c, Math.sqrt(a * a + b * b) | 0 || 1), FR(c, 1)],
      hint: 'The minimum is the squared distance from the origin to the line: (c / √(a²+b²))².',
      explanation: `${M(`\\frac{c^2}{a^2+b^2} = \\frac{${c * c}}{${a * a + b * b}}`)}.`,
    }
  }),
  g(3, 'Critical points (2 variables)', rng => {
    const a = pick(rng, [-4, -3, -1, 1, 3, 4, 5])
    const kind = Math.abs(a) < 2 ? 'a local minimum' : 'a saddle point'
    return {
      topic: 'Critical points (2 variables)',
      prompt: `The function ${M(`f(x,y) = x^2 ${a < 0 ? '-' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}xy + y^2`)} has a critical point at the origin. It is:`,
      correct: kind,
      wrong: ['a local minimum', 'a saddle point', 'a local maximum', 'not a critical point'].filter(x => x !== kind),
      hint: 'Second derivative test: $D = f_{xx}f_{yy} - f_{xy}^2$. If $D > 0$ and $f_{xx} > 0$ it is a minimum; if $D < 0$ it is a saddle.',
      explanation: `${M(`D = (2)(2) - (${a})^2 = ${4 - a * a}`)}${4 - a * a > 0 ? ', positive with f_xx = 2 > 0 → local minimum.' : ', negative → saddle point.'}`,
    }
  }),
  g(3, 'Multivariable chain rule', rng => {
    const p = randInt(rng, 1, 3), q = randInt(rng, 1, 3), k = randInt(rng, 1, 3)
    const e = 2 * p + q
    const ans = e * k ** (e - 1)
    return {
      topic: 'Multivariable chain rule',
      prompt: `Let ${M('z = x^2 y')}, with ${M(`x = t^{${p}}`)} and ${M(`y = t^{${q}}`)}. What is ${M('\\frac{dz}{dt}')} at ${M(`t = ${k}`)}?`,
      correct: T(ans),
      wrong: [T(e * k ** e), T(2 * p * k + q * k), T(ans + 1), T((2 * p + q) * k)].filter(x => x !== T(ans)),
      hint: 'You may substitute first: z = t^(2p + q). Or use dz/dt = z_x·x′ + z_y·y′.',
      explanation: `${M(`z = t^{${e}}`)} so ${M(`z' = ${e}t^{${e - 1}} = ${ans}`)} at t=${k}.`,
    }
  }),
  g(3, 'Vector fields', rng => {
    const a = randInt(rng, 1, 4), b = randInt(rng, 1, 4), p = randInt(rng, 1, 3), q = randInt(rng, 1, 3), r = randInt(rng, 1, 3)
    if (rng() < 0.5)
      return {
        topic: 'Vector fields',
        prompt: `What is the divergence of ${M(`\\mathbf F = \\langle ${co(a)}x^2,\\ ${co(b)}y^2,\\ z^2\\rangle`)} at ${M(`(${p},${q},${r})`)}?`,
        correct: T(2 * a * p + 2 * b * q + 2 * r),
        wrong: [T(a * p * p + b * q * q + r * r), T(2 * a * p * q * r), T(2 * a + 2 * b + 2), T(2 * a * p + 2 * b * q)],
        hint: 'div F = ∂P/∂x + ∂Q/∂y + ∂R/∂z.',
        explanation: `${M(`${2 * a}x + ${2 * b}y + 2z`)} at the point = ${2 * a * p + 2 * b * q + 2 * r}.`,
      }
    return {
      topic: 'Vector fields',
      prompt: `What is the z-component of the curl of ${M(`\\mathbf F = \\langle -${co(a)}y,\\ ${co(b)}x,\\ 0\\rangle`)}?`,
      correct: T(a + b),
      wrong: [T(b - a), T(a - b), T(a * b), T(0)].filter(x => x !== T(a + b)),
      hint: '(curl F)_z = ∂Q/∂x − ∂P/∂y.',
      explanation: `${M(`\\partial_x(${co(b)}x) - \\partial_y(-${co(a)}y) = ${b} + ${a}`)}.`,
    }
  }),
  g(3, 'Line integrals', rng => {
    const a = randInt(rng, 1, 4), b = randInt(rng, 1, 4), r = randInt(rng, 1, 3)
    const ans = (a + b) * r * r
    return {
      topic: 'Line integrals',
      prompt: `Let ${M(`\\mathbf F = \\langle -${co(a)}y,\\ ${co(b)}x\\rangle`)}. What is the line integral of F counterclockwise around the circle ${M(`x^2+y^2=${r * r}`)}?`,
      correct: M(`${ans}\\pi`),
      wrong: [M(`${2 * ans}\\pi`), M(`${Math.abs(b - a) * r * r}\\pi`), M(`${ans}`), M(`${a * b * r * r}\\pi`)].filter(x => x !== M(`${ans}\\pi`)),
      hint: 'By Green’s theorem: ∮ = ∬ (∂Q/∂x − ∂P/∂y) dA, a constant here, times the disk area.',
      explanation: `${M(`(${a}+${b})\\cdot\\pi r^2 = ${ans}\\pi`)}.`,
    }
  }),
  g(3, 'Cross & triple products', rng => {
    const m = [0, 1, 2].map(() => [nz(rng, 1, 3), nz(rng, 1, 3), nz(rng, 1, 3)])
    const det =
      m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
    const v = (x: number[]) => `\\langle ${x.join(',')}\\rangle`
    return {
      topic: 'Cross & triple products',
      prompt: `What is the scalar triple product ${M('\\mathbf a\\cdot(\\mathbf b\\times\\mathbf c)')} for a = ${M(v(m[0]))}, b = ${M(v(m[1]))}, c = ${M(v(m[2]))}?`,
      correct: T(det),
      wrong: [T(-det), T(det + 1), T(m[0][0] * m[1][0] * m[2][0] + m[0][1] * m[1][1] * m[2][1] + m[0][2] * m[1][2] * m[2][2]), T(Math.abs(det) + 2)],
      hint: 'The triple product equals the determinant of the 3×3 matrix with a, b, c as rows.',
      explanation: `Computing the determinant gives ${det}.`,
    }
  }),

  // ---------- Linear algebra ----------
  g(3, 'Eigenvalues', rng => {
    const m = randInt(rng, 2, 8), s = randInt(rng, 1, Math.min(m - 1, 5))
    return {
      topic: 'Eigenvalues',
      prompt: `What is the largest eigenvalue of ${M(`\\begin{pmatrix} ${m} & ${s}\\\\ ${s} & ${m}\\end{pmatrix}`)}?`,
      correct: T(m + s),
      wrong: [T(m - s), T(m), T(m * m - s * s), T(2 * m)],
      hint: 'Solve det(A − λI) = 0: (m − λ)² = s². The vector (1,1) is an eigenvector.',
      explanation: `λ = m ± s = ${m + s} or ${m - s}. The largest is ${m + s}.`,
    }
  }),
  g(3, 'Determinants (3×3)', rng => {
    const m = [0, 1, 2].map(() => [nz(rng, 1, 4), nz(rng, 1, 4), nz(rng, 1, 4)])
    const det =
      m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
    const mat = m.map(r => r.join(' & ')).join(' \\\\ ')
    return {
      topic: 'Determinants (3×3)',
      prompt: `Compute ${M(`\\det\\begin{pmatrix} ${mat} \\end{pmatrix}`)}.`,
      correct: T(det),
      wrong: [T(-det), T(m[0][0] * m[1][1] * m[2][2]), T(det + 2), T(det - 2), T(det * 2)].filter(x => x !== T(det)),
      hint: 'Expand along the first row with alternating signs (+, −, +).',
      explanation: `Cofactor expansion gives ${det}.`,
    }
  }),
  g(3, 'Rank & nullity', rng => {
    const n = randInt(rng, 4, 8), m = randInt(rng, 3, 6), r = randInt(rng, 1, Math.min(n, m) - 1)
    return {
      topic: 'Rank & nullity',
      prompt: `A ${m}×${n} matrix has rank ${r}. What is the dimension of its null space?`,
      correct: T(n - r),
      wrong: [T(m - r), T(r), T(n + m - r), T(n - r + 1)].filter(x => x !== T(n - r)),
      hint: 'Rank–nullity: rank + nullity = number of columns.',
      explanation: `nullity = ${n} − ${r} = ${n - r}.`,
    }
  }),

  // ---------- Differential equations ----------
  g(3, 'First-order ODEs', rng => {
    const k = randInt(rng, 2, 3), y0 = randInt(rng, 1, 5)
    return {
      topic: 'First-order ODEs',
      prompt: `If ${M(`\\frac{dy}{dx} = ${k}y`)} and ${M(`y(0) = ${y0}`)}, what is ${M('y(\\ln 2)')}?`,
      correct: T(y0 * 2 ** k),
      wrong: [T(y0 * k * 2), T(y0 * 2), T(y0 * k), T(y0 + k)],
      hint: 'This is separable: y = y₀eᵏˣ. Then plug in x = ln 2.',
      explanation: `${M(`y = ${y0}e^{${k}x}`)}; at ln 2: ${M(`${y0}\\cdot 2^{${k}} = ${y0 * 2 ** k}`)}.`,
    }
  }),
  g(3, 'Second-order ODEs', rng => {
    const kind = pick(rng, ['real', 'osc'] as const)
    if (kind === 'real') {
      const r1 = nz(rng, 1, 4)
      let r2 = nz(rng, 1, 4)
      while (r2 === r1) r2 = nz(rng, 1, 5)
      const sm = r1 + r2, pr = r1 * r2
      const ode = `y'' ${sm === 0 ? '' : sg(-sm) + "y'"} ${sg(pr)}y = 0`.replace(/\s+/g, ' ')
      const sol = (a: number, b: number) => `y = C_1e^{${a}x} + C_2e^{${b}x}`
      return {
        topic: 'Second-order ODEs',
        prompt: `What is the general solution of ${M(ode)}?`,
        correct: M(sol(r1, r2)),
        wrong: [M(sol(-r1, -r2)), M(sol(r1, -r2)), M(sol(-r1, r2)), M(`y = C_1e^{${sm}x} + C_2e^{${pr}x}`)],
        hint: 'Try y = e^{rx}: solve the characteristic equation r² − (sum)r + (product) = 0.',
        explanation: `The characteristic roots are ${r1} and ${r2}.`,
      }
    }
    const w = randInt(rng, 2, 7)
    return {
      topic: 'Second-order ODEs',
      prompt: `What is the general solution of ${M(`y'' + ${w * w}y = 0`)}?`,
      correct: M(`y = C_1\\cos(${w}x) + C_2\\sin(${w}x)`),
      wrong: [M(`y = C_1e^{${w}x} + C_2e^{-${w}x}`), M(`y = C_1\\cos(${w * w}x) + C_2\\sin(${w * w}x)`), M(`y = C_1e^{${w * w}x}`), M(`y = C_1\\cos(x) + C_2\\sin(${w}x)`)],
      hint: 'Characteristic equation r² + ω² = 0 has imaginary roots ±iω.',
      explanation: `${M(`r = \\pm ${w}i`)} gives oscillating solutions with frequency ${w}.`,
    }
  }),
  g(3, 'Laplace transforms', rng => {
    const n = randInt(rng, 1, 4), a = randInt(rng, 1, 5), b = randInt(rng, 2, 6)
    const table: [string, string, string[]][] = [
      [`t^{${n}}`, `\\frac{${fact(n)}}{s^{${n + 1}}}`, [`\\frac{1}{s^{${n + 1}}}`, `\\frac{${fact(n)}}{s^{${n}}}`, `\\frac{${n}}{s^{${n + 1}}}`]],
      [`e^{${a}t}`, `\\frac{1}{s-${a}}`, [`\\frac{1}{s+${a}}`, `\\frac{${a}}{s-${a}}`, `\\frac{1}{s^2-${a}}`]],
      [`\\sin(${b}t)`, `\\frac{${b}}{s^2+${b * b}}`, [`\\frac{s}{s^2+${b * b}}`, `\\frac{${b}}{s^2-${b * b}}`, `\\frac{1}{s^2+${b * b}}`]],
      [`\\cos(${b}t)`, `\\frac{s}{s^2+${b * b}}`, [`\\frac{${b}}{s^2+${b * b}}`, `\\frac{s}{s^2-${b * b}}`, `\\frac{s}{s+${b}}`]],
      [`te^{${a}t}`, `\\frac{1}{(s-${a})^2}`, [`\\frac{1}{s-${a}}`, `\\frac{${a}}{(s-${a})^2}`, `\\frac{1}{(s+${a})^2}`]],
    ]
    const [f, F_, w] = pick(rng, table)
    return {
      topic: 'Laplace transforms',
      prompt: `What is the Laplace transform ${M(`\\mathcal L\\{${f}\\}`)}?`,
      correct: M(F_),
      wrong: w.map(M),
      hint: 'Use the standard table, ∫₀^∞ e^{−st} f(t) dt.',
      explanation: `${M(`\\mathcal L\\{${f}\\} = ${F_}`)}.`,
    }
  }),
  g(3, 'Change of variables', rng => {
    const items: [string, string, string[]][] = [
      ['polar coordinates ' + M('(x,y) = (r\\cos\\theta, r\\sin\\theta)'), 'r', ['1', 'r^2', 'r\\sin\\theta', '\\frac1r']],
      ['spherical coordinates ' + M('(\\rho,\\phi,\\theta)'), '\\rho^2\\sin\\phi', ['\\rho\\sin\\phi', '\\rho^2\\cos\\phi', '\\rho^2', '\\rho\\sin^2\\phi']],
      ['cylindrical coordinates ' + M('(r,\\theta,z)'), 'r', ['1', 'r^2', 'rz', '\\frac1r']],
    ]
    const [sys, jac, bad] = pick(rng, items)
    return {
      topic: 'Change of variables',
      prompt: `In ${sys}, what is the Jacobian factor in ${M('dV')} (or ${M('dA')})?`,
      correct: M(jac),
      wrong: bad.map(M),
      hint: 'Area/volume elements pick up the absolute value of the Jacobian determinant.',
      explanation: `The factor is ${M(jac)}.`,
    }
  }),

  // ---------- Probability & statistics ----------
  g(3, 'Expected value & variance', rng => {
    const n = randInt(rng, 5, 30), p = pick(rng, [F(1, 2), F(1, 4), F(1, 5), F(1, 10), F(3, 5)])
    const variance = fMul(fMul(F(n), p), fSub(F(1), p))
    const which = pick(rng, ['mean', 'var'] as const)
    const mean = fMul(F(n), p)
    return {
      topic: 'Expected value & variance',
      prompt: `X is binomial with ${M(`n=${n}`)} trials and success probability ${M(`p=${fTex(p)}`)}. What is its ${which === 'mean' ? 'mean' : 'variance'}?`,
      correct: M(fTex(which === 'mean' ? mean : variance)),
      wrong: which === 'mean'
        ? [M(fTex(variance)), M(fTex(fMul(F(n), fSub(F(1), p)))), M(fTex(F(n))), M(fTex(fAdd(mean, F(1))))]
        : [M(fTex(mean)), M(fTex(fMul(variance, F(2)))), M(fTex(fMul(F(n), fSub(F(1), p)))), M(fTex(fMul(mean, mean)))],
      hint: which === 'mean' ? 'E[X] = np.' : 'Var(X) = np(1 − p).',
      explanation: which === 'mean' ? `${M(`np = ${fTex(mean)}`)}.` : `${M(`np(1-p) = ${fTex(variance)}`)}.`,
    }
  }),
  g(3, 'Bayes’ theorem', rng => {
    const prev = pick(rng, [1, 2, 5]), sens = pick(rng, [90, 95, 99]), fp = pick(rng, [5, 10])
    const tp = prev * sens, fpp = (100 - prev) * fp
    const val = F(tp, tp + fpp)
    return {
      topic: 'Bayes’ theorem',
      prompt: `A disease affects ${prev}% of a population. A test is positive for ${sens}% of those with the disease and for ${fp}% of those without it. If a random person tests positive, what is the probability they have the disease?`,
      correct: M(`\\approx ${Math.round(fVal(val) * 1000) / 10}\\%`),
      wrong: [M(`${sens}\\%`), M(`\\approx ${Math.round((1 - fVal(val)) * 1000) / 10}\\%`), M(`${prev}\\%`), M(`\\approx ${Math.min(99.9, Math.round(fVal(val) * 1000) / 10 + 20)}\\%`)],
      hint: 'P(D | +) = P(+ | D)P(D) / P(+). Compute P(+) over both groups.',
      explanation: `${M(`\\frac{${prev}\\cdot${sens}}{${prev}\\cdot${sens} + ${100 - prev}\\cdot${fp}} = \\frac{${tp}}{${tp + fpp}}`)}.`,
    }
  }),
]
