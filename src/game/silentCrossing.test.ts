import { describe, expect, it } from 'vitest';
import { createInitialState, gameReducer } from './gameReducer';
import { AUDIO_CHAMBER as room } from './levels';
import { canMove, getTileAt, isAdjacent } from './rules';
import type { Coordinates, GameState } from './types';

function audioState(position: Coordinates = room.spawn): GameState {
  const state = createInitialState();
  return { ...state, phase: 'playing', room: 'audio', position,
    settings: { ...state.settings, volume: 65, muted: false } };
}

function reachable(state: GameState) {
  const queue = [state.position];
  const seen = new Set([`${state.position.x},${state.position.y}`]);
  for (let i = 0; i < queue.length; i++) {
    const { x, y } = queue[i];
    for (const next of [{ x: x - 1, y }, { x: x + 1, y }, { x, y: y - 1 }, { x, y: y + 1 }]) {
      const key = `${next.x},${next.y}`;
      if (!seen.has(key) && canMove(room, next, state.progress, state.settings)) {
        seen.add(key); queue.push(next);
      }
    }
  }
  return { queue, seen };
}

describe('Silent Crossing', () => {
  it('uses all three real crossings, blocking unmuted entry from either side at any volume', () => {
    expect(room.tiles.flat().filter(tile => tile === 'soundgate')).toHaveLength(3);
    for (const y of [1, 3, 5]) {
      for (const volume of [0, 54, 55, 75, 76, 100]) {
        for (const [x, direction] of [[5, 'right'], [7, 'left']] as const) {
          let state = audioState({ x, y });
          state.settings.volume = volume;
          expect(getTileAt(room, { x: 6, y }, state.settings)).toBe('wall');
          expect(gameReducer(state, { type: 'MOVE', direction }).position).toEqual(state.position);
          state = gameReducer(state, { type: 'SET_MUTED', value: true });
          expect(getTileAt(room, { x: 6, y }, state.settings)).toBe('floor');
          expect(gameReducer(state, { type: 'MOVE', direction }).position).toEqual({ x: 6, y });
        }
      }
    }
  });

  it('rejects both unmute actions on every occupied crossing without moving or invalidating OP-01', () => {
    for (const y of [1, 3, 5]) {
      const state = gameReducer(audioState({ x: 6, y }), { type: 'SET_MUTED', value: true });
      for (const action of [{ type: 'TOGGLE_MUTE' }, { type: 'SET_MUTED', value: false }] as const) {
        const rejected = gameReducer(state, action);
        expect(rejected.settings.muted).toBe(true);
        expect(rejected.position).toEqual(state.position);
        expect(rejected.feedback).toContain('occupied');
        expect(canMove(room, rejected.position, rejected.progress, rejected.settings)).toBe(true);
        for (const direction of ['left', 'right'] as const) {
          const clear = gameReducer(rejected, { type: 'MOVE', direction });
          expect(gameReducer(clear, action).settings.muted).toBe(false);
        }
      }
    }
  });

  it('has no active-audio bypass, and silence connects every floor and the latched exit', () => {
    const state = audioState();
    const loud = reachable(state);
    expect(loud.queue.some(p => p.x >= 6)).toBe(false);
    expect(loud.queue.some(p => isAdjacent(p, room.nodePosition))).toBe(true);
    state.settings.muted = true;
    expect(reachable(state).seen.has('7,3')).toBe(true);
    expect(reachable(state).seen.has('8,3')).toBe(false);
    state.progress.resonatorActivated = true;
    const silent = reachable(state);
    room.tiles.forEach((row, y) => row.forEach((tile, x) => {
      if (tile === 'floor' || tile === 'soundgate' || tile === 'exit') expect(silent.seen.has(`${x},${y}`)).toBe(true);
    }));
  });

  it('can always recover from either side after sound changes, including before activation', () => {
    room.tiles.forEach((row, y) => row.forEach((tile, x) => {
      if (tile !== 'floor' && tile !== 'soundgate') return;
      let state = audioState({ x, y });
      state.settings.muted = true;
      for (const action of [{ type: 'SET_MUTED', value: false }, { type: 'TOGGLE_MUTE' }, { type: 'SET_MUTED', value: true }] as const) {
        state = gameReducer(state, action);
        expect(canMove(room, state.position, state.progress, state.settings)).toBe(true);
      }
      expect(reachable(state).seen.has(`${room.spawn.x},${room.spawn.y}`)).toBe(true);
    }));
  });

  it('still requires a stable unmuted resonator, then latches it through mute, crossing and exit', () => {
    for (const volume of [54, 55, 75, 76]) {
      for (const muted of [true, false]) {
        const state = audioState({ x: 4, y: 3 });
        state.settings = { ...state.settings, volume, muted };
        expect(gameReducer(state, { type: 'INTERACT' }).progress.resonatorActivated).toBe(!muted && (volume === 55 || volume === 75));
      }
    }
    let state = audioState();
    for (let i = 0; i < 3; i++) state = gameReducer(state, { type: 'MOVE', direction: 'right' });
    state = gameReducer(state, { type: 'INTERACT' });
    expect(state.progress.resonatorActivated).toBe(true);
    state = gameReducer(state, { type: 'TOGGLE_MUTE' });
    state = gameReducer(state, { type: 'SET_VOLUME', value: 0 });
    for (let i = 0; i < 4; i++) state = gameReducer(state, { type: 'MOVE', direction: 'right' });
    expect(state.room).toBe('controls');
    expect(state.progress.resonatorActivated).toBe(true);
    expect(gameReducer(state, { type: 'RESTART_GAME' })).toEqual(createInitialState());
  });
});
