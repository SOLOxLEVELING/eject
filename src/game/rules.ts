import type {
  AudioStatus,
  BindKey,
  Coordinates,
  Direction,
  FinaleCheckItem,
  Progress,
  RoomBlueprint,
  RoomId,
  Settings,
  TileKind,
} from './types';

export const GLYPH_BRIGHTNESS_THRESHOLD = 70;
export const AUDIO_STABLE_MIN = 55;
export const AUDIO_STABLE_MAX = 75;
export const REQUIRED_TERMINAL_KEY: BindKey = 'k';

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

export function isTerminalKeyAuthorized(interactKey: BindKey): boolean {
  return interactKey === REQUIRED_TERMINAL_KEY;
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

export function getFinaleDiagnostics(
  settings: Settings,
  progress: Progress,
): readonly FinaleCheckItem[] {
  const displayReady =
    progress.glyphActivated && isGlyphVisible(settings.brightness);
  let displayDetail = `VERIFIED (${settings.brightness}% ≥ 70%)`;
  if (!progress.glyphActivated) {
    displayDetail = 'SECTOR 01 GLYPH UNLINKED';
  } else if (!isGlyphVisible(settings.brightness)) {
    displayDetail = `BRIGHTNESS ${settings.brightness}% (< 70%)`;
  }

  const audioStatus = getAudioStatus(settings);
  const audioReady =
    progress.resonatorActivated && isAudioResonanceStable(settings);
  let audioDetail = `VERIFIED (${settings.volume}% UNMUTED)`;
  if (!progress.resonatorActivated) {
    audioDetail = 'SECTOR 02 RESONATOR UNLINKED';
  } else if (settings.muted) {
    audioDetail = 'AUDIO BUS MUTED';
  } else if (audioStatus !== 'STABLE') {
    audioDetail = `VOLUME ${audioStatus} (${settings.volume}% ≠ 55–75%)`;
  }

  const controlsReady =
    progress.terminalActivated && isTerminalKeyAuthorized(settings.interactKey);
  const bindUpper = formatBindKey(settings.interactKey);
  let controlsDetail = 'VERIFIED (KEY [K])';
  if (!progress.terminalActivated) {
    controlsDetail = 'SECTOR 03 TERMINAL UNLINKED';
  } else if (!isTerminalKeyAuthorized(settings.interactKey)) {
    controlsDetail = `KEY [${bindUpper}] REVOKED (NEEDS [K])`;
  }

  return [
    {
      id: 'display',
      label: '01 // DISPLAY',
      ready: displayReady,
      detail: displayDetail,
    },
    {
      id: 'audio',
      label: '02 // AUDIO',
      ready: audioReady,
      detail: audioDetail,
    },
    {
      id: 'controls',
      label: '03 // CONTROLS',
      ready: controlsReady,
      detail: controlsDetail,
    },
  ];
}

export function getUnmetFinaleConditions(
  settings: Settings,
  progress: Progress,
): string[] {
  return getFinaleDiagnostics(settings, progress)
    .filter((item) => !item.ready)
    .map((item) => item.detail);
}

export function isFinalGateReady(
  settings: Settings,
  progress: Progress,
): boolean {
  return getFinaleDiagnostics(settings, progress).every((item) => item.ready);
}

export function isRoomExitUnlocked(
  roomId: RoomId,
  progress: Progress,
  settings?: Settings,
): boolean {
  if (roomId === 'display') {
    return progress.glyphActivated;
  }
  if (roomId === 'audio') {
    return progress.resonatorActivated;
  }
  if (roomId === 'controls') {
    return progress.terminalActivated;
  }
  if (roomId === 'finale') {
    return Boolean(settings && isFinalGateReady(settings, progress));
  }
  return false;
}

export function canMove(
  room: RoomBlueprint,
  target: Coordinates,
  progress: Progress,
  settings?: Settings,
): boolean {
  const tile = getTileAt(room, target);
  if (!tile) {
    return false;
  }
  if (tile === 'floor') {
    return true;
  }
  if (tile === 'exit') {
    return isRoomExitUnlocked(room.id, progress, settings);
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

export function canActivateTerminal(
  position: Coordinates,
  terminalPosition: Coordinates,
  settings: Settings,
  progress: Progress,
): boolean {
  if (progress.terminalActivated) {
    return false;
  }
  return (
    isAdjacent(position, terminalPosition) &&
    isTerminalKeyAuthorized(settings.interactKey)
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
