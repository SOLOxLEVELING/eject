import type { RoomBlueprint, RoomId, Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  brightness: 20,
  volume: 20,
  muted: true,
  interactKey: 'e',
  windowMode: 'framed',
};

export const DISPLAY_CHAMBER: RoomBlueprint = {
  id: 'display',
  code: 'SECTOR 01 // DISPLAY',
  title: 'OPTICAL CALIBRATION BAY',
  subtitle:
    'Chamber shrouded in low-gain fog. Raise Brightness ≥ 70% to reveal the optical glyph.',
  width: 9,
  height: 7,
  spawn: { x: 2, y: 3 },
  nodePosition: { x: 6, y: 1 },
  exitPosition: { x: 8, y: 3 },
  tiles: [
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'node', 'floor', 'wall'],
    ['wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall', 'floor', 'exit'],
    ['wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ],
};

export const AUDIO_CHAMBER: RoomBlueprint = {
  id: 'audio',
  code: 'SECTOR 02 // AUDIO',
  title: 'ACOUSTIC RESONANCE BAY',
  subtitle:
    'Resonance lock engaged. Calibrate Volume to 55–75% inclusive with Mute OFF, then activate the resonator.',
  width: 9,
  height: 7,
  spawn: { x: 1, y: 3 },
  nodePosition: { x: 4, y: 2 },
  exitPosition: { x: 8, y: 3 },
  tiles: [
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'floor', 'wall', 'floor', 'node', 'floor', 'wall', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'exit'],
    ['wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ],
};

export const CONTROLS_CHAMBER: RoomBlueprint = {
  id: 'controls',
  code: 'SECTOR 03 // CONTROLS',
  title: 'KEYBIND AUTHORIZATION BAY',
  subtitle:
    'Console notice: E: REVOKED / K: AUTHORIZED. Rebind Interact to K and activate the terminal.',
  width: 9,
  height: 7,
  spawn: { x: 1, y: 3 },
  nodePosition: { x: 5, y: 2 },
  exitPosition: { x: 8, y: 3 },
  tiles: [
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'floor', 'wall', 'floor', 'floor', 'node', 'wall', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'exit'],
    ['wall', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ],
};

export const FRAME_CHAMBER: RoomBlueprint = {
  id: 'frame',
  code: 'SECTOR 04 // WINDOW MODE',
  title: 'THE FRAME',
  subtitle: 'THE FRAME IS PART OF THE PRISON.',
  width: 9,
  height: 7,
  spawn: { x: 1, y: 3 },
  nodePosition: { x: 4, y: 3 }, // The single retractable passage, not an actuator.
  exitPosition: { x: 8, y: 3 },
  tiles: [
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall'],
    ['wall', 'floor', 'wall', 'floor', 'frame', 'floor', 'wall', 'floor', 'exit'],
    ['wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ],
};

export const CROSS_TALK_CHAMBER: RoomBlueprint = {
  id: 'crosstalk',
  code: 'SECTOR 05 // CROSS-TALK',
  title: 'CROSS-TALK',
  subtitle: 'CATCH THE LIGHT. ESCAPE THE EYE. CARRY THE SIGNAL.',
  width: 9,
  height: 7,
  spawn: { x: 1, y: 3 },
  nodePosition: { x: 2, y: 1 },
  relayPosition: { x: 6, y: 5 },
  exitPosition: { x: 8, y: 3 },
  tiles: [
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
    ['wall', 'floor', 'node', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'watcher', 'floor', 'wall', 'floor', 'exit'],
    ['wall', 'floor', 'wall', 'wall', 'wall', 'floor', 'wall', 'floor', 'wall'],
    // Seal the lower bypass so the light-sensitive passage is the only crossing.
    ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'node', 'floor', 'wall'],
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ],
};

export const FINALE_CHAMBER: RoomBlueprint = {
  id: 'finale',
  code: 'SECTOR 06 // SYSTEM EXIT',
  title: 'CONTAINMENT EJECT GATE',
  subtitle:
    'Final interlock requires all three sector flags plus live Brightness ≥ 70%, Volume 55–75% unmuted, and Key K.',
  width: 9,
  height: 7,
  spawn: { x: 1, y: 3 },
  nodePosition: { x: 4, y: 2 },
  exitPosition: { x: 8, y: 3 },
  tiles: [
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'floor', 'wall', 'floor', 'node', 'floor', 'wall', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'exit'],
    ['wall', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ],
};

export const STAGE_ONE_CHAMBER = DISPLAY_CHAMBER;
export const AUDIO_CHAMBER_PLACEHOLDER = AUDIO_CHAMBER;
export const CONTROLS_CHAMBER_PLACEHOLDER = CONTROLS_CHAMBER;

export const ROOMS: Record<RoomId, RoomBlueprint> = {
  display: DISPLAY_CHAMBER,
  audio: AUDIO_CHAMBER,
  controls: CONTROLS_CHAMBER,
  frame: FRAME_CHAMBER,
  crosstalk: CROSS_TALK_CHAMBER,
  finale: FINALE_CHAMBER,
};

export function getRoomBlueprint(roomId: RoomId): RoomBlueprint {
  return ROOMS[roomId];
}
