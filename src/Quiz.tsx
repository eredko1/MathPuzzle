import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from './Icons'
import Rich from './Rich'
import {
  LEVELS, LEVEL_NAMES, SUBJECTS, SUBJECT_INFO, dailyPick, decodePick, makeQuestion, practicePick, topicsFor,
  type Level, type Pick, type Question, type Subject,
} from './quiz'
import { hashString } from './quiz/util'
import { TestResult, TestRun, TestSetup } from './Test'
import { buildSatTest, scoreSat, type SatResult, type TestItem } from './quiz/test'
import {
  loadQuiz, loadTestCurrent, loadTests, saveQuiz, saveTestCurrent, saveTests, todayString,
  type Mode, type QuizProgress, type QuizResult, type TestInProgress, type TestRecord,
} from './storage'

type Screen =
  | { name: 'home' }
  | { name: 'stats' }
  | { name: 'play'; pick: Pick; daily: boolean }
  | { name: 'testSetup' }
  | { name: 'test' }
  | { name: 'testResult'; items: TestItem[]; answers: (number | null)[]; result: SatResult; seconds: number; timed: boolean }

const LEVEL_CLASS: Record<Level, string> = { 1: 'easy', 2: 'medium', 3: 'hard' }

export function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="mode-switch" role="tablist">
      <button role="tab" aria-selected={mode === 'puzzles'} className={mode === 'puzzles' ? 'active' : ''} onClick={() => onChange('puzzles')}>
        Crosswords
      </button>
      <button role="tab" aria-selected={mode === 'quiz'} className={mode === 'quiz' ? 'active' : ''} onClick={() => onChange('quiz')}>
        Daily Quiz
      </button>
    </div>
  )
}

export default function QuizApp(props: { mode: Mode; onMode: (m: Mode) => void; onSettings: () => void }) {
  const [progress, setProgress] = useState<QuizProgress>(loadQuiz)
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [tests, setTests] = useState<TestRecord[]>(loadTests)
  const [current, setCurrent] = useState<TestInProgress | null>(loadTestCurrent)
  const today = todayString()

  const updateCurrent = useCallback((fn: (s: TestInProgress) => TestInProgress) => {
    setCurrent(prev => {
      if (!prev) return prev
      const next = fn(prev)
      saveTestCurrent(next)
      return next
    })
  }, [])
  const startTest = (n: number, timed: boolean) => {
    const items = buildSatTest(n)
    const state: TestInProgress = { kind: 'sat', n, timed, items, answers: items.map(() => null), flagged: items.map(() => false), index: 0, elapsed: 0 }
    saveTestCurrent(state)
    setCurrent(state)
    setScreen({ name: 'test' })
  }
  const submitTest = () => {
    if (!current) return
    const result = scoreSat(current.items, current.answers)
    const rec: TestRecord = {
      t: Date.now(), kind: 'sat', n: current.n, total: result.total, rw: result.sections[0].score, math: result.sections[1].score,
      percentile: result.percentile, correct: result.correct, timed: current.timed, seconds: current.elapsed,
    }
    const all = [...tests, rec]
    setTests(all)
    saveTests(all)
    saveTestCurrent(null)
    setCurrent(null)
    setScreen({ name: 'testResult', items: current.items, answers: current.answers, result, seconds: current.elapsed, timed: current.timed })
  }

  const update = useCallback((fn: (p: QuizProgress) => void) => {
    setProgress(prev => {
      const next = structuredClone(prev)
      fn(next)
      saveQuiz(next)
      return next
    })
  }, [])

  // Android back / browser back returns to the quiz home instead of leaving the app.
  useEffect(() => {
    const onPop = () => setScreen({ name: 'home' })
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const go = (s: Screen) => {
    if (s.name !== 'home' && history.state?.screen !== 'inner') history.pushState({ screen: 'inner' }, '')
    setScreen(s)
  }
  const goHome = () => {
    if (history.state?.screen === 'inner') history.back()
    else setScreen({ name: 'home' })
  }

  const record = (pick: Pick, q: Question, r: QuizResult, daily: boolean) => {
    update(p => {
      p.answered += 1
      p.totalPoints += r.points
      const key = `${q.subject}|${q.topic}`
      const t = p.topics[key] ?? { seen: 0, points: 0 }
      t.seen += 1
      t.points += r.points
      p.topics[key] = t
      if (daily) {
        const date = pick.seed.split(':')[1]
        p.daily[date] = { ...p.daily[date], [q.subject]: r }
        const done = Object.keys(p.daily[date]).length
        if (done >= 3 && p.streak.lastDate !== date) {
          const yesterday = todayString(new Date(new Date(date + 'T12:00').getTime() - 86400000))
          p.streak = { count: p.streak.lastDate === yesterday ? p.streak.count + 1 : 1, lastDate: date }
        }
      }
    })
  }

  if (screen.name === 'testSetup')
    return (
      <TestSetup
        history={tests}
        resume={current}
        onStart={startTest}
        onResume={() => setScreen({ name: 'test' })}
        onDiscard={() => {
          saveTestCurrent(null)
          setCurrent(null)
        }}
        onBack={goHome}
      />
    )
  if (screen.name === 'test' && current)
    return <TestRun key={current.items[0].q.id} state={current} setState={updateCurrent} onSubmit={submitTest} onExit={goHome} />
  if (screen.name === 'testResult')
    return (
      <TestResult
        items={screen.items}
        answers={screen.answers}
        result={screen.result}
        seconds={screen.seconds}
        timed={screen.timed}
        onAgain={() => setScreen({ name: 'testSetup' })}
        onHome={goHome}
      />
    )
  if (screen.name === 'play')
    return (
      <QuestionScreen
        key={screen.pick.seed + screen.pick.subject}
        pick={screen.pick}
        daily={screen.daily}
        today={today}
        progress={progress}
        onDone={(q, r) => record(screen.pick, q, r, screen.daily)}
        onNext={() => {
          const cur = screen.pick
          if (screen.daily) {
            const left = SUBJECTS.find(s => !progress.daily[today]?.[s] && s !== cur.subject)
            if (left) setScreen({ name: 'play', pick: dailyPick(today, left), daily: true })
            else goHome()
          } else setScreen({ name: 'play', pick: practicePick(cur.subject, cur.level, cur.topic), daily: false })
        }}
        onHome={goHome}
      />
    )
  if (screen.name === 'stats')
    return (
      <Stats
        progress={progress}
        onBack={goHome}
        onPractice={(subject, topic) => go({ name: 'play', pick: practicePick(subject, 2, topic), daily: false })}
      />
    )
  return (
    <QuizHome
      progress={progress}
      today={today}
      mode={props.mode}
      onMode={props.onMode}
      onSettings={props.onSettings}
      onDaily={s => go({ name: 'play', pick: dailyPick(today, s), daily: true })}
      onPractice={(s, l) => go({ name: 'play', pick: practicePick(s, l), daily: false })}
      onStats={() => go({ name: 'stats' })}
      onTest={() => go({ name: 'testSetup' })}
      testInProgress={current !== null}
      bestScore={tests.reduce((m, r) => Math.max(m, r.total), 0)}
    />
  )
}

// ---------- Home ----------

function QuizHome(props: {
  progress: QuizProgress
  today: string
  mode: Mode
  onMode: (m: Mode) => void
  onSettings: () => void
  onDaily: (s: Subject) => void
  onPractice: (s: Subject, l: Level) => void
  onStats: () => void
  onTest: () => void
  testInProgress: boolean
  bestScore: number
}) {
  const { progress, today } = props
  const [subject, setSubject] = useState<Subject>('math')
  const todays = progress.daily[today] ?? {}
  const done = SUBJECTS.filter(s => todays[s]).length
  const pts = SUBJECTS.reduce((n, s) => n + (todays[s]?.points ?? 0), 0)
  const yesterday = todayString(new Date(Date.now() - 86400000))
  const streak = progress.streak.lastDate === today || progress.streak.lastDate === yesterday ? progress.streak.count : 0
  const nextUp = SUBJECTS.find(s => !todays[s])

  return (
    <div className="page home quiz">
      <header className="home-head">
        <QuizLogo />
        <h1>Daily Quiz</h1>
        <button className="icon-btn" onClick={props.onSettings} aria-label="Settings">
          <Icon name="settings" />
        </button>
      </header>
      <ModeSwitch mode={props.mode} onChange={props.onMode} />

      {nextUp && (
        <button className="card continue" onClick={() => props.onDaily(nextUp)}>
          <div>
            <div className="card-kicker">{done === 0 ? 'Start today’s set' : `${done} of ${SUBJECTS.length} done`}</div>
            <div className="card-title">
              {SUBJECT_INFO[nextUp].name} · {LEVEL_NAMES[dailyPick(today, nextUp).level]}
            </div>
          </div>
          <Icon name="next" />
        </button>
      )}

      <section>
        <h2>
          Today’s set
          {streak > 0 && (
            <span className="streak">
              <Icon name="flame" /> {streak} day{streak > 1 ? 's' : ''}
            </span>
          )}
        </h2>
        <div className="subject-grid">
          {SUBJECTS.map(s => {
            const info = SUBJECT_INFO[s]
            const r = todays[s]
            const lvl = dailyPick(today, s).level
            return (
              <button key={s} className={`subject-card ${r ? 'done' : ''}`} style={{ ['--sc' as string]: info.color }} onClick={() => props.onDaily(s)}>
                <span className="subject-badge">{info.emoji}</span>
                <span className="subject-name">{info.short}</span>
                <span className={`lvl-pill ${LEVEL_CLASS[lvl]}`}>{LEVEL_NAMES[lvl]}</span>
                {r ? <Stars n={r.points} /> : <span className="subject-sub">New</span>}
              </button>
            )
          })}
        </div>
        <p className="set-summary">
          {done === SUBJECTS.length ? 'All done for today — nice work. Come back tomorrow, or practice below.' : `${pts} point${pts === 1 ? '' : 's'} so far today`}
        </p>
      </section>

      <button className="card sat-card" onClick={props.onTest}>
        <div>
          <div className="card-kicker">{props.testInProgress ? 'Unfinished — tap to resume' : props.bestScore ? `Best so far: ${props.bestScore}` : 'New'}</div>
          <div className="card-title">SAT Practice Test</div>
          <div className="card-sub">5–20 questions · estimated score &amp; percentile</div>
        </div>
        <Icon name="next" />
      </button>

      <section>
        <h2>Practice</h2>
        <div className="chip-row">
          {SUBJECTS.map(s => (
            <button key={s} className={`chip ${s === subject ? 'active' : ''}`} style={{ ['--sc' as string]: SUBJECT_INFO[s].color }} onClick={() => setSubject(s)}>
              {SUBJECT_INFO[s].short}
            </button>
          ))}
        </div>
        <p className="subject-blurb">{SUBJECT_INFO[subject].blurb}</p>
        <div className="level-row">
          {LEVELS.map(l => (
            <button key={l} className={`lvl-btn ${LEVEL_CLASS[l]}`} onClick={() => props.onPractice(subject, l)}>
              {LEVEL_NAMES[l]}
            </button>
          ))}
        </div>
      </section>

      <button className="card stats-card" onClick={props.onStats}>
        <div>
          <div className="card-title">Progress &amp; weak spots</div>
          <div className="card-kicker">{progress.answered} answered · {progress.totalPoints} points</div>
        </div>
        <Icon name="next" />
      </button>
      <p className="footnote">No ads. Works offline. Hints are free.</p>
    </div>
  )
}

function QuizLogo() {
  return (
    <svg className="logo" viewBox="0 0 48 48" aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="10" fill="#E3ECFD" stroke="#2F6FE4" strokeWidth="1.5" />
      <text x="24" y="33" textAnchor="middle" fontSize="26" fontWeight="800" fill="#2F6FE4">?</text>
    </svg>
  )
}

function Stars({ n }: { n: number }) {
  return (
    <span className="mini-stars big" aria-label={`${n} of 3 points`}>
      {[1, 2, 3].map(i => (
        <Icon key={i} name="star" className={i <= n ? 'on' : 'off'} />
      ))}
    </span>
  )
}

// ---------- Question ----------

function QuestionScreen(props: {
  pick: Pick
  daily: boolean
  today: string
  progress: QuizProgress
  onDone: (q: Question, r: QuizResult) => void
  onNext: () => void
  onHome: () => void
}) {
  const q = useMemo(() => makeQuestion(props.pick), [props.pick])
  const info = SUBJECT_INFO[q.subject]
  const already = props.daily ? props.progress.daily[props.today]?.[q.subject] : undefined
  const [wrong, setWrong] = useState<number[]>([])
  const [hints, setHints] = useState(0)
  const [solved, setSolved] = useState<'right' | 'gaveup' | null>(already ? (already.solved ? 'right' : 'gaveup') : null)
  const eliminated = useMemo(() => {
    const others = q.choices.map((_, i) => i).filter(i => i !== q.answer)
    return others.sort((a, b) => hashString(q.id + a) - hashString(q.id + b)).slice(0, 2)
  }, [q])
  const tries = wrong.length + (solved === 'right' ? 1 : 0)
  const points = solved === 'right' ? Math.max(1, 3 - hints - wrong.length) : 0
  const shown = already ?? { points, tries, hints, solved: solved === 'right', topic: q.topic, level: q.level }

  const finish = (how: 'right' | 'gaveup', w: number) => {
    setSolved(how)
    const pts = how === 'right' ? Math.max(1, 3 - hints - w) : 0
    props.onDone(q, { points: pts, tries: w + (how === 'right' ? 1 : 0), hints, solved: how === 'right', topic: q.topic, level: q.level })
    if (navigator.vibrate && how === 'right') navigator.vibrate(12)
  }
  const choose = (i: number) => {
    if (solved || wrong.includes(i) || (hints >= 2 && eliminated.includes(i))) return
    if (i === q.answer) finish('right', wrong.length)
    else {
      setWrong(w => [...w, i])
      if (navigator.vibrate) navigator.vibrate([20, 30, 20])
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = '1234'.indexOf(e.key) >= 0 ? Number(e.key) - 1 : 'abcd'.indexOf(e.key.toLowerCase())
      if (e.key.length === 1 && i >= 0 && i < 4) choose(i)
      if (e.key === 'Enter' && solved) props.onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const leftNext = props.daily ? SUBJECTS.find(s => !props.progress.daily[props.today]?.[s] && s !== q.subject) : true
  const nextLabel = !props.daily ? 'Next question' : leftNext ? `Next: ${SUBJECT_INFO[leftNext as Subject]?.short ?? ''}` : 'Done for today'

  return (
    <div className="page qpage" style={{ ['--sc' as string]: info.color }}>
      <header className="topbar">
        <button className="icon-btn" onClick={props.onHome} aria-label="Back">
          <Icon name="back" />
        </button>
        <div className="title">
          <div className="title-main">
            {info.name}
          </div>
          <div className="timer">{props.daily ? 'Daily' : 'Practice'} · {q.topic}</div>
        </div>
        <span className={`lvl-pill ${LEVEL_CLASS[q.level]}`}>{LEVEL_NAMES[q.level]}</span>
      </header>

      <div className="qbody">
      <div className="qleft">
        <div className="qcard">
          <Rich text={q.prompt} className="qprompt" />
        </div>
      </div>

      <div className="qright">
      <div className="choices" role="group" aria-label="Answer choices">
        {q.choices.map((c, i) => {
          const isWrong = wrong.includes(i)
          const isElim = hints >= 2 && eliminated.includes(i) && !solved
          const isRight = solved && i === q.answer
          return (
            <button
              key={i}
              className={`choice ${isWrong ? 'wrong' : ''} ${isElim ? 'elim' : ''} ${isRight ? 'right' : ''}`}
              disabled={Boolean(solved) || isWrong || isElim}
              onClick={() => choose(i)}
            >
              <span className="choice-key">{'ABCD'[i]}</span>
              <Rich text={c} className="choice-text" />
              {isRight && <Icon name="check" className="choice-mark" />}
              {isWrong && <Icon name="close" className="choice-mark" />}
            </button>
          )
        })}
      </div>

      {!solved && (
        <div className="hint-area">
          {hints >= 1 && (
            <div className="hint-box">
              <Icon name="bulb" />
              <Rich text={q.hint} />
            </div>
          )}
          {hints >= 2 && <div className="hint-box subtle">Two wrong answers removed.</div>}
          <div className="qactions">
            {hints < 2 && (
              <button className="btn soft" onClick={() => setHints(h => h + 1)}>
                <Icon name="bulb" /> {hints === 0 ? 'Hint' : 'Narrow it down'}
              </button>
            )}
            {wrong.length >= 1 && (
              <button className="btn soft" onClick={() => finish('gaveup', wrong.length)}>
                Show answer
              </button>
            )}
          </div>
        </div>
      )}

      {solved && (
        <div className="reveal">
          <div className={`reveal-head ${solved}`} role="status" aria-live="polite">
            {solved === 'right' ? (
              <>
                <Stars n={already?.points ?? points} />
                <span>{shown.points === 3 ? 'Perfect!' : 'Correct'}</span>
              </>
            ) : (
              <span>The answer was {'ABCD'[q.answer]}</span>
            )}
          </div>
          <div className="explain">
            <div className="explain-label">Why</div>
            <Rich text={q.explanation} />
          </div>
          <button className="btn primary big" onClick={props.onNext}>
            {nextLabel}
          </button>
        </div>
      )}
      </div>
      </div>
    </div>
  )
}

// ---------- Stats ----------

function Stats(props: { progress: QuizProgress; onBack: () => void; onPractice: (s: Subject, topic?: string) => void }) {
  const { progress } = props
  const rows = SUBJECTS.map(s => {
    const mine = Object.entries(progress.topics).filter(([k]) => k.startsWith(s + '|'))
    const seen = mine.reduce((n, [, t]) => n + t.seen, 0)
    const pts = mine.reduce((n, [, t]) => n + t.points, 0)
    return { s, seen, pct: seen ? pts / (seen * 3) : 0, topics: mine.map(([k, t]) => ({ topic: k.slice(s.length + 1), ...t })) }
  })
  const weak = rows
    .flatMap(r => r.topics.filter(t => t.seen >= 2).map(t => ({ ...t, subject: r.s, pct: t.points / (t.seen * 3) })))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 8)
  const [open, setOpen] = useState<Subject | null>(null)
  return (
    <div className="page levels">
      <header className="topbar">
        <button className="icon-btn" onClick={props.onBack} aria-label="Back">
          <Icon name="back" />
        </button>
        <div className="title">
          <div className="title-main">Progress</div>
        </div>
      </header>
      <section>
        <h2>By subject</h2>
        <div className="stat-list">
          {rows.map(r => (
            <button key={r.s} className="stat-row" style={{ ['--sc' as string]: SUBJECT_INFO[r.s].color }} onClick={() => setOpen(open === r.s ? null : r.s)}>
              <div className="stat-top">
                <span className="stat-name">{SUBJECT_INFO[r.s].name}</span>
                <span className="stat-num">{r.seen ? `${Math.round(r.pct * 100)}%` : '—'} · {r.seen} answered</span>
              </div>
              <div className="bar">
                <div style={{ width: `${Math.round(r.pct * 100)}%` }} />
              </div>
              {open === r.s && (
                <div className="topic-list" onClick={e => e.stopPropagation()}>
                  {topicsFor(r.s).map(t => {
                    const st = progress.topics[`${r.s}|${t}`]
                    return (
                      <button key={t} className="topic-chip" onClick={() => props.onPractice(r.s, t)}>
                        {t}
                        <small>{st ? `${Math.round((st.points / (st.seen * 3)) * 100)}%` : 'new'}</small>
                      </button>
                    )
                  })}
                </div>
              )}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2>Weak spots</h2>
        {weak.length === 0 ? (
          <p className="subject-blurb">Answer a few questions in a topic and your weakest ones will show up here for focused practice.</p>
        ) : (
          <div className="topic-list">
            {weak.map(t => (
              <button key={t.subject + t.topic} className="topic-chip" onClick={() => props.onPractice(t.subject, t.topic)}>
                {t.topic}
                <small>{SUBJECT_INFO[t.subject].short} · {Math.round(t.pct * 100)}%</small>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export { decodePick }
