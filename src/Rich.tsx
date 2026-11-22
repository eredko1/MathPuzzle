import katex from 'katex'
import 'katex/dist/katex.min.css'
import { memo, useMemo } from 'react'
import { tokenize } from './quiz/rich'

const cache = new Map<string, string>()
function renderMath(src: string, display = false): string {
  const key = (display ? 'D' : 'I') + src
  let html = cache.get(key)
  if (html === undefined) {
    try {
      html = katex.renderToString(src, { throwOnError: false, strict: 'ignore', displayMode: display })
    } catch {
      html = src.replace(/</g, '&lt;')
    }
    if (cache.size > 800) cache.clear()
    cache.set(key, html)
  }
  return html
}

/** Renders text with $math$, `code`, ```code blocks``` and newlines. */
export default memo(function Rich({ text, className }: { text: string; className?: string }) {
  const nodes = useMemo(
    () =>
      tokenize(text).map((t, i) => {
        if (t.k === 'math') return <span key={i} className="m" dangerouslySetInnerHTML={{ __html: renderMath(t.s) }} />
        if (t.k === 'code') return <code key={i}>{t.s}</code>
        if (t.k === 'block')
          return (
            <pre key={i} className="codeblock">
              <code>{t.s}</code>
            </pre>
          )
        return t.s.split('\n').flatMap((line, j, arr) => (j < arr.length - 1 ? [line, <br key={`${i}-${j}`} />] : [line]))
      }),
    [text],
  )
  return <span className={className}>{nodes}</span>
})
