export type Subject = 'math' | 'english' | 'physics' | 'chem' | 'bio' | 'cs'
export type Level = 1 | 2 | 3

export const SUBJECTS: Subject[] = ['math', 'english', 'physics', 'chem', 'bio', 'cs']
export const LEVELS: Level[] = [1, 2, 3]

export const SUBJECT_INFO: Record<Subject, { name: string; short: string; emoji: string; color: string; blurb: string }> = {
  math: { name: 'Math', short: 'Math', emoji: '∑', color: '#2f6fe4', blurb: 'SAT to Calc 4, linear algebra, DEs' },
  english: { name: 'English', short: 'English', emoji: 'Aa', color: '#a855f7', blurb: 'SAT reading, writing, vocab' },
  physics: { name: 'Physics & Engineering', short: 'Physics', emoji: '⚛', color: '#e8590c', blurb: 'Mechanics to statics, circuits, modern' },
  chem: { name: 'Chemistry', short: 'Chem', emoji: '⚗', color: '#0ca678', blurb: 'Gen chem to physical & organic' },
  bio: { name: 'Biology', short: 'Bio', emoji: '🧬', color: '#37b24d', blurb: 'AP bio to genetics & physiology' },
  cs: { name: 'Computer Science', short: 'CS', emoji: '</>', color: '#0b7285', blurb: 'AP CS A, CS Principles, algorithms' },
}

export const LEVEL_NAMES: Record<Level, string> = { 1: 'Easy', 2: 'Medium', 3: 'Hard' }

export interface Question {
  /** Stable id: regenerate the exact question from it. */
  id: string
  subject: Subject
  topic: string
  level: Level
  /** Text with $inline math$, `code`, and ```fenced``` blocks. */
  prompt: string
  choices: string[]
  answer: number
  /** Hint 1: a nudge. (Hint 2 is a 50/50 eliminator computed by the UI.) */
  hint: string
  explanation: string
  /** Dev-only cross-check: [closed form, independent numeric estimate]. */
  check?: [number, number]
}

/** Hand-written bank entry. First choice `a` is correct; the UI shuffles. */
export interface BankItem {
  t: string
  l: Level
  q: string
  a: string
  w: [string, string, string]
  h: string
  e: string
}

export type Rng = () => number

export interface Spec {
  topic: string
  prompt: string
  correct: string
  /** Candidate wrong answers (any number); the first 3 distinct ones are used. */
  wrong: string[]
  hint: string
  explanation: string
  check?: [number, number]
}

/** A parameterised question template: produces a fresh Spec from random numbers. */
export interface Gen {
  level: Level
  topic: string
  make: (rng: Rng) => Spec
}
