import type { RoomBlueprint, RoomId, Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  brightness: 20,
  volume: 20,
  muted: true,
  interactKey: 'e',
};

export const DISPLAY_CHAMBER: RoomBlueprint = {
  id: 'display',
  code: 'SECTOR 01 // DISPLAY',
  title: 'OPTICAL CALIBRATION BAY',
  subtitle: 'Chamber shrouded in low-gain fog. Raise Brightness ≥ 70% to reveal the optical glyph.',
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

export const CONTROLS_CHAMBER_PLACEHOLDER: RoomBlueprint = {
  id: 'controls',
  code: 'SECTOR 03 // CONTROLS',
  title: 'KEYBIND AUTHORIZATION BAY',
  subtitle: 'Sector 03 placeholder active. Terminal keybind override awaits Stage 4.',
  width: 9,
  height: 7,
  spawn: { x: 1, y: 3 },
  nodePosition: { x: 5, y: 2 },
  exitPosition: { x: 8, y: 3 },
  tiles: [
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'floor', 'wall', 'floor', 'floor', 'node', 'wall', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'floor', 'exit'],
    ['wall', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ],
};

export const STAGE_ONE_CHAMBER = DISPLAY_CHAMBER;
export const AUDIO_CHAMBER_PLACEHOLDER = AUDIO_CHAMBER;

export const ROOMS: Record<'display' | 'audio' | 'controls', RoomBlueprint> = {
  display: DISPLAY_CHAMBER,
  audio: AUDIO_CHAMBER,
  controls: CONTROLS_CHAMBER_PLACEHOLDER,
};

export function getRoomBlueprint(roomId: RoomId): RoomBlueprint {
  if (roomId === 'audio') {
    return AUDIO_CHAMBER;
  }
  if (roomId === 'controls') {
    return CONTROLS_CHAMBER_PLACEHOLDER;
  }
  return DISPLAY_CHAMBER;
}
