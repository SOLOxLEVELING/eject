# AGENTS.md — EJECT: Settings Are the Dungeon

This file is the shared operating contract for all coding and review agents working on this repository.

## Mission
Build and submit a polished, original, approximately 3–5 minute **browser game** for WolfJam 2026. The player explores small top-down rooms and uses settings (brightness, volume/mute, and interaction key binding) as gameplay mechanics. The result must run without accounts, servers, API keys, or installation.

**Source of truth:** `PLAN.md` defines gameplay behavior, visual direction, scope, acceptance gates, and deadlines. The user's latest explicit instruction overrides these documents. Do not assume a kickoff theme: read the `Theme` field in `PLAN.md`; if it is `UNCONFIRMED`, keep story copy easy to adapt.

## Implementation constraints
- Stack: Vite + React + TypeScript + plain CSS. No Phaser, backend, database, router, Tailwind, state management library, animation library, component library, or external AI integration.
- Game world: deterministic top-down tile grid displayed with CSS Grid. Use small pure functions for rules and collision; use a React reducer for game state.
- Game is playable with keyboard; settings are operable with pointer and keyboard. Provide a visible on-screen Interact action for accessibility where appropriate.
- Sound: optional minimal Web Audio tones after user interaction only; no autoplay. Muting must also mute any generated tone. The puzzle must remain solvable with sound off.
- Use local assets/CSS/SVG created for this project, or legally usable attributed assets. No uncredited downloads. Fonts must have system fallbacks; avoid network-critical dependencies.
- Do not use real operating-system brightness/volume APIs. Settings alter the **in-game** world.
- Avoid architecture for hypothetical future features. No analytics, accounts, scoring, leaderboard, tutorial engine, procedural levels, AI NPCs, or particle framework.

## Design rules — no generic AI template aesthetics
- Present a memorable **corrupted diagnostic console**, not a startup SaaS dashboard.
- Palette: near-black `#101213`, warm paper `#E7E1D4`, muted sage `#8CA99B`, signal orange `#E97C55` (modest variations allowed).
- Strong hierarchy, substantial negative space, deliberate typography, subtle technical lines. Mostly sharp corners; reserve rounded shapes for controls where helpful.
- Avoid purple/blue gradients, glassmorphism, excessive glows, emoji icons, stock hero images, randomly scattered floating cards, long intro animations, and unexplained UI decoration.
- Visual feedback must explain gameplay: show *why* a gate is locked and immediately reflect setting changes.
- Animations should be short, purposeful, and respect `prefers-reduced-motion`.
- Prioritize desktop 1280×720 and sensible layout at 390px width; do not let mobile styling break desktop.

## Working protocol: one milestone at a time
1. Read `AGENTS.md` and `PLAN.md`. Identify the stage explicitly requested by the user.
2. Inspect the existing repository and git status before editing. Preserve work already completed.
3. Implement **only** the active stage. Do not pre-build later rooms or polish systems, even if tempting.
4. Keep each stage small enough to review in one diff. Prefer understandable code over clever abstractions.
5. Run available checks, e.g. `npm run build`, `npm test -- --run`, and a browser smoke test when possible. Report commands and outcomes truthfully; do not claim a test ran when it did not.
6. Stop at the milestone gate. Report: changed files, what is now playable, checks run/results, known risks, a short manual playtest, and the next stage. Ask for the next stage rather than proceeding automatically.
7. Commit one milestone at a time when authorized. Never reset, force-push, delete, or overwrite unrelated user changes.

## File boundaries (target, not a reason to add empty files)
```
src/
  app/App.tsx
  game/types.ts
  game/levels.ts
  game/rules.ts
  game/gameReducer.ts
  components/WorldGrid.tsx
  components/SettingsPanel.tsx
  components/Hud.tsx
  styles.css
src/game/rules.test.ts
```
Keep stage-specific components colocated or merge small components when more readable. Do not create more than one state-management system. Data describing room layouts belongs in `levels.ts`, while predicates belong in `rules.ts`.

## Gameplay invariants
- Current room and position must always be valid; walls block movement.
- Player advances only through its room's solved exit condition.
- Brightness, volume, mute, and interaction binding retain their values between rooms.
- Stage 1: brightness >= 70 reveals the hidden glyph; player must stand adjacent and interact to unlock.
- Stage 2: volume in [55, 75] and mute OFF allow activation of the resonator when adjacent; wrong settings provide feedback.
- Stage 3: interact binding must be `K` to activate the terminal when adjacent; tell the player the required key diegetically.
- Finale: completed puzzle flags plus valid live settings must permit escape; changing a required setting away from the correct value should visibly invalidate that condition until restored.
- The exact tile layouts can change as long as each room has a clear, fair, navigable path and these invariants hold.
- No timers, death states, or randomization. The game must never become unwinnable.
- Avoid stale state in event listeners. Ignore movement hotkeys while a slider/select or other interactive input is focused, unless explicitly handled safely.

## Review agent contract
The reviewer is **read-only by default**. It must inspect actual files/diffs, assess playability and rule correctness, run checks if tools allow, and report concrete, reproducible problems. Do not modify code, automatically refactor, or expand scope. Prioritize:
- **P0** prevents starting, completing, building, or submitting.
- **P1** confuses/blocks major gameplay or violates the design/scope contract.
- **P2** polish/accessibility/minor performance, fix only if time permits.
Give exact file paths, reproduction steps, expected/actual results, and a minimal repair suggestion. Also flag any unverified assumptions. If no substantive findings, say so.

## Definition of done
A stranger can open the deployed URL, understand controls within 20 seconds, complete all three puzzles and the finale in 3–5 minutes without outside help, and see a clear completion screen. The game runs in a production build; links and documentation are ready for Devpost before the deadline.
