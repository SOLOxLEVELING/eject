# EJECT: Settings Are the Dungeon

**Pitch:** *The only way out is to change the rules.*  
Built for **WolfJam 2026** — a short top-down diagnostic puzzle-adventure trapped inside a corrupted hardware calibration menu, where the system settings panel directly alters the physical rules of each room.

---

## Concept & Gameplay Arc

The game has shut down, but one rogue process—**OP-01**—remains. The containment system calls its prison protection. Standard traversal cannot open its gates. Instead, open the live **System Settings** overlay with **Escape** or the **Settings** button to rewire the dungeon environment in real time. The chamber fills the play screen; settings pause movement without pausing visual updates:

1. **Sector 01 — DISPLAY / THE UNSEEN (`OPTICAL CALIBRATION BAY`)**  
   The chamber starts at `20%` brightness in low-gain fog. Moving reveals local surroundings, while raising **Brightness** to `>= 70%` reveals a hidden optical glyph at `(06, 01)`. Stand adjacent to the glyph and press **Interact** (`E` initially) to unlock the sector exit.
2. **Sector 02 — AUDIO / RESONANCE (`ACOUSTIC RESONANCE BAY`)**  
   A resonance lock responds to the console's acoustic bus. Switch **Mute: OFF** and tune **Volume** into the `55%–75%` inclusive stable band (`STABLE` on the live meter), stand adjacent to the resonator at `(04, 02)`, and interact to disengage the gate.
3. **Sector 03 — CONTROLS / KEYBOUND (`KEYBIND AUTHORIZATION BAY`)**  
   The terminal rejects the default `E` key (`E: REVOKED / K: AUTHORIZED`). Rebind **Interact Key Binding** from `E` to `K`, stand adjacent to the terminal at `(05, 02)`, and press `K` (or click **Interact [K]**) to authorize the exit.
4. **Sector 04 — THE FRAME / Window Mode**
   `THE FRAME IS PART OF THE PRISON.` A single containment crossbar blocks the middle passage. The new **Window Mode** setting appears here: **Framed** seals it; **Borderless** mechanically retracts it and releases the exit. This affects only the game's geometry, never browser windows or fullscreen. Restoring Framed is rejected while OP-01 occupies or has crossed the barrier; return to the entry side first. No relocation or additional progress flag is needed.
5. **Sector 05 — CROSS-TALK**
   `CATCH THE LIGHT. CARRY THE SIGNAL.` Light reveals a lens at `(02, 01)`. Activate it to latch an optical carrier and energize its physical cable to a separate acoustic relay at `(06, 05)`. Walk to that relay and activate it with the familiar stable, unmuted audio signal to power the exit. The steps must happen in order and remain latched if settings change afterward. This remix adds no setting category and does not replace or change the original three finale checks.
6. **Sector 06 — SYSTEM EXIT (`CONTAINMENT EJECT GATE`)**
   A final three-part interlock requires all three completed sector flags **plus** live valid settings (`Brightness >= 70%`, `Volume 55–75%` unmuted, and `Interact Key = K`). Modifying any setting out of range dynamically re-locks the escape gate and highlights the specific unmet prerequisite until restored.

---

## Controls & Accessibility

- **Title / Opening:** **BEGIN LAST SESSION** starts in an original illustrated night bedroom: the last player is pulled through his CRT and wakes as OP-01. Five story beats take 43 seconds if watched; click the scene, **Continue**, or `Enter` to advance quickly. **Skip intro** or `Escape` enters the same fresh first chamber immediately. **How to Play** opens field notes on the title. Reduced motion shows still scenes and readable dialogue; the opening is silent.
- **Move:** `WASD`, `Arrow Keys`, or the on-screen directional buttons (`← ↑ ↓ →`)
- **Interact:** Current bound key (`E` initially; `F` or `K` when rebound) or the on-screen **Interact [`Key`]** button
- **Settings:** `Escape` or the visible **Settings** button opens the overlay; `Escape` or **Resume** closes it and focuses the room. Native sliders/select support pointer and keyboard (`Tab`, `Arrow Keys`, `Enter`/`Space`). Game movement and interaction are blocked while settings are open or a control has keyboard focus.
- **Cross-Talk:** Use the current interact binding or pointer Interact at each machine. The lens and relay have separate proximity cues; follow the visible cable. Help in Settings offers the full sequence if needed. Actual sound output is never necessary.
- **Window Mode:** Available in The Frame and retained in the finale. Choose Framed / Borderless with pointer or keyboard. It is **not** a fourth finale prerequisite. Rejected closure keeps OP-01 and the setting unchanged, with visible feedback beside the control.
- **Restart / Help:** **Restart**, **Boot Screen** and the ending's **Play again** return to the title with settings/progress reset. Start launches a fresh, skippable opening. Expand **Help & field notes** inside Settings for controls, story recap and detailed feedback.
- **Story cues / Ending:** First-chamber controls appear briefly; two later chamber notes are dismissible and never pause movement. The escape scene lasts 1.8 seconds, with **Skip ending** / `Escape` and **Play again** available immediately. Reduced motion shows the completed ending without movement.
- **World feedback:** OP-01 has an original local SVG silhouette. Exposed bulkheads, recessed floors and sliding door leaves preserve the collision grid. Nearby machines and doors are outlined; the optical signal appears with light, the resonator changes shape for low/high/stable input and shows a mute slash, and the terminal displays its accepted key. State-change and room-entry animations are brief and disabled with reduced motion. Essential walls, props and controls stay readable at minimum brightness.
- **Audio & Motion:** Optional procedural Web Audio console tones are strictly user-gesture gated, obey the in-game **Mute** and **Volume** settings (`Muted` by default), and are never required to solve any puzzle. Animations respect `prefers-reduced-motion`.

---

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Plain CSS (custom properties, CSS Grid 9×7 tile matrix, responsive desktop `1280×720` and mobile `390px` layouts)
- **State & Logic:** Pure TypeScript rule predicates (`src/game/rules.ts`) + deterministic React `useReducer` (`src/game/gameReducer.ts`)
- **Testing:** Vitest (`src/game/rules.test.ts`, `src/game/frame.test.ts`, `src/game/crossTalk.test.ts`) includes full progression, both window modes, exhaustive frame-position closure safety and map reachability.
- **Zero External Bloat:** No backend, database, router, external game engine, or UI component library.

---

## Local Setup, Build & Tests

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run TypeScript check and production build
npm run build

# Run unit and progression tests
npm test -- --run

# Build and smoke-test the real browser UI (Node 22+ and Chrome required)
npm run test:browser
```

The browser smoke uses Chrome's DevTools protocol with no added dependencies. On macOS it finds the standard Chrome installation; elsewhere it uses `google-chrome`. Override with `CHROME_PATH=/path/to/chrome`. Set `SCREENSHOT_DIR=/tmp/eject-smoke` to save desktop, live-settings, finale and mobile evidence. It checks Cross-Talk's ordered two-machine interaction, optical reveal, latched progress, audio gating, cable feedback and mobile layout, plus The Frame's collision, live retraction, safe rejected closure, entry-side restoration, unchanged browser dimensions/fullscreen and the three-lock finale, plus glyph visibility/proximity, resonator states, terminal artwork, sliding doors and reduced-motion art, plus the full opening in real time, first-frame/mid-sequence/keyboard skips, timer cleanup, reduced motion, title resets, full escapes/replays, overlay focus/input isolation, keyboard settings, live gate changes and viewport overflow.

---

## Asset Rights & AI Assistance Disclosure

- **Assets & Visuals:** All layout code, CSS styling, OP-01 and machinery SVG artwork, geometric tile indicators, inline SVG favicon, and optional Web Audio oscillator tones were created specifically for this project. Typography uses local/system font stacks (`Iowan Old Style` / `Palatino` serif, system sans-serif, and `SFMono-Regular` / `Menlo` / `Consolas` monospace) with zero external network dependencies.
- **AI Assistance Disclosure:** Built using an incremental human-supervised agent workflow (planning, staged implementation, automated unit/browser verification, and read-only code review) in accordance with WolfJam 2026 disclosure guidelines.
