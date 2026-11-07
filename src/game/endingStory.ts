export const ENDING_BEATS = [
  { id: 'unseen', duration: 1500, lines: [{ speaker: 'SYSTEM', text: 'PLAYERS ONLINE: 0' }] },
  { id: 'look-again', duration: 1500, lines: [{ speaker: 'Boy', text: 'Look again.' }] },
  { id: 'seen', duration: 2000, lines: [{ speaker: 'SYSTEM', text: 'PLAYERS ONLINE: 1' }] },
  { id: 'dawn', duration: 5000, lines: [] },
] as const;

export const ENDING_RECAP = ENDING_BEATS.flatMap((beat) => [...beat.lines]);
