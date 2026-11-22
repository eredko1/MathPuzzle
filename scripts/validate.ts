// Shared question validator for the verify scripts.
import katex from 'katex'
import { tokenize } from '../src/quiz/rich'
import type { Question } from '../src/quiz/types'

export const state = { bad: 0 }
export const fail = (q: Question | null, msg: string) => {
  state.bad++
  if (state.bad <= 40) console.log(`FAIL [${q?.subject}/${q?.topic}/L${q?.level}] ${msg}\n   ${q?.prompt.slice(0, 160)}`)
}

export function validate(q: Question) {
  if (q.choices.length !== 4) fail(q, 'need 4 choices')
  if (new Set(q.choices).size !== 4) fail(q, `duplicate choices: ${q.choices.join(' | ')}`)
  if (q.answer < 0 || q.answer > 3) fail(q, 'answer index out of range')
  const text = [q.prompt, q.hint, q.explanation, ...q.choices].join('\n')
  if (/NaN|undefined|Infinity|\[object|-0\b(?!\.)|\+ -|- -/.test(text)) fail(q, `suspicious text: ${text.match(/NaN|undefined|Infinity|\[object|-0\b|\+ -|- -/)![0]}`)
  if (!q.hint || !q.explanation) fail(q, 'missing hint/explanation')
  for (const s of [q.prompt, q.explanation, q.hint, ...q.choices]) {
    for (const t of tokenize(s)) {
      if (t.k === 'math') {
        try {
          let warned = ''
          const w = console.warn
          console.warn = (m: string) => (warned = String(m))
          try {
            katex.renderToString(t.s, { throwOnError: true, strict: 'ignore' })
          } finally {
            console.warn = w
          }
          if (warned) fail(q, `KaTeX warning: ${warned.slice(0, 100)} in «${t.s}»`)
        } catch (e) {
          fail(q, `KaTeX: ${(e as Error).message.slice(0, 120)} in «${t.s}»`)
        }
      }
    }
  }
  if (q.check) {
    const [a, b] = q.check
    if (!(Math.abs(a - b) <= 1e-3 * Math.max(1, Math.abs(a)))) fail(q, `numeric mismatch: closed=${a} numeric=${b}`)
  }
}
