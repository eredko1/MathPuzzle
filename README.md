# Math Crosswords & Daily Quiz

An ad-free puzzle app with two modes. It's an installable PWA that works offline.

- **Crosswords**: Crossmath-style math puzzles (easy / medium / hard, levels + daily).
- **Daily Quiz**: a daily set of multiple-choice questions, one per subject (Math, English, Physics & Engineering,
  Chemistry, Biology, Computer Science), plus free practice by subject and difficulty. Every question has a
  two-step hint (a nudge, then a 50/50 eliminator) and an explanation. Progress and weak topics are tracked on-device.

## Commands

- `npm run dev`: local dev server
- `npm run build`: production build into `dist/`
- `npm run verify`: stress-tests the crossword generator
- `npm run verify:quiz [N]`: validates the quiz engine (structure, LaTeX renders, numeric cross-checks, determinism, 2-year coverage)
- `npx tsx scripts/print.ts medium some-key`: print a generated crossword as text

## How content works

Crosswords and quiz questions are generated deterministically from a key, so everyone sees the same daily set on every device.

- `src/quiz/gen/*`: parameterised generators (random numbers, answers computed by code, optional independent numeric
  cross-check). Math, physics, chemistry, biology and CS lean on these, so they run effectively forever.
- `src/quiz/bank/*`: hand-written question banks (`[topic, level, question, correct, [3 wrong], hint, explanation]`).
  English and conceptual questions live here. Add rows freely; the engine shuffles the choices.
- `src/quiz/index.ts`: picks the day's question per subject and difficulty (`dailyPick`) and builds practice questions.
- Text supports `$math$` (KaTeX), `` `code` `` and fenced code blocks.
