import { useEffect, useRef, useState } from 'react';
import { ENDING_BEATS, ENDING_RECAP } from '../game/endingStory';
import { BedroomScene } from './BedroomScene';
import { Operator } from './Operator';
import { StoryDialogue } from './StoryDialogue';

type EscapeSceneProps = {
  onReplay: () => void;
};

export function EscapeScene({ onReplay }: EscapeSceneProps) {
  const [shot, setShot] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? ENDING_BEATS.length : 0);
  const sceneRef = useRef<HTMLElement | null>(null);
  const settled = shot === ENDING_BEATS.length;
  const beat = ENDING_BEATS[shot];
  const dawn = shot >= 3;

  function skipEnding() {
    // Skip may remove the focused button; put focus on a stable story surface.
    sceneRef.current?.focus({ preventScroll: true });
    setShot(ENDING_BEATS.length);
  }

  useEffect(() => {
    sceneRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!beat) return;
    const timer = window.setTimeout(() => {
      if (shot === ENDING_BEATS.length - 1 && sceneRef.current?.querySelector('[data-testid="skip-ending-btn"]') === document.activeElement) {
        sceneRef.current?.focus({ preventScroll: true });
      }
      setShot(shot + 1);
    }, beat.duration);
    function skip(event: KeyboardEvent) {
      if (event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Enter' && event.target instanceof Element && event.target.closest('button, summary')) return;
      if (event.key === 'Escape' || event.key === 'Enter') {
        event.preventDefault();
        event.stopImmediatePropagation();
        skipEnding();
      }
    }
    window.addEventListener('keydown', skip, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', skip, true);
    };
  }, [shot, beat]);

  return (
    <main ref={sceneRef} tabIndex={-1} className="escape-screen" data-phase="won" data-settled={settled}
      data-ending-stage={beat?.id ?? 'complete'} aria-labelledby="escape-title">
      <div className="escape-window" aria-hidden="true" hidden={dawn}>
        <div className="escape-darkness" />
        <div className="escape-barrier"><span /><span /></div>
        <div className="escape-operator">
          <Operator />
          <span className="entity-code">OP-01</span>
        </div>
      </div>
      {dawn && <BedroomScene moment="dawn"><p className="dawn-thanks">THANK YOU FOR PLAYING.</p></BedroomScene>}
      {!settled && (
        <button type="button" className="console-btn story-skip" onClick={skipEnding} data-testid="skip-ending-btn">Skip ending <kbd>Esc</kbd></button>
      )}
      {(settled || (beat && beat.lines.length > 0)) && <StoryDialogue lines={settled ? ENDING_RECAP : beat.lines} />}
      <div className="escape-copy">
        <h1 id="escape-title">EJECT</h1>
        <p className="escape-message">The Last Player</p>
        <button type="button" className="console-btn console-btn-primary" onClick={onReplay} data-testid="play-again-btn">Play again</button>
        {settled && (
          <details className="escape-credits">
            <summary>Credits</summary>
            <p>Original local SVG/CSS artwork and procedural tones. Built with React, TypeScript and Vite, with human-supervised AI assistance. Thank you for playing.</p>
          </details>
        )}
      </div>
    </main>
  );
}
