'use client';

// The 3D shelf (React Three Fiber). Ported from mockup 05:
//   dark = unlit line art · clay = lit with soft shadows
// Objects map to site sections; GitHub + Spotify objects react to live data.

import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Edges, Float, Html, OrbitControls, Outlines, useGLTF } from '@react-three/drei';
import { CENTER, cubbyOf, resolveObjects, shelfBoxes, type Box, type Decal, type ShelfObj } from './scene';
import { paintDecal } from './decal';
import { THEMES, type Theme, type ThemeKey } from '../theme';
import { sectionById, type SectionId } from '@/content/sections';
import type { GithubStats, NowPlaying } from '@/lib/types';

const DEG = Math.PI / 180;
const OBJS = resolveObjects();
const SHELF = shelfBoxes();
const [CX, CY, CZ] = CENTER;
const OFFSET: [number, number, number] = [-CX, -CZ, -CY]; // centre the scene on the origin (three coords)
const WARM = '#ffc861';

const ThemeCtx = createContext<Theme>(THEMES.dark);
const useTheme = () => useContext(ThemeCtx);

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const stop = (e: ThreeEvent<PointerEvent>) => e.stopPropagation();

// ---------------------------------------------------------------- primitives

function Surface({ color }: { color: string }) {
  const t = useTheme();
  const common = { color, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };
  return t.lit ? <meshStandardMaterial {...common} roughness={0.95} /> : <meshBasicMaterial {...common} />;
}

function DecalMesh({ dec, b }: { dec: Decal; b: Box }) {
  const t = useTheme();
  const top = dec.face === 'top';
  const W = b.w, H = top ? b.d : b.h;
  const tex = useMemo(() => {
    const tx = new THREE.CanvasTexture(paintDecal(dec, W, H, t.edge));
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 8;
    return tx;
  }, [dec, W, H, t.edge]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={top ? [0, b.h / 2 + 0.02, 0] : [0, 0, b.d / 2 + 0.02]} rotation={top ? [-Math.PI / 2, 0, 0] : [0, 0, 0]} raycast={() => null}>
      <planeGeometry args={[W, H]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function Block({ b, decals = [], lit = false, shelf = false, color }: { b: Box; decals?: Decal[]; lit?: boolean; shelf?: boolean; color?: string }) {
  const t = useTheme();
  const fill = color ?? (shelf ? t.shelf : lit ? t.hot : t.face);
  const mesh = (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[b.w, b.h, b.d]} />
      <Surface color={fill} />
      <Edges threshold={15} color={lit ? t.accent : t.edge} />
      {decals.map((d, i) => <DecalMesh key={i} dec={d} b={b} />)}
    </mesh>
  );
  if (b.rotX) {
    return (
      <group position={[b.x, b.z, b.y + b.d]} rotation={[-b.rotX * DEG, 0, 0]}>
        <group position={[b.w / 2, b.h / 2, -b.d / 2]}>{mesh}</group>
      </group>
    );
  }
  return <group position={[b.x + b.w / 2, b.z + b.h / 2, b.y + b.d / 2]}>{mesh}</group>;
}

const decalsFor = (o: ShelfObj, i: number) => (o.decals ?? []).filter((d) => d.box === i);

function Shelf() {
  return (
    <group onPointerOver={stop} onPointerMove={stop}>
      {SHELF.map((b, i) => <Block key={i} b={b} shelf />)}
    </group>
  );
}

// ---------------------------------------------------------------- special objects

const CLOUD_URL = '/models/cloud.glb';
useGLTF.preload(CLOUD_URL);

function GlbCloud({ base, lit }: { base: Box; lit: boolean }) {
  const t = useTheme();
  const { scene } = useGLTF(CLOUD_URL);
  const geometry = useMemo(() => {
    let g: THREE.BufferGeometry | null = null;
    scene.traverse((o) => { if ((o as THREE.Mesh).isMesh && !g) g = (o as THREE.Mesh).geometry; });
    return g;
  }, [scene]);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} position={[base.x + base.w / 2, base.z + 0.5, base.y + base.d / 2]} scale={0.8} castShadow receiveShadow>
      <Surface color={lit ? t.hot : t.face} />
      <Outlines thickness={t.lit ? 2.5 : 1.5} color={lit ? t.accent : t.edge} />
    </mesh>
  );
}

function Vinyl({ b, lit, playing }: { b: Box; lit: boolean; playing: boolean }) {
  const t = useTheme();
  const spin = useRef<THREE.Group>(null);
  const motion = useMemo(() => !reduceMotion(), []);
  useFrame((_, dt) => {
    if (spin.current && motion && playing) spin.current.rotation.y -= Math.min(dt, 0.1) * 1.8;
  });
  const r = Math.min(b.w, b.d) / 2 - 0.1;
  const edge = lit ? t.accent : t.edge;
  return (
    <group position={[b.x + b.w / 2, b.z, b.y + b.d / 2]}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r + 0.2, r + 0.2, 0.4, 56]} />
        <Surface color={lit ? t.hot : t.face} />
        <Edges threshold={15} color={edge} />
      </mesh>
      <group ref={spin} position={[0, 0.4, 0]}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[r, r, 0.24, 56]} />
          <Surface color={t.lit ? '#2b2621' : t.face} />
          <Edges threshold={15} color={t.lit ? '#6b625a' : edge} />
        </mesh>
        {[0.88, 0.72, 0.56].map((f) => (
          <mesh key={f} position={[0, 0.245, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
            <ringGeometry args={[r * f, r * f + 0.05, 64]} />
            <meshBasicMaterial color={t.lit ? '#4d453e' : t.edge} transparent opacity={0.7} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, 0.27, 0]}>
          <cylinderGeometry args={[r * 0.34, r * 0.34, 0.05, 40]} />
          <Surface color={t.lit ? '#e4572e' : t.face} />
          <Edges threshold={15} color={edge} />
        </mesh>
        <mesh position={[r * 0.17, 0.305, 0]} raycast={() => null}>
          <boxGeometry args={[r * 0.24, 0.02, 0.22]} />
          <meshBasicMaterial color={t.lit ? '#fbf8f3' : t.edge} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Tonearm: pivots on its base. Swings onto the record (needle down) while playing,
 * back to its rest beside the platter when paused.
 */
const ARM_PLAY = -50 * DEG; // swing toward the record (rest = 0, pointing to the front)
function Tonearm({ base, arm, lit, playing }: { base: Box; arm: Box; lit: boolean; playing: boolean }) {
  const swing = useRef<THREE.Group>(null);
  const motion = useMemo(() => !reduceMotion(), []);
  const pivot: [number, number, number] = [base.x + base.w / 2, base.z + base.h, base.y + base.d / 2];
  const back = pivot[2] - arm.y; // how far the arm extends behind the pivot
  const target = playing ? ARM_PLAY : 0;
  useFrame((_, dt) => {
    const g = swing.current;
    if (!g) return;
    g.rotation.y = motion ? THREE.MathUtils.damp(g.rotation.y, target, 4, dt) : target;
  });
  // arm + headshell in pivot space (x across, y = forward along the arm, z = up)
  const armBox: Box = { x: -arm.w / 2, y: -back, z: 0, w: arm.w, d: arm.d, h: arm.h };
  const head: Box = { x: -0.38, y: arm.d - back - 1, z: -0.42, w: 0.76, d: 1, h: 0.82 };
  return (
    <group position={pivot}>
      <group ref={swing}>
        <Block b={armBox} lit={lit} />
        <Block b={head} lit={lit} />
      </group>
    </group>
  );
}

/** Current album cover printed on the record sleeve (covers the ♪ decal while art is available). */
function AlbumArt({ sleeve, url }: { sleeve: Box; url: string }) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let alive = true;
    let loaded: THREE.Texture | null = null;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      loaded = t;
      if (alive) setTex(t); else t.dispose();
    }, undefined, () => alive && setTex(null));
    return () => { alive = false; loaded?.dispose(); };
  }, [url]);
  if (!tex) return null;
  const m = 0.35; // margin inside the sleeve edge
  return (
    <group position={[sleeve.x, sleeve.z, sleeve.y + sleeve.d]} rotation={[-(sleeve.rotX ?? 0) * DEG, 0, 0]}>
      <mesh position={[sleeve.w / 2, sleeve.h / 2, 0.04]} raycast={() => null}>
        <planeGeometry args={[sleeve.w - 2 * m, sleeve.h - 2 * m]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Contribution skyline: one bar per day for the last N weeks. */
function Skyline({ plinth, github, lit }: { plinth: Box; github: GithubStats | null; lit: boolean }) {
  const bars = useMemo(() => {
    const weeks = github?.weeks ?? [];
    const counts = weeks.flat().filter((c) => c > 0).sort((a, b) => a - b);
    const cap = Math.max(4, counts[Math.floor(counts.length * 0.9)] ?? 4);
    const out: Box[] = [];
    const cols = weeks.length;
    const pitchX = Math.min(1.15, (plinth.w - 1.2) / Math.max(cols, 1));
    weeks.forEach((week, col) => {
      week.forEach((c, row) => {
        if (c < 0) return; // future day
        const h = 0.12 + (Math.min(c, cap) / cap) * 4.4;
        out.push({ x: plinth.x + 0.6 + col * pitchX, y: plinth.y + 0.55 + row * 1.0, z: plinth.z + plinth.h, w: pitchX * 0.74, d: 0.8, h });
      });
    });
    return out;
  }, [github, plinth]);
  return <>{bars.map((b, i) => <Block key={i} b={b} lit={lit} />)}</>;
}

/** Plant: one leaf per ~3 days of current streak (max 6). */
const LEAVES: Box[] = [
  { x: 8.4, y: 6, z: 8, w: 2.8, d: 1.2, h: 1.2 }, { x: 11.8, y: 6, z: 9.6, w: 2.8, d: 1.2, h: 1.2 },
  { x: 9.2, y: 6, z: 11.2, w: 2, d: 1.2, h: 1.2 }, { x: 11.8, y: 6, z: 12.4, w: 1.8, d: 1.2, h: 1.4 },
  { x: 7.9, y: 6, z: 10.1, w: 1.6, d: 1.2, h: 1 }, { x: 11.8, y: 6, z: 7.2, w: 2.2, d: 1.2, h: 1 },
];
function Plant({ obj, streak, lit }: { obj: ShelfObj; streak: number; lit: boolean }) {
  const ox = obj.boxes[0].x - 9; // bay offset (pot is at local x = 9)
  const oz = obj.boxes[0].z;
  const n = Math.max(1, Math.min(LEAVES.length, Math.ceil(streak / 3)));
  return (
    <>
      {LEAVES.slice(0, n).map((l, i) => (
        <Block key={i} b={{ ...l, x: l.x + ox, z: l.z + oz }} lit={lit} />
      ))}
    </>
  );
}

function Lamp({ obj }: { obj: ShelfObj }) {
  const t = useTheme();
  const [on, setOn] = useState(false);
  const [hover, setHover] = useState(false);
  const [base, stem, shade] = obj.boxes;
  const cx = shade.x + shade.w / 2, cz = shade.y + shade.d / 2;
  const floor = base.z, beamH = shade.z - floor;
  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = ''; }}
      onClick={(e) => { e.stopPropagation(); if (e.delta < 5) setOn((v) => !v); }}
    >
      <Block b={base} lit={hover} />
      <Block b={stem} lit={hover} />
      <group position={[cx, shade.z + shade.h / 2, cz]}>
        <mesh castShadow>
          <boxGeometry args={[shade.w, shade.h, shade.d]} />
          {t.lit ? (
            <meshStandardMaterial color={on ? '#fff1cf' : hover ? t.hot : t.face} emissive={WARM} emissiveIntensity={on ? 0.9 : 0} roughness={0.9} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
          ) : (
            <meshBasicMaterial color={on ? WARM : hover ? t.hot : t.face} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} toneMapped={false} />
          )}
          <Edges threshold={15} color={on ? (t.lit ? '#b8801f' : '#fff3d6') : hover ? t.accent : t.edge} />
        </mesh>
      </group>
      {on && (
        <>
          <mesh position={[cx, floor + beamH / 2, cz]} raycast={() => null}>
            <cylinderGeometry args={[shade.w * 0.38, shade.w * 1.1, beamH, 40, 1, true]} />
            <meshBasicMaterial color={WARM} transparent opacity={t.lit ? 0.14 : 0.13} depthWrite={false} side={THREE.DoubleSide} blending={t.lit ? THREE.NormalBlending : THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
          <mesh position={[cx, floor + 0.03, cz]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
            <circleGeometry args={[shade.w * 1.1, 40]} />
            <meshBasicMaterial color={WARM} transparent opacity={t.lit ? 0.22 : 0.18} depthWrite={false} blending={t.lit ? THREE.NormalBlending : THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
          {t.lit && <pointLight position={[cx, shade.z - 0.8, cz]} color={WARM} intensity={160} distance={34} decay={1.6} />}
        </>
      )}
    </group>
  );
}

/** Teddy bear: decorative, wobbles when clicked. */
function Teddy({ obj }: { obj: ShelfObj }) {
  const t = useTheme();
  const g = useRef<THREE.Group>(null);
  const wobble = useRef(0);
  const [hover, setHover] = useState(false);
  const body = obj.boxes[0];
  const pivot: [number, number, number] = [body.x + body.w / 2, body.z, body.y + body.d / 2];
  useFrame((_, dt) => {
    if (!g.current) return;
    wobble.current = Math.max(0, wobble.current - Math.min(dt, 0.1));
    const k = wobble.current;
    g.current.rotation.z = k > 0 ? Math.sin(k * 18) * 0.14 * k : 0;
  });
  const fur = t.lit ? '#e9d3b4' : undefined;
  return (
    <group
      position={pivot}
      ref={g}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = ''; }}
      onClick={(e) => { e.stopPropagation(); if (e.delta < 5 && !reduceMotion()) wobble.current = 1.2; }}
    >
      <group position={[-pivot[0], -pivot[1], -pivot[2]]}>
        {obj.boxes.map((b, i) => (
          <Block key={i} b={b} lit={hover} color={hover ? undefined : fur} decals={decalsFor(obj, i)} />
        ))}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------- section objects

type LiveProps = { github: GithubStats | null; nowPlaying: NowPlaying | null };

function ShelfItem({ obj, active, onPick, live }: { obj: ShelfObj; active: boolean; onPick: (id: SectionId) => void; live: LiveProps }) {
  const ref = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const id = obj.id;
  const lit = Boolean(id) && (hover || active);

  useFrame((_, dt) => {
    if (ref.current) ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, lit ? 1.4 : 0, 10, dt);
  });

  const parts: ReactNode[] = [];
  if (obj.kind === 'cloud') {
    // box 0 positions the GLB; boxes 1+ are rain drops
    parts.push(<Suspense key="glb" fallback={null}><GlbCloud base={obj.boxes[0]} lit={lit} /></Suspense>);
    obj.boxes.slice(1).forEach((b, i) => parts.push(<Block key={`r${i}`} b={b} lit={lit} />));
  } else {
    obj.boxes.forEach((b, i) => {
      if (obj.kind === 'record' && (i === 1 || i === 3)) return; // platter → vinyl, arm → animated tonearm
      parts.push(<Block key={i} b={b} lit={lit} decals={decalsFor(obj, i)} />);
    });
  }
  if (obj.kind === 'record') {
    const np = live.nowPlaying;
    // plays while a track plays; before Spotify is connected it just plays for fun
    const playing = !np || !np.configured || np.isPlaying;
    parts.push(<Vinyl key="vinyl" b={obj.boxes[1]} lit={lit} playing={playing} />);
    parts.push(<Tonearm key="arm" base={obj.boxes[2]} arm={obj.boxes[3]} lit={lit} playing={playing} />);
    if (np?.albumArt) parts.push(<AlbumArt key="art" sleeve={obj.boxes[5]} url={np.albumArt} />);
  }
  if (obj.kind === 'github') parts.push(<Skyline key="sky" plinth={obj.boxes[0]} github={live.github} lit={lit} />);
  if (obj.kind === 'plant') parts.push(<Plant key="plant" obj={obj} streak={live.github?.currentStreak ?? 9} lit={lit} />);

  const handlers = id
    ? {
        onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; },
        onPointerOut: () => { setHover(false); document.body.style.cursor = ''; },
        onClick: (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.delta < 5) onPick(id); },
      }
    : { onPointerOver: stop };

  const a = obj.anchor;
  const np = live.nowPlaying;
  const sub = id === 'spotify' && np?.title ? `${np.isPlaying ? '▶' : 'last played:'} ${np.title} · ${np.artist}` : id ? sectionById(id).kicker : '';
  return (
    <group ref={ref} {...handlers}>
      {obj.float ? <Float speed={1.6} rotationIntensity={0} floatIntensity={2.2} floatingRange={[-1.2, 1.6]}>{parts}</Float> : parts}
      {id && a && hover && !active && (
        <Html position={[a[0], a[2] + 2, a[1]]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="tag3d">{sectionById(id).title} ↗<small>{sub}</small></div>
        </Html>
      )}
    </group>
  );
}

function ShelfObject(props: { obj: ShelfObj; active: boolean; onPick: (id: SectionId) => void; live: LiveProps }) {
  if (props.obj.kind === 'lamp') return <Lamp obj={props.obj} />;
  if (props.obj.kind === 'teddy') return <Teddy obj={props.obj} />;
  return <ShelfItem {...props} />;
}

// ---------------------------------------------------------------- camera

const ISO = new THREE.Vector3(-1, 1, 1).normalize();
const DIST = 400;
const FWD = ISO.clone().negate();
const RIGHT = new THREE.Vector3().crossVectors(FWD, new THREE.Vector3(0, 1, 0)).normalize();
const UP = new THREE.Vector3().crossVectors(RIGHT, FWD);
const TOP = new THREE.Vector3(0, 1, 0.05).normalize(); // intro start: straight down
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const toBox3 = (c: Box) => new THREE.Box3(
  new THREE.Vector3(c.x + OFFSET[0], c.z + OFFSET[1], c.y + OFFSET[2]),
  new THREE.Vector3(c.x + c.w + OFFSET[0], c.z + c.h + OFFSET[1], c.y + c.d + OFFSET[2]),
);
const ALL = (() => {
  const b = new THREE.Box3();
  for (const x of [...SHELF, ...OBJS.flatMap((o) => o.boxes)]) b.union(toBox3(x));
  return b;
})();

function framing(box: THREE.Box3, size: { width: number; height: number }, pad: number) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  const c = new THREE.Vector3();
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    c.set(x, y, z);
    const px = c.dot(RIGHT), py = c.dot(UP);
    x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
  }
  const header = size.width < 700 ? 90 : 130;
  const zoom = Math.min(size.width / ((x1 - x0) * pad), (size.height - header) / ((y1 - y0) * pad));
  const target = new THREE.Vector3().addScaledVector(RIGHT, (x0 + x1) / 2).addScaledVector(UP, (y0 + y1) / 2 + 30 / zoom);
  return { target, zoom };
}

type Flight = { t: number; dur: number; intro?: boolean; fromT: THREE.Vector3; toT: THREE.Vector3; fromZ: number; toZ: number; fromDir: THREE.Vector3 };
type OrbitLike = { target: THREE.Vector3; update: () => void; enabled: boolean };

function Scene({ activeId, onPick, live }: { activeId: SectionId | null; onPick: (id: SectionId) => void; live: LiveProps }) {
  const { camera, size } = useThree();
  const controls = useThree((s) => s.controls) as unknown as OrbitLike | null;
  const cam = camera as THREE.OrthographicCamera;
  const fly = useRef<Flight | null>(null);
  const current = useRef({ box: ALL, pad: 1.08 });

  const frameBox = useCallback((box: THREE.Box3, pad: number, instant = false) => {
    current.current = { box, pad };
    const { target, zoom } = framing(box, size, pad);
    if (instant || !controls) {
      cam.position.copy(target).addScaledVector(ISO, DIST);
      cam.zoom = zoom;
      cam.lookAt(target);
      cam.updateProjectionMatrix();
      if (controls) { controls.target.copy(target); controls.update(); }
      return;
    }
    controls.enabled = true;
    fly.current = { t: 0, dur: 0.9, fromT: controls.target.clone(), toT: target, fromZ: cam.zoom, toZ: zoom, fromDir: cam.position.clone().sub(controls.target).normalize() };
  }, [cam, controls, size]);

  // intro on first load, then refit on resize
  const introStarted = useRef(false);
  useEffect(() => {
    if (!introStarted.current) {
      introStarted.current = true;
      if (!reduceMotion()) {
        const { target, zoom } = framing(ALL, size, 1.08);
        cam.position.copy(target).addScaledVector(TOP, DIST);
        cam.zoom = zoom * 0.75;
        cam.lookAt(target);
        cam.updateProjectionMatrix();
        fly.current = { t: 0, dur: 1.1, intro: true, fromT: target, toT: target, fromZ: zoom * 0.75, toZ: zoom, fromDir: TOP.clone() };
        return;
      }
    }
    if (fly.current?.intro) return;
    frameBox(current.current.box, current.current.pad, true);
  }, [size, controls]); // eslint-disable-line react-hooks/exhaustive-deps

  // follow the open panel
  const prevActive = useRef<SectionId | null>(null);
  useEffect(() => {
    if (activeId === prevActive.current) return;
    const obj = activeId ? OBJS.find((o) => o.id === activeId) : null;
    if (obj) frameBox(toBox3(cubbyOf(obj)), 1.25);
    else if (prevActive.current) frameBox(ALL, 1.08);
    prevActive.current = activeId;
  }, [activeId, frameBox]);

  useFrame((_, delta) => {
    const f = fly.current;
    if (!f || (!f.intro && !controls)) return;
    f.t = Math.min(1, f.t + Math.min(delta, 0.1) / f.dur); // slow frames slow it down, never skip it
    const e = ease(f.t);
    const target = f.intro || !controls ? f.toT : controls.target.lerpVectors(f.fromT, f.toT, e);
    cam.position.copy(target).addScaledVector(f.fromDir.clone().lerp(ISO, e).normalize(), DIST);
    cam.zoom = THREE.MathUtils.lerp(f.fromZ, f.toZ, e);
    cam.updateProjectionMatrix();
    if (f.intro) {
      cam.lookAt(target); // controls.update() would clamp the top-down start
      if (controls) {
        controls.enabled = f.t === 1;
        if (f.t === 1) { controls.target.copy(target); controls.update(); }
      }
    } else {
      controls!.update();
    }
    if (f.t === 1) fly.current = null;
  });

  return (
    <group position={OFFSET}>
      <Shelf />
      {OBJS.map((o, i) => (
        <ShelfObject key={i} obj={o} active={activeId !== null && o.id === activeId} onPick={onPick} live={live} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- canvas

export type ShelfCanvasProps = {
  theme: ThemeKey;
  activeId: SectionId | null;
  onSelect: (id: SectionId) => void;
  onMiss: () => void;
  github: GithubStats | null;
  nowPlaying: NowPlaying | null;
};

export default function ShelfCanvas({ theme: themeKey, activeId, onSelect, onMiss, github, nowPlaying }: ShelfCanvasProps) {
  const theme = THEMES[themeKey];
  const live = useMemo(() => ({ github, nowPlaying }), [github, nowPlaying]);
  return (
    <Canvas
      orthographic
      shadows
      flat
      dpr={[1, 2]}
      camera={{ position: [-300, 300, 300], zoom: 5, near: 1, far: 2000 }}
      onPointerMissed={onMiss}
    >
      <ThemeCtx.Provider value={theme}>
        <color attach="background" args={[theme.bg]} />
        <ambientLight intensity={0.6} />
        <hemisphereLight args={['#ffffff', '#d9cfc2', 0.7]} />
        <directionalLight position={[-70, 150, 110]} intensity={2} castShadow={theme.lit} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.05}>
          <orthographicCamera attach="shadow-camera" args={[-110, 110, 110, -110, 1, 500]} />
        </directionalLight>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -CZ, 0]} receiveShadow visible={theme.lit}>
          <planeGeometry args={[800, 800]} />
          <shadowMaterial opacity={0.12} />
        </mesh>

        <Scene activeId={activeId} onPick={onSelect} live={live} />

        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          minAzimuthAngle={-Math.PI * 0.45}
          maxAzimuthAngle={-Math.PI * 0.05}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.42}
        />
      </ThemeCtx.Provider>
    </Canvas>
  );
}
