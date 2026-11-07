# EJECT V3 — One-Phase Agent Prompts

Copy ONE block at a time into GPT-6.1 Sol. Never feed all prompts as one build request. The source repo and current git state must be inspected; file names are not guaranteed. Keep logs short and evidence-based.

## BUILDER — V3-0: audit & safeguard ONLY
```text
You are the sole EJECT V3 builder. Read AGENTS.md, V3_AGENTS_ADDENDUM.md, PLAN.md, V2_PLAN.md, V3_GAME_DESIGN.md, V3_STORYBOARD.md and this file. User confirms V2-5 has been executed; V1 Stage 6/release has NOT. Execute V3-0 ONLY.

Inspect actual project structure, git status/history, running/build status, tests, existing six-room flow, story, controls, frame behavior and lighting implementation. Do not assume the prior planning file paths match code. Preserve every uncommitted user change; create a safe named checkpoint/branch/tag/commit without destructive commands. Report which exact modules/components each V3 milestone should touch and what regression risks exist. Run build and available tests, noting gaps. STOP WITHOUT implementing any V3 feature.
```

## BUILDER — V3-1: VISIBILITY / real spatial darkness
```text
Read V3_AGENTS_ADDENDUM.md + V3_GAME_DESIGN.md and your audit. Execute V3-1 ONLY: make brightness materially change actual dungeon visibility, not just a glyph toggle.

Preserve V2-5 rooms, reducer, collision, glyph threshold >=70, UI legibility. Add low-cost player-position-centered spotlight/darkness as visual layer ONLY above world, beneath avatar/essential near-neighbor indicators and HUD. At 20% most room beyond ~1–2 tiles almost black; at 80% same room visibly bright and legible. Smoothly scale intensity/radius by brightness; consistent at edge coordinates and movement. Never dim settings/menu/dialogue; pointer-events:none on overlay; no new dependencies or new room. Keep player and immediate tiles readable; honor reduced motion.

Add focused tests where feasible for brightness-to-light mapping and preserve threshold logic. Run npm build/tests. Give two manual screenshot instructions at same room and same player coordinates brightness=20 and 80, plus movement/interaction regression proof. Report exact files and stop. DO NOT build the title, bedroom or new settings UI yet.
```

## BUILDER — V3-2: story-rich GAME title + intro
```text
Read V3 docs and V3_STORYBOARD.md. Execute V3-2 ONLY. Replace current title's diagnostic-dashboard layout with an authored, game-like illustrated bedroom scene using lightweight CSS/SVG/pixel-inspired shapes. No external imagery or full asset production pipeline. The EJECT title and `BEGIN LAST SESSION` are naturally integrated with CRT; show story-object `PLAYERS ONLINE: 1` and shutdown warning. Maintain clear accessible start/help.

Implement 5 skippable cinematic beats (35–45s max if watched, fast click-through): lone boy playing final minutes; session termination; CRT pulls him in; waking as OP-01; visibility protocol and first control. Use EXACT concise script/story beats from V3_STORYBOARD.md unless a tiny adjustment is needed to fit actual code. Use single familiar story/dialogue mechanism, no animation framework. Skip button works first frame and mid-cutscene; Enter advances, Escape skips when intro only; no key leakage into gameplay; reduced-motion still images; no autoplay sound before user gesture. Keep room entry/restart deterministic and preserve existing V2 rooms.

Run build/tests, test fresh open -> watch -> play, and fresh open -> skip -> play. Report changed files, evidenced checks, risks, STOP. Do not refactor game rendering or Patch Deck yet.
```

## BUILDER — V3-3: PATCH DECK / remove repetitive menu friction
```text
Read V3 docs. Execute V3-3 ONLY. A player currently must repeatedly open settings, change a value and close. Replace this loop with a tiny game-like, quick-access Patch Deck instrument overlay, without replacing the existing game settings state or core puzzle rules.

In active play, show brightness + volume compact sliders and mute toggle in a low-profile diegetic HUD, with optional expand for Interact Key and Window Mode. Keep >80% room visible; never recreate a dashboard sidebar. `Q` may expand/collapse if no existing input conflict, visible pointer button required; Esc remains pause/settings. World responds live while changing values. Ensure keyboard tab/focus, movement suppression when controls are focused, no global Tab trapping, state sync with full menu, remapped interact key works, background game doesn't move on slider arrows, restart resets consistently. Treat gamepad/touch as non-goals.

Run build/tests and manually test brightness <-> movement <-> brightness and volume/key/frame paths without repeated popup open/close. Give exact files, manual steps, STOP. No intro changes, new levels or cosmetic art rebuild.
```

## BUILDER — V3-4: THE FRAME real physical aperture (CONDITIONAL)
```text
Execute V3-4 ONLY IF current local time is before 05:00 IST Nov 8 AND V3-1..3 are playable; otherwise SKIP and report reason. Read existing V2-4 Frame Mode code first and V3 specs.

The user reports Window/Frame mode feels cosmetic. Make this meaningful: switching Framed vs Borderless should alter the visible in-game stage aperture AND existing room passage geometry in THE FRAME, with mechanically matching deterministic collision, no real browser resizing/fullscreen calls. A physical shutter/frame bar retracts and the visible room gets larger in Borderless mode (not just label or border color). 200-350ms max, reduced-motion immediate. Prevent shifting to Framed if occupied tile would become invalid, with short understandable feedback. Do not create any new level, engine or camera framework. If safe existing geometry is already implemented, enhance presentation instead of rewriting it.

Add focused tests for toggles near danger tiles/exit/restart and regression on old rooms. Manual test Framed vs Borderless with same camera/position and show visible physical difference. If risk of softlock or insufficient time, preserve stable existing behavior and STOP. Report evidence.
```

## BUILDER — V3-5: dialogue guidance, feedback, and ending (NO new levels)
```text
Read V3_STORYBOARD.md + V3_GAME_DESIGN.md. Execute V3-5 ONLY if core stages are stable. Keep already-included six rooms, no seventh. Add brief character/system dialogue prompts and optional contextual hints to HELP a first-time player infer settings without spelling all numeric answers in HUD. Prefer manual `?` hint prompt over complex timer framework; no interrupt/spam during movement. Reuse one small dialogue component for intro, room hints, and ending where practical. Preserve all V2 rules and exits.

Polish one unmistakable lighting reveal, room transition, frame mechanic response, and short ending: `PLAYERS ONLINE: 0` -> 'Look again.' -> `PLAYERS ONLINE: 1` -> minimal dawn bedroom / `THANK YOU FOR PLAYING.` Sound is optional and must obey user gesture and mute. Keep animation sparse and allow reduced motion. Don't introduce branching story or voiceover.

Run build/tests; confirm each room still winnable, dialogue can be dismissed, no keyboard trap; report files and STOP.
```

## BUILDER — V3-6: integrate, feature-freeze (REQUIRED)
```text
Execute V3-6 ONLY. Read V3 docs and actual source. NO more features or redesign. Verify title -> start -> watch and skip intro -> all six current rooms (if present) -> finale -> ending -> play again. Test brightness 20/80 same position, menu+Patch Deck sync, audio ranges 54/55/75/76 muted and unmuted, E -> K key binding, Frame Mode physical aperture/collision, dialogue/hints, focus/ESC, restart, reduced-motion and silent play. Fix P0 and P1 only. Build/tests, browser smoke if available. Confirm stable git ref, change list, known limitations. STOP and handoff for read-only review. Do not deploy or submit yet.
```

## GEMINI 4 ARGON — Independent READ-ONLY review
```text
You are the independent senior game-design and frontend reviewer for EJECT V3. Read AGENTS.md, V3_AGENTS_ADDENDUM.md, V3_GAME_DESIGN.md, V3_STORYBOARD.md, V2_PLAN.md. Inspect actual repo, git diffs, tests, build and preferably run/play the game. READ ONLY: do not edit, format, stage, commit, regenerate files, install packages or silently fix anything.

Check judge-first-impression (title looks like game); V3 theme (20 vs 80 physically visible, moving spotlight); progression/softlocks including Frame toggles; skippable story & state transitions; Patch Deck fast direct live controls; focus/keyboard; mute/reduced motion; puzzle rule preservation; full six-room complete+ending+replay; readiness for deployment. Report only repro-backed P0/P1/P2, with path:line, repro steps, expectation/observed and minimal fix. Include build/test command outcomes and unknowns. Verdict PASS / PASS WITH MINOR / BLOCK and whether release is safe. No speculative refactors or extra feature wishlist.
```

## BUILDER — Targeted post-review repair ONLY
```text
We are in a deadline-constrained repair phase after independent review. Read V3 docs and apply only confirmed P0/P1 fixes pasted here:
[PASTE REVIEWER FINDINGS]
Reproduce before fixing where possible, make smallest edits, add focused regression tests if cheap, run build/tests, report. Do not touch P2 polish or introduce features. STOP.
```

## RELEASE — Original V1 Stage 6 after V3 acceptance (REQUIRED)
```text
Feature frozen and independently reviewed. Read original PROMPTS.md Stage 6 and V3 source docs. RELEASE ONLY: no game mechanics, levels, art or story additions. Run production build/tests, static deployment and private-incognito smoke playthrough; confirm hosted playable URL, GitHub source, README with controls and theme VISIBILITY explanation, proper third-party assets/AI disclosures, 45-90 sec demo video/screenshots, Devpost entry fields and submission confirmation. User must complete account-dependent publish/submit steps. Do not claim hosted/Devpost success without evidence. Preserve at least 90-minute buffer to Nov 8 09:30 IST deadline.
```
