import { DEFAULT_SETTINGS, DISPLAY_CHAMBER, getRoomBlueprint, ROOMS } from './levels';
import {
  canActivateGlyph,
  canActivateResonator,
  canActivateTerminal,
  canMove,
  clampPercentage,
  formatBindKey,
  getAudioStatus,
  getNextPosition,
  getNextCrossTalkStage,
  getTileAt,
  getUnmetFinaleConditions,
  isAdjacent,
  isFinalGateReady,
  isGlyphVisible,
  isTerminalKeyAuthorized,
} from './rules';
import type { GameAction, GameState, Settings } from './types';

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
      crossTalkStage: 'unlinked',
    },
    feedback:
      'DIAGNOSTIC SHELL READY // ADJUST SYSTEM PARAMETERS OR INSPECT SECTOR VIEWPORT.',
  };
}

function getFinaleSettingFeedback(
  nextSettings: Settings,
  progress: GameState['progress'],
): string {
  const unmet = getUnmetFinaleConditions(nextSettings, progress);
  if (unmet.length === 0) {
    return 'FINAL INTERLOCK VERIFIED // ALL THREE SUBSYSTEMS NOMINAL — ESCAPE GATE AT (08, 03) OPEN.';
  }
  return `FINAL GATE LOCKED // UNMET: ${unmet.join(' · ')}.`;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  const bindLabel = formatBindKey(state.settings.interactKey);

  switch (action.type) {
    case 'START_INTRO':
      return state.phase === 'intro' ? { ...state, phase: 'cinematic' } : state;

    case 'START_GAME':
      if (state.phase !== 'intro' && state.phase !== 'cinematic') return state;
      return {
        ...state,
        phase: 'playing',
        feedback:
          'SECTOR 01 ENGAGED // MOVE WITH WASD/ARROWS. RAISE BRIGHTNESS TO ≥ 70% TO REVEAL THE HIDDEN GLYPH.',
      };

    case 'RESTART_GAME':
    case 'RETURN_TO_INTRO':
      return createInitialState();

    case 'REJECT_UNBOUND_KEY': {
      if (state.phase !== 'playing') {
        return state;
      }
      const pressedUpper = formatBindKey(action.key);
      if (state.room === 'controls') {
        if (action.key === 'k') {
          return {
            ...state,
            feedback:
              'KEY [K] IS CURRENTLY UNBOUND // REMAP INTERACT KEY BINDING TO [K] IN SYSTEM SETTINGS FIRST.',
          };
        }
        return {
          ...state,
          feedback: `KEY [${pressedUpper}] REVOKED & UNBOUND // PRESS AUTHORIZED KEY [${bindLabel}] OR CLICK INTERACT.`,
        };
      }
      return {
        ...state,
        feedback: `KEY [${pressedUpper}] UNBOUND // ACTIVE INTERACT KEY IS [${bindLabel}].`,
      };
    }

    case 'MOVE': {
      if (state.phase !== 'playing') {
        return state;
      }

      const room = getRoomBlueprint(state.room);
      const target = getNextPosition(state.position, action.direction);
      const targetTile = getTileAt(room, target, state.settings);

      if (!canMove(room, target, state.progress, state.settings)) {
        if (state.room === 'crosstalk' && (targetTile === 'node' || targetTile === 'exit')) {
          return {
            ...state,
            feedback: state.progress.crossTalkStage === 'powered'
              ? 'The exit is powered. Machine housings are solid; use the floor passage.'
              : 'The circuit is incomplete. Follow the cable between the machines.',
          };
        }
        if (state.room === 'frame') {
          return {
            ...state,
            feedback: room.tiles[target.y]?.[target.x] === 'frame' || targetTile === 'exit'
              ? 'The frame seals the passage. THE FRAME IS PART OF THE PRISON.'
              : 'Movement blocked by a bulkhead.',
          };
        }
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
          if (state.room === 'controls') {
            return {
              ...state,
              feedback: isTerminalKeyAuthorized(state.settings.interactKey)
                ? 'EXIT GATE LOCKED // STAND ADJACENT TO THE TERMINAL AT (05, 02) AND PRESS [K].'
                : `EXIT GATE LOCKED // PROTOCOL REQUIRES KEY [K] (CURRENT: [${bindLabel}]) — REMAP INTERACT TO [K] AND ACTIVATE TERMINAL.`,
            };
          }
          const unmet = getUnmetFinaleConditions(state.settings, state.progress);
          return {
            ...state,
            feedback: `FINAL ESCAPE GATE LOCKED // UNMET: ${unmet.join(' · ')}.`,
          };
        }

        if (targetTile === 'node') {
          if (state.room === 'display') {
            if (state.progress.glyphActivated) {
              return {
                ...state,
                feedback:
                  'OPTICAL GLYPH SOCKET ACTIVE // EXIT GATE AT (08, 03) IS UNLOCKED.',
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
                feedback:
                  'ACOUSTIC RESONATOR ACTIVE // EXIT GATE AT (08, 03) IS UNLOCKED.',
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
          if (state.room === 'controls') {
            if (state.progress.terminalActivated) {
              return {
                ...state,
                feedback:
                  'KEYBIND TERMINAL AUTHORIZED // EXIT GATE AT (08, 03) IS UNLOCKED.',
              };
            }
            return {
              ...state,
              feedback: isTerminalKeyAuthorized(state.settings.interactKey)
                ? 'TERMINAL READY [KEY K AUTHORIZED] // PRESS [K] OR CLICK INTERACT TO UNLOCK EXIT.'
                : `TERMINAL REJECTS KEY [${bindLabel}] // E: REVOKED / K: AUTHORIZED — REMAP INTERACT TO [K].`,
            };
          }
          return {
            ...state,
            feedback: getFinaleSettingFeedback(state.settings, state.progress),
          };
        }

        return {
          ...state,
          feedback: 'MOVEMENT BLOCKED // BULKHEAD WALL.',
        };
      }

      if (targetTile === 'exit') {
        if (state.room === 'display') {
          const nextRoom = ROOMS.audio;
          const audioStatus = getAudioStatus(state.settings);
          return {
            ...state,
            room: nextRoom.id,
            position: { ...nextRoom.spawn },
            feedback: `SECTOR 01 CLEARED // ENTERED SECTOR 02: AUDIO [${audioStatus}] — TUNE VOLUME 55–75% WITH MUTE OFF.`,
          };
        }

        if (state.room === 'audio') {
          const nextRoom = ROOMS.controls;
          return {
            ...state,
            room: nextRoom.id,
            position: { ...nextRoom.spawn },
            feedback:
              'SECTOR 02 CLEARED // ENTERED SECTOR 03: E: REVOKED / K: AUTHORIZED — REBIND INTERACT TO [K].',
          };
        }

        if (state.room === 'controls') {
          const nextRoom = ROOMS.frame;
          return {
            ...state,
            room: nextRoom.id,
            position: { ...nextRoom.spawn },
            feedback: 'THE FRAME IS PART OF THE PRISON. A new world parameter is available in Settings.',
          };
        }

        if (state.room === 'frame') {
          const nextRoom = ROOMS.crosstalk;
          return {
            ...state, room: nextRoom.id, position: { ...nextRoom.spawn },
            feedback: 'CATCH THE LIGHT. CARRY THE SIGNAL.',
          };
        }

        if (state.room === 'crosstalk') {
          const nextRoom = ROOMS.finale;
          const ready = isFinalGateReady(state.settings, state.progress);
          return {
            ...state,
            room: nextRoom.id,
            position: { ...nextRoom.spawn },
            feedback: ready
              ? 'CROSS-TALK CLEARED // ENTERED SECTOR 06: ALL THREE INTERLOCKS VERIFIED — WALK TO EXIT (08, 03) TO EJECT.'
              : getFinaleSettingFeedback(state.settings, state.progress),
          };
        }

        if (state.room === 'finale') {
          return {
            ...state,
            position: target,
            phase: 'won',
            feedback:
              'CONTAINMENT OVERRIDE COMPLETE // SYSTEM EJECT SEQUENCE EXECUTED.',
          };
        }
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
      } else if (state.room === 'controls') {
        if (isAdjacent(target, room.nodePosition)) {
          if (state.progress.terminalActivated) {
            moveFeedback =
              'ADJACENT TO AUTHORIZED TERMINAL // PROCEED TO THE OPEN EXIT AT (X:08, Y:03).';
          } else if (isTerminalKeyAuthorized(state.settings.interactKey)) {
            moveFeedback =
              'TERMINAL IN RANGE [K: AUTHORIZED] // PRESS [K] OR CLICK INTERACT TO UNLOCK EXIT.';
          } else {
            moveFeedback = `TERMINAL REJECTS [${bindLabel}] (E: REVOKED / K: AUTHORIZED) // REMAP INTERACT TO [K] IN SETTINGS.`;
          }
        } else if (isAdjacent(target, room.exitPosition)) {
          if (state.progress.terminalActivated) {
            moveFeedback =
              'BULKHEAD GATE DISENGAGED // STEP RIGHT ONTO (X:08, Y:03) TO ENTER THE FRAME.';
          } else {
            moveFeedback =
              'BULKHEAD GATE LOCKED // REBIND INTERACT TO [K] AND AUTHORIZE TERMINAL AT (X:05, Y:02).';
          }
        }
      } else if (state.room === 'frame') {
        moveFeedback = state.settings.windowMode === 'borderless'
          ? 'The frame has retracted. The next chamber is open.'
          : 'THE FRAME IS PART OF THE PRISON.';
      } else if (state.room === 'crosstalk') {
        moveFeedback = state.progress.crossTalkStage === 'powered'
          ? 'The relay has powered the exit.'
          : state.progress.crossTalkStage === 'routed' ? 'The carrier is routed. Follow the cable.'
            : 'CATCH THE LIGHT. CARRY THE SIGNAL.';
      } else if (state.room === 'finale') {
        const unmet = getUnmetFinaleConditions(state.settings, state.progress);
        if (unmet.length === 0) {
          moveFeedback = isAdjacent(target, room.exitPosition)
            ? 'FINAL ESCAPE GATE OPEN // STEP RIGHT ONTO (X:08, Y:03) TO EJECT FROM SYSTEM.'
            : `ALL INTERLOCKS VERIFIED // PROCEED TO OPEN ESCAPE GATE AT (X:08, Y:03).`;
        } else {
          moveFeedback = `FINAL GATE LOCKED // UNMET: ${unmet.join(' · ')}.`;
        }
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

      if (state.room === 'crosstalk') {
        const crossTalkStage = getNextCrossTalkStage(room, state.position, state.settings, state.progress);
        if (crossTalkStage !== state.progress.crossTalkStage) {
          return {
            ...state, progress: { ...state.progress, crossTalkStage },
            feedback: crossTalkStage === 'routed'
              ? 'Optical carrier latched. The cable leads to the acoustic relay.'
              : 'Acoustic relay latched. The exit is powered.',
          };
        }
        return {
          ...state,
          feedback: state.progress.crossTalkStage === 'powered' ? 'The exit is powered.'
            : isAdjacent(state.position, room.nodePosition)
              ? state.progress.crossTalkStage === 'routed' ? 'Carrier already routed. Follow the cable.' : 'The lens needs more light.'
              : room.relayPosition && isAdjacent(state.position, room.relayPosition)
                ? state.progress.crossTalkStage === 'unlinked' ? 'No optical carrier. Trace the input cable back to the lens.' : `Relay: ${getAudioStatus(state.settings)}.`
                : 'Move beside the lens or relay to interact.',
        };
      }

      if (state.room === 'frame') {
        return {
          ...state,
          feedback: 'There is no actuator here. The frame responds to Window Mode in Settings.',
        };
      }

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

      if (state.room === 'controls') {
        if (
          canActivateTerminal(
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
              terminalActivated: true,
            },
            feedback:
              'TERMINAL AUTHORIZED [KEY K] // SECTOR 03 EXIT LOCK DISENGAGED — WALK ONTO EXIT AT (X:08, Y:03).',
          };
        }

        if (isAdjacent(state.position, room.nodePosition)) {
          if (state.progress.terminalActivated) {
            return {
              ...state,
              feedback:
                'TERMINAL ALREADY AUTHORIZED // WALK ONTO THE OPEN EXIT AT (X:08, Y:03).',
            };
          }
          return {
            ...state,
            feedback: `TERMINAL ACCESS DENIED // KEY [${bindLabel}] REVOKED (E: REVOKED / K: AUTHORIZED) — REBIND INTERACT TO [K].`,
          };
        }

        return {
          ...state,
          feedback: isTerminalKeyAuthorized(state.settings.interactKey)
            ? 'NO ACTUATOR IN RANGE // STAND ADJACENT TO THE TERMINAL AT (X:05, Y:02) AND PRESS [K].'
            : `TERMINAL PROTOCOL: E: REVOKED / K: AUTHORIZED // REBIND INTERACT TO [K] AND APPROACH TERMINAL (05, 02).`,
        };
      }

      return {
        ...state,
        feedback: getFinaleSettingFeedback(state.settings, state.progress),
      };
    }

    case 'SET_WINDOW_MODE': {
      if (state.phase !== 'playing' || (state.room !== 'frame' && state.room !== 'finale')) return state;
      if (action.value !== 'framed' && action.value !== 'borderless') return state;
      // This one-choke room must stay open while OP-01 occupies or has crossed the frame.
      if (action.value === 'framed' && state.room === 'frame' && state.position.x >= ROOMS.frame.nodePosition.x) {
        return {
          ...state,
          feedback: 'FRAME OCCUPIED. Return to the entry side before closing. Window Mode stays Borderless.',
        };
      }
      return {
        ...state,
        settings: { ...state.settings, windowMode: action.value },
        feedback: state.room === 'finale'
          ? 'Window Mode affects only The Frame chamber. The final gate still uses light, resonance and authorized input.'
          : action.value === 'borderless'
            ? 'The frame has retracted. The passage and exit are open.'
            : 'The frame has expanded. The passage is sealed.',
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
      } else if (state.room === 'finale') {
        feedback = getFinaleSettingFeedback(nextSettings, state.progress);
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
      if (state.room === 'finale') {
        feedback = getFinaleSettingFeedback(nextSettings, state.progress);
      } else if (audioStatus === 'MUTED') {
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

      const feedback =
        state.room === 'finale'
          ? getFinaleSettingFeedback(nextSettings, state.progress)
          : action.value
            ? 'AUDIO BUS CLAMPED [MUTED] // RESONANCE SIGNAL SUPPRESSED.'
            : audioStatus === 'STABLE'
              ? `AUDIO BUS UNCLAMPED [STABLE: ${nextSettings.volume}%] // RESONANCE READY FOR ACTIVATION.`
              : `AUDIO BUS UNCLAMPED [${audioStatus}: ${nextSettings.volume}%] // TUNE VOLUME TO 55–75% STABLE BAND.`;

      return {
        ...state,
        settings: nextSettings,
        feedback,
      };
    }

    case 'TOGGLE_MUTE': {
      const nextMuted = !state.settings.muted;
      const nextSettings = {
        ...state.settings,
        muted: nextMuted,
      };
      const audioStatus = getAudioStatus(nextSettings);

      const feedback =
        state.room === 'finale'
          ? getFinaleSettingFeedback(nextSettings, state.progress)
          : nextMuted
            ? 'AUDIO BUS CLAMPED [MUTED] // RESONANCE SIGNAL SUPPRESSED.'
            : audioStatus === 'STABLE'
              ? `AUDIO BUS UNCLAMPED [STABLE: ${nextSettings.volume}%] // RESONANCE READY FOR ACTIVATION.`
              : `AUDIO BUS UNCLAMPED [${audioStatus}: ${nextSettings.volume}%] // TUNE VOLUME TO 55–75% STABLE BAND.`;

      return {
        ...state,
        settings: nextSettings,
        feedback,
      };
    }

    case 'SET_INTERACT_KEY': {
      const nextLabel = formatBindKey(action.value);
      const nextSettings = {
        ...state.settings,
        interactKey: action.value,
      };

      let feedback = `ACTUATOR INTERRUPT REBOUND // PRIMARY KEY [${nextLabel}].`;
      if (state.room === 'controls' && !state.progress.terminalActivated) {
        feedback =
          action.value === 'k'
            ? 'ACTUATOR REBOUND TO [K] (AUTHORIZED) // STAND ADJACENT TO TERMINAL AT (05, 02) AND PRESS [K].'
            : `ACTUATOR REBOUND TO [${nextLabel}] (REVOKED) // TERMINAL REQUIRES KEY [K].`;
      } else if (state.room === 'finale') {
        feedback = getFinaleSettingFeedback(nextSettings, state.progress);
      }

      return {
        ...state,
        settings: nextSettings,
        feedback,
      };
    }

    default:
      return state;
  }
}
