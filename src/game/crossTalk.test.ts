import { describe, expect, it } from 'vitest';
import { createInitialState, gameReducer } from './gameReducer';
import { CROSS_TALK_CHAMBER as room, ROOMS } from './levels';
import { canMove, getFinaleDiagnostics, getNextCrossTalkStage, isAdjacent, isFinalGateReady, isRoomExitUnlocked } from './rules';
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

  it('keeps both machines and every floor reachable for every stage and extreme setting', () => {
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
            if (tile === 'floor') expect(seen.has(`${x},${y}`)).toBe(true);
            if (tile === 'node' || tile === 'wall') expect(canMove(room, { x, y }, state.progress, state.settings)).toBe(false);
          }));
          expect(queue.some((position) => isAdjacent(position, room.nodePosition))).toBe(true);
          expect(queue.some((position) => isAdjacent(position, room.relayPosition!))).toBe(true);
          expect(seen.has('8,3')).toBe(crossTalkStage === 'powered');
        }
      }
    }
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
