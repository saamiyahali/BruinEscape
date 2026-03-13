// Web Audio API sound manager
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function playTone(freq, duration, type = "sine", volume = 0.15) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

function playNotes(notes, type = "sine", volume = 0.12) {
  let offset = 0;
  const c = getCtx();
  for (const [freq, dur] of notes) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, c.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + offset + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime + offset);
    osc.stop(c.currentTime + offset + dur);
    offset += dur * 0.8;
  }
}

// looping arpeggiated pattern

let bgmInterval = null;
let bgmPlaying = false;

const BGM_NOTES = [
  262,
  330,
  392,
  523, // C E G C5
  294,
  370,
  440,
  587, // D F# A D5
  330,
  415,
  494,
  659, // E G# B E5
  294,
  370,
  440,
  587, // D F# A D5
];

function bgmTick() {
  if (!bgmPlaying) return;
  const c = getCtx();
  const now = c.currentTime;
  const noteLen = 0.18;
  const gap = 0.2;

  for (let i = 0; i < BGM_NOTES.length; i++) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "triangle";
    osc.frequency.value = BGM_NOTES[i];
    const t = now + i * gap;
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + noteLen);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + noteLen);
  }
}

export function playBGM() {
  if (bgmPlaying) return;
  bgmPlaying = true;
  bgmTick();
  bgmInterval = setInterval(bgmTick, BGM_NOTES.length * 200);
}

export function stopBGM() {
  bgmPlaying = false;
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
}

export function playCoinSound() {
  playNotes(
    [
      [880, 0.08],
      [1175, 0.12],
    ],
    "sine",
    0.13,
  );
}

export function playHitSound() {
  playTone(150, 0.3, "sawtooth", 0.15);
}

export function playLevelCompleteSound() {
  playNotes(
    [
      [523, 0.15],
      [659, 0.15],
      [784, 0.15],
      [1047, 0.3],
    ],
    "sine",
    0.15,
  );
}

export function playGameOverSound() {
  playNotes(
    [
      [400, 0.25],
      [350, 0.25],
      [300, 0.35],
      [200, 0.5],
    ],
    "sawtooth",
    0.12,
  );
}
