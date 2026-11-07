import { describe, expect, it } from 'vitest';
import { clampPercentage, formatBindKey, sanitizeSettings } from './rules';

describe('Stage 1 console rules', () => {
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
});
