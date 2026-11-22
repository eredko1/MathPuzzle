import type { Gen, Level } from '../types'
import { M, num, pick, randInt } from '../util'

const g = (level: Level, topic: string, make: Gen['make']): Gen => ({ level, topic, make })
const unit = (u: string) =>
  u
    ? `\\,\\text{${u.replace(/²/g, '}^2\\text{').replace(/³/g, '}^3\\text{').replace(/·/g, '}\\cdot\\text{').replace(/°/g, '}^\\circ\\text{').replace(/μ/g, '}\\mu\\text{')}}`
    : ''
const Q = (x: number, u: string, sig = 3) => M(`${num(x, sig)}${u === '%' ? '\\,\\%' : unit(u)}`.replace(/\\text\{\}/g, ''))
function opts(c: number, slips: number[], u: string, sig = 3) {
  const all = [...slips, c * 2, c / 2, c * 10, c / 10, c * 1.5, c * 0.75, c + 1, c - 1]
  return { correct: Q(c, u, sig), wrong: all.filter(x => isFinite(x) && Q(x, u, sig) !== Q(c, u, sig)).map(x => Q(x, u, sig)) }
}
const fm = (f: string) => M(`\\mathrm{${f.replace(/(\d+)/g, '_{$1}')}}`)

const COMPOUNDS: [string, number, string][] = [
  ['H2O', 18.02, 'water'], ['CO2', 44.01, 'carbon dioxide'], ['NaCl', 58.44, 'sodium chloride'], ['CH4', 16.04, 'methane'],
  ['NH3', 17.03, 'ammonia'], ['H2SO4', 98.08, 'sulfuric acid'], ['C6H12O6', 180.16, 'glucose'], ['CaCO3', 100.09, 'calcium carbonate'],
  ['NaOH', 40.0, 'sodium hydroxide'], ['HCl', 36.46, 'hydrochloric acid'], ['C2H5OH', 46.07, 'ethanol'], ['KNO3', 101.1, 'potassium nitrate'],
]

export const chem: Gen[] = [
  // ---------- Easy: general chemistry ----------
  g(1, 'Moles & molar mass', rng => {
    const [f, mm, name] = pick(rng, COMPOUNDS), n = randInt(rng, 1, 8) / 2
    const grams = n * mm
    return {
      topic: 'Moles & molar mass',
      prompt: `How many moles are in ${num(grams)} g of ${name}, ${fm(f)}? (molar mass ≈ ${mm} g/mol)`,
      ...opts(n, [grams * mm, mm / grams, grams], 'mol'),
      hint: 'moles = mass ÷ molar mass.',
      explanation: `${M(`\\frac{${num(grams)}}{${mm}} = ${num(n)}\\ \\text{mol}`)}.`,
    }
  }),
  g(1, 'Moles & molar mass', rng => {
    const [f, mm, name] = pick(rng, COMPOUNDS), n = randInt(rng, 1, 6)
    return {
      topic: 'Moles & molar mass',
      prompt: `What is the mass of ${n} mol of ${name}, ${fm(f)}? (molar mass ≈ ${mm} g/mol)`,
      ...opts(n * mm, [mm / n, n + mm, n * mm * mm], 'g'),
      hint: 'mass = moles × molar mass.',
      explanation: `${n} × ${mm} = ${num(n * mm)} g.`,
    }
  }),
  g(1, 'Molarity', rng => {
    const n = randInt(rng, 1, 9) / 2, V = randInt(rng, 1, 8) / 2
    return {
      topic: 'Molarity',
      prompt: `${num(n)} mol of solute is dissolved to make ${num(V)} L of solution. What is the molarity?`,
      ...opts(n / V, [n * V, V / n, n + V], 'M'),
      hint: 'M = moles of solute ÷ liters of solution.',
      explanation: `${M(`${num(n)}/${num(V)} = ${num(n / V)}\\ \\text{M}`)}.`,
    }
  }),
  g(1, 'Dilution', rng => {
    const M1 = randInt(rng, 2, 12) / 2, V1 = randInt(rng, 10, 100), f = pick(rng, [2, 4, 5, 10])
    const V2 = V1 * f
    return {
      topic: 'Dilution',
      prompt: `${V1} mL of ${M1} M solution is diluted with water to ${V2} mL. What is the new concentration?`,
      ...opts(M1 / f, [M1 * f, M1 - f, M1 / (f - 1)], 'M'),
      hint: 'M₁V₁ = M₂V₂.',
      explanation: `${M(`M_2 = \\frac{(${M1})(${V1})}{${V2}} = ${num(M1 / f)}\\ \\text{M}`)}.`,
    }
  }),
  g(1, 'pH', rng => {
    const n = randInt(rng, 1, 13), strong = rng() < 0.5
    return {
      topic: 'pH',
      prompt: strong
        ? `A solution has [H⁺] = ${M(`1\\times10^{-${n}}`)} M. What is its pH?`
        : `A solution has pOH = ${n}. What is its pH at 25 °C?`,
      correct: M(String(strong ? n : 14 - n)),
      wrong: (strong ? [14 - n, -n, n + 1, n - 1] : [n, -n, 14 + n, 7 - n]).map(x => M(String(x))),
      hint: strong ? 'pH = −log[H⁺].' : 'pH + pOH = 14 at 25 °C.',
      explanation: strong ? `${M(`-\\log(10^{-${n}}) = ${n}`)}.` : `14 − ${n} = ${14 - n}.`,
    }
  }),
  g(1, 'Avogadro’s number', rng => {
    const n = randInt(rng, 2, 9) / 2
    const N = n * 6.022e23
    return {
      topic: 'Avogadro’s number',
      prompt: `About how many molecules are in ${n} mol of a substance?`,
      correct: M(`${num(N / 1e23, 3)}\\times10^{23}`),
      wrong: [N / 1e22, N / 1e24, n * 6.022e22 * 1.0 + 1e23, (N / 6.022e23) * 6.022e22].map(v => M(`${num(v / 1e23, 3)}\\times10^{23}`)),
      hint: 'N = n × 6.022×10²³.',
      explanation: `${M(`${n}\\times6.022\\times10^{23} = ${num(N / 1e23)}\\times10^{23}`)}.`,
    }
  }),
  g(1, 'Gas laws', rng => {
    const P1 = randInt(rng, 1, 5), V1 = randInt(rng, 2, 12), f = pick(rng, [2, 4]), boyle = rng() < 0.5
    if (boyle)
      return {
        topic: 'Gas laws',
        prompt: `A gas at ${P1} atm occupies ${V1} L. At constant temperature, the volume is reduced to ${V1 / f} L. What is the new pressure?`,
        ...opts(P1 * f, [P1 / f, P1 + f, P1 * f * f], 'atm'),
        hint: 'Boyle’s law: P₁V₁ = P₂V₂.',
        explanation: `${M(`P_2 = ${P1}\\times${V1}/${V1 / f} = ${P1 * f}\\ \\text{atm}`)}.`,
      }
    const T1 = randInt(rng, 200, 400)
    return {
      topic: 'Gas laws',
      prompt: `A gas at ${T1} K occupies ${V1} L. At constant pressure, it is heated to ${T1 * f} K. What is the new volume?`,
      ...opts(V1 * f, [V1 / f, V1 + f, V1 * T1], 'L'),
      hint: 'Charles’s law: V₁/T₁ = V₂/T₂ (kelvin only).',
      explanation: `${M(`V_2 = ${V1}\\times${f} = ${V1 * f}\\ \\text{L}`)}.`,
    }
  }),
  g(1, 'Percent composition', rng => {
    const [f, mm, name] = pick(rng, [['H2O', 18.02, 'water'], ['CO2', 44.01, 'carbon dioxide'], ['NaOH', 40.0, 'sodium hydroxide'], ['CH4', 16.04, 'methane']] as [string, number, string][])
    const part = { H2O: [2.02, 'H'], CO2: [12.01, 'C'], NaOH: [22.99, 'Na'], CH4: [12.01, 'C'] }[f as 'H2O'] as [number, string]
    const pct = (part[0] / mm) * 100
    return {
      topic: 'Percent composition',
      prompt: `What is the mass percent of ${part[1]} in ${name}, ${fm(f)}? (molar mass ≈ ${mm} g/mol; total ${part[1]} per mole = ${part[0]} g)`,
      ...opts(pct, [100 - pct, pct / 2, (part[0] / (mm + part[0])) * 100], '%'),
      hint: 'Mass percent = (mass of element in one mole ÷ molar mass) × 100.',
      explanation: `${M(`\\frac{${part[0]}}{${mm}}\\times100 = ${num(pct)}\\%`)}.`,
    }
  }),

  // ---------- Medium: AP / gen chem II ----------
  g(2, 'Stoichiometry', rng => {
    const gH = randInt(rng, 2, 20)
    const mol = gH / 2.016
    const gW = mol * 18.016
    return {
      topic: 'Stoichiometry',
      prompt: `${M('2\\,\\text{H}_2 + \\text{O}_2 \\to 2\\,\\text{H}_2\\text{O}')}. How many grams of water form when ${gH} g of H₂ burns in excess oxygen? (H₂ = 2.016, H₂O = 18.016 g/mol)`,
      ...opts(gW, [gW / 2, gH * 18.016 / 2.016 / 2, mol, gH * 9], 'g'),
      hint: 'Grams → moles → use the 1:1 mole ratio H₂ : H₂O → grams.',
      explanation: `${M(`\\frac{${gH}}{2.016}\\times1\\times18.016 = ${num(gW)}\\ \\text{g}`)}.`,
    }
  }),
  g(2, 'Limiting reagent', rng => {
    const a = randInt(rng, 2, 9), b = randInt(rng, 2, 9)
    const lim = a / 2 < b ? 'A' : 'B', prod = Math.min(a / 2, b)
    return {
      topic: 'Limiting reagent',
      prompt: `For ${M('2\\,\\text{A} + \\text{B} \\to \\text{C}')}, ${a} mol A is mixed with ${b} mol B. How many moles of C can form at most?`,
      ...opts(prod, [a / 2 === prod ? b : a / 2, Math.max(a / 2, b), a + b, Math.min(a, b)], 'mol'),
      hint: 'Divide each amount by its coefficient; the smaller result limits the reaction.',
      explanation: `A supports ${a}/2 = ${num(a / 2)}, B supports ${b}. Limiting reagent: ${lim}. C = ${num(prod)} mol.`,
    }
  }),
  g(2, 'Ideal gas law', rng => {
    const n = randInt(rng, 1, 5) / 2, T = randInt(rng, 250, 400), P = pick(rng, [0.5, 1, 2, 3])
    const V = (n * 0.08206 * T) / P
    return {
      topic: 'Ideal gas law',
      prompt: `What volume does ${num(n)} mol of an ideal gas occupy at ${T} K and ${P} atm? (R = 0.08206 L·atm/mol·K)`,
      ...opts(V, [V * P * P, (n * T) / (0.08206 * P), V / T, n * T / P], 'L'),
      hint: 'PV = nRT → V = nRT/P.',
      explanation: `${M(`V = \\frac{(${num(n)})(0.08206)(${T})}{${P}} = ${num(V)}\\ \\text{L}`)}.`,
    }
  }),
  g(2, 'Calorimetry', rng => {
    const m = randInt(rng, 50, 250), dT = randInt(rng, 3, 25)
    const q = m * 4.184 * dT
    return {
      topic: 'Calorimetry',
      prompt: `${m} g of water is heated from 20.0 °C to ${20 + dT}.0 °C. How much heat does it absorb? (c = 4.184 J/g·°C)`,
      ...opts(q, [m * 4.184, 4.184 * dT, m * dT, q * 2], 'J', 4),
      hint: 'q = mcΔT.',
      explanation: `${M(`(${m})(4.184)(${dT}) = ${num(q)}\\ \\text{J}`)}.`,
    }
  }),
  g(2, 'Hess’s law', rng => {
    const a = -randInt(rng, 100, 400), b = randInt(rng, 20, 200), c = -randInt(rng, 50, 250)
    return {
      topic: 'Hess’s law',
      prompt: `Given ${M(`\\text{X}\\to\\text{Y},\\ \\Delta H = ${a}\\ \\text{kJ}`)}, ${M(`\\text{Y}\\to\\text{Z},\\ \\Delta H = +${b}\\ \\text{kJ}`)}, and ${M(`\\text{W}\\to\\text{Z},\\ \\Delta H = ${c}\\ \\text{kJ}`)}, what is ΔH for ${M('\\text{X}\\to\\text{W}')}?`,
      ...opts(a + b - c, [a + b + c, a - b - c, a + b, -(a + b - c)], 'kJ'),
      hint: 'Add the steps: X→Y→Z, then reverse W→Z (which flips the sign of its ΔH).',
      explanation: `${M(`X\\to Z = ${a + b},\\ Z\\to W = ${-c}\\Rightarrow ${a + b - c}\\ \\text{kJ}`)}.`,
    }
  }),
  g(2, 'Gibbs free energy', rng => {
    const H = randInt(rng, -200, 200), S = randInt(rng, -300, 300) || 120, T = pick(rng, [298, 350, 400, 500])
    const G = H - (T * S) / 1000
    return {
      topic: 'Gibbs free energy',
      prompt: `A reaction has ΔH = ${H} kJ/mol and ΔS = ${S} J/mol·K. What is ΔG at ${T} K?`,
      ...opts(G, [H - T * S, H + (T * S) / 1000, H * T - S, (T * S) / 1000 - H], 'kJ/mol'),
      hint: 'ΔG = ΔH − TΔS. Convert ΔS to kJ first (÷1000).',
      explanation: `${M(`${H} - (${T})(${S})/1000 = ${num(G)}\\ \\text{kJ/mol}`)}.`,
    }
  }),
  g(2, 'Buffers', rng => {
    const pKa = pick(rng, [4.75, 7.2, 9.25, 3.75, 6.35]), r = pick(rng, [10, 100, 0.1, 0.01, 2, 0.5])
    const pH = pKa + Math.log10(r)
    return {
      topic: 'Buffers',
      prompt: `A buffer has pKa = ${pKa} and [A⁻]/[HA] = ${r}. What is its pH?`,
      ...opts(pH, [pKa - Math.log10(r), pKa + r, pKa * r, pKa], '', 3),
      hint: 'Henderson–Hasselbalch: pH = pKa + log([A⁻]/[HA]).',
      explanation: `${M(`${pKa} + \\log(${r}) = ${num(pH)}`)}.`,
    }
  }),
  g(2, 'Equilibrium', rng => {
    const a = randInt(rng, 1, 5) / 2, b = randInt(rng, 1, 5) / 2, c = randInt(rng, 1, 9) / 2
    const K = (c * c) / (a * b)
    return {
      topic: 'Equilibrium',
      prompt: `For ${M('\\text{A} + \\text{B} \\rightleftharpoons 2\\,\\text{C}')}, the equilibrium concentrations are [A] = ${a} M, [B] = ${b} M, [C] = ${c} M. What is K?`,
      ...opts(K, [c / (a * b), (a * b) / (c * c), (2 * c) / (a * b), c * c / (a + b)], ''),
      hint: 'K = [C]² / ([A][B]); the coefficient becomes an exponent.',
      explanation: `${M(`K = \\frac{${c}^2}{(${a})(${b})} = ${num(K)}`)}.`,
    }
  }),
  g(2, 'Half-life', rng => {
    const th = randInt(rng, 2, 30), k = randInt(rng, 1, 5), N0 = pick(rng, [64, 80, 100, 160, 320])
    return {
      topic: 'Half-life',
      prompt: `A radioactive sample has a half-life of ${th} days. If it starts at ${N0} g, how much remains after ${th * k} days?`,
      ...opts(N0 / 2 ** k, [N0 / k, N0 - k * 10, N0 / (2 * k), N0 / 2 ** (k + 1)], 'g'),
      hint: 'After n half-lives the amount is N₀ × (½)ⁿ.',
      explanation: `${k} half-li${k === 1 ? 'fe' : 'ves'}: ${N0} × (1/2)^${k} = ${num(N0 / 2 ** k)} g.`,
    }
  }),
  g(2, 'Rate laws', rng => {
    const m = randInt(rng, 0, 2)
    const o = ['zero', 'first', 'second'][m]
    return {
      topic: 'Rate laws',
      prompt: `For ${M('\\text{A} + \\text{B}\\to\\text{products}')}, doubling [A] (with [B] fixed) multiplies the rate by ${2 ** m}. What is the order with respect to A?`,
      correct: `${o} order`,
      wrong: ['zero order', 'first order', 'second order', 'third order'].filter(x => x !== `${o} order`),
      hint: 'If doubling the concentration multiplies the rate by 2ᵐ, the order is m.',
      explanation: `Rate ∝ [A]^m; 2^m = ${2 ** m}, so m = ${m}.`,
    }
  }),
  g(2, 'Colligative properties', rng => {
    const m = randInt(rng, 1, 6) / 2, i = pick(rng, [1, 2, 3])
    const dT = i * 1.86 * m
    return {
      topic: 'Colligative properties',
      prompt: `By how many °C does ${num(m)} molal of a solute with van ’t Hoff factor i = ${i} lower the freezing point of water? (K_f = 1.86 °C·kg/mol)`,
      ...opts(dT, [1.86 * m, dT * 2, m * i, 1.86 / m], '°C'),
      hint: 'ΔT_f = i K_f m.',
      explanation: `${M(`(${i})(1.86)(${num(m)}) = ${num(dT)}\\ ^\\circ\\text{C}`)}.`,
    }
  }),
  g(2, 'Electrochemistry', rng => {
    const [c, a] = pick(rng, [[0.34, -0.76], [0.80, 0.34], [0.34, -0.44], [1.36, 0.0]] as [number, number][])
    const E = c - a
    return {
      topic: 'Electrochemistry',
      prompt: `A galvanic cell has a cathode half-cell with E° = ${c} V and an anode half-cell with E° = ${a} V (both as reduction potentials). What is E°cell?`,
      ...opts(E, [c + a, a - c, c * a, E / 2], 'V'),
      hint: 'E°cell = E°cathode − E°anode.',
      explanation: `${M(`${c} - (${a}) = ${num(E)}\\ \\text{V}`)}.`,
    }
  }),
  g(2, 'Empirical formulas', rng => {
    const [f, nC, nH] = pick(rng, [['CH2', 1, 2], ['CH', 1, 1], ['C2H5', 2, 5], ['CH3', 1, 3], ['C3H4', 3, 4]] as [string, number, number][])
    const mult = randInt(rng, 2, 4)
    const molec = `C${nC * mult === 1 ? '' : nC * mult}H${nH * mult}`
    return {
      topic: 'Empirical formulas',
      prompt: `A compound has molecular formula ${fm(molec)}. What is its empirical formula?`,
      correct: fm(f),
      wrong: [fm(molec), fm(`C${nC + 1}H${nH}`), fm(`C${nC}H${nH + 1}`), fm(`C${nC * mult}H${nH}`)],
      hint: 'Divide every subscript by their greatest common divisor.',
      explanation: `Dividing by ${mult} gives ${f}.`,
    }
  }),

  // ---------- Hard: physical & organic chemistry ----------
  g(3, 'Nernst equation', rng => {
    const E0 = pick(rng, [1.10, 0.46, 0.78]), n = pick(rng, [1, 2, 3]), Qv = pick(rng, [10, 100, 1000, 0.1, 0.01])
    const E = E0 - (0.0592 / n) * Math.log10(Qv)
    return {
      topic: 'Nernst equation',
      prompt: `A cell has E° = ${E0} V with n = ${n} and reaction quotient Q = ${Qv} at 25 °C. What is the cell potential E? (E = E° − (0.0592/n) log Q)`,
      ...opts(E, [E0 + (0.0592 / n) * Math.log10(Qv), E0 - (0.0592 / n) * Qv, E0, E0 - 0.0592 * Math.log10(Qv)], 'V'),
      hint: 'Compute log Q first; it is a whole number for powers of ten.',
      explanation: `${M(`${E0} - \\frac{0.0592}{${n}}\\log(${Qv}) = ${num(E)}\\ \\text{V}`)}.`,
    }
  }),
  g(3, 'Weak acids', rng => {
    const n = randInt(rng, 3, 9), c = pick(rng, [0.1, 0.01, 1.0])
    const pH = (n - Math.log10(c)) / 2
    return {
      topic: 'Weak acids',
      prompt: `What is the approximate pH of a ${c} M solution of a weak acid with Ka = ${M(`1\\times10^{-${n}}`)}? (Assume x ≪ c.)`,
      ...opts(pH, [n / 2, n, -Math.log10(c * Math.pow(10, -n)), pH * 2], '', 3),
      hint: '[H⁺] ≈ √(Ka·c). Take −log of that.',
      explanation: `${M(`[H^+] = \\sqrt{10^{-${n}}\\cdot ${c}},\\ \\text{pH} = ${num(pH)}`)}.`,
    }
  }),
  g(3, 'Solubility', rng => {
    const kind = pick(rng, ['AgCl', 'CaF2'] as const), e = randInt(rng, 6, 12)
    const Ksp = Math.pow(10, -e)
    const s = kind === 'AgCl' ? Math.sqrt(Ksp) : Math.cbrt(Ksp / 4)
    return {
      topic: 'Solubility',
      prompt: `${kind === 'AgCl' ? 'AgCl' : 'CaF₂'} has Ksp = ${M(`1\\times10^{-${e}}`)}. What is its molar solubility?`,
      ...opts(s, [Ksp, kind === 'AgCl' ? Math.cbrt(Ksp / 4) : Math.sqrt(Ksp), Ksp / 4, s * 4], 'M'),
      hint: kind === 'AgCl' ? 'Ksp = s² for a 1:1 salt.' : 'CaF₂ → Ca²⁺ + 2F⁻, so Ksp = (s)(2s)² = 4s³.',
      explanation: kind === 'AgCl' ? `${M(`s = \\sqrt{K_{sp}} = ${num(s)}\\ \\text{M}`)}.` : `${M(`s = \\sqrt[3]{K_{sp}/4} = ${num(s)}\\ \\text{M}`)}.`,
    }
  }),
  g(3, 'Arrhenius equation', rng => {
    const T1 = pick(rng, [300, 310, 350]), T2 = T1 + pick(rng, [10, 20, 50]), Ea = pick(rng, [40, 50, 60, 80])
    const ratio = Math.exp((Ea * 1000 / 8.314) * (1 / T1 - 1 / T2))
    return {
      topic: 'Arrhenius equation',
      prompt: `Heating a reaction from ${T1} K to ${T2} K multiplies its rate constant by ${num(ratio)}. What is the activation energy? (R = 8.314 J/mol·K; ln(k₂/k₁) = (Ea/R)(1/T₁ − 1/T₂))`,
      ...opts(Ea, [Ea * 2, Ea / 2, Ea * 8.314 / 1000, Ea / 8.314], 'kJ/mol'),
      hint: 'Take the natural log of the ratio, then solve for Ea.',
      explanation: `${M(`E_a = \\frac{R\\ln(k_2/k_1)}{1/T_1 - 1/T_2} \\approx ${Ea}\\ \\text{kJ/mol}`)}.`,
    }
  }),
  g(3, 'Free energy & K', rng => {
    const n = randInt(rng, 1, 4), neg = rng() < 0.5
    const dG = (neg ? -1 : 1) * 5.7 * n
    return {
      topic: 'Free energy & K',
      prompt: `At 298 K, a reaction has ΔG° = ${dG} kJ/mol. About what is K? (ΔG° = −RT ln K; RT ln 10 ≈ 5.7 kJ/mol)`,
      correct: M(`10^{${neg ? n : -n}}`),
      wrong: [M(`10^{${neg ? -n : n}}`), M(`10^{${n + 1}}`), M(`${neg ? 1 : 0}`), M(`10^{${neg ? n + 2 : -n - 2}}`)],
      hint: 'log K = −ΔG° / (RT ln 10) = −ΔG° / 5.7.',
      explanation: `${M(`\\log K = ${neg ? '' : '-'}${n}`)}, so K = ${M(`10^{${neg ? n : -n}}`)}.`,
    }
  }),
  g(3, 'Second-order kinetics', rng => {
    const A0 = pick(rng, [0.1, 0.2, 0.5]), k = pick(rng, [0.05, 0.1, 0.2, 0.5]), t = pick(rng, [10, 20, 50])
    const At = 1 / (1 / A0 + k * t)
    return {
      topic: 'Second-order kinetics',
      prompt: `For a second-order reaction with k = ${k} M⁻¹s⁻¹ and [A]₀ = ${A0} M, what is [A] after ${t} s?`,
      ...opts(At, [A0 * Math.exp(-k * t), A0 - k * t, 1 / A0 + k * t, A0 / (1 + k * t)], 'M'),
      hint: 'Integrated rate law: 1/[A] = 1/[A]₀ + kt.',
      explanation: `${M(`1/[A] = ${num(1 / A0)} + ${num(k * t)} = ${num(1 / At)}\\Rightarrow [A] = ${num(At)}\\ \\text{M}`)}.`,
    }
  }),
  g(3, 'Degrees of unsaturation', rng => {
    const C = randInt(rng, 4, 12), du = randInt(rng, 0, 5)
    const H = 2 * C + 2 - 2 * du
    return {
      topic: 'Degrees of unsaturation',
      prompt: `How many degrees of unsaturation (rings + π bonds) does a hydrocarbon with formula ${fm(`C${C}H${H}`)} have?`,
      correct: M(String(du)),
      wrong: [du + 1, Math.max(0, du - 1), du + 2, C - du].filter(x => x !== du).map(x => M(String(x))),
      hint: 'DoU = (2C + 2 − H)/2 for a hydrocarbon.',
      explanation: `${M(`\\frac{2(${C}) + 2 - ${H}}{2} = ${du}`)}.`,
    }
  }),
  g(3, 'Entropy of expansion', rng => {
    const n = randInt(rng, 1, 4), f = pick(rng, [2, 4, 10])
    const dS = n * 8.314 * Math.log(f)
    return {
      topic: 'Entropy of expansion',
      prompt: `${n} mol of an ideal gas expands isothermally to ${f} times its original volume. What is ΔS?`,
      ...opts(dS, [n * 8.314 * Math.log10(f), n * 8.314 * f, n * 8.314 / f, 8.314 * Math.log(f)], 'J/K'),
      hint: 'ΔS = nR ln(V₂/V₁) — natural log.',
      explanation: `${M(`(${n})(8.314)\\ln ${f} = ${num(dS)}\\ \\text{J/K}`)}.`,
    }
  }),
  g(3, 'Beer–Lambert law', rng => {
    const eps = pick(rng, [1500, 2500, 12000, 6000]), b = pick(rng, [1, 0.5, 2]), cc = pick(rng, [1e-5, 2e-5, 5e-5, 1e-4])
    const A = eps * b * cc
    return {
      topic: 'Beer–Lambert law',
      prompt: `A solution has ε = ${eps} M⁻¹cm⁻¹ in a ${b} cm cuvette at concentration ${M(num(cc, 2))} M. What is the absorbance?`,
      ...opts(A, [A * 10, A / 10, eps * cc, eps / (b * cc)], '', 3),
      hint: 'A = εbc.',
      explanation: `${M(`A = (${eps})(${b})(${num(cc, 2)}) = ${num(A)}`)}.`,
    }
  }),
  g(3, 'Mass–energy (nuclear)', rng => {
    const dm = randInt(rng, 1, 9) / 100
    const E = dm * 931.5
    return {
      topic: 'Mass–energy (nuclear)',
      prompt: `A nuclear reaction loses ${dm} u of mass. How much energy is released? (1 u = 931.5 MeV/c²)`,
      ...opts(E, [dm * 931.5 * 1e3, dm / 931.5, dm * 931.5 ** 2, E / 2], 'MeV'),
      hint: 'E = Δm·c², with 1 u ≙ 931.5 MeV.',
      explanation: `${M(`${dm}\\times931.5 = ${num(E)}\\ \\text{MeV}`)}.`,
    }
  }),
]

