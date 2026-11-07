import { useEffect, useRef, useState } from 'react';
import { Operator } from './Operator';

type EscapeSceneProps = {
  onReplay: () => void;
};

export function EscapeScene({ onReplay }: EscapeSceneProps) {
  const [settled, setSettled] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const sceneRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    sceneRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (settled) return;
    const timer = window.setTimeout(() => setSettled(true), 1800);
    function skip(event: KeyboardEvent) {
      if (event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Enter' && event.target instanceof Element && event.target.closest('button')) return;
      if (event.key === 'Escape' || event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        setSettled(true);
      }
    }
    window.addEventListener('keydown', skip, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', skip, true);
    };
  }, [settled]);

  return (
    <main ref={sceneRef} tabIndex={-1} className="escape-screen" data-phase="won" data-settled={settled} aria-labelledby="escape-title">
      <div className="escape-window" aria-hidden="true">
        <div className="escape-operator">
          <Operator />
          <span className="entity-code">OP-01</span>
        </div>
      </div>
      {!settled && (
        <button type="button" className="console-btn story-skip" onClick={() => setSettled(true)} data-testid="skip-ending-btn">Skip ending <kbd>Esc</kbd></button>
      )}
      <div className="escape-copy">
        <p className="escape-register" role="status">PROCESS OP-01 // {settled ? 'EXTERNALIZED' : 'EXTERNALIZING'}</p>
        <h1 id="escape-title">EJECT</h1>
        <p className="escape-message">YOU CHANGED THE RULES.</p>
        <button type="button" className="console-btn console-btn-primary" onClick={onReplay} data-testid="play-again-btn">Play again</button>
      </div>
    </main>
  );
}
