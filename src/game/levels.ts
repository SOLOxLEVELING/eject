import type { RoomBlueprint, Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  brightness: 20,
  volume: 20,
  muted: true,
  interactKey: 'e',
};

export const STAGE_ONE_CHAMBER: RoomBlueprint = {
  id: 'display',
  code: 'SECTOR 01 // DISPLAY',
  title: 'OPTICAL CALIBRATION BAY',
  subtitle: 'Diagnostic chamber online. Field luminance remains below nominal threshold.',
  width: 9,
  height: 7,
  spawn: { x: 2, y: 3 },
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
