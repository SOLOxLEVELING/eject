# EJECT V3 — Agent rules addendum

**Priority:** human's latest instructions > this addendum + V3_GAME_DESIGN.md/V3_STORYBOARD.md > prior AGENTS.md / V2_PLAN.md > old PLAN.md. Preserve old rules except where explicitly superseded here.

## Roles
- GPT-6.1 Sol: sole builder/editor, one selected prompt/phase per turn, stops after acceptance evidence.
- Gemini 4 Argon: independent READ-ONLY reviewer. No formatting, staging, edits, commits or auto-fixes.
- Human: manually plays each accepted checkpoint, protects timeline, handles actual account-dependent submission.

## Source of truth
- Existing working game mechanics/state/code are the source of truth, NOT assumed paths in earlier design docs.
- V2-0 through V2-5 were reportedly done, including THE FRAME and CROSS-TALK. Verify before changing anything.
- Original V1 Stage 6 release readiness is still to be completed **after** V3 review.
- Set theme **VISIBILITY**. Make it manifest in playable lighting, readable hints, spatial framing and narrative, not only in marketing.

## Hard constraints
- Existing React + TypeScript + Vite + tile reducer; do NOT port engines, introduce backend, use generated API assets, swap state frameworks, or create a new art-pipeline dependency.
- Preserve deterministic movement, walls, interact bindings, brightness glyph rule (`>=70`), audio stable unmuted `55-75`, terminal key K, six included sectors (if present), final gate, restart, menu focus semantics and reduced-motion support.
- No combat, enemy AI, save system, procedural generation, inventories, physics, online features, long cutscene, or added levels.
- V3 permits adapting the *presentation*, story text, lighting layers and setting controls; change gameplay rule only when deliberately asked in the selected phase, with regression tests.
- Never disable ordinary browser keyboard navigation. Do not capture Tab globally. Ignore movement keys while editable controls/dialogue/pause have focus.
- No browser resizing or external fullscreen switch as a fake 'Window Mode' mechanic. Modify the **in-game** camera/scene aperture and actual traversal gating.
- Sound may only start after user input and must honor mute. Puzzle clarity must not rely on sound.
- Use locally-authored CSS/SVG/pixel-art primitives; avoid unlicensed stock art. Keep original work attributed/disclose AI assistance appropriately.
- No generic SaaS page/cards for title or gameplay; the world dominates and settings look like game equipment, not admin forms.
- Do not destructively reset or overwrite uncommitted user work. Make a named checkpoint/branch/tag only after inspecting git status and preserving changes.

## Phase protocol
1. Read requested single V3 prompt + source/docs and inspect actual current code and diff.
2. Identify narrow file list and acceptance criteria; do not expand scope.
3. Implement and run `npm run build` and tests if existing. Do browser playtest when available, noting what was/wasn't actually checked.
4. Return exact changed files; test results; 3-5 click/key manual verification steps; git ref/checkpoint; known risks; STOP.
5. Any P0 (unplayable/undeliverable) or P1 (major input/softlock/clarity) must be fixed before advancing.

## Deadline kill-switch
- Hard feature freeze **06:00 IST on Nov 8**.
- Target completed submission **08:00 IST**, deadline **09:30 IST**.
- If 06:00 has passed: refuse requests for extra rooms, cutscenes, refactors and art pipelines; only fix P0/P1, test, capture and ship.
- If V3 visual work risks V2 playability: revert the narrow feature to the stable checkpoint, not the whole project.
