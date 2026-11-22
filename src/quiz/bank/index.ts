import type { BankItem, Subject } from '../types'
import { bioBank } from './bio'
import { englishBank } from './english'
import { chemBank, csBank, mathBank, physicsBank } from './stem'

/** Hand-written question banks per subject (correct answer first; the engine shuffles). */
export const BANKS: Record<Subject, BankItem[]> = {
  math: mathBank,
  english: englishBank,
  physics: physicsBank,
  chem: chemBank,
  bio: bioBank,
  cs: csBank,
}
