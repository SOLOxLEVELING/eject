import type { BindKey, Settings } from './types';

export function clampPercentage(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  const rounded = Math.round(value);
  return Math.min(100, Math.max(0, rounded));
}

export function formatBindKey(key: BindKey): string {
  return key.toUpperCase();
}

export function sanitizeSettings(settings: Settings): Settings {
  return {
    brightness: clampPercentage(settings.brightness),
    volume: clampPercentage(settings.volume),
    muted: Boolean(settings.muted),
    interactKey: settings.interactKey,
  };
}
