# Math Crosswords & Daily Quiz

An ad-free puzzle app with two modes. It's an installable PWA that works offline.

- **Crosswords**: Crossmath-style math puzzles (easy / medium / hard, levels + daily).
- **SAT Practice Test** (inside Daily Quiz): pick 5, 10, 15 or 20 questions (optionally timed at the real SAT pace) from a Reading & Writing + Math mix. Results show an estimated 400–1600 score with a likely range, section scores, a percentile and a full answer review. Scoring uses a simple item-response model (question difficulty + a guessing floor) mapped to the SAT scale; it is a practice estimate, not an official score. The test engine (`src/quiz/test.ts`, `src/Test.tsx`) is generic so other test kinds can reuse it.
- **Daily Quiz**: a daily set of multiple-choice questions, one per subject (Math, English, Physics & Engineering,
  Chemistry, Biology, Computer Science), plus free practice by subject and difficulty. Every question has a
  two-step hint (a nudge, then a 50/50 eliminator) and an explanation. Progress and weak topics are tracked on-device.

## Commands

- `npm run dev`: local dev server
- `npm run build`: production build into `dist/`
- `npm run verify`: stress-tests the crossword generator
- `npm run verify:test [N]`: validates the SAT pools, test construction and scoring calibration
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
