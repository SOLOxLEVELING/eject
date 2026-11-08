const CRT_NOTES = [
  [0.4, 330], [0.54, 440],
  [1.8, 523], [1.94, 660], [2.08, 784],
  [3.6, 220], [3.78, 165],
  [5, 392], [5.14, 523],
  [6.4, 440], [6.54, 660],
] as const;

// Sparse arcade actions from the bedroom CRT, with silence between turns.
export function createBedroomSamples(sampleRate: number) {
  const samples = new Float32Array(sampleRate * 8);
  for (const [start, frequency] of CRT_NOTES) {
    for (let j = 0; j < 0.09 * sampleRate; j++) {
      const age = j / sampleRate;
      const wave = Math.asin(Math.sin(age * frequency * Math.PI * 2)) * 2 / Math.PI;
      samples[Math.floor(start * sampleRate) + j] += wave * 0.018 * Math.sin(age / 0.09 * Math.PI);
    }
  }
  return samples;
}

export function startBedroomAudio(): (() => void) | null {
  let context: AudioContext | undefined;
  try {
    if (!window.AudioContext) return null;
    context = new AudioContext();
    const buffer = context.createBuffer(1, context.sampleRate * 8, context.sampleRate);
    buffer.copyToChannel(createBedroomSamples(context.sampleRate), 0);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(context.destination);
    source.start();
    const stop = () => { void context?.close().catch(() => {}); };
    void context.resume().catch(stop);
    return stop;
  } catch {
    void context?.close().catch(() => {});
    return null;
  }
}
