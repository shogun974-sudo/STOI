import '@fontsource/bebas-neue/400.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/400-italic.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/800.css';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing,
  delayRender, continueRender,
} from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { noise2D } from '@remotion/noise';
import { evolvePath, getLength, getPointAtLength } from '@remotion/paths';
import * as THREE from 'three';
import SIG from './signature-zeklair.json';

/*
 * Pub Zeklair « Vos photos prennent vie. » : 2 vidéos de 30 s utilisant les 15 effets du catalogue.
 * Vidéo 1 (Vitrine)  : effets 1, 3, 2, 6, 12, 7, 8, 10.
 * Vidéo 2 (Lancement): effets 11, 4, 5, 13, 9, 15, 14, 1.
 * Chaque scène dure 8 temps de la musique (129 BPM ≈ 111,5 images) ; les scènes sont dessinées en 1080×1350
 * et posées dans un panneau à gauche pour la version 16:9.
 */

export const Z_FPS = 30;
export const Z_TOTAL = 900;
const BEAT = (60 / 129.2) * Z_FPS; // ≈ 13,93 images
const SCENE = BEAT * 8;
const bornes = Array.from({ length: 8 }, (_, k) => Math.round(k * SCENE)).concat(Z_TOTAL);

const BEBAS = '"Bebas Neue", sans-serif';
const POP = 'Poppins, sans-serif';
const V = '#8b5cf6';
const V2 = '#6d28d9';
const OR = '#f2c94c';
const OR_CLAIR = '#fff1b8';
const NUIT = '#07060b';
const BLANC = '#fbf8ff';
const GOLD = 'linear-gradient(100deg,#fff1b8 0%,#f2c94c 25%,#c8901f 50%,#f6d36b 72%,#a66d14 100%)';
const BG: React.CSSProperties = { background: 'radial-gradient(circle at 50% 35%, #2a1650 0%, #120b22 55%, #07060b 100%)' };
const goldText: React.CSSProperties = { backgroundImage: GOLD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const src = (n: string) => staticFile(`zeklair/${n}`);
const TEL = '06 92 09 76 47';
const MAIL = 'shogun974@live.fr';

const Photo: React.FC<{ n: string; pos?: string; zoom?: [number, number]; filter?: string }> = ({ n, pos = '50% 50%', zoom = [1.12, 1], filter }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, SCENE], zoom, clamp);
  return (
    <Img src={src(n)} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos,
      transform: `scale(${s})`, filter,
    }} />
  );
};

// Légende en pastille (version 4:5)
const Pastille: React.FC<{ texte: string }> = ({ texte }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - 4, fps, config: { damping: 200 } });
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 56, display: 'flex', justifyContent: 'center', zIndex: 60 }}>
      <div style={{
        background: 'rgba(18,11,34,.82)', border: `3px solid ${V}`, borderRadius: 999, padding: '14px 34px',
        fontFamily: POP, fontWeight: 800, fontSize: 36, color: BLANC, opacity: p, transform: `translateY(${(1 - p) * 30}px)`,
        boxShadow: '0 10px 30px rgba(0,0,0,.45)', whiteSpace: 'nowrap',
      }}>{texte}</div>
    </div>
  );
};

/* ---------- 1. Logo révélé avec reflet doré ---------- */
const LogoReflet: React.FC<{ contact?: boolean }> = ({ contact }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 11, mass: 0.9 } });
  const sweep = interpolate(f, [22, 62], [-60, 160], clamp);
  const logo = src('logo.svg');
  const mask = { WebkitMaskImage: `url(${logo})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' } as React.CSSProperties;
  const halo = 0.5 + 0.5 * Math.sin(f / 7);
  const txt = interpolate(f, [40, 56], [0, 1], clamp);
  const top = contact ? 230 : 340;
  return (
    <AbsoluteFill style={BG}>
      <div style={{
        position: 'absolute', left: 540 - 420, top: top + 40, width: 840, height: 500, borderRadius: '50%',
        background: `radial-gradient(closest-side, rgba(139,92,246,${0.35 + 0.15 * halo}), transparent)`,
      }} />
      <div style={{
        position: 'absolute', left: 540 - 430, top, width: 860, height: 566,
        transform: `scale(${s}) rotate(${(1 - s) * -10}deg)`, opacity: Math.min(1, s * 1.3),
      }}>
        <Img src={logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        <div style={{
          position: 'absolute', inset: 0, ...mask, mixBlendMode: 'screen',
          background: `linear-gradient(105deg, transparent ${sweep - 16}%, rgba(255,250,225,.95) ${sweep}%, transparent ${sweep + 16}%)`,
        }} />
      </div>
      {contact ? (
        <div style={{ position: 'absolute', top: 860, left: 0, right: 0, textAlign: 'center', opacity: txt, transform: `translateY(${(1 - txt) * 30}px)` }}>
          <div style={{ fontFamily: POP, fontStyle: 'italic', fontSize: 50, color: BLANC }}>Vos photos prennent vie.</div>
          <div style={{ fontFamily: BEBAS, fontSize: 96, letterSpacing: 4, marginTop: 26, ...goldText }}>{TEL}</div>
          <div style={{ fontFamily: POP, fontWeight: 600, fontSize: 38, color: '#d9ccff', marginTop: 4 }}>{MAIL}</div>
          <div style={{ fontFamily: POP, fontSize: 26, color: '#a99bd0', marginTop: 26 }}>Offre –20 % valable jusqu'au 31/01/2027</div>
        </div>
      ) : (
        <div style={{
          position: 'absolute', top: 960, left: 0, right: 0, textAlign: 'center', fontFamily: POP, fontWeight: 600, fontSize: 40,
          letterSpacing: 10, color: '#d9ccff', opacity: txt,
        }}>VIDÉOS ANIMÉES</div>
      )}
    </AbsoluteFill>
  );
};

/* ---------- 3. Avant / après : photo → avatar ---------- */
const AvantApres: React.FC = () => {
  const f = useCurrentFrame();
  const x = interpolate(f, [6, 40, 66, 92], [100, 12, 62, 50], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ backgroundColor: NUIT }}>
      <Img src={src('portrait.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 12%' }} />
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${x}%)` }}>
        <Img src={src('avatar.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '100% 0%' }} />
      </div>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${x}%`, width: 8, marginLeft: -4, background: GOLD, boxShadow: '0 0 24px rgba(242,201,76,.7)' }}>
        <div style={{
          position: 'absolute', top: '50%', left: -38, width: 84, height: 84, marginTop: -42, borderRadius: 42, background: GOLD,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: NUIT, fontWeight: 800, fontFamily: POP,
          border: `4px solid ${V2}`,
        }}>⇆</div>
      </div>
      {([['VOTRE PHOTO', 'left'], ['VOTRE AVATAR', 'right']] as const).map(([t, side]) => (
        <div key={t} style={{
          position: 'absolute', top: 44, [side]: 40, background: 'rgba(18,11,34,.78)', color: BLANC, border: `2px solid ${V}`,
          fontFamily: POP, fontWeight: 800, fontSize: 30, padding: '8px 20px', borderRadius: 12, letterSpacing: 2,
        }}>{t}</div>
      ))}
    </AbsoluteFill>
  );
};

/* ---------- 2. Logo en orbite autour de la mascotte ---------- */
const Orbite: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entree = spring({ frame: f, fps, config: { damping: 14 } });
  const ang = (t: number) => (t / SCENE) * Math.PI * 2 * 1.5 - Math.PI * 0.15;
  const CX = 540, CY = 640, RX = 470, RY = 190, TILT = -8;
  const pos = (a: number) => {
    const x = Math.cos(a) * RX, y = Math.sin(a) * RY;
    const r = (TILT * Math.PI) / 180;
    return { x: CX + x * Math.cos(r) - y * Math.sin(r), y: CY + x * Math.sin(r) + y * Math.cos(r), front: Math.sin(a) > 0, d: (Math.sin(a) + 1) / 2 };
  };
  const p = pos(ang(f));
  const size = 270 * (0.7 + 0.4 * p.d);
  const trail = Array.from({ length: 14 }, (_, i) => pos(ang(f - (i + 1) * 1.2)));
  const logo = (
    <Img src={src('logo-z.svg')} style={{
      position: 'absolute', left: p.x - size * 0.4, top: p.y - size / 2, width: size * 0.8, height: size, objectFit: 'contain',
      transform: `scaleX(${0.3 + 0.7 * Math.abs(Math.cos(f / 7))})`,
      filter: p.front ? 'drop-shadow(0 12px 20px rgba(0,0,0,.5))' : 'blur(1px) brightness(.8)',
    }} />
  );
  const dots = (front: boolean) => trail.filter((t) => t.front === front).map((t, i) => (
    <div key={i} style={{
      position: 'absolute', left: t.x - 8, top: t.y - 8, width: 16, height: 16, borderRadius: 8, background: OR_CLAIR,
      boxShadow: `0 0 14px ${OR}`, opacity: 0.8 - i * 0.05,
    }} />
  ));
  return (
    <AbsoluteFill style={BG}>
      {dots(false)}
      {!p.front && logo}
      <div style={{
        position: 'absolute', left: CX - 330, top: CY - 330, width: 660, height: 660, borderRadius: '50%', overflow: 'hidden',
        border: '14px solid transparent', backgroundImage: `linear-gradient(${NUIT},${NUIT}), ${GOLD}`, backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box', boxShadow: `0 0 60px rgba(139,92,246,.55)`, transform: `scale(${entree})`,
      }}>
        <Img src={src('avatar.png')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      {dots(true)}
      {p.front && logo}
    </AbsoluteFill>
  );
};

/* ---------- 6. Typographie animée (slogan) ---------- */
const Typo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mots = ['Vos', 'photos', 'prennent', 'vie.'];
  const accent = [1, 3];
  const flash = Math.max(0, 1 - ((f % BEAT) / BEAT) * 3) * 0.12;
  return (
    <AbsoluteFill style={{ ...BG, alignItems: 'center', justifyContent: 'center' }}>
      <AbsoluteFill style={{ background: `rgba(139,92,246,${flash})` }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        {mots.map((m, i) => {
          const s = spring({ frame: f - 2 - i * BEAT, fps, config: { damping: 10, mass: 0.6 } });
          return (
            <div key={i} style={{
              fontFamily: BEBAS, fontSize: accent.includes(i) ? 250 : 190, lineHeight: 0.98, letterSpacing: 4,
              ...(accent.includes(i) ? goldText : { color: BLANC }),
              opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - s) * 90}px) rotate(${(1 - s) * (i % 2 ? 9 : -9)}deg) scale(${0.6 + 0.4 * s})`,
              filter: accent.includes(i) ? 'drop-shadow(0 6px 0 rgba(109,40,217,.8))' : undefined,
            }}>{m}</div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 12. Poussière d'or et étincelles ---------- */
const Etoile: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="-50 -50 100 100">
    <path d="M0 -50 C 6 -8 8 -6 50 0 C 8 6 6 8 0 50 C -6 8 -8 6 -50 0 C -8 -6 -6 -8 0 -50 Z" fill={OR_CLAIR} />
  </svg>
);
const Particules: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const titre = interpolate(f, [BEAT, BEAT + 14], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: NUIT }}>
      <Photo n="cocktails.jpg" pos="50% 40%" filter="brightness(.72) saturate(1.15)" />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(18,11,34,.55) 0%, transparent 35%, transparent 60%, rgba(18,11,34,.7) 100%)' }} />
      {Array.from({ length: 16 }).map((_, i) => {
        const x = (i * 263) % 1080, y = (i * 431) % 1350;
        const r = 40 + (i % 4) * 30;
        return <div key={`b${i}`} style={{
          position: 'absolute', left: x + noise2D('bx', i, t * 0.2) * 40 - r, top: y + noise2D('by', i, t * 0.2) * 40 - r, width: r * 2, height: r * 2,
          borderRadius: '50%', background: `radial-gradient(closest-side, ${i % 2 ? 'rgba(242,201,76,.28)' : 'rgba(139,92,246,.3)'}, transparent)`,
        }} />;
      })}
      {Array.from({ length: 80 }).map((_, i) => {
        const x = ((i * 157) % 1080) + noise2D('dx', i, t * 0.4) * 60;
        const y = 1350 - ((((i * 89) % 1350) + t * (60 + (i % 5) * 22)) % 1400);
        const s = 3 + (i % 4) * 2;
        const sc = 0.35 + 0.65 * Math.abs(Math.sin(t * 4 + i));
        return <div key={`o${i}`} style={{
          position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: OR_CLAIR,
          boxShadow: `0 0 ${s * 3}px ${OR}`, opacity: sc,
        }} />;
      })}
      {Array.from({ length: 12 }).map((_, i) => {
        const cyc = (f + i * 9) % 36;
        const k = Math.sin((cyc / 36) * Math.PI);
        return <div key={`e${i}`} style={{
          position: 'absolute', left: (i * 347) % 1000 + 20, top: (i * 523) % 1250 + 40, opacity: k,
          transform: `scale(${0.4 + k * 0.8}) rotate(${f * 3}deg)`,
        }}><Etoile s={60} /></div>;
      })}
      <div style={{ position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', opacity: titre, transform: `translateY(${(1 - titre) * -30}px)` }}>
        <div style={{ fontFamily: BEBAS, fontSize: 150, lineHeight: 1, letterSpacing: 3, ...goldText, filter: 'drop-shadow(0 6px 18px rgba(0,0,0,.6))' }}>Vos cocktails</div>
        <div style={{ fontFamily: POP, fontWeight: 600, fontSize: 52, color: BLANC, textShadow: '0 4px 18px rgba(0,0,0,.7)' }}>brillent en vidéo</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 7. Transition « iris » ---------- */
const Iris: React.FC = () => {
  const f = useCurrentFrame();
  const r = interpolate(f, [BEAT * 3, BEAT * 5.5], [0, 120], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const t1 = interpolate(f, [6, 18, BEAT * 3, BEAT * 3.6], [0, 1, 1, 0], clamp);
  const t2 = interpolate(f, [BEAT * 5, BEAT * 6], [0, 1], clamp);
  const txt = (s: string, o: number) => (
    <div style={{
      position: 'absolute', top: 110, left: 0, right: 0, textAlign: 'center', fontFamily: BEBAS, fontSize: 120, color: BLANC, opacity: o,
      letterSpacing: 3, textShadow: '0 6px 22px rgba(0,0,0,.75)',
    }}>{s}</div>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: NUIT }}>
      <Photo n="poisson.jpg" pos="50% 62%" zoom={[1, 1.12]} />
      {txt('Du poisson-frites…', t1)}
      <div style={{ position: 'absolute', inset: 0, clipPath: `circle(${r}% at 50% 62%)` }}>
        <Img src={src('sushi.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 55%', transform: `scale(${1.2 - r / 1000})` }} />
      </div>
      <div style={{
        position: 'absolute', left: '50%', top: '62%', width: `${r * 2.6}%`, aspectRatio: '1', transform: 'translate(-50%,-50%)',
        borderRadius: '50%', border: `12px solid ${OR}`, boxShadow: `0 0 40px ${V}`, opacity: r > 0 && r < 118 ? 0.95 : 0,
      }} />
      {txt('…aux ramens', t2)}
    </AbsoluteFill>
  );
};

/* ---------- 8. Mosaïque de tuiles ---------- */
const Mosaique: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tuiles: [string, string][] = [['cocktails.jpg', '50% 40%'], ['janna.jpg', '60% 62%'], ['poisson.jpg', '50% 62%'], ['sushi.jpg', '50% 55%'], ['avatar.png', '70% 30%'], ['portrait.jpg', '50% 15%']];
  const zoom = interpolate(f, [BEAT * 5, BEAT * 7], [1, 2.1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const titre = interpolate(f, [BEAT * 6, BEAT * 7], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ ...BG, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 30, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', gap: 18,
        transform: `scale(${zoom})`, transformOrigin: '27% 18%',
      }}>
        {tuiles.map(([n, pos], i) => {
          const s = spring({ frame: f - 2 - i * (BEAT / 2), fps, config: { damping: 14 } });
          return (
            <div key={n} style={{ perspective: 1200, width: '100%', height: '100%', minHeight: 0, minWidth: 0 }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden', transform: `rotateY(${(1 - s) * 180}deg)`,
                backfaceVisibility: 'hidden', boxShadow: '0 10px 26px rgba(0,0,0,.5)', border: `3px solid rgba(242,201,76,.6)`,
              }}>
                <Img src={src(n)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos }} />
              </div>
            </div>
          );
        })}
      </div>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, transparent 55%, rgba(7,6,11,.85) 100%)', opacity: titre }} />
      <div style={{
        position: 'absolute', bottom: 150, left: 0, right: 0, textAlign: 'center', opacity: titre, transform: `scale(${0.8 + 0.2 * titre})`,
        fontFamily: BEBAS, fontSize: 100, letterSpacing: 4, color: BLANC, textShadow: '0 6px 24px rgba(0,0,0,.85)',
      }}>Restos · Bars · Commerces</div>
    </AbsoluteFill>
  );
};

/* ---------- 10. Médaille 3D Zeklair ---------- */
const Medaille: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const width = 1080, height = 1350;
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [handle] = useState(() => delayRender('Texture Z'));
  useEffect(() => {
    const im = new Image();
    im.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 1024;
      const g = cv.getContext('2d')!;
      const grad = g.createRadialGradient(512, 450, 60, 512, 512, 540);
      grad.addColorStop(0, '#3b1d72'); grad.addColorStop(1, '#0e0820');
      g.fillStyle = grad; g.fillRect(0, 0, 1024, 1024);
      const h = 700, w = (h * 440) / 545;
      g.drawImage(im, 512 - w / 2, 512 - h / 2, w, h);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.center.set(0.5, 0.5);
      t.rotation = -Math.PI / 2;
      setTex(t);
      continueRender(handle);
    };
    im.onerror = () => continueRender(handle);
    im.src = src('logo-z.svg');
  }, [handle]);
  const D = bornes[8] - bornes[7];
  const entree = spring({ frame: f, fps, config: { damping: 14 } });
  const rotY = interpolate(f, [0, 60], [-Math.PI * 1.6, 0], { ...clamp, easing: Easing.out(Easing.cubic) }) + Math.sin(f / 16) * 0.12;
  const monte = interpolate(f, [52, 72], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const txt = interpolate(f, [66, 82], [0, 1], clamp);
  const mats = useMemo(() => {
    if (!tex) return null;
    const bord = new THREE.MeshStandardMaterial({ color: '#d4a53a', metalness: 0.8, roughness: 0.25 });
    const face = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, metalness: 0.15, roughness: 0.45 });
    return [bord, face, face];
  }, [tex]);
  return (
    <AbsoluteFill style={BG}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 11], fov: 40 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[interpolate(f, [0, D], [-4, 4]), 3, 5]} intensity={2.4} color="#fff4d6" />
        <pointLight position={[-3, -2, 4]} intensity={20} color="#b79cff" />
        {mats && (
          <group scale={entree * (1 - 0.32 * monte)} rotation={[0.1, rotY, 0]} position={[0, 0.3 + monte * 1.75, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={mats}>
              <cylinderGeometry args={[2, 2, 0.32, 96, 1]} />
            </mesh>
            <mesh>
              <torusGeometry args={[2.0, 0.08, 16, 120]} />
              <meshStandardMaterial color="#f2c94c" metalness={0.85} roughness={0.22} />
            </mesh>
          </group>
        )}
      </ThreeCanvas>
      <div style={{ position: 'absolute', top: 720, left: 0, right: 0, textAlign: 'center', opacity: txt, transform: `translateY(${(1 - txt) * 30}px)` }}>
        <div style={{ fontFamily: BEBAS, fontSize: 170, lineHeight: 1, letterSpacing: 8, ...goldText }}>ZEKLAIR</div>
        <div style={{ fontFamily: POP, fontStyle: 'italic', fontSize: 48, color: BLANC, marginTop: 6 }}>Vos photos prennent vie.</div>
        <div style={{ fontFamily: BEBAS, fontSize: 84, letterSpacing: 4, color: OR, marginTop: 36 }}>{TEL}</div>
        <div style={{ fontFamily: POP, fontWeight: 600, fontSize: 36, color: '#d9ccff' }}>{MAIL}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 11. Transitions pro ---------- */
const Plan: React.FC<{ n: string; pos: string; titre: string }> = ({ n, pos, titre }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 4, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill>
      <Img src={src(n)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, transform: `scale(${1.1 - f / 900})` }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(18,11,34,.65), transparent 40%)' }} />
      <div style={{
        position: 'absolute', top: 100, left: 0, right: 0, textAlign: 'center', fontFamily: BEBAS, fontSize: 140, letterSpacing: 4,
        color: BLANC, textShadow: '0 6px 22px rgba(0,0,0,.6)', opacity: s, transform: `translateY(${(1 - s) * -30}px)`,
      }}>{titre}</div>
    </AbsoluteFill>
  );
};
const Transitions: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: NUIT }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={44}><Plan n="janna.jpg" pos="62% 64%" titre="Vos plats" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 14 })} />
      <TransitionSeries.Sequence durationInFrames={42}><Plan n="sushi.jpg" pos="50% 55%" titre="vos produits" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: 'from-top-left' })} timing={linearTiming({ durationInFrames: 14 })} />
      <TransitionSeries.Sequence durationInFrames={53}><Plan n="cocktails.jpg" pos="50% 40%" titre="en vidéo !" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);

/* ---------- 4. Carte de La Réunion ---------- */
const proj = (lat: number, lon: number) => [106 + (lon - 55.22) * 1400, 430 + (-lat - 20.87) * 1490] as const;
const COTE: [number, number][] = [
  [-20.87, 55.45], [-20.885, 55.53], [-20.905, 55.61], [-20.95, 55.66], [-21.0, 55.7], [-21.04, 55.725], [-21.13, 55.79], [-21.21, 55.83],
  [-21.29, 55.82], [-21.36, 55.78], [-21.385, 55.7], [-21.39, 55.62], [-21.36, 55.55], [-21.345, 55.47], [-21.3, 55.41], [-21.27, 55.36],
  [-21.2, 55.29], [-21.16, 55.27], [-21.08, 55.23], [-21.04, 55.22], [-21.0, 55.26], [-20.94, 55.29], [-20.92, 55.33], [-20.89, 55.4],
];
const lisse = (pts: (readonly [number, number])[], ferme = true) => {
  const n = pts.length;
  const P = (i: number) => pts[ferme ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M ${P(0)[0].toFixed(1)} ${P(0)[1].toFixed(1)}`;
  for (let i = 0; i < (ferme ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + (ferme ? ' Z' : '');
};
const VILLES: { nom: string; ll: [number, number]; dx: number; dy: number; anchor: 'start' | 'end' | 'middle' }[] = [
  { nom: 'Saint-Denis', ll: [-20.9, 55.45], dx: 0, dy: -40, anchor: 'middle' },
  { nom: 'Saint-Paul', ll: [-21.01, 55.29], dx: -10, dy: -40, anchor: 'start' },
  { nom: 'Saint-Pierre', ll: [-21.33, 55.48], dx: 0, dy: 62, anchor: 'middle' },
  { nom: 'Saint-Benoît', ll: [-21.05, 55.7], dx: -20, dy: -36, anchor: 'end' },
];
const Carte: React.FC = () => {
  const f = useCurrentFrame();
  const cote = useMemo(() => lisse(COTE.map(([a, b]) => proj(a, b))), []);
  const route = useMemo(() => lisse([...VILLES.map((v) => proj(v.ll[0], v.ll[1])), proj(VILLES[0].ll[0], VILLES[0].ll[1])], false), []);
  const dessin = interpolate(f, [0, 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const p = interpolate(f, [BEAT, BEAT * 6.5], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const ev = evolvePath(p, route);
  const ptc = getPointAtLength(route, getLength(route) * p);
  const titre = interpolate(f, [BEAT * 6, BEAT * 7], [0, 1], clamp);
  const evc = evolvePath(dessin, cote);
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 50%, #2b1a55 0%, #160d30 60%, #07060b 100%)' }}>
      <svg viewBox="0 0 1080 1350" width="100%" height="100%">
        {Array.from({ length: 10 }).map((_, i) => (
          <path key={i} d={`M 0 ${140 * i + 40 + Math.sin(f / 15 + i) * 6} q 60 -16 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0`} stroke="rgba(139,92,246,.14)" strokeWidth="4" fill="none" />
        ))}
        <defs>
          <linearGradient id="orz" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff1b8" /><stop offset=".5" stopColor="#f2c94c" /><stop offset="1" stopColor="#a66d14" />
          </linearGradient>
        </defs>
        <path d={cote} fill={`rgba(139,92,246,${0.35 * dessin})`} />
        <path d={cote} fill="none" stroke="url(#orz)" strokeWidth="8" strokeLinejoin="round" strokeDasharray={evc.strokeDasharray} strokeDashoffset={evc.strokeDashoffset} />
        <path d={route} fill="none" stroke={OR_CLAIR} strokeWidth="7" strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} opacity={0.9} />
        {VILLES.map((v, i) => {
          const [x, y] = proj(v.ll[0], v.ll[1]);
          const s = interpolate(f, [BEAT * (1 + i * 1.5), BEAT * (1 + i * 1.5) + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2.5)) });
          return (
            <g key={v.nom} transform={`translate(${x} ${y}) scale(${s})`}>
              <circle r="30" fill="rgba(242,201,76,.25)" />
              <circle r="15" fill={OR} stroke={NUIT} strokeWidth="4" />
              <text x={v.dx} y={v.dy} textAnchor={v.anchor} fontFamily="Poppins" fontWeight={800} fontSize="36" fill={BLANC} stroke={NUIT} strokeWidth="8" paintOrder="stroke">{v.nom}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ position: 'absolute', left: (ptc?.x ?? 0) - 40, top: (ptc?.y ?? 0) - 45, width: 80, height: 90, opacity: p > 0 && p < 1 ? 1 : 0 }}>
        <Img src={src('logo-z.svg')} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(242,201,76,.9))' }} />
      </div>
      <div style={{ position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', fontFamily: BEBAS, fontSize: 130, letterSpacing: 5, ...goldText, opacity: titre, transform: `scale(${0.8 + 0.2 * titre})` }}>
        Partout sur l'île
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 5. Compteur : livraison dès 48 h ---------- */
const Compteur: React.FC = () => {
  const f = useCurrentFrame();
  const v = interpolate(f, [6, BEAT * 4.5], [0, 48], { ...clamp, easing: Easing.out(Easing.cubic) });
  const r = 250, circ = 2 * Math.PI * r;
  const sous = interpolate(f, [BEAT * 4.5, BEAT * 5.5], [0, 1], clamp);
  return (
    <AbsoluteFill style={BG}>
      <div style={{ position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', fontFamily: POP, fontWeight: 600, fontSize: 48, color: '#d9ccff', letterSpacing: 6 }}>
        VOTRE VIDÉO PRÊTE
      </div>
      <svg width="640" height="640" viewBox="0 0 640 640" style={{ position: 'absolute', left: 220, top: 260 }}>
        <defs>
          <linearGradient id="anneau" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff1b8" /><stop offset=".5" stopColor="#f2c94c" /><stop offset="1" stopColor="#c8901f" />
          </linearGradient>
        </defs>
        <circle cx="320" cy="320" r={r} stroke="rgba(139,92,246,.3)" strokeWidth="40" fill="none" />
        <circle cx="320" cy="320" r={r} stroke="url(#anneau)" strokeWidth="40" fill="none" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - v / 48)} transform="rotate(-90 320 320)" />
      </svg>
      <div style={{ position: 'absolute', top: 400, width: '100%', textAlign: 'center', fontFamily: BEBAS, fontSize: 300, lineHeight: 1, color: BLANC }}>
        {Math.round(v)}<span style={{ fontSize: 150, ...goldText }}> h</span>
      </div>
      <div style={{
        position: 'absolute', top: 990, left: 60, right: 60, textAlign: 'center', opacity: sous, transform: `translateY(${(1 - sous) * 30}px)`,
      }}>
        <div style={{ fontFamily: BEBAS, fontSize: 110, letterSpacing: 4, ...goldText }}>dès 48 heures</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 13. Graphique : les prix baissent de 20 % ---------- */
const Graphique: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const offres = [{ n: 'FLASH', p: 59, q: 47 }, { n: 'VITRINE', p: 190, q: 152 }, { n: 'LANCEMENT', p: 290, q: 232 }];
  const BASE = 1080, H = 560, W = 230, X0 = 120, G = 70;
  const baisse = interpolate(f, [BEAT * 3.5, BEAT * 5], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pill = spring({ frame: f - BEAT * 5, fps, config: { damping: 10 } });
  return (
    <AbsoluteFill style={BG}>
      <div style={{ position: 'absolute', top: 90, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: BEBAS, fontSize: 120, letterSpacing: 4, ...goldText }}>Offre de lancement</div>
        <div style={{ fontFamily: POP, fontWeight: 600, fontSize: 38, color: '#d9ccff' }}>sur nos 3 formules vidéo</div>
      </div>
      <svg width="1080" height="1350" viewBox="0 0 1080 1350" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="barre" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff1b8" /><stop offset=".35" stopColor="#f2c94c" /><stop offset="1" stopColor="#a66d14" />
          </linearGradient>
        </defs>
        <line x1={80} x2={1000} y1={BASE} y2={BASE} stroke="rgba(217,204,255,.5)" strokeWidth={4} />
        {offres.map((o, i) => {
          const s = spring({ frame: f - 4 - i * (BEAT / 2), fps, config: { damping: 13 } });
          const hPlein = (o.p / 290) * H * s;
          const h = hPlein * (1 - 0.2 * baisse);
          const x = X0 + i * (W + G);
          const barre = interpolate(baisse, [0.1, 0.6], [0, 1], clamp);
          return (
            <g key={o.n}>
              <rect x={x} y={BASE - hPlein} width={W} height={hPlein - h} rx={14} fill="none" stroke={V} strokeWidth={4} strokeDasharray="12 10" opacity={baisse} />
              <rect x={x} y={BASE - h} width={W} height={h} rx={16} fill="url(#barre)" />
              <text x={x + W / 2} y={BASE + 56} textAnchor="middle" fontFamily="Poppins" fontWeight={800} fontSize={34} fill={BLANC}>{o.n}</text>
              <g opacity={s}>
                <text x={x + W / 2} y={BASE - hPlein - 70 * baisse - 20} textAnchor="middle" fontFamily="Bebas Neue" fontSize={baisse > 0 ? 56 : 70}
                  fill={baisse > 0 ? '#a99bd0' : BLANC}>{Math.round(o.p * Math.min(1, s))} €</text>
                <line x1={x + W / 2 - 60} x2={x + W / 2 - 60 + 120 * barre} y1={BASE - hPlein - 70 * baisse - 38} y2={BASE - hPlein - 70 * baisse - 38} stroke="#ff5a7a" strokeWidth={6} />
              </g>
              <text x={x + W / 2} y={BASE - h - 22} textAnchor="middle" fontFamily="Bebas Neue" fontSize={86} fill={OR_CLAIR} opacity={interpolate(baisse, [0.6, 1], [0, 1], clamp)}>
                {o.q} €
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{
        position: 'absolute', right: 80, top: 330, background: V2, border: `4px solid ${OR}`, color: BLANC, fontFamily: BEBAS, fontSize: 90,
        padding: '4px 34px', borderRadius: 999, transform: `scale(${pill}) rotate(-8deg)`, boxShadow: '0 10px 30px rgba(0,0,0,.5)',
      }}>–20 %</div>
    </AbsoluteFill>
  );
};

/* ---------- 9. Tampon « Offre de lancement » + confettis ---------- */
const Tampon: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = BEAT * 1.4;
  const s = spring({ frame: f - d, fps, config: { damping: 9, mass: 1.1 } });
  const scale = 2.6 - 1.6 * s;
  const hit = d + 7;
  const shake = f >= hit && f < hit + 12 ? Math.sin(f * 3) * (hit + 12 - f) * 0.9 : 0;
  const couleurs = [OR, OR_CLAIR, V, '#c4b5fd', '#ffffff', '#a66d14'];
  return (
    <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px)`, backgroundColor: NUIT }}>
      <Photo n="sushi.jpg" pos="50% 55%" filter="brightness(.7)" />
      {f >= hit && Array.from({ length: 60 }).map((_, i) => {
        const a = (i / 60) * Math.PI * 2 + i;
        const t = (f - hit) / fps;
        const sp = 700 + (i % 7) * 100;
        return <div key={i} style={{
          position: 'absolute', left: 540 + Math.cos(a) * sp * t, top: 640 + Math.sin(a) * sp * t + 900 * t * t, width: 20, height: 11,
          background: couleurs[i % couleurs.length], transform: `rotate(${f * 20 + i * 30}deg)`,
          opacity: interpolate(t, [0, 1.8], [1, 0], clamp),
        }} />;
      })}
      <div style={{
        position: 'absolute', left: 540 - 250, top: 640 - 250, width: 500, height: 500, borderRadius: '50%',
        border: `16px solid ${OR}`, outline: `5px solid ${OR_CLAIR}`, outlineOffset: -34, background: 'rgba(109,40,217,.94)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        transform: `scale(${scale}) rotate(${-12 + (1 - s) * 30}deg)`, opacity: Math.min(1, s * 2), boxShadow: '0 20px 50px rgba(0,0,0,.55)',
      }}>
        <div style={{ fontFamily: POP, fontWeight: 800, fontSize: 40, color: BLANC, letterSpacing: 4 }}>OFFRE DE</div>
        <div style={{ fontFamily: BEBAS, fontSize: 96, lineHeight: 0.95, letterSpacing: 3, ...goldText }}>LANCEMENT</div>
        <div style={{ fontFamily: BEBAS, fontSize: 130, lineHeight: 1, color: BLANC }}>–20 %</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 15. Bandeau promo + compte à rebours vers le 31/01/2027 ---------- */
const Bandeau: React.FC = () => {
  const f = useCurrentFrame();
  const x = interpolate(f, [2, 18], [-1400, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const reflet = interpolate(f, [22, 46], [-30, 130], clamp);
  return (
    <div style={{
      position: 'absolute', top: 170, left: -80, right: -80, height: 180, transform: `translateX(${x}px) rotate(-6deg)`,
      background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 18px 40px rgba(0,0,0,.45)', overflow: 'hidden',
      borderTop: `6px solid ${V2}`, borderBottom: `6px solid ${V2}`,
    }}>
      <div style={{ fontFamily: BEBAS, fontSize: 84, color: '#1a0f33', letterSpacing: 3, whiteSpace: 'nowrap' }}>–20 % sur toutes les formules</div>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${reflet - 12}%, rgba(255,255,255,.6) ${reflet}%, transparent ${reflet + 12}%)` }} />
    </div>
  );
};
const Tuile: React.FC<{ final: string; label: string; stop: number; w?: number }> = ({ final, label, stop, w = 200 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const roule = f < stop;
  const val = roule ? String(Math.floor(Math.abs(Math.sin(f * 1.7 + stop) * 10 ** final.length)) % 10 ** final.length).padStart(final.length, '0') : final;
  const pop = spring({ frame: f - stop, fps, config: { damping: 9 } });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: w, height: 220, borderRadius: 22, background: 'rgba(18,11,34,.9)', border: `4px solid ${roule ? V : OR}`,
        fontFamily: BEBAS, fontSize: 170, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${roule ? 1 : 0.9 + 0.1 * pop})`, boxShadow: roule ? 'none' : `0 0 40px rgba(242,201,76,.5)`,
        ...(roule ? { color: '#c4b5fd' } : goldText),
      }}>{val}</div>
      <div style={{ fontFamily: POP, fontWeight: 800, fontSize: 30, color: BLANC, letterSpacing: 4, textShadow: '0 2px 10px rgba(0,0,0,.8)' }}>{label}</div>
    </div>
  );
};
const Promo: React.FC = () => {
  const f = useCurrentFrame();
  const apparait = interpolate(f, [BEAT * 1.5, BEAT * 2.3], [0, 1], clamp);
  const note = interpolate(f, [BEAT * 6, BEAT * 7], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: NUIT }}>
      <Photo n="cocktails.jpg" pos="50% 40%" filter="brightness(.45) blur(2px)" />
      <CameraMotionBlur shutterAngle={200} samples={8}>
        <AbsoluteFill><Bandeau /></AbsoluteFill>
      </CameraMotionBlur>
      <div style={{ position: 'absolute', top: 520, left: 0, right: 0, textAlign: 'center', opacity: apparait, transform: `translateY(${(1 - apparait) * 40}px)` }}>
        <div style={{ fontFamily: BEBAS, fontSize: 90, color: BLANC, letterSpacing: 4, marginBottom: 34 }}>Jusqu'au</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28 }}>
          <Tuile final="31" label="JOUR" stop={Math.round(BEAT * 4)} />
          <Tuile final="01" label="MOIS" stop={Math.round(BEAT * 5)} />
          <Tuile final="2027" label="ANNÉE" stop={Math.round(BEAT * 6)} w={360} />
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 70, left: 60, right: 60, textAlign: 'center', fontFamily: POP, fontSize: 30, color: '#d9ccff', opacity: note }}>
        Formules Flash, Vitrine et Lancement
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 14. Écriture manuscrite « Zeklair » ---------- */
const Manuscrit: React.FC = () => {
  const f = useCurrentFrame();
  const paths = SIG.paths as string[];
  const lens = useMemo(() => paths.map((d) => getLength(d)), [paths]);
  const total = lens.reduce((a, b) => a + b, 0);
  const prog = interpolate(f, [4, BEAT * 5], [0, total], { ...clamp, easing: Easing.inOut(Easing.sin) });
  let cumul = 0;
  const { x1, x2, y1, y2 } = SIG.bb;
  const w = x2 - x1, h = y2 - y1;
  const sous = interpolate(f, [BEAT * 5, BEAT * 6], [0, 1], clamp);
  const pad = 30;
  return (
    <AbsoluteFill style={{ ...BG, alignItems: 'center', justifyContent: 'center' }}>
      <svg width="960" height={(960 * (h + pad * 2)) / (w + pad * 2)} viewBox={`${x1 - pad} ${y1 - pad} ${w + pad * 2} ${h + pad * 2}`} style={{ marginTop: -120, overflow: 'visible' }}>
        <defs>
          <linearGradient id="sig" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff1b8" /><stop offset=".3" stopColor="#f2c94c" /><stop offset=".6" stopColor="#c8901f" /><stop offset="1" stopColor="#f6d36b" />
          </linearGradient>
        </defs>
        {paths.map((d, i) => {
          const L = lens[i];
          const p = Math.max(0, Math.min(1, (prog - cumul) / L));
          cumul += L;
          return (
            <g key={i}>
              <path d={d} fill="url(#sig)" opacity={interpolate(p, [0.6, 1], [0, 1], clamp)} />
              <path d={d} fill="none" stroke={OR_CLAIR} strokeWidth={1.6} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} />
            </g>
          );
        })}
      </svg>
      <div style={{ position: 'absolute', top: 860, fontFamily: POP, fontStyle: 'italic', fontSize: 56, color: BLANC, opacity: sous, transform: `translateY(${(1 - sous) * 20}px)` }}>
        Vos photos prennent vie.
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Montage ---------- */
type Scene = { C: React.FC; titre: string; pastille?: boolean };
export const VIDEO1: Scene[] = [
  { C: () => <LogoReflet />, titre: 'Votre logo, en lumière' },
  { C: AvantApres, titre: 'Votre photo devient un personnage', pastille: true },
  { C: Orbite, titre: 'Votre mascotte, votre marque', pastille: true },
  { C: Typo, titre: 'Des messages qui marquent' },
  { C: Particules, titre: 'Des effets qui font briller' },
  { C: Iris, titre: 'Des transitions de cinéma' },
  { C: Mosaique, titre: 'Toute votre carte en une image' },
  { C: Medaille, titre: 'Contactez Zeklair' },
];
export const VIDEO2: Scene[] = [
  { C: Transitions, titre: 'Une vidéo pro pour votre commerce' },
  { C: Carte, titre: 'Partout à La Réunion' },
  { C: Compteur, titre: 'Livrée dès 48 h' },
  { C: Graphique, titre: 'Offre de lancement : –20 %' },
  { C: Tampon, titre: '–20 % sur nos formules' },
  { C: Promo, titre: "Jusqu'au 31 janvier 2027" },
  { C: Manuscrit, titre: 'Vos photos prennent vie.' },
  { C: () => <LogoReflet contact />, titre: 'Contactez Zeklair' },
];

const Musique: React.FC<{ debut: number }> = ({ debut }) => (
  <Audio
    src={src('musique.mp3')}
    trimBefore={Math.round(debut * Z_FPS)}
    volume={(f) => interpolate(f, [0, 8, Z_TOTAL - 40, Z_TOTAL - 2], [0, 0.9, 0.9, 0], clamp)}
  />
);

const Scenes: React.FC<{ scenes: Scene[]; pastilles: boolean }> = ({ scenes, pastilles }) => (
  <>
    {scenes.map((s, i) => (
      <Sequence key={i} from={bornes[i]} durationInFrames={bornes[i + 1] - bornes[i]}>
        <s.C />
        {pastilles && s.pastille && <Pastille texte={s.titre} />}
      </Sequence>
    ))}
  </>
);

// Panneau de droite pour la version 16:9
const Legende: React.FC<{ texte: string; n: number }> = ({ texte, n }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 2, fps, config: { damping: 200 } });
  return (
    <div style={{ position: 'absolute', left: 90, right: 80, top: 330, opacity: s, transform: `translateX(${(1 - s) * 60}px)` }}>
      <div style={{ fontFamily: POP, fontWeight: 800, fontSize: 30, color: V, letterSpacing: 6 }}>{String(n).padStart(2, '0')} / 08</div>
      <div style={{ fontFamily: BEBAS, fontSize: 124, lineHeight: 1.02, color: BLANC, letterSpacing: 2, marginTop: 10 }}>{texte}</div>
    </div>
  );
};
const Panneau: React.FC<{ scenes: Scene[]; offre: boolean }> = ({ scenes, offre }) => (
  <AbsoluteFill style={{ left: 864, width: 1056, ...BG, borderLeft: `6px solid ${OR}` }}>
    <div style={{ position: 'absolute', left: 90, top: 80, display: 'flex', alignItems: 'center', gap: 22 }}>
      <Img src={src('logo-z.svg')} style={{ height: 110, width: 89 }} />
      <div style={{ fontFamily: BEBAS, fontSize: 92, letterSpacing: 6, ...goldText }}>ZEKLAIR</div>
    </div>
    {scenes.map((s, i) => (
      <Sequence key={i} from={bornes[i]} durationInFrames={bornes[i + 1] - bornes[i]}>
        <Legende texte={s.titre} n={i + 1} />
      </Sequence>
    ))}
    <div style={{ position: 'absolute', left: 90, right: 80, bottom: 80 }}>
      {offre && (
        <div style={{
          display: 'inline-block', background: V2, color: BLANC, fontFamily: POP, fontWeight: 800, fontSize: 32, padding: '10px 26px',
          borderRadius: 999, border: `3px solid ${OR}`, marginBottom: 26,
        }}>–20 % jusqu'au 31/01/2027</div>
      )}
      <div style={{ fontFamily: POP, fontStyle: 'italic', fontSize: 40, color: '#d9ccff' }}>Vos photos prennent vie.</div>
      <div style={{ fontFamily: POP, fontWeight: 600, fontSize: 34, color: OR, marginTop: 8 }}>{TEL} · {MAIL}</div>
    </div>
  </AbsoluteFill>
);

export const ZeklairPub: React.FC<{ video: 1 | 2; format: '4x5' | '16x9' }> = ({ video, format }) => {
  const scenes = video === 1 ? VIDEO1 : VIDEO2;
  const debut = video === 1 ? 11.14 : 92.29; // le refrain tombe sur la 2e scène
  if (format === '4x5') {
    return (
      <AbsoluteFill style={{ backgroundColor: NUIT }}>
        <Scenes scenes={scenes} pastilles />
        <Musique debut={debut} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ backgroundColor: NUIT }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1350, transform: 'scale(0.8)', transformOrigin: '0 0', overflow: 'hidden' }}>
        <Scenes scenes={scenes} pastilles={false} />
      </div>
      <Panneau scenes={scenes} offre={video === 2} />
      <Musique debut={debut} />
    </AbsoluteFill>
  );
};
