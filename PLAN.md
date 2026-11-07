# EJECT — Hackathon game plan

**Project:** EJECT: Settings Are the Dungeon  
**Pitch:** The only way out is to change the rules.  
**Event:** WolfJam 2026  
**Deadline:** 2026-11-08 09:30 IST (2026-11-07 23:00 EST)  
**Internal hard stop for feature development:** ~3 hours before submission deadline  
**Target submission buffer:** at least 90 minutes  
**Theme announced at kickoff:** `UNCONFIRMED — check official Discord and update this line before locking narrative/visual story`  
**Working mode:** one builder agent, one independent reviewer, sequential milestone gates.

## 1. One-sentence product specification
A browser-based, top-down mini-adventure trapped inside a corrupted game menu, in which a settings panel visibly and mechanically changes the puzzle rooms.

## 2. Player experience
1. **Opening (10–15 seconds):** EJECT boot screen, one line of narrative, **Start** and **How to play**. Show movement (WASD/arrows), interaction (E initially), and settings at right.
2. **Room 1 — DISPLAY / THE UNSEEN (45–60 sec):** World is partly obscured at initial brightness 20. Moving reveals local surroundings; changing brightness to >=70 reveals a glyph near an otherwise locked exit. Walk adjacent to the glyph, press the current interaction key (E by default), see the lock disengage, and walk onto the exit tile. Keep important walls and controls readable at any brightness.
3. **Room 2 — AUDIO / RESONANCE (45–60 sec):** A locked resonance gate responds to the in-game audio controls. A clear frequency/level clue indicates the stable range. Set volume to **55–75 inclusive**, switch **Mute OFF**, stand next to the resonator, and interact to activate it; visual meter shows `TOO LOW`, `STABLE`, or `TOO HIGH`, and `MUTED` takes precedence. Walk to the exit.
4. **Room 3 — CONTROLS / KEYBOUND (45–60 sec):** A terminal has rejected the default E key. A wall/console message communicates `E: REVOKED / K: AUTHORIZED`. Remap **Interact** from E to K, approach the terminal and press K, then enter exit.
5. **Finale — SYSTEM EXIT (20–40 sec):** A final gate shows three live status indicators. Gate opens only when room flags are complete, brightness >=70, volume 55–75 and unmuted, and interaction key K. If values were changed since previous rooms, status explains the issue. Step onto the final exit for a short tasteful ending screen with **Play again**.

### Non-negotiable feel
- Settings change the environment immediately, not merely text labels.
- Every puzzle has visual feedback; never rely on sound alone or on guessing numeric thresholds.
- Player moves through a real small room with collision and adjacency interactions.
- Short, deliberate feedback beats 100 effects.
- One coherent game, not four unrelated minigames.

## 3. UX and art direction
- Layout at desktop width: 2/3 dungeon viewport on left; 1/3 always-accessible settings console on right. Narrow screens stack viewport and settings; don't obstruct game.
- 9×7 or similarly compact tile-grid rooms. CSS Grid with pure tile data. No physics engine, canvas requirement, sprite atlas, or asset pipeline.
- Reference mood: abandoned diagnostic software, paper labels on near-black metal, sage-success indicators and one signal-orange warning. The UX should feel like a real game interface, NOT a SaaS admin dashboard.
- Typeface: system serif/sans + system monospace combination; no remote dependency needed. Use text hierarchy, alignment, negative space, and restrained texture.
- Affordances: clear player marker, walls, exits, consoles, and 'press key' contextual hint when adjacent.
- Avoid visually hiding controls due to the brightness mechanic; modify only world fog, not whole page.
- Audio feedback via small generated Web Audio tones is an optional polish step, never the core puzzle's only signal.

## 4. Technical architecture
**Tools:** npm, Vite, React, TypeScript, plain CSS, Vitest for tiny pure-logic tests, Git, browser devtools, static hosting (e.g., Vercel or Netlify).  
**No** backend, database, routing, Tailwind, Phaser, state library, third-party UI kit, or remote runtime APIs.

Conceptual data:
```ts
type RoomId = 'display' | 'audio' | 'controls' | 'finale';
type BindKey = 'e' | 'f' | 'k';
type Settings = { brightness: number; volume: number; muted: boolean; interactKey: BindKey };
type Progress = { glyphActivated: boolean; resonatorActivated: boolean; terminalActivated: boolean };
type Phase = 'intro' | 'playing' | 'won';
type GameState = {
  phase: Phase;
  room: RoomId;
  position: { x: number; y: number };
  settings: Settings;
  progress: Progress;
  feedback: string;
};
```
Reducer actions should cover start, move, setting change, interact, room advance, restart. Keep pure rule helpers (`canMove`, `isAdjacent`, `isFinalGateReady`, `getAudioStatus`, `isGlyphVisible`) separate from rendering. `levels.ts` holds static maps and coordinates. The renderer should not be the authority for puzzle correctness.

### Input safety
- Support WASD and arrows for movement and chosen interaction key near a usable object.
- Avoid applying global movement keys when a slider/select/button has focus; ensure `K` works when the game view is focused.
- Include an on-screen **Interact** button in the game viewport to accommodate pointer-only users; label it with the current binding.
- Default settings: brightness=20, volume=20, muted=true, interactKey='e'. Don't make muted audio produce sounds.
- Do not block Escape (browser/system behavior); don't bind essential mechanics to Escape.

### Core puzzle feedback
- Glyph should be discoverable and reveal legibly at brightness >=70.
- Audio indicator shows a bounded stable zone before the player interacts. No trial-and-error at unexplained numbers.
- Key remapping should be explicit and obvious. Show live binding on the HUD.
- Final gate lists current unmet conditions in short diegetic system labels.

## 5. Milestone plan and hard acceptance gates

### Stage 0 — Eligibility, theme, repo (15–30m)
**Manual:** Confirm Devpost registration, remote entry, announced theme, event terms, and ability to submit. Create repository after event start. Record asset sources and AI usage honestly. Put AGENTS.md and PLAN.md at root.

### Stage 1 — Scaffold + shell (45–75m)
**Builder:** Create minimal Vite/React/TS app, CSS visual shell, intro/start state, empty but coherent world viewport, settings controls with labels, working scripts and one tiny pure-rule test. **No playable puzzle yet.**
**Gate:** Dev server and build work, desktop looks intentional, no TS errors; settings inputs update values visibly. Reviewer spot-checks structure.

### Stage 2 — Movement + Room 1 (90–120m)
**Builder:** Implement pure tile/collision rules, reducer, keyboard movement, contextual interaction, fog of visibility + brightness threshold, glyph, unlock, and room exit. Add tests for collision/visibility and interaction gating. **Only Room 1 needs to work.**
**Gate:** Start > walk > reveal glyph > activate > exit transitions to a placeholder Room 2. Before moving on, play the full flow manually without developer tools.

### Stage 3 — Room 2 / Audio (60–90m)
**Builder:** Create second map/resonator and stable-range meter. Implement volume/mute rule, actionable feedback, unlock and level transition. Add targeted tests for inclusive bounds and mute behavior. No mandatory sound playback.
**Gate:** Test 54, 55, 75, 76 and muted cases; only 55–75 unmuted works; Room 1 still passes.

### Stage 4 — Room 3 + Finale (60–90m)
**Builder:** Key remap, terminal interaction, completed status indicator gate, won screen, restart. Add tests for key change and final gate rules.
**Gate:** A completely fresh player can finish game; keyboard and on-screen interact work; room flags cannot be skipped. **This is the feature-complete checkpoint.** Run independent review here.

### Stage 5 — Polish, not features (60–120m)
**Builder:** Improve transitions, typography, story text, feedback, accessibility labels, mobile layout; optional lightweight Web Audio with mute obeyed; `prefers-reduced-motion`. No new mechanics or dependencies. Add a small `README.md` explaining concept, controls, installation, build and asset/AI disclosures.
**Gate:** Main flow feels intuitive, no gratuitous visual effects, a new tester can finish without guidance.

### Stage 6 — Release / submission (60–90m plus buffer)
**Builder + human:** Run `npm run build`, tests, smoke test deployed URL in private browser, capture screenshots, record a 60–90 sec gameplay clip, publish code on GitHub and game on a static host/itch.io as appropriate, submit Devpost **before** cutoff.
**Gate:** URL works without local files or authentication; judges have instructions; Devpost submission confirmation is visible. No last-minute feature work.

## 6. Timeline & kill-switches
- Aim to reach Stage 2 before major visual polish. If Stage 2 is not fun, revise Room 1 before building more rooms.
- If less than ~7 hours remain, **freeze new mechanics**, prioritize a working 3-room arc, deployment and demo.
- If less than ~4 hours remain, stop polish; complete gameplay, document and deploy.
- If less than ~2 hours remain, ship the best working build **immediately**; prioritize submission over additional tests/assets.
- If truly behind, omit generated audio, cosmetic transitions and optional mobile D-pad. Never omit a playable ending, deployment or submission.

## 7. Review workflow
After each stage, builder gives a handoff report (changed files, acceptance conditions, commands/tests, manual playtest, known issues). Reviewer reads the actual diff, not just the report. Quick reviews can use Gemini in another session; once GPT-6.1 Sol is available, use it for a deep read-only review at feature-complete Stage 4 and final release candidate Stage 6. Fix P0/P1 before moving on; defer P2 unless tiny and safe.

## 8. Minimal test matrix
- Fresh boot, start, restart, final completion.
- Movement blocked by walls and screen boundaries.
- No inability to reach interactive objects or exit due to map coordinates.
- Brightness 69 does not reveal glyph, 70 does; glyph cannot activate from far away.
- Audio 54 and 76 fail; 55 and 75 succeed if unmuted; muted always fails.
- Wrong bound key fails to activate terminal; K works when set and adjacent.
- In finale, every correct condition contributes; breaking one live setting re-locks gate; restoring it reopens gate.
- Range inputs respond to keyboard without moving avatar.
- No fatal console errors or missing assets in production build.
- Desktop 1280×720 and mobile-width 390px are usable.
- First-time player understands how to proceed; no external explanation required.

## 9. Submission copy outline
**Title:** EJECT: Settings Are the Dungeon  
**One-line description:** Escape a broken game by turning its options into your powers.  
**Built with:** React, TypeScript, Vite, CSS (and optional Web Audio).  
**Mechanics:** Brightness reveals, volume resonates, key remapping rewrites an interaction, final gate unifies them.  
**Devpost fields:** demo URL, GitHub source, short demo video, screenshots, what inspired us, how it works, challenges, accomplishments, lessons, future improvements; explicitly note AI assistance and credited third-party assets as applicable.  
**Theme alignment:** Fill honestly once the actual kickoff theme is verified, not by inventing a theme.

## 10. Definition of done
An independent judge can open a public URL, play from opening to win screen in roughly 3–5 minutes, see the settings alter the dungeon, and understand the idea without a walkthrough. Build passes; README and Devpost links are correct; submission is confirmed before deadline.
