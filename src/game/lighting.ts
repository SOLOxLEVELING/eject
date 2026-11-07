import { clampPercentage } from './rules';

// Radii use tile units so the light follows the grid at every viewport size.
export function getWorldLight(brightness: number) {
  const gain = clampPercentage(brightness) / 100;
  const reveal = Math.max(0, (gain - 0.25) / 0.75);
  return {
    innerRadius: 1.6 + 3 * gain * gain,
    outerRadius: 2.2 + 6 * gain * gain,
    darkness: (0.97 - 0.04 * Math.min(1, gain / 0.25)) * (1 - reveal) ** 2,
  };
}
