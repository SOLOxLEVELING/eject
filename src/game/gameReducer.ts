import { DEFAULT_SETTINGS, STAGE_ONE_CHAMBER } from './levels';
import { clampPercentage, formatBindKey } from './rules';
import type { GameAction, GameState } from './types';

export function createInitialState(): GameState {
  return {
    phase: 'intro',
    room: STAGE_ONE_CHAMBER.id,
    position: { ...STAGE_ONE_CHAMBER.spawn },
    settings: { ...DEFAULT_SETTINGS },
    progress: {
      glyphActivated: false,
      resonatorActivated: false,
      terminalActivated: false,
    },
    feedback: 'DIAGNOSTIC SHELL READY // ADJUST SYSTEM PARAMETERS OR INSPECT SECTOR VIEWPORT.',
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        phase: 'playing',
        feedback: 'SESSION ENGAGED // SECTOR 01 VIEWPORT LINKED TO LIVE PARAMETER BUS.',
      };

    case 'RETURN_TO_INTRO':
      return {
        ...state,
        phase: 'intro',
      };

    case 'SET_BRIGHTNESS': {
      const brightness = clampPercentage(action.value);
      return {
        ...state,
        settings: {
          ...state.settings,
          brightness,
        },
        feedback: `LUMINANCE REGISTER UPDATED // ${String(brightness).padStart(3, '0')}% GAIN.`,
      };
    }

    case 'SET_VOLUME': {
      const volume = clampPercentage(action.value);
      return {
        ...state,
        settings: {
          ...state.settings,
          volume,
        },
        feedback: `ACOUSTIC GAIN REGISTER UPDATED // ${String(volume).padStart(3, '0')}% LEVEL.`,
      };
    }

    case 'SET_MUTED': {
      return {
        ...state,
        settings: {
          ...state.settings,
          muted: action.value,
        },
        feedback: action.value
          ? 'AUDIO BUS CLAMPED // OUTPUT MUTED.'
          : 'AUDIO BUS UNCLAMPED // SIGNAL ROUTING LIVE.',
      };
    }

    case 'TOGGLE_MUTE': {
      const nextMuted = !state.settings.muted;
      return {
        ...state,
        settings: {
          ...state.settings,
          muted: nextMuted,
        },
        feedback: nextMuted
          ? 'AUDIO BUS CLAMPED // OUTPUT MUTED.'
          : 'AUDIO BUS UNCLAMPED // SIGNAL ROUTING LIVE.',
      };
    }

    case 'SET_INTERACT_KEY': {
      return {
        ...state,
        settings: {
          ...state.settings,
          interactKey: action.value,
        },
        feedback: `ACTUATOR INTERRUPT REBOUND // PRIMARY KEY [${formatBindKey(action.value)}].`,
      };
    }

    default:
      return state;
  }
}
