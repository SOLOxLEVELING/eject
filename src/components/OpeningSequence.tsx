import { useEffect, useRef, useState } from 'react';
import { getRoomBlueprint } from '../game/levels';
import type { GameState } from '../game/types';
import { WorldGrid } from './WorldGrid';

const SHOTS = [
  { id: 'shutdown', text: 'SHUTDOWN COMPLETE' },
  { id: 'process', text: 'ONE PROCESS REMAINS — OP-01' },
  { id: 'containment', text: 'CONTAINMENT IS FOR YOUR PROTECTION.' },
  { id: 'rules', text: 'THEN CHANGE THE RULES.' },
] as const;

type OpeningSequenceProps = {
  state: GameState;
  onComplete: () => void;
};

export function OpeningSequence({ state, onComplete }: OpeningSequenceProps) {
  const [shot, setShot] = useState(0);
  const skipRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    skipRef.current?.focus({ preventScroll: true });
    const timers = [
      window.setTimeout(() => setShot(1), 4000),
      window.setTimeout(() => setShot(2), 9000),
      window.setTimeout(() => setShot(3), 15000),
      window.setTimeout(onComplete, 22000),
    ];
    function skip(event: KeyboardEvent) {
      if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Escape' || event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) onComplete();
      }
    }
    window.addEventListener('keydown', skip, true);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('keydown', skip, true);
    };
  }, [onComplete]);

  return (
    <main
      className="opening-sequence"
      data-phase="cinematic"
      data-shot={SHOTS[shot].id}
      data-door-locked={shot >= 2}
      aria-label="Opening story"
    >
      <div className="opening-world" aria-hidden="true" inert>
        <WorldGrid
          chamber={getRoomBlueprint(state.room)}
          position={state.position}
          settings={state.settings}
          progress={state.progress}
          onMove={() => {}}
          onInteract={() => {}}
        />
      </div>
      <span className="story-brand" aria-hidden="true">EJECT</span>
      <button ref={skipRef} type="button" className="console-btn story-skip" onClick={onComplete} data-testid="skip-intro-btn" aria-describedby="opening-subtitle">
        Skip intro <kbd>Esc / Enter</kbd>
      </button>
      <div className="opening-copy">
        <p className="opening-register">BUILD 0.9.4 / {String(shot + 1).padStart(2, '0')}</p>
        <p id="opening-subtitle" className="opening-subtitle" role="status" aria-live="polite" aria-atomic="true">
          {SHOTS[shot].text}
        </p>
      </div>
    </main>
  );
}
