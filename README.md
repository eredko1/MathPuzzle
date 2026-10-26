# Math Crosswords

An ad-free Crossmath-style puzzle game. It's an installable PWA that works offline.

- `npm run dev`: local dev server
- `npm run build`: production build into `dist/`
- `npm run verify`: stress-tests the puzzle generator (validity, solvable without guessing, speed)
- `npx tsx scripts/print.ts medium some-key`: print a generated puzzle as text

Puzzles are generated deterministically from a key (`level:medium:12`, `daily:hard:2026-10-26`),
so every level and daily puzzle is the same on every device. The engine lives in `src/engine/puzzle.ts`.
