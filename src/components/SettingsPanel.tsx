import { formatBindKey } from '../game/rules';
import type { BindKey, Settings } from '../game/types';

type SettingsPanelProps = {
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
  settings,
  onBrightnessChange,
  onVolumeChange,
  onToggleMute,
  onInteractKeyChange,
}: SettingsPanelProps) {
  const bindLabel = formatBindKey(settings.interactKey);

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
        <section className="setting-module" aria-labelledby="setting-brightness-label">
          <div className="setting-top-row">
            <div>
              <span className="setting-code">REG 01 // DISPLAY</span>
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
              className="setting-readout"
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
            className="console-slider"
          />

          <div className="slider-scale" aria-hidden="true">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>70% NOMINAL</span>
            <span>100%</span>
          </div>
          <p className="setting-caption">
            Modulates chamber optical gain without dimming console instrumentation.
          </p>
        </section>

        {/* 02: VOLUME + MUTE */}
        <section className="setting-module" aria-labelledby="setting-volume-label">
          <div className="setting-top-row">
            <div>
              <span className="setting-code">REG 02 // AUDIO</span>
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
              className="setting-readout"
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
            className="console-slider"
          />

          <div className="slider-scale" aria-hidden="true">
            <span>0%</span>
            <span>25%</span>
            <span>55–75% BAND</span>
            <span>100%</span>
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
              className={`console-btn mute-toggle-btn ${
                settings.muted ? 'is-muted' : 'is-unmuted'
              }`}
            >
              {settings.muted ? 'Mute: ON' : 'Mute: OFF'}
            </button>
          </div>
        </section>

        {/* 03: INTERACT KEY */}
        <section className="setting-module" aria-labelledby="setting-interact-label">
          <div className="setting-top-row">
            <div>
              <span className="setting-code">REG 03 // CONTROLS</span>
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
              onChange={(e) => onInteractKeyChange(e.target.value as BindKey)}
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
