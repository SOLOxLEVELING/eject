import { describe, expect, it } from 'vitest';
import { createBedroomSamples } from './bedroomAudio';

describe('bedroom CRT game sounds', () => {
  it('plays quiet deterministic arcade bursts, with no rain/static bed or loop-boundary clicks', () => {
    const samples = createBedroomSamples(8000);
    expect(samples).toHaveLength(64000);
    expect(samples.every(value => Number.isFinite(value) && Math.abs(value) <= 0.018)).toBe(true);
    expect(samples.slice(0, 3200).every(value => value === 0)).toBe(true);
    expect(samples.slice(3200, 3920).some(value => Math.abs(value) > 0.01)).toBe(true);
    expect(samples.slice(5600, 14000).every(value => value === 0)).toBe(true);
    expect(samples.slice(56000).every(value => value === 0)).toBe(true);
    expect(createBedroomSamples(8000)).toEqual(samples);
  });
});
