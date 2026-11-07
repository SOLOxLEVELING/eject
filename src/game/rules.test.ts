import { describe, expect, it } from 'vitest';
import { createInitialState, gameReducer } from './gameReducer';
import {
  AUDIO_CHAMBER,
  CONTROLS_CHAMBER,
  DISPLAY_CHAMBER,
  FINALE_CHAMBER,
} from './levels';
import {
  canActivateGlyph,
  canActivateResonator,
  canActivateTerminal,
  canMove,
  clampPercentage,
  formatBindKey,
  getAudioStatus,
  getNextPosition,
  getUnmetFinaleConditions,
  isAdjacent,
  isAudioResonanceStable,
  isFinalGateReady,
  isGlyphVisible,
  isRoomExitUnlocked,
  isTerminalKeyAuthorized,
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

const ALL_FLAGS_COMPLETE: Progress = {
  glyphActivated: true,
  resonatorActivated: true,
  terminalActivated: true,
};

const BASE_SETTINGS: Settings = {
  brightness: 20,
  volume: 20,
  muted: true,
  interactKey: 'e',
};

const VALID_FINALE_SETTINGS: Settings = {
  brightness: 70,
  volume: 65,
  muted: false,
  interactKey: 'k',
};

describe('Stage 1–4 complete game rules', () => {
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
    expect(getAudioStatus({ volume: 54, muted: false })).toBe('TOO LOW');
    expect(isAudioResonanceStable({ volume: 54, muted: false })).toBe(false);

    expect(getAudioStatus({ volume: 55, muted: false })).toBe('STABLE');
    expect(isAudioResonanceStable({ volume: 55, muted: false })).toBe(true);

    expect(getAudioStatus({ volume: 75, muted: false })).toBe('STABLE');
    expect(isAudioResonanceStable({ volume: 75, muted: false })).toBe(true);

    expect(getAudioStatus({ volume: 76, muted: false })).toBe('TOO HIGH');
    expect(isAudioResonanceStable({ volume: 76, muted: false })).toBe(false);

    expect(getAudioStatus({ volume: 54, muted: true })).toBe('MUTED');
    expect(getAudioStatus({ volume: 55, muted: true })).toBe('MUTED');
    expect(getAudioStatus({ volume: 75, muted: true })).toBe('MUTED');
    expect(getAudioStatus({ volume: 76, muted: true })).toBe('MUTED');
    expect(isAudioResonanceStable({ volume: 55, muted: true })).toBe(false);
    expect(isAudioResonanceStable({ volume: 75, muted: true })).toBe(false);

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

  it('rejects E and F on Room 3 terminal and requires interactKey K with adjacency', () => {
    const termPos = CONTROLS_CHAMBER.nodePosition; // (5, 2)
    const adjPos = { x: 5, y: 3 };

    expect(isTerminalKeyAuthorized('e')).toBe(false);
    expect(isTerminalKeyAuthorized('f')).toBe(false);
    expect(isTerminalKeyAuthorized('k')).toBe(true);

    expect(
      canActivateTerminal(
        adjPos,
        termPos,
        { ...BASE_SETTINGS, interactKey: 'e' },
        LOCKED_PROGRESS,
      ),
    ).toBe(false);
    expect(
      canActivateTerminal(
        adjPos,
        termPos,
        { ...BASE_SETTINGS, interactKey: 'f' },
        LOCKED_PROGRESS,
      ),
    ).toBe(false);
    // Distant with K fails
    expect(
      canActivateTerminal(
        { x: 1, y: 3 },
        termPos,
        { ...BASE_SETTINGS, interactKey: 'k' },
        LOCKED_PROGRESS,
      ),
    ).toBe(false);
    // Adjacent with K succeeds
    expect(
      canActivateTerminal(
        adjPos,
        termPos,
        { ...BASE_SETTINGS, interactKey: 'k' },
        LOCKED_PROGRESS,
      ),
    ).toBe(true);
  });

  it('requires all three completed room flags AND valid live settings for the Finale gate', () => {
    // Valid live settings but missing any room flag -> fails (no skipped flags)
    expect(
      isFinalGateReady(VALID_FINALE_SETTINGS, {
        glyphActivated: false,
        resonatorActivated: true,
        terminalActivated: true,
      }),
    ).toBe(false);
    expect(
      isFinalGateReady(VALID_FINALE_SETTINGS, {
        glyphActivated: true,
        resonatorActivated: false,
        terminalActivated: true,
      }),
    ).toBe(false);
    expect(
      isFinalGateReady(VALID_FINALE_SETTINGS, {
        glyphActivated: true,
        resonatorActivated: true,
        terminalActivated: false,
      }),
    ).toBe(false);

    // All flags complete + valid live settings -> ready!
    expect(isFinalGateReady(VALID_FINALE_SETTINGS, ALL_FLAGS_COMPLETE)).toBe(true);
    expect(
      canMove(
        FINALE_CHAMBER,
        FINALE_CHAMBER.exitPosition,
        ALL_FLAGS_COMPLETE,
        VALID_FINALE_SETTINGS,
      ),
    ).toBe(true);

    // Breaking any single live setting invalidates the final gate and reports unmet prerequisite
    const lowBrightness = { ...VALID_FINALE_SETTINGS, brightness: 69 };
    expect(isFinalGateReady(lowBrightness, ALL_FLAGS_COMPLETE)).toBe(false);
    expect(getUnmetFinaleConditions(lowBrightness, ALL_FLAGS_COMPLETE)).toEqual([
      'BRIGHTNESS 69% (< 70%)',
    ]);

    const mutedAudio = { ...VALID_FINALE_SETTINGS, muted: true };
    expect(isFinalGateReady(mutedAudio, ALL_FLAGS_COMPLETE)).toBe(false);
    expect(getUnmetFinaleConditions(mutedAudio, ALL_FLAGS_COMPLETE)).toEqual([
      'AUDIO BUS MUTED',
    ]);

    const highVolume = { ...VALID_FINALE_SETTINGS, volume: 76 };
    expect(isFinalGateReady(highVolume, ALL_FLAGS_COMPLETE)).toBe(false);
    expect(getUnmetFinaleConditions(highVolume, ALL_FLAGS_COMPLETE)).toEqual([
      'VOLUME TOO HIGH (76% ≠ 55–75%)',
    ]);

    const wrongKey = { ...VALID_FINALE_SETTINGS, interactKey: 'e' as const };
    expect(isFinalGateReady(wrongKey, ALL_FLAGS_COMPLETE)).toBe(false);
    expect(getUnmetFinaleConditions(wrongKey, ALL_FLAGS_COMPLETE)).toEqual([
      'KEY [E] REVOKED (NEEDS [K])',
    ]);
  });

  it('completes full start-to-win flow across all 4 rooms and resets all state on restart', () => {
    let state = gameReducer(createInitialState(), { type: 'START_GAME' });

    // --- ROOM 1: DISPLAY ---
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (3,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (4,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (5,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'up' }); // (5,2)
    state = gameReducer(state, { type: 'MOVE', direction: 'up' }); // (5,1)
    state = gameReducer(state, { type: 'SET_BRIGHTNESS', value: 75 });
    state = gameReducer(state, { type: 'INTERACT' });
    expect(state.progress.glyphActivated).toBe(true);

    state = gameReducer(state, { type: 'MOVE', direction: 'down' }); // (5,2)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (6,2)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (7,2)
    state = gameReducer(state, { type: 'MOVE', direction: 'down' }); // (7,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (8,3) -> Room 2
    expect(state.room).toBe('audio');

    // --- ROOM 2: AUDIO ---
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (2,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (3,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (4,3)
    state = gameReducer(state, { type: 'SET_MUTED', value: false });
    state = gameReducer(state, { type: 'SET_VOLUME', value: 65 });
    state = gameReducer(state, { type: 'INTERACT' });
    expect(state.progress.resonatorActivated).toBe(true);

    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (5,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (6,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (7,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (8,3) -> Room 3
    expect(state.room).toBe('controls');
    expect(state.position).toEqual({ x: 1, y: 3 });

    // --- ROOM 3: CONTROLS ---
    // Walk along y=3 to (5,3) adjacent to terminal at (5,2)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (2,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (3,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (4,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (5,3)
    expect(state.position).toEqual({ x: 5, y: 3 });

    // Interacting with default E is rejected
    state = gameReducer(state, { type: 'INTERACT' });
    expect(state.progress.terminalActivated).toBe(false);
    expect(isRoomExitUnlocked('controls', state.progress)).toBe(false);

    // Pressing unbound K before rebinding is rejected
    state = gameReducer(state, { type: 'REJECT_UNBOUND_KEY', key: 'k' });
    expect(state.progress.terminalActivated).toBe(false);

    // Rebind Interact to K and activate terminal
    state = gameReducer(state, { type: 'SET_INTERACT_KEY', value: 'k' });
    state = gameReducer(state, { type: 'INTERACT' });
    expect(state.progress.terminalActivated).toBe(true);

    // Walk East to (8,3) -> enters Finale ('finale')
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (6,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (7,3)
    state = gameReducer(state, { type: 'MOVE', direction: 'right' }); // (8,3) -> Finale
    expect(state.room).toBe('finale');
    expect(state.position).toEqual({ x: 1, y: 3 });

    // --- ROOM 4: FINALE ---
    // Walk to (7,3) right next to final exit at (8,3)
    for (let i = 0; i < 6; i++) {
      state = gameReducer(state, { type: 'MOVE', direction: 'right' });
    }
    expect(state.position).toEqual({ x: 7, y: 3 });

    // Break a live setting (drop brightness to 50%) -> stepping onto exit (8,3) is blocked!
    state = gameReducer(state, { type: 'SET_BRIGHTNESS', value: 50 });
    state = gameReducer(state, { type: 'MOVE', direction: 'right' });
    expect(state.phase).toBe('playing');
    expect(state.position).toEqual({ x: 7, y: 3 });

    // Restore brightness to 75% -> stepping onto exit (8,3) wins the game!
    state = gameReducer(state, { type: 'SET_BRIGHTNESS', value: 75 });
    state = gameReducer(state, { type: 'MOVE', direction: 'right' });
    expect(state.phase).toBe('won');

    // --- FULL RESTART ---
    state = gameReducer(state, { type: 'RESTART_GAME' });
    expect(state).toEqual(createInitialState());
  });

  it('keeps cinematic gameplay inert and gives skipped and completed openings the same initial room', () => {
    const title = createInitialState();
    const opening = gameReducer(title, { type: 'START_INTRO' });
    expect(opening).toEqual({ ...title, phase: 'cinematic' });
    expect(gameReducer(opening, { type: 'MOVE', direction: 'right' })).toBe(opening);
    expect(gameReducer(opening, { type: 'INTERACT' })).toBe(opening);
    expect(gameReducer(opening, { type: 'REJECT_UNBOUND_KEY', key: 'k' })).toBe(opening);
    expect(gameReducer(opening, { type: 'START_GAME' })).toEqual(
      gameReducer(title, { type: 'START_GAME' }),
    );
  });

  it('ignores duplicate story callbacks after play or escape', () => {
    const playing = gameReducer(createInitialState(), { type: 'START_GAME' });
    const moved = gameReducer(playing, { type: 'MOVE', direction: 'right' });
    expect(gameReducer(moved, { type: 'START_GAME' })).toBe(moved);
    expect(gameReducer(moved, { type: 'START_INTRO' })).toBe(moved);
    const won = { ...moved, phase: 'won' as const };
    expect(gameReducer(won, { type: 'START_GAME' })).toBe(won);
    expect(gameReducer(won, { type: 'START_INTRO' })).toBe(won);
  });

  it('restarts every phase at a clean title and can begin a fresh opening', () => {
    for (const phase of ['intro', 'cinematic', 'playing', 'won'] as const) {
      const dirtyState = {
        ...createInitialState(), phase, room: 'finale' as const,
        settings: { ...VALID_FINALE_SETTINGS },
        progress: { ...ALL_FLAGS_COMPLETE }, position: { x: 7, y: 3 },
      };
      const reset = gameReducer(dirtyState, { type: 'RESTART_GAME' });
      expect(reset).toEqual(createInitialState());
      expect(gameReducer(dirtyState, { type: 'RETURN_TO_INTRO' })).toEqual(reset);
      expect(gameReducer(reset, { type: 'START_INTRO' })).toEqual({ ...reset, phase: 'cinematic' });
    }
  });
});
