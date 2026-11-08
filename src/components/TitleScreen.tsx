import { useEffect, useRef, useState } from 'react';
import { BedroomScene } from './BedroomScene';

export function TitleScreen({ onStart, soundEnabled, onToggleSound }: {
  onStart: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}) {
  const [showManual, setShowManual] = useState(false);
  const startRef = useRef<HTMLButtonElement | null>(null);
  const helpRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => startRef.current?.focus({ preventScroll: true }), []);

  return (
    <main className="last-session-title" data-phase="intro" aria-labelledby="boot-title">
      <BedroomScene>
        <p className="crt-online">PLAYERS ONLINE: 1</p>
        <h1 id="boot-title">EJECT</h1>
        <p className="crt-subtitle">The Last Player</p>
        <div className="crt-menu">
          <button ref={startRef} type="button" onClick={onStart} data-testid="start-btn">BEGIN LAST SESSION</button>
          <button ref={helpRef} type="button" aria-expanded={showManual} aria-controls="title-help" onClick={() => setShowManual(!showManual)}>
            {showManual ? 'CLOSE FIELD NOTES' : 'HOW TO PLAY'}
          </button>
          <button type="button" aria-pressed={soundEnabled} onClick={onToggleSound} data-testid="bedroom-sound-btn">
            {soundEnabled ? 'CRT SOUND: ON' : 'ENABLE CRT SOUND'}
          </button>
        </div>
        <p className="crt-shutdown">SERVER CLOSURE IN 00:00:30</p>
      </BedroomScene>
      <p className="title-caption">One room. One screen. One player left.</p>
      <section id="title-help" hidden={!showManual} className="title-field-notes" aria-label="How to play">
        <h2>Before the screen goes dark</h2>
        <p><kbd>WASD / Arrows</kbd> — Move. <kbd>E</kbd> — Interact beside a machine. Direction and Interact buttons work too.</p>
        <p><kbd>Esc / Settings</kbd> — Change the world’s light, sound and controls. Only the game changes; movement pauses while settings are open.</p>
        <p>Opening story: click or Enter to advance. Skip intro or Escape to skip. CRT game sound is optional. Inside the game, sound starts muted; every puzzle works silently.</p>
        <button type="button" className="console-btn" onClick={() => {
          setShowManual(false);
          helpRef.current?.focus({ preventScroll: true });
        }}>Close notes</button>
      </section>
    </main>
  );
}
