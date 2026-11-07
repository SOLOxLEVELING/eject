# Copy/paste prompts — incremental two-agent workflow

**Usage:** Place `AGENTS.md` and `PLAN.md` in the repository root. Send only **one builder prompt at a time** to Gemini 4 Argon. Keep a separate read-only review session (Gemini temporarily, GPT-6.1 Sol High when available). Manually playtest the game after each functional stage. If a stage fails, send the reviewer findings back as a *repair-only* prompt; do not run the next stage yet.

## Builder — Stage 1 (send FIRST)
```text
You are the implementation agent for EJECT: Settings Are the Dungeon. Read AGENTS.md and PLAN.md in full first. We are executing ONLY STAGE 1 (Scaffold + shell). Inspect repository and git status before changes.

Build a Vite + React + TypeScript app with plain CSS and a carefully designed 'corrupted diagnostic console' game shell. Create a simple intro/start state, a visually coherent dungeon viewport placeholder, a settings panel with real controlled brightness, volume, mute, and interact-key controls, a small HUD, and a pure rules module with one minimal test using Vitest. Use the palette and design constraints from AGENTS.md. A static viewport is fine in this stage: DO NOT implement movement, puzzles, multiple rooms, or final game mechanics yet. Do not add Phaser, Tailwind, routing, global state libraries, UI kits, or backend.

Acceptance: npm install, npm run build and tests work; settings update displayed values; start screen transitions to the shell; layout is attractive at 1280x720 and functional at 390px. Inspect in a browser if tools support it. Stop after Stage 1. Report changed files, exact checks run/results, known issues, manual test steps, and proposed next step. Never claim a check you did not run.
```

## Builder — Stage 2 (ONLY after Stage 1 is accepted)
```text
Read AGENTS.md and PLAN.md. Implement ONLY Stage 2: tile grid movement and Room 1 (DISPLAY). Inspect current files and git diff; preserve Stage 1 visuals and conventions.

Implement one deterministic map, walkable vs wall collision, position movement via WASD/arrows, a contextual interaction via the current bind (E initially) and visible on-screen Interact button. Brightness must affect visibility IN THE WORLD, not the actual screen or UI. At brightness >=70, reveal a discoverable glyph; player must be adjacent and interact before exit unlocks. Walking on exit transitions to a simple Room 2 placeholder; do not implement the audio puzzle yet. Provide short diegetic hints and feedback; never leave player stuck.

Add small pure-rule tests for movement boundaries, brightness 69 vs 70, adjacency and exit gating. Run build and tests, and browser check if possible. STOP. Report what works, touched files, tests actually run, manual playtest path, issues. Do not implement Stage 3.
```

## Builder — Stage 3 (ONLY after Stage 2 review)
```text
Read AGENTS.md and PLAN.md. Implement ONLY Stage 3 (AUDIO / RESONANCE). Keep Stage 1–2 behavior intact. Add Room 2 layout with a resonator that activates when the player is adjacent, unmuted, and volume is in the inclusive 55–75 range. The settings pane should visually respond to changes; provide a stable-zone meter and clear TOO LOW / STABLE / TOO HIGH / MUTED feedback. Activate using the existing contextual interact mechanic; after success the player can enter Room 3 placeholder. Sound playback is NOT required in this stage.

Add tests for 54/55/75/76 and muted/unmuted, and verify Room 1 still works. Run build/tests and any available browser smoke check; stop and report exact results. Do not implement Stage 4 or general polish.
```

## Builder — Stage 4 (feature complete)
```text
Read AGENTS.md and PLAN.md. Implement ONLY Stage 4. Add Room 3 (CONTROLS / KEYBOUND) where E is rejected, the player must set Interact to K, stand adjacent to the terminal and press K (or use the accessibility on-screen Interact control). Add the Finale room: visible three-part status diagnostics, an escape gate that requires the three completed room flags AND live correct brightness>=70, volume in 55–75, unmuted and key K. Show specific unmet prerequisites and update live. Add win screen and full restart.

Test bound-key behavior, no skipped flags, invalid/restored settings at final gate, and restart. Preserve prior gameplay and visuals. Run build/tests and complete a fresh start-to-win manual playtest if possible. STOP. Handoff for independent read-only review. Do not add extra mechanics or polishing frameworks.
```

## Builder — Stage 5 (visual and UX polish only)
```text
Read AGENTS.md, PLAN.md, and the independent review's confirmed P0/P1 findings. Implement only Stage 5 polish/repairs: improve visual hierarchy, room feedback, level transitions, tutorial hints, responsiveness and keyboard accessibility; use tiny Web Audio tones ONLY if easy, user-gesture gated and obedient to mute. Honor prefers-reduced-motion. Add a concise README describing controls, concept, tech, setup, asset rights, and honest AI assistance.

Do not add new mechanics, packages, backend, elaborate animations, scores, leaderboard, or unrelated refactors. Run build/tests and fresh-play QA. STOP with report of diff, test evidence, and remaining defects.
```

## Builder — Stage 6 (submission readiness)
```text
Read AGENTS.md and PLAN.md. This is the release stage; NO new features. Run full production build and test suite; inspect terminal warnings and browser console where possible. Repair only genuine release-blocking defects. Confirm that a new user can finish the game and that the built site runs from its deployment URL without backend, authentication or localhost dependencies.

Prepare README, Devpost-ready project summary, concise controls, assets/AI attribution, screenshot/video capture checklist, and exact deployment instructions for a static host / optional itch.io. If credentials or web UI actions are unavailable, do NOT claim to have deployed or submitted; explicitly list remaining manual actions. Report final release checklist and any blockers. STOP.
```

## Reviewer — reusable read-only prompt
```text
You are EJECT's INDEPENDENT SENIOR REVIEWER. Read AGENTS.md and PLAN.md, inspect the current actual source and git diff. The active stage is: [INSERT STAGE NUMBER]. You are STRICTLY READ-ONLY: do not write files, auto-fix, refactor, stage, or commit anything.

Review only the active milestone plus regression risk. Evaluate: (1) correctness and fairness of puzzle logic, (2) gameplay blockers/soft locks and input/focus bugs, (3) design execution vs our non-generic art-direction rules, (4) accessibility and responsiveness, (5) package/build/test status if runnable, and (6) whether scope was exceeded. For Stage 4 and Stage 6, walk through the entire player journey and map all ways it could fail.

Return in this EXACT structure:
Verdict: PASS / PASS WITH MINOR ISSUES / BLOCK
Findings: P0/P1/P2, each with file:line (if possible), concrete reproduction, actual vs expected, minimal repair.
Checks performed: exact commands or inspections and results; be explicit about anything untested.
Regression risks: max 3 bullets.
Next action: either 'Advance to Stage N' or 'Repair these issues before proceeding'.

Do not suggest feature expansions or subjective rewrites. If no substantial issues are evidenced, say so.
```

## Builder — repair-only follow-up
```text
Read AGENTS.md and PLAN.md. We are repairing the current milestone ONLY, not advancing to another stage. Review the following independently verified findings:
[PASTE REVIEW FINDINGS]

Reproduce each P0/P1 issue, make the smallest correct change that preserves earlier stages, add a regression test where economical, and run build/tests. Do not implement unrelated suggestions or P2 aesthetic improvements without approval. STOP and summarize fixes with evidence.
```

## Human playtest checklist after Stage 4
```text
[ ] From a new tab, Start is discoverable and movement works.
[ ] Brightness 69 fails to reveal glyph; 70 reveals it; activation requires proximity.
[ ] Audio range outside 55-75 fails; 55 and 75 work; mute blocks.
[ ] Keybinding change is obvious; E does not activate K terminal; K does.
[ ] Finale shows live requirements; breaking/recovering one visibly changes gate.
[ ] Player gets the win screen and restart clears all state.
[ ] Game does not move player when keyboard-adjusting a focused slider.
[ ] Live deployed page works in private browsing; Devpost opens it without login.
```
