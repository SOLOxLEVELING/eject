# EJECT V2 — Game Direction & Production Plan

**Premise:** A rogue process (OP-01) is still alive inside a game that has been shut down. The system's settings were designed to constrain the world. The player discovers those same settings can rewrite it.

**Tagline:** `The only way out is to change the rules.`
**Duration:** 6–8 minutes for a first-time player, not more than ~10 minutes.
**Platform:** standalone browser, single-player, keyboard first.
**Existing foundation:** V1 reportedly completed Stages 1–5, with 3 mechanics/rooms and system-exit finale. Inspect and preserve actual implementation. Do NOT run V1 Stage 6 until V2 feature freeze and review.
**Theme:** Check the organizer's kickoff theme/Discord. The event's open project category does not prove that there is no separate announced theme. Keep story text easy to adapt.

## 1. Design diagnosis from V1 screenshots
Current experience: attractive industrial diagnostics, but the core 9x7 world appears as a small tile grid within a multi-pane admin/control interface; large settings and status elements compete with gameplay. Instructions explicitly reveal solutions and numeric thresholds. V2 moves from **operator's dashboard** to **a place the operator inhabits**. The HUD should hint; the environment should teach.

## 2. V2 design pillars
1. **World first:** near-full viewport game scene, large readable avatar/interactables and atmosphere. The player—not a settings card—is visual focus.
2. **Change the world:** opening the settings should look like hacking the game from inside. State changes appear immediately in the visible room.
3. **Surprise + clarity:** at least one striking visual response per puzzle, but objectives and collision stay understandable.
4. **Small story, strong delivery:** one short cinematic, one or two contextual narrative lines between rooms, a decisive ending.
5. **No broken builds:** change view layer before game rules; gate every phase with regression tests and one human playthrough.

## 3. Screen flow
`TITLE -> SKIPPABLE OPENING (20-25sec) -> ROOM 1 -> ROOM 2 -> ROOM 3 -> [OPTIONAL NEW ROOM 4] -> [OPTIONAL REMIX ROOM 5] -> EXISTING FINALE -> ENDING -> PLAY AGAIN`

The three original rooms and finale are the **minimum shippable V2**. New room 4 and remix room 5 are stretch goals only after cinematic + immersive UI are solid. Never delay submission solely to add them.

## 4. Story and opening, shot by shot
Style: in-engine black screens and small scene camera moves; terminal typography only as a *story accent*, never as the primary play UI. No external cutscene video, network assets, character voiceover or elaborate animation pipeline.

- **0–4s:** Black, system power-down audio/visual pulse. `BUILD 0.9.4 // SHUTDOWN COMPLETE`.
- **4–9s:** A dark chamber flashes into view. A tiny moving silhouette remains. `ERROR: ONE PROCESS STILL ACTIVE — OP-01`.
- **9–15s:** An impersonal system message: `CONTAINMENT IS FOR YOUR PROTECTION.` A distant door visibly locks.
- **15–22s:** A corrupted hint interrupts: `THEN CHANGE THE RULES.` Settings symbols flicker around the room; fade into player control.
- **22–25s:** First on-screen objective: `Find a way past the lock.` Show `Move: WASD / Arrows`, `Interact: E`, `Settings: Esc` briefly, then dissolve.

**Skip:** `Skip intro` button and Escape/Enter if safe; a skipped cinematic always enters Room 1 in the same initial state. Respect reduced motion, ensure subtitles/copy remains readable, no compulsory sound.

## 5. Main playable screen design
Desktop full-bleed 16:9 scene; room should dominate ~75–90% of the view. Use CSS grid / existing renderer and CSS/SVG layers to create environment depth without changing collision code. Avoid building an entirely new canvas engine.

Layout concept:
```
┌ EJECT  | CHAMBER 01: THE UNSEEN                SETTINGS [ESC] ┐
│                                                           │
│                  [ ATMOSPHERIC ROOM ]                     │
│                                                           │
│      wall      light          glyph?                       │
│                        OP-01                  EXIT         │
│                                                           │
│   Small environmental message / one-line objective        │
│                                                           │
└     [E] INTERACT (only in proximity)       [ESC] SETTINGS ┘
```

- No permanent settings sidebar, huge diagnostic table, coordinate axes, long system logs or visible puzzle formula on the play screen.
- Current objective is one sentence, not a solution. More detailed optional hints can appear progressively only after a pause/attempts.
- Avatar: recognizable silhouette/robot or lost process with 2–3 simple animation states; no expensive sprite pipeline.
- In-world props: strong silhouette, glowing outline on interactable proximity, sound/light cue (sound optional), brief door-open feedback, low-motion ambient particles/scanlines only if inexpensive.
- Keep V1's colors but introduce local light pools, floor texture, dimensional doors, subtle depth/shadows; retain crisp pixel-like edges without necessarily adopting full pixel art.

## 6. Settings as a game mechanic
- Open with Escape or a clearly visible Settings control; the UI is a game overlay/pause screen, NOT a permanent web application sidebar.
- Overlay shows the settings relevant to current/previous room; retain access to brightness, volume/mute and interact binding for finale.
- World stays visible behind/alongside overlay and visually updates **live** while slider is dragged.
- When menu is open, world movement is disabled, but visual effects still update. Closing returns appropriate focus.
- Keep controls readable independently of low brightness. Animate state changes only when useful.
- Mute and sound effects must obey user gesture/autoplay restrictions; puzzles must work silently.

## 7. Level design: minimum and stretches
### Original Room 1 — THE UNSEEN / Display
Player sees the outline of an exit and fragmented hint that something is hidden. Raising brightness reveals a luminous glyph in the room. Player approaches and interacts. **New presentation:** dark-to-light environmental reveal, shadow layers shift, glyph materializes in-world. Avoid showing `SET BRIGHTNESS >=70` as the main play objective; preserve threshold in rules and provide fair discovery through environmental clues and slider feedback.

### Original Room 2 — RESONANCE / Audio
A resonator sits visibly near a sealed door. Its ring responds to volume. The player must make it stable while unmuted and activate nearby. **New presentation:** resonator pulses and deforms according to volume/mute, with clear stable band in settings. No dependence on actual sound output.

### Original Room 3 — FORBIDDEN KEY / Controls
A terminal reads `INPUT E: REVOKED`, `INPUT K: AUTHORIZED` (or equivalent diegetic text). The player remaps Interact, returns to terminal and activates it. **New presentation:** key glyphs embedded into room machinery and feedback on attempted wrong bind.

### Optional Room 4 — THE FRAME / Window Mode (one new setting)
A new in-game option `Window Mode: Framed / Borderless` changes the *level's passage geometry*, not the real browser window. A room border blocks one passage in Framed mode and retracts in Borderless mode, making the exit accessible. Provide visible geometry changes and a clear clue such as `THE FRAME IS PART OF THE PRISON.` Simplify it to one toggle, one obstacle, one exit. Avoid adding real fullscreen APIs or a new rendering engine.
**Critical softlock rule:** if a toggle would invalidate the player's tile, reject that change with a clear message, keep the current mode, or relocate to a guaranteed safe adjacent tile with explanation. Unit test both modes and all affected positions. Only implement after mandatory phases are solid.

### Optional Room 5 — CROSS-TALK / Remix
Use two already-learned settings in sequence, not a new settings category. Example: reveal a receiver using brightness, then tune audio to energize a passage. Put the controls far enough apart to require actual movement. Give a new visual twist (power flows between two machines), not just a terminal with three green checkboxes. If time is tight, SKIP this room entirely.

### Existing Finale — SYSTEM EXIT
Keep the existing correctness gates and actual interact/exit behavior. Replace diagnostic checklist presentation with a physical, layered system gate whose 3 required locks react live. A single compact status indicator may explain an unmet requirement, but the finale should not look like submitting a web form.

## 8. Ending
Upon escape, the game frame pulls away/fades and OP-01 crosses an apparent application boundary. Short text: `PROCESS OP-01 // EXTERNALIZED` followed by `YOU CHANGED THE RULES.` Reveal `EJECT`, `PLAY AGAIN`, optionally `CREDITS / HOW IT WAS MADE`. No endless credits scene, no compulsory animation. Ending must be achievable and skippable/reduced-motion safe.

## 9. V2 implementation phases and gates
### V2-0 — Repo audit, safety snapshot, scoped change list (required)
Inspect actual code, tests, source, git status, preexisting V1 functionality. Commit/tag or branch the known-good V1 state without overwriting work. Identify exactly which components can be repurposed. Do not write new mechanics. Acceptance: stable baseline, precise implementation map, build/test status known.

### V2-1 — Immersive world and in-game settings overlay (required, biggest impact)
Replace desktop dashboard shell with a full-viewport room presentation and minimal HUD. Move settings into Escape/button overlay, retain live visual state. Maintain every existing puzzle and key behavior. Acceptance: world dominates; ESC opens/closes menu; sliders affect world live; all three puzzles + finale still complete; build/tests pass.

### V2-2 — Brief cinematic and narrative connective tissue (required)
Implement title/start -> optional skippable intro -> Room 1; concise chamber entry text and ending sequence. Acceptance: skip/restart reliable, no dead-end, reduced motion safe, V1 flows intact.

### V2-3 — World art direction and moment-to-moment feel (required)
Improve avatar, floors, doors, interact cues, environmental visual responses, transitions, audio if quick; remove overly explicit default HUD hints while preserving optional accessibility/help. Acceptance: scene looks like a game rather than a website, player never loses track of location or objective, no perceptible input lag.

### V2-4 — New Room 4 / Window Mode (OPTIONAL, only if ahead)
Add one mode toggle and one hand-authored level. Acceptance: deterministic movement, no softlock after any toggle, tests for both states, prior rooms/regression pass. If >90 minutes of implementation or debugging, revert phase and cut it.

### V2-5 — Remix Room 5 (OPTIONAL, last stretch)
Combine existing mechanics into one fresh short puzzle; no new subsystem. Acceptance: no duplicated confusing finale, accessible clues, test and manual fresh run. Skip if deadline buffer threatened.

### V2-6 — Story/sound/UX final pass, feature freeze (required)
Apply only small targeted edits, ensure title/cutscene/main/finale/ending coherent, make one complete start-to-finish playtest, capture screenshot-worthy moments. At freeze: no new features or levels. Then independent read-only review, repair P0/P1, then execute original V1 Stage 6 release prompt.

## 10. Time budget (India, Nov 7–8, 2026)
Deadline confirmed: Nov 8, **09:30 IST**. At 17:31 IST on Nov 7, roughly 16 hours remain; user expects a ~1-hour break.
- ~18:30–19:00: V2-0 audit and safety snapshot
- ~19:00–21:30: V2-1 immersive UI and overlay
- ~21:30–23:00: V2-2 cinematic/story
- ~23:00–01:00: V2-3 visual feel
- ~01:00–03:00: Optional V2-4; STOP early if anything breaks
- ~03:00–04:00: Optional V2-5 only if safely ahead
- ~04:00–06:00: V2-6, full playtest, freeze
- **06:00 IST**: hard stop on features
- 06:00–08:00: independent review, critical repairs, original Stage 6, deploy, Devpost artifacts
- **08:00 IST**: target submitted with working links, at least 90min safety buffer

This is a schedule of allocations, not a promise of how long an AI action will take. Cut optional rooms first, then nonessential audio/animation. NEVER cut release and submission time.

## 11. Game design quality checklist
- Can a stranger understand how to move, interact and change settings in 20 seconds?
- Can they perceive a physical world and a protagonist, rather than a dashboard form?
- Does adjusting each setting produce an instant visual transformation in the world?
- Are clues discoverable without spelling out full solutions in the persistent UI?
- Are interactions responsive; is proximity highlighted; are doors legible as doors?
- Can all stages be solved from a cold start without outside instructions?
- Can a player escape if they adjust settings unexpectedly at any point?
- Is the intro skippable? Is audio opt-in? Does reduced motion work?
- Does every completion route lead to the final screen and allow restart?
- Is this fun to watch in a 45–60-second judging video?

## 12. Release protocol
Do NOT run V1 Stage 6 until feature freeze and read-only review. Then run full build/test/browser checks, verify hosted URL in private mode, deploy, record 45–60 sec demo showing intro, brightness reveal, audio change, key remapping, finale, and make Devpost submission with live URL, code, write-up, screenshots, credits, and accurate theme/AI disclosures. If submission must use itch.io, supply working playable build and access instructions. Confirm submission status, not just clicking draft/save.
