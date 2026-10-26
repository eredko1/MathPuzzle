import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { evaluate, type Puzzle } from './engine/puzzle'
import { formatTime, type Settings } from './storage'
import { Icon } from './Icons'

export interface GameState {
  placed: (number | null)[]
  bankOrder: number[]
  hints: number
  elapsedMs: number
}

interface Props {
  puzzle: Puzzle
  label: string
  initial: GameState
  settings: Settings
  best?: number
  nextLabel: string
  onSave: (s: GameState) => void
  onSolved: (s: GameState) => void
  onNext: () => void
  onHome: () => void
  onSettings: () => void
}

type From = { kind: 'bank'; tile: number } | { kind: 'slot'; slot: number; tile: number | null }

interface Pending {
  from: From
  x: number
  y: number
  pointerId: number
  lift: number
  dragging: boolean
  rects: { slot: number; rect: DOMRect }[]
  target: number | null
}

export function starsFor(hints: number) {
  return hints === 0 ? 3 : hints <= 2 ? 2 : 1
}

export default function Game(props: Props) {
  const { puzzle, settings } = props
  const [placed, setPlaced] = useState(props.initial.placed)
  const [bankOrder, setBankOrder] = useState(props.initial.bankOrder)
  const [hints, setHints] = useState(props.initial.hints)
  const [elapsed, setElapsed] = useState(props.initial.elapsedMs)
  const [history, setHistory] = useState<(number | null)[][]>([])
  const [selected, setSelected] = useState<number | null>(() => {
    const i = props.initial.placed.indexOf(null)
    return i >= 0 ? i : null
  })
  const [drag, setDrag] = useState<{ tile: number; target: number | null; fromSlot: number | null } | null>(null)
  const [flash, setFlash] = useState<Set<number>>(new Set())
  const [hinted, setHinted] = useState<number | null>(null)
  const [solved, setSolved] = useState(false)
  const [showWin, setShowWin] = useState(false)

  const tiles = useMemo(() => new Map(puzzle.bank.map(t => [t.id, t.value])), [puzzle])
  const slotOfCell = useMemo(() => new Map(puzzle.slots.map((c, i) => [c, i])), [puzzle])
  const eqsOfCell = useMemo(() => {
    const m = new Map<number, number[]>()
    puzzle.equations.forEach((e, ei) => e.cells.forEach(c => m.set(c, [...(m.get(c) ?? []), ei])))
    return m
  }, [puzzle])

  const cellValue = useCallback(
    (ci: number, pl = placed): number | undefined => {
      const cell = puzzle.cells[ci]
      if (cell.given) return cell.value
      const t = pl[slotOfCell.get(ci)!]
      return t === null ? undefined : tiles.get(t)
    },
    [puzzle, placed, slotOfCell, tiles],
  )

  // Equation status: null = not all numbers filled yet.
  const eqStatus = useMemo(
    () =>
      puzzle.equations.map(e => {
        const [a, b, c] = [e.cells[0], e.cells[2], e.cells[4]].map(ci => cellValue(ci))
        if (a === undefined || b === undefined || c === undefined) return null
        return evaluate(a, e.op, b, c)
      }),
    [puzzle, cellValue],
  )
  const badCells = useMemo(() => {
    const s = new Set<number>()
    eqStatus.forEach((ok, i) => ok === false && puzzle.equations[i].cells.forEach(c => s.add(c)))
    return s
  }, [eqStatus, puzzle])

  // Flash equations the moment they become correct.
  const prevStatus = useRef(eqStatus)
  useEffect(() => {
    const newly = new Set<number>()
    eqStatus.forEach((ok, i) => {
      if (ok && !prevStatus.current[i]) puzzle.equations[i].cells.forEach(c => newly.add(c))
    })
    prevStatus.current = eqStatus
    if (!newly.size) return
    setFlash(newly)
    const t = setTimeout(() => setFlash(new Set()), 700)
    return () => clearTimeout(t)
  }, [eqStatus, puzzle])

  // Win check
  useEffect(() => {
    if (solved) return
    if (placed.every(p => p !== null) && eqStatus.every(Boolean)) {
      setSolved(true)
      setSelected(null)
      props.onSolved({ placed, bankOrder, hints, elapsedMs: elapsed })
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, colors: ['#F5E6AD', '#188038', '#F59E0B', '#60A5FA'] })
      })
      const t = setTimeout(() => setShowWin(true), 900)
      return () => clearTimeout(t)
    }
  }, [placed, eqStatus])

  // Timer: counts only while the page is visible and the puzzle unsolved.
  useEffect(() => {
    if (solved) return
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      if (document.visibilityState === 'visible') setElapsed(e => e + (now - last))
      last = now
    }, 1000)
    return () => clearInterval(id)
  }, [solved])

  // Persist progress
  const { onSave } = props
  // (checked from the board itself, so the save that races the win can't resurrect a finished puzzle)
  const complete = placed.every(p => p !== null) && eqStatus.every(Boolean)
  useEffect(() => {
    if (!solved && !complete) onSave({ placed, bankOrder, hints, elapsedMs: elapsed })
  }, [placed, bankOrder, hints, elapsed, solved, complete, onSave])

  // ---------- moves ----------

  const buzz = () => {
    if (settings.vibrate) navigator.vibrate?.(8)
  }

  const commit = (next: (number | null)[]) => {
    setHistory(h => [...h.slice(-200), placed])
    setPlaced(next)
  }

  const nextEmpty = (pl: (number | null)[], from: number): number | null => {
    const empties = pl.map((t, i) => (t === null ? i : -1)).filter(i => i >= 0)
    if (!empties.length) return null
    // prefer an empty slot in the same equation(s) as the one just filled
    const cell = puzzle.slots[from]
    for (const ei of eqsOfCell.get(cell) ?? []) {
      for (const ci of puzzle.equations[ei].cells) {
        const s = slotOfCell.get(ci)
        if (s !== undefined && pl[s] === null) return s
      }
    }
    return empties.find(i => i > from) ?? empties[0]
  }

  /** Put tile into slot; a tile already there swaps to the tile's old slot or returns to the bank. */
  const placeTile = (tile: number, slot: number) => {
    const next = placed.slice()
    const fromSlot = next.indexOf(tile)
    const prev = next[slot]
    if (fromSlot === slot) return next
    next[slot] = tile
    if (fromSlot >= 0) next[fromSlot] = prev
    commit(next)
    buzz()
    return next
  }

  const removeTile = (slot: number) => {
    if (placed[slot] === null) return
    const next = placed.slice()
    next[slot] = null
    commit(next)
  }

  const erase = () => {
    if (selected !== null) removeTile(selected)
  }

  const undo = () => {
    if (!history.length || solved) return
    setPlaced(history[history.length - 1])
    setHistory(h => h.slice(0, -1))
  }

  const restart = () => {
    if (solved || placed.every(p => p === null)) return
    commit(placed.map(() => null))
    setSelected(0)
  }

  const sortBank = () => {
    const sorted = bankOrder.slice().sort((a, b) => tiles.get(a)! - tiles.get(b)! || a - b)
    const isSorted = sorted.every((t, i) => t === bankOrder[i])
    setBankOrder(isSorted ? puzzle.bank.map(t => t.id) : sorted)
  }

  const hint = () => {
    if (solved) return
    const wrong = (s: number) => placed[s] === null || tiles.get(placed[s]!) !== puzzle.cells[puzzle.slots[s]].value
    let target: number | null = selected !== null && wrong(selected) ? selected : null
    if (target === null) {
      for (const ci of puzzle.solveOrder) {
        const s = slotOfCell.get(ci)!
        if (wrong(s)) { target = s; break }
      }
    }
    if (target === null) return
    const need = puzzle.cells[puzzle.slots[target]].value
    const inBoard = new Set(placed)
    let tile = puzzle.bank.find(t => t.value === need && !inBoard.has(t.id))?.id
    if (tile === undefined) {
      // borrow the tile from a slot where it doesn't belong
      tile = puzzle.bank.find(t => {
        const s = placed.indexOf(t.id)
        return t.value === need && s >= 0 && s !== target && wrong(s)
      })?.id
    }
    if (tile === undefined) return
    const next = placed.slice()
    const donor = next.indexOf(tile)
    if (donor >= 0) next[donor] = null
    next[target] = tile
    commit(next)
    setHints(h => h + 1)
    setHinted(target)
    setTimeout(() => setHinted(null), 900)
    setSelected(nextEmpty(next, target))
  }

  // ---------- pointer handling (tap + drag) ----------

  const boardRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const pending = useRef<Pending | null>(null)

  const tap = (from: From) => {
    if (solved) return
    if (from.kind === 'bank') {
      // fill the selected slot (replacing its tile), or the first empty one
      const firstEmpty = placed.indexOf(null)
      const slot = selected ?? (firstEmpty >= 0 ? firstEmpty : null)
      if (slot === null) return
      const next = placeTile(from.tile, slot)
      setSelected(nextEmpty(next, slot))
    } else if (from.tile !== null && selected === from.slot) {
      removeTile(from.slot) // tapping a selected, filled slot sends the tile back
    } else {
      setSelected(from.slot)
    }
  }

  const positionGhost = (x: number, y: number) => {
    const g = ghostRef.current
    if (g) g.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(1.08)`
  }

  const findTarget = (x: number, y: number, p: Pending): number | null => {
    let best: number | null = null
    let bestD = Infinity
    for (const { slot, rect } of p.rects) {
      const dx = Math.max(rect.left - x, 0, x - rect.right)
      const dy = Math.max(rect.top - y, 0, y - rect.bottom)
      const d = Math.hypot(dx, dy)
      if (d < bestD) { bestD = d; best = slot }
    }
    const radius = p.rects.length ? p.rects[0].rect.width * 0.55 : 0
    return bestD <= radius ? best : null
  }

  const onPointerDown = (e: React.PointerEvent, from: From) => {
    if (solved || e.button > 0) return
    pending.current = {
      from,
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
      lift: e.pointerType === 'mouse' ? 0 : 36,
      dragging: false,
      rects: [],
      target: null,
    }
  }

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const p = pending.current
      if (!p || e.pointerId !== p.pointerId) return
      const tile = p.from.tile
      if (!p.dragging) {
        if (tile === null || Math.hypot(e.clientX - p.x, e.clientY - p.y) < 8) return
        p.dragging = true
        p.rects = [...(boardRef.current?.querySelectorAll<HTMLElement>('[data-slot]') ?? [])].map(el => ({
          slot: Number(el.dataset.slot),
          rect: el.getBoundingClientRect(),
        }))
        setDrag({ tile, target: null, fromSlot: p.from.kind === 'slot' ? p.from.slot : null })
      }
      const gx = e.clientX
      const gy = e.clientY - p.lift
      positionGhost(gx, gy)
      const target = findTarget(gx, gy, p)
      if (target !== p.target) {
        p.target = target
        setDrag(d => (d ? { ...d, target } : d))
      }
    }
    const up = (e: PointerEvent) => {
      const p = pending.current
      if (!p || e.pointerId !== p.pointerId) return
      pending.current = null
      if (!p.dragging) {
        if (e.type === 'pointerup') tap(p.from)
        return
      }
      setDrag(null)
      if (e.type !== 'pointerup') return
      const tile = p.from.tile!
      if (p.target !== null) {
        const next = placeTile(tile, p.target)
        if (selected === null || next[selected] !== null) setSelected(nextEmpty(next, p.target))
      } else if (p.from.kind === 'slot') {
        removeTile(p.from.slot) // dropped off the board: back to the bank
        setSelected(p.from.slot)
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  })

  useLayoutEffect(() => {
    if (drag && pending.current) positionGhost(pending.current.x, pending.current.y - pending.current.lift)
  }, [drag])

  // ---------- sizing ----------

  const boardWrap = useRef<HTMLDivElement>(null)
  const bankWrap = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState(32)
  const [bankCols, setBankCols] = useState(8)
  const [tileSize, setTileSize] = useState(44)
  useLayoutEffect(() => {
    const measure = () => {
      const bw = (bankWrap.current?.clientWidth ?? 360) - 24 // minus horizontal padding
      const n = puzzle.bank.length
      const cols = Math.min(Math.max(Math.ceil(n / 3), 6), bw < 380 ? 8 : 10)
      setBankCols(cols)
      const ts = Math.min(56, Math.floor((bw - (cols - 1) * 6) / cols))
      setTileSize(ts)
      const el = boardWrap.current
      if (!el) return
      const size = Math.floor(Math.min((el.clientWidth - 40) / puzzle.cols, (el.clientHeight - 40) / puzzle.rows))
      setCellSize(Math.max(18, Math.min(size, 58)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (boardWrap.current) ro.observe(boardWrap.current)
    if (bankWrap.current) ro.observe(bankWrap.current)
    return () => ro.disconnect()
  }, [puzzle])

  const fontScale = settings.largeNumbers ? 0.56 : 0.48
  const division = '÷'
  const onBoard = new Set(placed)
  const dragValue = drag ? tiles.get(drag.tile) : undefined

  return (
    <div className="game" onContextMenu={e => e.preventDefault()}>
      <header className="topbar">
        <button className="icon-btn" onClick={props.onHome} aria-label="Home">
          <Icon name="back" />
        </button>
        <div className="title">
          <div className="title-main">{props.label}</div>
          {settings.showTimer && <div className="timer">{formatTime(elapsed)}</div>}
        </div>
        <button className="icon-btn" onClick={restart} aria-label="Restart">
          <Icon name="restart" />
        </button>
        <button className="icon-btn" onClick={props.onSettings} aria-label="Settings">
          <Icon name="settings" />
        </button>
      </header>

      <div className="board-wrap" ref={boardWrap}>
        <div
          ref={boardRef}
          className={`board${solved ? ' solved' : ''}`}
          style={{
            gridTemplateColumns: `repeat(${puzzle.cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${puzzle.rows}, ${cellSize}px)`,
            fontSize: cellSize * fontScale,
          }}
        >
          {puzzle.cells.map((cell, ci) => {
            const style = { gridRow: cell.r + 1, gridColumn: cell.c + 1 }
            const cls = flash.has(ci) ? ' flash' : ''
            if (cell.kind !== 'num' || cell.given) {
              const text = cell.kind === 'num' ? cell.value : cell.kind === 'eq' ? '=' : cell.op === '÷' ? division : cell.op === '-' ? '−' : cell.op
              return (
                <div key={ci} className={`cell fixed${cls}`} style={style}>
                  {text}
                </div>
              )
            }
            const slot = slotOfCell.get(ci)!
            const tile = placed[slot]
            const isDragSource = drag?.fromSlot === slot
            const showTile = tile !== null && !isDragSource
            const classes = [
              'cell slot',
              showTile ? 'filled' : '',
              selected === slot && !solved ? 'selected' : '',
              drag?.target === slot ? 'target' : '',
              showTile && settings.showMistakes && badCells.has(ci) ? 'bad' : '',
              hinted === slot ? 'hinted' : '',
              cls,
            ].join(' ')
            return (
              <div
                key={ci}
                data-slot={slot}
                className={classes}
                style={style}
                onPointerDown={e => onPointerDown(e, { kind: 'slot', slot, tile })}
              >
                {showTile ? tiles.get(tile!) : ''}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bank-wrap" ref={bankWrap}>
        <div className="bank" style={{ gridTemplateColumns: `repeat(${bankCols}, ${tileSize}px)` }}>
          {bankOrder.map(id => {
            const used = onBoard.has(id) || drag?.tile === id
            return (
              <div
                key={id}
                className={`tile${used ? ' used' : ''}`}
                style={{ width: tileSize, height: tileSize, fontSize: tileSize * (settings.largeNumbers ? 0.5 : 0.44) }}
                onPointerDown={used ? undefined : e => onPointerDown(e, { kind: 'bank', tile: id })}
              >
                {used ? '' : tiles.get(id)}
              </div>
            )
          })}
        </div>
      </div>

      <footer className="toolbar">
        <button className="tool" onClick={sortBank} aria-label="Sort numbers">
          <Icon name="sort" />
          <span>Sort</span>
        </button>
        <button className="tool" onClick={undo} disabled={!history.length || solved} aria-label="Undo">
          <Icon name="undo" />
          <span>Undo</span>
        </button>
        <button
          className="tool"
          onClick={erase}
          disabled={solved || selected === null || placed[selected] === null}
          aria-label="Erase selected square"
        >
          <Icon name="erase" />
          <span>Erase</span>
        </button>
        {solved ? (
          <button className="tool next" onClick={props.onNext}>
            <span>{props.nextLabel}</span>
            <Icon name="next" />
          </button>
        ) : (
          <button className="tool hint" onClick={hint} aria-label="Hint">
            <Icon name="bulb" />
            <span>Hint</span>
          </button>
        )}
      </footer>

      {drag && (
        <div
          ref={ghostRef}
          className="tile ghost"
          style={{ width: tileSize, height: tileSize, fontSize: tileSize * (settings.largeNumbers ? 0.5 : 0.44) }}
        >
          {dragValue}
        </div>
      )}

      {showWin && (
        <div className="overlay" onClick={() => setShowWin(false)}>
          <div className="modal win" onClick={e => e.stopPropagation()}>
            <div className="win-title">Solved!</div>
            <div className="stars" aria-label={`${starsFor(hints)} stars`}>
              {[1, 2, 3].map(i => (
                <Icon key={i} name="star" className={i <= starsFor(hints) ? 'on' : 'off'} />
              ))}
            </div>
            <div className="win-stats">
              <div>
                <span>Time</span>
                <b>{formatTime(elapsed)}</b>
              </div>
              <div>
                <span>Best</span>
                <b>{formatTime(Math.min(props.best ?? Infinity, elapsed))}</b>
              </div>
              <div>
                <span>Hints</span>
                <b>{hints}</b>
              </div>
            </div>
            <button className="btn primary big" onClick={props.onNext}>
              {props.nextLabel}
            </button>
            <button className="btn ghost-btn" onClick={props.onHome}>
              Home
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
