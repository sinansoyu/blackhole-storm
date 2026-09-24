/* Synthesized sound effects via Web Audio (no audio files needed). */
(function () {
  'use strict';

  let ctx = null, master = null, musicGain = null, noiseBuf = null;
  let enabled = true, musicTimer = null;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp); comp.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  function tone(freq, dur, opt = {}) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime + (opt.delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = opt.type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (opt.slide) o.frequency.exponentialRampToValueAtTime(opt.slide, t + dur);
    const v = opt.vol == null ? 0.3 : opt.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (opt.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(opt.out || master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(dur, opt = {}) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime + (opt.delay || 0);
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = opt.filter || 'bandpass';
    f.frequency.setValueAtTime(opt.freq || 1000, t);
    if (opt.slide) f.frequency.exponentialRampToValueAtTime(opt.slide, t + dur);
    f.Q.value = opt.q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(opt.vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + dur + 0.05);
  }

  const N = (semi) => 440 * Math.pow(2, (semi - 9) / 12); // semitone offset from C4

  const Sfx = {
    unlock: ensure,
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      if (musicGain) musicGain.gain.value = enabled && musicTimer ? 0.18 : 0;
      return enabled;
    },
    click() { tone(900, 0.06, { type: 'square', vol: 0.08 }); },
    spinStart() {
      noise(0.45, { freq: 400, slide: 2500, q: 2, vol: 0.18 });
      tone(180, 0.3, { type: 'sawtooth', slide: 420, vol: 0.06 });
    },
    reelStop(i) {
      tone(140 - i * 6, 0.18, { type: 'sine', slide: 50, vol: 0.45 });
      noise(0.06, { freq: 3000, q: 3, vol: 0.15 });
    },
    tick() { tone(1800 + Math.random() * 300, 0.03, { type: 'triangle', vol: 0.05 }); },
    scatter(n) {
      const base = [0, 4, 7, 12, 16][Math.min(n, 5) - 1] + 12;
      [0, 7, 12].forEach((s, k) => tone(N(base + s), 0.9, { type: 'triangle', vol: 0.18, delay: k * 0.05 }));
      tone(N(base + 24), 1.2, { type: 'sine', vol: 0.12, delay: 0.12 });
    },
    anticipation() {
      for (let k = 0; k < 10; k++) tone(N(12 + k), 0.12, { type: 'square', vol: 0.05, delay: k * 0.09 });
      noise(0.9, { freq: 300, slide: 4000, q: 4, vol: 0.12 });
    },
    win(level) {
      const seq = level > 1 ? [0, 4, 7, 12, 16, 19, 24] : [0, 4, 7, 12];
      seq.forEach((s, k) => {
        tone(N(12 + s), 0.35, { type: 'triangle', vol: 0.18, delay: k * 0.07 });
        tone(N(24 + s), 0.25, { type: 'sine', vol: 0.08, delay: k * 0.07 });
      });
    },
    explode(k) {
      noise(0.35, { freq: 1800, slide: 200, q: 0.8, vol: 0.25 });
      tone(N(19 + k * 2), 0.25, { type: 'sine', slide: N(31 + k * 2), vol: 0.12 });
    },
    land() { tone(90, 0.12, { type: 'sine', slide: 45, vol: 0.25 }); },
    multUp(m) {
      [0, 7, 12].forEach((s, k) => tone(N(14 + Math.min(m, 20) + s), 0.4, { type: 'square', vol: 0.07, delay: k * 0.06 }));
    },
    coin() { tone(2400, 0.08, { type: 'square', vol: 0.05 }); tone(3200, 0.12, { type: 'square', vol: 0.04, delay: 0.05 }); },
    bigWin() {
      const chords = [[0, 4, 7], [5, 9, 12], [7, 11, 14], [12, 16, 19, 24]];
      chords.forEach((ch, k) => ch.forEach((s) => {
        tone(N(s), 0.7, { type: 'sawtooth', vol: 0.06, delay: k * 0.32 });
        tone(N(s + 12), 0.7, { type: 'triangle', vol: 0.08, delay: k * 0.32 });
      }));
      noise(1.5, { freq: 6000, filter: 'highpass', vol: 0.05, delay: 0.96 });
    },
    fsTrigger() {
      [0, 4, 7, 11, 12, 16, 19, 23, 24].forEach((s, k) => tone(N(s + 7), 0.5, { type: 'triangle', vol: 0.14, delay: k * 0.08 }));
      noise(1.2, { freq: 200, slide: 6000, q: 2, vol: 0.12 });
    },
    startMusic() {
      if (!ctx || musicTimer) return;
      musicGain.gain.value = enabled ? 0.18 : 0;
      const prog = [[0, 3, 7], [8, 12, 15], [5, 8, 12], [7, 11, 14]]; // minor, space-y
      let step = 0;
      const beat = 0.2;
      const play = () => {
        const ch = prog[Math.floor(step / 16) % prog.length];
        const s = step % 16;
        if (s === 0) ch.forEach((n) => tone(N(n - 12), beat * 16, { type: 'sine', vol: 0.12, attack: 0.4, out: musicGain }));
        const arp = ch[s % 3] + (s % 6 < 3 ? 12 : 24);
        tone(N(arp), beat * 0.9, { type: 'triangle', vol: 0.09, out: musicGain });
        if (s % 4 === 0) tone(60, 0.18, { type: 'sine', slide: 35, vol: 0.35, out: musicGain });
        step++;
      };
      play();
      musicTimer = setInterval(play, beat * 1000);
    },
    stopMusic() {
      clearInterval(musicTimer); musicTimer = null;
      if (musicGain) musicGain.gain.value = 0;
    },
  };

  window.Sfx = Sfx;
})();
