import { describe, expect, it } from 'vitest';
import { createInitialState, gameReducer } from './gameReducer';
import { FRAME_CHAMBER, ROOMS } from './levels';
import { canMove, getFinaleDiagnostics, getTileAt, isFinalGateReady, isRoomExitUnlocked } from './rules';
import type { Coordinates, GameState, Settings } from './types';

const frameState = (): GameState => ({
  ...createInitialState(), phase: 'playing', room: 'frame', position: { ...FRAME_CHAMBER.spawn },
});

// Exhaust the small handcrafted map, including both sides of its only choke point.
function reachable(start: Coordinates, settings: Settings): Set<string> {
  const queue = [start];
  const visited = new Set([`${start.x},${start.y}`]);
  for (let i = 0; i < queue.length; i++) {
    const { x, y } = queue[i];
    for (const next of [{ x: x - 1, y }, { x: x + 1, y }, { x, y: y - 1 }, { x, y: y + 1 }]) {
      const key = `${next.x},${next.y}`;
      if (!visited.has(key) && canMove(FRAME_CHAMBER, next, frameState().progress, settings)) {
        visited.add(key);
        queue.push(next);
      }
    }
  }
  return visited;
}

describe('The Frame / in-game Window Mode', () => {
  it('changes exactly one passage tile and gates its exit without adding a progress flag', () => {
    const state = frameState();
    const open = { ...state.settings, windowMode: 'borderless' as const };
    let changedTiles = 0;
    for (let y = 0; y < FRAME_CHAMBER.height; y++) {
      for (let x = 0; x < FRAME_CHAMBER.width; x++) {
        if (getTileAt(FRAME_CHAMBER, { x, y }, state.settings) !== getTileAt(FRAME_CHAMBER, { x, y }, open)) changedTiles++;
      }
    }
    expect(changedTiles).toBe(1);
    expect(getTileAt(FRAME_CHAMBER, FRAME_CHAMBER.nodePosition, state.settings)).toBe('wall');
    expect(getTileAt(FRAME_CHAMBER, FRAME_CHAMBER.nodePosition, open)).toBe('floor');
    expect(canMove(FRAME_CHAMBER, FRAME_CHAMBER.nodePosition, state.progress, state.settings)).toBe(false);
    expect(canMove(FRAME_CHAMBER, FRAME_CHAMBER.nodePosition, state.progress, open)).toBe(true);
    expect(isRoomExitUnlocked('frame', state.progress, state.settings)).toBe(false);
    expect(canMove(FRAME_CHAMBER, FRAME_CHAMBER.exitPosition, state.progress, state.settings)).toBe(false);
    expect(canMove(FRAME_CHAMBER, FRAME_CHAMBER.exitPosition, state.progress, open)).toBe(true);
    expect(canMove(FRAME_CHAMBER, { x: 4, y: 2 }, state.progress, open)).toBe(false);
    expect(canMove(FRAME_CHAMBER, { x: -1, y: 3 }, state.progress, open)).toBe(false);
  });

  it('keeps the closed exit unreachable and connects every open floor tile from a fresh spawn', () => {
    const state = frameState();
    expect(reachable(state.position, state.settings).has('8,3')).toBe(false);
    const open = { ...state.settings, windowMode: 'borderless' as const };
    const connected = reachable(state.position, open);
    expect(connected.has('8,3')).toBe(true);
    for (let y = 0; y < FRAME_CHAMBER.height; y++) {
      for (let x = 0; x < FRAME_CHAMBER.width; x++) {
        if (canMove(FRAME_CHAMBER, { x, y }, state.progress, open)) expect(connected.has(`${x},${y}`)).toBe(true);
      }
    }
  });

  it('checks restoring the frame at every traversable position: never crushes or strands OP-01', () => {
    const state = gameReducer(frameState(), { type: 'SET_WINDOW_MODE', value: 'borderless' });
    for (let y = 0; y < FRAME_CHAMBER.height; y++) {
      for (let x = 0; x < FRAME_CHAMBER.width; x++) {
        const position = { x, y };
        if (!canMove(FRAME_CHAMBER, position, state.progress, state.settings)) continue;
        const next = gameReducer({ ...state, position }, { type: 'SET_WINDOW_MODE', value: 'framed' });
        expect(next.position).toEqual(position);
        expect(next.progress).toEqual(state.progress);
        expect(canMove(FRAME_CHAMBER, position, next.progress, next.settings)).toBe(true);
        if (x >= FRAME_CHAMBER.nodePosition.x) {
          expect(next.settings.windowMode).toBe('borderless');
          expect(next.feedback).toContain('Return to the entry side');
          expect(reachable(position, next.settings).has('8,3')).toBe(true);
        } else {
          expect(next.settings.windowMode).toBe('framed');
          expect(reachable(position, next.settings).has('1,3')).toBe(true);
        }
      }
    }
  });

  it('allows repeated open/close on the entry side and blocks collision until opened', () => {
    let state = { ...frameState(), position: { x: 3, y: 3 } };
    expect(gameReducer(state, { type: 'MOVE', direction: 'right' }).position).toEqual(state.position);
    for (let i = 0; i < 3; i++) {
      state = gameReducer(state, { type: 'SET_WINDOW_MODE', value: 'borderless' });
      expect(state.settings.windowMode).toBe('borderless');
      state = gameReducer(state, { type: 'SET_WINDOW_MODE', value: 'framed' });
      expect(state.settings.windowMode).toBe('framed');
    }
    state = gameReducer(state, { type: 'SET_WINDOW_MODE', value: 'borderless' });
    state = gameReducer(state, { type: 'MOVE', direction: 'right' });
    expect(state.position).toEqual(FRAME_CHAMBER.nodePosition);
    const rejected = gameReducer(state, { type: 'SET_WINDOW_MODE', value: 'framed' });
    expect(rejected.settings.windowMode).toBe('borderless');
    expect(rejected.position).toEqual(state.position);
    expect(gameReducer(rejected, { type: 'MOVE', direction: 'right' }).position).toEqual({ x: 5, y: 3 });
    expect(gameReducer(rejected, { type: 'RESTART_GAME' })).toEqual(createInitialState());
  });

  it('introduces the option only in The Frame and leaves original maps unchanged', () => {
    for (const room of ['display', 'audio', 'controls'] as const) {
      const state = { ...frameState(), room };
      expect(gameReducer(state, { type: 'SET_WINDOW_MODE', value: 'borderless' })).toBe(state);
    }
    for (const room of [ROOMS.display, ROOMS.audio, ROOMS.controls, ROOMS.finale]) {
      room.tiles.forEach((row, y) => row.forEach((tile, x) => {
        expect(getTileAt(room, { x, y }, { windowMode: 'framed' })).toBe(tile);
        expect(getTileAt(room, { x, y }, { windowMode: 'borderless' })).toBe(tile);
      }));
    }
    const title = createInitialState();
    expect(gameReducer(title, { type: 'SET_WINDOW_MODE', value: 'borderless' })).toBe(title);
  });

  it('preserves exactly three finale checks in both window modes', () => {
    let state: GameState = {
      ...frameState(), room: 'finale',
      settings: { brightness: 70, volume: 65, muted: false, interactKey: 'k', windowMode: 'borderless' },
      progress: { ...frameState().progress, glyphActivated: true, resonatorActivated: true, terminalActivated: true },
    };
    for (const value of ['framed', 'borderless'] as const) {
      state = gameReducer(state, { type: 'SET_WINDOW_MODE', value });
      expect(state.settings.windowMode).toBe(value);
      expect(getFinaleDiagnostics(state.settings, state.progress)).toHaveLength(3);
      expect(isFinalGateReady(state.settings, state.progress)).toBe(true);
      expect(isFinalGateReady({ ...state.settings, brightness: 69 }, state.progress)).toBe(false);
      expect(isFinalGateReady({ ...state.settings, volume: 76 }, state.progress)).toBe(false);
      expect(isFinalGateReady({ ...state.settings, muted: true }, state.progress)).toBe(false);
      expect(isFinalGateReady({ ...state.settings, interactKey: 'e' }, state.progress)).toBe(false);
    }
  });
});
