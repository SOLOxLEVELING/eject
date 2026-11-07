type StoryDialogueProps = {
  lines: readonly { speaker: string; text: string }[];
};

export function StoryDialogue({ lines }: StoryDialogueProps) {
  return (
    <div className="story-dialogue" role="status" aria-live="polite" aria-atomic="true">
      {lines.map((line) => (
        <p key={line.text} data-speaker={line.speaker}>
          <span className="dialogue-speaker">{line.speaker}</span>
          <span>{line.text}</span>
        </p>
      ))}
    </div>
  );
}
