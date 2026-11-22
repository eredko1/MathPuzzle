import type { Gen, Level } from '../types'
import { M, num, pick, randInt, sci } from '../util'

const g = (level: Level, topic: string, make: Gen['make']): Gen => ({ level, topic, make })
/** Quantity with units, in math mode. */
const unit = (u: string) =>
  u
    ? `\\,\\text{${u
        .replace(/²/g, '}^2\\text{')
        .replace(/³/g, '}^3\\text{')
        .replace(/·/g, '}\\cdot\\text{')
        .replace(/μ/g, '}\\mu\\text{')
        .replace(/Ω/g, '}\\Omega\\text{')}}`
    : ''
const Q = (x: number, u: string, sig = 3) => M(`${num(x, sig)}${unit(u)}`.replace(/\\text\{\}$/, ''))
/** Correct + plausible-wrong numeric options (common slips first, then scalings). */
function opts(c: number, slips: number[], u: string, sig = 3) {
  const all = [...slips, c * 2, c / 2, c * 10, c / 10, c * 1.5, c * 0.5 ** 0.5, c * 4, c / 4]
  return { correct: Q(c, u, sig), wrong: all.filter(x => isFinite(x) && Q(x, u, sig) !== Q(c, u, sig)).map(x => Q(x, u, sig)) }
}
const G = 9.8

export const physics: Gen[] = [
  // ---------- Easy: SAT-/AP-physics 1 level ----------
  g(1, 'Kinematics', rng => {
    const a = randInt(rng, 2, 9), t = randInt(rng, 3, 12), v0 = pick(rng, [0, 0, 5, 10])
    const v = v0 + a * t
    return {
      topic: 'Kinematics',
      prompt: `A car ${v0 ? `moving at ${v0} m/s` : 'starting from rest'} accelerates uniformly at ${a} m/s² for ${t} s. What is its final speed?`,
      ...opts(v, [v0 + a, a * t * t / 2, v0 + a * t * t], 'm/s'),
      hint: 'v = v₀ + at.',
      explanation: `${M(`v = ${v0} + (${a})(${t}) = ${v}\\ \\text{m/s}`)}.`,
    }
  }),
  g(1, 'Kinematics', rng => {
    const a = randInt(rng, 2, 8), t = randInt(rng, 2, 10)
    const d = (a * t * t) / 2
    return {
      topic: 'Kinematics',
      prompt: `An object starts from rest and accelerates at ${a} m/s². How far does it travel in ${t} s?`,
      ...opts(d, [a * t, a * t * t, (a * t) / 2], 'm'),
      hint: 'Starting from rest, d = ½at².',
      explanation: `${M(`d = \\tfrac12(${a})(${t})^2 = ${num(d)}\\ \\text{m}`)}.`,
    }
  }),
  g(1, 'Free fall', rng => {
    const t = randInt(rng, 1, 6), h = 0.5 * G * t * t
    return {
      topic: 'Free fall',
      prompt: `A ball is dropped from rest from a height of ${num(h, 4)} m. Ignoring air resistance (g = 9.8 m/s²), how long does it take to hit the ground?`,
      ...opts(t, [h / G, Math.sqrt(h / G), 2 * t], 's'),
      hint: 'h = ½gt², so t = √(2h/g).',
      explanation: `${M(`t = \\sqrt{2h/g} = \\sqrt{2(${num(h, 4)})/9.8} = ${t}\\ \\text{s}`)}.`,
    }
  }),
  g(1, "Newton's laws", rng => {
    const m = randInt(rng, 2, 20), F = m * randInt(rng, 2, 9)
    return {
      topic: "Newton's laws",
      prompt: `A net force of ${F} N acts on a ${m} kg object. What is its acceleration?`,
      ...opts(F / m, [F * m, m / F, F - m], 'm/s²'),
      hint: 'F_net = ma.',
      explanation: `${M(`a = F/m = ${F}/${m} = ${num(F / m)}\\ \\text{m/s}^2`)}.`,
    }
  }),
  g(1, 'Energy & work', rng => {
    const m = randInt(rng, 2, 12), v = randInt(rng, 2, 14)
    return {
      topic: 'Energy & work',
      prompt: `What is the kinetic energy of a ${m} kg object moving at ${v} m/s?`,
      ...opts(0.5 * m * v * v, [m * v * v, m * v, 0.5 * m * v], 'J'),
      hint: 'KE = ½mv² — the speed is squared.',
      explanation: `${M(`\\tfrac12(${m})(${v})^2 = ${num(0.5 * m * v * v)}\\ \\text{J}`)}.`,
    }
  }),
  g(1, 'Energy & work', rng => {
    const m = randInt(rng, 1, 10), h = randInt(rng, 2, 30)
    return {
      topic: 'Energy & work',
      prompt: `How much gravitational potential energy does a ${m} kg mass gain when lifted ${h} m? (g = 9.8 m/s²)`,
      ...opts(m * G * h, [m * h, m * G, 0.5 * m * G * h], 'J'),
      hint: 'ΔPE = mgh.',
      explanation: `${M(`(${m})(9.8)(${h}) = ${num(m * G * h)}\\ \\text{J}`)}.`,
    }
  }),
  g(1, 'Power', rng => {
    const W = randInt(rng, 2, 20) * 100, t = randInt(rng, 2, 20)
    return {
      topic: 'Power',
      prompt: `A motor does ${W} J of work in ${t} s. What is its average power?`,
      ...opts(W / t, [W * t, t / W, W - t], 'W'),
      hint: 'Power = work ÷ time.',
      explanation: `${M(`P = ${W}/${t} = ${num(W / t)}\\ \\text{W}`)}.`,
    }
  }),
  g(1, 'Circuits', rng => {
    const I = randInt(rng, 1, 9) / 2, R = randInt(rng, 2, 30)
    return {
      topic: 'Circuits',
      prompt: `A ${R} Ω resistor carries a current of ${I} A. What is the voltage across it?`,
      ...opts(I * R, [R / I, I / R, I * R * R], 'V'),
      hint: 'Ohm’s law: V = IR.',
      explanation: `${M(`V = (${I})(${R}) = ${num(I * R)}\\ \\text{V}`)}.`,
    }
  }),
  g(1, 'Circuits', rng => {
    const [a, b] = [randInt(rng, 2, 12), randInt(rng, 2, 12)]
    const par = (a * b) / (a + b)
    const series = rng() < 0.5
    return {
      topic: 'Circuits',
      prompt: `Two resistors of ${a} Ω and ${b} Ω are connected in ${series ? 'series' : 'parallel'}. What is the equivalent resistance?`,
      ...(series ? opts(a + b, [par, a * b, (a + b) / 2], 'Ω') : opts(par, [a + b, (a + b) / 2, a * b], 'Ω')),
      hint: series ? 'Series resistances add.' : 'Parallel: 1/R = 1/R₁ + 1/R₂ (or product over sum for two).',
      explanation: series ? `${a} + ${b} = ${a + b} Ω.` : `${M(`\\frac{(${a})(${b})}{${a}+${b}} = ${num(par)}\\ \\Omega`)}.`,
    }
  }),
  g(1, 'Waves', rng => {
    const f = randInt(rng, 2, 50) * 10, lam = randInt(rng, 1, 10) / 2
    return {
      topic: 'Waves',
      prompt: `A wave has frequency ${f} Hz and wavelength ${lam} m. What is its speed?`,
      ...opts(f * lam, [f / lam, lam / f, f + lam], 'm/s'),
      hint: 'v = fλ.',
      explanation: `${M(`v = f\\lambda = (${f})(${lam}) = ${num(f * lam)}\\ \\text{m/s}`)}.`,
    }
  }),
  g(1, 'Heat', rng => {
    const m = randInt(rng, 1, 10) / 2, dT = randInt(rng, 5, 60), c = pick(rng, [4186, 900, 385, 2100])
    const mat = { 4186: 'water', 900: 'aluminum', 385: 'copper', 2100: 'ice' }[c as 4186]
    return {
      topic: 'Heat',
      prompt: `How much heat is needed to raise the temperature of ${m} kg of ${mat} (c = ${c} J/kg·K) by ${dT} K?`,
      ...opts(m * c * dT, [m * c, c * dT, m * dT], 'J'),
      hint: 'Q = mcΔT.',
      explanation: `${M(`(${m})(${c})(${dT}) = ${num(m * c * dT)}\\ \\text{J}`)}.`,
    }
  }),
  g(1, 'Momentum', rng => {
    const m1 = randInt(rng, 2, 10), v1 = randInt(rng, 2, 12), m2 = randInt(rng, 1, 10)
    const v = (m1 * v1) / (m1 + m2)
    return {
      topic: 'Momentum',
      prompt: `A ${m1} kg cart moving at ${v1} m/s sticks to a ${m2} kg cart at rest. What is their speed after the collision?`,
      ...opts(v, [v1, v1 / 2, (m1 * v1) / m2, v1 * (m2 / (m1 + m2))], 'm/s'),
      hint: 'Momentum is conserved: m₁v₁ = (m₁ + m₂)v.',
      explanation: `${M(`v = \\frac{(${m1})(${v1})}{${m1 + m2}} = ${num(v)}\\ \\text{m/s}`)}.`,
    }
  }),
  g(1, 'Pressure', rng => {
    const F = randInt(rng, 2, 50) * 10, A = randInt(rng, 1, 20) / 10
    return {
      topic: 'Pressure',
      prompt: `A force of ${F} N is spread evenly over ${A} m². What is the pressure?`,
      ...opts(F / A, [F * A, A / F, F - A], 'Pa'),
      hint: 'Pressure = force ÷ area.',
      explanation: `${M(`P = ${F}/${A} = ${num(F / A)}\\ \\text{Pa}`)}.`,
    }
  }),

  // ---------- Medium: AP Physics C / first-year university ----------
  g(2, 'Projectile motion', rng => {
    const v = pick(rng, [10, 14, 20, 28, 30, 40])
    const ang = pick(rng, [30, 45, 60])
    const R = (v * v * Math.sin((2 * ang * Math.PI) / 180)) / G
    return {
      topic: 'Projectile motion',
      prompt: `A projectile is launched at ${v} m/s at ${ang}° above the horizontal on level ground. What is its horizontal range? (g = 9.8 m/s², ignore air)`,
      ...opts(R, [(v * v) / G, (v * v * Math.sin((ang * Math.PI) / 180)) / G, (v * v * Math.cos((ang * Math.PI) / 180)) / G, R / 2], 'm'),
      hint: 'R = v² sin(2θ) / g.',
      explanation: `${M(`R = \\frac{(${v})^2\\sin(${2 * ang}^\\circ)}{9.8} = ${num(R)}\\ \\text{m}`)}.`,
    }
  }),
  g(2, 'Inclined plane', rng => {
    const ang = pick(rng, [30, 37, 45, 53, 60]), mu = pick(rng, [0, 0.1, 0.2, 0.3])
    const a = G * (Math.sin((ang * Math.PI) / 180) - mu * Math.cos((ang * Math.PI) / 180))
    return {
      topic: 'Inclined plane',
      prompt: `A block slides down a ${ang}° incline ${mu ? `with kinetic friction coefficient μ = ${mu}` : 'with no friction'}. What is its acceleration? (g = 9.8 m/s²)`,
      ...opts(a, [G * Math.sin((ang * Math.PI) / 180), G * Math.cos((ang * Math.PI) / 180), G * (Math.sin((ang * Math.PI) / 180) + mu * Math.cos((ang * Math.PI) / 180))], 'm/s²'),
      hint: 'Along the slope: a = g(sinθ − μ cosθ).',
      explanation: `${M(`a = 9.8(\\sin ${ang}^\\circ - ${mu}\\cos ${ang}^\\circ) = ${num(a)}\\ \\text{m/s}^2`)}.`,
    }
  }),
  g(2, 'Circular motion', rng => {
    const v = randInt(rng, 3, 30), r = randInt(rng, 2, 50)
    return {
      topic: 'Circular motion',
      prompt: `A car rounds a curve of radius ${r} m at ${v} m/s. What is its centripetal acceleration?`,
      ...opts((v * v) / r, [v / r, v * v * r, (v * v) / (2 * r)], 'm/s²'),
      hint: 'a_c = v²/r.',
      explanation: `${M(`a_c = ${v}^2/${r} = ${num((v * v) / r)}\\ \\text{m/s}^2`)}.`,
    }
  }),
  g(2, 'Springs & oscillation', rng => {
    const m = randInt(rng, 1, 9) / 2, k = randInt(rng, 2, 20) * 10
    const T = 2 * Math.PI * Math.sqrt(m / k)
    return {
      topic: 'Springs & oscillation',
      prompt: `A ${m} kg mass on a spring with k = ${k} N/m oscillates horizontally. What is its period?`,
      ...opts(T, [2 * Math.PI * Math.sqrt(k / m), Math.sqrt(m / k), 2 * Math.PI * (m / k), T / (2 * Math.PI)], 's'),
      hint: 'T = 2π√(m/k).',
      explanation: `${M(`T = 2\\pi\\sqrt{${m}/${k}} = ${num(T)}\\ \\text{s}`)}.`,
    }
  }),
  g(2, 'Pendulum', rng => {
    const L = pick(rng, [0.25, 0.5, 1, 1.5, 2, 4]), T = 2 * Math.PI * Math.sqrt(L / G)
    return {
      topic: 'Pendulum',
      prompt: `What is the period of a simple pendulum of length ${L} m for small oscillations? (g = 9.8 m/s²)`,
      ...opts(T, [2 * Math.PI * Math.sqrt(G / L), Math.sqrt(L / G), 2 * Math.PI * L / G, T * Math.sqrt(2)], 's'),
      hint: 'T = 2π√(L/g), independent of mass.',
      explanation: `${M(`T = 2\\pi\\sqrt{${L}/9.8} = ${num(T)}\\ \\text{s}`)}.`,
    }
  }),
  g(2, 'Coulomb’s law', rng => {
    const k = Math.round(rng() * 3) + 2, F0 = randInt(rng, 2, 9)
    return {
      topic: 'Coulomb’s law',
      prompt: `Two point charges attract with a force of ${F0} N. If the distance between them is multiplied by ${k}, what is the new force?`,
      correct: Q(F0 / k ** 2, 'N'),
      wrong: [Q(F0 / k, 'N'), Q(F0 * k ** 2, 'N'), Q(F0 * k, 'N'), Q(F0 / k ** 3, 'N')],
      hint: 'Force falls off as the inverse square of the distance.',
      explanation: `${M(`F' = F/${k}^2 = ${num(F0 / k ** 2)}\\ \\text{N}`)}.`,
    }
  }),
  g(2, 'Electric fields', rng => {
    const q = randInt(rng, 1, 9), r = randInt(rng, 1, 5) / 2
    const E = (8.99e9 * q * 1e-9) / (r * r)
    return {
      topic: 'Electric fields',
      prompt: `What is the magnitude of the electric field ${r} m from a point charge of ${q} nC? (k = 8.99×10⁹ N·m²/C²)`,
      ...opts(E, [E * r, (8.99e9 * q * 1e-9) / r, E / 9, E * 9], 'N/C'),
      hint: 'E = kq/r².',
      explanation: `${M(`E = \\frac{(8.99\\times10^9)(${q}\\times10^{-9})}{${r}^2} = ${num(E)}\\ \\text{N/C}`)}.`,
    }
  }),
  g(2, 'Capacitors', rng => {
    const C = randInt(rng, 1, 20), V = randInt(rng, 2, 24)
    const U = 0.5 * C * 1e-6 * V * V
    return {
      topic: 'Capacitors',
      prompt: `How much energy is stored in a ${C} μF capacitor charged to ${V} V?`,
      ...opts(U, [C * 1e-6 * V, C * 1e-6 * V * V, U * 2], 'J'),
      hint: 'U = ½CV².',
      explanation: `${M(`U = \\tfrac12(${C}\\times10^{-6})(${V})^2 = ${num(U)}\\ \\text{J}`)}.`,
    }
  }),
  g(2, 'RC circuits', rng => {
    const R = randInt(rng, 1, 99), C = randInt(rng, 1, 99)
    const tau = R * 1e3 * C * 1e-6
    return {
      topic: 'RC circuits',
      prompt: `An RC circuit has R = ${R} kΩ and C = ${C} μF. What is its time constant?`,
      ...opts(tau, [R * C, tau * 1000, tau / 1000, tau * Math.LN2], 's'),
      hint: 'τ = RC. Convert kΩ → Ω and μF → F first.',
      explanation: `${M(`\\tau = (${R}\\times10^3)(${C}\\times10^{-6}) = ${num(tau)}\\ \\text{s}`)}.`,
    }
  }),
  g(2, 'Optics', rng => {
    const f = randInt(rng, 5, 30), d = f + randInt(rng, 3, 40)
    const di = (f * d) / (d - f)
    return {
      topic: 'Optics',
      prompt: `A converging lens has focal length ${f} cm. An object is ${d} cm from the lens. How far from the lens is the image?`,
      ...opts(di, [f + d, d - f, (f * d) / (d + f), f * d], 'cm'),
      hint: '1/f = 1/dₒ + 1/dᵢ.',
      explanation: `${M(`\\frac1{d_i} = \\frac1{${f}} - \\frac1{${d}} \\Rightarrow d_i = ${num(di)}\\ \\text{cm}`)}.`,
    }
  }),
  g(2, 'Snell’s law', rng => {
    const [a, b, n, nT] = pick(rng, [[60, 30, 1, '\\sqrt3'], [45, 30, 1, '\\sqrt2'], [30, 20, 1, '1.46']] as [number, number, number, string][])
    const wrong = ['\\sqrt3', '\\sqrt2', '1.46', '1.33', '1.5', '2.0'].filter(x => x !== nT)
    return {
      topic: 'Snell’s law',
      prompt: `Light passes from air (n = 1) into a material. The angle of incidence is ${a}° and the angle of refraction is ${b}°. What is the material's refractive index?`,
      correct: M(nT),
      wrong: wrong.map(M),
      hint: 'n₁ sinθ₁ = n₂ sinθ₂.',
      explanation: `${M(`n_2 = \\frac{\\sin ${a}^\\circ}{\\sin ${b}^\\circ} = ${nT}`)}${n === 1 ? '' : ''}.`,
    }
  }),
  g(2, 'Ideal gas', rng => {
    const n = randInt(rng, 1, 5), T = randInt(rng, 250, 450), V = pick(rng, [10, 20, 25, 50]) / 1000
    const P = (n * 8.314 * T) / V
    return {
      topic: 'Ideal gas',
      prompt: `What is the pressure of ${n} mol of an ideal gas at ${T} K in a ${V * 1000} L container? (R = 8.314 J/mol·K)`,
      ...opts(P, [P * 1000, P / 1000, (n * 8.314 * T) * V, (8.314 * T) / V], 'Pa'),
      hint: 'PV = nRT, with V in m³ (1 L = 10⁻³ m³).',
      explanation: `${M(`P = \\frac{nRT}{V} = ${num(P)}\\ \\text{Pa}`)}.`,
    }
  }),
  g(2, 'Torque & rotation', rng => {
    const F = randInt(rng, 5, 60), r = randInt(rng, 1, 8) / 4, ang = pick(rng, [30, 90, 45, 60])
    const tau = F * r * Math.sin((ang * Math.PI) / 180)
    return {
      topic: 'Torque & rotation',
      prompt: `A force of ${F} N is applied ${r} m from a pivot at ${ang}° to the lever arm. What is the torque?`,
      ...opts(tau, [F * r, F * r * Math.cos((ang * Math.PI) / 180), F / r, F * Math.sin((ang * Math.PI) / 180)], 'N·m'),
      hint: 'τ = rF sinθ.',
      explanation: `${M(`\\tau = (${r})(${F})\\sin ${ang}^\\circ = ${num(tau)}\\ \\text{N}\\cdot\\text{m}`)}.`,
    }
  }),
  g(2, 'Fluids', rng => {
    const rho = pick(rng, [1000, 800, 1030, 13600]), h = randInt(rng, 1, 20) / 2
    return {
      topic: 'Fluids',
      prompt: `What is the gauge pressure at a depth of ${h} m in a fluid of density ${rho} kg/m³? (g = 9.8 m/s²)`,
      ...opts(rho * G * h, [rho * h, rho * G, G * h, rho * G * h * 2], 'Pa'),
      hint: 'P = ρgh.',
      explanation: `${M(`(${rho})(9.8)(${h}) = ${num(rho * G * h)}\\ \\text{Pa}`)}.`,
    }
  }),
  g(2, 'Heat engines', rng => {
    const Th = pick(rng, [400, 500, 600, 800, 1000]), Tc = pick(rng, [200, 250, 300])
    const eff = 1 - Tc / Th
    const pct = (x: number) => M(`${num(x * 100)}\\%`)
    return {
      topic: 'Heat engines',
      prompt: `What is the maximum (Carnot) efficiency of a heat engine operating between ${Th} K and ${Tc} K?`,
      correct: pct(eff),
      wrong: [pct(Tc / Th), pct(1 - Th / Tc > 0 ? 1 - Th / Tc : 0.1), pct((Th - Tc) / Tc > 1 ? 0.9 : (Th - Tc) / Tc), pct(eff / 2)],
      hint: 'η = 1 − T_cold/T_hot, with temperatures in kelvin.',
      explanation: `${M(`1 - \\frac{${Tc}}{${Th}} = ${num(eff * 100)}\\%`)}.`,
    }
  }),

  // ---------- Hard: upper-division physics ----------
  g(3, 'Rolling motion', rng => {
    const body = pick(rng, [['solid sphere', 5 / 7, '\\tfrac57'], ['solid cylinder', 2 / 3, '\\tfrac23'], ['hoop', 1 / 2, '\\tfrac12'], ['hollow sphere', 3 / 5, '\\tfrac35']] as [string, number, string][])
    const all = ['\\tfrac57', '\\tfrac23', '\\tfrac12', '\\tfrac35', '1']
    return {
      topic: 'Rolling motion',
      prompt: `A ${body[0]} rolls without slipping down an incline of angle θ. Its acceleration is what fraction of g sinθ?`,
      correct: M(body[2]),
      wrong: all.filter(x => x !== body[2]).map(M),
      hint: 'a = g sinθ / (1 + I/(mR²)). The ratio I/(mR²) is ½ for a cylinder, 2/5 for a solid sphere, 1 for a hoop.',
      explanation: `${M(`a = \\frac{g\\sin\\theta}{1 + I/mR^2} = ${body[2]}\\,g\\sin\\theta`)}.`,
    }
  }),
  g(3, 'Magnetic force', rng => {
    const v = randInt(rng, 1, 9) * 1e5, B = randInt(rng, 1, 9) / 10
    const r = (9.11e-31 * v) / (1.6e-19 * B)
    return {
      topic: 'Magnetic force',
      prompt: `An electron moves at ${M(sci(v, 2) + '\\,\\text{m/s}')} perpendicular to a ${B} T magnetic field. What is the radius of its circular path? (m = 9.11×10⁻³¹ kg, e = 1.6×10⁻¹⁹ C)`,
      ...opts(r, [r * 1836, r / 1836, 1.6e-19 * v * B, r * 2 * Math.PI], 'm'),
      hint: 'qvB = mv²/r, so r = mv/(qB).',
      explanation: `${M(`r = \\frac{mv}{eB} = ${num(r)}\\ \\text{m}`)}.`,
    }
  }),
  g(3, 'Faraday’s law', rng => {
    const N = randInt(rng, 5, 200), A = randInt(rng, 1, 50) / 100, dB = randInt(rng, 1, 9) / 10, dt = randInt(rng, 1, 5) / 10
    const emf = (N * A * dB) / dt
    return {
      topic: 'Faraday’s law',
      prompt: `A coil of ${N} turns and area ${A} m² faces a magnetic field that changes uniformly by ${dB} T in ${dt} s. What is the induced EMF magnitude?`,
      ...opts(emf, [(A * dB) / dt, N * A * dB * dt, N * dB / dt, emf / N * 2], 'V'),
      hint: 'ε = N·A·(ΔB/Δt).',
      explanation: `${M(`\\varepsilon = (${N})(${A})(${dB}/${dt}) = ${num(emf)}\\ \\text{V}`)}.`,
    }
  }),
  g(3, 'RLC resonance', rng => {
    const L = randInt(rng, 1, 50), C = randInt(rng, 1, 50)
    const f = 1 / (2 * Math.PI * Math.sqrt(L * 1e-3 * C * 1e-6))
    return {
      topic: 'RLC resonance',
      prompt: `What is the resonant frequency of a series RLC circuit with L = ${L} mH and C = ${C} μF?`,
      ...opts(f, [1 / Math.sqrt(L * 1e-3 * C * 1e-6), f * 2 * Math.PI, f / 1000, Math.sqrt(f)], 'Hz'),
      hint: 'f₀ = 1/(2π√(LC)). Convert to henries and farads.',
      explanation: `${M(`f_0 = \\frac{1}{2\\pi\\sqrt{(${L}\\times10^{-3})(${C}\\times10^{-6})}} = ${num(f)}\\ \\text{Hz}`)}.`,
    }
  }),
  g(3, 'Photons', rng => {
    const lam = pick(rng, [200, 250, 300, 350, 400]), phi = pick(rng, [2.0, 2.3, 3.0, 2.8, 1.9])
    const E = 1240 / lam, KE = E - phi
    return {
      topic: 'Photons',
      prompt: `Light of wavelength ${lam} nm hits a metal with work function ${phi} eV. What is the maximum kinetic energy of the emitted electrons? (hc = 1240 eV·nm)`,
      ...opts(KE, [E, E + phi, phi, E / phi], 'eV'),
      hint: 'Photon energy E = hc/λ, then KE_max = E − φ.',
      explanation: `${M(`E = 1240/${lam} = ${num(E)}\\ \\text{eV},\\quad KE = ${num(E)} - ${phi} = ${num(KE)}\\ \\text{eV}`)}.`,
    }
  }),
  g(3, 'Special relativity', rng => {
    const [beta, gamma, gt] = pick(rng, [[0.6, 1.25, '1.25'], [0.8, 5 / 3, '1.67'], [0.866, 2, '2.00'], [0.96, 3.571, '3.57']] as [number, number, string][])
    const t0 = randInt(rng, 2, 20)
    return {
      topic: 'Special relativity',
      prompt: `A spaceship moves at ${beta}c. A clock on it measures ${t0} s between two events. How much time passes between them in the Earth frame?`,
      ...opts(t0 * gamma, [t0 / gamma, t0 * beta, t0 * (1 - beta * beta), t0 * gamma * gamma], 's'),
      hint: `Moving clocks run slow: Δt = γ·Δt₀ with γ = 1/√(1 − v²/c²) ≈ ${gt}.`,
      explanation: `${M(`\\gamma = ${gt}`)}, so Δt = ${num(t0 * gamma)} s.`,
    }
  }),
  g(3, 'Bohr model', rng => {
    const [hi, lo] = pick(rng, [[3, 2], [4, 2], [2, 1], [3, 1], [5, 2]] as [number, number][])
    const E = 13.6 * (1 / (lo * lo) - 1 / (hi * hi))
    return {
      topic: 'Bohr model',
      prompt: `A hydrogen atom drops from the n = ${hi} to the n = ${lo} level. What is the energy of the emitted photon? (E_n = −13.6 eV / n²)`,
      ...opts(E, [13.6 * (1 / lo - 1 / hi), 13.6 / (lo * lo), 13.6 * (hi - lo), 13.6 * (1 / (lo * lo) + 1 / (hi * hi))], 'eV'),
      hint: 'ΔE = 13.6 (1/n_low² − 1/n_high²) eV.',
      explanation: `${M(`13.6\\left(\\frac1{${lo * lo}} - \\frac1{${hi * hi}}\\right) = ${num(E)}\\ \\text{eV}`)}.`,
    }
  }),
  g(3, 'De Broglie wavelength', rng => {
    const V = pick(rng, [10, 50, 100, 150, 400, 1000])
    const lam = 1.226 / Math.sqrt(V)
    return {
      topic: 'De Broglie wavelength',
      prompt: `An electron is accelerated from rest through ${V} V. What is its de Broglie wavelength? (Use λ ≈ 1.226/√V nm)`,
      ...opts(lam, [lam * Math.sqrt(V), 1.226 / V, lam * 10, lam / 10], 'nm'),
      hint: 'KE = eV = p²/2m and λ = h/p, which gives λ ≈ 1.226 nm / √V.',
      explanation: `${M(`\\lambda = 1.226/\\sqrt{${V}} = ${num(lam)}\\ \\text{nm}`)}.`,
    }
  }),
  g(3, 'Entropy', rng => {
    const Q_ = randInt(rng, 1, 20) * 100, T = pick(rng, [250, 300, 400, 500, 600])
    return {
      topic: 'Entropy',
      prompt: `${Q_} J of heat flows reversibly into a reservoir at ${T} K. What is the change in the reservoir's entropy?`,
      ...opts(Q_ / T, [Q_ * T, T / Q_, Q_ / (T - 273)], 'J/K'),
      hint: 'ΔS = Q/T for a reversible isothermal process.',
      explanation: `${M(`\\Delta S = ${Q_}/${T} = ${num(Q_ / T)}\\ \\text{J/K}`)}.`,
    }
  }),
  g(3, 'Bernoulli & continuity', rng => {
    const A1 = randInt(rng, 2, 10), r = randInt(rng, 2, 6), v1 = randInt(rng, 1, 5)
    const A2 = A1 / r
    return {
      topic: 'Bernoulli & continuity',
      prompt: `Water flows at ${v1} m/s through a pipe of cross-section ${A1} cm² that narrows to ${num(A2)} cm². What is the speed in the narrow section?`,
      ...opts(v1 * r, [v1 / r, v1 * r * r, v1 * Math.sqrt(r), v1 + r], 'm/s'),
      hint: 'Continuity: A₁v₁ = A₂v₂.',
      explanation: `${M(`v_2 = v_1A_1/A_2 = ${v1}\\times${r} = ${v1 * r}\\ \\text{m/s}`)}.`,
    }
  }),
  g(3, 'Statics: beam reactions', rng => {
    const L = randInt(rng, 3, 12), a = randInt(rng, 1, L - 1), P = randInt(rng, 2, 20) * 10
    const RB = (P * a) / L, RA = P - RB
    return {
      topic: 'Statics: beam reactions',
      prompt: `A simply supported beam of length ${L} m (supports at A on the left and B on the right) carries a point load of ${P} N ${a} m from A, neglecting the beam's weight. What is the reaction force at A?`,
      ...opts(RA, [RB, P / 2, P * (L - a), P * a], 'N'),
      hint: 'Take moments about B: R_A·L = P·(L − a).',
      explanation: `${M(`R_A = P\\frac{L-a}{L} = ${P}\\cdot\\frac{${L - a}}{${L}} = ${num(RA)}\\ \\text{N}`)}.`,
    }
  }),
  g(3, 'Statics: stress & strain', rng => {
    const F = randInt(rng, 5, 100) * 1000, A = randInt(rng, 2, 50) * 1e-4, E = pick(rng, [200, 70, 110]) * 1e9
    const sigma = F / A, eps = sigma / E
    const askStrain = rng() < 0.5
    return {
      topic: 'Statics: stress & strain',
      prompt: askStrain
        ? `A rod with cross-section ${num(A * 1e4)} cm² carries an axial load of ${F / 1000} kN. Its Young's modulus is ${E / 1e9} GPa. What is the axial strain?`
        : `A rod with cross-section ${num(A * 1e4)} cm² carries an axial tensile load of ${F / 1000} kN. What is the normal stress?`,
      ...(askStrain ? opts(eps, [sigma, F / E, eps * 1e3, eps / 1e3], '') : opts(sigma / 1e6, [sigma, F * A / 1e6, sigma / 1e9, sigma / 1e3], 'MPa')),
      hint: askStrain ? 'ε = σ/E with σ = F/A.' : 'σ = F/A. Convert cm² to m² (1 cm² = 10⁻⁴ m²).',
      explanation: askStrain ? `${M(`\\sigma = ${num(sigma)}\\ \\text{Pa},\\ \\varepsilon = \\sigma/E = ${num(eps)}`)}.` : `${M(`\\sigma = F/A = ${num(sigma / 1e6)}\\ \\text{MPa}`)}.`,
    }
  }),
  g(3, 'Statics: bending', rng => {
    const b = randInt(rng, 2, 10) / 100, h = randInt(rng, 4, 20) / 100, M_ = randInt(rng, 1, 20) * 100
    const I = (b * h ** 3) / 12, sigma = (M_ * (h / 2)) / I
    return {
      topic: 'Statics: bending',
      prompt: `A rectangular beam (width ${b * 100} cm, height ${h * 100} cm) carries a bending moment of ${M_} N·m. What is the maximum bending stress? (σ = Mc/I)`,
      ...opts(sigma / 1e6, [(M_ * h) / I / 1e6, (M_ * (h / 2)) / ((b * h * h * h) / 3) / 1e6, sigma / 1e9, sigma / 1e3], 'MPa'),
      hint: 'For a rectangle I = bh³/12 and c = h/2.',
      explanation: `${M(`I = \\frac{bh^3}{12} = ${num(I)}\\ \\text{m}^4,\\ \\sigma = \\frac{M(h/2)}{I} = ${num(sigma / 1e6)}\\ \\text{MPa}`)}.`,
    }
  }),
  g(3, 'Dynamics: rocket equation', rng => {
    const ve = randInt(rng, 2, 4) * 1000, ratio = pick(rng, [2, 3, 5, 10])
    const dv = ve * Math.log(ratio)
    return {
      topic: 'Dynamics: rocket equation',
      prompt: `A rocket with exhaust speed ${ve} m/s burns fuel until its mass drops to 1/${ratio} of its initial mass. What is its change in speed (Δv = v_e ln(m₀/m_f))?`,
      ...opts(dv, [ve * ratio, ve * Math.log10(ratio), ve / ratio, ve * ratio * Math.LN2], 'm/s'),
      hint: 'Tsiolkovsky: Δv = v_e ln(m₀/m_f). Use the natural log.',
      explanation: `${M(`\\Delta v = ${ve}\\ln ${ratio} = ${num(dv)}\\ \\text{m/s}`)}.`,
    }
  }),
  g(3, 'Controls: first-order systems', rng => {
    const K = randInt(rng, 2, 10), tau = randInt(rng, 1, 8), u = randInt(rng, 1, 5)
    return {
      topic: 'Controls: first-order systems',
      prompt: `A system has transfer function ${M(`G(s) = \\dfrac{${K}}{${tau}s + 1}`)}. Its input is a step of height ${u}. What is the steady-state output?`,
      ...opts(K * u, [K * u / tau, u / tau, K * tau * u, K + u], ''),
      hint: 'Final value theorem: set s → 0 in G(s)·(u/s)·s.',
      explanation: `${M(`G(0) = ${K}`)}, so y(∞) = ${K} × ${u} = ${K * u}.`,
    }
  }),
  g(3, 'Controls: second-order systems', rng => {
    const wn = randInt(rng, 2, 10), zeta = pick(rng, [0.2, 0.5, 0.707, 1, 2])
    const kind = zeta < 1 ? 'underdamped' : zeta === 1 ? 'critically damped' : 'overdamped'
    return {
      topic: 'Controls: second-order systems',
      prompt: `A system obeys ${M(`s^2 + ${num(2 * zeta * wn)}s + ${wn * wn} = 0`)}. Its damping ratio is ${zeta}. How would you describe its response?`,
      correct: kind,
      wrong: ['underdamped', 'critically damped', 'overdamped', 'unstable'].filter(x => x !== kind),
      hint: 'ζ < 1 oscillates with decaying amplitude, ζ = 1 is the fastest non-oscillatory case, ζ > 1 is sluggish.',
      explanation: `ζ = ${zeta}, so the system is ${kind}.`,
    }
  }),
  g(3, 'Op-amps', rng => {
    const Rin = randInt(rng, 1, 10), k = randInt(rng, 2, 20), inv = rng() < 0.5
    return {
      topic: 'Op-amps',
      prompt: `An ideal op-amp ${inv ? 'inverting' : 'non-inverting'} amplifier uses R_in = ${Rin} kΩ and R_f = ${Rin * k} kΩ. What is its voltage gain?`,
      correct: M(inv ? `-${k}` : String(k + 1)),
      wrong: (inv ? [String(k), String(k + 1), `-${k + 1}`, `-1/${k}`] : [String(k), `-${k}`, `${k - 1}`, `1/${k}`]).map(M),
      hint: inv ? 'Inverting: G = −R_f/R_in.' : 'Non-inverting: G = 1 + R_f/R_in.',
      explanation: inv ? `${M(`-${Rin * k}/${Rin} = -${k}`)}.` : `${M(`1 + ${Rin * k}/${Rin} = ${k + 1}`)}.`,
    }
  }),
  g(3, 'Signals', rng => {
    const f = randInt(rng, 2, 40) * 100, bits = randInt(rng, 6, 16), vref = pick(rng, [3.3, 5])
    if (rng() < 0.5)
      return {
        topic: 'Signals',
        prompt: `A signal contains frequencies up to ${f} Hz. What is the minimum sampling rate to avoid aliasing?`,
        ...opts(2 * f, [f, f / 2, 4 * f, f * f], 'Hz'),
        hint: 'Nyquist: sample at more than twice the highest frequency.',
        explanation: `${M(`2\\times${f} = ${2 * f}\\ \\text{Hz}`)}.`,
      }
    const lsb = vref / 2 ** bits
    return {
      topic: 'Signals',
      prompt: `A ${bits}-bit ADC has a ${vref} V reference. What is the size of one least-significant bit (LSB)?`,
      ...opts(lsb * 1000, [(vref / bits) * 1000, (vref / (2 ** bits - 1)) * 1000 * 2, lsb * 1e6, lsb], 'mV'),
      hint: 'LSB = V_ref / 2ⁿ.',
      explanation: `${M(`${vref}/2^{${bits}} = ${num(lsb * 1000)}\\ \\text{mV}`)}.`,
    }
  }),
  g(3, 'Decibels & filters', rng => {
    if (rng() < 0.5) {
      const ratio = pick(rng, [2, 4, 10, 100, 1000, 0.1, 0.5]), power = rng() < 0.5
      const dB = (power ? 10 : 20) * Math.log10(ratio)
      return {
        topic: 'Decibels & filters',
        prompt: `An amplifier changes a signal's ${power ? 'power' : 'voltage'} by a factor of ${ratio}. What is that in decibels?`,
        ...opts(dB, [(power ? 20 : 10) * Math.log10(ratio), Math.log10(ratio), ratio, -dB], 'dB'),
        hint: power ? 'Power: dB = 10 log₁₀(P₂/P₁).' : 'Voltage: dB = 20 log₁₀(V₂/V₁).',
        explanation: `${M(`${power ? 10 : 20}\\log_{10}(${ratio}) = ${num(dB)}\\ \\text{dB}`)}.`,
      }
    }
    const R = randInt(rng, 1, 100), C = pick(rng, [1, 10, 100]), unit = pick(rng, ['nF', 'μF'])
    const Cf = C * (unit === 'nF' ? 1e-9 : 1e-6), Rf = R * 1e3
    const fc = 1 / (2 * Math.PI * Rf * Cf)
    return {
      topic: 'Decibels & filters',
      prompt: `What is the cutoff frequency of an RC low-pass filter with R = ${R} kΩ and C = ${C} ${unit}?`,
      ...opts(fc, [1 / (Rf * Cf), fc * 2 * Math.PI, fc / 1000, Rf * Cf], 'Hz'),
      hint: 'f_c = 1/(2πRC).',
      explanation: `${M(`f_c = \\frac{1}{2\\pi RC} = ${num(fc)}\\ \\text{Hz}`)}.`,
    }
  }),
  g(3, 'Buckling', rng => {
    const k = pick(rng, [0.5, 0.7, 1, 2]), L = randInt(rng, 1, 5)
    const base = 1 / (k * k)
    return {
      topic: 'Buckling',
      prompt: `By Euler's formula ${M('P_{cr} = \\frac{\\pi^2 EI}{(KL)^2}')}, a column's end conditions change the effective length factor from K = 1 (pinned–pinned) to K = ${k}. By what factor does the critical load change? (L = ${L} m is unchanged)`,
      correct: M(`\\times ${num(base)}`),
      wrong: [`\\times ${num(k)}`, `\\times ${num(1 / k)}`, `\\times ${num(k * k)}`, `\\times ${num(2 * base)}`].map(M),
      hint: 'P_cr ∝ 1/K², so replacing K = 1 by K gives a factor of 1/K².',
      explanation: `${M(`1/K^2 = 1/${k}^2 = ${num(base)}`)}.`,
    }
  }),
]

