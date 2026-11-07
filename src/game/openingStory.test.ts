import { describe, expect, it } from 'vitest';
import { OPENING_BEATS } from './openingStory';

describe('five-beat opening contract', () => {
  it('stays within 35–45 seconds and preserves the storyboard order', () => {
    expect(OPENING_BEATS.map((beat) => beat.id)).toEqual(['final-night', 'too-late', 'the-pull', 'new-body', 'agency']);
    const duration = OPENING_BEATS.reduce((total, beat) => total + beat.duration, 0);
    expect(duration).toBe(43000);
    expect(OPENING_BEATS.every((beat) => beat.duration > 0)).toBe(true);
  });

  it('preserves the human stakes, containment and agency dialogue', () => {
    expect(OPENING_BEATS.flatMap((beat) => beat.lines.map((line) => line.text))).toEqual([
      'I never did beat that last level.',
      "Guess tonight's my last chance.",
      'Wait—no. I was right there.',
      "This isn't my room.",
      'UNEXPECTED PLAYER DETECTED. CONTAINMENT ACTIVE.',
      "I'm... inside the game?",
      'VISIBILITY PROTOCOL INITIALIZED.',
      "That's the settings menu...",
      'Maybe I can change what it sees.',
    ]);
  });
});
