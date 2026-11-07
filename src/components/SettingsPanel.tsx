import {
  AUDIO_STABLE_MAX,
  AUDIO_STABLE_MIN,
  formatBindKey,
  getAudioStatus,
  isGlyphVisible,
  isTerminalKeyAuthorized,
} from '../game/rules';
import type { BindKey, RoomId, Settings } from '../game/types';

type SettingsPanelProps = {
  activeRoom: RoomId;
  settings: Settings;
  onBrightnessChange: (value: number) => void;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
  onInteractKeyChange: (key: BindKey) => void;
};

const AVAILABLE_KEYS: readonly { key: BindKey; desc: string }[] = [
  { key: 'e', desc: 'Default Channel' },
  { key: 'f', desc: 'Auxiliary Channel' },
  { key: 'k', desc: 'Override Channel' },
];

export function SettingsPanel({
  activeRoom,
  settings,
  onBrightnessChange,
  onVolumeChange,
  onToggleMute,
  onInteractKeyChange,
}: SettingsPanelProps) {
  const bindLabel = formatBindKey(settings.interactKey);
  const displayNominal = isGlyphVisible(settings.brightness);
  const audioStatus = getAudioStatus(settings);
  const audioStable = audioStatus === 'STABLE';
  const keyAuthorized = isTerminalKeyAuthorized(settings.interactKey);

  return (
    <aside
      className="settings-panel"
      aria-label="System Calibration Settings"
    >
      <div className="panel-header">
        <div className="panel-heading-group">
          <span className="panel-index">CONSOLE // PARAMETER BUS</span>
          <h2 className="panel-title">SYSTEM SETTINGS</h2>
        </div>
        <span className="tag-pill tag-ok">BUS: LINKED</span>
      </div>

      <p className="settings-intro">
        Environmental registers are wired directly to chamber hardware. Changes
        take effect in real time.
      </p>

      <div className="settings-stack">
        {/* 01: BRIGHTNESS */}
        <section
          className={[
            'setting-module',
            displayNominal ? 'setting-module-nominal' : '',
            activeRoom === 'display' ? 'setting-module-active' : '',
            activeRoom === 'finale' && !displayNominal
              ? 'setting-module-warning'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-labelledby="setting-brightness-label"
        >
          <div className="setting-top-row">
            <div>
              <span className="setting-code">
                REG 01 // DISPLAY{' '}
                {activeRoom === 'display' ? '— ACTIVE SECTOR' : ''}
              </span>
              <label
                id="setting-brightness-label"
                htmlFor="brightness-slider"
                className="setting-label"
              >
                Brightness
              </label>
            </div>
            <output
              htmlFor="brightness-slider"
              className={`setting-readout ${
                displayNominal ? 'readout-nominal' : ''
              }`}
              data-testid="setting-brightness-value"
            >
              {settings.brightness}%
            </output>
          </div>

          <input
            id="brightness-slider"
            type="range"
            min={0}
            max={100}
            step={1}
            value={settings.brightness}
            onChange={(e) => onBrightnessChange(Number(e.target.value))}
            onPointerUp={(e) => e.currentTarget.blur()}
            className="console-slider"
            style={{
              background: `linear-gradient(to right, ${
                displayNominal ? '#8ca99b' : '#b5afa2'
              } 0%, ${displayNominal ? '#8ca99b' : '#b5afa2'} ${
                settings.brightness
              }%, #0c0e0f ${settings.brightness}%, #0c0e0f 100%)`,
            }}
          />

          <div className="slider-scale" aria-hidden="true">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span className={displayNominal ? 'scale-hit' : ''}>
              ≥70% NOMINAL
            </span>
            <span>100%</span>
          </div>
          <p className="setting-caption">
            Modulates chamber optical gain without dimming console instrumentation.
          </p>
        </section>

        {/* 02: VOLUME + MUTE + STABLE-ZONE METER */}
        <section
          className={[
            'setting-module',
            audioStable ? 'setting-module-nominal' : 'setting-module-warning',
            activeRoom === 'audio' ? 'setting-module-active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-labelledby="setting-volume-label"
        >
          <div className="setting-top-row">
            <div>
              <span className="setting-code">
                REG 02 // AUDIO{' '}
                {activeRoom === 'audio' ? '— ACTIVE SECTOR' : ''}
              </span>
              <label
                id="setting-volume-label"
                htmlFor="volume-slider"
                className="setting-label"
              >
                Volume
              </label>
            </div>
            <output
              htmlFor="volume-slider"
              className={`setting-readout ${
                audioStable ? 'readout-nominal' : ''
              }`}
              data-testid="setting-volume-value"
            >
              {settings.volume}%
            </output>
          </div>

          <input
            id="volume-slider"
            type="range"
            min={0}
            max={100}
            step={1}
            value={settings.volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            onPointerUp={(e) => e.currentTarget.blur()}
            className="console-slider"
            style={{
              background: `linear-gradient(to right, ${
                settings.muted
                  ? '#54524c'
                  : audioStable
                    ? '#8ca99b'
                    : '#e97c55'
              } 0%, ${
                settings.muted
                  ? '#54524c'
                  : audioStable
                    ? '#8ca99b'
                    : '#e97c55'
              } ${settings.volume}%, #0c0e0f ${settings.volume}%, #0c0e0f 100%)`,
            }}
          />

          {/* STABLE-ZONE METER */}
          <div
            className={`resonance-meter-box status-${audioStatus
              .toLowerCase()
              .replace(/\s+/g, '-')}`}
            aria-label="Audio Resonance Stability Meter"
          >
            <div className="resonance-meter-header">
              <span className="resonance-meter-title">
                STABLE ZONE: {AUDIO_STABLE_MIN}–{AUDIO_STABLE_MAX}%
              </span>
              <span
                className={`resonance-status-pill ${
                  audioStable ? 'pill-stable' : 'pill-unstable'
                }`}
                data-testid="audio-status-badge"
              >
                {audioStatus}
              </span>
            </div>

            <div className="resonance-meter-track" aria-hidden="true">
              <div
                className="resonance-stable-band"
                style={{
                  left: `${AUDIO_STABLE_MIN}%`,
                  width: `${AUDIO_STABLE_MAX - AUDIO_STABLE_MIN}%`,
                }}
              />
              <div
                className={`resonance-level-fill ${
                  settings.muted
                    ? 'fill-muted'
                    : audioStable
                      ? 'fill-stable'
                      : 'fill-unstable'
                }`}
                style={{ width: `${settings.volume}%` }}
              />
              <div
                className="resonance-level-needle"
                style={{ left: `${settings.volume}%` }}
              />
            </div>

            <div className="resonance-zone-labels" aria-hidden="true">
              <span className={audioStatus === 'TOO LOW' ? 'zone-active-warn' : ''}>
                0–54 TOO LOW
              </span>
              <span className={audioStatus === 'STABLE' ? 'zone-active-ok' : ''}>
                55–75 STABLE
              </span>
              <span className={audioStatus === 'TOO HIGH' ? 'zone-active-warn' : ''}>
                76–100 TOO HIGH
              </span>
            </div>
          </div>

          <div className="mute-control-row">
            <div className="mute-status-block">
              <span className="mute-label">Audio Output Gate</span>
              <span
                className={`mute-state-badge ${
                  settings.muted ? 'badge-muted' : 'badge-unmuted'
                }`}
                data-testid="setting-mute-value"
              >
                {settings.muted ? 'MUTED (CLAMPED)' : 'UNMUTED (LIVE)'}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.muted}
              aria-label="Mute audio output"
              onClick={onToggleMute}
              onPointerUp={(e) => e.currentTarget.blur()}
              className={`console-btn mute-toggle-btn ${
                settings.muted ? 'is-muted' : 'is-unmuted'
              }`}
            >
              {settings.muted ? 'Mute: ON' : 'Mute: OFF'}
            </button>
          </div>
        </section>

        {/* 03: INTERACT KEY */}
        <section
          className={[
            'setting-module',
            keyAuthorized ? 'setting-module-nominal' : '',
            activeRoom === 'controls' ? 'setting-module-active' : '',
            (activeRoom === 'controls' || activeRoom === 'finale') &&
            !keyAuthorized
              ? 'setting-module-warning'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-labelledby="setting-interact-label"
        >
          <div className="setting-top-row">
            <div>
              <span className="setting-code">
                REG 03 // CONTROLS{' '}
                {activeRoom === 'controls' ? '— ACTIVE SECTOR' : ''}
              </span>
              <label
                id="setting-interact-label"
                htmlFor="interact-key-select"
                className="setting-label"
              >
                Interact Key Binding
              </label>
            </div>
            <span
              className="setting-readout key-readout"
              data-testid="setting-interact-value"
            >
              [{bindLabel}]
            </span>
          </div>

          <div className="keybind-selector-row">
            <select
              id="interact-key-select"
              value={settings.interactKey}
              onChange={(e) => {
                onInteractKeyChange(e.target.value as BindKey);
              }}
              className="console-select"
              aria-label="Select Interact Key Binding"
            >
              {AVAILABLE_KEYS.map((item) => (
                <option key={item.key} value={item.key}>
                  Key {item.key.toUpperCase()} — {item.desc}
                </option>
              ))}
            </select>

            <div
              className="keycap-group"
              role="group"
              aria-label="Quick Interact Key Selection"
            >
              {AVAILABLE_KEYS.map((item) => {
                const active = settings.interactKey === item.key;
                const upper = item.key.toUpperCase();
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onInteractKeyChange(item.key)}
                    onPointerUp={(e) => e.currentTarget.blur()}
                    aria-pressed={active}
                    className={`keycap-btn ${active ? 'keycap-active' : ''}`}
                  >
                    {upper}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="setting-caption">
            Active terminal actuator key: <strong>{bindLabel}</strong>.
          </p>
        </section>
      </div>
    </aside>
  );
}
