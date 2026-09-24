/* Procedurally rendered, pre-cached symbol art (no external images). */
(function () {
  'use strict';

  const RES = 320; // pixel size of each cached symbol canvas

  // id: 0 ruby, 1 emerald, 2 sapphire, 3 amethyst, 4 diamond, 5 seven, 6 crown, 7 wild, 8 scatter
  const DEFS = [
    { key: 'ruby',     name: 'Yakut',    color: '#ff3355', pays: [5, 15, 60] },
    { key: 'emerald',  name: 'Zümrüt',   color: '#22e07a', pays: [5, 15, 60] },
    { key: 'sapphire', name: 'Safir',    color: '#3a8bff', pays: [7, 20, 75] },
    { key: 'amethyst', name: 'Ametist',  color: '#b45cff', pays: [7, 20, 75] },
    { key: 'diamond',  name: 'Elmas',    color: '#bff6ff', pays: [10, 40, 150] },
    { key: 'seven',    name: 'Kırmızı 7', color: '#ff2a2a', pays: [15, 60, 250] },
    { key: 'crown',    name: 'Taç',      color: '#ffd36b', pays: [20, 80, 400] },
    { key: 'wild',     name: 'WILD',     color: '#ff4fb3', pays: [25, 120, 600] },
    { key: 'scatter',  name: 'BONUS',    color: '#9b5cff', pays: [0, 0, 0] },
  ];

  function hexToRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
  }
  function poly(ctx, pts) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
  }
  function ring(n, rx, ry, rot, cx, cy) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return out;
  }

  // Faceted gem: quads between an outer and inner ring, shaded by facing angle.
  function facetGem(ctx, outer, inner, dark, light, cx, cy) {
    const LIGHT = -Math.PI * 0.72; // light from upper-left
    ctx.save();
    ctx.shadowColor = light; ctx.shadowBlur = 30;
    poly(ctx, outer); ctx.fillStyle = dark; ctx.fill();
    ctx.restore();
    const n = outer.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const mx = (outer[i][0] + outer[j][0]) / 2 - cx;
      const my = (outer[i][1] + outer[j][1]) / 2 - cy;
      const ang = Math.atan2(my, mx);
      const t = 0.5 + 0.5 * Math.cos(ang - LIGHT);
      poly(ctx, [outer[i], outer[j], inner[j], inner[i]]);
      ctx.fillStyle = mix(dark, light, 0.15 + t * 0.75);
      ctx.fill();
      // split each facet with a thin line for extra sparkle
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    // table
    const g = ctx.createLinearGradient(cx - 60, cy - 60, cx + 60, cy + 60);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, light); g.addColorStop(1, dark);
    poly(ctx, inner); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.stroke();
    // outline
    poly(ctx, outer); ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 4; ctx.stroke();
    poly(ctx, outer); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
    sparkle(ctx, inner[inner.length > 4 ? inner.length - 2 : 0][0] + 6, inner[inner.length > 4 ? inner.length - 2 : 0][1] + 8, 26);
  }

  function sparkle(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rr = i % 2 ? r * 0.12 : r * 0.9;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function goldGrad(ctx, y0, y1) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, '#fffbe0'); g.addColorStop(0.3, '#ffd36b'); g.addColorStop(0.55, '#e39a1f');
    g.addColorStop(0.75, '#ffe08a'); g.addColorStop(1, '#8a5a12');
    return g;
  }

  function drawRuby(ctx) {
    facetGem(ctx, ring(6, 118, 118, -Math.PI / 2, 160, 165), ring(6, 62, 62, -Math.PI / 2, 160, 160), '#5a0014', '#ff7a8e', 160, 165);
  }
  function drawEmerald(ctx) {
    const o = [[105, 55], [215, 55], [255, 95], [255, 225], [215, 265], [105, 265], [65, 225], [65, 95]];
    const i = [[125, 105], [195, 105], [210, 120], [210, 200], [195, 215], [125, 215], [110, 200], [110, 120]];
    facetGem(ctx, o, i, '#003d1e', '#6dffae', 160, 160);
  }
  function drawSapphire(ctx) {
    facetGem(ctx, ring(4, 115, 130, -Math.PI / 2, 160, 160), ring(4, 55, 62, -Math.PI / 2, 160, 160), '#001a5c', '#7fb8ff', 160, 160);
  }
  function drawAmethyst(ctx) {
    facetGem(ctx, ring(5, 125, 125, -Math.PI / 2, 160, 172), ring(5, 60, 60, -Math.PI / 2, 160, 168), '#2e0059', '#dca8ff', 160, 172);
  }

  function drawDiamond(ctx) {
    const cx = 160;
    const top = 85, girdle = 140, bottom = 280, wT = 70, wG = 130;
    ctx.save();
    ctx.shadowColor = '#9ff4ff'; ctx.shadowBlur = 40;
    poly(ctx, [[cx - wT, top], [cx + wT, top], [cx + wG, girdle], [cx, bottom], [cx - wG, girdle]]);
    ctx.fillStyle = '#6fc9e0'; ctx.fill();
    ctx.restore();
    const shades = ['#e8fdff', '#9ee8f5', '#c8f6ff', '#6fcde6', '#f4ffff', '#8adff0'];
    // crown facets
    const cp = [[cx - wG, girdle], [cx - wT, top], [cx - wT / 3, top], [cx + wT / 3, top], [cx + wT, top], [cx + wG, girdle]];
    const gp = [cx - wG, cx - wG / 2, cx, cx + wG / 2, cx + wG];
    poly(ctx, [cp[0], cp[1], [gp[1], girdle]]); ctx.fillStyle = shades[0]; ctx.fill();
    poly(ctx, [cp[1], cp[2], [gp[1], girdle]]); ctx.fillStyle = shades[1]; ctx.fill();
    poly(ctx, [cp[2], [gp[1], girdle], [gp[2], girdle]]); ctx.fillStyle = shades[2]; ctx.fill();
    poly(ctx, [cp[2], cp[3], [gp[2], girdle]]); ctx.fillStyle = shades[4]; ctx.fill();
    poly(ctx, [cp[3], [gp[2], girdle], [gp[3], girdle]]); ctx.fillStyle = shades[3]; ctx.fill();
    poly(ctx, [cp[3], cp[4], [gp[3], girdle]]); ctx.fillStyle = shades[5]; ctx.fill();
    poly(ctx, [cp[4], cp[5], [gp[3], girdle]]); ctx.fillStyle = shades[3]; ctx.fill();
    // pavilion facets
    for (let k = 0; k < 4; k++) {
      poly(ctx, [[gp[k], girdle], [gp[k + 1], girdle], [cx, bottom]]);
      ctx.fillStyle = ['#bdf3ff', '#5fbad6', '#e6fcff', '#4aa6c4'][k]; ctx.fill();
    }
    poly(ctx, [[cx - wG / 4, girdle], [cx + wG / 4, girdle], [cx, bottom]]);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
    ctx.strokeStyle = 'rgba(20,70,90,0.6)'; ctx.lineWidth = 2;
    poly(ctx, [[cx - wT, top], [cx + wT, top], [cx + wG, girdle], [cx, bottom], [cx - wG, girdle]]); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - wG, girdle); ctx.lineTo(cx + wG, girdle); ctx.stroke();
    sparkle(ctx, cx - 40, top + 18, 40);
    sparkle(ctx, cx + 70, girdle + 20, 22);
  }

  function bigText(ctx, text, size, y, fill, stroke, glow) {
    ctx.save();
    ctx.font = `${size}px 'Lilita One', Impact, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.shadowColor = glow; ctx.shadowBlur = 24;
    ctx.lineWidth = size * 0.2; ctx.strokeStyle = '#2a0b00'; ctx.strokeText(text, 160, y + 6);
    ctx.shadowBlur = 0;
    ctx.lineWidth = size * 0.14; ctx.strokeStyle = stroke; ctx.strokeText(text, 160, y);
    ctx.fillStyle = fill; ctx.fillText(text, 160, y);
    ctx.restore();
  }

  function drawSeven(ctx) {
    const g = ctx.createLinearGradient(0, 40, 0, 290);
    g.addColorStop(0, '#ffb0a0'); g.addColorStop(0.35, '#ff2a2a'); g.addColorStop(0.7, '#b00010'); g.addColorStop(1, '#ff5040');
    bigText(ctx, '7', 280, 175, g, goldGrad(ctx, 40, 290), 'rgba(255,40,40,0.9)');
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    sparkle(ctx, 110, 80, 30);
    ctx.restore();
  }

  function drawCrown(ctx) {
    ctx.save();
    ctx.shadowColor = 'rgba(255,190,60,0.9)'; ctx.shadowBlur = 30;
    const pts = [[45, 235], [30, 95], [100, 160], [160, 60], [220, 160], [290, 95], [275, 235]];
    poly(ctx, pts); ctx.fillStyle = goldGrad(ctx, 60, 240); ctx.fill();
    ctx.restore();
    poly(ctx, pts); ctx.lineWidth = 5; ctx.strokeStyle = '#6b3a00'; ctx.stroke();
    // band
    ctx.beginPath(); ctx.roundRect(38, 220, 244, 52, 12);
    ctx.fillStyle = goldGrad(ctx, 220, 272); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#6b3a00'; ctx.stroke();
    // highlights
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(52, 228); ctx.lineTo(268, 228); ctx.stroke();
    // jewels
    const jewel = (x, y, r, c1, c2) => {
      const g = ctx.createRadialGradient(x - r / 3, y - r / 3, 1, x, y, r);
      g.addColorStop(0, '#fff'); g.addColorStop(0.3, c1); g.addColorStop(1, c2);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#6b3a00'; ctx.stroke();
    };
    jewel(160, 246, 17, '#ff4060', '#6a0018');
    jewel(95, 246, 12, '#3a8bff', '#001a5c');
    jewel(225, 246, 12, '#3a8bff', '#001a5c');
    jewel(160, 60, 16, '#22e07a', '#003d1e');
    jewel(30, 95, 13, '#ff4060', '#6a0018');
    jewel(290, 95, 13, '#ff4060', '#6a0018');
    jewel(160, 175, 20, '#b45cff', '#2e0059');
    sparkle(ctx, 120, 130, 26);
  }

  function star(ctx, cx, cy, r1, r2, n, rot) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i / (n * 2)) * Math.PI * 2;
      const r = i % 2 ? r2 : r1;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
  }

  function drawWild(ctx) {
    // rays
    ctx.save();
    ctx.translate(160, 160);
    for (let i = 0; i < 16; i++) {
      ctx.rotate(Math.PI / 8);
      const g = ctx.createLinearGradient(0, 0, 0, -150);
      g.addColorStop(0, 'rgba(255,120,210,0.7)'); g.addColorStop(1, 'rgba(255,120,210,0)');
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(0, -155); ctx.lineTo(10, 0); ctx.fillStyle = g; ctx.fill();
    }
    ctx.restore();
    // star badge
    ctx.save();
    ctx.shadowColor = '#ff4fb3'; ctx.shadowBlur = 35;
    star(ctx, 160, 160, 140, 88, 8, -Math.PI / 2);
    const g = ctx.createRadialGradient(130, 120, 10, 160, 160, 150);
    g.addColorStop(0, '#ffb8e6'); g.addColorStop(0.5, '#e0288a'); g.addColorStop(1, '#5a0030');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    star(ctx, 160, 160, 140, 88, 8, -Math.PI / 2);
    ctx.lineWidth = 8; ctx.strokeStyle = goldGrad(ctx, 20, 300); ctx.stroke();
    ctx.beginPath(); ctx.arc(160, 160, 78, 0, Math.PI * 2);
    const g2 = ctx.createRadialGradient(140, 130, 5, 160, 160, 80);
    g2.addColorStop(0, '#6a1a9a'); g2.addColorStop(1, '#1a0433');
    ctx.fillStyle = g2; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = goldGrad(ctx, 80, 240); ctx.stroke();
    const tg = ctx.createLinearGradient(0, 120, 0, 200);
    tg.addColorStop(0, '#fffbe0'); tg.addColorStop(0.5, '#ffd36b'); tg.addColorStop(1, '#ff8a00');
    bigText(ctx, 'WILD', 76, 162, tg, '#7a2a00', 'rgba(255,200,80,0.9)');
    sparkle(ctx, 95, 85, 28);
  }

  function drawScatter(ctx) {
    ctx.save();
    ctx.translate(160, 160);
    // outer glow
    const og = ctx.createRadialGradient(0, 0, 40, 0, 0, 158);
    og.addColorStop(0, 'rgba(155,92,255,0.9)'); og.addColorStop(0.6, 'rgba(90,30,200,0.5)'); og.addColorStop(1, 'rgba(60,0,150,0)');
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(0, 0, 158, 0, Math.PI * 2); ctx.fill();
    // swirl arms
    for (let arm = 0; arm < 5; arm++) {
      ctx.save();
      ctx.rotate((arm / 5) * Math.PI * 2);
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.02) {
        const r = 20 + t * 125, a = t * 4.2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.lineWidth = 14; ctx.lineCap = 'round';
      const sg = ctx.createRadialGradient(0, 0, 10, 0, 0, 145);
      sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.4, '#c9a2ff'); sg.addColorStop(1, 'rgba(120,60,255,0)');
      ctx.strokeStyle = sg; ctx.stroke();
      ctx.restore();
    }
    // event horizon
    const hg = ctx.createRadialGradient(0, 0, 0, 0, 0, 55);
    hg.addColorStop(0, '#000'); hg.addColorStop(0.75, '#08001a'); hg.addColorStop(0.9, '#ffcf6b'); hg.addColorStop(1, 'rgba(255,160,40,0)');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, 0, 55, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // label
    ctx.save();
    ctx.beginPath(); ctx.roundRect(40, 222, 240, 64, 18);
    const lg = ctx.createLinearGradient(0, 222, 0, 286);
    lg.addColorStop(0, '#8c4bff'); lg.addColorStop(1, '#2e0a73');
    ctx.fillStyle = lg; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = goldGrad(ctx, 222, 286); ctx.stroke();
    ctx.restore();
    const tg = ctx.createLinearGradient(0, 230, 0, 280);
    tg.addColorStop(0, '#fffbe0'); tg.addColorStop(1, '#ffb52e');
    bigText(ctx, 'BONUS', 52, 254, tg, '#4a1a00', 'rgba(255,200,80,0.8)');
  }

  const DRAW = [drawRuby, drawEmerald, drawSapphire, drawAmethyst, drawDiamond, drawSeven, drawCrown, drawWild, drawScatter];

  function renderOne(id) {
    const c = document.createElement('canvas');
    c.width = c.height = RES;
    const ctx = c.getContext('2d');
    DRAW[id](ctx);
    return c;
  }

  // Vertical motion-blur variant used while reels spin fast.
  function blurred(src) {
    const c = document.createElement('canvas');
    c.width = c.height = RES;
    const ctx = c.getContext('2d');
    const steps = 9;
    for (let i = 0; i < steps; i++) {
      ctx.globalAlpha = 0.22;
      ctx.drawImage(src, 0, (i - steps / 2) * 9);
    }
    return c;
  }

  const Symbols = {
    DEFS,
    WILD: 7,
    SCATTER: 8,
    images: [],
    blur: [],
    async init() {
      try {
        await Promise.race([
          Promise.all([document.fonts.load("80px 'Lilita One'"), document.fonts.load("900 40px 'Cinzel Decorative'")]),
          new Promise((r) => setTimeout(r, 2500)),
        ]);
      } catch (e) { /* fonts optional */ }
      this.images = DEFS.map((_, i) => renderOne(i));
      this.blur = this.images.map(blurred);
    },
  };

  window.Symbols = Symbols;
})();
