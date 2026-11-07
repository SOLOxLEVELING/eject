export const OPENING_BEATS = [
  {
    id: 'final-night', duration: 9000,
    lines: [
      { speaker: 'Boy', text: 'I never did beat that last level.' },
      { speaker: 'Boy', text: "Guess tonight's my last chance." },
    ],
  },
  {
    id: 'too-late', duration: 7000,
    lines: [{ speaker: 'Boy', text: 'Wait—no. I was right there.' }],
  },
  { id: 'the-pull', duration: 7000, lines: [] },
  {
    id: 'new-body', duration: 11000,
    lines: [
      { speaker: 'Boy', text: "This isn't my room." },
      { speaker: 'SYSTEM', text: 'UNEXPECTED PLAYER DETECTED. CONTAINMENT ACTIVE.' },
      { speaker: 'Boy', text: "I'm... inside the game?" },
    ],
  },
  {
    id: 'agency', duration: 9000,
    lines: [
      { speaker: 'SYSTEM', text: 'VISIBILITY PROTOCOL INITIALIZED.' },
      { speaker: 'Boy', text: "That's the settings menu..." },
      { speaker: 'Boy', text: 'Maybe I can change what it sees.' },
    ],
  },
] as const;
