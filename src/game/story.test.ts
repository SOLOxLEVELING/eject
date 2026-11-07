import { describe, expect, it } from 'vitest';
import { ENDING_BEATS, ENDING_RECAP } from './endingStory';
import { ROOMS } from './levels';
import { ROOM_STORY } from './roomStory';

describe('context dialogue and ending', () => {
  it('gives exactly the existing six rooms short entry, requested hint and success lines', () => {
    expect(Object.keys(ROOM_STORY)).toEqual(Object.keys(ROOMS));
    for (const [room, story] of Object.entries(ROOM_STORY)) {
      for (const [kind, line] of Object.entries(story)) {
        expect(line.length).toBeGreaterThan(0);
        expect(line.length).toBeLessThan(80);
        if (room !== 'audio' || kind !== 'hint') expect(line).not.toMatch(/\d|%/);
      }
    }
    expect(ROOM_STORY.audio.hint).toContain('55–75');
    expect(ROOM_STORY.audio.hint).toContain('mute to cross');
    expect(ROOM_STORY.crosstalk.hint).toBe('Reveal the receiver. Cross unseen in the dark. Then tune the relay.');
    expect(ROOM_STORY.finale.hint).toBe('The gate is reading my settings right now.');
  });

  it('resolves visibility in order over ten seconds, with a complete static skip/reduced-motion recap', () => {
    expect(ENDING_BEATS.map((beat) => beat.id)).toEqual(['unseen', 'look-again', 'seen', 'dawn']);
    expect(ENDING_BEATS.reduce((sum, beat) => sum + beat.duration, 0)).toBe(10000);
    expect(ENDING_RECAP).toEqual([
      { speaker: 'SYSTEM', text: 'PLAYERS ONLINE: 0' },
      { speaker: 'Boy', text: 'Look again.' },
      { speaker: 'SYSTEM', text: 'PLAYERS ONLINE: 1' },
    ]);
  });
});
