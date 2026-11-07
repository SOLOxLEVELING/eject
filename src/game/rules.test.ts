import { describe, expect, it } from 'vitest';
import { createInitialState, gameReducer } from './gameReducer';
import { AUDIO_CHAMBER, DISPLAY_CHAMBER } from './levels';
import {
  canActivateGlyph,
  canActivateResonator,
  canMove,
  clampPercentage,
  formatBindKey,
  getAudioStatus,
  getNextPosition,
  isAdjacent,
  isAudioResonanceStable,
  isGlyphVisible,
  isRoomExitUnlocked,
  isWithinBounds,
  sanitizeSettings,
} from './rules';
import type { Progress, Settings } from './types';

const LOCKED_PROGRESS: Progress = {
  glyphActivated: false,
  resonatorActivated: false,
  terminalActivated: false,
};

const UNLOCKED_DISPLAY_PROGRESS: Progress = {
  glyphActivated: true,
  resonatorActivated: false,
  terminalActivated: false,
};

const BASE_SETTINGS: Settings = {
  brightness: 20,
  volume: 20,
  muted: true,
  interactKey: 'e',
};

describe('Stage 1–3 rules', () => {
  it('clamps settings percentages to integer bounds [0, 100] and formats bind key', () => {
    expect(clampPercentage(-12)).toBe(0);
    expect(clampPercentage(20.4)).toBe(20);
    expect(clampPercentage(145)).toBe(100);
    expect(formatBindKey('e')).toBe('E');

    expect(
      sanitizeSettings({
        brightness: 108,
        volume: -5,
        muted: true,
        interactKey: 'k',
      }),
    ).toEqual({
      brightness: 100,
      volume: 0,
      muted: true,
      interactKey: 'k',
    });
  });

  it('enforces movement boundaries and wall/node collision', () => {
    expect(isWithinBounds(DISPLAY_CHAMBER, { x: -1, y: 3 })).toBe(false);
    expect(isWithinBounds(DISPLAY_CHAMBER, { x: 9, y: 3 })).toBe(false);
    expect(isWithinBounds(DISPLAY_CHAMBER, { x: 2, y: 7 })).toBe(false);
    expect(canMove(DISPLAY_CHAMBER, { x: -1, y: 3 }, LOCKED_PROGRESS)).toBe(false);

    expect(canMove(DISPLAY_CHAMBER, { x: 0, y: 3 }, LOCKED_PROGRESS)).toBe(false);
    expect(canMove(DISPLAY_CHAMBER, { x: 2, y: 2 }, LOCKED_PROGRESS)).toBe(false);
    expect(canMove(DISPLAY_CHAMBER, { x: 6, y: 3 }, LOCKED_PROGRESS)).toBe(false);

    expect(
      canMove(DISPLAY_CHAMBER, DISPLAY_CHAMBER.nodePosition, LOCKED_PROGRESS),
    ).toBe(false);

    expect(canMove(DISPLAY_CHAMBER, { x: 3, y: 3 }, LOCKED_PROGRESS)).toBe(true);
    expect(
      canMove(
        DISPLAY_CHAMBER,
        getNextPosition(DISPLAY_CHAMBER.spawn, 'right'),
        LOCKED_PROGRESS,
      ),
    ).toBe(true);
  });

  it('reveals glyph only at brightness >= 70 (69 fails, 70 succeeds)', () => {
    expect(isGlyphVisible(0)).toBe(false);
    expect(isGlyphVisible(69)).toBe(false);
    expect(isGlyphVisible(70)).toBe(true);
    expect(isGlyphVisible(100)).toBe(true);
  });

  it('checks orthogonal adjacency and gates glyph activation on proximity and brightness', () => {
    const glyphPos = DISPLAY_CHAMBER.nodePosition; // (6, 1)

    expect(isAdjacent({ x: 5, y: 1 }, glyphPos)).toBe(true);
    expect(isAdjacent({ x: 6, y: 2 }, glyphPos)).toBe(true);
    expect(isAdjacent({ x: 7, y: 1 }, glyphPos)).toBe(true);

    expect(isAdjacent({ x: 5, y: 2 }, glyphPos)).toBe(false);
    expect(isAdjacent({ x: 6, y: 1 }, glyphPos)).toBe(false);
    expect(isAdjacent({ x: 2, y: 3 }, glyphPos)).toBe(false);

    expect(
      canActivateGlyph(
        { x: 5, y: 1 },
        glyphPos,
        { ...BASE_SETTINGS, brightness: 69 },
        LOCKED_PROGRESS,
      ),
    ).toBe(false);

    expect(
      canActivateGlyph(
        { x: 2, y: 3 },
        glyphPos,
        { ...BASE_SETTINGS, brightness: 70 },
        LOCKED_PROGRESS,
      ),
    ).toBe(false);

    expect(
      canActivateGlyph(
        { x: 5, y: 1 },
        glyphPos,
        { ...BASE_SETTINGS, brightness: 70 },
        LOCKED_PROGRESS,
      ),
    ).toBe(true);
  });

  it('evaluates audio status across 54/55/75/76 bounds and enforces mute precedence', () => {
    // Unmuted boundary checks: 54 fails (TOO LOW), 55 & 75 succeed (STABLE), 76 fails (TOO HIGH)
    expect(getAudioStatus({ volume: 54, muted: false })).toBe('TOO LOW');
    expect(isAudioResonanceStable({ volume: 54, muted: false })).toBe(false);

    expect(getAudioStatus({ volume: 55, muted: false })).toBe('STABLE');
    expect(isAudioResonanceStable({ volume: 55, muted: false })).toBe(true);

    expect(getAudioStatus({ volume: 75, muted: false })).toBe('STABLE');
    expect(isAudioResonanceStable({ volume: 75, muted: false })).toBe(true);

    expect(getAudioStatus({ volume: 76, muted: false })).toBe('TOO HIGH');
    expect(isAudioResonanceStable({ volume: 76, muted: false })).toBe(false);

    // Muted always takes precedence and fails even inside 55-75
    expect(getAudioStatus({ volume: 54, muted: true })).toBe('MUTED');
    expect(getAudioStatus({ volume: 55, muted: true })).toBe('MUTED');
    expect(getAudioStatus({ volume: 75, muted: true })).toBe('MUTED');
    expect(getAudioStatus({ volume: 76, muted: true })).toBe('MUTED');
    expect(isAudioResonanceStable({ volume: 55, muted: true })).toBe(false);
    expect(isAudioResonanceStable({ volume: 75, muted: true })).toBe(false);

    // Adjacency + audio status gating on resonator at (4, 2)
    const resPos = AUDIO_CHAMBER.nodePosition; // (4, 2)
    const adjPos = { x: 4, y: 3 };

    expect(
      canActivateResonator(
        adjPos,
        resPos,
        { ...BASE_SETTINGS, volume: 54, muted: false },
        UNLOCKED_DISPLAY_PROGRESS,
      ),
    ).toBe(false);
    expect(
      canActivateResonator(
        adjPos,
        resPos,
        { ...BASE_SETTINGS, volume: 76, muted: false },
        UNLOCKED_DISPLAY_PROGRESS,
      ),
    ).toBe(false);
    expect(
      canActivateResonator(
        adjPos,
        resPos,
        { ...BASE_SETTINGS, volume: 60, muted: true },
        UNLOCKED_DISPLAY_PROGRESS,
      ),
    ).toBe(false);
    expect(
      canActivateResonator(
        { x: 1, y: 3 },
        resPos,
        { ...BASE_SETTINGS, volume: 60, muted: false },
        UNLOCKED_DISPLAY_PROGRESS,
      ),
    ).toBe(false);
    expect(
      canActivateResonator(
        adjPos,
        resPos,
        { ...BASE_SETTINGS, volume: 55, muted: false },
        UNLOCKED_DISPLAY_PROGRESS,
      ),
    ).toBe(true);
    expect(
      canActivateResonator(
        adjPos,
        resPos,
        { ...BASE_SETTINGS, volume: 75, muted: false },
        UNLOCKED_DISPLAY_PROGRESS,
      ),
    ).toBe(true);
  });

  it('completes Room 1 -> Room 2 -> Room 3 placeholder when resonator is activated at 55-75 unmuted', () => {
    expect(isRoomExitUnlocked('display', LOCKED_PROGRESS)).toBe(false);
    expect(isRoomExitUnlocked('display', UNLOCKED_DISPLAY_PROGRESS)).toBe(true);
    expect(isRoomExitUnlocked('audio', UNLOCKED_DISPLAY_PROGRESS)).toBe(false);

    // 1. Solve Room 1 (DISPLAY)
    let state = gameReducer(createInitialState(), { type: 'START_GAME' });
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (3,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (4,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (5,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'up' }); // (5,2)
    state = gameReducer(state, { type: 'MOVE', direction: 'up' }); // (5,1)
    state = gameReducer(state, { type: 'SET_BRIGHTNESS', value: 70 });
    state = gameReducer(state, { type: 'INTERACT' });
    expect(state.progress.glyphActivated).toBe(true);

    // Walk to Room 1 exit (8,3) -> enters Room 2 ('audio') at (1,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'down' }); // (5,2)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (6,2)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (7,2)
    state = gameReducer(state, { type: 'MOVE', direction: 'down' }); // (7,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (8,3)
    expect(state.room).toBe('audio');
    expect(state.position).toEqual({ x: 1, y: 3 });

    // 2. Walk in Room 2 from (1,3) -> (4,3) adjacent to resonator at (4,2)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (2,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (3,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (4,3)
    expect(state.position).toEqual({ x: 4, y: 3 });

    // Volume 55 while muted=true -> fails
    state = gameReducer(state, { type: 'SET_VOLUME', value: 55 });
    state = gameReducer(state, { type: 'INTERACT' });
    expect(state.progress.resonatorActivated).toBe(false);

    // Unmute at volume 54 -> fails
    state = gameReducer(state, { type: 'SET_MUTED', value: false });
    state = gameReducer(state, { type: 'SET_VOLUME', value: 54 });
    state = gameReducer(state, { type: 'INTERACT' });
    expect(state.progress.resonatorActivated).toBe(false);

    // Unmuted at volume 76 -> fails
    state = gameReducer(state, { type: 'SET_VOLUME', value: 76 });
    state = gameReducer(state, { type: 'INTERACT' });
    expect(state.progress.resonatorActivated).toBe(false);

    // Unmuted at volume 75 -> succeeds!
    state = gameReducer(state, { type: 'SET_VOLUME', value: 75 });
    state = gameReducer(state, { type: 'INTERACT' });
    expect(state.progress.resonatorActivated).toBe(true);
    expect(isRoomExitUnlocked('audio', state.progress)).toBe(true);

    // Walk East from (4,3) -> (5,3) -> (6,3) -> (7,3) -> (8,3) exit into Room 3 placeholder ('controls')
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (5,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (6,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (7,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (8,3)
    expect(state.room).toBe('controls');
    expect(state.settings.brightness).toBe(70);
    expect(state.settings.volume).toBe(75);
    expect(state.settings.muted).toBe(false);
  });
});
