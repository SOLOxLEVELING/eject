import type { RoomId } from './types';

export const ROOM_STORY: Record<RoomId, { entry: string; hint: string; success: string }> = {
  display: { entry: 'I can barely see two steps ahead.', hint: 'Those markings only show when I raise the light.', success: 'There you are.' },
  audio: { entry: 'Something in here is listening.', hint: 'Not silent. Not deafening. Somewhere between.', success: "That's the frequency." },
  controls: { entry: "It doesn't recognize my input.", hint: 'The terminal says K. My controls say E.', success: 'It listened.' },
  frame: { entry: 'Even the border feels solid.', hint: "What if the window wasn't a window?", success: 'The room got bigger.' },
  crosstalk: { entry: 'One system is talking over the other.', hint: 'Reveal the receiver. Cross unseen in the dark. Then tune the relay.', success: 'They can finally hear each other.' },
  finale: { entry: "It's still counting me as zero.", hint: 'The gate is reading my settings right now.', success: 'Look again.' },
};
