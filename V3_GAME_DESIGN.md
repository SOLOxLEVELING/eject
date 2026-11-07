# EJECT V3 — Game Design and Technical Specification

## North star
**Working title:** EJECT: The Last Player
**Tagline:** The last person to see a dying game becomes trapped inside it.
**Theme:** VISIBILITY. Not cosmetic: what the player can perceive changes the available actions and the geography of the world.
**Target play length:** 6–9 minutes including short skippable story (not an ambitious 20-minute campaign).
**Primary evaluator:** a judge seeing game for 45–90 seconds on an unfamiliar laptop with no developer explaining controls.

## V2 critique grounded in screenshots
- V2 has a large world and readable avatar. Good; keep this and the entire V2-5 playable flow.
- Title still looks like a structured app. Replace with a game scene, not a prettier landing-page form.
- At 20% brightness the entire grid is clearly visible. Brightness therefore reads as a hidden-object toggle. Fix via real world-space light/dark occlusion centered on player.
- Opening reveals a process but not a person or stake. Tell a quiet bedroom/last-player story, then turn the boy into OP-01.
- Settings interactions require opening/closing a menu repeatedly. Provide an efficient, always-on quick Patch Deck while retaining ESC pause for nonessential settings/help.
- 'Framed/Borderless' must visibly alter the game's in-world aperture and collision/path, not just a line in a menu.

## Visual identity
Two contrasting palettes; use crisp illustrated/pixel-inspired graphics but not full engine/tileset replacement.
- **Bedroom:** midnight indigo, warm amber CRT spill, desaturated furniture and rain; quiet and intimate.
- **Game world:** near-black graphite, cold blue-green, warm ivory for OP-01, controlled orange warning accents.
- Texture: silhouettes, tile depth/shadows, little mechanical motion; don't add 50 bloom/neon effects or tiny unreadable text.
- UI: stage is primary (>80% desktop viewport), slender top HUD, tiny Patch Deck near bottom edge, proximity prompts near character; dialogue box appears only when speaking. Keep fonts large enough at 1280x720.
- Character: boy in bedroom transforms into existing OP-01 sprite; use the same eye color / small motif to communicate identity without costly sprite sheets.

## Title/menu redesign
Render a single full-bleed **bedroom diorama**, not split columns or diagnostic registers. TV/CRT at scene focal point with game title on glass; subtle rain/CRT scanline/small player animation. Menu actions anchored naturally near TV: `BEGIN LAST SESSION`, `HOW TO PLAY`, `SOUND ON/OFF`; a small `ONLINE: 1` / `SHUTDOWN 00:00:30` readout is a story object on the CRT, not an admin panel. Skip Intro belongs during intro, not title. No web-app-style cards, nav links, dashboard copy.

## Input and quick settings
- WASD/arrows movement; current interact key E/F/K from existing logic, always shown near prop.
- **Patch Deck** is a compact in-game instrument HUD, e.g. lower-right metallic strip. Always available while playing; brightness and volume have small visible sliders/dials for direct use, mute one toggle. A small expand button exposes Key Binding and Frame Mode on demand. Closing optional, no full-page dim overlay.
- `Q` can expand/collapse Patch Deck (if no conflict); `Esc` is pause/help/settings, NOT required for frequent slider use. Don't intercept Tab. Avoid excessive new hotkeys if focus complexity increases.
- Dragging/keyboard-adjusting a slider updates world *live* while playfield stays visible. Character movement is suppressed when an input is focused. Returning focus to playfield is predictable.
- Native slider keyboard support retained, controls have labels; color is not the only state indicator.
- Cutscene controls use click/Enter to advance dialogue and a distinct Skip button; Escape can skip there but is pause in gameplay. Prevent single keydown propagating to next phase.

## Core visibility mechanic: actual spatial darkness
Current screenshot at ~20% is too readable. Implement a visual darkness layer **only above the world and beneath world HUD/dialogue/settings**. Do NOT dim menus or browser.
- 0–25 brightness: surroundings outside 1–2 tiles of player are almost entirely black (target opacity 0.90–0.97), with nearby tiles and avatar illuminated by small warm/neutral spotlight; faint exit beacon for orientation (optional).
- 26–69 brightness: field of view increases smoothly and the room emerges; hidden glyph is still NOT interactable until existing >=70 rule.
- 70–100 brightness: most room clear, source geometry and glyph both visible; 100% nearly unrestricted visibility.
- Player-center is derived from existing map coordinates and is synchronized with grid movement, including transitions. Use CSS layer with radial-gradient / mask-image where feasible; a single overlay with pointer-events:none; no lighting engine or new dependency.
- Light cone/radius changes with player coordinate, not fixed at center of viewport. At edges, dark outside remains; no camera/raycasting needed.
- No hiding walls directly adjacent to player. Player marker, nearby object prompt and UI stay legible. The darkness must make exploration interesting, not become an accessibility wall.
- **Acceptance visual proof:** take same-room, same-player screenshots at brightness 20 and 80. A person must instantly identify which is dark, while at 20 they still see the avatar and immediately surrounding tiles. No difference limited only to a glyph icon.
- Gameplay: old brightness >=70 glyph rule stays; high brightness should create a striking reveal animation that finishes quickly. Optional low-cost environmental foreshadowing (soft marks) at medium brightness. No new enemy AI/stealth mechanics.

## 'Window Mode' must matter
Make setting `Framed` vs `Borderless` change actual **in-game field aperture** and traversability in the existing THE FRAME room.
- `Framed`: visible playable stage is mechanically constricted by internal frame/shutter bars. Distinct physical boundary at designated passage blocks movement.
- `Borderless`: frame bars slide/retract, stage view visibly expands and reveals space previously concealed; the same path becomes traversable due to existing/updated deterministic map rule.
- This must be obvious at the instant of toggle, not only label/border color or a single status message. Do not resize real browser window or invoke browser fullscreen APIs.
- Animate 200–350ms, reduced motion instantaneous. If switching back would trap the player or replace their occupied tile with a wall, prevent it with a short 'FRAME OCCUPIED' message or safe guarded transition.
- Check both CSS representation and reducer collision share one source of truth. Tests for positions, toggles, passage, return and restart.
- If V2-5 implementation already includes geometry change, *enhance visual feedback only* rather than rewriting a sound rule.

## Existing rooms, V3 upgrades
1. **THE UNSEEN:** visibility itself becomes the puzzle. Player explores under local spotlight, discovers glyph when raising brightness. Environment yields visual evidence; HUD doesn't print exact numeric threshold.
2. **RESONANCE:** audio setting visually changes physical wave rings/oscilloscope. Mute clearly clamps ring motion, stable band visibly aligns. Audio not required.
3. **FORBIDDEN KEY:** physical terminal rejects E and points to K; returning to Patch Deck to rebind feels like hacking the world, not editing a form.
4. **THE FRAME:** in-game scene aperture expands; mechanical passage opens. Don't resize browser.
5. **CROSS-TALK:** already built; leave logic stable. Visual connective trail between glyph and resonator, with dialogue clue if stuck; optional creative improvement ONLY if safe: a faint sensor responds differently to lighting. No extra gate or new AI.
6. **SYSTEM EXIT:** physical gate reacts to live settings, opens visually and delivers ending. One short line links survival to being noticed; no checklist-as-web-form.

## Hint system — dialogue as game design
Use a small dialogue bubble/portrait line (boy/OP-01 and SYSTEM distinct speakers) on first encounter / failed attempt / after repeated delay. Avoid interrupting movement with long boxes. First exposure gives metaphor, after ~30-45 seconds or 2 unsuccessful tries gives concrete nudge. On-screen optional `H` for hint if easy (or `?` button); no auto-spam. See V3_STORYBOARD.md for exact text.
- Room 1 clue: 'There are markings in the dark. Maybe this room isn't bright enough to show them.'
- Room 2: 'That mechanism reacts to sound, not loudness alone.'
- Room 3: 'The terminal keeps showing a K. My controls still say E.'
- Room 4: 'The frame is holding the walls in place.'
- Room 5: 'I think I have to uncover it before I can tune it.'
- Finale: 'It's checking all the changes I made. Right now, not just before.'
No solution spoilers on normal HUD; hints can be progressively explicit when requested.

## Audio / animation
3 small self-authored Web Audio cues suffice: a subtle CRT startup after click; a restrained interact/reveal chime; a low-frequency shutdown pulse. Mute is honored. Do not add streaming music/assets or cutscene voiceover. Respect reduced motion and audio policies.

## Emotional resolution
At the finale, system claims `PLAYERS ONLINE: 0`, protagonist answers **'Look again.'** The system finds `PLAYERS ONLINE: 1`, barrier dissolves, visual cut to dawn bedroom. Monitor is dark except a small `THANK YOU FOR PLAYING.` The ending is 8–12 seconds and skippable; then `PLAY AGAIN` and credits/help.

## Anti-bloat scope
**Required:** lighting feel, game-like title/story, Patch Deck friction removal, reliable full playthrough, accessible hints and ending.
**Conditional:** Frame Mode visual+collision truth if time and baseline stable.
**Cut immediately:** new rooms, enemies, boss, dialogue choice tree, animation framework, complete sprite atlas redesign, save system, achievements, voice acting, model/API calls, procedural generation, backend, networking.

## Done criteria
A fresh tester enters through an obvious illustrated title, sees a coherent 30–45 second story or skips, navigates real spatial darkness with spotlight, changes live settings without repetitive modal loops, finishes six current rooms, sees story payoff, can restart, and can see the theme VISIBILITY throughout. Build/tests pass and a deployed link/demo exist before submission.
