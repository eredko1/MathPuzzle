import type { Gen, Subject } from '../types'
import { math1, math2a } from './math1'
import { physics } from './physics'
import { chem } from './chem'
import { english } from './english'
import { english2 } from './english2'
import { bio } from './bio'
import { cs } from './cs'
import { english3 } from './english3'
import { factGens } from './facts'
import { calc1 } from './math2'
import { upper } from './math3'

/** Parameterised generators per subject. Subjects with none are served from hand-written banks only. */
export const GENS: Record<Subject, Gen[]> = {
  math: [...math1, ...math2a, ...calc1, ...upper],
  // the big combinatorial grammar generators also serve the hard tier, where English has the smallest pool
  english: [...english, ...english2, ...english3, ...english3.filter(g => g.topic === 'Subject–verb agreement' || g.topic === 'Verb tense').map(g => ({ ...g, level: 3 as const }))],
  physics: [...physics, ...factGens.physics],
  chem: [...chem, ...factGens.chem],
  bio: [...bio, ...factGens.bio],
  cs: [...cs, ...factGens.cs],
}
