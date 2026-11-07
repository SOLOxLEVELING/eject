import { describe, expect, it } from 'vitest';
import { getWorldLight } from './lighting';
import { isGlyphVisible } from './rules';

describe('world-space brightness mapping', () => {
  it('keeps immediate neighbors clear and distant space almost black at low brightness', () => {
    for (const brightness of [0, 20, 25]) {
      const light = getWorldLight(brightness);
      expect(light.innerRadius).toBeGreaterThanOrEqual(Math.hypot(1.5, 0.5));
      expect(light.outerRadius).toBeLessThan(2.6);
      expect(light.darkness).toBeGreaterThanOrEqual(0.9);
      expect(light.darkness).toBeLessThanOrEqual(0.97);
    }
  });

  it('smoothly expands the light and clears the room without changing the glyph threshold', () => {
    for (let brightness = 1; brightness <= 100; brightness++) {
      const previous = getWorldLight(brightness - 1);
      const light = getWorldLight(brightness);
      expect(light.innerRadius).toBeGreaterThan(previous.innerRadius);
      expect(light.outerRadius).toBeGreaterThan(previous.outerRadius);
      expect(light.darkness).toBeLessThanOrEqual(previous.darkness);
      expect(previous.darkness - light.darkness).toBeLessThan(0.03);
    }
    expect(getWorldLight(80).darkness).toBeLessThan(0.07);
    expect(getWorldLight(100).darkness).toBe(0);
    expect(isGlyphVisible(69)).toBe(false);
    expect(isGlyphVisible(70)).toBe(true);
  });

  it('uses the same bounded percentage handling as settings', () => {
    expect(getWorldLight(-1)).toEqual(getWorldLight(0));
    expect(getWorldLight(Number.NaN)).toEqual(getWorldLight(0));
    expect(getWorldLight(101)).toEqual(getWorldLight(100));
  });
});
