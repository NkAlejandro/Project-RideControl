let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    ctx = new AudioContext();
    return ctx;
  } catch {
    return null;
  }
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.1) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

let lastHoverTime = 0;

function playHover(freqBase: number, durBase: number, vol: number) {
  const now = performance.now();
  if (now - lastHoverTime < 60) return;
  lastHoverTime = now;
  const freq = freqBase + randBetween(-40, 40);
  const dur = durBase + randBetween(-0.005, 0.005);
  playTone(freq, Math.max(0.01, dur), "sine", vol);
}

export function playHoverTap() {
  playHover(680, 0.03, 0.025);
}

export function playHoverNav() {
  playHover(520, 0.035, 0.02);
}

export function playHoverCard() {
  playHover(440, 0.025, 0.015);
}

export function playSuccess() {
  const c = getCtx();
  if (!c) return;
  playTone(523, 0.12, "sine", 0.08);
  setTimeout(() => playTone(659, 0.12, "sine", 0.08), 100);
  setTimeout(() => playTone(784, 0.2, "sine", 0.08), 200);
}

export function playCoin() {
  const c = getCtx();
  if (!c) return;
  playTone(880, 0.08, "sine", 0.07);
  setTimeout(() => playTone(1100, 0.12, "sine", 0.06), 60);
  setTimeout(() => playTone(1320, 0.15, "sine", 0.05), 120);
}

export function playDelete() {
  const c = getCtx();
  if (!c) return;
  playTone(400, 0.08, "sawtooth", 0.04);
  setTimeout(() => playTone(300, 0.12, "sawtooth", 0.03), 80);
  setTimeout(() => playTone(200, 0.15, "sawtooth", 0.02), 160);
}

export function playClick() {
  playTone(800, 0.04, "square", 0.03);
}

export function playNotification() {
  const c = getCtx();
  if (!c) return;
  playTone(523, 0.1, "sine", 0.06);
  setTimeout(() => playTone(659, 0.1, "sine", 0.06), 150);
  setTimeout(() => playTone(784, 0.1, "sine", 0.06), 300);
}

export function playGoalComplete() {
  const c = getCtx();
  if (!c) return;
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, "sine", 0.07), i * 120);
  });
}

export function playError() {
  const c = getCtx();
  if (!c) return;
  playTone(200, 0.15, "sawtooth", 0.05);
  setTimeout(() => playTone(150, 0.2, "sawtooth", 0.04), 150);
}

export function playToggle(on: boolean) {
  if (on) {
    playTone(600, 0.05, "sine", 0.04);
    setTimeout(() => playTone(800, 0.05, "sine", 0.03), 50);
  } else {
    playTone(400, 0.05, "sine", 0.04);
    setTimeout(() => playTone(300, 0.05, "sine", 0.03), 50);
  }
}
