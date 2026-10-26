import { generatePuzzle, type Difficulty } from '../src/engine/puzzle.ts'
const [d, ...keys] = process.argv.slice(2)
for (const k of keys) {
  const p = generatePuzzle(k, d as Difficulty)
  const g = Array.from({ length: p.rows }, () => Array(p.cols).fill('   '))
  for (const c of p.cells) g[c.r][c.c] = c.kind === 'num' ? (c.given ? String(c.value).padStart(3) : '  _') : c.kind === 'op' ? `  ${c.op}` : '  ='
  console.log(`${k}  ${p.rows}x${p.cols} tiles=${p.bank.length}: ${p.bank.map(t => t.value).join(' ')}`)
  console.log(g.map(r => r.join('')).join('\n') + '\n')
}
