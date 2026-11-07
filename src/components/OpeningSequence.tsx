import { useCallback, useEffect, useRef, useState } from 'react';
import { getRoomBlueprint } from '../game/levels';
import { OPENING_BEATS } from '../game/openingStory';
import type { GameState } from '../game/types';
import { BedroomScene } from './BedroomScene';
import { StoryDialogue } from './StoryDialogue';
import { WorldGrid } from './WorldGrid';

type OpeningSequenceProps = {
  state: GameState;
  onComplete: () => void;
};

export function OpeningSequence({ state, onComplete }: OpeningSequenceProps) {
  const [shot, setShot] = useState(0);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const beat = OPENING_BEATS[shot];
  const advance = useCallback(() => {
    if (shot === OPENING_BEATS.length - 1) onComplete();
    else setShot(shot + 1);
  }, [shot, onComplete]);

  useEffect(() => nextRef.current?.focus({ preventScroll: true }), []);

  useEffect(() => {
    const timer = window.setTimeout(advance, beat.duration);
    function handleKey(event: KeyboardEvent) {
      if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== 'Escape' && event.key !== 'Enter') return;
      event.preventDefault();
      // Consume the whole event before mounting gameplay or advancing another beat.
      event.stopImmediatePropagation();
      if (event.repeat) return;
      if (event.key === 'Escape' || (event.target instanceof Element && event.target.closest('[data-testid="skip-intro-btn"]'))) onComplete();
      else advance();
    }
    window.addEventListener('keydown', handleKey, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKey, true);
    };
  }, [advance, beat.duration, onComplete]);

  return (
    <main
      className="opening-sequence"
      data-phase="cinematic"
      data-shot={beat.id}
      data-door-locked={shot >= 3}
      aria-label="Opening story"
      onClick={(event) => {
        if (!(event.target instanceof Element && event.target.closest('button'))) advance();
      }}
    >
      {shot < 3 && (
        <BedroomScene moment={shot === 0 ? 'night' : shot === 1 ? 'terminated' : 'pull'}>
          {shot === 0 ? <><p className="crt-online">PLAYERS ONLINE: 1</p><p className="story-crt-title">EJECT</p><p className="crt-shutdown">SERVER CLOSURE IN 00:00:30</p></>
            : <><p className="crt-shutdown">SERVER CLOSURE IN 00:00:00</p><p className="crt-terminated">SESSION TERMINATED</p><span className="crt-cursor" aria-hidden="true" /></>}
        </BedroomScene>
      )}
      <div className="opening-world" aria-hidden="true" inert hidden={shot < 3}>
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
      <button type="button" className="console-btn story-skip" onClick={onComplete} data-testid="skip-intro-btn">
        Skip intro <kbd>Esc</kbd>
      </button>
      {beat.lines.length > 0 && <StoryDialogue lines={beat.lines} />}
      {shot === 4 && <p className="story-controls">Move: WASD / Arrows · Interact: E · Settings: Esc</p>}
      <footer className="story-navigation">
        <span>{shot + 1} / 5</span>
        <button ref={nextRef} type="button" className="console-btn" onClick={advance} data-testid="advance-intro-btn">
          {shot === 4 ? 'Enter the game' : 'Continue'} <kbd>Enter</kbd>
        </button>
      </footer>
    </main>
  );
}
