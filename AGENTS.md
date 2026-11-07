# AGENTS.md — EJECT V2 (replaces V1 agent instructions)

You are working on **EJECT: Settings Are the Dungeon**, an existing playable hackathon game. V1 has reportedly reached Stage 5; V1 Stage 6 (submission/readiness) has NOT been run. This is a **presentation-and-experience upgrade**, NOT a greenfield rebuild.

## Source order
1. The user's latest instructions.
2. `V2_PLAN.md` for V2 design, sequencing, scope and acceptance gates.
3. `PLAN.md` (existing V1 plan) for the already-implemented mechanics and puzzle contracts, unless V2_PLAN explicitly supersedes it.
4. This file for agent work protocol and constraints.

If any files are missing, report it and inspect the repo; do not invent code or claim a feature is present without verifying it.

## Roles
- **GPT-6.1 Sol — Builder:** the ONLY agent allowed to edit repository files during V2. Works on one V2 milestone per request and then stops.
- **Gemini 4 Argon — Independent Reviewer:** READ-ONLY. Inspects diffs, builds/tests, actual playability and scope. Reports reproducible P0/P1/P2 issues, not speculative architecture refactors.
- **Human:** accepts milestones, runs in-browser playtests, directs feature freeze, deployment and submission.

Never let both agents modify the same tree. Do not autonomously continue to the next milestone.

## Non-negotiables
- Do not rewrite the React/TypeScript/Vite app or move to a new engine.
- Preserve existing tile-grid movement, collision, puzzle logic, settings state, room progression and win/restart behavior unless a scoped V2 phase explicitly extends it.
- Settings affect **only the in-game world**, not OS/browser settings.
- No backend, auth, API keys, AI API, multiplayer, procedural generation, inventory, enemy AI, combat, game loop library, route framework, analytics or new component library.
- Avoid new dependencies unless a demonstrable blocker requires one. Use CSS, local SVG and/or small existing assets; honor licenses and attribution.
- Preserve the V1 rules: brightness >=70 reveals glyph; unmuted volume 55–75 inclusive enables resonator; interact binding K enables terminal; finale responds to *live* settings as well as completed flags.
- Do not sacrifice a playable production build for artistic experiments. Back up the V1 working state with a branch/tag/commit first, with no destructive git commands.

## V2 experience contract
- The game world is the dominant visual element, filling the browser viewport in a landscape composition; no permanently docked diagnostic dashboard.
- Settings open as a diegetic *in-game overlay*, accessible by a visible button and Escape. Keep the environment visible so users can see settings change it immediately.
- Small HUD only: chamber name/progress, current objective, contextual interaction hint, settings shortcut.
- Make game objects legible at low in-game brightness. Brightness affects discoverable environmental elements, NOT basic accessibility or text readability.
- Preserve keyboard support (WASD/arrows, interact current binding), on-screen interact button where appropriate, and pointer+keyboard-operable settings.
- Prevent game movement when controls/inputs/settings overlay are focused or open. Escape closes overlay; return focus sensibly. Never steal Tab in a way that breaks normal keyboard accessibility.
- Opening cinematic must be short, skippable, and respect `prefers-reduced-motion`; no autoplay sound before a user gesture.
- Give clues, not literal walkthroughs or hard-coded solution text in the persistent HUD. Ensure a player can still solve puzzles without guessing undocumented rules.
- Avoid unwinnable states/softlocks when the world changes due to settings. Every room must be traversable from a fresh run.
- Keep responsive behavior sane, but desktop browser at 1280x720 is priority. Mobile need not grow a new virtual-joystick implementation under deadline pressure.

## Aesthetic rules
- Keep V1's restrained industrial palette (charcoal, warm off-white, dusty sage, warning orange) but replace dashboard/cards/diagnostic forms as main screen with an atmospheric playable scene.
- Distinctive and intentional, not generic AI-app styling: no gradients just for decoration, glassmorphism, stock imagery, fake cyberpunk clutter, emoji iconography or dozen floating UI panels.
- Game world uses layered scene composition: strong player silhouette, unmistakable interactive props, legible doors, environmental depth, subtle movement/sound. Motion conveys state changes.
- Smooth enough for normal desktop hardware, with fast interactions and no extended unskippable transitions.

## Every milestone protocol
1. Read `AGENTS.md`, `PLAN.md`, `V2_PLAN.md`, and the single selected prompt in `V2_PROMPTS.md`.
2. Inspect actual source structure, relevant tests and git status; never assume file paths from an earlier plan are still correct.
3. Implement only the requested V2 phase. Prefer the smallest coherent diff.
4. Run `npm run build`, existing test command, and browser/manual smoke check where tooling permits. Be precise about what was not run.
5. Give changed file list, functionality, check results, short reproduction/playtest steps, remaining risks, and STOP.
6. If a P0/P1 issue appears, repair within the same phase before advancing. No unasked-for extra features.

## Severity for read-only review
- **P0**: fails to boot, run, complete, build, or submit; serious regression/softlock.
- **P1**: major gameplay/input/clarity issue, broken visual hierarchy, inaccessible key path, user cannot intuit objective.
- **P2**: polish/nice-to-have. Never expand scope to fix P2 at the expense of release.

## Release safety
- Existing V1 Stage 6 must run **after** V2 is feature-frozen and after a read-only review/repair pass. No new mechanics in Stage 6.
- External deadline: Nov 8, 2026, 09:30 IST. Hard feature stop: **06:00 IST**. Target actual submission: **08:00 IST** (buffer is mandatory). These times are planning gates, not excuses to skip an early submission if ready.
- A complete playable V1 with modest V2 additions is better than a broken V2. Preserve a revertible stable baseline.
