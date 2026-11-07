import { useEffect, useState } from 'react';
import type { RoomId } from '../game/types';

type ChamberArrivalProps = {
  room: RoomId;
  bindLabel: string;
};

export function ChamberArrival({ room, bindLabel }: ChamberArrivalProps) {
  const [visible, setVisible] = useState(true);
  const line = {
    display: 'Find a way past the lock.',
    audio: 'Light was only the first constraint.',
    controls: 'The system has heard you. It still refuses your input.',
    frame: '',
    crosstalk: '',
    finale: '',
  }[room];

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), room === 'display' ? 8000 : 5500);
    return () => window.clearTimeout(timer);
  }, [room]);

  if (!visible || !line) return null;
  return (
    <aside className="chamber-arrival" aria-label="Chamber arrival" data-testid="chamber-arrival">
      <div role="status">
        <p>{line}</p>
        {room === 'display' && (
          <p className="arrival-controls">Move: WASD / Arrows · Interact: {bindLabel} · Settings: Esc</p>
        )}
      </div>
      <button type="button" className="console-btn console-btn-ghost" onClick={() => setVisible(false)} aria-label="Dismiss chamber note">Dismiss</button>
    </aside>
  );
}
