'use client';

// The 3D shelf (React Three Fiber). Ported from mockup 05:
//   dark = unlit line art · clay = lit with soft shadows
// Objects map to site sections; GitHub + Spotify objects react to live data.

import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Edges, Float, Html, OrbitControls, Outlines, useGLTF } from '@react-three/drei';
import { buildLayout, cubbyOf, type Box, type Decal, type LayoutKey, type ShelfLayout, type ShelfObj } from './scene';
import { paintDecal } from './decal';
import { THEMES, type Theme, type ThemeKey } from '../theme';
import { sectionById, type SectionId } from '@/content/sections';
import type { GithubStats, NowPlaying, Weather } from '@/lib/types';

const DEG = Math.PI / 180;
const WARM = '#ffc861';

const ThemeCtx = createContext<Theme>(THEMES.dark);
const useTheme = () => useContext(ThemeCtx);

// ---- layouts (desktop: 3 bays · mobile: one tall bay you scroll down) ----
type Prepared = { layout: ShelfLayout; offset: [number, number, number]; all: THREE.Box3; groundY: number; mobile: boolean };

function prepare(key: LayoutKey): Prepared {
  const layout = buildLayout(key);
  const [cx, cy, cz] = layout.center;
  const offset: [number, number, number] = [-cx, -cz, -cy]; // centre the scene on the origin (three coords)
  const all = new THREE.Box3();
  for (const b of [...layout.shelf, ...layout.objs.flatMap((o) => o.boxes)]) all.union(toBox3(b, offset));
  return { layout, offset, all, groundY: -cz, mobile: key === 'mobile' };
}
const LayoutCtx = createContext<Prepared | null>(null);
const useLayout = () => useContext(LayoutCtx)!;

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
  const { layout } = useLayout();
  return (
    <group onPointerOver={stop} onPointerMove={stop}>
      {layout.shelf.map((b, i) => <Block key={i} b={b} shelf />)}
    </group>
  );
}

// ---------------------------------------------------------------- special objects

const CLOUD_URL = '/models/cloud.glb';
useGLTF.preload(CLOUD_URL);

/** Rain under the cloud, only while it's actually raining in Singapore. */
function Rain({ base }: { base: Box }) {
  const t = useTheme();
  const motion = useMemo(() => !reduceMotion(), []);
  const drops = useMemo(
    () => Array.from({ length: 26 }, (_, i) => ({
      x: base.x + 1.5 + ((i * 7.3) % 17),
      y: base.y + 2.6 + ((i * 1.9) % 3.6), // front half, so the cloud doesn't hide them
      off: (i * 0.37) % 1,
      speed: 1.1 + ((i * 13) % 5) / 8,
    })),
    [base],
  );
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const top = base.z - 0.2; // just under the cloud
  const bottom = base.z - 4 + 2; // stays clear of the board even while the cloud bobs down
  useFrame(({ clock }) => {
    const tt = clock.elapsedTime;
    drops.forEach((d, i) => {
      const m = refs.current[i];
      if (m) m.position.y = top - (motion ? ((tt * d.speed + d.off) % 1) : d.off) * (top - bottom);
    });
  });
  return (
    <>
      {drops.map((d, i) => (
        <mesh key={i} ref={(m) => { refs.current[i] = m; }} position={[d.x, top, d.y]} raycast={() => null}>
          <boxGeometry args={[0.2, 1.5, 0.2]} />
          <meshBasicMaterial color={t.lit ? '#4f74a3' : t.edge} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

function GlbCloud({ base, lit, raining = false }: { base: Box; lit: boolean; raining?: boolean }) {
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
      <Surface color={lit ? t.hot : raining && t.lit ? '#d9d4cc' : t.face} />
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

/** Desk lamp: switches itself on at night (Singapore time); a click overrides it until the next visit. */
function Lamp({ obj, night }: { obj: ShelfObj; night: boolean }) {
  const t = useTheme();
  const [manual, setManual] = useState<boolean | null>(null);
  const on = manual ?? night;
  const setOn = (fn: (v: boolean) => boolean) => setManual(fn(on));
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

/** Desk clock running on Singapore time; hover shows the time as text. */
const sgTime = () => new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', hour: 'numeric', minute: '2-digit' }).format(new Date());

function Clock({ obj }: { obj: ShelfObj }) {
  const t = useTheme();
  const { mobile } = useLayout();
  const [hover, setHover] = useState(false);
  const [label, setLabel] = useState('');
  const hour = useRef<THREE.Group>(null);
  const minute = useRef<THREE.Group>(null);
  const second = useRef<THREE.Group>(null);
  const body = obj.boxes[0];
  const cx = body.x + body.w / 2, cy = body.z + body.h / 2, front = body.y + body.d;
  const r = Math.min(body.w, body.h) / 2 - 0.45;
  const TAU = Math.PI * 2;

  useFrame(() => {
    const now = Date.now();
    const sg = new Date(now + 8 * 3600_000); // Singapore: UTC+8, no daylight saving
    const h = sg.getUTCHours(), m = sg.getUTCMinutes(), s = sg.getUTCSeconds();
    if (hour.current) hour.current.rotation.z = -(((h % 12) + m / 60) / 12) * TAU;
    if (minute.current) minute.current.rotation.z = -((m + s / 60) / 60) * TAU;
    if (second.current) second.current.rotation.z = -(s / 60) * TAU;
  });

  const ink = hover ? t.accent : t.edge;
  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); setLabel(sgTime()); }}
      onPointerOut={() => setHover(false)}
    >
      {obj.boxes.map((b, i) => <Block key={i} b={b} lit={hover} />)}
      <group position={[cx, cy, front + 0.04]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[r, r, 0.08, 48]} />
          <Surface color={t.lit ? '#ffffff' : t.face} />
          <Edges threshold={15} color={ink} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * TAU;
          const len = i % 3 === 0 ? 0.5 : 0.25;
          return (
            <mesh key={i} position={[Math.sin(a) * (r - 0.2 - len / 2), Math.cos(a) * (r - 0.2 - len / 2), 0.06]} rotation={[0, 0, -a]} raycast={() => null}>
              <boxGeometry args={[0.12, len, 0.02]} />
              <meshBasicMaterial color={t.edge} toneMapped={false} />
            </mesh>
          );
        })}
        <group ref={hour} position={[0, 0, 0.08]}>
          <mesh position={[0, r * 0.27, 0]}><boxGeometry args={[0.26, r * 0.54, 0.05]} /><meshBasicMaterial color={t.edge} toneMapped={false} /></mesh>
        </group>
        <group ref={minute} position={[0, 0, 0.12]}>
          <mesh position={[0, r * 0.4, 0]}><boxGeometry args={[0.17, r * 0.8, 0.05]} /><meshBasicMaterial color={t.edge} toneMapped={false} /></mesh>
        </group>
        <group ref={second} position={[0, 0, 0.16]}>
          <mesh position={[0, r * 0.38, 0]}><boxGeometry args={[0.06, r * 0.9, 0.04]} /><meshBasicMaterial color={t.lit ? '#e4572e' : t.accent} toneMapped={false} /></mesh>
        </group>
        <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.06, 20]} />
          <meshBasicMaterial color={t.edge} toneMapped={false} />
        </mesh>
      </group>
      {hover && !mobile && (
        <Html position={[cx, body.z + body.h + 2.4, body.y + body.d / 2]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="tag3d">{label}<small>local time in Singapore</small></div>
        </Html>
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

type LiveProps = { github: GithubStats | null; nowPlaying: NowPlaying | null; weather: Weather | null };

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
    // box 0 positions the GLB; it only rains when it's raining in Singapore
    const raining = live.weather?.raining ?? false;
    parts.push(<Suspense key="glb" fallback={null}><GlbCloud base={obj.boxes[0]} lit={lit} raining={raining} /></Suspense>);
    if (raining) parts.push(<Rain key="rain" base={obj.boxes[0]} />);
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

  const { mobile } = useLayout();
  const a = obj.anchor;
  const np = live.nowPlaying;
  const wx = live.weather;
  const sub =
    id === 'spotify' && np?.title ? `${np.isPlaying ? '▶' : 'last played:'} ${np.title} · ${np.artist}`
    : id === 'cloud' && wx?.source === 'live' ? `${wx.raining ? 'raining' : 'dry'} in Singapore${wx.tempC != null ? ` · ${wx.tempC}°C` : ''}`
    : id ? sectionById(id).kicker : '';
  return (
    <group ref={ref} {...handlers}>
      {obj.float ? <Float speed={1.6} rotationIntensity={0} floatIntensity={2.2} floatingRange={[-1.2, 1.6]}>{parts}</Float> : parts}
      {id && a && hover && !active && !mobile && (
        <Html position={[a[0], a[2] + 2, a[1]]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="tag3d">{sectionById(id).title} ↗<small>{sub}</small></div>
        </Html>
      )}
    </group>
  );
}

function ShelfObject(props: { obj: ShelfObj; active: boolean; onPick: (id: SectionId) => void; live: LiveProps }) {
  if (props.obj.kind === 'lamp') return <Lamp obj={props.obj} night={props.live.weather ? !props.live.weather.isDay : false} />;
  if (props.obj.kind === 'teddy') return <Teddy obj={props.obj} />;
  if (props.obj.kind === 'clock') return <Clock obj={props.obj} />;
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
function toBox3(c: Box, offset: [number, number, number]) {
  return new THREE.Box3(
    new THREE.Vector3(c.x + offset[0], c.z + offset[1], c.y + offset[2]),
    new THREE.Vector3(c.x + c.w + offset[0], c.z + c.h + offset[1], c.y + c.d + offset[2]),
  );
}
const PREPARED: Record<LayoutKey, Prepared> = { desktop: prepare('desktop'), mobile: prepare('mobile') };

/** Extent of a box in iso screen space (RIGHT / UP axes). */
function isoExtent(box: THREE.Box3) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  const c = new THREE.Vector3();
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    c.set(x, y, z);
    const px = c.dot(RIGHT), py = c.dot(UP);
    x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
  }
  return { x0, x1, y0, y1 };
}

const MOBILE_HEADER = 96; // px kept clear above the shelf
const MOBILE_FOOTER = 72; // px below it

/** Phone: fit the bay's width; the page scrolls and the camera moves down the shelf 1:1 with it. */
function mobileFraming(all: THREE.Box3, size: { width: number; height: number }) {
  const { x0, x1, y0, y1 } = isoExtent(all);
  const zoom = size.width / ((x1 - x0) * 1.06);
  const top = new THREE.Vector3().addScaledVector(RIGHT, (x0 + x1) / 2).addScaledVector(UP, y1 - (size.height / 2 - MOBILE_HEADER) / zoom);
  return { zoom, top, contentPx: Math.ceil((y1 - y0) * zoom + MOBILE_HEADER + MOBILE_FOOTER) };
}

function framing(box: THREE.Box3, size: { width: number; height: number }, pad: number) {
  const { x0, x1, y0, y1 } = isoExtent(box);
  const header = size.width < 700 ? 90 : 130;
  const zoom = Math.min(size.width / ((x1 - x0) * pad), (size.height - header) / ((y1 - y0) * pad));
  const target = new THREE.Vector3().addScaledVector(RIGHT, (x0 + x1) / 2).addScaledVector(UP, (y0 + y1) / 2 + 30 / zoom);
  return { target, zoom };
}

type Flight = { t: number; dur: number; intro?: boolean; fromT: THREE.Vector3; toT: THREE.Vector3; fromZ: number; toZ: number; fromDir: THREE.Vector3 };
type OrbitLike = { target: THREE.Vector3; update: () => void; enabled: boolean };

function Scene({ activeId, onPick, live, onContentHeight }: { activeId: SectionId | null; onPick: (id: SectionId) => void; live: LiveProps; onContentHeight?: (px: number) => void }) {
  const { camera, size } = useThree();
  const controls = useThree((s) => s.controls) as unknown as OrbitLike | null;
  const cam = camera as THREE.OrthographicCamera;
  const P = useLayout();
  const ALL = P.all;
  const fly = useRef<Flight | null>(null);
  const current = useRef({ box: ALL, pad: 1.08 });

  // phone: camera follows the page scroll; tell the page how tall to be
  const mob = useMemo(() => (P.mobile ? mobileFraming(ALL, size) : null), [P.mobile, ALL, size]);
  useEffect(() => { if (mob) onContentHeight?.(mob.contentPx); }, [mob, onContentHeight]);

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
    if (P.mobile) return; // phone framing is driven by scroll in useFrame
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
    prevActive.current = activeId;
    if (P.mobile) return; // on phones the panel covers the screen; no camera move needed
    const obj = activeId ? P.layout.objs.find((o) => o.id === activeId) : null;
    if (obj) frameBox(toBox3(cubbyOf(obj), P.offset), 1.25);
    else frameBox(ALL, 1.08);
  }, [activeId, frameBox, P, ALL]);

  useFrame((_, delta) => {
    if (mob) {
      // scroll 1px → camera moves 1px down the shelf, like a normal page
      const target = mob.top.clone().addScaledVector(UP, -window.scrollY / mob.zoom);
      cam.position.copy(target).addScaledVector(ISO, DIST);
      cam.lookAt(target);
      if (cam.zoom !== mob.zoom) { cam.zoom = mob.zoom; cam.updateProjectionMatrix(); }
      return;
    }
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
    <group position={P.offset}>
      <Shelf />
      {P.layout.objs.map((o, i) => (
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
  weather?: Weather | null;
  layout?: LayoutKey;
  /** phone layout only: total page height (px) needed to scroll through the shelf */
  onContentHeight?: (px: number) => void;
};

export default function ShelfCanvas({ theme: themeKey, activeId, onSelect, onMiss, github, nowPlaying, weather = null, layout = 'desktop', onContentHeight }: ShelfCanvasProps) {
  const theme = THEMES[themeKey];
  const live = useMemo(() => ({ github, nowPlaying, weather }), [github, nowPlaying, weather]);
  const P = PREPARED[layout];
  const s = P.mobile ? 160 : 110; // shadow camera has to cover the taller phone shelf
  return (
    <Canvas
      orthographic
      shadows
      flat
      dpr={[1, 2]}
      camera={{ position: [-300, 300, 300], zoom: 5, near: 1, far: 2000 }}
      onPointerMissed={onMiss}
      style={P.mobile ? { touchAction: 'pan-y' } : undefined}
    >
      <ThemeCtx.Provider value={theme}>
        <LayoutCtx.Provider value={P}>
          <color attach="background" args={[theme.bg]} />
          <ambientLight intensity={0.6} />
          <hemisphereLight args={['#ffffff', '#d9cfc2', 0.7]} />
          <directionalLight position={[-70, 150, 110]} intensity={2} castShadow={theme.lit} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.05}>
            <orthographicCamera key={layout} attach="shadow-camera" args={[-s, s, s, -s, 1, 600]} />
          </directionalLight>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, P.groundY, 0]} receiveShadow visible={theme.lit}>
            <planeGeometry args={[800, 800]} />
            <shadowMaterial opacity={0.12} />
          </mesh>

          <Scene key={layout} activeId={activeId} onPick={onSelect} live={live} onContentHeight={onContentHeight} />

          {/* phones scroll the page instead of orbiting (OrbitControls would also block touch scrolling) */}
          {!P.mobile && (
            <OrbitControls
              makeDefault
              enablePan={false}
              enableDamping
              minAzimuthAngle={-Math.PI * 0.45}
              maxAzimuthAngle={-Math.PI * 0.05}
              minPolarAngle={Math.PI * 0.2}
              maxPolarAngle={Math.PI * 0.42}
            />
          )}
        </LayoutCtx.Provider>
      </ThemeCtx.Provider>
    </Canvas>
  );
}
