import { AUDIO_STABLE_MAX, AUDIO_STABLE_MIN, formatBindKey, getAudioStatus } from '../game/rules';
import type { BindKey, WindowMode } from '../game/types';
import type { SettingsPanelProps } from './SettingsPanel';

type PatchDeckProps = Omit<SettingsPanelProps, 'onClose' | 'onRestart' | 'onReturnToIntro'> & {
  onReturnToWorld: () => void;
};

export function PatchDeck({
  activeRoom, settings, feedback, onBrightnessChange, onVolumeChange,
  onToggleMute, onInteractKeyChange, onWindowModeChange, onReturnToWorld,
}: PatchDeckProps) {
  const frameAvailable = activeRoom === 'frame' || activeRoom === 'finale';

  return (
    <aside className="patch-deck" aria-label="Patch Deck world controls">
      <div className="patch-heading">
        <span>OP-01 / PATCH DECK</span>
        <button type="button" className="patch-return" data-testid="patch-return-btn" onClick={onReturnToWorld}>Return to room</button>
      </div>
      <div className="patch-instruments">
        <div className="patch-dial">
          <label htmlFor="patch-brightness">Brightness <output htmlFor="patch-brightness">{settings.brightness}%</output></label>
          <input id="patch-brightness" type="range" min={0} max={100} step={1} value={settings.brightness}
            className="console-slider" onChange={(event) => onBrightnessChange(Number(event.target.value))} />
        </div>
        <div className="patch-dial">
          <label htmlFor="patch-volume">Volume <output htmlFor="patch-volume">{settings.volume}%</output></label>
          <input id="patch-volume" type="range" min={0} max={100} step={1} value={settings.volume}
            className="console-slider" aria-describedby="patch-audio-status"
            onChange={(event) => onVolumeChange(Number(event.target.value))} />
        </div>
        <button id="patch-mute" type="button" aria-pressed={settings.muted} aria-label="Mute audio"
          onClick={onToggleMute} className="patch-mute">Mute: {settings.muted ? 'ON' : 'OFF'}</button>
        <details className="patch-expansion">
          <summary aria-controls="patch-expanded-controls">More <span>[{formatBindKey(settings.interactKey)}]</span></summary>
          <div id="patch-expanded-controls" className="patch-expanded-controls">
            <label htmlFor="patch-key">Interact binding</label>
            <select id="patch-key" className="console-select" value={settings.interactKey}
              onChange={(event) => onInteractKeyChange(event.target.value as BindKey)}>
              <option value="e">E — Default channel</option>
              <option value="f">F — Auxiliary channel</option>
              <option value="k">K — Override channel</option>
            </select>
            {frameAvailable && (
              <>
                <label htmlFor="patch-frame">Window Mode</label>
                <select id="patch-frame" className="console-select" value={settings.windowMode}
                  aria-describedby="patch-frame-feedback"
                  onChange={(event) => onWindowModeChange(event.target.value as WindowMode)}>
                  <option value="framed">Framed</option>
                  <option value="borderless">Borderless</option>
                </select>
                <p id="patch-frame-feedback" role="status">{activeRoom === 'frame' ? feedback : 'Window Mode affects The Frame only, not the final gate.'}</p>
              </>
            )}
          </div>
        </details>
      </div>
      <p id="patch-audio-status" className="patch-signal" role="status">
        {activeRoom === 'crosstalk' && feedback.startsWith('WATCHER: passage occupied.')
          ? 'Passage occupied. Step clear to raise brightness.'
          : <>Signal: {getAudioStatus(settings)} <span>· stable {AUDIO_STABLE_MIN}–{AUDIO_STABLE_MAX}, unmuted</span></>}
      </p>
    </aside>
  );
}
