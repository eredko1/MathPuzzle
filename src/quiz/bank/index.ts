import type { BankItem, Subject } from '../types'
import { bioBank } from './bio'
import { englishBank } from './english'
import { moreBio, moreChem, moreCs, moreEnglish, moreMath, morePhysics } from './more'
import { chemBank, csBank, mathBank, physicsBank } from './stem'

/** Hand-written question banks per subject (correct answer first; the engine shuffles). */
export const BANKS: Record<Subject, BankItem[]> = {
  math: [...mathBank, ...moreMath],
  english: [...englishBank, ...moreEnglish],
  physics: [...physicsBank, ...morePhysics],
  chem: [...chemBank, ...moreChem],
  bio: [...bioBank, ...moreBio],
  cs: [...csBank, ...moreCs],
}
