import { getFinaleDiagnostics, isRoomExitUnlocked } from '../game/rules';
import type { Progress, RoomBlueprint, Settings } from '../game/types';

type HudProps = {
  chamber: RoomBlueprint;
  settings: Settings;
  progress: Progress;
  onOpenSettings: () => void;
};

const CHAMBER_NAMES = {
  display: 'The Unseen',
  audio: 'Resonance',
  controls: 'Forbidden Key',
  finale: 'System Exit',
};

const OBJECTIVES = {
  display: 'Find what the darkness is hiding.',
  audio: 'Bring the silent resonator into balance.',
  controls: 'Find a way for the terminal to accept your input.',
  finale: 'Keep the three systems aligned.',
};

export function Hud({ chamber, settings, progress, onOpenSettings }: HudProps) {
  const roomIndex = ['display', 'audio', 'controls', 'finale'].indexOf(chamber.id) + 1;
  const exitUnlocked = isRoomExitUnlocked(chamber.id, progress, settings);
  const fault = chamber.id === 'finale'
    ? getFinaleDiagnostics(settings, progress).find((item) => !item.ready)
    : undefined;
  let objective = OBJECTIVES[chamber.id];
  if (exitUnlocked) {
    objective = chamber.id === 'finale'
      ? 'The boundary is open. Leave the system.'
      : 'Door released. Find the next chamber.';
  } else if (fault) {
    const system = { display: 'light', audio: 'resonance', controls: 'authorized input' }[fault.id];
    objective = `Restore the ${system} at the gate.`;
  }

  return (
    <header className="hud-bar" aria-label="Chamber status">
      <div className="hud-identity">
        <span className="hud-badge">EJECT</span>
        <h1 className="hud-chamber">
          <span className="hud-progress">{String(roomIndex).padStart(2, '0')} / 04</span>
          {CHAMBER_NAMES[chamber.id]}
        </h1>
      </div>
      <p className="hud-objective" role="status">{objective}</p>
      <button
        type="button"
        className="console-btn settings-shortcut"
        onClick={onOpenSettings}
        aria-haspopup="dialog"
        aria-controls="settings-overlay"
        aria-keyshortcuts="Escape"
        data-testid="settings-open-btn"
      >
        Settings <kbd>Esc</kbd>
      </button>
    </header>
  );
}
