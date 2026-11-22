import type { Gen, Level } from '../types'
import { pick, randInt, shuffle } from '../util'

const g = (level: Level, topic: string, make: Gen['make']): Gen => ({ level, topic, make })
const C = (s: string | number | boolean) => `\`${s}\``
const block = (code: string) => '```\n' + code + '\n```'
/** Integer answer options with the usual off-by-one suspects. */
function intOpts(c: number, slips: number[] = []) {
  const all = [...slips, c + 1, c - 1, c + 2, c * 2, c - 2, c + 3, Math.floor(c / 2), c * 3, c + 10]
  return { correct: C(c), wrong: all.filter(x => x !== c && Number.isFinite(x) && x >= 0).map(C) }
}
function strOpts(c: string, slips: string[] = []) {
  return { correct: C(c), wrong: slips.filter(x => x !== c).map(C) }
}
const javaDiv = (a: number, b: number) => Math.trunc(a / b)

export const cs: Gen[] = [
  // ---------- Easy: CS Principles & first programs ----------
  g(1, 'Binary & number systems', rng => {
    const n = randInt(rng, 5, 200), kind = pick(rng, ['toBin', 'fromBin', 'toHex'] as const)
    if (kind === 'toBin')
      return {
        topic: 'Binary & number systems',
        prompt: `What is the decimal number ${n} in binary?`,
        ...strOpts(n.toString(2), [(n + 1).toString(2), (n - 1).toString(2), (n ^ 4).toString(2), (n ^ 1 ^ 2).toString(2)]),
        hint: 'Repeatedly divide by 2 and read the remainders bottom-up, or subtract powers of two.',
        explanation: `${n} = ${n.toString(2)} in binary.`,
      }
    if (kind === 'fromBin')
      return {
        topic: 'Binary & number systems',
        prompt: `What is the binary number ${C(n.toString(2))} in decimal?`,
        ...intOpts(n, [n + 1, n - 1, parseInt(n.toString(2).split('').reverse().join(''), 2)]),
        hint: 'Add the place values (128, 64, 32, 16, 8, 4, 2, 1) wherever there is a 1.',
        explanation: `${n.toString(2)}₂ = ${n}.`,
      }
    return {
      topic: 'Binary & number systems',
      prompt: `What is the decimal number ${n} in hexadecimal?`,
      ...strOpts(n.toString(16).toUpperCase(), [(n + 1).toString(16).toUpperCase(), (n - 1).toString(16).toUpperCase(), (n + 16).toString(16).toUpperCase(), n.toString(8)]),
      hint: 'Divide by 16: the quotient is the first digit, the remainder the second (10–15 are A–F).',
      explanation: `${n} = ${n.toString(16).toUpperCase()}₁₆.`,
    }
  }),
  g(1, 'Bits & data', rng => {
    const items = 2 ** randInt(rng, 3, 10) - (rng() < 0.5 ? 0 : randInt(rng, 1, 3))
    if (rng() < 0.5)
      return {
        topic: 'Bits & data',
        prompt: `What is the minimum number of bits needed to give ${items} different items unique binary codes?`,
        ...intOpts(Math.ceil(Math.log2(items))),
        hint: 'n bits give 2ⁿ distinct codes.',
        explanation: `2^${Math.ceil(Math.log2(items))} ≥ ${items}.`,
      }
    const w = randInt(rng, 2, 40) * 10, h = randInt(rng, 2, 40) * 10, bpp = pick(rng, [8, 24])
    const bytes = (w * h * bpp) / 8
    return {
      topic: 'Bits & data',
      prompt: `An uncompressed ${w}×${h} image uses ${bpp} bits per pixel. How many bytes is it?`,
      ...intOpts(bytes, [w * h * bpp, w * h, (w * h * bpp) / 16]),
      hint: 'pixels × bits per pixel ÷ 8 bits per byte.',
      explanation: `${w}×${h}×${bpp}/8 = ${bytes} bytes.`,
    }
  }),
  g(1, 'Loop tracing', rng => {
    const a = randInt(rng, 0, 4), b = randInt(rng, a + 3, a + 9), step = pick(rng, [1, 2, 3])
    let s = 0, cnt = 0
    for (let i = a; i < b; i += step) {
      s += i
      cnt++
    }
    const ask = pick(rng, ['sum', 'count'] as const)
    return {
      topic: 'Loop tracing',
      prompt: `What is the value of ${C(ask)} after this code runs?\n${block(`int sum = 0;\nint count = 0;\nfor (int i = ${a}; i < ${b}; i += ${step}) {\n    sum += i;\n    count++;\n}`)}`,
      ...intOpts(ask === 'sum' ? s : cnt, ask === 'sum' ? [s + b, s - a, (b * (b - 1)) / 2] : [Math.ceil((b - a) / step) + 1, Math.floor((b - a) / step) - 1]),
      hint: 'Write out the values i takes; note the loop stops when i < b is false.',
      explanation: `i takes the values ${Array.from({ length: cnt }, (_, k) => a + k * step).join(', ')}. sum = ${s}, count = ${cnt}.`,
    }
  }),
  g(1, 'Integer division & modulo', rng => {
    const a = randInt(rng, 10, 99), b = randInt(rng, 3, 9), kind = pick(rng, ['/', '%'] as const)
    const ans = kind === '/' ? javaDiv(a, b) : a % b
    return {
      topic: 'Integer division & modulo',
      prompt: `In Java, what does ${C(`${a} ${kind} ${b}`)} evaluate to?`,
      ...intOpts(ans, kind === '/' ? [Math.ceil(a / b), a % b] : [javaDiv(a, b), b - (a % b)]),
      hint: kind === '/' ? 'Integer division discards the fractional part.' : '% gives the remainder after division.',
      explanation: `${a} = ${b} × ${javaDiv(a, b)} + ${a % b}.`,
    }
  }),
  g(1, 'Boolean logic', rng => {
    const a = rng() < 0.5, b = rng() < 0.5, c = rng() < 0.5
    const forms: [string, boolean][] = [
      [`${a} && ${b} || ${c}`, (a && b) || c],
      [`!${a} || ${b} && ${c}`, !a || (b && c)],
      [`!(${a} && ${b})`, !(a && b)],
      [`${a} != ${b}`, a !== b],
    ]
    const [expr, val] = pick(rng, forms)
    return {
      topic: 'Boolean logic',
      prompt: `What is the value of the Java expression ${C(expr)}?`,
      correct: C(val),
      wrong: [C(!val), 'It does not compile', 'It depends on the order the compiler chooses'],
      hint: '! binds tightest, then &&, then ||.',
      explanation: `Evaluating with precedence gives ${val}.`,
    }
  }),
  g(1, 'Strings', rng => {
    const words = ['computer', 'algorithm', 'programming', 'variable', 'function', 'recursion', 'compile', 'boolean']
    const w = pick(rng, words), i = randInt(rng, 0, 3), j = randInt(rng, i + 2, Math.min(w.length, i + 5))
    const kind = pick(rng, ['substring', 'charAt', 'indexOf', 'length'] as const)
    if (kind === 'substring')
      return {
        topic: 'Strings',
        prompt: `What does ${C(`"${w}".substring(${i}, ${j})`)} return?`,
        ...strOpts(w.substring(i, j), [w.substring(i, j + 1), w.substring(i + 1, j), w.substring(i - 1 < 0 ? 0 : i - 1, j - 1), w.substring(i), w.substring(i + 1, j + 1), w.substring(i, j - 1), w.substring(Math.max(0, i - 1), j)]),
        hint: 'substring(a, b) includes index a but stops before index b.',
        explanation: `Characters at indices ${i}..${j - 1}: "${w.substring(i, j)}".`,
      }
    if (kind === 'charAt')
      return {
        topic: 'Strings',
        prompt: `What does ${C(`"${w}".charAt(${i + 1})`)} return?`,
        ...strOpts(w[i + 1], [w[i], w[i + 2], w[i + 3], w[i - 1], w[w.length - 1], w[0], w[2]].filter(Boolean) as string[]),
        hint: 'String indices start at 0.',
        explanation: `Index ${i + 1} is '${w[i + 1]}'.`,
      }
    if (kind === 'length')
      return {
        topic: 'Strings',
        prompt: `What does ${C(`"${w}".length()`)} return?`,
        ...intOpts(w.length),
        hint: 'Count the characters.',
        explanation: `${w} has ${w.length} letters.`,
      }
    const ch = w[randInt(rng, 1, w.length - 1)]
    return {
      topic: 'Strings',
      prompt: `What does ${C(`"${w}".indexOf("${ch}")`)} return?`,
      ...intOpts(w.indexOf(ch), [w.lastIndexOf(ch) === w.indexOf(ch) ? w.indexOf(ch) + 1 : w.lastIndexOf(ch)]),
      hint: 'indexOf returns the position of the first match (0-based).',
      explanation: `First '${ch}' is at index ${w.indexOf(ch)}.`,
    }
  }),

  // ---------- Medium: AP CS A ----------
  g(2, 'Recursion', rng => {
    const kind = pick(rng, ['sum', 'fact', 'fib', 'pow'] as const), n = randInt(rng, 3, 8)
    const fib = (k: number): number => (k < 2 ? k : fib(k - 1) + fib(k - 2))
    const defs = {
      sum: { code: `int f(int n) {\n    if (n == 0) return 0;\n    return n + f(n - 1);\n}`, v: (n * (n + 1)) / 2 },
      fact: { code: `int f(int n) {\n    if (n <= 1) return 1;\n    return n * f(n - 1);\n}`, v: [1, 1, 2, 6, 24, 120, 720, 5040, 40320][n] },
      fib: { code: `int f(int n) {\n    if (n < 2) return n;\n    return f(n - 1) + f(n - 2);\n}`, v: fib(n) },
      pow: { code: `int f(int n) {\n    if (n == 0) return 1;\n    return 2 * f(n - 1);\n}`, v: 2 ** n },
    }[kind]
    return {
      topic: 'Recursion',
      prompt: `What does ${C(`f(${n})`)} return?\n${block(defs.code)}`,
      ...intOpts(defs.v, [defs.v + n, defs.v - n, n * n]),
      hint: 'Expand the calls until you reach the base case, then combine the results back up.',
      explanation: `f(${n}) = ${defs.v}.`,
    }
  }),
  g(2, 'Array tracing', rng => {
    const n = randInt(rng, 5, 7), arr = Array.from({ length: n }, () => randInt(rng, 1, 20))
    const kind = pick(rng, ['max', 'count', 'sumEven', 'shift'] as const)
    const a = `int[] a = {${arr.join(', ')}};`
    if (kind === 'max')
      return {
        topic: 'Array tracing',
        prompt: `What is ${C('m')} after this code runs?\n${block(`${a}\nint m = a[0];\nfor (int i = 1; i < a.length; i++) {\n    if (a[i] > m) m = a[i];\n}`)}`,
        ...intOpts(Math.max(...arr), [arr[0], arr[arr.length - 1], Math.min(...arr)]),
        hint: 'm always holds the largest value seen so far.',
        explanation: `The maximum of ${arr.join(', ')} is ${Math.max(...arr)}.`,
      }
    if (kind === 'count') {
      const t = randInt(rng, 6, 14), cnt = arr.filter(x => x > t).length
      return {
        topic: 'Array tracing',
        prompt: `What is ${C('c')} after this code runs?\n${block(`${a}\nint c = 0;\nfor (int x : a) {\n    if (x > ${t}) c++;\n}`)}`,
        ...intOpts(cnt, [arr.filter(x => x >= t).length, arr.length - cnt]),
        hint: 'Count how many elements are strictly greater than the threshold.',
        explanation: `Elements > ${t}: ${arr.filter(x => x > t).join(', ') || 'none'} → ${cnt}.`,
      }
    }
    if (kind === 'sumEven') {
      const s = arr.reduce((acc, x, i) => (i % 2 === 0 ? acc + x : acc), 0)
      return {
        topic: 'Array tracing',
        prompt: `What is ${C('s')} after this code runs?\n${block(`${a}\nint s = 0;\nfor (int i = 0; i < a.length; i += 2) {\n    s += a[i];\n}`)}`,
        ...intOpts(s, [arr.reduce((p, x) => p + x, 0) - s, arr.reduce((acc, x, i) => (i % 2 === 1 ? acc + x : acc), 0)]),
        hint: 'i = 0, 2, 4, … — only even indices are added.',
        explanation: `Indices 0, 2, 4…: ${arr.filter((_, i) => i % 2 === 0).join(' + ')} = ${s}.`,
      }
    }
    const b = arr.slice()
    for (let i = b.length - 1; i > 0; i--) b[i] = b[i - 1]
    const k = randInt(rng, 0, n - 1)
    return {
      topic: 'Array tracing',
      prompt: `What is ${C(`a[${k}]`)} after this code runs?\n${block(`${a}\nfor (int i = a.length - 1; i > 0; i--) {\n    a[i] = a[i - 1];\n}`)}`,
      ...intOpts(b[k], [arr[k], arr[(k + 1) % n], arr[Math.max(0, k - 2)], b[(k + 1) % n]]),
      hint: 'Going from the back, each element is overwritten by its left neighbour; a[0] is unchanged.',
      explanation: `Result: {${b.join(', ')}}, so a[${k}] = ${b[k]}.`,
    }
  }),
  g(2, 'Nested loops', rng => {
    const n = randInt(rng, 3, 9), kind = pick(rng, ['tri', 'sq', 'half'] as const)
    let cnt = 0
    let code = ''
    if (kind === 'tri') {
      for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) cnt++
      code = `for (int i = 0; i < ${n}; i++) {\n    for (int j = 0; j <= i; j++) {\n        count++;\n    }\n}`
    } else if (kind === 'sq') {
      for (let i = 1; i <= n; i++) for (let j = i; j <= n; j++) cnt++
      code = `for (int i = 1; i <= ${n}; i++) {\n    for (int j = i; j <= ${n}; j++) {\n        count++;\n    }\n}`
    } else {
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j += 2) cnt++
      code = `for (int i = 0; i < ${n}; i++) {\n    for (int j = 0; j < ${n}; j += 2) {\n        count++;\n    }\n}`
    }
    return {
      topic: 'Nested loops',
      prompt: `How many times does ${C('count++')} execute?\n${block(code)}`,
      ...intOpts(cnt, [n * n, (n * (n - 1)) / 2, n * n - cnt]),
      hint: 'Count the inner-loop iterations for each outer value, then add them up.',
      explanation: `The total is ${cnt}.`,
    }
  }),
  g(2, 'Binary search', rng => {
    const n = pick(rng, [15, 31, 100, 255, 1000, 1023, 5000, 1000000])
    return {
      topic: 'Binary search',
      prompt: `What is the maximum number of comparisons binary search needs on a sorted array of ${n.toLocaleString('en-US')} elements?`,
      ...intOpts(Math.floor(Math.log2(n)) + 1, [Math.ceil(Math.log2(n)) - 1, Math.floor(n / 2)]),
      hint: 'Each comparison halves the remaining range. How many halvings until 1 element is left?',
      explanation: `⌊log₂(${n})⌋ + 1 = ${Math.floor(Math.log2(n)) + 1}.`,
    }
  }),
  g(2, 'Sorting passes', rng => {
    const n = 5, arr = shuffle(rng, Array.from({ length: 9 }, (_, i) => i + 1)).slice(0, n), k = randInt(rng, 1, 3)
    const kind: string = pick(rng, ['bubble', 'selection', 'insertion'])
    const a = arr.slice()
    if (kind === 'bubble') {
      for (let p = 0; p < k; p++) for (let i = 0; i < n - 1 - p; i++) if (a[i] > a[i + 1]) [a[i], a[i + 1]] = [a[i + 1], a[i]]
    } else if (kind === 'selection') {
      for (let p = 0; p < k; p++) {
        let m = p
        for (let j = p + 1; j < n; j++) if (a[j] < a[m]) m = j
        ;[a[p], a[m]] = [a[m], a[p]]
      }
    } else {
      for (let p = 1; p <= k; p++) {
        const v = a[p]
        let j = p - 1
        while (j >= 0 && a[j] > v) {
          a[j + 1] = a[j]
          j--
        }
        a[j + 1] = v
      }
    }
    const fmt = (x: number[]) => `[${x.join(', ')}]`
    const wrong = [fmt(shuffle(rng, a)), fmt(arr.slice().sort((x, y) => x - y)), fmt(arr), fmt(a.slice().reverse())]
    return {
      topic: 'Sorting passes',
      prompt: `What does ${fmt(arr)} look like after ${k} pass${k > 1 ? 'es' : ''} of ${kind} sort (ascending)?${kind === 'insertion' ? ' (Pass 1 inserts the 2nd element, pass 2 the 3rd, …)' : ''}`,
      correct: C(fmt(a)),
      wrong: wrong.filter(x => x !== fmt(a)).map(C),
      hint: kind === 'bubble' ? 'Each pass bubbles the largest remaining value to the end.' : kind === 'selection' ? 'Each pass puts the smallest remaining value at the front.' : 'The left part stays sorted; insert the next element into place.',
      explanation: `After ${k} pass(es): ${fmt(a)}.`,
    }
  }),
  g(2, 'Big-O of loops', rng => {
    const shapes: [string, string][] = [
      [`for (int i = 0; i < n; i++) {\n    sum += i;\n}`, 'O(n)'],
      [`for (int i = 0; i < n; i++) {\n    for (int j = 0; j < n; j++) {\n        sum += i * j;\n    }\n}`, 'O(n²)'],
      [`for (int i = 1; i < n; i *= 2) {\n    sum += i;\n}`, 'O(log n)'],
      [`for (int i = 0; i < n; i++) {\n    for (int j = 1; j < n; j *= 2) {\n        sum += j;\n    }\n}`, 'O(n log n)'],
      [`for (int i = 0; i < n; i++) sum += i;\nfor (int j = 0; j < n; j++) sum += j;`, 'O(n)'],
      [`for (int i = 0; i < n; i++) {\n    for (int j = 0; j < i; j++) {\n        sum++;\n    }\n}`, 'O(n²)'],
      [`int i = n;\nwhile (i > 1) {\n    i = i / 2;\n    sum++;\n}`, 'O(log n)'],
      [`for (int i = 0; i < 1000; i++) {\n    sum += i;\n}`, 'O(1)'],
    ]
    const [code, big] = pick(rng, shapes)
    const all = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)']
    return {
      topic: 'Big-O of loops',
      prompt: `What is the time complexity of this code in terms of ${C('n')}?\n${block(code)}`,
      correct: big,
      wrong: all.filter(x => x !== big),
      hint: 'Ask how the number of loop iterations grows when n doubles.',
      explanation: `The dominant growth is ${big}.`,
    }
  }),
  g(2, 'Bitwise operations', rng => {
    const a = randInt(rng, 1, 63), b = randInt(rng, 1, 63), op = pick(rng, ['&', '|', '^'] as const)
    const val = op === '&' ? a & b : op === '|' ? a | b : a ^ b
    return {
      topic: 'Bitwise operations',
      prompt: `What is ${C(`${a} ${op} ${b}`)} in Java?`,
      ...intOpts(val, [a & b, a | b, a ^ b, a + b].filter(x => x !== val)),
      hint: `Write both numbers in binary and apply ${op} to each bit position.`,
      explanation: `${a.toString(2).padStart(6, '0')} ${op} ${b.toString(2).padStart(6, '0')} = ${val.toString(2).padStart(6, '0')} = ${val}.`,
    }
  }),

  // ---------- Hard: data structures & algorithms ----------
  g(3, 'Stacks & queues', rng => {
    const isStack = rng() < 0.5, vals = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5)
    const ops: string[] = []
    const ds: number[] = []
    let next = 0
    let popped: number | null = null
    const popped_: number[] = []
    for (let k = 0; k < 7; k++) {
      if ((rng() < 0.65 && next < vals.length) || ds.length === 0) {
        if (next >= vals.length) break
        ops.push(`add(${vals[next]})`)
        ds.push(vals[next++])
      } else {
        ops.push(isStack ? 'pop()' : 'poll()')
        popped = isStack ? ds.pop()! : ds.shift()!
        popped_.push(popped)
      }
    }
    if (!popped_.length) {
      ops.push(isStack ? 'pop()' : 'poll()')
      popped_.push(isStack ? ds.pop()! : ds.shift()!)
    }
    const last = popped_[popped_.length - 1]
    return {
      topic: 'Stacks & queues',
      prompt: `Starting empty, a ${isStack ? 'stack (LIFO)' : 'queue (FIFO)'} performs: ${ops.map(C).join(', ')}, where ${isStack ? C('pop()') : C('poll()')} removes and returns an element. What does the last removal return?`,
      ...intOpts(last, vals),
      hint: isStack ? 'A stack removes the most recently added element.' : 'A queue removes the oldest element.',
      explanation: `${isStack ? 'LIFO' : 'FIFO'}: the last removal returns ${last}.`,
    }
  }),
  g(3, 'Graph traversal', rng => {
    const n = 6, names = 'ABCDEF'.split('')
    const adj: number[][] = Array.from({ length: n }, () => [])
    const edges = new Set<string>()
    const addE = (a: number, b: number) => {
      if (a === b || edges.has(`${Math.min(a, b)}-${Math.max(a, b)}`)) return
      edges.add(`${Math.min(a, b)}-${Math.max(a, b)}`)
      adj[a].push(b)
      adj[b].push(a)
    }
    for (let i = 1; i < n; i++) addE(i, randInt(rng, 0, i - 1))
    for (let k = 0; k < 2; k++) addE(randInt(rng, 0, n - 1), randInt(rng, 0, n - 1))
    adj.forEach(l => l.sort((x, y) => x - y))
    const bfs: number[] = []
    const seen = new Set([0])
    const queue = [0]
    while (queue.length) {
      const u = queue.shift()!
      bfs.push(u)
      for (const v of adj[u]) if (!seen.has(v)) (seen.add(v), queue.push(v))
    }
    const dfs: number[] = []
    const seen2 = new Set<number>()
    const go = (u: number) => {
      seen2.add(u)
      dfs.push(u)
      for (const v of adj[u]) if (!seen2.has(v)) go(v)
    }
    go(0)
    const useBfs = rng() < 0.5, ans = useBfs ? bfs : dfs
    const str = (x: number[]) => x.map(i => names[i]).join(' ')
    const alt = useBfs ? dfs : bfs
    const rev = ans.slice().reverse()
    const sw = ans.slice()
    ;[sw[1], sw[2]] = [sw[2], sw[1]]
    return {
      topic: 'Graph traversal',
      prompt: `An undirected graph has edges: ${[...edges].map(e => e.split('-').map(Number)).map(([a, b]) => `${names[a]}–${names[b]}`).join(', ')}. Starting at A and always visiting neighbours in alphabetical order, what is the ${useBfs ? 'breadth-first' : 'depth-first'} visit order?`,
      correct: C(str(ans)),
      wrong: [str(alt), str(rev), str(sw), str(ans.slice().sort((x, y) => x - y)), ...Array.from({ length: 8 }, () => str([0, ...shuffle(rng, ans.slice(1))]))].filter(x => x !== str(ans)).map(C),
      hint: useBfs ? 'BFS uses a queue: visit all neighbours of a node before going deeper.' : 'DFS goes as deep as possible along one path before backtracking.',
      explanation: `${useBfs ? 'BFS' : 'DFS'} order: ${str(ans)}.`,
    }
  }),
  g(3, 'Shortest paths', rng => {
    const n = 5, w: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity))
    const edges: [number, number, number][] = []
    for (let i = 1; i < n; i++) {
      const j = randInt(rng, 0, i - 1), c = randInt(rng, 1, 9)
      w[i][j] = w[j][i] = c
      edges.push([j, i, c])
    }
    for (let k = 0; k < 3; k++) {
      const a = randInt(rng, 0, n - 1), b = randInt(rng, 0, n - 1)
      if (a !== b && w[a][b] === Infinity) {
        const c = randInt(rng, 1, 12)
        w[a][b] = w[b][a] = c
        edges.push([Math.min(a, b), Math.max(a, b), c])
      }
    }
    const dist = Array(n).fill(Infinity)
    dist[0] = 0
    const done = new Set<number>()
    for (let k = 0; k < n; k++) {
      let u = -1
      for (let i = 0; i < n; i++) if (!done.has(i) && (u < 0 || dist[i] < dist[u])) u = i
      done.add(u)
      for (let v = 0; v < n; v++) if (w[u][v] < Infinity && dist[u] + w[u][v] < dist[v]) dist[v] = dist[u] + w[u][v]
    }
    const t = n - 1
    const direct = w[0][t]
    return {
      topic: 'Shortest paths',
      prompt: `Weighted undirected edges: ${edges.map(([a, b, c]) => `${'ABCDE'[a]}–${'ABCDE'[b]} (${c})`).join(', ')}. What is the length of the shortest path from A to E (Dijkstra's algorithm)?`,
      ...intOpts(dist[t], [direct === Infinity ? dist[t] + 4 : direct, dist[t] + 1, dist[t] - 1]),
      hint: 'Repeatedly settle the unvisited node with the smallest tentative distance and relax its edges.',
      explanation: `Dijkstra gives a shortest distance of ${dist[t]}.`,
    }
  }),
  g(3, 'Dynamic programming', rng => {
    const kind = pick(rng, ['stairs', 'lcs', 'coin'] as const)
    if (kind === 'stairs') {
      const n = randInt(rng, 5, 12), dp = [1, 1]
      for (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2]
      return {
        topic: 'Dynamic programming',
        prompt: `You climb a staircase of ${n} steps taking 1 or 2 steps at a time. How many distinct ways are there to reach the top?`,
        ...intOpts(dp[n], [dp[n - 1], dp[n + 1] ?? dp[n] + dp[n - 1], 2 ** (n - 1), n]),
        hint: 'ways(n) = ways(n−1) + ways(n−2), with ways(0) = ways(1) = 1.',
        explanation: `The sequence 1, 1, 2, 3, 5, 8, … gives ${dp[n]}.`,
      }
    }
    if (kind === 'lcs') {
      const pool = ['ABCBDAB', 'BDCABA', 'AGGTAB', 'GXTXAYB', 'XMJYAUZ', 'MZJAWXU', 'ABCDGH', 'AEDFHR']
      const [x, y] = shuffle(rng, pool).slice(0, 2)
      const dp = Array.from({ length: x.length + 1 }, () => Array(y.length + 1).fill(0))
      for (let i = 1; i <= x.length; i++) for (let j = 1; j <= y.length; j++) dp[i][j] = x[i - 1] === y[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
      const l = dp[x.length][y.length]
      return {
        topic: 'Dynamic programming',
        prompt: `What is the length of the longest common subsequence of ${C(x)} and ${C(y)}?`,
        ...intOpts(l, [Math.min(x.length, y.length), l + 1, l - 1]),
        hint: 'Build a table: matching characters extend the diagonal; otherwise take the max of the cell above or to the left.',
        explanation: `The DP table gives ${l}.`,
      }
    }
    const coins = pick(rng, [[1, 3, 4], [1, 5, 6], [1, 4, 5], [2, 5, 7]]), target = randInt(rng, 8, 14)
    const dp = Array(target + 1).fill(Infinity)
    dp[0] = 0
    for (let a = 1; a <= target; a++) for (const c of coins) if (a >= c) dp[a] = Math.min(dp[a], dp[a - c] + 1)
    const greedy = (() => {
      let rem = target, cnt = 0
      for (const c of coins.slice().reverse()) {
        cnt += Math.floor(rem / c)
        rem %= c
      }
      return rem === 0 ? cnt : dp[target] + 1
    })()
    return {
      topic: 'Dynamic programming',
      prompt: `With coins of value ${coins.join(', ')} (unlimited supply), what is the minimum number of coins needed to make ${target}?`,
      ...intOpts(dp[target], [greedy, dp[target] + 1, dp[target] - 1, Math.ceil(target / coins[coins.length - 1])]),
      hint: 'minCoins(a) = 1 + min over coins c of minCoins(a − c). Greedy can fail!',
      explanation: `The DP table gives ${dp[target]} coins.`,
    }
  }),
  g(3, 'Recurrences', rng => {
    const items: [string, string][] = [
      ['T(n) = 2T(n/2) + n', 'O(n log n)'],
      ['T(n) = T(n/2) + 1', 'O(log n)'],
      ['T(n) = T(n-1) + n', 'O(n²)'],
      ['T(n) = 2T(n-1) + 1', 'O(2ⁿ)'],
      ['T(n) = T(n-1) + 1', 'O(n)'],
      ['T(n) = 2T(n/2) + 1', 'O(n)'],
      ['T(n) = 4T(n/2) + n', 'O(n²)'],
    ]
    const [rec, big] = pick(rng, items)
    const all = ['O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)', 'O(n³)']
    return {
      topic: 'Recurrences',
      prompt: `Solve the recurrence ${C(rec)} (with T(1) = 1) asymptotically.`,
      correct: big,
      wrong: all.filter(x => x !== big),
      hint: 'Use the master theorem, or draw the recursion tree and sum the work per level.',
      explanation: `${rec} solves to ${big}.`,
    }
  }),
  g(3, 'Hashing & collisions', rng => {
    const m = pick(rng, [7, 10, 11, 13]), keys = Array.from({ length: 5 }, () => randInt(rng, 10, 99))
    const table = Array(m).fill(null).map(() => [] as number[])
    for (const k of keys) table[k % m].push(k)
    const longest = Math.max(...table.map(b => b.length))
    return {
      topic: 'Hashing & collisions',
      prompt: `Keys ${keys.join(', ')} are inserted into a hash table with ${m} buckets using ${C('hash(k) = k % ' + m)} and chaining. What is the length of the longest chain?`,
      ...intOpts(longest, [longest + 1, 1, keys.length]),
      hint: 'Compute k % m for each key and group equal remainders.',
      explanation: `Buckets: ${table.map((b, i) => (b.length ? `${i}:[${b.join(',')}]` : '')).filter(Boolean).join(' ')}. Longest chain = ${longest}.`,
    }
  }),
]

