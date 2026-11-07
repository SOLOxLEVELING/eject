import { useEffect, useRef, useState } from 'react';
import { ROOM_STORY } from '../game/roomStory';
import type { RoomId } from '../game/types';
import { StoryDialogue } from './StoryDialogue';

type ChamberArrivalProps = {
  room: RoomId;
  bindLabel: string;
  complete: boolean;
  onReturnToWorld: () => void;
};

export function ChamberArrival({ room, bindLabel, complete, onReturnToWorld }: ChamberArrivalProps) {
  const [message, setMessage] = useState<'entry' | 'hint' | 'success' | null>('entry');
  const successShown = useRef(false);
  const noteRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (complete && !successShown.current && room !== 'finale') {
      successShown.current = true;
      setMessage('success');
    }
  }, [complete, room]);

  useEffect(() => {
    if (!message || message === 'hint') return;
    const timer = window.setTimeout(() => {
      // Never remove a focused dismiss control from under a keyboard user.
      if (!noteRef.current?.contains(document.activeElement)) setMessage(null);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [message]);

  return (
    <>
      <button type="button" className="console-btn room-hint-toggle" aria-label="Show chamber hint"
        aria-controls="chamber-note" aria-expanded={message === 'hint'}
        onClick={() => {
          setMessage(message === 'hint' ? null : 'hint');
          onReturnToWorld();
        }}>?</button>
      {message && (
        <aside ref={noteRef} id="chamber-note" className="chamber-arrival" aria-label="Chamber dialogue"
          data-testid="chamber-arrival" data-message={message}>
          <div>
            <StoryDialogue lines={[{ speaker: 'Boy', text: ROOM_STORY[room][message] }]} />
            {room === 'display' && message === 'entry' && (
              <p className="arrival-controls">Move: WASD / Arrows · Interact: {bindLabel} · Patch Deck below · Settings: Esc</p>
            )}
          </div>
          <button type="button" className="console-btn console-btn-ghost" aria-label="Dismiss chamber note"
            onClick={() => { setMessage(null); onReturnToWorld(); }}>Dismiss</button>
        </aside>
      )}
    </>
  );
}
