# EJECT: Settings Are the Dungeon

**Pitch:** *The only way out is to change the rules.*  
Built for **WolfJam 2026** — a 3–5 minute top-down diagnostic puzzle-adventure trapped inside a corrupted hardware calibration menu, where the system settings panel directly alters the physical rules of each room.

---

## Concept & Gameplay Arc

Operator **OP-01** is locked inside a faulted firmware build (`REV 04.9`). Standard traversal cannot open the containment gates. Instead, open the live **System Settings** overlay with **Escape** or the **Settings** button to rewire the dungeon environment in real time. The chamber fills the play screen; settings pause movement without pausing visual updates:

1. **Sector 01 — DISPLAY / THE UNSEEN (`OPTICAL CALIBRATION BAY`)**  
   The chamber starts at `20%` brightness in low-gain fog. Moving reveals local surroundings, while raising **Brightness** to `>= 70%` reveals a hidden optical glyph at `(06, 01)`. Stand adjacent to the glyph and press **Interact** (`E` initially) to unlock the sector exit.
2. **Sector 02 — AUDIO / RESONANCE (`ACOUSTIC RESONANCE BAY`)**  
   A resonance lock responds to the console's acoustic bus. Switch **Mute: OFF** and tune **Volume** into the `55%–75%` inclusive stable band (`STABLE` on the live meter), stand adjacent to the resonator at `(04, 02)`, and interact to disengage the gate.
3. **Sector 03 — CONTROLS / KEYBOUND (`KEYBIND AUTHORIZATION BAY`)**  
   The terminal rejects the default `E` key (`E: REVOKED / K: AUTHORIZED`). Rebind **Interact Key Binding** from `E` to `K`, stand adjacent to the terminal at `(05, 02)`, and press `K` (or click **Interact [K]**) to authorize the exit.
4. **Sector 04 — SYSTEM EXIT (`CONTAINMENT EJECT GATE`)**  
   A final three-part interlock requires all three completed sector flags **plus** live valid settings (`Brightness >= 70%`, `Volume 55–75%` unmuted, and `Interact Key = K`). Modifying any setting out of range dynamically re-locks the escape gate and highlights the specific unmet prerequisite until restored.

---

## Controls & Accessibility

- **Move:** `WASD`, `Arrow Keys`, or the on-screen directional buttons (`← ↑ ↓ →`)
- **Interact:** Current bound key (`E` initially; `F` or `K` when rebound) or the on-screen **Interact [`Key`]** button
- **Settings:** `Escape` or the visible **Settings** button opens the overlay; `Escape` or **Resume** closes it and focuses the room. Native sliders/select support pointer and keyboard (`Tab`, `Arrow Keys`, `Enter`/`Space`). Game movement and interaction are blocked while settings are open or a control has keyboard focus.
- **Restart / Help:** Inside Settings, use **Restart**, **Boot Screen**, or expand **Controls & field notes** for detailed feedback.
- **Audio & Motion:** Optional procedural Web Audio console tones are strictly user-gesture gated, obey the in-game **Mute** and **Volume** settings (`Muted` by default), and are never required to solve any puzzle. Animations respect `prefers-reduced-motion`.

---

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Plain CSS (custom properties, CSS Grid 9×7 tile matrix, responsive desktop `1280×720` and mobile `390px` layouts)
- **State & Logic:** Pure TypeScript rule predicates (`src/game/rules.ts`) + deterministic React `useReducer` (`src/game/gameReducer.ts`)
- **Testing:** Vitest (`src/game/rules.test.ts`)
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

The browser smoke uses Chrome's DevTools protocol with no added dependencies. On macOS it finds the standard Chrome installation; elsewhere it uses `google-chrome`. Override with `CHROME_PATH=/path/to/chrome`. Set `SCREENSHOT_DIR=/tmp/eject-smoke` to save desktop, live-settings, finale and mobile evidence. It checks a cold-start escape/replay, overlay focus/input isolation, keyboard settings, live gate changes and viewport overflow.

---

## Asset Rights & AI Assistance Disclosure

- **Assets & Visuals:** All layout code, CSS styling, geometric tile indicators, inline SVG favicon, and optional Web Audio oscillator tones were created specifically for this project. Typography uses local/system font stacks (`Iowan Old Style` / `Palatino` serif, system sans-serif, and `SFMono-Regular` / `Menlo` / `Consolas` monospace) with zero external network dependencies.
- **AI Assistance Disclosure:** Built using an incremental human-supervised agent workflow (planning, staged implementation, automated unit/browser verification, and read-only code review) in accordance with WolfJam 2026 disclosure guidelines.
