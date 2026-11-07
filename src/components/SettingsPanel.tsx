import { useEffect, useRef } from 'react';
import {
  AUDIO_STABLE_MAX,
  AUDIO_STABLE_MIN,
  formatBindKey,
  getAudioStatus,
  isGlyphVisible,
} from '../game/rules';
import type { BindKey, RoomId, Settings, WindowMode } from '../game/types';

export type SettingsPanelProps = {
  activeRoom: RoomId;
  settings: Settings;
  feedback: string;
  onClose: () => void;
  onRestart: () => void;
  onReturnToIntro: () => void;
  onBrightnessChange: (value: number) => void;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
  onInteractKeyChange: (key: BindKey) => void;
  onWindowModeChange: (mode: WindowMode) => void;
};

export function SettingsPanel({
  activeRoom, settings, feedback, onClose, onRestart, onReturnToIntro,
  onBrightnessChange, onVolumeChange, onToggleMute, onInteractKeyChange, onWindowModeChange,
}: SettingsPanelProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const audioStatus = getAudioStatus(settings);
  const audioStable = audioStatus === 'STABLE';
  const glyphVisible = isGlyphVisible(settings.brightness);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      id="settings-overlay"
      className="settings-panel"
      aria-labelledby="settings-title"
      aria-describedby="settings-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="settings-header">
        <div>
          <p className="panel-index">OP-01 / World parameters</p>
          <h2 id="settings-title">Settings</h2>
        </div>
        <button type="button" className="console-btn" onClick={onClose} autoFocus>
          Resume <kbd>Esc</kbd>
        </button>
      </header>
      <p id="settings-description" className="settings-intro">
        Movement paused. The chamber changes live. These controls affect only the game.
      </p>

      {(activeRoom === 'frame' || activeRoom === 'finale') && (
        <section className="setting-module" data-active={activeRoom === 'frame'}>
          <label htmlFor="window-mode-select" className="setting-label">Window Mode</label>
          <select
            id="window-mode-select"
            className="console-select"
            value={settings.windowMode}
            onChange={(event) => onWindowModeChange(event.target.value as WindowMode)}
            aria-describedby="window-mode-caption window-mode-feedback"
          >
            <option value="framed">Framed</option>
            <option value="borderless">Borderless</option>
          </select>
          <p id="window-mode-caption" className="setting-caption">In-game containment geometry only. Never changes your browser window or fullscreen.</p>
          <p id="window-mode-feedback" className="setting-caption" role="status">
            {activeRoom === 'frame' ? feedback : 'Only The Frame chamber responds to this parameter. The final gate still uses three systems.'}
          </p>
        </section>
      )}

      <section className="setting-module" data-active={activeRoom === 'display' || activeRoom === 'crosstalk'}>
        <div className="setting-top-row">
          <label htmlFor="brightness-slider" className="setting-label">Brightness</label>
          <output htmlFor="brightness-slider" data-testid="setting-brightness-value">
            {settings.brightness}%
          </output>
        </div>
        <input
          id="brightness-slider"
          type="range"
          min={0} max={100} step={1}
          value={settings.brightness}
          onChange={(event) => onBrightnessChange(Number(event.target.value))}
          className="console-slider"
          aria-describedby="brightness-clue"
        />
        <p id="brightness-clue" className="setting-caption" role="status">
          {glyphVisible ? 'Optical signal revealed.' : 'A faint optical signal is lost in the dark.'}
        </p>
      </section>

      <section className="setting-module" data-active={activeRoom === 'audio' || activeRoom === 'crosstalk'}>
        <div className="setting-top-row">
          <label htmlFor="volume-slider" className="setting-label">Volume</label>
          <output htmlFor="volume-slider" data-testid="setting-volume-value">{settings.volume}%</output>
        </div>
        <input
          id="volume-slider"
          type="range"
          min={0} max={100} step={1}
          value={settings.volume}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          className="console-slider"
          aria-describedby="audio-band"
        />
        <div className="resonance-meter-box">
          <div className="resonance-meter-header" id="audio-band">
            <span>Signal alignment</span>
            <span className={audioStable ? 'status-ok' : 'status-warn'} data-testid="audio-status-badge" role="status">
              {audioStatus}
            </span>
          </div>
          <div className="resonance-meter-track" aria-hidden="true">
            <div className="resonance-stable-band" style={{ left: `${AUDIO_STABLE_MIN}%`, width: `${AUDIO_STABLE_MAX - AUDIO_STABLE_MIN}%` }} />
            <div className="resonance-level-needle" style={{ left: `${settings.volume}%` }} />
          </div>
        </div>
        <button
          type="button" role="switch"
          aria-checked={settings.muted}
          aria-label="Mute audio output"
          onClick={onToggleMute}
          className={`console-btn mute-toggle-btn ${settings.muted ? 'is-muted' : 'is-unmuted'}`}
        >
          Mute: {settings.muted ? 'ON' : 'OFF'}
        </button>
        {activeRoom === 'audio' && <p className="setting-caption" role="status">
          {feedback.startsWith('SILENT CROSSING: occupied.') ? 'Crossing occupied. Step clear before unmuting.'
            : settings.muted ? 'Silence retracts the crossing shutters.' : 'Sound holds the crossing shutters closed.'}
        </p>}
      </section>

      <section className="setting-module" data-active={activeRoom === 'controls'}>
        <div className="setting-top-row">
          <label htmlFor="interact-key-select" className="setting-label">Interact binding</label>
          <span data-testid="setting-interact-value">[{formatBindKey(settings.interactKey)}]</span>
        </div>
        <select
          id="interact-key-select"
          value={settings.interactKey}
          onChange={(event) => onInteractKeyChange(event.target.value as BindKey)}
          className="console-select"
        >
          <option value="e">E — Default channel</option>
          <option value="f">F — Auxiliary channel</option>
          <option value="k">K — Override channel</option>
        </select>
      </section>

      <details className="settings-help">
        <summary>Help &amp; field notes</summary>
        <p>Move with WASD, arrows or the direction buttons. Use the bound key or Interact button beside a machine. Escape opens or closes settings. Restart returns to the title with all progress reset.</p>
        <p>The game shut down, but OP-01 remained. Containment is for your protection. Then change the rules.</p>
        <p>Light exposes hidden signals. The resonator needs a stable, unmuted signal (volume 55–75). Once activated it stays latched: mute to retract the crossing shutters in Resonance. Step clear before unmuting. Read the terminal for its authorized input.</p>
        {(activeRoom === 'frame' || activeRoom === 'finale') && <p>Window Mode retracts or restores The Frame's passage. Choose Borderless to cross. To restore Framed, first return to the entry side; it cannot close on or behind OP-01. Window Mode is not a fourth finale lock.</p>}
        {activeRoom === 'crosstalk' && <p>Illuminate and activate the lens first. Light also wakes the Watcher: lower brightness until its beam retracts, then cross the central passage. Follow the cable to the distant relay, stabilize the unmuted audio signal, then activate the relay. Both steps latch; later setting changes do not undo them. The finale still requires its original live settings.</p>}
        <p className="settings-feedback" data-testid="telemetry-feedback">{feedback}</p>
      </details>
      <footer className="settings-actions">
        <button type="button" className="console-btn console-btn-ghost" onClick={onRestart} data-testid="hud-restart-btn">Restart</button>
        <button type="button" className="console-btn console-btn-ghost" onClick={onReturnToIntro}>Boot Screen</button>
      </footer>
    </dialog>
  );
}
