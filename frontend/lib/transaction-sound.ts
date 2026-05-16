/** Short fintech-style alert chime via Web Audio (no asset file required). */

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("tx_sound_muted") === "1";
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("tx_sound_muted", muted ? "1" : "0");
}

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

export async function playTransactionAlert(): Promise<void> {
  if (isSoundMuted()) return;
  const ctx = getCtx();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  master.connect(ctx.destination);

  const playTone = (freq: number, start: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.5, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  };

  playTone(880, now, 0.12);
  playTone(1174.66, now + 0.1, 0.18);
}
