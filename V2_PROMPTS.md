# EJECT V2 — Incremental Builder + Reviewer Prompts

**How to use:** Copy `AGENTS.md` (replace the old one), `V2_PLAN.md` and this file to the ROOT of the existing repository. Leave the existing `PLAN.md` and implementation untouched. Use **GPT-6.1 Sol** as the sole V2 builder. Use **Gemini 4 Argon** in a separate read-only reviewer session. Send **one prompt at a time**, accept the milestone manually, and only then move to the next. Keep V1 Stage 6 untouched until V2 is finished and reviewed.

## BUILDER: V2-0 — Audit and stable baseline (send FIRST)
```text
You are the sole implementation agent for EJECT V2. Read AGENTS.md, PLAN.md and V2_PLAN.md in full before anything else. Our V1 game reportedly completed Stages 1–5; do not assume this is true without checking actual code and tests. I have supplied three V1 screenshots: it is an industrial-looking settings dashboard with a playable 9×7 grid. We are turning it into an immersive short game, NOT rewriting the mechanics.

Execute V2-0 ONLY. Inspect source structure, git status, relevant components/reducer/rules, package scripts, current story states and existing tests. Run build/tests if possible. Safely create a known-good git branch or tag for V1 if repository state allows it; NEVER discard uncommitted changes, reset or force-push. Identify which exact files will be updated for full-viewport rendering, settings overlay, intro and final screen.

Output a concise implementation map listing: existing behaviors verified; visual/UI components to keep/rework; state-machine/keyboard focus risks; missing tests; a 1–2 paragraph design proposal that matches V2_PLAN.md; exact safety snapshot ref (if created). STOP. Do not implement V2-1 yet and do not add new levels.
```

## BUILDER: V2-1 — Gameplay-first layout + settings overlay
```text
Read AGENTS.md, PLAN.md, V2_PLAN.md and your V2-0 audit. Execute ONLY V2-1.

Replace the website/dashboard composition with a real fullscreen/viewport-filling game scene. Keep the existing deterministic tile grid, reducer, puzzle rules, and keyboard movement. The room should dominate the screen; minimal HUD for room name, current objective, nearby interact prompt, settings shortcut. Remove permanent right settings column, status-card UI, technical coordinate labels and long instructions FROM THE PRIMARY PLAY VIEW (do not delete working data/rules). Do not change game engine, switch to canvas, or add dependencies.

Move brightness, volume/mute and interact binding into a coherent in-game overlay opened via Escape OR visible Settings control. World remains visible and reacts LIVE while overlay is open. Prevent movement/input leakage while menu controls are focused/open, preserve ability to operate sliders with keyboard and maintain focus semantics. Keep original puzzles/finale and Start/Restart playable.

Acceptance gate: game looks like a game at 1280×720, not a diagnostic website; every V1 puzzle still works; menu and input behavior are correct; no softlocks; existing build/tests pass. Manually simulate a cold-start playthrough where possible. Report exact files, tests, playtest evidence and remaining risks. STOP. Do not add cinematic or new rooms.
```

## BUILDER: V2-2 — Cinematic intro + story rhythm
```text
Read AGENTS.md and V2_PLAN.md. Execute ONLY V2-2. Preserve all existing logic and newly redesigned V2-1 presentation.

Build a 20–25 second (maximum) in-engine, CSS/React-based skippable introduction, with this compact sequence: (1) shutdown complete, (2) one process remains OP-01, (3) containment is for your protection and a door locks, (4) glitch message: THEN CHANGE THE RULES, (5) handoff to first playable chamber. Provide Skip Intro (button) and a safe keyboard skip path. Respect reduced motion. No video asset pipeline, autoplay sound, remote API, or extra dependency.

Add only 1–2 short optional contextual narrative lines between existing chambers, plus a concise final escape scene; these should never block input for more than a moment. First-time controls must be briefly legible and accessible via Help later. Ensure Escape/menu/skip interactions do not conflict and restart always returns to a known title/start state. All existing puzzles still need to run.

Acceptance: intro skippable on first frame and mid-sequence; full sequence hands off correctly; no state corruption or keyboard focus traps; reduced-motion behavior is sensible; build/tests pass. Report evidence and STOP. Do not add new levels or large art refactor.
```

## BUILDER: V2-3 — Art direction + movement feel
```text
Read AGENTS.md and V2_PLAN.md. Execute ONLY V2-3. Keep the existing underlying game rules and scene API.

Art-direct and improve the actual gameplay environment: recognizable OP-01 avatar silhouette (local SVG/CSS/simple frames), richer wall/floor/door compositions, atmospheric depth, interactive-object highlighting on proximity, short feedback when glyph appears/resonator stabilizes/door unlocks, polished room-enter transitions, and unobtrusive objective HUD. Make the player and interactive objects instantly readable on a 1280×720 browser. Preserve V1 palette, but make the world a scene rather than cells of an admin table. Avoid stock hero art, cliché glows, generic gradient panels and unnecessary packages.

Remove explicit full-solution instructions from default gameplay HUD; preserve fair environmental hints, visual feedback and optional Help for players who need it. Respect reduced motion. Do not implement any new mechanic or room.

Acceptance: visually the room now reads as a game; state-dependent visuals match actual logic; low brightness does not hide fundamental walls or controls; focus, collision, replay and all V1 puzzles work. Run build/tests/manual playtest. STOP with exact summary.
```

## BUILDER: V2-4 — OPTIONAL new room: Window Mode
```text
Read AGENTS.md and V2_PLAN.md. Execute ONLY V2-4, and ONLY if we are ahead of schedule and the V2-3 build is stable. Otherwise explicitly recommend SKIP without changing files.

Implement one additional short handcrafted room, THE FRAME. Add a single in-game setting: Window Mode [Framed | Borderless], which affects room-specific wall/gate geometry; it must NEVER change the browser's actual window/fullscreen. Show the border mechanically retracting/expanding when the setting changes. One clear clue: THE FRAME IS PART OF THE PRISON. Introduce the option when needed and retain access in the finale if harmless, but do not alter original finale's three prerequisites without explicit user instruction.

Critical: prevent softlocks from dynamically becoming a wall tile under the player. Use safe rejection or relocation with clear feedback. Add focused tests for both modes, collision and exit gating. No new dependencies, animation engine, procedural rooms or random events.

Acceptance: room takes roughly 45–75 seconds, puzzles are fair, no stranded tile positions, old levels and finale still pass, build/test pass. Stop if work runs beyond the timebox and report the stable revert point. STOP.
```

## BUILDER: V2-5 — OPTIONAL remix room (only if plenty of time)
```text
Read AGENTS.md and V2_PLAN.md. Execute ONLY V2-5 if time remains and V2-4 is stable. Otherwise SKIP.

Make ONE new compact room called CROSS-TALK using two existing settings in an original sequential spatial puzzle (e.g., brightness reveals an object that must be activated, then audio resonance powers the exit). No new setting categories, enemy AI, timers, cutscene or framework. Make its objects visibly physical and its solution a logical extension of prior learning. Keep room to 45–75 seconds.

Acceptance: a fresh player can infer both steps without exhaustive HUD instructions; no new softlocks; existing puzzle flags, old levels and finale work; unit tests and build pass. Stop with diff summary and demo path.
```

## BUILDER: V2-6 — Integrate, freeze and hand off
```text
Read AGENTS.md, PLAN.md and V2_PLAN.md. Execute ONLY V2-6. We are about to feature-freeze, not expand scope.

Run a new-game-to-ending regression with the intro, menu, every included room, finale, ending and restart. Repair only P0/P1 issues and broken visual/interaction continuity. Keep sound minimal and optional; if it risks regressions, skip it. Check keyboard movement, Escape menu, currently remapped interaction key, sliders, muted/no-sound play, first-use sound policy, reduced motion, small screens, and fresh browser state. Ensure one memorable capture-worthy brightness reveal and finale transition.

Run build/tests, record exact checks/results, list known limitations, current git ref and steps to reproduce the complete journey. DO NOT deploy or submit; DO NOT run original Stage 6 yet. STOP and request independent read-only review.
```

## REVIEWER: Read-only independent V2 acceptance review (Gemini 4 Argon)
```text
You are EJECT V2's INDEPENDENT SENIOR GAMEPLAY + FRONTEND REVIEWER. Read AGENTS.md, PLAN.md, V2_PLAN.md, V2_PROMPTS.md, inspect actual repo and git diff. Do NOT modify, format, commit, stage, regenerate, reset or auto-fix ANY files. Your duty is evidence-based review, not offering a rewrite.

Focus on (1) did V2 genuinely move visual priority from dashboard to game world? (2) V1 regression: brightness, audio range, key binding, finale flags and live settings (3) cold start -> skippable intro -> rooms -> ending -> replay; (4) keyboard navigation/focus and Escape/menu conflicts; (5) dynamic world geometry softlocks if new room added; (6) performance, sound policy, reduced motion and accessibility; (7) build/test status and readiness to enter release phase.

Report:
VERDICT: PASS / PASS WITH MINOR ISSUES / BLOCK
P0/P1/P2 findings: exact path:line, reproducible steps, expected vs actual, smallest fix. No generic architecture criticism or feature wish list.
CHECKS: exact commands and pass/fail, actual browser testing and unknowns.
PLAYTEST: step-by-step route from title through ending with possible pitfalls.
RELEASE GATE: yes/no, and the minimum remaining fixes.

Never write files, even if findings are severe.
```

## BUILDER: Repair-only after review
```text
Read AGENTS.md and V2_PLAN.md. We are in post-review REPAIR mode, NOT adding features. Here are confirmed reviewer findings:
[PASTE FINDINGS]

Reproduce P0/P1 defects and implement the smallest robust fixes. Add focused regression tests if cheap. Do not address subjective P2 notes, redesign the game again, or add new mechanics. Run build/test and return exact evidence; STOP. Preserve release buffer.
```

## RELEASE: Original Stage 6 (last)
```text
We have finished V2, completed independent review and repaired all P0/P1 blockers. Read AGENTS.md, PLAN.md, V2_PLAN.md, and the ORIGINAL PROMPTS.md Stage 6 submission-readiness section. Execute release Stage 6 ONLY: no features, no new levels, no redesigns. Production build/tests, smoke test the hosted link in private browsing, verify controls and full completion, prepare Devpost title, description, what we built, how it works, challenges, AI/asset disclosures, playable game URL, GitHub source URL, screenshots, concise 45–60 sec gameplay video and exact instructions. Do not claim deployment/submission without direct evidence. STOP with a clear release checklist and human actions.
```
