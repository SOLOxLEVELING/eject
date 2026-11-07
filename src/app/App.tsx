import { useEffect, useReducer, useRef, useState } from 'react';
import { Hud } from '../components/Hud';
import { SettingsPanel } from '../components/SettingsPanel';
import { WorldGrid } from '../components/WorldGrid';
import { createInitialState, gameReducer } from '../game/gameReducer';
import { getRoomBlueprint } from '../game/levels';
import {
  canActivateGlyph,
  canActivateResonator,
  canActivateTerminal,
  canMove,
  formatBindKey,
  getAudioStatus,
  getNextPosition,
  getTileAt,
} from '../game/rules';
import type { BindKey, Direction, Settings } from '../game/types';

function isInteractiveControl(element: EventTarget | null): boolean {
  return element instanceof Element && Boolean(
    element.closest('input, select, textarea, button, a[href], [contenteditable]:not([contenteditable="false"])'),
  );
}

type ToneKind = 'step' | 'blocked' | 'unlock' | 'win' | 'probe';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const sceneRef = useRef<HTMLElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  function playConsoleTone(kind: ToneKind, customSettings?: Settings) {
    const activeSettings = customSettings ?? stateRef.current.settings;
    if (activeSettings.muted || activeSettings.volume <= 0) {
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) {
        return;
      }
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const maxGain = Math.min(0.07, (activeSettings.volume / 100) * 0.065);

      if (kind === 'step') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        gain.gain.setValueAtTime(maxGain * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.045);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (kind === 'blocked') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        gain.gain.setValueAtTime(maxGain * 0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.095);
      } else if (kind === 'unlock' || kind === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(kind === 'win' ? 660 : 554.37, now + 0.07);
        gain.gain.setValueAtTime(maxGain, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.23);
      } else if (kind === 'probe') {
        const status = getAudioStatus(activeSettings);
        osc.type = status === 'STABLE' ? 'sine' : 'triangle';
        const freq =
          status === 'STABLE' ? 440 : status === 'TOO LOW' ? 260 : 620;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(maxGain * 0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.065);
      }
    } catch {
      // Ignore Web Audio errors in headless or restricted environments
    }
  }

  function triggerMove(direction: Direction) {
    const current = stateRef.current;
    if (current.phase !== 'playing' || settingsOpen) {
      return;
    }
    const room = getRoomBlueprint(current.room);
    const target = getNextPosition(current.position, direction);
    const allowed = canMove(room, target, current.progress, current.settings);
    const tile = getTileAt(room, target);

    if (!allowed) {
      playConsoleTone('blocked');
    } else if (tile === 'exit') {
      playConsoleTone(current.room === 'finale' ? 'win' : 'unlock');
    } else {
      playConsoleTone('step');
    }

    dispatch({ type: 'MOVE', direction });
  }

  function triggerInteract() {
    const current = stateRef.current;
    if (current.phase !== 'playing' || settingsOpen) {
      return;
    }
    const room = getRoomBlueprint(current.room);
    const willUnlock =
      (current.room === 'display' &&
        canActivateGlyph(
          current.position,
          room.nodePosition,
          current.settings,
          current.progress,
        )) ||
      (current.room === 'audio' &&
        canActivateResonator(
          current.position,
          room.nodePosition,
          current.settings,
          current.progress,
        )) ||
      (current.room === 'controls' &&
        canActivateTerminal(
          current.position,
          room.nodePosition,
          current.settings,
          current.progress,
        ));

    playConsoleTone(willUnlock ? 'unlock' : 'blocked');
    dispatch({ type: 'INTERACT' });
  }

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
      if (key === 'escape' && !settingsOpen && !event.repeat) {
        event.preventDefault();
        setSettingsOpen(true);
        return;
      }

      if (
        settingsOpen || event.isComposing ||
        isInteractiveControl(event.target) ||
        isInteractiveControl(document.activeElement)
      ) {
        return;
      }

      const direction = KEY_TO_DIRECTION[key];
      if (direction) {
        event.preventDefault();
        triggerMove(direction);
      } else if (key === stateRef.current.settings.interactKey) {
        event.preventDefault();
        triggerInteract();
      } else if (CANDIDATE_BIND_KEYS.has(key as BindKey)) {
        event.preventDefault();
        playConsoleTone('blocked');
        dispatch({ type: 'REJECT_UNBOUND_KEY', key: key as BindKey });
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.phase, settingsOpen]);

  useEffect(() => {
    if (state.phase === 'playing' && !settingsOpen) {
      sceneRef.current?.focus({ preventScroll: true });
    }
  }, [state.phase, settingsOpen]);

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
                    <span className="manual-key">SETTINGS / ESC</span>
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
                <span className="panel-index">PARAMETER BUS // IN-GAME SETTINGS</span>
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
                <div className="rack-row diagram-row">
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
    <div className="game-screen" data-phase="playing">
      <Hud
        chamber={currentChamber}
        settings={state.settings}
        progress={state.progress}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <main
        ref={sceneRef}
        className="game-world"
        tabIndex={0}
        aria-label="Chamber. Move with WASD or arrow keys. Open settings with Escape."
        onPointerDown={(event) => {
          if (!settingsOpen && !isInteractiveControl(event.target)) {
            sceneRef.current?.focus({ preventScroll: true });
          }
        }}
      >
        <WorldGrid
          chamber={currentChamber}
          position={state.position}
          settings={state.settings}
          progress={state.progress}
          onMove={triggerMove}
          onInteract={triggerInteract}
        />
      </main>

      {settingsOpen && (
        <SettingsPanel
          activeRoom={state.room}
          settings={state.settings}
          feedback={state.feedback}
          onClose={() => setSettingsOpen(false)}
          onRestart={() => {
            setSettingsOpen(false);
            dispatch({ type: 'RESTART_GAME' });
          }}
          onReturnToIntro={() => {
            setSettingsOpen(false);
            setShowManual(false);
            dispatch({ type: 'RETURN_TO_INTRO' });
          }}
          onBrightnessChange={(value) =>
            dispatch({ type: 'SET_BRIGHTNESS', value })
          }
          onVolumeChange={(value) => {
            const nextSettings = { ...state.settings, volume: value };
            playConsoleTone('probe', nextSettings);
            dispatch({ type: 'SET_VOLUME', value });
          }}
          onToggleMute={() => {
            const nextSettings = {
              ...state.settings,
              muted: !state.settings.muted,
            };
            playConsoleTone('probe', nextSettings);
            dispatch({ type: 'TOGGLE_MUTE' });
          }}
          onInteractKeyChange={(value) =>
            dispatch({ type: 'SET_INTERACT_KEY', value })
          }
        />
      )}
    </div>
  );
}
