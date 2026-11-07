# EJECT V3 — Short Story and Dialogue Script

**Tone:** understated, a little lonely but not melodramatic. Lines must sound like a person who stayed up with their favorite old game, not a machine advertising the plot. Avoid fake technical jargon. All text skippable/advanceable. Target opening 35–45 seconds if watched, ~10 seconds if clicked through; never force 30 seconds of waiting.

## Screen 0: Interactive title image
A small pixel-inspired **bedroom at night**: rain window, unmade bed, boy facing a warm CRT. The CRT naturally carries the EJECT logo and 2 choices: `BEGIN LAST SESSION` / `HOW TO PLAY`. An on-screen message reads `ONLINE 1` and `SERVER CLOSURE IN 00:00:30`. No technical register dashboard.

## Opening storyboard, five scene beats
**Beat A — The final night (0–9s)**
Camera stays in bedroom; brief rain and monitor hum. Screen: `PLAYERS ONLINE: 1`. Boy (subtitles): **'I never did beat that last level.'** Then **'Guess tonight's my last chance.'** He raises controller.

**Beat B — Too late (9–16s)**
On CRT the timer jumps to zero during a short button press. TV flashes `SESSION TERMINATED`. Boy: **'Wait—no. I was right there.'** The CRT turns off, leaving one tiny independently moving cursor.

**Beat C — The pull (16–23s)**
CRT light spills into room. Controller falls. Boy's silhouette breaks into a few coarse square fragments that converge into the glass (CSS transforms/SVG, NOT full animation system). Flash/silence. A subtle callback color links his shirt/eyes to avatar OP-01.

**Beat D — New body (23–34s)**
Now the existing dungeon. OP-01 is alone with a circle of light. Boy: **'This isn't my room.'** SYSTEM: `UNEXPECTED PLAYER DETECTED. CONTAINMENT ACTIVE.` Boy: **'I'm... inside the game?'** Door locks in a short animation.

**Beat E — Agency (34–43s)**
SYSTEM: `VISIBILITY PROTOCOL INITIALIZED.` Patch Deck indicator flickers on. Boy: **'That's the settings menu...'** Then: **'Maybe I can change what it sees.'** Player has control immediately. Controls briefly and legibly show movement, interaction, and Patch Deck.

Implementation: no long text typing effects; 5 explicit story beats with Skip control always visible, advance on click/Enter, optionally `prefers-reduced-motion` shows still frames with text. Important: Escape while in intro SKIPS, but Escape during gameplay opens pause; prevent same key from doing both. No autoplay sound before initial click.

## Context dialogue and hints
Use 1 short opening line, optional hint after idle or failed interaction (max 2 lines), success response. Don't interrupt a moving player for noncritical text.

| Location | Enter / discover | Optional hint after hesitation | Success |
|---|---|---|---|
| 01 THE UNSEEN | 'I can barely see two steps ahead.' | 'Those markings only show when I raise the light.' | 'There you are.' |
| 02 RESONANCE | 'Something in here is listening.' | 'Not silent. Not deafening. Somewhere between.' | 'That's the frequency.' |
| 03 FORBIDDEN KEY | 'It doesn't recognize my input.' | 'The terminal says K. My controls say E.' | 'It listened.' |
| 04 THE FRAME | 'Even the border feels solid.' | 'What if the window wasn't a window?' | 'The room got bigger.' |
| 05 CROSS-TALK | 'One system is talking over the other.' | 'Reveal the receiver first. Then tune the signal.' | 'They can finally hear each other.' |
| 06 SYSTEM EXIT | 'It's still counting me as zero.' | 'The gate is reading my settings right now.' | 'Look again.' |

Hint trigger: explicitly click small `?` icon or, only if already easy to implement, after ~30-45s no progress. Prefer manual hint to timers if timers are risky. No precise numerical threshold on default HUD. Optional second-step hints may show practical detail if requested multiple times.

## Ending (8–12s)
System gate flickers: `PLAYERS ONLINE: 0`.
Boy: **'Look again.'**
The world goes from a pool of light to visible, and status changes to `PLAYERS ONLINE: 1`. Gate dissolves and OP-01 steps beyond the game frame. Cut to dawn bedroom, empty chair, controller on floor; monitor comes alive very briefly: `THANK YOU FOR PLAYING.` The boy is not explicitly shown returning if the artwork would confuse; optionally a soft off-screen laugh or hand picks controller. End screen `EJECT // THE LAST PLAYER`, `PLAY AGAIN`, `CREDITS`.

Story logic: the boy was the last connected player when the online service ended; his presence persisted inside the game. Escape restores his ability to leave, but the physical world/game's status is deliberately ambiguous. Don't add an exposition dump explaining the metaphysics.
