import { describe, expect, it } from 'vitest';
import { createInitialState, gameReducer } from './gameReducer';
import { CROSS_TALK_CHAMBER as room, ROOMS } from './levels';
import { canMove, getFinaleDiagnostics, getNextCrossTalkStage, getTileAt, isAdjacent, isFinalGateReady, isRoomExitUnlocked } from './rules';
import type { Coordinates, GameState, Progress } from './types';

function crossState(position: Coordinates = room.spawn, crossTalkStage: Progress['crossTalkStage'] = 'unlinked'): GameState {
  const initial = createInitialState();
  return {
    ...initial, phase: 'playing', room: 'crosstalk', position,
    settings: { ...initial.settings, brightness: 70, volume: 65, muted: false, interactKey: 'k' },
    progress: { ...initial.progress, crossTalkStage },
  };
}

function interact(state: GameState) {
  return getNextCrossTalkStage(room, state.position, state.settings, state.progress);
}

describe('Cross-Talk: optical carrier, then acoustic relay', () => {
  it('requires light and orthogonal proximity at the lens, not just valid settings or old flags', () => {
    const state = crossState({ x: 1, y: 1 });
    expect(interact({ ...state, settings: { ...state.settings, brightness: 69 } })).toBe('unlinked');
    expect(interact(state)).toBe('routed');
    expect(interact({ ...state, position: { x: 1, y: 2 } })).toBe('unlinked');
    expect(interact({ ...state, position: room.spawn })).toBe('unlinked');
    expect(interact({ ...state, position: { x: 5, y: 5 }, progress: { glyphActivated: true, resonatorActivated: true, terminalActivated: true, crossTalkStage: 'unlinked' } })).toBe('unlinked');
  });

  it('cannot activate the relay before routing, even with a stable unmuted signal', () => {
    let state = crossState({ x: 5, y: 5 });
    state = gameReducer(state, { type: 'INTERACT' });
    expect(state.progress.crossTalkStage).toBe('unlinked');
    expect(state.feedback).toContain('No optical carrier');
    expect(isRoomExitUnlocked('crosstalk', state.progress, state.settings)).toBe(false);
    expect(interact(crossState({ x: 1, y: 1 }, 'routed'))).toBe('routed');
    expect(interact(crossState(room.spawn, 'routed'))).toBe('routed');
  });

  it('uses the original inclusive audio bounds and mute precedence at the distant relay', () => {
    const state = crossState({ x: 5, y: 5 }, 'routed');
    for (const volume of [54, 55, 75, 76]) {
      expect(interact({ ...state, settings: { ...state.settings, volume } })).toBe(volume === 55 || volume === 75 ? 'powered' : 'routed');
      expect(interact({ ...state, settings: { ...state.settings, volume, muted: true } })).toBe('routed');
    }
    // Light was captured, not a simultaneous live checklist: it may now be dark.
    expect(interact({ ...state, settings: { ...state.settings, brightness: 0 } })).toBe('powered');
  });

  it('latches each step without changing original flags or settings, then resets on restart', () => {
    let state = crossState({ x: 1, y: 1 });
    const original = { ...state.progress };
    const settings = { ...state.settings };
    state = gameReducer(state, { type: 'INTERACT' });
    expect(state.progress).toEqual({ ...original, crossTalkStage: 'routed' });
    expect(state.settings).toEqual(settings);
    state = gameReducer(state, { type: 'SET_BRIGHTNESS', value: 0 });
    state = gameReducer({ ...state, position: { x: 5, y: 5 } }, { type: 'INTERACT' });
    expect(state.progress).toEqual({ ...original, crossTalkStage: 'powered' });
    for (const action of [{ type: 'SET_VOLUME', value: 0 }, { type: 'SET_MUTED', value: true }, { type: 'SET_INTERACT_KEY', value: 'e' }] as const) state = gameReducer(state, action);
    expect(isRoomExitUnlocked('crosstalk', state.progress, state.settings)).toBe(true);
    expect(gameReducer(state, { type: 'INTERACT' }).progress.crossTalkStage).toBe('powered');
    const bumpedRelay = gameReducer(state, { type: 'MOVE', direction: 'right' });
    expect(bumpedRelay.position).toEqual(state.position);
    expect(bumpedRelay.feedback).toContain('exit is powered');
    expect(gameReducer(state, { type: 'RESTART_GAME' })).toEqual(createInitialState());
    expect(createInitialState().progress.crossTalkStage).toBe('unlinked');
  });

  it('opens the whole room in darkness and prevents a bright bypass for every circuit stage', () => {
    for (const crossTalkStage of ['unlinked', 'routed', 'powered'] as const) {
      for (const brightness of [0, 100]) {
        for (const muted of [true, false]) {
          const state = crossState(room.spawn, crossTalkStage);
          state.settings = { ...state.settings, brightness, muted, volume: brightness, windowMode: muted ? 'framed' : 'borderless' };
          const queue = [room.spawn];
          const seen = new Set([`${room.spawn.x},${room.spawn.y}`]);
          for (let i = 0; i < queue.length; i++) {
            const { x, y } = queue[i];
            for (const next of [{ x: x - 1, y }, { x: x + 1, y }, { x, y: y - 1 }, { x, y: y + 1 }]) {
              const key = `${next.x},${next.y}`;
              if (!seen.has(key) && canMove(room, next, state.progress, state.settings)) {
                seen.add(key); queue.push(next);
              }
            }
          }
          room.tiles.forEach((row, y) => row.forEach((tile, x) => {
            if (tile === 'floor' || tile === 'watcher') {
              expect(seen.has(`${x},${y}`), `${x},${y} at brightness ${brightness}`).toBe(brightness === 0 || x < 4);
            }
            if (tile === 'node' || tile === 'wall') expect(canMove(room, { x, y }, state.progress, state.settings)).toBe(false);
          }));
          expect(queue.some((position) => isAdjacent(position, room.nodePosition))).toBe(true);
          expect(queue.some((position) => isAdjacent(position, room.relayPosition!))).toBe(brightness === 0);
          expect(seen.has('8,3')).toBe(brightness === 0 && crossTalkStage === 'powered');
        }
      }
    }
  });

  it('blocks bright entry from both sides, opens below the reveal threshold, and keeps the occupied tile valid', () => {
    for (const brightness of [70, 100]) {
      for (const [x, direction] of [[3, 'right'], [5, 'left']] as const) {
        const state = crossState({ x, y: 3 });
        state.settings.brightness = brightness;
        expect(getTileAt(room, { x: 4, y: 3 }, state.settings)).toBe('wall');
        const blocked = gameReducer(state, { type: 'MOVE', direction });
        expect(blocked.position).toEqual(state.position);
        expect(blocked.feedback).toContain('WATCHER');
      }
    }
    for (const brightness of [0, 20, 69]) {
      for (const [x, direction] of [[3, 'right'], [5, 'left']] as const) {
        let state = crossState({ x, y: 3 });
        state = gameReducer(state, { type: 'SET_BRIGHTNESS', value: brightness });
        state = gameReducer(state, { type: 'MOVE', direction });
        expect(state.position).toEqual({ x: 4, y: 3 });
        for (const value of [0, 20, 69, 70, 100]) {
          const changed = gameReducer(state, { type: 'SET_BRIGHTNESS', value });
          expect(changed.position).toEqual(state.position);
          expect(changed.settings.brightness).toBe(value >= 70 ? brightness : value);
          expect(canMove(room, changed.position, changed.progress, changed.settings)).toBe(true);
          if (value >= 70) expect(changed.feedback).toContain('passage occupied');
          expect(gameReducer(changed, { type: 'MOVE', direction }).position).toEqual({ x: x === 3 ? 5 : 3, y: 3 });
        }
      }
    }
  });

  it('can recover from either side at every floor tile after arbitrary brightness changes', () => {
    room.tiles.forEach((row, y) => row.forEach((tile, x) => {
      if (tile !== 'floor' && tile !== 'watcher') return;
      let state = crossState({ x, y });
      state.settings.brightness = 20;
      for (const value of [100, 0, 70, 69, 20]) {
        state = gameReducer(state, { type: 'SET_BRIGHTNESS', value });
        expect(canMove(room, state.position, state.progress, state.settings)).toBe(true);
      }
      // Every legal tile can return to spawn by lowering the light; no relocation required.
      const queue = [state.position];
      const seen = new Set([`${x},${y}`]);
      for (let i = 0; i < queue.length; i++) {
        const p = queue[i];
        for (const next of [{ x: p.x - 1, y: p.y }, { x: p.x + 1, y: p.y }, { x: p.x, y: p.y - 1 }, { x: p.x, y: p.y + 1 }]) {
          const key = `${next.x},${next.y}`;
          if (!seen.has(key) && canMove(room, next, state.progress, state.settings)) {
            seen.add(key); queue.push(next);
          }
        }
      }
      expect(seen.has(`${room.spawn.x},${room.spawn.y}`)).toBe(true);
    }));
  });

  it('completes bright receiver → dark crossing → audio relay → finale using real moves', () => {
    let state = crossState();
    const move = (...directions: Array<'up' | 'down' | 'left' | 'right'>) => {
      for (const direction of directions) state = gameReducer(state, { type: 'MOVE', direction });
    };
    move('up', 'up');
    state = gameReducer(state, { type: 'INTERACT' });
    expect(state.progress.crossTalkStage).toBe('routed');
    move('down', 'down', 'right', 'right', 'right');
    expect(state.position).toEqual({ x: 3, y: 3 });
    state = gameReducer(state, { type: 'SET_BRIGHTNESS', value: 20 });
    move('right', 'right', 'down', 'down');
    expect(state.position).toEqual({ x: 5, y: 5 });
    state = gameReducer(state, { type: 'SET_VOLUME', value: 54 });
    state = gameReducer(state, { type: 'INTERACT' });
    expect(state.progress.crossTalkStage).toBe('routed');
    state = gameReducer(state, { type: 'SET_VOLUME', value: 55 });
    state = gameReducer(state, { type: 'INTERACT' });
    expect(state.progress.crossTalkStage).toBe('powered');
    // Restoring light beyond the passage is safe and cannot undo the relay.
    state = gameReducer(state, { type: 'SET_BRIGHTNESS', value: 100 });
    move('up', 'up', 'up', 'up', 'right', 'right', 'down', 'down', 'right');
    expect(state.room).toBe('finale');
  });

  it('gates exit movement on the relay and does not add a fourth finale prerequisite', () => {
    for (const crossTalkStage of ['unlinked', 'routed', 'powered'] as const) {
      const state = crossState({ x: 7, y: 3 }, crossTalkStage);
      const next = gameReducer(state, { type: 'MOVE', direction: 'right' });
      expect(next.room).toBe(crossTalkStage === 'powered' ? 'finale' : 'crosstalk');
      const complete = { ...state.progress, glyphActivated: true, resonatorActivated: true, terminalActivated: true };
      expect(getFinaleDiagnostics(state.settings, complete)).toHaveLength(3);
      expect(isFinalGateReady(state.settings, complete)).toBe(true);
      expect(isFinalGateReady(state.settings, { ...complete, glyphActivated: false })).toBe(false);
      expect(isFinalGateReady({ ...state.settings, muted: true }, complete)).toBe(false);
    }
    const state = crossState({ x: 1, y: 1 });
    expect(getNextCrossTalkStage(ROOMS.display, state.position, state.settings, state.progress)).toBe('unlinked');
    expect(gameReducer({ ...state, phase: 'cinematic' }, { type: 'INTERACT' }).progress.crossTalkStage).toBe('unlinked');
  });
});
