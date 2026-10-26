import { useCallback, useEffect, useState } from 'react'
import Game, { starsFor, type GameState } from './Game'
import { Icon } from './Icons'
import { dailyKey, generatePuzzle, levelKey, type Difficulty, type Puzzle } from './engine/puzzle'
import {
  formatTime, latestGame, loadGames, loadProgress, loadSettings, saveGameFor, saveProgress, saveSettings,
  todayString, type Progress, type Settings,
} from './storage'

const DIFFS: Difficulty[] = ['easy', 'medium', 'hard']
const NAMES: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

type GameScreen = {
  name: 'game'
  key: string
  puzzle: Puzzle
  label: string
  diff: Difficulty
  level?: number
  date?: string
  initial: GameState
}
type Screen = { name: 'home' } | { name: 'levels'; diff: Difficulty } | GameScreen

interface InstallPrompt extends Event {
  prompt: () => Promise<void>
}

function parseKey(key: string): { diff: Difficulty; level?: number; date?: string } {
  const [kind, diff, rest] = key.split(':')
  return kind === 'level' ? { diff: diff as Difficulty, level: Number(rest) } : { diff: diff as Difficulty, date: rest }
}

function labelFor(diff: Difficulty, level?: number) {
  return level ? `${NAMES[diff]} · Level ${level}` : `Daily · ${NAMES[diff]}`
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [showSettings, setShowSettings] = useState(false)
  const [install, setInstall] = useState<InstallPrompt | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', settings.theme === 'dark' ? '#15181e' : '#f8f7f3')
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstall(e as InstallPrompt)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  // Android back button / browser back returns to the home screen instead of leaving the app.
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

  const open = (key: string, replace = false) => {
    const { diff, level, date } = parseKey(key)
    if (level && progress.lastDiff !== diff) updateProgress(p => ({ ...p, lastDiff: diff }))
    const saved = loadGames()[key]
    const puzzle = saved?.puzzle ?? generatePuzzle(key, diff)
    const initial: GameState = saved
      ? { placed: saved.placed, bankOrder: saved.bankOrder, hints: saved.hints, elapsedMs: saved.elapsedMs }
      : { placed: puzzle.slots.map(() => null), bankOrder: puzzle.bank.map(t => t.id), hints: 0, elapsedMs: 0 }
    const next: GameScreen = { name: 'game', key, puzzle, label: labelFor(diff, level), diff, level, date, initial }
    // "Next level" replaces the current game so Back still goes home
    if (replace) setScreen(next)
    else go(next)
  }

  const updateProgress = (fn: (p: Progress) => Progress) => {
    setProgress(prev => {
      const next = fn(structuredClone(prev))
      saveProgress(next)
      return next
    })
  }

  const game = screen.name === 'game' ? screen : null
  const onSave = useCallback(
    (s: GameState) => {
      if (!game) return
      saveGameFor(game.key, { ...s, puzzle: game.puzzle, label: game.label, updated: Date.now() })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game?.key],
  )

  const onSolved = (s: GameState) => {
    if (!game) return
    saveGameFor(game.key, null)
    const result = { stars: starsFor(s.hints), bestMs: s.elapsedMs }
    updateProgress(p => {
      const book = game.level ? p.levels : p.daily
      const old = book[game.key]
      book[game.key] = old ? { stars: Math.max(old.stars, result.stars), bestMs: Math.min(old.bestMs, result.bestMs) } : result
      if (game.level) p.next[game.diff] = Math.max(p.next[game.diff], game.level + 1)
      if (game.date) {
        const yesterday = todayString(new Date(new Date(game.date + 'T12:00').getTime() - 86400000))
        if (p.streak.lastDate !== game.date) {
          p.streak = { count: p.streak.lastDate === yesterday ? p.streak.count + 1 : 1, lastDate: game.date }
        }
      }
      return p
    })
  }

  const today = todayString()

  return (
    <>
      {screen.name === 'home' && (
        <Home
          progress={progress}
          today={today}
          install={install}
          onInstall={() => install?.prompt().finally(() => setInstall(null))}
          onPlay={d => open(levelKey(d, progress.next[d]))}
          onDaily={d => open(dailyKey(d, today))}
          onContinue={k => open(k)}
          onLevels={d => go({ name: 'levels', diff: d })}
          onSettings={() => setShowSettings(true)}
        />
      )}
      {screen.name === 'levels' && (
        <Levels
          diff={screen.diff}
          progress={progress}
          onDiff={d => setScreen({ name: 'levels', diff: d })}
          onPick={n => open(levelKey(screen.diff, n))}
          onBack={goHome}
        />
      )}
      {game && (
        <Game
          key={game.key}
          puzzle={game.puzzle}
          label={game.label}
          initial={game.initial}
          settings={settings}
          best={(game.level ? progress.levels : progress.daily)[game.key]?.bestMs}
          nextLabel={game.level ? 'Next level' : 'Done'}
          onSave={onSave}
          onSolved={onSolved}
          onNext={() => {
            if (game.level) open(levelKey(game.diff, game.level + 1), true)
            else goHome()
          }}
          onHome={goHome}
          onSettings={() => setShowSettings(true)}
        />
      )}
      {showSettings && <SettingsModal settings={settings} onChange={setSettings} onClose={() => setShowSettings(false)} />}
    </>
  )
}

// ---------- Home ----------

function Home(props: {
  progress: Progress
  today: string
  install: InstallPrompt | null
  onInstall: () => void
  onPlay: (d: Difficulty) => void
  onDaily: (d: Difficulty) => void
  onContinue: (key: string) => void
  onLevels: (d: Difficulty) => void
  onSettings: () => void
}) {
  const { progress, today } = props
  const unfinished = latestGame(k => Boolean(progress.levels[k] || progress.daily[k]))
  const continueTo: [string, string] | null = unfinished
    ? [unfinished[0], unfinished[1].label]
    : progress.lastDiff
      ? [levelKey(progress.lastDiff, progress.next[progress.lastDiff]), labelFor(progress.lastDiff, progress.next[progress.lastDiff])]
      : null
  const streakAlive = progress.streak.lastDate === today ||
    progress.streak.lastDate === todayString(new Date(Date.now() - 86400000))
  const streak = streakAlive ? progress.streak.count : 0
  return (
    <div className="page home">
      <header className="home-head">
        <Logo />
        <h1>Math Crosswords</h1>
        <button className="icon-btn" onClick={props.onSettings} aria-label="Settings">
          <Icon name="settings" />
        </button>
      </header>

      {continueTo && (
        <button className="card continue" onClick={() => props.onContinue(continueTo[0])}>
          <div>
            <div className="card-kicker">Continue</div>
            <div className="card-title">{continueTo[1]}</div>
          </div>
          <Icon name="next" />
        </button>
      )}

      <section>
        <h2>Play</h2>
        <div className="diff-list">
          {DIFFS.map(d => {
            return (
              <div key={d} className={`diff-card ${d}`}>
                <button className="diff-main" onClick={() => props.onPlay(d)}>
                  <span className="diff-name">{NAMES[d]}</span>
                  <span className="diff-level">Level {progress.next[d]}</span>
                </button>
                <button className="diff-all" onClick={() => props.onLevels(d)} aria-label={`All ${NAMES[d]} levels`}>
                  <Icon name="grid" />
                  <span>Levels</span>
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2>
          Daily puzzles
          {streak > 0 && (
            <span className="streak">
              <Icon name="flame" /> {streak} day{streak > 1 ? 's' : ''}
            </span>
          )}
        </h2>
        <div className="daily-row">
          {DIFFS.map(d => {
            const res = progress.daily[dailyKey(d, today)]
            return (
              <button key={d} className={`daily ${res ? 'done' : ''}`} onClick={() => props.onDaily(d)}>
                <Icon name={res ? 'check' : 'calendar'} />
                <span>{NAMES[d]}</span>
                {res && <small>{formatTime(res.bestMs)}</small>}
              </button>
            )
          })}
        </div>
      </section>

      {props.install && (
        <button className="btn install" onClick={props.onInstall}>
          Add to home screen
        </button>
      )}
      <p className="footnote">No ads. Works offline. Unlimited free hints.</p>
    </div>
  )
}

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 48 48" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="3" fill="#F5E6AD" stroke="#8A8275" strokeWidth="1.5" />
      <rect x="26" y="2" width="20" height="20" rx="3" fill="#E4F2E7" stroke="#86B896" strokeWidth="1.5" />
      <rect x="2" y="26" width="20" height="20" rx="3" fill="#E4F2E7" stroke="#86B896" strokeWidth="1.5" />
      <rect x="26" y="26" width="20" height="20" rx="3" fill="#F5E6AD" stroke="#8A8275" strokeWidth="1.5" />
      <text x="12" y="17.5" textAnchor="middle" fontSize="14" fontWeight="800" fill="#1F2937">+</text>
      <text x="36" y="17.5" textAnchor="middle" fontSize="13" fontWeight="800" fill="#188038">7</text>
      <text x="12" y="41.5" textAnchor="middle" fontSize="13" fontWeight="800" fill="#188038">3</text>
      <text x="36" y="41.5" textAnchor="middle" fontSize="14" fontWeight="800" fill="#1F2937">=</text>
    </svg>
  )
}

// ---------- Levels ----------

function Levels(props: {
  diff: Difficulty
  progress: Progress
  onDiff: (d: Difficulty) => void
  onPick: (n: number) => void
  onBack: () => void
}) {
  const { diff, progress } = props
  const next = progress.next[diff]
  const count = Math.max(30, Math.ceil((next + 6) / 30) * 30)
  return (
    <div className="page levels">
      <header className="topbar">
        <button className="icon-btn" onClick={props.onBack} aria-label="Back">
          <Icon name="back" />
        </button>
        <div className="title">
          <div className="title-main">Levels</div>
        </div>
      </header>
      <div className="tabs">
        {DIFFS.map(d => (
          <button key={d} className={d === diff ? 'active' : ''} onClick={() => props.onDiff(d)}>
            {NAMES[d]}
          </button>
        ))}
      </div>
      <div className="level-grid">
        {Array.from({ length: count }, (_, i) => i + 1).map(n => {
          const res = progress.levels[levelKey(diff, n)]
          return (
            <button key={n} className={`level ${res ? 'done' : ''} ${n === next ? 'current' : ''}`} onClick={() => props.onPick(n)}>
              <span>{n}</span>
              {res && (
                <span className="mini-stars">
                  {[1, 2, 3].map(i => (
                    <Icon key={i} name="star" className={i <= res.stars ? 'on' : 'off'} />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------- Settings ----------

function SettingsModal({ settings, onChange, onClose }: { settings: Settings; onChange: (s: Settings) => void; onClose: () => void }) {
  const row = (key: 'showTimer' | 'showMistakes' | 'largeNumbers' | 'vibrate', label: string, hint: string) => (
    <label className="setting">
      <div>
        <div className="setting-label">{label}</div>
        <div className="setting-hint">{hint}</div>
      </div>
      <input type="checkbox" className="switch" checked={settings[key]} onChange={e => onChange({ ...settings, [key]: e.target.checked })} />
    </label>
  )
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal settings" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Settings</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        {row('showMistakes', 'Show mistakes', 'Turn a finished equation red when it is wrong')}
        {row('showTimer', 'Show timer', 'Display the clock while you play')}
        {row('largeNumbers', 'Larger numbers', 'Bigger digits on the board and tiles')}
        {row('vibrate', 'Vibration', 'A tiny buzz when you place a number')}
        <label className="setting">
          <div>
            <div className="setting-label">Dark mode</div>
            <div className="setting-hint">Easier on the eyes at night</div>
          </div>
          <input
            type="checkbox"
            className="switch"
            checked={settings.theme === 'dark'}
            onChange={e => onChange({ ...settings, theme: e.target.checked ? 'dark' : 'light' })}
          />
        </label>
        <div className="how">
          <h3>How to play</h3>
          <p>Fill every empty square with a number from the tiles below so that every equation is true — across and down.</p>
          <p>Tap a square, then tap a number. Or drag a number onto a square. To take a number back, tap its square and press Erase (or drag it off the board).</p>
          <p>Each equation is just two numbers, one sign, and the answer. Stuck? The hint button is free and unlimited.</p>
        </div>
      </div>
    </div>
  )
}
