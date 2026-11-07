import { formatBindKey, isFinalGateReady } from '../game/rules';
import type { Progress, RoomBlueprint, Settings } from '../game/types';

type HudProps = {
  chamber: RoomBlueprint;
  settings: Settings;
  progress: Progress;
  showManual: boolean;
  onToggleManual: () => void;
  onRestart: () => void;
  onReturnToIntro: () => void;
};

export function Hud({
  chamber,
  settings,
  progress,
  showManual,
  onToggleManual,
  onRestart,
  onReturnToIntro,
}: HudProps) {
  const bindLabel = formatBindKey(settings.interactKey);
  const brightnessLabel = `${String(settings.brightness).padStart(3, '0')}%`;
  const volumeLabel = `${String(settings.volume).padStart(3, '0')}%`;
  const finaleReady = isFinalGateReady(settings, progress);

  const sectors = [
    { id: 'display', num: '01', done: progress.glyphActivated },
    { id: 'audio', num: '02', done: progress.resonatorActivated },
    { id: 'controls', num: '03', done: progress.terminalActivated },
    { id: 'finale', num: '04', done: finaleReady },
  ] as const;

  return (
    <header className="hud-bar" aria-label="Diagnostic Console Status">
      <div className="hud-identity">
        <span className="hud-badge">EJECT</span>
        <div className="hud-sector">
          <span className="hud-sector-code">{chamber.code}</span>
          <span className="hud-sector-title">{chamber.title}</span>
        </div>
        <div className="hud-sector-pips" aria-label="Sector Progression">
          {sectors.map((sec) => {
            const isCurrent = chamber.id === sec.id;
            return (
              <span
                key={sec.id}
                className={[
                  'sector-pip',
                  isCurrent ? 'pip-current' : '',
                  sec.done ? 'pip-done' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                title={`Sector ${sec.num}: ${
                  sec.done ? 'Linked' : isCurrent ? 'Active' : 'Standby'
                }`}
              >
                {sec.num}
              </span>
            );
          })}
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
          onPointerUp={(e) => e.currentTarget.blur()}
        >
          {showManual ? 'Hide Manual' : 'How to Play'}
        </button>
        <button
          type="button"
          className="console-btn console-btn-ghost"
          onClick={onRestart}
          onPointerUp={(e) => e.currentTarget.blur()}
          data-testid="hud-restart-btn"
        >
          Restart
        </button>
        <button
          type="button"
          className="console-btn console-btn-ghost"
          onClick={onReturnToIntro}
          onPointerUp={(e) => e.currentTarget.blur()}
        >
          Boot Screen
        </button>
      </div>
    </header>
  );
}
