// Tiny tokenizer for question text: $math$, `inline code`, ```fenced code``` and \$ for a literal dollar.
export type Token = { k: 'text' | 'math' | 'code' | 'block'; s: string }

export function tokenize(src: string): Token[] {
  const out: Token[] = []
  let buf = ''
  const flush = () => {
    if (buf) out.push({ k: 'text', s: buf })
    buf = ''
  }
  let i = 0
  while (i < src.length) {
    if (src.startsWith('```', i)) {
      const end = src.indexOf('```', i + 3)
      if (end > 0) {
        flush()
        out.push({ k: 'block', s: src.slice(i + 3, end).replace(/^\n/, '').replace(/\n$/, '') })
        i = end + 3
        continue
      }
    }
    const ch = src[i]
    if (ch === '\\' && src[i + 1] === '$') {
      buf += '$'
      i += 2
    } else if (ch === '$') {
      let j = i + 1
      while (j < src.length && !(src[j] === '$' && src[j - 1] !== '\\')) j++
      if (j >= src.length) {
        buf += ch
        i++
      } else {
        flush()
        out.push({ k: 'math', s: src.slice(i + 1, j) })
        i = j + 1
      }
    } else if (ch === '`') {
      const j = src.indexOf('`', i + 1)
      if (j < 0) {
        buf += ch
        i++
      } else {
        flush()
        out.push({ k: 'code', s: src.slice(i + 1, j) })
        i = j + 1
      }
    } else {
      buf += ch
      i++
    }
  }
  flush()
  return out
}
