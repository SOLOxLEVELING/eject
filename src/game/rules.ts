import type {
  AudioStatus,
  BindKey,
  Coordinates,
  Direction,
  Progress,
  RoomBlueprint,
  RoomId,
  Settings,
  TileKind,
} from './types';

export const GLYPH_BRIGHTNESS_THRESHOLD = 70;
export const AUDIO_STABLE_MIN = 55;
export const AUDIO_STABLE_MAX = 75;

export function clampPercentage(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  const rounded = Math.round(value);
  return Math.min(100, Math.max(0, rounded));
}

export function formatBindKey(key: BindKey): string {
  return key.toUpperCase();
}

export function sanitizeSettings(settings: Settings): Settings {
  return {
    brightness: clampPercentage(settings.brightness),
    volume: clampPercentage(settings.volume),
    muted: Boolean(settings.muted),
    interactKey: settings.interactKey,
  };
}

export function isGlyphVisible(brightness: number): boolean {
  return clampPercentage(brightness) >= GLYPH_BRIGHTNESS_THRESHOLD;
}

export function getAudioStatus(
  settings: Pick<Settings, 'volume' | 'muted'>,
): AudioStatus {
  if (settings.muted) {
    return 'MUTED';
  }
  const volume = clampPercentage(settings.volume);
  if (volume < AUDIO_STABLE_MIN) {
    return 'TOO LOW';
  }
  if (volume > AUDIO_STABLE_MAX) {
    return 'TOO HIGH';
  }
  return 'STABLE';
}

export function isAudioResonanceStable(
  settings: Pick<Settings, 'volume' | 'muted'>,
): boolean {
  return getAudioStatus(settings) === 'STABLE';
}

export function getManhattanDistance(a: Coordinates, b: Coordinates): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function isAdjacent(a: Coordinates, b: Coordinates): boolean {
  return getManhattanDistance(a, b) === 1;
}

export function getNextPosition(
  position: Coordinates,
  direction: Direction,
): Coordinates {
  switch (direction) {
    case 'up':
      return { x: position.x, y: position.y - 1 };
    case 'down':
      return { x: position.x, y: position.y + 1 };
    case 'left':
      return { x: position.x - 1, y: position.y };
    case 'right':
      return { x: position.x + 1, y: position.y };
  }
}

export function isWithinBounds(
  room: RoomBlueprint,
  target: Coordinates,
): boolean {
  return (
    target.x >= 0 &&
    target.x < room.width &&
    target.y >= 0 &&
    target.y < room.height
  );
}

export function getTileAt(
  room: RoomBlueprint,
  target: Coordinates,
): TileKind | null {
  if (!isWithinBounds(room, target)) {
    return null;
  }
  return room.tiles[target.y]?.[target.x] ?? null;
}

export function isRoomExitUnlocked(
  roomId: RoomId,
  progress: Progress,
): boolean {
  if (roomId === 'display') {
    return progress.glyphActivated;
  }
  if (roomId === 'audio') {
    return progress.resonatorActivated;
  }
  return false;
}

export function canMove(
  room: RoomBlueprint,
  target: Coordinates,
  progress: Progress,
): boolean {
  const tile = getTileAt(room, target);
  if (!tile) {
    return false;
  }
  if (tile === 'floor') {
    return true;
  }
  if (tile === 'exit') {
    return isRoomExitUnlocked(room.id, progress);
  }
  return false;
}

export function canActivateGlyph(
  position: Coordinates,
  glyphPosition: Coordinates,
  settings: Settings,
  progress: Progress,
): boolean {
  if (progress.glyphActivated) {
    return false;
  }
  return (
    isGlyphVisible(settings.brightness) && isAdjacent(position, glyphPosition)
  );
}

export function canActivateResonator(
  position: Coordinates,
  resonatorPosition: Coordinates,
  settings: Settings,
  progress: Progress,
): boolean {
  if (progress.resonatorActivated) {
    return false;
  }
  return (
    isAdjacent(position, resonatorPosition) && isAudioResonanceStable(settings)
  );
}

export function isTileLocallyLit(
  playerPos: Coordinates,
  tilePos: Coordinates,
  brightness: number,
): boolean {
  if (brightness >= GLYPH_BRIGHTNESS_THRESHOLD) {
    return true;
  }
  const radius = brightness >= 45 ? 3 : 2;
  return getManhattanDistance(playerPos, tilePos) <= radius;
}
