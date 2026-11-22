import type { Gen, Level, Rng, Spec } from '../types'
import { M, pick, randInt, shuffle } from '../util'

const g = (level: Level, topic: string, make: (rng: Rng) => Spec): Gen => ({ level, topic, make })
const take = <T,>(rng: Rng, list: T[], not: (x: T) => boolean, n: number) => shuffle(rng, list.filter(x => !not(x))).slice(0, n)
const C = (s: string | number) => `\`${s}\``

// ---------------- Chemistry: the periodic table ----------------
type El = [string, string, number, string]
const ELEMENTS: El[] = [
  ['H', 'hydrogen', 1, 'nonmetal'], ['He', 'helium', 2, 'noble gas'], ['Li', 'lithium', 3, 'alkali metal'], ['Be', 'beryllium', 4, 'alkaline earth metal'], ['B', 'boron', 5, 'metalloid'],
  ['C', 'carbon', 6, 'nonmetal'], ['N', 'nitrogen', 7, 'nonmetal'], ['O', 'oxygen', 8, 'nonmetal'], ['F', 'fluorine', 9, 'halogen'], ['Ne', 'neon', 10, 'noble gas'],
  ['Na', 'sodium', 11, 'alkali metal'], ['Mg', 'magnesium', 12, 'alkaline earth metal'], ['Al', 'aluminum', 13, 'post-transition metal'], ['Si', 'silicon', 14, 'metalloid'],
  ['P', 'phosphorus', 15, 'nonmetal'], ['S', 'sulfur', 16, 'nonmetal'], ['Cl', 'chlorine', 17, 'halogen'], ['Ar', 'argon', 18, 'noble gas'], ['K', 'potassium', 19, 'alkali metal'],
  ['Ca', 'calcium', 20, 'alkaline earth metal'], ['Ti', 'titanium', 22, 'transition metal'], ['Cr', 'chromium', 24, 'transition metal'], ['Mn', 'manganese', 25, 'transition metal'],
  ['Fe', 'iron', 26, 'transition metal'], ['Co', 'cobalt', 27, 'transition metal'], ['Ni', 'nickel', 28, 'transition metal'], ['Cu', 'copper', 29, 'transition metal'],
  ['Zn', 'zinc', 30, 'transition metal'], ['As', 'arsenic', 33, 'metalloid'], ['Br', 'bromine', 35, 'halogen'], ['Kr', 'krypton', 36, 'noble gas'], ['Rb', 'rubidium', 37, 'alkali metal'],
  ['Sr', 'strontium', 38, 'alkaline earth metal'], ['Ag', 'silver', 47, 'transition metal'], ['Sn', 'tin', 50, 'post-transition metal'], ['I', 'iodine', 53, 'halogen'],
  ['Xe', 'xenon', 54, 'noble gas'], ['Cs', 'cesium', 55, 'alkali metal'], ['Ba', 'barium', 56, 'alkaline earth metal'], ['W', 'tungsten', 74, 'transition metal'],
  ['Pt', 'platinum', 78, 'transition metal'], ['Au', 'gold', 79, 'transition metal'], ['Hg', 'mercury', 80, 'transition metal'], ['Pb', 'lead', 82, 'post-transition metal'], ['U', 'uranium', 92, 'actinide'],
]
const CATS = ['alkali metal', 'alkaline earth metal', 'halogen', 'noble gas', 'transition metal', 'metalloid', 'nonmetal']
const elements: Gen[] = [
  g(1, 'Periodic table', rng => {
    const [sym, name] = pick(rng, ELEMENTS)
    return { topic: 'Periodic table', prompt: `What is the chemical symbol for ${name}?`, correct: sym, wrong: take(rng, ELEMENTS, e => e[0] === sym, 4).map(e => e[0]), hint: 'Some symbols come from Latin names (Fe, Au, Ag, Pb, Na, K, Hg, Sn).', explanation: `${name} is ${sym}.` }
  }),
  g(1, 'Periodic table', rng => {
    const [sym, name] = pick(rng, ELEMENTS)
    return { topic: 'Periodic table', prompt: `Which element has the symbol ${sym}?`, correct: name, wrong: take(rng, ELEMENTS, e => e[0] === sym, 4).map(e => e[1]), hint: 'Think of common substances that contain it.', explanation: `${sym} is ${name}.` }
  }),
  g(2, 'Periodic table', rng => {
    const [sym, name, z] = pick(rng, ELEMENTS)
    return { topic: 'Periodic table', prompt: `What is the atomic number of ${name} (${sym})?`, correct: String(z), wrong: take(rng, ELEMENTS, e => e[2] === z, 6).map(e => String(e[2])), hint: 'The atomic number is the number of protons.', explanation: `${name} has ${z} protons.` }
  }),
  g(2, 'Periodic table', rng => {
    const [, name, z] = pick(rng, ELEMENTS)
    return { topic: 'Periodic table', prompt: `Which element has atomic number ${z}?`, correct: name, wrong: take(rng, ELEMENTS, e => e[2] === z, 4).map(e => e[1]), hint: 'Count along the periodic table.', explanation: `Atomic number ${z} is ${name}.` }
  }),
  g(2, 'Periodic table', rng => {
    const cand = ELEMENTS.filter(e => CATS.includes(e[3]))
    const [, name, , cat] = pick(rng, cand)
    return { topic: 'Periodic table', prompt: `${name[0].toUpperCase() + name.slice(1)} belongs to which family of elements?`, correct: cat, wrong: CATS.filter(c => c !== cat).slice(0, 6), hint: 'Use its column in the periodic table.', explanation: `${name} is a(n) ${cat}.` }
  }),
]

// ---------------- Physics: units, prefixes, conversions ----------------
const UNITS: [string, string, string][] = [
  ['force', 'newton', 'N'], ['energy', 'joule', 'J'], ['power', 'watt', 'W'], ['pressure', 'pascal', 'Pa'], ['frequency', 'hertz', 'Hz'], ['electric charge', 'coulomb', 'C'],
  ['electric potential', 'volt', 'V'], ['electrical resistance', 'ohm', 'Ω'], ['capacitance', 'farad', 'F'], ['inductance', 'henry', 'H'], ['magnetic flux density', 'tesla', 'T'],
  ['magnetic flux', 'weber', 'Wb'], ['electrical conductance', 'siemens', 'S'], ['radioactivity', 'becquerel', 'Bq'], ['absorbed dose', 'gray', 'Gy'], ['temperature (absolute)', 'kelvin', 'K'],
  ['amount of substance', 'mole', 'mol'], ['luminous intensity', 'candela', 'cd'], ['electric current', 'ampere', 'A'],
]
const PREFIX: [string, string, number][] = [['kilo', 'k', 3], ['mega', 'M', 6], ['giga', 'G', 9], ['tera', 'T', 12], ['milli', 'm', -3], ['micro', 'μ', -6], ['nano', 'n', -9], ['pico', 'p', -12], ['centi', 'c', -2]]
const CONV: [string, string, number, string][] = [
  ['km', 'm', 1000, 'length'], ['m', 'cm', 100, 'length'], ['cm', 'mm', 10, 'length'], ['kg', 'g', 1000, 'mass'], ['g', 'mg', 1000, 'mass'], ['L', 'mL', 1000, 'volume'],
  ['hours', 'minutes', 60, 'time'], ['minutes', 'seconds', 60, 'time'], ['days', 'hours', 24, 'time'], ['MB', 'KB', 1000, 'data'], ['GHz', 'MHz', 1000, 'frequency'], ['kW', 'W', 1000, 'power'],
]
const unitsGens: Gen[] = [
  g(1, 'Units', rng => {
    const [q, name, sym] = pick(rng, UNITS)
    return { topic: 'Units', prompt: `What is the SI unit of ${q}?`, correct: `${name} (${sym})`, wrong: take(rng, UNITS, u => u[1] === name, 4).map(u => `${u[1]} (${u[2]})`), hint: 'Many SI units are named after scientists.', explanation: `The SI unit of ${q} is the ${name}, symbol ${sym}.` }
  }),
  g(2, 'Units', rng => {
    const [q, name, sym] = pick(rng, UNITS)
    return { topic: 'Units', prompt: `The ${name} (${sym}) is the SI unit of which quantity?`, correct: q, wrong: take(rng, UNITS, u => u[1] === name, 4).map(u => u[0]), hint: 'Recall where the unit is used.', explanation: `${name} measures ${q}.` }
  }),
  g(2, 'Units', rng => {
    const [n, sym, e] = pick(rng, PREFIX)
    const pw = (x: number) => M(`10^{${x}}`)
    return { topic: 'Units', prompt: `The SI prefix “${n}” (${sym}) stands for which power of ten?`, correct: pw(e), wrong: [3, 6, 9, 12, -2, -3, -6, -9, -12].filter(x => x !== e).slice(0, 8).map(pw), hint: 'kilo = 10³, milli = 10⁻³; each step of 3 is a thousand.', explanation: `${n} means ${M(`10^{${e}}`)}.` }
  }),
  g(1, 'Unit conversion', rng => {
    const [from, to, f, kind] = pick(rng, CONV)
    const v = pick(rng, [2, 3, 4, 5, 6, 7, 8, 12, 15, 25, 40, 2.5, 0.5, 1.5, 3.5, 0.25])
    const ans = v * f
    const fmt = (x: number) => String(Number(x.toPrecision(10)))
    return {
      topic: 'Unit conversion',
      prompt: `Convert ${v} ${from} to ${to}. (${kind})`,
      correct: `${fmt(ans)} ${to}`,
      wrong: [v / f, v * f * 10, v * f / 10, v * (f + 1)].map(x => `${fmt(x)} ${to}`),
      hint: `1 ${from} = ${f} ${to}. Going to the smaller unit gives a bigger number.`,
      explanation: `${v} × ${f} = ${fmt(ans)} ${to}.`,
    }
  }),
  g(2, 'Unit conversion', rng => {
    const kmh = pick(rng, [18, 36, 54, 72, 90, 108, 144])
    const ms = kmh / 3.6
    return { topic: 'Unit conversion', prompt: `A cyclist rides at ${kmh} km/h. What is that in m/s?`, correct: `${ms} m/s`, wrong: [kmh * 3.6, kmh / 36, kmh * 1000, kmh / 6].map(x => `${Number(x.toPrecision(6))} m/s`), hint: 'Divide km/h by 3.6 to get m/s.', explanation: `${kmh} ÷ 3.6 = ${ms} m/s.` }
  }),
]

// ---------------- Biology: organs & systems ----------------
const ORGANS: [string, string][] = [
  ['heart', 'pumps blood through the body'], ['lungs', 'exchange oxygen and carbon dioxide with the blood'], ['kidneys', 'filter blood and make urine'], ['liver', 'detoxifies blood and makes bile'],
  ['pancreas', 'makes insulin and digestive enzymes'], ['stomach', 'mixes food with acid and enzymes'], ['small intestine', 'absorbs most nutrients from food'], ['large intestine', 'absorbs water and forms feces'],
  ['brain', 'processes information and controls the body'], ['spinal cord', 'carries signals between brain and body'], ['thyroid gland', 'regulates metabolism with thyroxine'], ['pituitary gland', 'releases hormones that control other glands'],
  ['spleen', 'filters blood and recycles old red blood cells'], ['gallbladder', 'stores bile'], ['bladder', 'stores urine'], ['skin', 'protects the body and helps regulate temperature'], ['bone marrow', 'produces blood cells'],
  ['adrenal glands', 'release adrenaline and cortisol'], ['esophagus', 'carries food from the mouth to the stomach'], ['trachea', 'carries air to the lungs'], ['diaphragm', 'drives breathing by contracting'],
  ['thymus', 'matures T cells'], ['cerebellum', 'coordinates balance and movement'], ['retina', 'detects light and sends signals to the brain'], ['cochlea', 'turns sound vibrations into nerve signals'],
]
const organs = g(1, 'Human body', rng => {
  const [o, fn] = pick(rng, ORGANS)
  return { topic: 'Human body', prompt: `What is the main function of the ${o}?`, correct: fn, wrong: take(rng, ORGANS, x => x[0] === o, 4).map(x => x[1]), hint: 'Think about which body system it belongs to.', explanation: `The ${o} ${fn}.` }
})
const organs2 = g(2, 'Human body', rng => {
  const [o, fn] = pick(rng, ORGANS)
  return { topic: 'Human body', prompt: `Which organ or structure ${fn}?`, correct: o, wrong: take(rng, ORGANS, x => x[0] === o, 4).map(x => x[0]), hint: 'Match the function to the organ.', explanation: `That is the ${o}.` }
})

// ---------------- CS: operator precedence, Big-O facts ----------------
function evalPrec(nums: number[], ops: string[]): number {
  const n = [nums[0]]
  const o: string[] = []
  ops.forEach((op, i) => {
    const b = nums[i + 1]
    if (op === '*' || op === '/' || op === '%') {
      const a = n.pop()!
      n.push(op === '*' ? a * b : op === '/' ? Math.trunc(a / b) : a % b)
    } else {
      o.push(op)
      n.push(b)
    }
  })
  return o.reduce((r, op, i) => (op === '+' ? r + n[i + 1] : r - n[i + 1]), n[0])
}
function evalLeft(nums: number[], ops: string[]): number {
  return ops.reduce((r, op, i) => {
    const b = nums[i + 1]
    return op === '+' ? r + b : op === '-' ? r - b : op === '*' ? r * b : op === '/' ? Math.trunc(r / b) : r % b
  }, nums[0])
}
const precedence = (level: Level) =>
  g(level, 'Operator precedence', rng => {
    const pool = level === 1 ? ['+', '-', '*'] : ['+', '-', '*', '/', '%']
    for (;;) {
      const nums = Array.from({ length: 4 }, () => randInt(rng, 2, 9))
      const ops = Array.from({ length: 3 }, () => pick(rng, pool))
      const right = evalPrec(nums, ops), left = evalLeft(nums, ops)
      if (right === left || ops.every(o => o === ops[0])) continue
      const expr = nums.map((v, i) => (i < 3 ? `${v} ${ops[i]}` : String(v))).join(' ')
      return {
        topic: 'Operator precedence',
        prompt: `In Java or C (integer arithmetic), what does ${C(expr)} evaluate to?`,
        correct: C(right),
        wrong: [left, right + 1, right - 1, right + 2, right * 2].filter(x => x !== right).map(C),
        hint: '*, / and % are evaluated before + and -; equal precedence goes left to right; integer division truncates.',
        explanation: `With the correct precedence the result is ${right} (evaluating strictly left to right would give ${left}).`,
      }
    }
  })
const BIGO: [string, string][] = [
  ['reading an array element by index', 'O(1)'], ['searching an unsorted array for a value', 'O(n)'], ['binary search on a sorted array', 'O(log n)'], ['pushing onto a stack', 'O(1)'],
  ['looking up a key in a hash table (average case)', 'O(1)'], ['searching a balanced binary search tree', 'O(log n)'], ['inserting into a binary heap', 'O(log n)'], ['merge sort (worst case)', 'O(n log n)'],
  ['bubble sort (worst case)', 'O(n²)'], ['selection sort (any case)', 'O(n²)'], ['quicksort (average case)', 'O(n log n)'], ['inserting at the front of an array of n items', 'O(n)'],
  ['finding the maximum of an unsorted list', 'O(n)'], ['traversing a graph with BFS (V vertices, E edges)', 'O(V + E)'], ['removing the head of a linked list', 'O(1)'],
  ['searching a linked list', 'O(n)'], ['building a heap from n items', 'O(n)'], ['two nested loops each running n times', 'O(n²)'], ['checking all subsets of n items', 'O(2ⁿ)'],
]
const BIGO_ALL = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)', 'O(V + E)']
const bigo = g(2, 'Complexity facts', rng => {
  const [op, c] = pick(rng, BIGO)
  return { topic: 'Complexity facts', prompt: `What is the time complexity of ${op}?`, correct: c, wrong: shuffle(rng, BIGO_ALL.filter(x => x !== c)).slice(0, 4), hint: 'Ask how the work grows as the input doubles.', explanation: `${op[0].toUpperCase() + op.slice(1)} is ${c}.` }
})

export const factGens: Record<'chem' | 'physics' | 'bio' | 'cs', Gen[]> = {
  chem: elements,
  physics: unitsGens,
  bio: [organs, organs2],
  cs: [precedence(1), precedence(2), bigo],
}
