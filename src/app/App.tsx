import { useEffect, useReducer, useState } from 'react';
import { Hud } from '../components/Hud';
import { SettingsPanel } from '../components/SettingsPanel';
import { WorldGrid } from '../components/WorldGrid';
import { createInitialState, gameReducer } from '../game/gameReducer';
import { getRoomBlueprint } from '../game/levels';
import { formatBindKey } from '../game/rules';
import type { BindKey, Direction } from '../game/types';

function isRangeInput(element: EventTarget | null): boolean {
  return (
    element instanceof HTMLInputElement && element.type.toLowerCase() === 'range'
  );
}

function isTextOrSelectControl(element: EventTarget | null): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  const tag = element.tagName;
  if (tag === 'SELECT' || tag === 'TEXTAREA' || element.isContentEditable) {
    return true;
  }
  if (tag === 'INPUT' && !isRangeInput(element)) {
    return true;
  }
  return false;
}

const ARROW_KEYS = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
const CANDIDATE_BIND_KEYS = new Set<BindKey>(['e', 'f', 'k']);

const KEY_TO_DIRECTION: Record<string, Direction> = {
  w: 'up',
  arrowup: 'up',
  s: 'down',
  arrowdown: 'down',
  a: 'left',
  arrowleft: 'left',
  d: 'right',
  arrowright: 'right',
};

export function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [showManual, setShowManual] = useState(false);

  const bindLabel = formatBindKey(state.settings.interactKey);
  const currentChamber = getRoomBlueprint(state.room);

  useEffect(() => {
    if (state.phase !== 'playing') {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const key = event.key.toLowerCase();
      const direction = KEY_TO_DIRECTION[key];

      if (direction) {
        if (
          isTextOrSelectControl(event.target) ||
          isTextOrSelectControl(document.activeElement)
        ) {
          return;
        }
        if (
          ARROW_KEYS.has(key) &&
          (isRangeInput(event.target) || isRangeInput(document.activeElement))
        ) {
          return;
        }
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        event.preventDefault();
        dispatch({ type: 'MOVE', direction });
        return;
      }

      if (key === state.settings.interactKey) {
        if (
          isTextOrSelectControl(event.target) ||
          isTextOrSelectControl(document.activeElement)
        ) {
          return;
        }
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        event.preventDefault();
        dispatch({ type: 'INTERACT' });
        return;
      }

      if (CANDIDATE_BIND_KEYS.has(key as BindKey)) {
        if (
          isTextOrSelectControl(event.target) ||
          isTextOrSelectControl(document.activeElement)
        ) {
          return;
        }
        event.preventDefault();
        dispatch({ type: 'REJECT_UNBOUND_KEY', key: key as BindKey });
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.phase, state.settings.interactKey]);

  if (state.phase === 'intro') {
    return (
      <div className="console-root" data-phase="intro">
        <main className="boot-screen" aria-labelledby="boot-title">
          <div className="boot-top-strip">
            <span className="boot-tag">FIRMWARE 04.9 // CORRUPTED DIAGNOSTIC SHELL</span>
            <span className="boot-status">CONTAINMENT LOCK: ACTIVE</span>
          </div>

          <div className="boot-layout">
            <section className="boot-primary">
              <p className="boot-kicker">FIELD CALIBRATION TERMINAL</p>
              <h1 id="boot-title" className="boot-title">
                EJECT
              </h1>
              <p className="boot-subtitle">Settings Are the Dungeon</p>

              <p className="boot-narrative">
                Trapped inside a faulted diagnostic build, standard exits refuse
                to open—recalibrate the system settings to physically alter each
                chamber and force an escape.
              </p>

              <div className="boot-cta-row">
                <button
                  type="button"
                  className="console-btn console-btn-primary"
                  onClick={() => dispatch({ type: 'START_GAME' })}
                >
                  Start Session
                </button>
                <button
                  type="button"
                  className="console-btn console-btn-secondary"
                  aria-expanded={showManual}
                  onClick={() => setShowManual((prev) => !prev)}
                >
                  {showManual ? 'Hide How to Play' : 'How to Play'}
                </button>
              </div>

              <section
                className={`boot-manual-card ${showManual ? 'is-emphasized' : ''}`}
                aria-label="How to Play Controls"
              >
                <h2 className="manual-heading">OPERATOR BRIEFING // CONTROLS</h2>
                <div className="manual-grid">
                  <div className="manual-item">
                    <span className="manual-key">WASD / ARROWS</span>
                    <span className="manual-desc">
                      Navigate the operator through the 9×7 chamber grid.
                    </span>
                  </div>
                  <div className="manual-item">
                    <span className="manual-key">KEY [{bindLabel}] / BUTTON</span>
                    <span className="manual-desc">
                      Activate adjacent glyphs, resonators, and terminals (E initially).
                    </span>
                  </div>
                  <div className="manual-item">
                    <span className="manual-key">SETTINGS AT RIGHT</span>
                    <span className="manual-desc">
                      Brightness, Volume/Mute, and Key Bindings directly rewire the room.
                    </span>
                  </div>
                </div>
              </section>
            </section>

            <aside
              className="boot-SideRack"
              aria-label="Initial System Parameter Registers"
            >
              <div className="rack-header">
                <span className="panel-index">PARAMETER BUS // RIGHT CONSOLE</span>
                <h2 className="rack-title">INITIAL DIAGNOSTIC REGISTERS</h2>
              </div>

              <dl className="rack-register-list">
                <div className="rack-register">
                  <dt>01 // DISPLAY BRIGHTNESS</dt>
                  <dd>{state.settings.brightness}% (LOW LUMINANCE)</dd>
                </div>
                <div className="rack-register">
                  <dt>02 // AUDIO RESONANCE</dt>
                  <dd>
                    {state.settings.volume}% [{state.settings.muted ? 'MUTED' : 'LIVE'}]
                  </dd>
                </div>
                <div className="rack-register">
                  <dt>03 // INTERACT ACTUATOR</dt>
                  <dd>BOUND TO KEY [{bindLabel}]</dd>
                </div>
              </dl>

              <div className="rack-diagram" aria-hidden="true">
                <div className="diagram-row">
                  <span>[SECTOR 01: DISPLAY]</span>
                  <span className="status-warn">LOCKED</span>
                </div>
                <div className="diagram-row">
                  <span>[SECTOR 02: AUDIO]</span>
                  <span className="status-dim">STANDBY</span>
                </div>
                <div className="diagram-row">
                  <span>[SECTOR 03: CONTROLS]</span>
                  <span className="status-dim">STANDBY</span>
                </div>
                <div className="diagram-row">
                  <span>[SECTOR 04: SYSTEM EXIT]</span>
                  <span className="status-dim">STANDBY</span>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    );
  }

  if (state.phase === 'won') {
    return (
      <div className="console-root" data-phase="won">
        <main className="boot-screen won-screen" aria-labelledby="won-title">
          <div className="boot-top-strip">
            <span className="boot-tag">FIRMWARE 04.9 // CONTAINMENT OVERRIDE COMPLETE</span>
            <span className="boot-status boot-status-ok">SYSTEM EJECTED</span>
          </div>

          <div className="boot-layout">
            <section className="boot-primary">
              <p className="boot-kicker">ESCAPE SEQUENCE VERIFIED</p>
              <h1 id="won-title" className="boot-title">
                EJECTED
              </h1>
              <p className="boot-subtitle">Containment Architecture Overridden</p>

              <p className="boot-narrative won-narrative">
                All three diagnostic interlocks held stable across the parameter
                bus. By turning the system&apos;s own calibration settings against
                its locks, Operator OP-01 has escaped the corrupted shell.
              </p>

              <div className="boot-cta-row">
                <button
                  type="button"
                  className="console-btn console-btn-primary"
                  onClick={() => dispatch({ type: 'RESTART_GAME' })}
                  data-testid="play-again-btn"
                >
                  Play Again
                </button>
                <button
                  type="button"
                  className="console-btn console-btn-secondary"
                  onClick={() => dispatch({ type: 'RETURN_TO_INTRO' })}
                  data-testid="return-boot-btn"
                >
                  Boot Screen
                </button>
              </div>
            </section>

            <aside
              className="boot-SideRack"
              aria-label="Final Verified System Registers"
            >
              <div className="rack-header">
                <span className="panel-index">EXIT TELEMETRY // VERIFIED</span>
                <h2 className="rack-title">FINAL CALIBRATION SNAPSHOT</h2>
              </div>

              <dl className="rack-register-list">
                <div className="rack-register">
                  <dt>01 // DISPLAY LUMINANCE</dt>
                  <dd className="status-ok">
                    {state.settings.brightness}% (GLYPH LINKED)
                  </dd>
                </div>
                <div className="rack-register">
                  <dt>02 // ACOUSTIC RESONANCE</dt>
                  <dd className="status-ok">
                    {state.settings.volume}% [UNMUTED — STABLE]
                  </dd>
                </div>
                <div className="rack-register">
                  <dt>03 // TERMINAL ACTUATOR</dt>
                  <dd className="status-ok">
                    KEY [{bindLabel}] AUTHORIZED
                  </dd>
                </div>
              </dl>

              <div className="rack-diagram" aria-hidden="true">
                <div className="diagram-row">
                  <span>[SECTOR 01: DISPLAY]</span>
                  <span className="status-ok">CLEARED</span>
                </div>
                <div className="diagram-row">
                  <span>[SECTOR 02: AUDIO]</span>
                  <span className="status-ok">CLEARED</span>
                </div>
                <div className="diagram-row">
                  <span>[SECTOR 03: CONTROLS]</span>
                  <span className="status-ok">CLEARED</span>
                </div>
                <div className="diagram-row">
                  <span>[SECTOR 04: SYSTEM EXIT]</span>
                  <span className="status-ok">EJECTED</span>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="console-root" data-phase="playing">
      <div className="console-shell">
        <Hud
          chamber={currentChamber}
          settings={state.settings}
          showManual={showManual}
          onToggleManual={() => setShowManual((prev) => !prev)}
          onRestart={() => dispatch({ type: 'RESTART_GAME' })}
          onReturnToIntro={() => dispatch({ type: 'RETURN_TO_INTRO' })}
        />

        {showManual && (
          <section className="shell-manual-banner" aria-label="How to Play Reference">
            <div className="manual-banner-item">
              <strong>MOVEMENT:</strong> WASD or Arrow Keys
            </div>
            <div className="manual-banner-item">
              <strong>INTERACT:</strong> Bound Key [{bindLabel}] or on-screen Interact button
            </div>
            <div className="manual-banner-item">
              <strong>OBJECTIVE:</strong> Adjust the right-hand Settings Console to unlock each sector gate.
            </div>
          </section>
        )}

        <main className="shell-workspace">
          <WorldGrid
            chamber={currentChamber}
            position={state.position}
            settings={state.settings}
            progress={state.progress}
            feedback={state.feedback}
            onInteract={() => dispatch({ type: 'INTERACT' })}
          />

          <SettingsPanel
            settings={state.settings}
            onBrightnessChange={(value) =>
              dispatch({ type: 'SET_BRIGHTNESS', value })
            }
            onVolumeChange={(value) =>
              dispatch({ type: 'SET_VOLUME', value })
            }
            onToggleMute={() => dispatch({ type: 'TOGGLE_MUTE' })}
            onInteractKeyChange={(value) =>
              dispatch({ type: 'SET_INTERACT_KEY', value })
            }
          />
        </main>
      </div>
    </div>
  );
}
