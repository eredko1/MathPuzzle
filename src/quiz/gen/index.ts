import type { Gen, Subject } from '../types'
import { math1, math2a } from './math1'
import { physics } from './physics'
import { chem } from './chem'
import { english } from './english'
import { english2 } from './english2'
import { bio } from './bio'
import { cs } from './cs'
import { calc1 } from './math2'
import { upper } from './math3'

/** Parameterised generators per subject. Subjects with none are served from hand-written banks only. */
export const GENS: Record<Subject, Gen[]> = {
  math: [...math1, ...math2a, ...calc1, ...upper],
  english: [...english, ...english2],
  physics,
  chem,
  bio,
  cs,
}
