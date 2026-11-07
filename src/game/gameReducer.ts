import { DEFAULT_SETTINGS, DISPLAY_CHAMBER, getRoomBlueprint, ROOMS } from './levels';
import {
  canActivateGlyph,
  canActivateResonator,
  canMove,
  clampPercentage,
  formatBindKey,
  getAudioStatus,
  getNextPosition,
  getTileAt,
  isAdjacent,
  isGlyphVisible,
} from './rules';
import type { GameAction, GameState } from './types';

export function createInitialState(): GameState {
  return {
    phase: 'intro',
    room: DISPLAY_CHAMBER.id,
    position: { ...DISPLAY_CHAMBER.spawn },
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
  const bindLabel = formatBindKey(state.settings.interactKey);

  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        phase: 'playing',
        feedback:
          'SECTOR 01 ENGAGED // MOVE WITH WASD/ARROWS. RAISE BRIGHTNESS TO ≥ 70% TO REVEAL THE HIDDEN GLYPH.',
      };

    case 'RETURN_TO_INTRO':
      return {
        ...state,
        phase: 'intro',
      };

    case 'MOVE': {
      if (state.phase !== 'playing') {
        return state;
      }

      const room = getRoomBlueprint(state.room);
      const target = getNextPosition(state.position, action.direction);
      const targetTile = getTileAt(room, target);

      if (!canMove(room, target, state.progress)) {
        if (targetTile === 'exit') {
          if (state.room === 'display') {
            return {
              ...state,
              feedback: isGlyphVisible(state.settings.brightness)
                ? `EXIT GATE LOCKED // STAND ADJACENT TO THE OPTICAL GLYPH AT (06, 01) AND PRESS [${bindLabel}].`
                : `EXIT GATE LOCKED // GLYPH OBSCURED AT ${state.settings.brightness}% — SET BRIGHTNESS TO ≥ 70% AND ACTIVATE GLYPH.`,
            };
          }
          if (state.room === 'audio') {
            const audioStatus = getAudioStatus(state.settings);
            return {
              ...state,
              feedback:
                audioStatus === 'STABLE'
                  ? `EXIT GATE LOCKED // STAND ADJACENT TO THE RESONATOR AT (04, 02) AND PRESS [${bindLabel}].`
                  : `EXIT GATE LOCKED [${audioStatus}] // SET VOLUME 55–75% WITH MUTE OFF AND ACTIVATE RESONATOR.`,
            };
          }
          return {
            ...state,
            feedback: 'SECTOR 03 EXIT LOCKED // STAGE 3 PLACEHOLDER CHECKPOINT.',
          };
        }

        if (targetTile === 'node') {
          if (state.room === 'display') {
            if (state.progress.glyphActivated) {
              return {
                ...state,
                feedback: 'OPTICAL GLYPH SOCKET ACTIVE // EXIT GATE AT (08, 03) IS UNLOCKED.',
              };
            }
            return {
              ...state,
              feedback: isGlyphVisible(state.settings.brightness)
                ? `OPTICAL GLYPH READY // PRESS [${bindLabel}] OR CLICK INTERACT TO UNLOCK EXIT.`
                : `DORMANT OPTICAL SOCKET // LUMINANCE TOO LOW (${state.settings.brightness}%) — RAISE BRIGHTNESS TO ≥ 70%.`,
            };
          }
          if (state.room === 'audio') {
            if (state.progress.resonatorActivated) {
              return {
                ...state,
                feedback: 'ACOUSTIC RESONATOR ACTIVE // EXIT GATE AT (08, 03) IS UNLOCKED.',
              };
            }
            const audioStatus = getAudioStatus(state.settings);
            return {
              ...state,
              feedback:
                audioStatus === 'STABLE'
                  ? `RESONATOR IN STABLE BAND // PRESS [${bindLabel}] OR CLICK INTERACT TO UNLOCK EXIT.`
                  : `RESONATOR PEDESTAL [${audioStatus}] // TUNE VOLUME TO 55–75% WITH MUTE OFF.`,
            };
          }
          return {
            ...state,
            feedback: 'KEYBIND TERMINAL PEDESTAL // AWAITING STAGE 4 CALIBRATION.',
          };
        }

        return {
          ...state,
          feedback: 'MOVEMENT BLOCKED // BULKHEAD WALL.',
        };
      }

      if (targetTile === 'exit' && state.room === 'display') {
        const nextRoom = ROOMS.audio;
        const audioStatus = getAudioStatus(state.settings);
        return {
          ...state,
          room: nextRoom.id,
          position: { ...nextRoom.spawn },
          feedback: `SECTOR 01 CLEARED // ENTERED SECTOR 02: AUDIO [${audioStatus}] — TUNE VOLUME 55–75% WITH MUTE OFF.`,
        };
      }

      if (targetTile === 'exit' && state.room === 'audio') {
        const nextRoom = ROOMS.controls;
        return {
          ...state,
          room: nextRoom.id,
          position: { ...nextRoom.spawn },
          feedback:
            'SECTOR 02 CLEARED // ENTERED SECTOR 03: KEYBIND AUTHORIZATION BAY (STAGE 3 PLACEHOLDER).',
        };
      }

      let moveFeedback = `OPERATOR POSITION // (X:0${target.x}, Y:0${target.y}).`;
      if (state.room === 'display') {
        if (isAdjacent(target, room.nodePosition)) {
          if (state.progress.glyphActivated) {
            moveFeedback =
              'ADJACENT TO ACTIVE GLYPH // PROCEED TO THE OPEN EXIT AT (X:08, Y:03).';
          } else if (isGlyphVisible(state.settings.brightness)) {
            moveFeedback = `OPTICAL GLYPH IN RANGE // PRESS [${bindLabel}] OR CLICK INTERACT TO DISENGAGE EXIT LOCK.`;
          } else {
            moveFeedback = `FAINT OPTICAL ANOMALY ADJACENT // LUMINANCE AT ${state.settings.brightness}% — RAISE BRIGHTNESS TO ≥ 70%.`;
          }
        } else if (isAdjacent(target, room.exitPosition)) {
          if (state.progress.glyphActivated) {
            moveFeedback =
              'BULKHEAD GATE DISENGAGED // STEP RIGHT ONTO (X:08, Y:03) TO ADVANCE.';
          } else if (isGlyphVisible(state.settings.brightness)) {
            moveFeedback = `BULKHEAD GATE LOCKED // ACTIVATE THE REVEALED GLYPH AT (X:06, Y:01) WITH [${bindLabel}].`;
          } else {
            moveFeedback =
              'BULKHEAD GATE LOCKED // CHAMBER TOO DARK — RAISE BRIGHTNESS TO ≥ 70% TO LOCATE GLYPH.';
          }
        }
      } else if (state.room === 'audio') {
        const audioStatus = getAudioStatus(state.settings);
        if (isAdjacent(target, room.nodePosition)) {
          if (state.progress.resonatorActivated) {
            moveFeedback =
              'ADJACENT TO ACTIVE RESONATOR // PROCEED TO THE OPEN EXIT AT (X:08, Y:03).';
          } else if (audioStatus === 'STABLE') {
            moveFeedback = `RESONATOR IN RANGE [STABLE] // PRESS [${bindLabel}] OR CLICK INTERACT TO DISENGAGE EXIT LOCK.`;
          } else if (audioStatus === 'MUTED') {
            moveFeedback =
              'RESONATOR ADJACENT [MUTED] // SWITCH MUTE OFF AND TUNE VOLUME TO 55–75%.';
          } else {
            moveFeedback = `RESONATOR ADJACENT [${audioStatus}: ${state.settings.volume}%] // TUNE VOLUME TO 55–75% INCLUSIVE.`;
          }
        } else if (isAdjacent(target, room.exitPosition)) {
          if (state.progress.resonatorActivated) {
            moveFeedback =
              'BULKHEAD GATE DISENGAGED // STEP RIGHT ONTO (X:08, Y:03) TO ADVANCE.';
          } else {
            moveFeedback = `BULKHEAD GATE LOCKED [${audioStatus}] // CALIBRATE RESONATOR AT (X:04, Y:02) TO 55–75% UNMUTED.`;
          }
        }
      } else {
        moveFeedback = `SECTOR 03 PLACEHOLDER // OPERATOR AT (X:0${target.x}, Y:0${target.y}).`;
      }

      return {
        ...state,
        position: target,
        feedback: moveFeedback,
      };
    }

    case 'INTERACT': {
      if (state.phase !== 'playing') {
        return state;
      }

      const room = getRoomBlueprint(state.room);

      if (state.room === 'display') {
        if (
          canActivateGlyph(
            state.position,
            room.nodePosition,
            state.settings,
            state.progress,
          )
        ) {
          return {
            ...state,
            progress: {
              ...state.progress,
              glyphActivated: true,
            },
            feedback:
              'OPTICAL GLYPH ACTIVATED // BULKHEAD LOCK DISENGAGED — WALK ONTO EXIT AT (X:08, Y:03).',
          };
        }

        if (isAdjacent(state.position, room.nodePosition)) {
          if (state.progress.glyphActivated) {
            return {
              ...state,
              feedback:
                'OPTICAL GLYPH ALREADY ACTIVATED // WALK ONTO THE OPEN EXIT AT (X:08, Y:03).',
            };
          }
          return {
            ...state,
            feedback: `INTERACTION FAILED // GLYPH UNREVEALED AT ${state.settings.brightness}% BRIGHTNESS (REQUIRES ≥ 70%).`,
          };
        }

        if (
          isAdjacent(state.position, room.exitPosition) &&
          !state.progress.glyphActivated
        ) {
          return {
            ...state,
            feedback: isGlyphVisible(state.settings.brightness)
              ? `EXIT GATE LOCKED // STAND ADJACENT TO THE GLYPH AT (X:06, Y:01) AND PRESS [${bindLabel}].`
              : 'EXIT GATE LOCKED // RAISE BRIGHTNESS TO ≥ 70% TO REVEAL THE OPTICAL GLYPH.',
          };
        }

        return {
          ...state,
          feedback: isGlyphVisible(state.settings.brightness)
            ? `NO ACTUATOR IN RANGE // MOVE ADJACENT TO THE GLYPH AT (X:06, Y:01) AND PRESS [${bindLabel}].`
            : 'NO VISIBLE ACTUATOR IN RANGE // RAISE BRIGHTNESS TO ≥ 70% TO REVEAL THE HIDDEN GLYPH.',
        };
      }

      if (state.room === 'audio') {
        const audioStatus = getAudioStatus(state.settings);

        if (
          canActivateResonator(
            state.position,
            room.nodePosition,
            state.settings,
            state.progress,
          )
        ) {
          return {
            ...state,
            progress: {
              ...state.progress,
              resonatorActivated: true,
            },
            feedback:
              'ACOUSTIC RESONATOR ACTIVATED [STABLE] // BULKHEAD LOCK DISENGAGED — WALK ONTO EXIT AT (X:08, Y:03).',
          };
        }

        if (isAdjacent(state.position, room.nodePosition)) {
          if (state.progress.resonatorActivated) {
            return {
              ...state,
              feedback:
                'ACOUSTIC RESONATOR ALREADY ACTIVATED // WALK ONTO THE OPEN EXIT AT (X:08, Y:03).',
            };
          }
          if (audioStatus === 'MUTED') {
            return {
              ...state,
              feedback:
                'INTERACTION FAILED [MUTED] // AUDIO OUTPUT IS CLAMPED — SWITCH MUTE OFF AND SET VOLUME TO 55–75%.',
            };
          }
          return {
            ...state,
            feedback: `INTERACTION FAILED [${audioStatus}: ${state.settings.volume}%] // RESONATOR REQUIRES 55–75% VOLUME WITH MUTE OFF.`,
          };
        }

        return {
          ...state,
          feedback:
            audioStatus === 'STABLE'
              ? `NO ACTUATOR IN RANGE // STAND ADJACENT TO THE RESONATOR AT (X:04, Y:02) AND PRESS [${bindLabel}].`
              : `NO ACTUATOR IN RANGE [${audioStatus}] // TUNE VOLUME TO 55–75% UNMUTED AND APPROACH RESONATOR AT (04, 02).`,
        };
      }

      return {
        ...state,
        feedback: 'SECTOR 03 PLACEHOLDER // KEYBIND TERMINAL OFFLINE IN STAGE 3.',
      };
    }

    case 'SET_BRIGHTNESS': {
      const brightness = clampPercentage(action.value);
      const nextSettings = {
        ...state.settings,
        brightness,
      };

      let feedback = `LUMINANCE REGISTER UPDATED // ${String(brightness).padStart(3, '0')}% GAIN.`;
      if (state.room === 'display' && !state.progress.glyphActivated) {
        if (isGlyphVisible(brightness)) {
          feedback = `LUMINANCE ${String(brightness).padStart(3, '0')}% // OPTICAL GLYPH REVEALED AT (X:06, Y:01) — STAND ADJACENT AND PRESS [${bindLabel}].`;
        } else {
          feedback = `LUMINANCE ${String(brightness).padStart(3, '0')}% // BELOW 70% THRESHOLD — OPTICAL GLYPH REMAINS OBSCURED.`;
        }
      }

      return {
        ...state,
        settings: nextSettings,
        feedback,
      };
    }

    case 'SET_VOLUME': {
      const volume = clampPercentage(action.value);
      const nextSettings = {
        ...state.settings,
        volume,
      };
      const audioStatus = getAudioStatus(nextSettings);
      const volText = `${String(volume).padStart(3, '0')}%`;

      let feedback = `ACOUSTIC GAIN ${volText} [${audioStatus}] // TARGET STABLE BAND IS 55–75% UNMUTED.`;
      if (audioStatus === 'MUTED') {
        feedback = `ACOUSTIC GAIN ${volText} [MUTED] // UNMUTE AUDIO OUTPUT TO ENGAGE RESONANCE BAND (55–75%).`;
      } else if (audioStatus === 'STABLE') {
        feedback = `ACOUSTIC GAIN ${volText} [STABLE] // RESONANCE IN 55–75% BAND — STAND ADJACENT TO RESONATOR AND PRESS [${bindLabel}].`;
      }

      return {
        ...state,
        settings: nextSettings,
        feedback,
      };
    }

    case 'SET_MUTED': {
      const nextSettings = {
        ...state.settings,
        muted: action.value,
      };
      const audioStatus = getAudioStatus(nextSettings);

      return {
        ...state,
        settings: nextSettings,
        feedback: action.value
          ? 'AUDIO BUS CLAMPED [MUTED] // RESONANCE SIGNAL SUPPRESSED.'
          : audioStatus === 'STABLE'
            ? `AUDIO BUS UNCLAMPED [STABLE: ${nextSettings.volume}%] // RESONANCE READY FOR ACTIVATION.`
            : `AUDIO BUS UNCLAMPED [${audioStatus}: ${nextSettings.volume}%] // TUNE VOLUME TO 55–75% STABLE BAND.`,
      };
    }

    case 'TOGGLE_MUTE': {
      const nextMuted = !state.settings.muted;
      const nextSettings = {
        ...state.settings,
        muted: nextMuted,
      };
      const audioStatus = getAudioStatus(nextSettings);

      return {
        ...state,
        settings: nextSettings,
        feedback: nextMuted
          ? 'AUDIO BUS CLAMPED [MUTED] // RESONANCE SIGNAL SUPPRESSED.'
          : audioStatus === 'STABLE'
            ? `AUDIO BUS UNCLAMPED [STABLE: ${nextSettings.volume}%] // RESONANCE READY FOR ACTIVATION.`
            : `AUDIO BUS UNCLAMPED [${audioStatus}: ${nextSettings.volume}%] // TUNE VOLUME TO 55–75% STABLE BAND.`,
      };
    }

    case 'SET_INTERACT_KEY': {
      const nextLabel = formatBindKey(action.value);
      return {
        ...state,
        settings: {
          ...state.settings,
          interactKey: action.value,
        },
        feedback: `ACTUATOR INTERRUPT REBOUND // PRIMARY KEY [${nextLabel}].`,
      };
    }

    default:
      return state;
  }
}
