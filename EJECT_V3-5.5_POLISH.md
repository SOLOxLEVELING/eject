# EJECT — V3-5.5 Final Game-Feel Polish

**Insert between V3-5 and V3-6.** This is a deliberately limited presentation pass, NOT V4, a new level, or a rearchitecture.

**Project:** https://github.com/SOLOxLEVELING/eject
**Theme:** VISIBILITY. **North star:** a first-time judge understands the premise, feels a distinctive world-changing setting, and can play without developer assistance.
**Hard rule:** protect time for V3-6, independent read-only review, targeted repairs, deployment, video and Devpost submission. Finish the polish no later than 04:30 IST Nov 8, 2026; stop earlier if any problem threatens the working game. Official submission cutoff: 09:30 IST.

## Repository-grounded baseline

- `src/components/TitleScreen.tsx` renders the CRT menu inside the hand-authored `BedroomScene.tsx` SVG. Rain and transition animations already exist in `src/styles.css`. Keep these.
- `src/game/openingStory.ts` defines five beats with multiple dialogue lines in several scenes; `src/components/OpeningSequence.tsx` advances by beat. `src/components/StoryDialogue.tsx` currently maps and displays all lines in a beat simultaneously. Improve pacing without rewriting the story engine.
- `src/components/WorldGrid.tsx` renders player-centered radial darkness derived from `src/game/lighting.ts`. It also has existing reveal and machine feedback animations. Preserve the real light mechanic, puzzles and threshold logic.
- `src/components/PatchDeck.tsx` provides live light, volume, mute, key and window controls. `src/styles.css` currently uses a compact 480px deck and ~0.65rem status label. Make it legible without increasing footprint or blocking the board.
- `src/app/App.tsx` owns gameplay input and feedback sounds. Avoid introducing competing keyboard handlers or new audio libraries.
- Tests exist in `src/game/*.test.ts`; `scripts/browser-smoke.mjs` is substantial. Run existing checks; do not promise browser tests passed if not run.
- `README.md` opens with outdated 'corrupted hardware calibration menu' framing. Update to 'The Last Player' and VISIBILITY during RELEASE, not this polish stage.

## Order / prioritized scope

### V3-5.5A — Story and title micro-polish (timebox 35–45 minutes)
1. In the opening, present **one dialogue line at a time**, with speaker, accessible text, and subtle transition. Enter/click advances line before scene. The existing Skip intro button / Escape must immediately enter the same fresh game state. Preserve automatic progression and overall intro length (~43 seconds when idle); no typewriter effect or new animation dependency. Prefer limiting changes to `OpeningSequence.tsx`, `StoryDialogue.tsx` (if needed), focused CSS, and focused tests. Prevent keydown from leaking into gameplay.
2. Improve visual focus of the existing TV menu (selection cue, focus/hover, understated CRT pulse/glow). Keep the original bedroom illustration, artwork, title layout, and user-gesture sound policy. Respect reduced motion. Avoid distracting flicker.
3. Quick manual verification: Title -> first dialogue -> advance with Enter and click -> skip from first, middle, last beat -> gameplay; How to Play/keyboard focus still work. Check 1280x720.

### V3-5.5B — World feedback and Patch Deck legibility (timebox 35–45 minutes)
1. Make the **first glyph discovery** the signature VISIBILITY moment, using an existing glyph/machine CSS reveal pulse or gentle short-lived halo when crossing brightness threshold. Do not alter `brightness >= 70` unlock logic; do not spawn additional particles or introduce a canvas engine. Keep it responsive during slider dragging and avoid repeated excessive flashes.
2. Improve the live Patch Deck at desktop 1280x720: status text >= 12px, readable labels and focus states, compact accessible controls, no overlap with dialogue, hints, movement buttons, or passage. Use CSS changes first. Do not turn it back into a dashboard. If current layout meets all criteria, change as little as possible.
3. The current hint affordance is a small `?` button. Give it a discoverable HINT label or tooltip without expanding the HUD or creating automatic hint popups. This is optional if it risks input or layout behavior.
4. Retain existing room animation/effects and feedback audio. Add only minimal feedback (e.g. existing gate unlocking cue) if it is clearly absent, using the current audio helper and respecting mute. No background music or new asset packages.
5. Quick manual verification: screenshots at brightness 20 and 80 from same tile; move at low light; reveal glyph; close/open gate; mute/volume; focus arrows on a slider do NOT move character; hints usable; switch Window Mode; final sector still playable.

## Not in scope

No new levels, enemies, missions, characters, dialogue branches, tile art redesign, new libraries, cameras, save systems, backend, shader system, complex typewriter, audio soundtrack, large responsiveness rewrites, or new settings mechanics. Do not rewrite reducer, rules, levels, lighting math, story beats, or tests simply for neatness. Do not add 'smart' automation of focus or movement unless fixing an observed issue.

## Mandatory exit criteria for each micro-stage

- Snapshot/commit a **known working state** before changing code; preserve uncommitted changes.
- Limit changes to named components and focused tests; report exact files.
- `npm run build` passes, `npm test -- --run` passes; run `npm run test:browser` if local browser prerequisites are available. State any skips explicitly.
- Manually verify title -> intro -> start, room movement, brightness, Patch Deck, Escape pause and return, and replay/ending if relevant.
- No unintended layout shift, keyboard trap, softlock, unreadable text, or heavy effect. Test reduced motion.
- STOP after each micro-stage and ask the human operator to accept it. If the stage runs long or regression appears, revert only its changes and proceed to V3-6 with the stable V3-5 state.

## BUILDER PROMPT — V3-5.5A (paste separately)

You are the sole incremental developer working on EJECT, https://github.com/SOLOxLEVELING/eject. Read AGENTS.md, V3_AGENTS_ADDENDUM.md, V3_GAME_DESIGN.md, V3_STORYBOARD.md, V3_PROMPTS.md, and EJECT_V3-5.5_POLISH.md. V3-5 has been completed. Execute **V3-5.5A ONLY** (story/CRT micro-polish). First inspect actual source, tests, git status and preserve a working checkpoint. Implement the smallest safe changes to display a single spoken line at a time in the existing five-beat opening without changing the story, preserving ~43s maximum auto-progression, Enter/click advance, immediate Escape/Skip, fresh state, keyboard focus, accessible announcements, and reduced motion. Add restrained CRT menu hover/focus/ambient polish using existing assets and CSS. Do not touch gameplay reducer, levels, physics, settings, lighting math or extra features. Build/test, report screenshots/manual verification steps, exact changes and risks. STOP. No V3-5.5B or V3-6.

## BUILDER PROMPT — V3-5.5B (paste only after A acceptance)

Read EJECT_V3-5.5_POLISH.md and current source. Execute **V3-5.5B ONLY** (the world reveal and Patch Deck). Preserve a working checkpoint. Inspect existing `WorldGrid.tsx`, lighting.ts, `PatchDeck.tsx`, App.tsx and style rules; enhance the first optical glyph reveal with one restrained, quick visual beat when brightness passes the existing visibility threshold, without changing unlock mechanics or creating expensive effects. Refine Patch Deck readability (status text >= 12px, focus visibility, overlap safety, 1280x720 and narrower widths). Make the small `?` hint affordance more discoverable if possible without any layout/input risk. Reuse existing feedback/audio if needed; mute must remain respected. No unrelated refactor and no new systems or dependencies. Run build/tests and if feasible browser smoke; manually test visibility at 20/80, movement, settings, controls, six-room progression and finale. Report evidence, exact paths, known issues. STOP. Then handoff to existing V3-6.

## After polish — original workflow, unchanged

**V3-6 integration/feature-freeze** -> **Gemini 4 Argon independent READ-ONLY review** -> **GPT targeted P0/P1 fixes ONLY** -> **original Stage 6 release** (build/deploy/incognito test/screenshots/short video/Devpost submit). Any non-blocking P2 is deferred past submission.
