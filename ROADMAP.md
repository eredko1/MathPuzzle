# Roadmap: a daily ritual for lifelong learning

## The idea (from the owner)
Open the app every morning for 1–5 minutes and feel a little sharper: remember something learned
decades ago (10th grade, an engineering degree), keep skills current, or learn something new.
Breadth *and* depth, with the feel of being back in school. It should work on any device.

## What exists today (merged, live at math-crosswords.vercel.app)
- **Crosswords** tab (the original game) and a **Daily Quiz** tab.
- Daily Quiz: one multiple-choice question per subject per day (Math to Calc 3/4, English, Physics &
  Engineering, Chemistry, Biology, CS), practice by subject/level/topic, two-step hints, explanations,
  streaks, weak-spot tracking. ~210 generators + ~300 hand-written questions; no repeats across 2 years for
  most subjects (English is thinnest).
- **SAT Practice Test**: 5/10/15/20 questions, optional timing, estimated 400–1600 score with range,
  section scores and percentile, answer review, save/resume. Generic engine in `src/quiz/test.ts` and
  `src/Test.tsx` (meant to be reused, e.g. for an IQ-style test).
- Responsive from 280px to 2560px, light/dark, large text, keyboard, reduced motion.

## Requested next (in the owner's words, roughly in order)
1. **Learn mode ("lectures")**: per topic, a short lesson, then a quiz on exactly that lesson.
   - Example: *Sorting* → "here is bubble sort, here is how you implement it" → quiz: "what must change in this
     loop to sort descending?"
   - Example: *C strings* → "how do you read a string in C? like this" → quiz on it.
   - Every area (math, physics, chem, bio, CS, engineering, new subjects) gets lessons plus matching quizzes.
2. **Teaching mode**: on any question, an "explain it / how to solve it" walkthrough (step by step).
3. **Coding mode**: given a snippet, work out its output; find and fix the bug; "what change makes it do X?".
4. **A lot more questions** (especially English, conceptual/engineering, and the new subjects).
5. **New subjects**: Materials Science (crystal lattices: FCC/BCC/HCP, packing fraction, density from lattice
   parameter, Miller indices, Bragg's law, defects, phase diagrams, stress–strain...), Political Science, History,
   and other 10th-grade / Stony Brook-engineering-era topics. Chemistry needs more depth.
6. **IQ-style test** (reusing the test engine) after the SAT work.

## Design notes for whoever builds this
- Subjects live in `src/quiz/types.ts` (`Subject`, `SUBJECT_INFO`); content in `src/quiz/gen/*` (generators:
  random numbers, answer computed by code) and `src/quiz/bank/*` (hand-written rows via `rows()`).
  Adding a subject = a new id there + a generator/bank file + registering it in `gen/index.ts`, `bank/index.ts`.
  The daily set is currently "one question per subject", which will not scale to many subjects. Plan a
  user-chosen **daily mix** and a **session length** (1 / 3 / 5 minutes) instead.
- **Lessons**: proposed shape `{ id, subject, title, level, sections: [{ kind: 'text'|'example'|'code'|'math'|'diagram', body }], quiz }`
  in `src/learn/`. `Rich` already renders `$math$`, `` `code` `` and fenced code blocks. Lattices and similar topics want
  small inline SVG diagrams.
- **Teaching mode**: add an optional `steps: string[]` (or `walkthrough`) to `Question`; generators already have the
  intermediate values, so they can emit steps cheaply. Bank rows can gain an optional worked-solution field.
- **Coding mode**: generated programs can have answers computed by running equivalent JS (as `gen/cs.ts` does);
  hand-written **C** snippets should be verified by compiling/running them in `scripts/verify-*.ts` (gcc) so
  "predict the output" answers are guaranteed correct. "Fix the bug" = choose the corrected line/diff.
- **Retention**: spaced repetition of missed questions is the natural fit for "remember what I learned long ago".
  `QuizProgress.topics` already tracks per-topic accuracy.
- Verification scripts: `npm run verify:quiz`, `npm run verify:test` (add one per new feature; keep the
  "KaTeX renders / 4 distinct choices / deterministic" checks).

## Housekeeping / decisions pending
- `math-crosswords` (the original live link) is **not** connected to GitHub, so pushes do not update it; it was
  deployed from the repo manually. A second Vercel project, `math-quiz`, *is* connected and auto-deploys but is now
  redundant. Either delete `math-quiz` or connect `math-crosswords` to GitHub.
- Vercel login protection is on for both projects (team default); turn it off if the app should open without signing in.

## Open questions for the owner
1. Coding mode languages: C only, or also Python / Java / JavaScript / C++?
2. Lesson style: ~2-minute reads, or deeper? Are small diagrams (lattices, circuits, sorting steps) wanted?
3. Daily flow: one "Today" session of 1/3/5 minutes mixing a quick review, a new question and a mini-lesson?
4. Spaced repetition: resurface what you missed (and old topics) automatically?
5. Which subjects first: Materials Science, Political Science, History (US / world / European?), economics,
   geography, literature, more physics/engineering? Target level: 10th grade, college, or a mix?
6. Which should come first: Learn mode, Teaching mode, or Coding mode?
