/* Cosmic Fortune — 5x3 cascading slot with progressive-multiplier free spins. Demo credits only. */
(function () {
  'use strict';

  const S = window.Symbols, A = window.Sfx;
  const WILD = S.WILD, SCAT = S.SCATTER;

  // ── Layout ──
  const COLS = 5, ROWS = 3, CELL = 150, GAP = 8, STEP = CELL + GAP;
  const W = 820, H = 500;
  const OX = (W - (COLS * CELL + (COLS - 1) * GAP)) / 2;
  const OY = (H - (ROWS * CELL + (ROWS - 1) * GAP)) / 2;

  // ── Math ──
  const LINES = [
    [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
    [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 1, 1, 0],
    [2, 1, 1, 1, 2], [1, 0, 1, 2, 1], [1, 2, 1, 0, 1], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2],
    [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 0, 2, 0, 0], [2, 2, 0, 2, 2], [0, 2, 0, 2, 0],
  ];
  const LINE_COLORS = LINES.map((_, i) => `hsl(${(i * 47) % 360}, 100%, 62%)`);
  const WEIGHTS = [18, 18, 16, 16, 11, 9, 7, 5, 2.5];
  const WEIGHTS_FS = [18, 18, 16, 16, 11, 9, 7, 13, 2.5]; // more wilds during free spins
  const BUY_X = 70; // bonus buy price (x bet); simulated bonus average ≈ 66x
  const BETS = [20, 40, 60, 100, 200, 400, 1000, 2000];
  const FS_AWARD = { 3: 10, 4: 12, 5: 15 };
  const SCAT_PAY = { 3: 2, 4: 5, 5: 20 };
  const START_BAL = 10000;

  const $ = (id) => document.getElementById(id);
  const fmt = (n) => Math.round(n).toLocaleString('tr-TR');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);

  const state = {
    balance: START_BAL, betIdx: 0, busy: false, auto: false, turbo: false,
    fs: null, lastWin: 0,
  };
  const bet = () => BETS[state.betIdx];
  const lineBet = () => bet() / LINES.length;
  const T = (ms) => (state.turbo ? ms * 0.45 : ms);

  // ── RNG / grid ──
  function randSym(col, hasScatter) {
    let total = 0;
    const w = (state.fs ? WEIGHTS_FS : WEIGHTS).map((v, i) => {
      if (i === WILD && (col === 0 || col === 4)) v = 0;
      if (i === SCAT && hasScatter) v = 0;
      total += v; return v;
    });
    let r = Math.random() * total;
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i; }
    return 0;
  }
  function genColumn(col) {
    const out = []; let sc = false;
    for (let r = 0; r < ROWS; r++) { const s = randSym(col, sc); if (s === SCAT) sc = true; out.push(s); }
    return out;
  }

  // ── Canvas setup ──
  const cv = $('reels'), ctx = cv.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W * DPR; cv.height = H * DPR;
  ctx.scale(DPR, DPR);

  const fx = $('fx'), fctx = fx.getContext('2d');
  const bg = $('bg'), bctx = bg.getContext('2d');
  function resize() {
    for (const c of [fx, bg]) { c.width = innerWidth * DPR; c.height = innerHeight * DPR; }
    fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    bctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildNebula();
  }

  // ── Reel state ──
  const reels = [];
  function makeCell(sym) { return { sym, y: 0, vy: 0, delay: 0, scale: 1, alpha: 1, st: 'idle', t: 0 }; }
  function initReels() {
    for (let c = 0; c < COLS; c++) {
      reels.push({ mode: 'idle', strip: [], t0: 0, dur: 1, startTop: 0, top: 0, speed: 0, antic: false, done: null, cells: genColumn(c).map(makeCell) });
    }
  }
  const grid = () => reels.map((r) => r.cells.map((c) => c.sym));

  // ── Static reel background ──
  let panelImg = null;
  function buildPanel() {
    panelImg = document.createElement('canvas');
    panelImg.width = W * DPR; panelImg.height = H * DPR;
    const p = panelImg.getContext('2d');
    p.scale(DPR, DPR);
    const g = p.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1b0838'); g.addColorStop(0.5, '#0d0420'); g.addColorStop(1, '#1b0838');
    p.fillStyle = g; p.fillRect(0, 0, W, H);
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const x = OX + c * STEP, y = OY + r * STEP;
        const cg = p.createRadialGradient(x + CELL / 2, y + CELL / 2, 10, x + CELL / 2, y + CELL / 2, CELL * 0.75);
        cg.addColorStop(0, 'rgba(120,70,220,0.28)'); cg.addColorStop(1, 'rgba(20,5,45,0.6)');
        p.fillStyle = cg;
        p.beginPath(); p.roundRect(x, y, CELL, CELL, 16); p.fill();
        p.strokeStyle = 'rgba(255,211,107,0.12)'; p.lineWidth = 1.5; p.stroke();
      }
      if (c > 0) {
        const x = OX + c * STEP - GAP / 2;
        const lg = p.createLinearGradient(0, 0, 0, H);
        lg.addColorStop(0, 'rgba(255,211,107,0)'); lg.addColorStop(0.5, 'rgba(255,211,107,0.45)'); lg.addColorStop(1, 'rgba(255,211,107,0)');
        p.fillStyle = lg; p.fillRect(x - 1, 6, 2, H - 12);
      }
    }
    // glass sheen
    const sh = p.createLinearGradient(0, 0, 0, H * 0.45);
    sh.addColorStop(0, 'rgba(255,255,255,0.07)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    p.fillStyle = sh; p.fillRect(0, 0, W, H * 0.45);
  }

  // ── Spin animation ──
  function easeOutBack(t) { const c1 = 1.0, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

  function spinReels(final) {
    // anticipation: a reel spins longer if 2+ scatters already landed on reels to its left
    let extra = 0;
    const base = T(620), stagger = T(190);
    const promises = [];
    const now = performance.now();
    for (let c = 0; c < COLS; c++) {
      const scatLeft = final.slice(0, c).flat().filter((s) => s === SCAT).length;
      const antic = scatLeft >= 2;
      if (antic) extra += 1300;
      const r = reels[c];
      const n = 12 + c * 4 + (antic ? 18 : 0) + Math.round(extra / 90);
      const strip = [randSym(c, false), ...final[c]];
      for (let i = 0; i < n; i++) strip.push(randSym(c, true));
      strip.push(...r.cells.map((x) => x.sym));
      r.strip = strip;
      r.startTop = strip.length - 3;
      r.top = r.startTop;
      r.t0 = now + c * T(40);
      r.dur = base + c * stagger + extra;
      r.antic = antic;
      r.anticStart = antic ? now + base + (c - 1) * stagger + (extra - 1300) : 0;
      r.anticPlayed = false;
      r.final = final[c];
      r.mode = 'spin';
      r.cells.forEach((cell) => { cell.st = 'idle'; cell.scale = 1; cell.alpha = 1; cell.y = 0; });
      promises.push(new Promise((res) => (r.done = res)));
    }
    return Promise.all(promises);
  }

  function updateReels(now) {
    for (let c = 0; c < COLS; c++) {
      const r = reels[c];
      if (r.mode !== 'spin') continue;
      const t = Math.max(0, Math.min(1, (now - r.t0) / r.dur));
      const prev = r.top;
      r.top = r.startTop + (1 - r.startTop) * easeOutBack(t);
      r.speed = Math.abs(prev - r.top);
      if (r.antic && !r.anticPlayed && now >= r.anticStart) { r.anticPlayed = true; A.anticipation(); msg('BONUS YAKLAŞIYOR...'); }
      if (r.antic && now >= r.anticStart && Math.random() < 0.5) {
        const p = cellCenter(c, Math.random() * 3 - 0.5);
        spawn({ x: p.x + rand(-60, 60), y: p.y + 60, vx: 0, vy: rand(-220, -120), life: 0.8, color: '#c9a2ff', size: rand(2, 4), type: 'spark' });
      }
      if (t >= 1) {
        r.mode = 'idle';
        r.cells = r.final.map(makeCell);
        A.reelStop(c);
        const nSc = reels.slice(0, c + 1).flatMap((rr) => (rr.mode === 'idle' ? rr.cells : [])).filter((x) => x.sym === SCAT).length;
        if (r.final.includes(SCAT)) {
          A.scatter(nSc);
          const row = r.final.indexOf(SCAT);
          burst(c, row, '#c9a2ff', 18);
          r.cells[row].st = 'scat'; r.cells[row].t = 0;
        }
        r.done && r.done();
      }
    }
  }

  // ── Cascade physics ──
  const G = 5200;
  function updateCells(dt) {
    let landed = false;
    for (const r of reels) {
      for (const cell of r.cells) {
        cell.t += dt;
        if (cell.delay > 0) { cell.delay -= dt; continue; }
        if (cell.y < 0 || cell.vy !== 0) {
          cell.vy += G * dt; cell.y += cell.vy * dt;
          if (cell.y >= 0) {
            cell.y = 0;
            if (cell.vy > 700) { cell.vy = -cell.vy * 0.22; landed = true; } else cell.vy = 0;
          }
        }
        if (cell.st === 'boom') { cell.scale += dt * 2.5; cell.alpha = Math.max(0, cell.alpha - dt * 5); }
      }
    }
    if (landed) A.land();
  }
  const settled = () => reels.every((r) => r.mode === 'idle' && r.cells.every((c) => c.y === 0 && c.vy === 0 && c.delay <= 0));
  async function waitSettled() { while (!settled()) await wait(16); }

  // ── Evaluation ──
  function evaluate(g) {
    const wins = [];
    LINES.forEach((line, li) => {
      const syms = line.map((r, c) => g[c][r]);
      if (syms[0] === SCAT) return;
      let wr = 0; while (wr < COLS && syms[wr] === WILD) wr++;
      const target = syms.find((s) => s !== WILD);
      let best = 0, bestSym = -1, bestCnt = 0;
      if (target !== undefined && target !== SCAT) {
        let cnt = 0; while (cnt < COLS && (syms[cnt] === target || syms[cnt] === WILD)) cnt++;
        if (cnt >= 3) { best = S.DEFS[target].pays[cnt - 3]; bestSym = target; bestCnt = cnt; }
      }
      if (wr >= 3) { const p = S.DEFS[WILD].pays[wr - 3]; if (p > best) { best = p; bestSym = WILD; bestCnt = wr; } }
      if (best > 0) wins.push({ line: li, sym: bestSym, count: bestCnt, pay: best, cells: line.slice(0, bestCnt).map((r, c) => [c, r]) });
    });
    return wins;
  }

  // ── Cascade refill ──
  function refill(removed) {
    for (let c = 0; c < COLS; c++) {
      const r = reels[c];
      const keep = [];
      for (let row = 0; row < ROWS; row++) if (!removed[c][row]) keep.push({ cell: r.cells[row], from: row });
      const m = ROWS - keep.length;
      if (!m) continue;
      let hasSc = keep.some((k) => k.cell.sym === SCAT);
      const cells = [];
      for (let j = 0; j < m; j++) {
        const s = randSym(c, hasSc); if (s === SCAT) hasSc = true;
        const cell = makeCell(s);
        cell.y = -m * STEP - 40; cell.delay = c * 0.05 + (m - j) * 0.03;
        cells.push(cell);
      }
      keep.forEach((k, idx) => {
        const target = m + idx;
        k.cell.y = (k.from - target) * STEP; k.cell.vy = 0; k.cell.delay = c * 0.05;
        k.cell.st = 'idle'; k.cell.scale = 1; k.cell.alpha = 1;
        cells.push(k.cell);
      });
      r.cells = cells;
    }
  }

  // ── Particles (fx canvas, page coordinates) ──
  const parts = [];
  const floats = [];
  function spawn(p) { p.age = 0; p.rot = p.rot || rand(0, 6.28); p.vr = p.vr || rand(-8, 8); parts.push(p); }
  function cellCenter(c, r) {
    const rect = cv.getBoundingClientRect();
    const k = rect.width / W;
    return { x: rect.left + (OX + c * STEP + CELL / 2) * k, y: rect.top + (OY + r * STEP + CELL / 2) * k, k };
  }
  function burst(c, r, color, n = 26) {
    const p = cellCenter(c, r);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(120, 520) * p.k;
      spawn({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, g: 600, life: rand(0.5, 1.1), color, size: rand(3, 7) * p.k * 1.4, type: i % 3 ? 'spark' : 'shard' });
    }
    spawn({ x: p.x, y: p.y, life: 0.45, color, size: CELL * 0.5 * p.k, type: 'ring' });
  }
  function coinBurst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(-Math.PI * 0.9, -Math.PI * 0.1);
      const sp = rand(300, 900);
      spawn({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 1400, life: rand(1.2, 2.2), size: rand(10, 18), type: 'coin' });
    }
  }
  function coinRain(n) {
    for (let i = 0; i < n; i++) {
      spawn({ x: rand(0, innerWidth), y: rand(-200, -20), vx: rand(-60, 60), vy: rand(100, 400), g: 700, life: 3, size: rand(10, 20), type: 'coin' });
    }
  }
  function updateParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      if (p.age >= p.life) { parts.splice(i, 1); continue; }
      if (p.type === 'ring') continue;
      p.vy += (p.g || 0) * dt;
      p.vx *= 0.99;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
  }
  function drawParts() {
    fctx.clearRect(0, 0, innerWidth, innerHeight);
    fctx.save();
    for (const p of parts) {
      const k = 1 - p.age / p.life;
      if (p.type === 'spark') {
        fctx.globalCompositeOperation = 'lighter';
        fctx.globalAlpha = k;
        const g = fctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
        g.addColorStop(0, '#fff'); g.addColorStop(0.3, p.color); g.addColorStop(1, 'rgba(0,0,0,0)');
        fctx.fillStyle = g;
        fctx.beginPath(); fctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2); fctx.fill();
      } else if (p.type === 'shard') {
        fctx.globalCompositeOperation = 'source-over';
        fctx.globalAlpha = k;
        fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot);
        fctx.fillStyle = p.color;
        fctx.beginPath(); fctx.moveTo(0, -p.size * 1.6); fctx.lineTo(p.size, 0); fctx.lineTo(0, p.size * 1.6); fctx.lineTo(-p.size, 0); fctx.closePath(); fctx.fill();
        fctx.fillStyle = 'rgba(255,255,255,0.7)';
        fctx.beginPath(); fctx.moveTo(0, -p.size * 1.6); fctx.lineTo(p.size, 0); fctx.lineTo(0, 0); fctx.closePath(); fctx.fill();
        fctx.restore();
      } else if (p.type === 'ring') {
        fctx.globalCompositeOperation = 'lighter';
        fctx.globalAlpha = k * 0.9;
        fctx.strokeStyle = p.color; fctx.lineWidth = 6 * k + 1;
        fctx.beginPath(); fctx.arc(p.x, p.y, p.size * (0.3 + (1 - k) * 1.4), 0, Math.PI * 2); fctx.stroke();
      } else if (p.type === 'coin') {
        fctx.globalCompositeOperation = 'source-over';
        fctx.globalAlpha = Math.min(1, k * 3);
        const sx = Math.abs(Math.cos(p.rot));
        fctx.save(); fctx.translate(p.x, p.y); fctx.scale(Math.max(0.15, sx), 1);
        const g = fctx.createLinearGradient(-p.size, -p.size, p.size, p.size);
        g.addColorStop(0, '#fff6c0'); g.addColorStop(0.4, '#ffc93a'); g.addColorStop(1, '#a86200');
        fctx.fillStyle = g;
        fctx.beginPath(); fctx.arc(0, 0, p.size, 0, Math.PI * 2); fctx.fill();
        fctx.strokeStyle = '#7a4500'; fctx.lineWidth = 2; fctx.stroke();
        fctx.fillStyle = 'rgba(122,69,0,0.6)';
        fctx.font = `${p.size * 1.2}px 'Lilita One', sans-serif`; fctx.textAlign = 'center'; fctx.textBaseline = 'middle';
        fctx.fillText('$', 0, 1);
        fctx.restore();
      }
    }
    fctx.restore();
  }

  // ── Main reel rendering ──
  let winLines = []; // {line, color, t0}
  function drawSymbol(sym, x, y, scale, alpha, blur) {
    const img = blur ? S.blur[sym] : S.images[sym];
    const size = CELL * 0.86 * scale;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x + (CELL - size) / 2, y + (CELL - size) / 2, size, size);
    ctx.globalAlpha = 1;
  }

  function drawReels(now) {
    const time = now / 1000;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(panelImg, 0, 0, W, H);

    ctx.save();
    ctx.beginPath(); ctx.rect(OX - 6, OY - 4, COLS * STEP, ROWS * STEP); ctx.clip();

    for (let c = 0; c < COLS; c++) {
      const r = reels[c];
      const x = OX + c * STEP;
      if (r.mode === 'spin') {
        const blur = r.speed > 0.12;
        const first = Math.floor(r.top) - 1;
        for (let k = first; k <= first + 5; k++) {
          if (k < 0 || k >= r.strip.length) continue;
          const y = OY + (k - r.top) * STEP;
          if (y < OY - STEP || y > OY + ROWS * STEP) continue;
          drawSymbol(r.strip[k], x, y, 1, 1, blur);
        }
        if (r.antic && now >= r.anticStart) {
          const pulse = 0.5 + 0.5 * Math.sin(time * 14);
          ctx.save();
          ctx.shadowColor = '#b87bff'; ctx.shadowBlur = 30 + pulse * 20;
          ctx.strokeStyle = `rgba(200,150,255,${0.6 + pulse * 0.4})`; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.roundRect(x - 2, OY - 2, CELL + 4, ROWS * STEP - GAP + 4, 18); ctx.stroke();
          ctx.restore();
        }
        continue;
      }
      r.cells.forEach((cell, row) => {
        const y = OY + row * STEP + cell.y;
        let scale = cell.scale, alpha = cell.alpha;
        if (cell.st === 'win' || cell.st === 'scat') {
          const pulse = Math.sin(cell.t * 10);
          scale = 1 + 0.07 + 0.07 * pulse;
          ctx.save();
          ctx.shadowColor = cell.st === 'scat' ? '#b87bff' : '#ffd36b';
          ctx.shadowBlur = 25 + pulse * 10;
          ctx.strokeStyle = cell.st === 'scat' ? '#d7b8ff' : '#ffe7a3';
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.roundRect(x + 3, y + 3, CELL - 6, CELL - 6, 14); ctx.stroke();
          ctx.restore();
        }
        if (cell.sym === SCAT && cell.st !== 'boom') {
          // idle pulsing aura behind the portal
          const a = 0.25 + 0.2 * Math.sin(time * 3 + c);
          const g = ctx.createRadialGradient(x + CELL / 2, y + CELL / 2, 5, x + CELL / 2, y + CELL / 2, CELL * 0.6);
          g.addColorStop(0, `rgba(170,110,255,${a})`); g.addColorStop(1, 'rgba(170,110,255,0)');
          ctx.fillStyle = g; ctx.fillRect(x, y, CELL, CELL);
        }
        if (alpha > 0.01) drawSymbol(cell.sym, x, y, scale, alpha, false);
      });
    }
    ctx.restore();

    // win lines
    for (const wl of winLines) {
      const prog = Math.min(1, (now - wl.t0) / 280);
      const pts = LINES[wl.line].map((row, c) => [OX + c * STEP + CELL / 2, OY + row * STEP + CELL / 2]);
      pts.unshift([OX - 8, pts[0][1]]); pts.push([OX + COLS * STEP - GAP + 8, pts[pts.length - 1][1]]);
      const total = pts.length - 1, upto = prog * total;
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const pass of [[14, 'rgba(0,0,0,0.45)', 0], [7, wl.color, 22], [2.5, '#fff', 0]]) {
        ctx.lineWidth = pass[0]; ctx.strokeStyle = pass[1]; ctx.shadowColor = wl.color; ctx.shadowBlur = pass[2];
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i <= Math.ceil(upto); i++) {
          const f = Math.min(1, upto - (i - 1));
          ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // floating texts
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      const k = (now - f.t0) / f.life;
      if (k >= 1) { floats.splice(i, 1); continue; }
      const pop = k < 0.15 ? 0.5 + (k / 0.15) * 0.7 : k < 0.25 ? 1.2 - (k - 0.15) * 2 : 1;
      ctx.save();
      ctx.globalAlpha = k > 0.75 ? (1 - k) / 0.25 : 1;
      ctx.translate(f.x, f.y - k * 40);
      ctx.scale(pop, pop);
      ctx.font = `${f.size}px 'Lilita One', Impact, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.lineWidth = f.size * 0.22; ctx.strokeStyle = '#2a0b00'; ctx.strokeText(f.text, 0, 0);
      const g = ctx.createLinearGradient(0, -f.size / 2, 0, f.size / 2);
      g.addColorStop(0, '#fffbe0'); g.addColorStop(0.5, f.color); g.addColorStop(1, '#b8660f');
      ctx.shadowColor = f.color; ctx.shadowBlur = 20;
      ctx.fillStyle = g; ctx.fillText(f.text, 0, 0);
      ctx.restore();
    }
  }
  function floatText(text, x, y, color = '#ffd36b', size = 64, life = 1400) {
    floats.push({ text, x, y, color, size, life, t0: performance.now() });
  }

  // ── Background: nebula + twinkling stars ──
  let nebula = null; const stars = [];
  function buildNebula() {
    nebula = document.createElement('canvas');
    nebula.width = Math.max(1, innerWidth); nebula.height = Math.max(1, innerHeight);
    const n = nebula.getContext('2d');
    n.fillStyle = '#07030f'; n.fillRect(0, 0, nebula.width, nebula.height);
    const blobs = [['#5b1fb8', 0.2, 0.25, 0.6], ['#e0288a', 0.85, 0.2, 0.45], ['#1f4fd8', 0.7, 0.85, 0.55], ['#8a2be2', 0.1, 0.9, 0.4]];
    for (const [col, fx_, fy, fr] of blobs) {
      const R = Math.max(innerWidth, innerHeight) * fr;
      const g = n.createRadialGradient(fx_ * innerWidth, fy * innerHeight, 0, fx_ * innerWidth, fy * innerHeight, R);
      g.addColorStop(0, col + '66'); g.addColorStop(1, col + '00');
      n.fillStyle = g; n.fillRect(0, 0, nebula.width, nebula.height);
    }
    stars.length = 0;
    const count = Math.round((innerWidth * innerHeight) / 5000);
    for (let i = 0; i < count; i++) stars.push({ x: Math.random(), y: Math.random(), r: rand(0.4, 1.8), p: rand(0, 6.28), s: rand(0.5, 2.5) });
  }
  function drawBg(now) {
    const t = now / 1000;
    bctx.drawImage(nebula, 0, 0, innerWidth, innerHeight);
    if (state.fs) {
      bctx.fillStyle = `rgba(120,40,255,${0.12 + 0.06 * Math.sin(t * 2)})`;
      bctx.fillRect(0, 0, innerWidth, innerHeight);
    }
    bctx.fillStyle = '#fff';
    for (const s of stars) {
      bctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * s.s + s.p));
      bctx.beginPath(); bctx.arc(s.x * innerWidth, ((s.y + t * 0.004 * s.r) % 1) * innerHeight, s.r, 0, Math.PI * 2); bctx.fill();
    }
    bctx.globalAlpha = 1;
  }

  // ── Loop ──
  let last = performance.now(), idleSparkle = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    updateReels(now);
    updateCells(dt);
    updateParts(dt);
    idleSparkle += dt;
    if (idleSparkle > 0.35 && settled()) {
      idleSparkle = 0;
      const c = Math.floor(Math.random() * COLS), r = Math.floor(Math.random() * ROWS);
      const p = cellCenter(c, r);
      spawn({ x: p.x + rand(-40, 40) * p.k, y: p.y + rand(-40, 40) * p.k, vx: 0, vy: -10, life: 0.7, color: S.DEFS[reels[c].cells[r].sym].color, size: 3 * p.k + 1, type: 'spark' });
    }
    drawBg(now);
    drawReels(now);
    drawParts();
    requestAnimationFrame(frame);
  }

  // ── UI helpers ──
  function msg(t) { $('msg').textContent = t; }
  const counters = new Map();
  function countTo(el, to, ms = 600) {
    const from = counters.has(el) ? counters.get(el).cur : parseFloat(el.dataset.v || '0');
    const t0 = performance.now();
    const rec = { cur: from };
    counters.set(el, rec);
    const step = (now) => {
      if (counters.get(el) !== rec) return;
      const k = Math.min(1, (now - t0) / ms);
      rec.cur = from + (to - from) * (1 - Math.pow(1 - k, 3));
      el.textContent = fmt(rec.cur);
      el.dataset.v = rec.cur;
      if (k < 1) requestAnimationFrame(step); else counters.delete(el), (el.dataset.v = to);
    };
    requestAnimationFrame(step);
  }
  function setBalance(v, anim = true) {
    state.balance = v;
    if (anim) countTo($('balVal'), v); else { $('balVal').textContent = fmt(v); $('balVal').dataset.v = v; }
  }
  function pop(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  function updateUI() {
    $('betVal').textContent = fmt(bet());
    const lock = state.busy || !!state.fs;
    $('betUp').disabled = $('betDown').disabled = lock;
    $('buyBtn').disabled = lock;
    $('spinBtn').disabled = (state.busy && !state.auto) || (!!state.fs);
    $('spinBtn').classList.toggle('busy', state.busy);
    $('spinBtn').classList.toggle('auto', state.auto);
    $('autoBtn').classList.toggle('on', state.auto);
    $('turboBtn').classList.toggle('on', state.turbo);
    $('buyCost').textContent = fmt(bet() * BUY_X);
  }
  function updateFsBar() {
    const fs = state.fs;
    $('fsBar').classList.toggle('on', !!fs);
    $('frame').classList.toggle('fs', !!fs);
    if (!fs) return;
    $('fsLeft').textContent = fs.left;
    $('fsMult').textContent = 'x' + fs.mult;
    $('fsTotal').textContent = fmt(fs.total);
  }
  function shake() { const f = $('frame'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }

  function showOverlay(id, autoMs) {
    return new Promise((res) => {
      const el = $(id);
      el.classList.add('show');
      let timer = null;
      const btn = el.querySelector('.big-btn');
      const close = () => { clearTimeout(timer); el.classList.remove('show'); (btn || el).removeEventListener('click', close); A.click(); res(); };
      (btn || el).addEventListener('click', close);
      if (autoMs) timer = setTimeout(close, autoMs);
    });
  }

  // ── Big win presentation ──
  function tierOf(x) { return x >= 100 ? 3 : x >= 40 ? 2 : x >= 15 ? 1 : 0; }
  const TIER_NAMES = ['', 'BÜYÜK KAZANÇ', 'MEGA KAZANÇ', 'EPİK KAZANÇ'];
  const TIER_CLASS = ['', '', 'mega', 'epic'];
  function showBigWin(amount) {
    return new Promise((res) => {
      const el = $('bigWin'), title = $('bwTitle'), amt = $('bwAmount');
      const target = tierOf(amount / bet());
      el.classList.add('show');
      A.bigWin();
      let tier = 0, done = false, finished = false, closeTimer = null;
      const dur = 1500 + target * 1100;
      const t0 = performance.now();
      const setTier = (t) => {
        if (t === tier) return; tier = t;
        title.textContent = TIER_NAMES[t]; title.className = 'bw-title ' + TIER_CLASS[t];
        void title.offsetWidth;
        if (t > 1) { A.bigWin(); shake(); }
        coinBurst(innerWidth / 2, innerHeight / 2, 40);
      };
      setTier(1);
      let lastCoin = 0;
      const step = (now) => {
        if (finished) return;
        const k = done ? 1 : Math.min(1, (now - t0) / dur);
        const v = amount * (1 - Math.pow(1 - k, 2));
        amt.textContent = fmt(v);
        setTier(Math.max(1, tierOf(v / bet())));
        if (now - lastCoin > 90) { lastCoin = now; coinRain(3); A.coin(); }
        if (k < 1) requestAnimationFrame(step);
        else if (!done) { done = true; closeTimer = setTimeout(close, 2600); requestAnimationFrame(step); }
      };
      const close = () => {
        if (!done) { done = true; setTier(target); amt.textContent = fmt(amount); closeTimer = setTimeout(close, 1800); return; }
        finished = true; clearTimeout(closeTimer);
        el.classList.remove('show'); el.removeEventListener('click', close);
        res();
      };
      el.addEventListener('click', close);
      requestAnimationFrame(step);
    });
  }

  // ── Core spin ──
  async function doSpin(isFree) {
    const fs = state.fs;
    if (!isFree) {
      setBalance(state.balance - bet());
      $('winVal').textContent = '0'; $('winVal').dataset.v = 0;
    }
    winLines = [];
    msg(isFree ? `BEDAVA DÖNÜŞ · ÇARPAN x${fs.mult}` : 'Dönüyor...');
    A.spinStart();

    const final = [];
    for (let c = 0; c < COLS; c++) final.push(genColumn(c));
    await spinReels(final);
    await wait(T(120));

    let spinWin = 0, chain = 0;
    for (;;) {
      const wins = evaluate(grid());
      if (!wins.length) break;
      const mult = fs ? fs.mult : 1;
      const lineSum = wins.reduce((a, w) => a + w.pay, 0);
      const amount = lineSum * lineBet() * mult;
      spinWin += amount;

      const removed = reels.map(() => [false, false, false]);
      const now = performance.now();
      winLines = wins.map((w, i) => ({ line: w.line, color: LINE_COLORS[w.line], t0: now + i * 60 }));
      wins.forEach((w) => w.cells.forEach(([c, r]) => { removed[c][r] = true; reels[c].cells[r].st = 'win'; reels[c].cells[r].t = 0; }));

      // centroid of winning cells for the floating amount
      let sx = 0, sy = 0, n = 0;
      removed.forEach((col, c) => col.forEach((on, r) => { if (on) { sx += OX + c * STEP + CELL / 2; sy += OY + r * STEP + CELL / 2; n++; } }));
      floatText(fmt(amount), sx / n, sy / n, '#ffd36b', mult > 1 ? 72 : 60, T(1300));
      if (mult > 1) floatText(`x${mult}`, sx / n, sy / n + 60, '#7dffb0', 40, T(1300));

      const x = amount / bet();
      A.win(x >= 5 ? 2 : 1);
      msg(wins.length === 1
        ? `${S.DEFS[wins[0].sym].name} x${wins[0].count} · HAT ${wins[0].line + 1} → ${fmt(amount)}`
        : `${wins.length} HAT KAZANDI → ${fmt(amount)}${mult > 1 ? ` (x${mult})` : ''}`);

      if (fs) { fs.total += amount; updateFsBar(); }
      setBalance(state.balance + amount);
      countTo($('winVal'), (fs ? fs.total : spinWin));

      await wait(T(1000));
      // explode winners
      winLines = [];
      A.explode(chain);
      removed.forEach((col, c) => col.forEach((on, r) => {
        if (!on) return;
        const cell = reels[c].cells[r];
        cell.st = 'boom';
        burst(c, r, S.DEFS[cell.sym].color);
      }));
      if (x >= 10) shake();
      await wait(T(280));
      refill(removed);
      await waitSettled();
      chain++;

      if (fs) {
        fs.mult++;
        updateFsBar(); pop($('multChip'));
        A.multUp(fs.mult);
        floatText(`ÇARPAN x${fs.mult}`, W / 2, H / 2, '#7dffb0', 58, T(1100));
      }
      await wait(T(200));
    }

    // scatters
    const g = grid();
    const scatCells = [];
    g.forEach((col, c) => col.forEach((s, r) => { if (s === SCAT) scatCells.push([c, r]); }));
    let fsCount = 0;
    if (scatCells.length >= 3) {
      const n = Math.min(5, scatCells.length);
      const pay = SCAT_PAY[n] * bet();
      spinWin += pay;
      if (fs) { fs.total += pay; }
      setBalance(state.balance + pay);
      countTo($('winVal'), fs ? fs.total : spinWin);
      scatCells.forEach(([c, r]) => { reels[c].cells[r].st = 'scat'; reels[c].cells[r].t = 0; burst(c, r, '#c9a2ff', 30); });
      A.fsTrigger();
      shake();
      if (fs) {
        fs.left += 5;
        msg('+5 BEDAVA DÖNÜŞ!');
        floatText('+5 DÖNÜŞ', W / 2, H / 2, '#c9a2ff', 70, 1800);
      } else {
        fsCount = FS_AWARD[n];
        msg(`${n} BONUS! ${fsCount} BEDAVA DÖNÜŞ KAZANDIN!`);
      }
      updateFsBar();
      await wait(1800);
      scatCells.forEach(([c, r]) => { reels[c].cells[r].st = 'idle'; });
    }

    state.lastWin = spinWin;
    if (spinWin > 0 && tierOf(spinWin / bet()) > 0) {
      await showBigWin(spinWin);
    } else if (spinWin > 0) {
      const p = cellCenter(2, 1);
      coinBurst(p.x, p.y, Math.min(30, 6 + Math.round(spinWin / bet() * 4)));
      if (!fs && !fsCount) msg(`KAZANÇ: ${fmt(spinWin)}`);
    } else if (!fs) {
      msg('Tekrar dene!');
    }
    return { spinWin, fsCount };
  }

  async function runFreeSpins(n) {
    $('fsIntroN').textContent = n;
    A.fsTrigger();
    coinBurst(innerWidth / 2, innerHeight / 2, 50);
    await showOverlay('fsIntro', state.auto ? 3500 : 0);
    state.fs = { left: n, mult: 1, total: 0, played: 0 };
    updateFsBar(); updateUI();
    A.startMusic();
    $('winVal').textContent = '0'; $('winVal').dataset.v = 0;
    await wait(400);
    while (state.fs.left > 0) {
      state.fs.left--; state.fs.played++;
      updateFsBar();
      await doSpin(true);
      await wait(T(500));
    }
    A.stopMusic();
    const fs = state.fs;
    $('fsOutroWin').textContent = fmt(fs.total);
    $('fsOutroInfo').textContent = `${fs.played} dönüşte ulaşılan çarpan: x${fs.mult} · Bahsin ${Math.round((fs.total / bet()) * 10) / 10}x katı`;
    A.bigWin();
    coinRain(60);
    await showOverlay('fsOutro', state.auto ? 4000 : 0);
    msg(`BONUS TOPLAMI: ${fmt(fs.total)}`);
    state.fs = null;
    updateFsBar();
  }

  async function play(buy) {
    if (state.busy || state.fs) return;
    A.unlock();
    const cost = buy ? bet() * BUY_X : bet();
    if (state.balance < cost) {
      setBalance(START_BAL);
      msg('Demo bakiye yenilendi: ' + fmt(START_BAL));
      if (state.balance < cost) { msg('Bu bahis için demo bakiye yetersiz — bahsi düşür.'); state.auto = false; updateUI(); return; }
    }
    state.busy = true; updateUI();
    try {
      if (buy) {
        setBalance(state.balance - cost);
        msg('BONUS SATIN ALINDI!');
        await runFreeSpins(10);
      } else {
        const res = await doSpin(false);
        if (res.fsCount) await runFreeSpins(res.fsCount);
      }
    } finally {
      state.busy = false; updateUI();
    }
    if (state.auto) setTimeout(() => state.auto && play(false), T(350));
  }

  // ── Paytable ──
  function buildPaytable() {
    const grid_ = $('ptGrid');
    const order = [7, 6, 5, 4, 3, 2, 1, 0, 8];
    for (const id of order) {
      const d = S.DEFS[id];
      const item = document.createElement('div'); item.className = 'pt-item';
      const c = document.createElement('canvas'); c.width = c.height = 112;
      c.getContext('2d').drawImage(S.images[id], 0, 0, 112, 112);
      const p = document.createElement('div'); p.className = 'pays';
      p.innerHTML = id === SCAT
        ? `${d.name}<br><span>3</span> 10 FS + 2x<br><span>4</span> 12 FS + 5x<br><span>5</span> 15 FS + 20x`
        : `${d.name}<br><span>5</span> ${d.pays[2]}x<br><span>4</span> ${d.pays[1]}x<br><span>3</span> ${d.pays[0]}x`;
      item.append(c, p); grid_.append(item);
    }
  }

  // ── Wire up ──
  function bind() {
    $('spinBtn').addEventListener('click', () => {
      A.unlock();
      if (state.auto) { state.auto = false; updateUI(); return; }
      A.click(); play(false);
    });
    $('autoBtn').addEventListener('click', () => {
      A.unlock(); A.click();
      state.auto = !state.auto; updateUI();
      if (state.auto) play(false);
    });
    $('turboBtn').addEventListener('click', () => { A.unlock(); A.click(); state.turbo = !state.turbo; updateUI(); });
    $('betUp').addEventListener('click', () => { A.unlock(); A.click(); state.betIdx = Math.min(BETS.length - 1, state.betIdx + 1); updateUI(); });
    $('betDown').addEventListener('click', () => { A.unlock(); A.click(); state.betIdx = Math.max(0, state.betIdx - 1); updateUI(); });
    $('soundBtn').addEventListener('click', () => { A.unlock(); const on = A.toggle(); $('soundBtn').textContent = on ? '🔊' : '🔇'; });
    $('infoBtn').addEventListener('click', () => { A.unlock(); A.click(); $('payModal').classList.add('show'); });
    $('payClose').addEventListener('click', () => $('payModal').classList.remove('show'));
    $('payModal').addEventListener('click', (e) => { if (e.target.id === 'payModal') $('payModal').classList.remove('show'); });
    $('buyBtn').addEventListener('click', () => { A.unlock(); A.click(); updateUI(); $('buyModal').classList.add('show'); });
    $('buyNo').addEventListener('click', () => { A.click(); $('buyModal').classList.remove('show'); });
    $('buyYes').addEventListener('click', () => { $('buyModal').classList.remove('show'); play(true); });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat && !document.querySelector('.overlay.show')) { e.preventDefault(); A.unlock(); play(false); }
    });
    window.addEventListener('resize', resize);
  }

  async function boot() {
    await S.init();
    resize();
    buildPanel();
    initReels();
    buildPaytable();
    bind();
    setBalance(START_BAL, false);
    updateUI();
    requestAnimationFrame(frame);
    window.__slot = { state, reels, evaluate, grid, showBigWin }; // debug hook
  }
  boot();
})();
