// Isometric pixel-art dojo for the V3 call lab.
// Everything here is drawn procedurally — there are no external sprites or
// image assets, so the art is original to this project.

export const SCENE_W = 368;
export const SCENE_H = 232;

const GRID = 10;
const OX = 184;
const OY = 56;
const DOJO_H = 34;
const HOME_H = 22;
const SLAB_H = 13;
const INK = '#2a2233';

const SPOTS = {
  staff: { gx: 1.7, gy: 2 },
  desk: { gx: 3, gy: 2 },
  seat: { gx: 4.3, gy: 2 },
  entry: { gx: 9.9, gy: 2 },
  home: { gx: 8.3, gy: 8.2 },
  student: { gx: 1.2, gy: 4.2 },
};

const CLOSE_FOCUS = { x: 200, y: 94 };

const STAFF_LOOK = { skin: '#f2c79b', hair: '#3b2a20', hairStyle: 'short', top: '#f7f7f2', topDark: '#d5d5cc', bottom: '#ecece6', belt: '#23232b', gi: true };
const STUDENT_LOOK = { skin: '#e2ad7e', hair: '#1f1f24', hairStyle: 'spiky', top: '#f7f7f2', topDark: '#d5d5cc', bottom: '#ecece6', belt: '#e9b92f', gi: true };
export const DEFAULT_CALLER_LOOK = { skin: '#f2c79b', hair: '#8a5a2b', hairStyle: 'bob', top: '#4c8bd9', topDark: '#3a6fb3', bottom: '#3a4a6b' };

// ---------- helpers ----------

function iso(gx, gy) {
  return { x: OX + (gx - gy) * 16, y: OY + (gx + gy) * 8 };
}

function center(gx, gy) {
  const p = iso(gx, gy);
  return { x: Math.round(p.x), y: Math.round(p.y + 8) };
}

function hash2(x, y) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

const frac = (v) => v - Math.floor(v);

const shadeCache = new Map();
function shade(hex, f) {
  const key = hex + f;
  let out = shadeCache.get(key);
  if (!out) {
    const ch = (i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f)));
    out = `#${[1, 3, 5].map((i) => ch(i).toString(16).padStart(2, '0')).join('')}`;
    shadeCache.set(key, out);
  }
  return out;
}

function diamond(ctx, cx, topY, half, color) {
  ctx.fillStyle = color;
  const mid = half / 2;
  for (let r = 0; r < half; r += 1) {
    const hw = r < mid ? (r + 1) * 2 : (half - r) * 2;
    ctx.fillRect(cx - hw, topY + r, hw * 2, 1);
  }
}

function block(ctx, cx, topY, half, h, top, left, right) {
  const mid = half / 2;
  for (let x = 0; x < half; x += 1) {
    ctx.fillStyle = left;
    ctx.fillRect(cx - half + x, topY + mid + (x >> 1) - h, 1, h + 1);
    ctx.fillStyle = right;
    ctx.fillRect(cx + x, topY + half - 1 - (x >> 1) - h, 1, h + 1);
  }
  diamond(ctx, cx, topY - h, half, top);
}

function drawPixels(ctx, x, y, rows, palette) {
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    for (let c = 0; c < row.length; c += 1) {
      const color = palette[row[c]];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x + c, y + r, 1, 1);
      }
    }
  }
}

// Adds a one-pixel 'o' outline around string art.
function outline(rows) {
  const w = Math.max(...rows.map((r) => r.length)) + 2;
  const grid = ['.'.repeat(w), ...rows.map((r) => `.${r.padEnd(w - 2, '.')}.`), '.'.repeat(w)];
  const filled = (r, c) => grid[r]?.[c] && grid[r][c] !== '.';
  return grid.map((row, r) => row.split('').map((ch, c) => {
    if (ch !== '.') return ch;
    return filled(r - 1, c) || filled(r + 1, c) || filled(r, c - 1) || filled(r, c + 1) ? 'o' : '.';
  }).join(''));
}

// ---------- ground ----------

const WOOD = { tones: ['#c98f55', '#c2874e', '#d09a61'], seam: '#a56f3e' };
const HOME_WOOD = { tones: ['#dcae7c', '#d3a370', '#e2b888'], seam: '#b98a5a' };
const TREES = [
  { gx: 7, gy: 0.3, kind: 'cherry' }, { gx: 9.2, gy: 0.5, kind: 'pine' }, { gx: 0.2, gy: 6.9, kind: 'cherry' },
  { gx: 3.6, gy: 7.2, kind: 'round' }, { gx: 5.9, gy: 9.2, kind: 'cherry' }, { gx: 0.3, gy: 9.2, kind: 'pine' },
  { gx: 9.3, gy: 6, kind: 'round' },
];
const STEPPING_STONES = [[7, 3.5], [7, 4.3], [6.9, 5.1], [6.8, 5.9], [6.7, 6.7], [6.8, 7.5]];
const SAND_ROCKS = [[8.3, 4.4], [9, 5.2]];

function planks(k, along, pal) {
  const plank = Math.floor(k * 3);
  const h = hash2(plank, 7);
  if (k * 3 - plank < 0.2) return pal.seam;
  if (frac(along * 0.5 + (h % 7) / 7) < 0.035) return pal.seam;
  return pal.tones[h % pal.tones.length];
}

function cushion(A, B, ca, cb, color) {
  const d = Math.hypot(A - ca, B - cb);
  if (d < 0.27) return color;
  if (d < 0.36) return shade(color, 0.72);
  return null;
}

function groundColor(A, B, px, py) {
  const n = hash2(px, py) % 100;

  if (A < 6 && B < 6) {
    let c;
    if (A < 3 && B >= 3) {
      const col = Math.floor(A);
      const fa = frac(A);
      const fb = frac((B - 3) / 1.5 + (col % 2 ? 0.5 : 0));
      if (fa < 0.07 || fa > 0.93 || fb < 0.05 || fb > 0.95) c = '#5f7a3a';
      else c = (px + py * 2) % 3 === 0 ? '#a9b85f' : '#bac76e';
    } else if (B >= 2.24 && B < 2.76 && A >= 4.95) {
      c = B < 2.31 || B > 2.69 ? '#e2b84a' : '#b23c3c';
    } else {
      c = planks(B, A, WOOD);
    }
    c = cushion(A, B, SPOTS.seat.gx + 0.5, SPOTS.seat.gy + 0.5, '#c9463f')
      || cushion(A, B, SPOTS.staff.gx + 0.5, SPOTS.staff.gy + 0.5, '#3f6fb0')
      || c;
    const edge = Math.min(A, B);
    if (edge < 0.3) return shade(c, 0.84);
    if (edge < 0.6) return shade(c, 0.93);
    return c;
  }

  if (A >= 7 && B >= 7) {
    let c = planks(A, B, HOME_WOOD);
    const rug = Math.hypot(A - SPOTS.home.gx - 0.5, (B - SPOTS.home.gy - 0.5) * 1.1);
    if (rug < 0.62) c = '#b9d0ee';
    else if (rug < 0.86) c = '#7fa6d9';
    else if (rug < 0.94) c = '#5f86bd';
    const edge = Math.min(A - 7, B - 7);
    if (edge < 0.3) return shade(c, 0.84);
    if (edge < 0.6) return shade(c, 0.93);
    return c;
  }

  const blot = hash2(px >> 3, py >> 2) % 100;
  let grass = blot < 35 ? '#63b348' : '#6fbf4f';
  if (n < 8) grass = '#57a53f';
  else if (n > 93) grass = '#86d063';
  if (hash2(px * 3 + 1, py * 5 + 2) % 420 === 0) grass = ['#ffffff', '#ffc4dc', '#ffe27a'][n % 3];
  if (A > 9.8 || B > 9.8) grass = '#58a642';

  if (B >= 2 && B < 3 && A >= 6) {
    const e = Math.min(B - 2, 3 - B);
    if (e < 0.1) return n < 45 ? grass : '#c09c66';
    if (n < 12) return '#cba873';
    if (n > 90) return '#ecd4a6';
    return '#dcbd88';
  }

  for (let i = 0; i < STEPPING_STONES.length; i += 1) {
    const d = Math.hypot(A - STEPPING_STONES[i][0], B - STEPPING_STONES[i][1]);
    if (d < 0.2) return n > 70 ? '#aab0b5' : '#bfc5c9';
    if (d < 0.27) return '#868c91';
  }

  const pond = ((A - 2) / 1.25) ** 2 + ((B - 8.5) / 1.05) ** 2;
  if (pond < 1) {
    if (Math.hypot(A - 1.6, B - 8.2) < 0.17 || Math.hypot(A - 2.6, B - 8.95) < 0.14) return '#4fa95a';
    if (pond > 0.86) return '#86cbee';
    return pond < 0.45 ? '#2b86c9' : '#3f9edc';
  }
  if (pond < 1.3) {
    if (n < 35) return '#8f989e';
    if (n < 55) return '#b9c0c4';
    return '#d9cfa4';
  }

  if (A >= 7.6 && A < 9.6 && B >= 3.6 && B < 5.6) {
    const e = Math.min(A - 7.6, 9.6 - A, B - 3.6, 5.6 - B);
    if (e < 0.08) return n % 2 ? '#9aa1a6' : '#b1b7bb';
    for (let i = 0; i < SAND_ROCKS.length; i += 1) {
      const r = Math.hypot(A - SAND_ROCKS[i][0], B - SAND_ROCKS[i][1]);
      if (r < 0.62) return frac(r * 6) < 0.4 ? '#d6c797' : '#ede3bd';
    }
    return frac(B * 6) < 0.4 ? '#d6c797' : '#ede3bd';
  }

  return grass;
}

// Bottom edge of the island per screen column, used for the animated foam.
const slabBottom = new Array(SCENE_W).fill(-1);

export function createStaticLayer() {
  const layer = document.createElement('canvas');
  layer.width = SCENE_W;
  layer.height = SCENE_H;
  const ctx = layer.getContext('2d');

  for (let px = 0; px < SCENE_W; px += 1) {
    let bottom = -1;
    const dx = px + 0.5 - OX;
    for (let py = 0; py < SCENE_H; py += 1) {
      const dy = py + 0.5 - OY;
      const A = dx / 32 + dy / 16;
      const B = dy / 16 - dx / 32;
      if (A < 0 || B < 0 || A >= GRID || B >= GRID) continue;
      ctx.fillStyle = groundColor(A, B, px, py);
      ctx.fillRect(px, py, 1, 1);
      bottom = py;
    }
    if (bottom < 0) continue;
    const left = px < OX;
    for (let r = 1; r <= SLAB_H; r += 1) {
      let c = left ? '#8a6240' : '#6b4a30';
      if (r <= 3) c = left ? '#4c963a' : '#3f8431';
      else if (r === 8 || (r === 5 && hash2(px, 3) % 3 === 0)) c = left ? '#74512f' : '#593c26';
      else if (r > SLAB_H - 2) c = left ? '#5c4129' : '#47301f';
      ctx.fillStyle = c;
      ctx.fillRect(px, bottom + r, 1, 1);
    }
    slabBottom[px] = bottom + SLAB_H + 1;
  }

  // Soft shadows under the trees.
  ctx.fillStyle = 'rgba(20,45,25,0.2)';
  TREES.forEach((tree) => {
    const c = center(tree.gx, tree.gy);
    for (let y = -3; y <= 3; y += 1) {
      const hw = Math.round(8 * Math.sqrt(1 - (y * y) / 12));
      ctx.fillRect(c.x - hw, c.y + y, hw * 2, 1);
    }
  });

  return layer;
}

// ---------- walls ----------

function wallPatch(ctx, p, side, H, x0, x1, top, h, color) {
  ctx.fillStyle = color;
  for (let x = x0; x <= x1; x += 1) {
    const px = side === 'NE' ? p.x + x : p.x - 1 - x;
    ctx.fillRect(px, p.y + (x >> 1) - H + top, 1, h);
  }
}

const FRAME = '#6b4126';
const DOJO_ROOF = { tile: '#4a6da3', hi: '#6b8fc4', groove: '#34527f', cap: '#2c446b', capHi: '#7d9fd1', eave: '#22375a' };
const HOME_ROOF = { tile: '#c4603f', hi: '#de8062', groove: '#9e452b', cap: '#8a3a24', capHi: '#eb9a7c', eave: '#6f2d1b' };

function roofBand(ctx, p, side, H, c, height) {
  for (let x = 0; x < 16; x += 1) {
    const color = x % 4 === 3 ? c.groove : x % 4 === 0 ? c.hi : c.tile;
    wallPatch(ctx, p, side, H, x, x, -height, height, color);
  }
  wallPatch(ctx, p, side, H, 0, 15, -height - 2, 2, c.cap);
  wallPatch(ctx, p, side, H, 0, 15, -height - 2, 1, c.capHi);
  wallPatch(ctx, p, side, H, 0, 15, -1, 2, c.eave);
}

function windowPatch(ctx, p, side, H, top, height) {
  wallPatch(ctx, p, side, H, 3, 13, top, height, FRAME);
  wallPatch(ctx, p, side, H, 4, 12, top + 1, height - 2, '#a8dcf2');
  wallPatch(ctx, p, side, H, 4, 7, top + 1, 2, '#d6f1fb');
  wallPatch(ctx, p, side, H, 8, 8, top + 1, height - 2, FRAME);
  wallPatch(ctx, p, side, H, 4, 12, top + Math.floor(height / 2), 1, FRAME);
}

const BELTS = ['#ffffff', '#f2d23c', '#f08a2c', '#3fa34d', '#3b6fd1', '#7a4a2a', '#1f1f24'];

function dojoWall(ctx, gx, gy, side, decor, last) {
  const p = iso(gx, gy);
  const H = DOJO_H;
  const lit = side === 'NE';
  const paper = lit ? '#f8f0dc' : '#e7dcc3';
  const lattice = lit ? '#c9ad7c' : '#b89a6a';
  const wood = lit ? '#b98250' : '#a06d40';

  wallPatch(ctx, p, side, H, 0, 15, 0, H + 1, paper);
  if (decor === 'shoji') {
    wallPatch(ctx, p, side, H, 6, 6, 3, H - 13, lattice);
    wallPatch(ctx, p, side, H, 11, 11, 3, H - 13, lattice);
    wallPatch(ctx, p, side, H, 0, 15, 9, 1, lattice);
    wallPatch(ctx, p, side, H, 0, 15, 16, 1, lattice);
  }
  wallPatch(ctx, p, side, H, 0, 15, H - 10, 11, wood);
  wallPatch(ctx, p, side, H, 0, 15, H - 10, 1, shade(wood, 0.75));
  wallPatch(ctx, p, side, H, 0, 15, H - 1, 2, shade(wood, 0.7));
  wallPatch(ctx, p, side, H, 0, 15, 0, 3, FRAME);
  wallPatch(ctx, p, side, H, 0, 1, 0, H + 1, FRAME);
  if (last) wallPatch(ctx, p, side, H, 14, 15, 0, H + 1, FRAME);

  if (decor === 'window') windowPatch(ctx, p, side, H, 6, 13);
  if (decor === 'scroll') {
    wallPatch(ctx, p, side, H, 5, 11, 5, 1, FRAME);
    wallPatch(ctx, p, side, H, 6, 10, 6, 15, '#fffaf0');
    wallPatch(ctx, p, side, H, 7, 9, 8, 3, '#d2413c');
    wallPatch(ctx, p, side, H, 8, 8, 13, 6, '#3a3a44');
    wallPatch(ctx, p, side, H, 5, 11, 21, 1, FRAME);
  }
  if (decor === 'belts') {
    wallPatch(ctx, p, side, H, 2, 15, 5, 16, '#cdbb96');
    wallPatch(ctx, p, side, H, 2, 15, 5, 1, FRAME);
    BELTS.forEach((color, i) => wallPatch(ctx, p, side, H, 3 + i * 2, 3 + i * 2, 6, 10 + (i % 2) * 3, color));
  }
  if (decor === 'rack') {
    wallPatch(ctx, p, side, H, 3, 4, 6, 14, FRAME);
    wallPatch(ctx, p, side, H, 12, 13, 6, 14, FRAME);
    [8, 12, 16].forEach((row, i) => wallPatch(ctx, p, side, H, 2, 14, row, 1, i === 1 ? '#c9a15a' : '#8a5a2b'));
  }
  if (decor === 'trophies') {
    wallPatch(ctx, p, side, H, 3, 13, 15, 2, FRAME);
    wallPatch(ctx, p, side, H, 4, 5, 10, 5, '#f2c230');
    wallPatch(ctx, p, side, H, 8, 9, 8, 7, '#ffd95a');
    wallPatch(ctx, p, side, H, 12, 12, 11, 4, '#d9a81f');
  }
  roofBand(ctx, p, side, H, DOJO_ROOF, 8);
}

function homeWall(ctx, gx, gy, side, decor, last) {
  const p = iso(gx, gy);
  const H = HOME_H;
  const lit = side === 'NE';
  const plaster = lit ? '#f8e2cc' : '#e9cdb3';
  const wood = lit ? '#b5814f' : '#9c6b3f';

  wallPatch(ctx, p, side, H, 0, 15, 0, H + 1, plaster);
  wallPatch(ctx, p, side, H, 0, 15, H - 4, 5, wood);
  wallPatch(ctx, p, side, H, 0, 15, H - 4, 1, shade(wood, 0.75));
  wallPatch(ctx, p, side, H, 0, 15, 0, 2, FRAME);
  wallPatch(ctx, p, side, H, 0, 1, 0, H + 1, FRAME);
  if (last) wallPatch(ctx, p, side, H, 14, 15, 0, H + 1, FRAME);

  if (decor === 'window') windowPatch(ctx, p, side, H, 5, 9);
  if (decor === 'door') {
    wallPatch(ctx, p, side, H, 4, 12, 4, H - 3, FRAME);
    wallPatch(ctx, p, side, H, 5, 11, 5, H - 4, '#9a6238');
    wallPatch(ctx, p, side, H, 6, 10, 7, 5, '#b37a48');
    wallPatch(ctx, p, side, H, 10, 10, 14, 2, '#f2c230');
  }
  if (decor === 'picture') {
    wallPatch(ctx, p, side, H, 5, 11, 5, 8, FRAME);
    wallPatch(ctx, p, side, H, 6, 10, 6, 6, '#8fc7a0');
    wallPatch(ctx, p, side, H, 6, 10, 9, 3, '#5f9a78');
  }
  roofBand(ctx, p, side, H, HOME_ROOF, 5);
}

function fence(ctx, gx, gy, side) {
  const p = iso(gx, gy);
  const H = 8;
  wallPatch(ctx, p, side, H, 0, 15, 2, 1, '#cdb46a');
  wallPatch(ctx, p, side, H, 0, 15, 5, 1, '#b39a55');
  [0, 8].forEach((x) => {
    wallPatch(ctx, p, side, H, x, x, 0, H + 1, '#dcc47a');
    wallPatch(ctx, p, side, H, x + 1, x + 1, 0, H + 1, '#9c8344');
  });
}

// ---------- props ----------

const TREE = outline([
  '.....gggggg.....',
  '...ggGGGGGGgg...',
  '..gGGLLLGGGGGg..',
  '.gGGLLLGGGGGGGg.',
  '.gGLLGGGGGGGGgg.',
  'gGGGGGGGGGGGGggg',
  'gGGGGGGGGGGGgggg',
  'gGGGGGGGGGGggggd',
  'gGGGGGGGGggggddd',
  '.gGGGGgggggdddd.',
  '.gggggggggdddd..',
  '..gggdddddddd...',
  '....dddttdd.....',
  '.......tt.......',
  '.......tT.......',
  '......ttTT......',
]);
const TREE_PALS = {
  round: { g: '#4fa23c', G: '#69bf4c', L: '#8fd867', d: '#3b8233', t: '#8a5a2b', T: '#6e4520', o: '#2c5f2a' },
  cherry: { g: '#f094b4', G: '#f8b9cf', L: '#ffe1ea', d: '#d6709a', t: '#6b4433', T: '#553427', o: '#9c4a6e' },
};

const PINE = outline([
  '.....pp.....',
  '....pPPp....',
  '...pPPPPp...',
  '..pPPPPPdp..',
  '...pPPPdp...',
  '..pPPPPPdp..',
  '.pPPPPPPddp.',
  '..pPPPPddp..',
  '.pPPPPPPddp.',
  'pPPPPPPPdddp',
  '.....tt.....',
  '.....tT.....',
]);
const PINE_PAL = { p: '#2f7a4a', P: '#44a362', d: '#2a6a40', t: '#8a5a2b', T: '#6e4520', o: '#1f4f33' };

const BUSH = outline(['..gggggg..', '.gGGLGGGg.', 'gGGGGGfGgg', 'gGfGGGGggd', '.gggggddd.']);
const BUSH_PAL = { g: '#4fa23c', G: '#69bf4c', L: '#8fd867', d: '#3b8233', f: '#ff9ec4', o: '#2c5f2a' };

const LANTERN = outline([
  '...s...', '..sss..', '.sssss.', 'sssssss', '.sYYYs.', '.sYYYs.',
  'sssssss', '..sss..', '..sSs..', '..sSs..', '.sssss.', 'sssssss',
]);
const STONE_PAL = { s: '#b1b7bc', S: '#8d949a', Y: '#ffd76a', r: '#9aa1a7', R: '#c3c9cd', d: '#7b8288', o: '#565b61' };

const ROCK = outline(['..rrrr..', '.rRRRrr.', 'rRRrrrrd', 'rrrrrrdd', '.rrrddd.']);

const BONSAI = outline([
  '..gggg..', '.gGGGGg.', 'gGGLGGGg', '.gGGGGg.', '..ggtg..', '...tt...', '.pppppp.', '.pPPPPp.', '..pppp..',
]);
const BONSAI_PAL = { g: '#3f8f3a', G: '#63b84f', L: '#8fd867', t: '#6e4520', p: '#b5653c', P: '#d1855a', o: '#2c4a2a' };

const DUMMY = outline([
  '...ww...', '..wWWw..', '..wWWw..', '...ww...', 'ww.ww.ww', '.wwwwww.', '...ww...',
  '...ww.w.', '...wwww.', '...ww...', '...ww...', '...ww...', '..wwww..', '.wwwwww.',
]);
const DUMMY_PAL = { w: '#b98250', W: '#dcab75', o: '#5a3a22' };

const DRUM = outline([
  '..cccccc..', '.crrrrrrc.', 'crrRRrrrrc', 'crrRRrrrrc', 'crrrrrrrrc', '.crrrrrrc.', '..cccccc..', '..k....k..', '.kk....kk.',
]);
const DRUM_PAL = { c: '#f3e6c4', r: '#b5403a', R: '#d9645a', k: '#5a3a22', o: '#3a2418' };

const BOOKSHELF = outline([
  'kkkkkkkkkk', 'kabcabbcak', 'kabcabbcak', 'kkkkkkkkkk', 'kcbaacbabk', 'kcbaacbabk',
  'kkkkkkkkkk', 'kbacbbacck', 'kbacbbacck', 'kkkkkkkkkk', 'kk......kk',
]);
const BOOK_PAL = { a: '#d9534f', b: '#4c8bd9', c: '#e8c15a', k: '#8a5a34', o: '#4a2d18' };

function sprite(gx, gy, rows, pal) {
  const c = center(gx, gy);
  const x = c.x - Math.floor(rows[0].length / 2);
  const y = c.y - rows.length + 2;
  return { depth: gx + gy, draw: (ctx) => drawPixels(ctx, x, y, rows, pal) };
}

function flag(gx, gy, color) {
  const c = center(gx, gy);
  return {
    depth: gx + gy,
    draw: (ctx, t) => {
      ctx.fillStyle = INK;
      ctx.fillRect(c.x - 1, c.y - 27, 3, 28);
      ctx.fillStyle = '#d9c9a0';
      ctx.fillRect(c.x, c.y - 26, 1, 26);
      const sway = Math.floor(t * 2 + gx) % 2;
      for (let r = 0; r < 17; r += 1) {
        const off = r > 8 ? sway : 0;
        ctx.fillStyle = INK;
        ctx.fillRect(c.x + 1 + off, c.y - 26 + r, 8, 1);
        ctx.fillStyle = r === 0 || r === 16 ? shade(color, 0.7) : color;
        ctx.fillRect(c.x + 2 + off, c.y - 26 + r, 6, 1);
        if (r === 3 || r === 4 || r === 8 || r === 12) {
          ctx.fillStyle = '#fff6e0';
          ctx.fillRect(c.x + 3 + off, c.y - 26 + r, r === 8 ? 4 : 3, 1);
        }
      }
    },
  };
}

export function buildStaticDrawables() {
  const list = [];
  const dojoNE = ['shoji', 'scroll', 'shoji', 'trophies', 'window', 'shoji'];
  const dojoNW = ['shoji', 'window', 'shoji', 'belts', 'rack', 'shoji'];
  for (let i = 0; i <= 5; i += 1) {
    list.push({ depth: i - 0.5, draw: (ctx) => dojoWall(ctx, i, 0, 'NE', dojoNE[i], i === 5) });
    list.push({ depth: i - 0.5, draw: (ctx) => dojoWall(ctx, 0, i, 'NW', dojoNW[i], i === 5) });
  }
  for (let i = 6; i <= 9; i += 1) {
    list.push({ depth: i - 0.5, draw: (ctx) => fence(ctx, i, 0, 'NE') });
    list.push({ depth: i - 0.5, draw: (ctx) => fence(ctx, 0, i, 'NW') });
  }
  const homeNE = ['picture', 'window', 'picture'];
  const homeNW = ['door', 'window', 'picture'];
  for (let i = 7; i <= 9; i += 1) {
    list.push({ depth: i + 7 - 0.5, draw: (ctx) => homeWall(ctx, i, 7, 'NE', homeNE[i - 7], i === 9) });
    list.push({ depth: i + 7 - 0.5, draw: (ctx) => homeWall(ctx, 7, i, 'NW', homeNW[i - 7], i === 9) });
  }

  // Front desk with a laptop, a notepad and a phone.
  list.push({
    depth: SPOTS.desk.gx + SPOTS.desk.gy,
    draw: (ctx) => {
      const p = iso(SPOTS.desk.gx, SPOTS.desk.gy);
      block(ctx, p.x, p.y + 2, 12, 9, '#c58a55', '#94603a', '#7a4c2c');
      diamond(ctx, p.x, p.y - 6, 10, '#d29a64');
      ctx.fillStyle = '#3a3f52';
      ctx.fillRect(p.x - 5, p.y - 5, 5, 3);
      ctx.fillStyle = '#9fd3ea';
      ctx.fillRect(p.x - 4, p.y - 4, 3, 1);
      ctx.fillStyle = '#fdfdf6';
      ctx.fillRect(p.x + 1, p.y - 2, 4, 2);
      ctx.fillStyle = '#20232b';
      ctx.fillRect(p.x + 4, p.y - 5, 3, 2);
    },
  });

  // Side table with a lamp in the caller's home.
  list.push({
    depth: 7.3 + 8.8,
    draw: (ctx) => {
      const p = iso(7.3, 8.8);
      block(ctx, Math.round(p.x), Math.round(p.y) + 5, 6, 5, '#c58a55', '#9c6a3e', '#835733');
      ctx.fillStyle = INK;
      ctx.fillRect(Math.round(p.x) - 3, Math.round(p.y) - 6, 6, 6);
      ctx.fillStyle = '#ffd76a';
      ctx.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 5, 4, 3);
      ctx.fillStyle = '#8a5a34';
      ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 2, 2, 2);
    },
  });

  // Entrance gate: back post first, front post and beams after anyone walking through.
  const gate = center(8, 2);
  const post = (ctx, x, y) => {
    ctx.fillStyle = INK;
    ctx.fillRect(x - 1, y - 30, 5, 31);
    ctx.fillStyle = '#d2463f';
    ctx.fillRect(x, y - 29, 3, 28);
    ctx.fillStyle = '#a8322c';
    ctx.fillRect(x + 2, y - 29, 1, 28);
    ctx.fillStyle = '#4a4a55';
    ctx.fillRect(x - 1, y - 2, 5, 3);
  };
  list.push({ depth: 10 - 0.4, draw: (ctx) => post(ctx, gate.x + 8, gate.y - 5) });
  list.push({
    depth: 10 + 0.4,
    draw: (ctx) => {
      post(ctx, gate.x - 11, gate.y + 5);
      for (let x = -17; x <= 17; x += 1) {
        const y = gate.y - Math.floor(x / 2);
        ctx.fillStyle = INK;
        ctx.fillRect(gate.x + x, y - 38, 1, 7);
        ctx.fillStyle = '#2f2f3a';
        ctx.fillRect(gate.x + x, y - 37, 1, 2);
        ctx.fillStyle = '#d2463f';
        ctx.fillRect(gate.x + x, y - 35, 1, 3);
        if (x >= -13 && x <= 13) {
          ctx.fillStyle = INK;
          ctx.fillRect(gate.x + x, y - 28, 1, 4);
          ctx.fillStyle = '#c23d37';
          ctx.fillRect(gate.x + x, y - 27, 1, 2);
        }
      }
    },
  });

  TREES.forEach((tree) => {
    list.push(tree.kind === 'pine'
      ? sprite(tree.gx, tree.gy, PINE, PINE_PAL)
      : sprite(tree.gx, tree.gy, TREE, TREE_PALS[tree.kind]));
  });
  list.push(sprite(6, 1.05, LANTERN, STONE_PAL));
  list.push(sprite(6, 2.95, LANTERN, STONE_PAL));
  list.push(sprite(8.3, 4.4 - 0.5, ROCK, STONE_PAL));
  list.push(sprite(8.6, 4.75, ROCK, STONE_PAL));
  list.push(sprite(0.6, 7.6, ROCK, STONE_PAL));
  list.push(sprite(3.1, 8.7, BUSH, BUSH_PAL));
  list.push(sprite(6.1, 4, BUSH, BUSH_PAL));
  list.push(sprite(4.4, 9.4, BUSH, BUSH_PAL));
  list.push(sprite(8.2, 0.9, BUSH, BUSH_PAL));
  list.push(sprite(4.5, 0.3, DRUM, DRUM_PAL));
  list.push(sprite(5.4, 5.3, BONSAI, BONSAI_PAL));
  list.push(sprite(2.4, 4.3, DUMMY, DUMMY_PAL));
  list.push(sprite(8.7, 7.1, BOOKSHELF, BOOK_PAL));
  list.push(sprite(9.5, 9.3, BONSAI, BONSAI_PAL));
  list.push(flag(9.2, 1.1, '#d2463f'));
  list.push(flag(9.2, 2.9, '#3f6fb0'));

  return list;
}

// ---------- people ----------

const PW = 22;
const PH = 25;
const PX = 5; // left column of the head

function put(buf, x, y, w, h, color) {
  for (let yy = Math.max(0, y); yy < Math.min(PH, y + h); yy += 1) {
    for (let xx = Math.max(0, x); xx < Math.min(PW, x + w); xx += 1) buf[yy * PW + xx] = color;
  }
}

function drawPerson(ctx, p, t) {
  const c = center(p.gx, p.gy);
  const L = p.look;
  const sit = p.pose === 'sit';
  const walk = p.pose === 'walk';
  const step = walk ? Math.floor(t * 9) % 4 : 0;
  let bob = 0;
  if (p.talking && p.volume > 0.45) bob = -1;
  else if (p.nod) bob = 1;
  else if (walk && step % 2) bob = -1;
  const oy = (sit ? 3 : 0) + bob;
  const buf = new Array(PW * PH).fill(null);
  const shoe = L.gi ? L.skin : '#3a2f2a';

  if (sit) {
    put(buf, PX, 21, 12, 2, L.bottom);
    put(buf, PX + 1, 20, 10, 1, L.bottom);
  } else {
    const liftL = step === 1 ? 1 : 0;
    const liftR = step === 3 ? 1 : 0;
    put(buf, PX + 2, 18, 3, 4 - liftL, L.bottom);
    put(buf, PX + 2, 22 - liftL, 4, 1, shoe);
    put(buf, PX + 7, 18, 3, 4 - liftR, L.bottom);
    put(buf, PX + 7, 22 - liftR, 4, 1, shoe);
  }

  put(buf, PX + 2, 12 + oy, 8, 7, L.top);
  if (L.gi) {
    put(buf, PX + 4, 12 + oy, 1, 1, L.topDark);
    put(buf, PX + 5, 13 + oy, 1, 1, L.topDark);
    put(buf, PX + 6, 14 + oy, 1, 2, L.topDark);
    put(buf, PX + 7, 12 + oy, 1, 1, L.topDark);
    put(buf, PX + 5, 12 + oy, 2, 1, L.skin);
    put(buf, PX + 2, 16 + oy, 8, 1, L.belt);
    put(buf, PX + 6, 17 + oy, 1, 2, L.belt);
  } else {
    put(buf, PX + 5, 12 + oy, 2, 1, L.skin);
    put(buf, PX + 2, 18 + oy, 8, 1, L.topDark);
  }
  put(buf, PX + 1, 12 + oy, 1, 5, L.topDark);
  put(buf, PX + 1, 17 + oy, 1, 1, L.skin);
  if (!p.phone && !p.punch) {
    put(buf, PX + 10, 12 + oy, 1, 5, L.topDark);
    put(buf, PX + 10, 17 + oy, 1, 1, L.skin);
  }

  // Head, rounded at the corners.
  put(buf, PX, 2 + oy, 12, 10, L.skin);
  [[PX, 2], [PX + 11, 2], [PX, 11], [PX + 11, 11]].forEach(([x, y]) => { buf[(y + oy) * PW + x] = null; });

  const hairHi = shade(L.hair, 1.35);
  put(buf, PX + 1, 1 + oy, 10, 1, L.hair);
  put(buf, PX, 2 + oy, 12, 3, L.hair);
  put(buf, PX, 5 + oy, 3, 5, L.hair);
  put(buf, PX + 3, 5 + oy, 5, 1, L.hair);
  put(buf, PX + 11, 5 + oy, 1, 1, L.hair);
  if (L.hairStyle === 'bob') {
    put(buf, PX - 1, 4 + oy, 3, 9, L.hair);
    put(buf, PX + 10, 5 + oy, 2, 5, L.hair);
  } else if (L.hairStyle === 'spiky') {
    put(buf, PX + 2, oy, 2, 1, L.hair);
    put(buf, PX + 6, oy, 2, 1, L.hair);
    put(buf, PX + 9, oy, 2, 1, L.hair);
  } else if (L.hairStyle === 'bun') {
    put(buf, PX, oy - 1 < 0 ? 0 : oy - 1, 4, 2, L.hair);
  }
  put(buf, PX + 4, 2 + oy, 4, 1, hairHi);

  const blink = !p.talking && t % 3.7 < 0.12;
  put(buf, PX + 6, (blink ? 8 : 7) + oy, 1, blink ? 1 : 2, '#2b2230');
  put(buf, PX + 10, (blink ? 8 : 7) + oy, 1, blink ? 1 : 2, '#2b2230');
  put(buf, PX + 5, 9 + oy, 1, 1, '#f0a090');
  if (p.talking && p.volume > 0.35) put(buf, PX + 8, 10 + oy, 2, 1, '#8a2f2f');
  else put(buf, PX + 8, 10 + oy, 1, 1, '#b0705a');

  if (p.phone) {
    put(buf, PX + 10, 9 + oy, 2, 5, L.topDark);
    put(buf, PX + 11, 5 + oy, 2, 5, '#20232b');
    put(buf, PX + 11, 6 + oy, 1, 1, '#6a7186');
  } else if (p.punch) {
    put(buf, PX + 10, 13 + oy, 5, 2, L.topDark);
    put(buf, PX + 15, 13 + oy, 2, 2, L.skin);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(c.x - 6, c.y - 1, 12, 3);
  ctx.fillRect(c.x - 4, c.y + 2, 8, 1);

  const flip = p.dir !== 1;
  const ox = c.x - 11;
  const top = c.y - 22;
  const at = (x, y) => (x < 0 || y < 0 || x >= PW || y >= PH ? null : buf[y * PW + x]);
  for (let y = 0; y < PH; y += 1) {
    for (let x = 0; x < PW; x += 1) {
      let color = buf[y * PW + x];
      if (!color) {
        if (!(at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) continue;
        color = INK;
      }
      ctx.fillStyle = color;
      ctx.fillRect(ox + (flip ? PW - 1 - x : x), top + y, 1, 1);
    }
  }

  return { x: c.x, y: top + oy };
}

const EMOTES = {
  heart: { rows: ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], pal: { r: '#e2466b' } },
  sweat: { rows: ['...b...', '...b...', '..bbb..', '.bbbbb.', '.bwbbb.', '.bbbbb.', '..bbb..'], pal: { b: '#4aa8e8', w: '#d9f1ff' } },
  question: { rows: ['.kkkk..', 'kk..kk.', '....kk.', '..kkk..', '..kk...', '.......', '..kk...'], pal: { k: '#3a3f52' } },
  alert: { rows: ['..rrr..', '..rrr..', '..rrr..', '..rrr..', '...r...', '.......', '..rrr..'], pal: { r: '#d9442f' } },
  ring: { rows: ['.......', '.o..o..', '..o..o.', '..o..o.', '..o..o.', '.o..o..'], pal: { o: '#e08a1f' } },
  smile: { rows: ['.......', '.k...k.', '.k...k.', '.......', 'k.....k', '.kkkkk.'], pal: { k: '#3a3f52' } },
};

export const EMOTE_IDS = ['heart', 'sweat', 'question', 'alert', 'smile'];

function drawBubble(ctx, head, kind, t) {
  const w = 15;
  const h = 12;
  const x = head.x - 7;
  const y = head.y - h - 4;
  ctx.fillStyle = INK;
  ctx.fillRect(x + 1, y, w - 2, h);
  ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillRect(head.x - 1, y + h, 3, 1);
  ctx.fillRect(head.x, y + h + 1, 1, 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillRect(head.x, y + h - 1, 1, 2);

  if (kind === 'dots') {
    ctx.fillStyle = '#3a3f52';
    for (let i = 0; i < 3; i += 1) {
      const up = (Math.floor(t * 6) + i) % 3 === 0 ? 1 : 0;
      ctx.fillRect(x + 3 + i * 3, y + 5 - up, 2, 2);
    }
    return;
  }
  const emote = EMOTES[kind];
  if (emote) drawPixels(ctx, x + 4, y + 2, emote.rows, emote.pal);
}

function drawPhoneLine(ctx, from, to, t, reverse) {
  // The two ends sit almost above each other, so the line bows out sideways.
  const mx = (from.x + to.x) / 2 + 90;
  const my = (from.y + to.y) / 2 - 20;
  const stepCount = Math.floor(t * 10);
  for (let i = 0; i <= 60; i += 1) {
    const phase = reverse ? i + stepCount : i - stepCount;
    if (((phase % 5) + 5) % 5 !== 0) continue;
    const u = i / 60;
    const x = Math.round((1 - u) * (1 - u) * from.x + 2 * (1 - u) * u * mx + u * u * to.x);
    const y = Math.round((1 - u) * (1 - u) * from.y + 2 * (1 - u) * u * my + u * u * to.y);
    ctx.fillStyle = INK;
    ctx.fillRect(x - 1, y - 1, 4, 4);
    ctx.fillStyle = '#ffe27a';
    ctx.fillRect(x, y, 2, 2);
  }
}

// ---------- ambience ----------

function drawSea(ctx, t) {
  ctx.fillStyle = '#3a8fca';
  ctx.fillRect(-SCENE_W, -SCENE_H, SCENE_W * 3, SCENE_H * 3);
  for (let i = 0; i < 90; i += 1) {
    const phase = (Math.floor(t * 1.5) + i) % 4;
    if (phase > 1) continue;
    const x = hash2(i, 1) % SCENE_W;
    const y = hash2(i, 2) % SCENE_H;
    ctx.fillStyle = i % 3 ? '#62b0e0' : '#2f7fb8';
    ctx.fillRect(x + phase * 2, y, 4 + (i % 3) * 2, 1);
  }
}

function drawFoam(ctx, t) {
  const shift = Math.floor(t * 3);
  for (let px = 0; px < SCENE_W; px += 1) {
    const y = slabBottom[px];
    if (y < 0) continue;
    const k = (px + shift) % 9;
    if (k < 5) {
      ctx.fillStyle = '#e8f7fd';
      ctx.fillRect(px, y, 1, 1);
    }
    if (k > 1 && k < 4) {
      ctx.fillStyle = '#a9d9f2';
      ctx.fillRect(px, y + 1, 1, 1);
    }
  }
}

function drawPondLife(ctx, t) {
  for (let i = 0; i < 2; i += 1) {
    const a = t * 0.45 + i * 3.1;
    const p = iso(2 + Math.cos(a) * 0.62, 8.5 + Math.sin(a) * 0.5);
    ctx.fillStyle = i ? '#f6f1e6' : '#f28a3a';
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 1);
    ctx.fillStyle = '#f28a3a';
    ctx.fillRect(Math.round(p.x) + 1, Math.round(p.y), 1, 1);
  }
  ctx.fillStyle = '#d6f1fb';
  for (let i = 0; i < 4; i += 1) {
    if ((Math.floor(t * 2) + i) % 3) continue;
    const p = iso(1.5 + (i % 2) * 0.9, 8.1 + (i >> 1) * 0.7);
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 1);
  }
}

function drawPetals(ctx, t) {
  for (let i = 0; i < 12; i += 1) {
    const x = (hash2(i, 5) % SCENE_W + t * (5 + (i % 4))) % SCENE_W;
    const y = (hash2(i, 9) % SCENE_H + t * (7 + (i % 5)) + Math.sin(t * 1.3 + i) * 4) % SCENE_H;
    ctx.fillStyle = i % 3 ? '#ffd1e0' : '#ffffff';
    ctx.fillRect(Math.round(x), Math.round(y), i % 2 ? 2 : 1, 1);
  }
}

// ---------- world state ----------

export function createWorld() {
  return {
    context: null,
    phase: 'idle',
    volume: 0,
    emoteKey: null,
    emotes: {},
    cam: { s: 1, x: SCENE_W / 2, y: SCENE_H / 2 },
    staff: { ...SPOTS.staff, dir: 1, pose: 'sit', look: STAFF_LOOK, visible: true },
    caller: { ...SPOTS.entry, dir: -1, pose: 'stand', look: DEFAULT_CALLER_LOOK, visible: false },
    student: { ...SPOTS.student, dir: 1, pose: 'stand', look: STUDENT_LOOK, visible: true },
    line: null,
  };
}

export function stepWorld(world, input, dt, t, reducedMotion) {
  const { context, phase, speaker, emote, zoom } = input;
  const { caller, staff, student } = world;
  const onPhone = context !== 'in_person';
  const live = phase === 'active';

  if (world.context !== context) {
    world.context = context;
    caller.gx = onPhone ? SPOTS.home.gx : SPOTS.entry.gx;
    caller.gy = onPhone ? SPOTS.home.gy : SPOTS.entry.gy;
    caller.visible = onPhone;
    caller.pose = 'stand';
  }
  caller.look = input.callerLook || DEFAULT_CALLER_LOOK;

  if (onPhone) {
    caller.gx = SPOTS.home.gx;
    caller.gy = SPOTS.home.gy;
    caller.visible = true;
    caller.pose = 'stand';
    caller.dir = -1;
    caller.phone = live || (phase === 'arriving' && context === 'inbound_call');
    staff.phone = live || (phase === 'arriving' && context === 'outbound_callback');
  } else {
    caller.phone = false;
    staff.phone = false;
    caller.gy = SPOTS.seat.gy;
    if (phase === 'idle') {
      caller.gx = SPOTS.entry.gx;
      caller.visible = false;
    } else {
      const arriving = phase === 'arriving' || live;
      const target = arriving ? SPOTS.seat.gx : SPOTS.entry.gx;
      const diff = target - caller.gx;
      if (Math.abs(diff) < 0.04 || reducedMotion) {
        caller.gx = target;
        caller.pose = arriving ? 'sit' : 'stand';
        caller.dir = -1;
        caller.visible = arriving;
      } else {
        const speed = live ? 6 : 2.4;
        caller.gx += Math.sign(diff) * Math.min(Math.abs(diff), speed * dt);
        caller.pose = 'walk';
        caller.dir = diff < 0 ? -1 : 1;
        caller.visible = true;
      }
    }
  }

  const target = input.volumeRef?.current ?? 0;
  world.volume += (target - world.volume) * Math.min(1, dt * 14);
  caller.talking = live && speaker === 'caller';
  staff.talking = live && speaker === 'staff';
  caller.volume = world.volume;
  staff.volume = world.volume;
  const nodNow = t % 2.6 < 0.2;
  caller.nod = live && speaker === 'staff' && nodNow;
  staff.nod = live && speaker === 'caller' && nodNow;
  student.punch = !reducedMotion && t % 2.4 < 0.5;

  if (emote && emote.key !== world.emoteKey) {
    world.emoteKey = emote.key;
    world.emotes[emote.who] = { id: emote.id, until: t + 2.6 };
  }
  if (world.phase !== phase) {
    if (phase === 'leaving' && world.phase === 'active') world.emotes.caller = { id: 'smile', until: t + 2.4 };
    world.phase = phase;
  }

  const ringing = onPhone && phase === 'arriving' && Math.floor(t * 3) % 2 === 0;
  const bubbleFor = (who, person) => {
    const active = world.emotes[who];
    if (active && active.until > t) return active.id;
    if (ringing && who === (context === 'inbound_call' ? 'staff' : 'caller')) return 'ring';
    return person.talking ? 'dots' : null;
  };
  caller.bubble = bubbleFor('caller', caller);
  staff.bubble = bubbleFor('staff', staff);

  world.line = onPhone && (live || phase === 'arriving')
    ? { reverse: speaker === 'caller' || (phase === 'arriving' && context === 'inbound_call') }
    : null;
  world.reducedMotion = reducedMotion;

  const close = zoom === 'close' || (zoom === 'auto' && !onPhone && live && caller.pose === 'sit');
  const ts = close ? 2 : 1;
  const tx = close ? CLOSE_FOCUS.x : SCENE_W / 2;
  const ty = close ? CLOSE_FOCUS.y : SCENE_H / 2;
  const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 3.5);
  world.cam.s += (ts - world.cam.s) * k;
  world.cam.x += (tx - world.cam.x) * k;
  world.cam.y += (ty - world.cam.y) * k;
}

export function renderScene(ctx, staticLayer, staticDrawables, world, t) {
  const at = world.reducedMotion ? 0 : t; // ambience freezes for reduced motion
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;

  const { s } = world.cam;
  const fx = Math.min(Math.max(world.cam.x, SCENE_W / (2 * s)), SCENE_W - SCENE_W / (2 * s));
  const fy = Math.min(Math.max(world.cam.y, SCENE_H / (2 * s)), SCENE_H - SCENE_H / (2 * s));
  ctx.setTransform(s, 0, 0, s, Math.round(SCENE_W / 2 - fx * s), Math.round(SCENE_H / 2 - fy * s));

  drawSea(ctx, at);
  ctx.drawImage(staticLayer, 0, 0);
  drawFoam(ctx, at);
  drawPondLife(ctx, at);

  const heads = {};
  const drawables = staticDrawables.slice();
  [['staff', world.staff], ['caller', world.caller], ['student', world.student]].forEach(([id, person]) => {
    if (!person.visible) return;
    drawables.push({ depth: person.gx + person.gy, draw: (c) => { heads[id] = drawPerson(c, person, t); } });
  });
  drawables.sort((a, b) => a.depth - b.depth);
  drawables.forEach((item) => item.draw(ctx, at));

  if (!world.reducedMotion) drawPetals(ctx, t);
  if (world.line && heads.staff && heads.caller) {
    drawPhoneLine(ctx, heads.staff, heads.caller, t, world.line.reverse);
  }
  if (heads.staff && world.staff.bubble) drawBubble(ctx, heads.staff, world.staff.bubble, t);
  if (heads.caller && world.caller.bubble) drawBubble(ctx, heads.caller, world.caller.bubble, t);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
