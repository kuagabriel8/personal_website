// Shelf layout. World units: X = along the shelf, Y = depth (0 back → DEPTH front, toward viewer), Z = up.
// Three.js mapping: (X, Y, Z) → three (x = X, y = Z, z = Y).

import type { SectionId } from '@/content/sections';
import { experience, certs } from '@/content/resume';

export const BAY = 30;
export const DEPTH = 12;
export const BOARD = 0.8;
export const POST = 0.6;
export const LEVEL_GAP = 20;
export const BASE_Z = 2;
export const POST_OVERHANG = 4.5;
export const BAYS = 3;
export const LEVELS = 5;

export const levelZ = (i: number) => BASE_Z + i * LEVEL_GAP;

export type Box = { x: number; y: number; z: number; w: number; d: number; h: number; rotX?: number };
export type Decal = {
  box: number; face: 'front' | 'top'; text?: string; size?: number; inset?: number; vertical?: boolean;
  windows?: { cols: number; rows: number }; // building facade: window grid, with `text` as a sign at the bottom
  glow?: string; // clay at night: lights up in this colour (screens, signs, labels, lit windows)
};
export type Kind = 'record' | 'lamp' | 'github' | 'plant' | 'teddy' | 'cloud';

export type ShelfObj = {
  id: SectionId | null; // null = decorative
  kind?: Kind;
  bay: number;
  level: number | 'floor';
  anchor?: [number, number, number];
  float?: boolean;
  boxes: Box[];
  decals?: Decal[];
};

const box = (x: number, y: number, z: number, w: number, d: number, h: number, extra?: Partial<Box>): Box => ({ x, y, z, w, d, h, ...extra });

function keyboard(): Box[] {
  const boxes = [box(3, 2.5, 0, 24, 8, 1.2)];
  const pitch = 1.75, k = 1.4, x0 = 4.1, y0 = 3.3, z = 1.2, h = 0.7;
  for (let row = 0; row < 4; row++) {
    const y = y0 + row * pitch;
    if (row === 3) {
      for (const c of [0, 1, 2, 10, 11, 12]) boxes.push(box(x0 + c * pitch, y, z, k, k, h));
      boxes.push(box(x0 + 3 * pitch, y, z, 7 * pitch - (pitch - k), k, h));
    } else {
      for (let c = 0; c < 13; c++) boxes.push(box(x0 + c * pitch, y, z, k, k, h));
    }
  }
  return boxes;
}

/** Experience as a little city block: one office tower per company, newest = tallest, each with its name on a sign. */
function towers(): Pick<ShelfObj, 'boxes' | 'decals'> {
  const spec = [
    { x: 4.5, w: 6.2, d: 5.2, h: 13, rows: 8 },
    { x: 12.6, w: 5.6, d: 4.6, h: 9.5, rows: 6 },
    { x: 20.2, w: 5.4, d: 4.8, h: 6.5, rows: 4 },
  ];
  const boxes: Box[] = [box(3, 2, 0, 24.5, 8.5, 0.8)]; // street-level plate
  const decals: Decal[] = [];
  experience.forEach((role, i) => {
    const s = spec[i % spec.length];
    const y = 2.6 + (5.2 - s.d) / 2;
    decals.push({ box: boxes.length, face: 'front', text: role.spine, size: 0.78, windows: { cols: 3, rows: s.rows }, glow: '#ffd36b' });
    boxes.push(box(s.x, y, 0.8, s.w, s.d, s.h));
    boxes.push(box(s.x + s.w * 0.25, y + s.d * 0.25, 0.8 + s.h, s.w * 0.5, s.d * 0.5, 1)); // rooftop plant room
  });
  boxes.push(box(4.5 + 6.2 * 0.5 - 0.15, 2.6 + 2.6 - 0.15, 0.8 + 13 + 1, 0.3, 0.3, 2.6)); // antenna on the tallest
  return { boxes, decals };
}

const BINDER_GLOW = ['#ff7a59', '#ffd23f', '#5ad1ff', '#b18cff', '#5cff9d'];
function binders(): Pick<ShelfObj, 'boxes' | 'decals'> {
  const boxes: Box[] = [];
  const decals: Decal[] = [];
  certs.forEach((c, i) => {
    boxes.push(box(2 + i * 3.7, 1.5, 0, 3.3, 9.5, 13));
    decals.push({ box: i, face: 'front', inset: 0.45, text: c.code, size: 1.15, vertical: true, glow: BINDER_GLOW[i % BINDER_GLOW.length] });
  });
  boxes.push(box(21, 2, 0, 7, 8, 2.2)); // one lying flat
  return { boxes, decals };
}

export const OBJECTS: ShelfObj[] = [
  // ---- bay 0 ----
  {
    id: 'github', kind: 'github', bay: 0, level: 4, anchor: [15, 6, 6],
    boxes: [box(3, 2, 0, 24, 8, 1.2)], // plinth; bars come from live data
    decals: [{ box: 0, face: 'front', text: 'github.com/kuagabriel8', size: 0.7 }],
  },
  {
    id: 'projects', bay: 0, level: 3, anchor: [14, 6, 11],
    boxes: [box(6, 2, 0, 17, 8, 8), box(5.8, 1.8, 8, 17.4, 8.4, 1.4)],
    decals: [{ box: 0, face: 'front', inset: 0.8, text: 'PROJECTS', size: 1.7, glow: '#ffb547' }],
  },
  { id: 'experience', bay: 0, level: 2, anchor: [9, 5, 16], ...towers() },
  {
    id: 'awards', bay: 0, level: 1, anchor: [7, 5, 10],
    boxes: [
      box(4, 3, 0, 6, 5, 1.2), box(5, 3.8, 1.2, 4, 3.4, 1.5), box(6.4, 5, 2.7, 1.2, 1, 2.2),
      box(5, 4, 4.9, 4, 3, 3.4), box(4.2, 5, 5.6, 0.8, 1, 1.8), box(9, 5, 5.6, 0.8, 1, 1.8),
    ],
    decals: [{ box: 1, face: 'front', text: '★', size: 1.1, glow: '#ffd23f' }],
  },
  {
    id: 'blog', bay: 0, level: 1, anchor: [20, 6, 4],
    boxes: [box(15, 2.5, 0, 10, 7.5, 0.6), box(15.4, 2.8, 0.6, 9.4, 7, 0.6), box(15.1, 2.6, 1.2, 9.8, 7.3, 0.6)],
    decals: [{ box: 2, face: 'top', inset: 0.6, text: 'BLOG · soon', size: 1.05, glow: '#ff9f6b' }],
  },

  // ---- bay 1 ----
  // record player, centred in its cubby: [plinth, platter (→ spinning vinyl), tonearm base, tonearm, knob]
  {
    id: 'spotify', kind: 'record', bay: 1, level: 4, anchor: [15, 6, 6],
    boxes: [
      box(7.5, 2, 0, 15, 9, 1.6), box(9, 2.75, 1.6, 7.5, 7.5, 0.4),
      box(18.5, 3, 1.6, 2, 2, 1.2), box(19.1, 3.6, 2.8, 0.5, 5.5, 0.4), box(20, 8.5, 1.6, 1, 1, 0.5),
    ],
  },
  { id: 'skills', bay: 1, level: 3, anchor: [15, 6, 4], boxes: keyboard() },
  {
    id: 'terminal', bay: 1, level: 2, anchor: [14, 6, 12],
    boxes: [box(9.5, 3, 0, 9, 6, 1), box(8, 1.5, 1, 12, 9, 10)],
    decals: [{ box: 1, face: 'front', inset: 1.2, text: '>_ whoami', size: 1.1, glow: '#5cff9d' }],
  },
  { id: null, bay: 1, level: 2, boxes: [box(23, 5, 0, 3, 3, 3.6), box(26, 6, 1, 0.8, 1, 1.8)] }, // mug
  { id: 'certs', bay: 1, level: 1, anchor: [10, 5, 14], ...binders() },

  // ---- bay 2 ----
  {
    id: 'cloud', kind: 'cloud', bay: 2, level: 4, float: true, anchor: [14, 6, 13],
    boxes: [
      box(4, 3, 4, 20, 6, 3), // base slab: positions the GLB model
      box(8, 6, 1.2, 0.35, 0.35, 1.6), box(13, 5, 0.6, 0.35, 0.35, 1.6), box(19, 6.5, 1.6, 0.35, 0.35, 1.6), // rain
    ],
  },
  {
    id: 'about', bay: 2, level: 3, anchor: [12, 6, 14],
    boxes: [box(6, 5, 0, 11, 0.8, 13, { rotX: 10 })],
    decals: [{ box: 0, face: 'front', inset: 1.2, text: 'hello.', size: 1.6, glow: '#ff8fb1' }],
  },
  { id: null, kind: 'lamp', bay: 2, level: 3, boxes: [box(21, 4, 0, 4.4, 4.4, 0.8), box(22.8, 5.8, 0.8, 0.8, 0.8, 6), box(20.6, 3.6, 6.8, 5.2, 5.2, 3.4)] },
  {
    // plant on the right, so a long streak's vine can spill over the front edge to the floor
    id: 'streak', kind: 'plant', bay: 2, level: 2, anchor: [23, 7, 14],
    boxes: [box(20.5, 4, 0, 5, 5, 4.5), box(20.1, 3.6, 4.5, 5.8, 5.8, 1), box(22.7, 6.2, 5.5, 0.6, 0.6, 6.5)],
  },
  {
    id: null, kind: 'teddy', bay: 2, level: 2,
    boxes: [
      box(7, 4, 0, 5, 3.4, 4.6), // body
      box(7, 6, 0, 1.6, 2.4, 1.4), box(10.4, 6, 0, 1.6, 2.4, 1.4), // legs
      box(6.2, 4.8, 1.6, 0.8, 1.8, 2.2), box(12, 4.8, 1.6, 0.8, 1.8, 2.2), // arms
      box(7.4, 4.2, 4.6, 4.2, 3.2, 3.4), // head
      box(7.4, 5, 8, 1.2, 1, 1), box(10.4, 5, 8, 1.2, 1, 1), // ears
      box(8.8, 7.4, 4.9, 1.4, 0.6, 1.0), // snout
    ],
    decals: [{ box: 5, face: 'front', text: '•    •', size: 0.9 }],
  },
  {
    id: 'contact', bay: 2, level: 1, anchor: [12, 6, 3],
    boxes: [box(5, 2.5, 0, 13, 8, 0.5), box(6.5, 3, 0.5, 13, 8, 0.5)],
    decals: [{ box: 1, face: 'top', inset: 0.7, text: 'say hi →', size: 1.3, glow: '#7fd3ff' }],
  },

  // ---- floor ----
  {
    id: 'resume', bay: 1, level: 'floor', anchor: [14.5, 13, 21],
    boxes: [box(8, 16, 0, 13, 0.8, 22, { rotX: 13 })],
    decals: [{ box: 0, face: 'front', inset: 1.2, text: '_cv', size: 2.6, glow: '#ffe08a' }],
  },
];

// ---------------------------------------------------------------- layouts

export type LayoutKey = 'desktop' | 'mobile';

export type ShelfLayout = {
  key: LayoutKey;
  bays: number;
  levels: number;
  objs: ShelfObj[]; // world coordinates
  shelf: Box[]; // boards + posts
  center: [number, number, number];
};

/**
 * Phone layout: one tall bay, one cubby per level, read top → bottom.
 * Keys are the desktop "bay:level" of each cubby; the floor frame stays at the bottom.
 */
const MOBILE_ORDER = ['2:4', '0:3', '0:2', '1:3', '1:1', '0:4', '1:4', '2:3', '0:1', '2:2', '1:2', '2:1'];

export function buildLayout(key: LayoutKey): ShelfLayout {
  let bays = BAYS;
  let levels = LEVELS;
  let placed = OBJECTS;
  if (key === 'mobile') {
    bays = 1;
    levels = MOBILE_ORDER.length + 1;
    placed = OBJECTS.map((o) =>
      o.level === 'floor' ? { ...o, bay: 0 } : { ...o, bay: 0, level: MOBILE_ORDER.length - MOBILE_ORDER.indexOf(`${o.bay}:${o.level}`) },
    );
  }

  const objs = placed.map((o) => {
    const ox = o.bay * BAY;
    const oz = o.level === 'floor' ? 0 : levelZ(o.level) + BOARD;
    return {
      ...o,
      boxes: o.boxes.map((b) => ({ ...b, x: b.x + ox, z: b.z + oz })),
      anchor: o.anchor ? ([o.anchor[0] + ox, o.anchor[1], o.anchor[2] + oz] as [number, number, number]) : undefined,
    };
  });

  const top = levelZ(levels - 1) + BOARD;
  const postTop = top + POST_OVERHANG;
  const shelf: Box[] = [];
  for (let L = 0; L < levels; L++) for (let bay = 0; bay < bays; bay++) shelf.push(box(bay * BAY, 0, levelZ(L), BAY, DEPTH, BOARD));
  for (let i = 0; i <= bays; i++) for (const y of [0, DEPTH - POST]) shelf.push(box(i * BAY - POST / 2, y, 0, POST, POST, postTop));

  return { key, bays, levels, objs, shelf, center: [(bays * BAY) / 2, DEPTH / 2 + 2, (top + 8) / 2] };
}

/** Empty volume of the cubby an object sits in (camera framing on click). */
export function cubbyOf(obj: ShelfObj): Box {
  if (obj.level === 'floor') {
    const b = obj.boxes[0];
    return { x: b.x - 4, y: 6, z: 0, w: b.w + 8, d: 14, h: b.h + 2 };
  }
  return { x: obj.bay * BAY, y: 0, z: levelZ(obj.level), w: BAY, d: DEPTH, h: LEVEL_GAP };
}
