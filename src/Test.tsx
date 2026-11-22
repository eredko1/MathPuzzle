import { useEffect, useMemo, useState } from 'react'
import { Icon } from './Icons'
import Rich from './Rich'
import { LEVEL_NAMES } from './quiz'
import { SAT_SECTION_NAME, SAT_SIZES, SECONDS_PER_ITEM, timeLimitFor, type SatResult, type SatSection, type TestItem } from './quiz/test'
import { formatTime, type TestInProgress, type TestRecord } from './storage'

const SECTION_COLOR: Record<SatSection, string> = { rw: '#a855f7', math: '#2f6fe4' }
const ord = (n: number) => {
  const v = n % 100
  const suf = ['th', 'st', 'nd', 'rd']
  return n + (suf[(v - 20) % 10] || suf[v] || suf[0])
}
const clock = (sec: number) => formatTime(Math.max(0, sec) * 1000)
const minutesFor = (n: number) => Math.round((Math.ceil(n / 2) * SECONDS_PER_ITEM.rw + Math.floor(n / 2) * SECONDS_PER_ITEM.math) / 60)

// ------------------------------------------------------------------ setup

export function TestSetup(props: {
  history: TestRecord[]
  resume: TestInProgress | null
  onStart: (n: number, timed: boolean) => void
  onResume: () => void
  onDiscard: () => void
  onBack: () => void
}) {
  const [n, setN] = useState<number>(10)
  const [timed, setTimed] = useState(false)
  const best = props.history.reduce((m, r) => Math.max(m, r.total), 0)
  const recent = props.history.slice(-5).reverse()
  return (
    <div className="page levels testpage">
      <header className="topbar">
        <button className="icon-btn" onClick={props.onBack} aria-label="Back">
          <Icon name="back" />
        </button>
        <div className="title">
          <div className="title-main">SAT Practice Test</div>
        </div>
      </header>

      {props.resume && (
        <div className="resume-card">
          <div>
            <div className="card-kicker">Unfinished test</div>
            <div className="card-title">
              {props.resume.answers.filter(a => a !== null).length} of {props.resume.n} answered
            </div>
          </div>
          <div className="resume-actions">
            <button className="btn primary" onClick={props.onResume}>
              Resume
            </button>
            <button className="btn soft" onClick={props.onDiscard}>
              Discard
            </button>
          </div>
        </div>
      )}

      <section>
        <h2>How many questions?</h2>
        <div className="size-grid" role="radiogroup" aria-label="Number of questions">
          {SAT_SIZES.map(s => (
            <button key={s} role="radio" aria-checked={n === s} className={`size-btn ${n === s ? 'active' : ''}`} onClick={() => setN(s)}>
              <span className="size-n">{s}</span>
              <span className="size-sub">≈ {minutesFor(s)} min</span>
            </button>
          ))}
        </div>
        <p className="subject-blurb">
          A mix of Reading &amp; Writing and Math, easy to hard, in SAT style. More questions gives a more reliable estimate.
        </p>
      </section>

      <label className="setting test-timed">
        <div>
          <div className="setting-label">Timed</div>
          <div className="setting-hint">Use the real SAT pace: 71 s per Reading &amp; Writing question, 95 s per Math question</div>
        </div>
        <input type="checkbox" className="switch" checked={timed} onChange={e => setTimed(e.target.checked)} />
      </label>

      <button className="btn primary big start-test" onClick={() => props.onStart(n, timed)}>
        Start {n}-question test
      </button>

      <p className="fineprint">No hints during a test. You’ll see your estimated SAT score (400–1600), section scores and a percentile at the end, with a full answer review.</p>

      {recent.length > 0 && (
        <section>
          <h2>
            Your tests
            <span className="best-pill">
              <Icon name="trophy" /> Best {best}
            </span>
          </h2>
          <div className="history">
            {recent.map(r => (
              <div key={r.t} className="history-row">
                <div>
                  <div className="history-score">{r.total}</div>
                  <div className="history-sub">
                    {new Date(r.t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {r.n} questions{r.timed ? ' · timed' : ''}
                  </div>
                </div>
                <div className="history-pct">{ord(r.percentile)} percentile</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ taking the test

export function TestRun(props: {
  state: TestInProgress
  setState: (fn: (s: TestInProgress) => TestInProgress) => void
  onSubmit: () => void
  onExit: () => void
}) {
  const { state, setState } = props
  const { items, answers, flagged, index, elapsed, timed, n } = state
  const item = items[index]
  const [confirm, setConfirm] = useState(false)
  const limit = useMemo(() => timeLimitFor(items), [items])
  const remaining = limit - elapsed

  // clock (pauses while the tab is hidden)
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden && !confirm) setState(s => ({ ...s, elapsed: s.elapsed + 1 }))
    }, 1000)
    return () => clearInterval(id)
  }, [setState, confirm])
  useEffect(() => {
    if (timed && remaining <= 0) props.onSubmit()
  })

  const select = (i: number) =>
    setState(s => ({ ...s, answers: s.answers.map((a, k) => (k === s.index ? (a === i ? null : i) : a)) }))
  const go = (k: number) => setState(s => ({ ...s, index: Math.min(n - 1, Math.max(0, k)) }))
  const toggleFlag = () => setState(s => ({ ...s, flagged: s.flagged.map((f, k) => (k === s.index ? !f : f)) }))

  useEffect(() => {
    if (confirm) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      const i = '1234'.indexOf(k) >= 0 && k.length === 1 ? Number(k) - 1 : 'abcd'.indexOf(k)
      if (k.length === 1 && i >= 0 && i < 4) select(i)
      else if (e.key === 'ArrowRight') go(index + 1)
      else if (e.key === 'ArrowLeft') go(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const unanswered = answers.filter(a => a === null).length
  const flaggedCount = flagged.filter(Boolean).length
  const last = index === n - 1
  const low = timed && remaining <= 60

  return (
    <div className="page qpage testrun" style={{ ['--sc' as string]: SECTION_COLOR[item.section] }}>
      <header className="topbar">
        <button className="icon-btn" onClick={props.onExit} aria-label="Save and exit">
          <Icon name="back" />
        </button>
        <div className="title">
          <div className="title-main">
            Question {index + 1} of {n}
          </div>
          <div className="timer">{SAT_SECTION_NAME[item.section]}</div>
        </div>
        <span className={`test-timer ${low ? 'low' : ''}`} role="timer" aria-label={timed ? 'Time remaining' : 'Time elapsed'}>
          <Icon name="clock" /> {clock(timed ? remaining : elapsed)}
        </span>
      </header>

      <div className="qbody">
        <div className="qleft">
          <div className="qcard">
            <Rich text={item.q.prompt} className="qprompt" />
          </div>
          <button className={`flag-btn ${flagged[index] ? 'on' : ''}`} onClick={toggleFlag} aria-pressed={flagged[index]}>
            <Icon name="flag" /> {flagged[index] ? 'Marked for review' : 'Mark for review'}
          </button>
        </div>

        <div className="qright">
          <div className="choices" role="radiogroup" aria-label="Answer choices">
            {item.q.choices.map((c, i) => (
              <button key={i} role="radio" aria-checked={answers[index] === i} className={`choice ${answers[index] === i ? 'picked' : ''}`} onClick={() => select(i)}>
                <span className="choice-key">{'ABCD'[i]}</span>
                <Rich text={c} className="choice-text" />
                {answers[index] === i && <Icon name="check" className="choice-mark" />}
              </button>
            ))}
          </div>

          <nav className="palette" aria-label="Question navigator">
            {items.map((it, k) => (
              <button
                key={k}
                className={`pal-btn ${k === index ? 'current' : ''} ${answers[k] !== null ? 'answered' : ''} ${flagged[k] ? 'flagged' : ''}`}
                onClick={() => go(k)}
                aria-label={`Question ${k + 1}${answers[k] !== null ? ', answered' : ', unanswered'}${flagged[k] ? ', marked for review' : ''}${it.section === 'math' ? ', Math' : ', Reading and Writing'}`}
                aria-current={k === index ? 'step' : undefined}
              >
                {k + 1}
              </button>
            ))}
          </nav>

          <div className="test-nav">
            <button className="btn soft" disabled={index === 0} onClick={() => go(index - 1)}>
              Previous
            </button>
            {last ? (
              <button className="btn primary" onClick={() => setConfirm(true)}>
                Review &amp; submit
              </button>
            ) : (
              <button className="btn primary" onClick={() => go(index + 1)}>
                Next
              </button>
            )}
          </div>
          {!last && (
            <button className="link-btn" onClick={() => setConfirm(true)}>
              Submit test early
            </button>
          )}
        </div>
      </div>

      {confirm && (
        <div className="overlay" onClick={() => setConfirm(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Submit test" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Submit your test?</h2>
            <p className="modal-text">
              {unanswered > 0 ? (
                <>
                  You have <strong>{unanswered}</strong> unanswered question{unanswered > 1 ? 's' : ''}. Unanswered questions count as incorrect.
                </>
              ) : (
                'You answered every question.'
              )}
              {flaggedCount > 0 && ` ${flaggedCount} marked for review.`}
            </p>
            <div className="modal-actions">
              <button className="btn soft" onClick={() => setConfirm(false)}>
                Keep working
              </button>
              <button className="btn primary" onClick={props.onSubmit}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ results

export function TestResult(props: {
  items: TestItem[]
  answers: (number | null)[]
  result: SatResult
  seconds: number
  timed: boolean
  onAgain: () => void
  onHome: () => void
}) {
  const { result: r, items, answers } = props
  const domains = Object.entries(r.byDomain).sort((a, b) => a[0].localeCompare(b[0]))
  return (
    <div className="page levels testpage resultpage">
      <header className="topbar">
        <button className="icon-btn" onClick={props.onHome} aria-label="Back to quiz home">
          <Icon name="back" />
        </button>
        <div className="title">
          <div className="title-main">Your results</div>
        </div>
      </header>

      <div className="score-hero">
        <div className="score-kicker">Estimated SAT score</div>
        <div className="score-big" aria-label={`Estimated SAT score ${r.total} out of 1600`}>
          {r.total}
          <span className="score-of"> / 1600</span>
        </div>
        <div className="score-range">
          Likely range {r.low}–{r.high}
        </div>
        <div className="pct-block">
          <div className="pct-line">
            <strong>≈ {ord(r.percentile)} percentile</strong>
            <span> · about {r.percentile}% of SAT test-takers score at or below this</span>
          </div>
          <div className="pct-bar" aria-hidden="true">
            <div className="pct-fill" style={{ width: `${r.percentile}%` }} />
          </div>
        </div>
      </div>

      <section>
        <h2>Section scores</h2>
        <div className="stat-list">
          {r.sections.map(s => (
            <div key={s.section} className="stat-row static" style={{ ['--sc' as string]: SECTION_COLOR[s.section] }}>
              <div className="stat-top">
                <span className="stat-name">{SAT_SECTION_NAME[s.section]}</span>
                <span className="stat-num sec-score">{s.score}</span>
              </div>
              <div className="bar">
                <div style={{ width: `${((s.score - 200) / 600) * 100}%` }} />
              </div>
              <div className="sec-sub">
                {s.correct} of {s.n} correct · range {s.low}–{s.high} · {ord(s.percentile)} percentile
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>How you did</h2>
        <div className="mini-grid">
          <div className="mini-card">
            <div className="mini-num">
              {r.correct}/{r.n}
            </div>
            <div className="mini-label">correct</div>
          </div>
          <div className="mini-card">
            <div className="mini-num">{clock(props.seconds)}</div>
            <div className="mini-label">{props.timed ? 'time used' : 'time taken'}</div>
          </div>
          {([1, 2, 3] as const).map(t => (
            <div key={t} className="mini-card">
              <div className="mini-num">
                {r.byTier[t].c}/{r.byTier[t].n}
              </div>
              <div className="mini-label">{LEVEL_NAMES[t].toLowerCase()}</div>
            </div>
          ))}
        </div>
        {domains.length > 0 && (
          <div className="domain-list">
            {domains.map(([name, d]) => (
              <div key={name} className="domain-row">
                <span>{name}</span>
                <span className="domain-num">
                  {d.c}/{d.n}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="notes">
        {r.notes.map((t, i) => (
          <p key={i}>{t}</p>
        ))}
        <details>
          <summary>How is this estimated?</summary>
          <p>
            Each question has a difficulty (easy, medium or hard). Your answers are combined into an ability estimate for each section, accounting for how hard the questions were and a 1-in-4 chance of guessing right, then converted to the 200–800 scale with the SAT’s typical average (~515) and spread. Percentiles use a bell-curve approximation of the national distribution (total average ≈ 1030). This is a practice estimate, not an official score.
          </p>
        </details>
      </div>

      <section>
        <h2>Review your answers</h2>
        <div className="review-list">
          {items.map((it, i) => {
            const a = answers[i]
            const ok = a === it.q.answer
            return (
              <details key={i} className={`review-item ${ok ? 'ok' : 'bad'}`}>
                <summary>
                  <span className="review-mark" aria-label={ok ? 'Correct' : a === null ? 'Unanswered' : 'Incorrect'}>
                    <Icon name={ok ? 'check' : 'close'} />
                  </span>
                  <span className="review-title">
                    {i + 1}. {it.q.topic}
                  </span>
                  <span className="review-meta">
                    {it.section === 'math' ? 'Math' : 'R&W'} · {LEVEL_NAMES[it.tier]}
                  </span>
                </summary>
                <div className="review-body">
                  <div className="qcard">
                    <Rich text={it.q.prompt} className="qprompt" />
                  </div>
                  <div className="choices">
                    {it.q.choices.map((c, k) => (
                      <div key={k} className={`choice static ${k === it.q.answer ? 'right' : ''} ${k === a && !ok ? 'wrong' : ''}`}>
                        <span className="choice-key">{'ABCD'[k]}</span>
                        <Rich text={c} className="choice-text" />
                        {k === it.q.answer && <Icon name="check" className="choice-mark" />}
                        {k === a && !ok && <Icon name="close" className="choice-mark" />}
                      </div>
                    ))}
                  </div>
                  {a === null && <p className="review-note">You didn’t answer this one.</p>}
                  <div className="explain">
                    <div className="explain-label">Why</div>
                    <Rich text={it.q.explanation} />
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      </section>

      <div className="result-actions">
        <button className="btn primary big" onClick={props.onAgain}>
          Take another test
        </button>
        <button className="btn soft big" onClick={props.onHome}>
          Back to quiz home
        </button>
      </div>
    </div>
  )
}
