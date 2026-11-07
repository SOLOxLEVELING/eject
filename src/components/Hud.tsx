import { formatBindKey } from '../game/rules';
import type { RoomBlueprint, Settings } from '../game/types';

type HudProps = {
  chamber: RoomBlueprint;
  settings: Settings;
  showManual: boolean;
  onToggleManual: () => void;
  onReturnToIntro: () => void;
};

export function Hud({
  chamber,
  settings,
  showManual,
  onToggleManual,
  onReturnToIntro,
}: HudProps) {
  const bindLabel = formatBindKey(settings.interactKey);
  const brightnessLabel = `${String(settings.brightness).padStart(3, '0')}%`;
  const volumeLabel = `${String(settings.volume).padStart(3, '0')}%`;

  return (
    <header className="hud-bar" aria-label="Diagnostic Console Status">
      <div className="hud-identity">
        <span className="hud-badge">EJECT</span>
        <div className="hud-sector">
          <span className="hud-sector-code">{chamber.code}</span>
          <span className="hud-sector-title">{chamber.title}</span>
        </div>
      </div>

      <dl className="hud-telemetry" aria-label="Live System Settings Readout">
        <div className="hud-datum">
          <dt>BRIGHTNESS</dt>
          <dd data-testid="hud-brightness">{brightnessLabel}</dd>
        </div>
        <div className="hud-datum">
          <dt>VOLUME</dt>
          <dd data-testid="hud-volume">{volumeLabel}</dd>
        </div>
        <div className="hud-datum">
          <dt>AUDIO BUS</dt>
          <dd
            className={settings.muted ? 'status-warn' : 'status-ok'}
            data-testid="hud-mute"
          >
            {settings.muted ? 'MUTED' : 'UNMUTED'}
          </dd>
        </div>
        <div className="hud-datum">
          <dt>INTERACT</dt>
          <dd data-testid="hud-interact-key">KEY [{bindLabel}]</dd>
        </div>
      </dl>

      <div className="hud-actions">
        <button
          type="button"
          className="console-btn console-btn-ghost"
          aria-expanded={showManual}
          onClick={onToggleManual}
        >
          {showManual ? 'Hide Manual' : 'How to Play'}
        </button>
        <button
          type="button"
          className="console-btn console-btn-ghost"
          onClick={onReturnToIntro}
        >
          Boot Screen
        </button>
      </div>
    </header>
  );
}
