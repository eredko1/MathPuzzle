import type { Gen, Level } from '../types'
import { F, M, fTex, num, pick, randInt } from '../util'

const g = (level: Level, topic: string, make: Gen['make']): Gen => ({ level, topic, make })
const FR = (n: number, d: number) => M(fTex(F(n, d)))
function numOpts(c: number, slips: number[], u = '', sig = 3) {
  const ut = u ? `\\,\\text{${u.replace(/[µμ]/g, '}\\mu\\text{')}}` : ''
  const f = (x: number) => M(`${num(x, sig)}${ut}`)
  const all = [...slips, c * 2, c / 2, c * 10, c / 10, c + 1, c - 1, c * 1.5]
  return { correct: f(c), wrong: all.filter(x => isFinite(x) && f(x) !== f(c)).map(f) }
}

// Standard genetic code, bases ordered T,C,A,G in each position.
const BASES = 'TCAG'
const AA = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG'
const AA_NAME: Record<string, string> = {
  F: 'Phe', L: 'Leu', S: 'Ser', Y: 'Tyr', C: 'Cys', W: 'Trp', P: 'Pro', H: 'His', Q: 'Gln', R: 'Arg', I: 'Ile', M: 'Met', T: 'Thr',
  N: 'Asn', K: 'Lys', V: 'Val', A: 'Ala', D: 'Asp', E: 'Glu', G: 'Gly', '*': 'Stop',
}
const translate = (codon: string) => AA[BASES.indexOf(codon[0]) * 16 + BASES.indexOf(codon[1]) * 4 + BASES.indexOf(codon[2])]
const toRNA = (dna: string) => dna.replace(/T/g, 'U')
const comp: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' }

export const bio: Gen[] = [
  // ---------- Easy ----------
  g(1, 'Monohybrid crosses', rng => {
    const cross = pick(rng, [
      ['Aa', 'Aa', 'dominant', 3, 4], ['Aa', 'Aa', 'recessive', 1, 4], ['Aa', 'aa', 'dominant', 1, 2], ['Aa', 'aa', 'recessive', 1, 2], ['AA', 'Aa', 'dominant', 1, 1], ['AA', 'aa', 'recessive', 0, 1],
    ] as [string, string, string, number, number][])
    const [p1, p2, ph, n, d] = cross
    return {
      topic: 'Monohybrid crosses',
      prompt: `In pea plants, tall (T) is dominant to short (t). Using the allele pair A/a (A dominant), what is the probability that an offspring of ${M(`\\text{${p1}}\\times\\text{${p2}}`)} shows the ${ph} phenotype?`,
      correct: FR(n, d),
      wrong: [FR(1, 4), FR(1, 2), FR(3, 4), FR(1, 1), FR(0, 1)],
      hint: 'Draw a Punnett square: each parent contributes one allele.',
      explanation: `Counting Punnett-square outcomes gives ${fTex(F(n, d))} for the ${ph} phenotype.`,
    }
  }),
  g(1, 'DNA base pairing', rng => {
    const a = randInt(rng, 10, 35)
    const c = rng() < 0.5
    return {
      topic: 'DNA base pairing',
      prompt: c
        ? `In a double-stranded DNA molecule, ${a}% of the bases are adenine (A). What percent are guanine (G)?`
        : `A double-stranded DNA sample is ${a}% thymine (T). What percent of its bases are cytosine (C)?`,
      correct: `${50 - a}%`,
      wrong: [`${a}%`, `${100 - a}%`, `${100 - 2 * a}%`, `${50 + a}%`],
      hint: 'Chargaff: A = T and G = C, and all four add to 100%.',
      explanation: `A + T = ${2 * a}%, leaving ${100 - 2 * a}% for G + C, so each is ${50 - a}%.`,
    }
  }),
  g(1, 'Transcription', rng => {
    const dna = Array.from({ length: 6 }, () => pick(rng, ['A', 'T', 'G', 'C'])).join('')
    const mrna = toRNA(dna.split('').map(b => comp[b]).join(''))
    const wrong = [toRNA(dna), dna.split('').map(b => comp[b]).join(''), toRNA(dna).split('').reverse().join(''), mrna.split('').reverse().join('')]
    return {
      topic: 'Transcription',
      prompt: `The DNA template strand reads 3′-${dna}-5′. What is the mRNA sequence (read 5′→3′ in the same left-to-right order as the template)?`,
      correct: `5′-${mrna}-3′`,
      wrong: wrong.map(w => `5′-${w}-3′`),
      hint: 'RNA pairs A with U (not T), and C with G, against the template.',
      explanation: `Template ${dna} → complementary mRNA ${mrna}.`,
    }
  }),
  g(1, 'Energy flow', rng => {
    const start = pick(rng, [1000, 10000, 50000, 100000]), steps = randInt(rng, 1, 3)
    const end = start / 10 ** steps
    const levels = ['primary consumers', 'secondary consumers', 'tertiary consumers'][steps - 1]
    return {
      topic: 'Energy flow',
      prompt: `Producers in an ecosystem fix ${start.toLocaleString('en-US')} kcal. By the 10% rule, about how much energy reaches ${levels}?`,
      ...numOpts(end, [start / 100 ** steps, end * 10, end / 10, start / 2], 'kcal'),
      hint: 'About 10% of energy is passed on at each trophic level.',
      explanation: `${start.toLocaleString('en-US')} × 0.1^${steps} = ${num(end)} kcal.`,
    }
  }),
  g(1, 'Surface area & volume', rng => {
    const s = pick(rng, [1, 2, 3, 4, 6])
    const sa = 6 * s * s, vol = s ** 3
    return {
      topic: 'Surface area & volume',
      prompt: `A cubic cell has side length ${s} µm. What is its surface-area-to-volume ratio?`,
      correct: M(`${fTex(F(sa, vol))}\\,\\mu\\text{m}^{-1}`),
      wrong: [F(vol, sa), F(sa, s), F(6 * s, 1), F(s, 6), F(sa / 2, vol), F(sa * 2, vol), F(sa, vol * 2), F(6, s * s)].map(x => M(`${fTex(x)}\\,\\mu\\text{m}^{-1}`)),
      hint: 'Surface area of a cube = 6s²; volume = s³.',
      explanation: `${M(`\\frac{6s^2}{s^3} = \\frac{6}{s} = ${fTex(F(6, s))}`)}. Bigger cells have a smaller ratio.`,
    }
  }),
  g(1, 'Cardiac output', rng => {
    const hr = randInt(rng, 55, 100), sv = randInt(rng, 55, 90)
    return {
      topic: 'Cardiac output',
      prompt: `A person's heart beats ${hr} times per minute and pumps ${sv} mL of blood per beat. What is the cardiac output?`,
      ...numOpts((hr * sv) / 1000, [hr + sv, (hr * sv) / 100, hr / sv, hr * sv], 'L/min'),
      hint: 'Cardiac output = heart rate × stroke volume. Convert mL to L at the end.',
      explanation: `${hr} × ${sv} = ${hr * sv} mL/min = ${num((hr * sv) / 1000)} L/min.`,
    }
  }),

  // ---------- Medium ----------
  g(2, 'Dihybrid crosses', rng => {
    const [label, n] = pick(rng, [['A_B_ (both dominant)', 9], ['A_bb (dominant, recessive)', 3], ['aaB_ (recessive, dominant)', 3], ['aabb (both recessive)', 1]] as [string, number][])
    return {
      topic: 'Dihybrid crosses',
      prompt: `Two independently assorting genes are crossed: ${M('\\text{AaBb}\\times\\text{AaBb}')}. What fraction of offspring are ${label}?`,
      correct: FR(n, 16),
      wrong: [FR(1, 16), FR(3, 16), FR(9, 16), FR(1, 4), FR(1, 8)],
      hint: 'Multiply the monohybrid probabilities for each gene (3/4 dominant, 1/4 recessive).',
      explanation: `The classic 9:3:3:1 ratio gives ${n}/16.`,
    }
  }),
  g(2, 'Hardy–Weinberg', rng => {
    const q2 = pick(rng, [0.01, 0.04, 0.09, 0.16, 0.25, 0.36, 0.49]), q = Math.sqrt(q2), p = 1 - q
    const ask = pick(rng, ['carriers', 'p', 'dom'] as const)
    const ans = ask === 'carriers' ? 2 * p * q : ask === 'p' ? p : 1 - q2
    const lab = ask === 'carriers' ? 'heterozygous carriers (2pq)' : ask === 'p' ? 'the frequency of the dominant allele (p)' : 'individuals showing the dominant phenotype'
    return {
      topic: 'Hardy–Weinberg',
      prompt: `In a population at Hardy–Weinberg equilibrium, ${q2 * 100}% of individuals are homozygous recessive (q² = ${q2}). What is the frequency of ${lab}?`,
      ...numOpts(ans, [q, q2, p * p, 2 * q * q2, 1 - ans]),
      hint: 'q = √(q²), p = 1 − q, and the genotype frequencies are p² + 2pq + q² = 1.',
      explanation: `q = ${num(q)}, p = ${num(p)}. Answer: ${num(ans)}.`,
    }
  }),
  g(2, 'Population growth', rng => {
    const N0 = pick(rng, [10, 50, 100, 200]), td = pick(rng, [20, 30, 60]), t = td * randInt(rng, 2, 6)
    const n = t / td
    return {
      topic: 'Population growth',
      prompt: `A bacterial culture starts with ${N0} cells and doubles every ${td} minutes. How many cells are there after ${t} minutes?`,
      ...numOpts(N0 * 2 ** n, [N0 * n, N0 * 2 * n, N0 * 2 ** (n - 1), N0 * 2 ** (n + 1)], ''),
      hint: 'Number of doublings = elapsed time ÷ doubling time.',
      explanation: `${n} doublings: ${N0} × 2^${n} = ${num(N0 * 2 ** n, 6)}.`,
    }
  }),
  g(2, 'Mark–recapture', rng => {
    const Mk = randInt(rng, 2, 10) * 10, C = randInt(rng, 3, 10) * 10, R = randInt(rng, 2, 8) * 2
    const N = (Mk * C) / R
    return {
      topic: 'Mark–recapture',
      prompt: `Researchers mark ${Mk} fish and release them. Later they catch ${C} fish, of which ${R} are marked. Estimate the population size.`,
      ...numOpts(N, [Mk + C, (Mk * R) / C, (C * R) / Mk, Mk * C], ''),
      hint: 'Lincoln–Petersen: N = (marked × total recaptured) ÷ marked recaptured.',
      explanation: `${M(`N = \\frac{${Mk}\\times${C}}{${R}} = ${num(N)}`)}.`,
    }
  }),
  g(2, 'Serial dilution', rng => {
    const v = pick(rng, [9, 99]), k = randInt(rng, 2, 6)
    const factor = (v + 1) ** k
    const c0 = pick(rng, [1e9, 5e8, 2e8, 1e10])
    return {
      topic: 'Serial dilution',
      prompt: `A culture contains ${M(`${(c0 / 1e9).toLocaleString('en-US')}\\times10^9`)} cells/mL. You transfer 1 mL into ${v} mL of diluent, and repeat this ${k} time${k > 1 ? 's' : ''} in series. What is the final concentration (cells/mL)?`,
      ...numOpts(c0 / factor, [c0 / (factor / (v + 1)), c0 / (v * k), c0 * factor, c0 / (k * (v + 1))], ''),
      hint: `Each step dilutes by a factor of ${v + 1} (1 part in ${v + 1} total).`,
      explanation: `Total dilution = ${v + 1}^${k} = ${factor.toLocaleString('en-US')}.`,
    }
  }),
  g(2, 'Meiosis & variation', rng => {
    const k = pick(rng, [3, 4, 5, 8, 10, 23])
    const c = 2 ** k
    const f = (x: number) => String(x)
    return {
      topic: 'Meiosis & variation',
      prompt: `An organism has ${2 * k} chromosomes (2n = ${2 * k}). Ignoring crossing over, how many genetically different gametes can it produce through independent assortment?`,
      correct: f(c),
      wrong: [f(2 * k), f(k * k), f(2 ** (2 * k)), f(k), f(c * 2)],
      hint: 'Each of the n homologous pairs can orient in 2 ways.',
      explanation: `2^${k} = ${c.toLocaleString('en-US')}.`,
    }
  }),
  g(2, 'Genetic code', rng => {
    const codons = Array.from({ length: 3 }, () => {
      for (;;) {
        const c = Array.from({ length: 3 }, () => pick(rng, 'ACGU'.split(''))).join('')
        if (translate(c.replace(/U/g, 'T')) !== '*') return c
      }
    })
    const aa = codons.map(c => AA_NAME[translate(c.replace(/U/g, 'T'))])
    const wrongs = Array.from({ length: 6 }, () =>
      codons.map(c => {
        const mut = c.split('')
        mut[randInt(rng, 0, 2)] = pick(rng, 'ACGU'.split(''))
        return AA_NAME[translate(mut.join('').replace(/U/g, 'T'))]
      }).join('–'),
    )
    return {
      topic: 'Genetic code',
      prompt: `What peptide does the mRNA 5′-${codons.join('')}-3′ code for (starting at the first codon)?`,
      correct: aa.join('–'),
      wrong: [aa.slice().reverse().join('–'), ...wrongs],
      hint: 'Read the mRNA three bases at a time and use the codon table.',
      explanation: `${codons.join(' | ')} → ${aa.join('–')}.`,
    }
  }),
  g(2, 'Water potential', rng => {
    const C = pick(rng, [0.1, 0.2, 0.3, 0.5]), T = pick(rng, [293, 298]), Pp = pick(rng, [0, 0.5, 1.0, 2.0])
    const psiS = -1 * C * 0.0831 * T
    const psi = psiS + Pp
    return {
      topic: 'Water potential',
      prompt: `A plant cell is in a solution with C = ${C} M (non-ionizing solute, i = 1) at ${T} K. Pressure potential is ${Pp} bar. What is the water potential Ψ? (Ψs = −iCRT, R = 0.0831 L·bar/mol·K)`,
      ...numOpts(psi, [-psiS + Pp, psiS - Pp, psiS, -psi], 'bar'),
      hint: 'Ψ = Ψs + Ψp. Compute the solute potential first (it is negative).',
      explanation: `Ψs = −(1)(${C})(0.0831)(${T}) = ${num(psiS)} bar; Ψ = ${num(psi)} bar.`,
    }
  }),

  // ---------- Hard ----------
  g(3, 'Chi-square test', rng => {
    const N = pick(rng, [80, 120, 160, 200]), obsA = Math.round(N * 0.75) + randInt(rng, -12, 12)
    const obsB = N - obsA, eA = (N * 3) / 4, eB = N / 4
    const chi = (obsA - eA) ** 2 / eA + (obsB - eB) ** 2 / eB
    const rej = chi > 3.84
    return {
      topic: 'Chi-square test',
      prompt: `A cross is expected to give a 3:1 phenotype ratio. Among ${N} offspring you observe ${obsA} dominant and ${obsB} recessive. At p = 0.05 (critical value 3.84 for 1 degree of freedom), what do you conclude?`,
      correct: rej ? `χ² ≈ ${num(chi, 3)} > 3.84: reject the 3:1 hypothesis` : `χ² ≈ ${num(chi, 3)} < 3.84: fail to reject the 3:1 hypothesis`,
      wrong: [
        rej ? `χ² ≈ ${num(chi, 3)} < 3.84: fail to reject the 3:1 hypothesis` : `χ² ≈ ${num(chi, 3)} > 3.84: reject the 3:1 hypothesis`,
        `χ² ≈ ${num(chi * 2, 3)}: the result proves a 1:1 ratio`,
        `χ² cannot be calculated with only two categories`,
        `χ² ≈ ${num(chi / 2, 3)} and df = 2, so the test is invalid`,
      ],
      hint: 'χ² = Σ (O − E)² / E, with E = ¾N and ¼N.',
      explanation: `E = ${eA} and ${eB}. χ² = ${num(chi, 3)}, df = 1.`,
    }
  }),
  g(3, 'Logistic growth', rng => {
    const r = pick(rng, [0.2, 0.4, 0.5, 1.0]), K = pick(rng, [500, 1000, 2000]), frac = pick(rng, [0.25, 0.5, 0.75])
    const N = K * frac
    const dN = r * N * (1 - frac)
    return {
      topic: 'Logistic growth',
      prompt: `A population has r = ${r}, carrying capacity K = ${K}, and size N = ${N}. Using dN/dt = rN(K − N)/K, what is the population growth rate?`,
      ...numOpts(dN, [r * N, (r * N * K) / (K - N), r * (K - N), dN / 2], 'individuals/time'),
      hint: 'Compute (K − N)/K first; it is the fraction of capacity remaining.',
      explanation: `${r} × ${N} × (${K} − ${N})/${K} = ${num(dN)}.`,
    }
  }),
  g(3, 'Michaelis–Menten', rng => {
    const Vmax = pick(rng, [50, 100, 200]), Km = pick(rng, [2, 5, 10]), S = pick(rng, [Km / 2, Km, 2 * Km, 4 * Km, 9 * Km])
    const v = (Vmax * S) / (Km + S)
    return {
      topic: 'Michaelis–Menten',
      prompt: `An enzyme has Vmax = ${Vmax} µmol/min and Km = ${Km} mM. What is the initial reaction rate at [S] = ${num(S)} mM? (v = Vmax[S]/(Km + [S]))`,
      ...numOpts(v, [Vmax, Vmax / 2, (Vmax * Km) / (Km + S), (Vmax * S) / Km], 'µmol/min'),
      hint: 'Plug into the equation. Note that v = Vmax/2 when [S] = Km.',
      explanation: `v = (${Vmax} × ${num(S)})/(${Km} + ${num(S)}) = ${num(v)} µmol/min.`,
    }
  }),
  g(3, 'Linkage & recombination', rng => {
    const tot = pick(rng, [500, 1000, 2000]), rec = Math.round(tot * pick(rng, [0.05, 0.1, 0.12, 0.2, 0.25, 0.3]))
    return {
      topic: 'Linkage & recombination',
      prompt: `In a testcross of a dihybrid, ${rec} of ${tot} offspring are recombinants. How far apart (in map units, centimorgans) are the two genes?`,
      ...numOpts((rec / tot) * 100, [(rec / tot) * 10, 100 - (rec / tot) * 100, rec / 10, (1 - rec / tot) * 100 / 2], 'cM'),
      hint: 'Recombination frequency (%) = recombinants ÷ total × 100; 1% = 1 map unit.',
      explanation: `${rec}/${tot} = ${num((rec / tot) * 100)}% → ${num((rec / tot) * 100)} cM.`,
    }
  }),
  g(3, 'Mutations', rng => {
    for (;;) {
      const codon = Array.from({ length: 3 }, () => pick(rng, 'ACGT'.split(''))).join('')
      const aa = translate(codon)
      if (aa === '*') continue
      const pos = randInt(rng, 0, 2)
      const nb = pick(rng, 'ACGT'.split('').filter(b => b !== codon[pos]))
      const mut = codon.slice(0, pos) + nb + codon.slice(pos + 1)
      const aa2 = translate(mut)
      const kind = aa2 === aa ? 'silent' : aa2 === '*' ? 'nonsense' : 'missense'
      const m = toRNA(codon), m2 = toRNA(mut)
      return {
        topic: 'Mutations',
        prompt: `A point mutation changes the mRNA codon ${m} (${AA_NAME[aa]}) to ${m2}. What type of mutation is this?`,
        correct: kind,
        wrong: ['silent', 'missense', 'nonsense', 'frameshift'].filter(x => x !== kind),
        hint: 'Translate both codons and compare the amino acids. UAA, UAG, UGA are stop codons.',
        explanation: `${m} → ${AA_NAME[aa]}, ${m2} → ${AA_NAME[aa2]}: a ${kind} mutation.`,
      }
    }
  }),
  g(3, 'PCR', rng => {
    const n = randInt(rng, 5, 35)
    return {
      topic: 'PCR',
      prompt: `Starting with a single double-stranded DNA template, about how many copies of the target sequence exist after ${n} ideal PCR cycles?`,
      ...numOpts(2 ** n, [n * 2, n * n, 2 ** (n - 1), 2 ** (n + 1)], '', 3),
      hint: 'Each cycle doubles the number of copies.',
      explanation: `2^${n} = ${num(2 ** n)}.`,
    }
  }),
]

