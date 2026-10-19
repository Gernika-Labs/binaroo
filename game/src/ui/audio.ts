let ctx: AudioContext | null = null;
let enabled = true;

export const setSoundEnabled = (on: boolean): void => {
  enabled = on;
};
export const isSoundEnabled = (): boolean => enabled;

/** Browsers only allow audio after a user gesture, so this is called from the first press. */
export function initAudio(): void {
  if (!ctx) {
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

export function tone(freq: number, seconds: number, type: OscillatorType = "sine", volume = 0.08): void {
  if (!enabled || !ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + seconds);
}
