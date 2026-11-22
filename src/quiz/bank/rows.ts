import type { BankItem, Level } from '../types'

/** Compact bank row: [topic, level, question, correct, [3 wrong], hint, explanation]. */
export type Row = [string, Level, string, string, [string, string, string], string, string]

export const rows = (r: Row[]): BankItem[] => r.map(([t, l, q, a, w, h, e]) => ({ t, l, q, a, w, h, e }))
