import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { ChamberArrival } from '../components/ChamberArrival';
import { EscapeScene } from '../components/EscapeScene';
import { OpeningSequence } from '../components/OpeningSequence';
import { TitleScreen } from '../components/TitleScreen';
import { Hud } from '../components/Hud';
import { SettingsPanel } from '../components/SettingsPanel';
import { PatchDeck } from '../components/PatchDeck';
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
  getNextCrossTalkStage,
  getTileAt,
  isRoomExitUnlocked,
} from '../game/rules';
import type { BindKey, Direction, Settings } from '../game/types';

function isInteractiveControl(element: EventTarget | null): boolean {
  return element instanceof Element && Boolean(
    element.closest('input, select, textarea, button, summary, a[href], [contenteditable]:not([contenteditable="false"])'),
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const sceneRef = useRef<HTMLElement | null>(null);
  const startPlaying = useCallback(() => dispatch({ type: 'START_GAME' }), []);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  function returnToTitle() {
    setSettingsOpen(false);
    dispatch({ type: 'RESTART_GAME' });
  }

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
    const tile = getTileAt(room, target, current.settings);

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
        )) ||
      (current.room === 'crosstalk' && getNextCrossTalkStage(room, current.position, current.settings, current.progress) !== current.progress.crossTalkStage);

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

  if (state.phase === 'cinematic') {
    return <OpeningSequence state={state} onComplete={startPlaying} />;
  }

  if (state.phase === 'intro') {
    return <TitleScreen onStart={() => dispatch({ type: 'START_INTRO' })} />;
  }

  if (state.phase === 'won') {
    return <EscapeScene onReplay={returnToTitle} />;
  }

  const settingControls = {
    activeRoom: state.room,
    settings: state.settings,
    feedback: state.feedback,
    onBrightnessChange: (value: number) => dispatch({ type: 'SET_BRIGHTNESS', value }),
    onVolumeChange: (value: number) => {
      playConsoleTone('probe', { ...state.settings, volume: value });
      dispatch({ type: 'SET_VOLUME', value });
    },
    onToggleMute: () => {
      playConsoleTone('probe', { ...state.settings, muted: !state.settings.muted });
      dispatch({ type: 'TOGGLE_MUTE' });
    },
    onInteractKeyChange: (value: BindKey) => dispatch({ type: 'SET_INTERACT_KEY', value }),
    onWindowModeChange: (value: Settings['windowMode']) => dispatch({ type: 'SET_WINDOW_MODE', value }),
  };

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
        <ChamberArrival key={state.room} room={state.room} bindLabel={bindLabel}
          complete={isRoomExitUnlocked(state.room, state.progress, state.settings)}
          onReturnToWorld={() => sceneRef.current?.focus({ preventScroll: true })} />
      </main>

      <PatchDeck {...settingControls} onReturnToWorld={() => sceneRef.current?.focus({ preventScroll: true })} />

      {settingsOpen && (
        <SettingsPanel
          {...settingControls}
          onClose={() => setSettingsOpen(false)}
          onRestart={returnToTitle}
          onReturnToIntro={returnToTitle}
        />
      )}
    </div>
  );
}
