import React, { useEffect, useMemo, useState } from 'react';
import {
  AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing,
  delayRender, continueRender,
} from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { flip } from '@remotion/transitions/flip';
import { wipe } from '@remotion/transitions/wipe';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { noise2D } from '@remotion/noise';
import { getLength } from '@remotion/paths';
import * as THREE from 'three';
import { C } from './Stoi';
import { EFFET_DUREE } from './Effets';
import SIG from './signature.json';

// Catalogue d'effets STOI — série 2 (effets 10 à 15), même format que la série 1.
const SERIF = 'Cinzel, serif';
const SANS = 'Mulish, sans-serif';
const ITALIC = '"Playfair Display", serif';
const img = (n: string) => staticFile(`scenes/${n}.jpg`);
const fond = { background: `radial-gradient(circle at 50% 40%, ${C.paper} 0%, ${C.cream} 55%, #ead9b8 100%)` };
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const Label: React.FC<{ n: number; titre: string }> = ({ n, titre }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - 2, fps, config: { damping: 200 } });
  return (
    <div style={{
      position: 'absolute', left: 40, bottom: 40, zIndex: 50, display: 'flex', alignItems: 'center', gap: 14,
      opacity: p, transform: `translateX(${(1 - p) * -40}px)`,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 32, background: C.gold, color: C.night, fontFamily: SANS, fontWeight: 800,
        fontSize: n > 9 ? 28 : 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{n}</div>
      <div style={{
        background: 'rgba(20,17,12,.75)', color: C.cream, fontFamily: SANS, fontWeight: 800, fontSize: 34,
        padding: '10px 24px', borderRadius: 14,
      }}>{titre}</div>
    </div>
  );
};

/* 10. Médaille 3D : l'emblème frappé sur une pièce dorée qui tourne, éclairée */
export const Piece3D: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [handle] = useState(() => delayRender('Texture emblème'));
  useEffect(() => {
    // l'emblème est détouré : on le pose sur un fond ivoire pour la face de la pièce
    const im = new Image();
    im.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 1024;
      const g = cv.getContext('2d')!;
      const grad = g.createRadialGradient(512, 512, 80, 512, 512, 520);
      grad.addColorStop(0, '#fffaf0'); grad.addColorStop(1, '#ead9b8');
      g.fillStyle = grad; g.fillRect(0, 0, 1024, 1024);
      const k = 0.8 * Math.min(1024 / im.width, 1024 / im.height);
      g.drawImage(im, 512 - (im.width * k) / 2, 512 - (im.height * k) / 2, im.width * k, im.height * k);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      setTex(t);
      continueRender(handle);
    };
    im.onerror = () => continueRender(handle);
    im.src = staticFile('emblem-stoi.avif');
  }, [handle]);
  const entree = spring({ frame: f, fps, config: { damping: 14 } });
  const rotY = interpolate(f, [0, EFFET_DUREE], [-Math.PI * 1.15, Math.PI * 0.9], { easing: Easing.inOut(Easing.cubic) });
  const camZ = interpolate(f, [0, EFFET_DUREE], [12.5, 9.5]);
  const lumiere = interpolate(f, [0, EFFET_DUREE], [-4, 4]);
  const mats = useMemo(() => {
    if (!tex) return null;
    const bord = new THREE.MeshStandardMaterial({ color: '#c9a14a', metalness: 0.75, roughness: 0.28 });
    const face = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, metalness: 0.1, roughness: 0.5 });
    return [bord, face, face];
  }, [tex]);
  return (
    <AbsoluteFill style={fond}>
      {/* ombre au sol */}
      <div style={{
        position: 'absolute', left: 540 - 260, top: 1010, width: 520, height: 70, borderRadius: '50%',
        background: 'radial-gradient(closest-side, rgba(60,40,10,.35), transparent)', transform: `scaleX(${0.6 + 0.4 * Math.abs(Math.cos(rotY))})`,
      }} />
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0.4, camZ], fov: 40 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[lumiere, 3, 5]} intensity={2.2} color="#fff4d6" />
        <pointLight position={[-3, -2, 4]} intensity={18} color="#ebcf86" />
        {mats && (
          <group scale={entree} rotation={[0.12, rotY, 0]} position={[0, 0.35 + Math.sin(f / 14) * 0.08, 0]}>
            {/* cylindre couché face caméra : les faces haut/bas deviennent avant/arrière */}
            <mesh rotation={[Math.PI / 2, 0, 0]} material={mats}>
              <cylinderGeometry args={[2, 2, 0.32, 96, 1]} />
            </mesh>
            <mesh rotation={[0, 0, 0]}>
              <torusGeometry args={[2.0, 0.07, 16, 120]} />
              <meshStandardMaterial color="#ebcf86" metalness={0.8} roughness={0.25} />
            </mesh>
          </group>
        )}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

/* 11. Transitions pro : glissement, volet, page retournée */
const Plan: React.FC<{ n: string; titre: string }> = ({ n, titre }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Img src={img(n)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.08 - f / 900})` }} />
      <div style={{
        position: 'absolute', top: 70, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontSize: 64, color: C.paper,
        textShadow: '0 4px 18px rgba(0,0,0,.55)',
      }}>{titre}</div>
    </AbsoluteFill>
  );
};
const Transitions: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.night }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={36}><Plan n="volcan" titre="Le volcan" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: 'from-right' })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 16 })} />
      <TransitionSeries.Sequence durationInFrames={36}><Plan n="lagon" titre="Le lagon" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: 'from-top-left' })} timing={linearTiming({ durationInFrames: 16 })} />
      <TransitionSeries.Sequence durationInFrames={36}><Plan n="vanille" titre="La vanille" /></TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={flip({ direction: 'from-left' })} timing={linearTiming({ durationInFrames: 18 })} />
      <TransitionSeries.Sequence durationInFrames={47}><Plan n="curcuma" titre="Le curcuma" /></TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);

/* 12. Pluie de fleurs de vanille et poussière d'or */
const Fleur: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100">
    {[0, 1, 2, 3, 4].map((i) => (
      <ellipse key={i} cx="0" cy="-22" rx="13" ry="25" fill="#fbf3cf" stroke="#e2c86c" strokeWidth="2" transform={`rotate(${i * 72})`} />
    ))}
    <circle r="9" fill={C.curcuma} />
  </svg>
);
const Particules: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 30;
  const titre = interpolate(f, [10, 30], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img src={img('vanille')} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.72) saturate(1.1)' }} />
      {/* poussière d'or */}
      {Array.from({ length: 70 }).map((_, i) => {
        const x = ((i * 157) % 1080) + noise2D('dx', i, t * 0.4) * 60;
        const y = 1350 - (((i * 89) % 1350) + t * (40 + (i % 5) * 18)) % 1400;
        const s = 3 + (i % 4) * 2;
        const scint = 0.4 + 0.6 * Math.abs(Math.sin(t * 4 + i));
        return <div key={`o${i}`} style={{
          position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: C.goldHi,
          boxShadow: `0 0 ${s * 3}px ${C.goldHi}`, opacity: scint,
        }} />;
      })}
      {/* fleurs qui tombent en tourbillonnant */}
      {Array.from({ length: 22 }).map((_, i) => {
        const d = 20 + (i % 3) * 16;
        const vit = 210 + (i % 4) * 70;
        const y = -120 + ((t * vit + i * 173) % 1550);
        const x = ((i * 211) % 1000) + noise2D('fx', i, t * 0.5) * 120;
        const rot = t * (60 + i * 7) * (i % 2 ? 1 : -1);
        return <div key={`f${i}`} style={{
          position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) rotateX(${Math.sin(t * 2 + i) * 50}deg)`,
          opacity: interpolate(f, [0, 8], [0, 0.95], clamp),
        }}><Fleur size={d * 3} /></div>;
      })}
      <div style={{
        position: 'absolute', top: 520, left: 0, right: 0, textAlign: 'center', opacity: titre,
        transform: `translateY(${(1 - titre) * 30}px)`,
      }}>
        <div style={{ fontFamily: ITALIC, fontStyle: 'italic', fontWeight: 700, fontSize: 110, color: C.goldHi, textShadow: '0 6px 24px rgba(0,0,0,.6)' }}>La saison</div>
        <div style={{ fontFamily: SERIF, fontSize: 72, color: C.paper, textShadow: '0 6px 24px rgba(0,0,0,.6)' }}>de la vanille</div>
      </div>
    </AbsoluteFill>
  );
};

/* 13. Graphique animé : barres qui montent + courbe */
const Graphique: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
  const val = [32, 45, 41, 60, 74, 92];
  const X0 = 140, W = 130, G = 18, BASE = 1040, H = 560;
  const pts = val.map((v, i) => [X0 + i * (W + G) + W / 2, BASE - (v / 100) * H] as const);
  const courbe = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1] - 40}`).join(' ');
  const len = getLength(courbe);
  const trace = interpolate(f, [45, 85], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  return (
    <AbsoluteFill style={fond}>
      <div style={{ position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: SERIF, fontSize: 62, color: C.ink }}>Commandes en ligne</div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, color: C.gold, marginTop: 8 }}>Données d'exemple</div>
      </div>
      <svg width="1080" height="1350" viewBox="0 0 1080 1350" style={{ position: 'absolute', inset: 0 }}>
        {[0, 25, 50, 75, 100].map((g) => (
          <line key={g} x1={110} x2={1000} y1={BASE - (g / 100) * H} y2={BASE - (g / 100) * H} stroke="#d9c7a0" strokeWidth={g ? 2 : 4} />
        ))}
        {val.map((v, i) => {
          const s = spring({ frame: f - 6 - i * 5, fps, config: { damping: 13 } });
          const h = (v / 100) * H * s;
          const x = X0 + i * (W + G);
          return (
            <g key={i}>
              <rect x={x} y={BASE - h} width={W} height={h} rx={14} fill={i === val.length - 1 ? C.curcuma : C.leaf} />
              <text x={x + W / 2} y={BASE - h - 18} textAnchor="middle" fontFamily="Mulish" fontWeight={800} fontSize={34} fill={C.ink} opacity={s}>
                {Math.round(v * s)}
              </text>
              <text x={x + W / 2} y={BASE + 50} textAnchor="middle" fontFamily="Mulish" fontWeight={600} fontSize={30} fill={C.ink}>{mois[i]}</text>
            </g>
          );
        })}
        <path d={courbe} fill="none" stroke={C.lagoon} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={len} strokeDashoffset={len * (1 - trace)} />
        {trace > 0.98 && (
          <g transform={`translate(${pts[5][0]} ${pts[5][1] - 40})`}>
            <circle r={16} fill={C.lagoon} stroke={C.paper} strokeWidth={5} />
          </g>
        )}
      </svg>
      <div style={{
        position: 'absolute', right: 70, top: 300, background: C.leaf, color: C.paper, fontFamily: SANS, fontWeight: 800, fontSize: 40,
        padding: '12px 26px', borderRadius: 999, opacity: interpolate(f, [80, 92], [0, 1], clamp),
        transform: `scale(${interpolate(f, [80, 92], [0.6, 1], { ...clamp, easing: Easing.out(Easing.back(2)) })})`,
      }}>+ 188 %</div>
    </AbsoluteFill>
  );
};

/* 14. Écriture manuscrite qui se trace */
const Signature: React.FC = () => {
  const f = useCurrentFrame();
  const paths = SIG.paths as string[];
  const lens = useMemo(() => paths.map((d) => getLength(d)), [paths]);
  const total = lens.reduce((a, b) => a + b, 0);
  const prog = interpolate(f, [6, 72], [0, total], { ...clamp, easing: Easing.inOut(Easing.sin) });
  let cumul = 0;
  const w = SIG.bb.x2 - SIG.bb.x1;
  const sous = interpolate(f, [70, 88], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ ...fond, alignItems: 'center', justifyContent: 'center' }}>
      <svg width="1080" height="400" viewBox={`${SIG.bb.x1 - (1180 - w) / 2} -250 1180 437`}>
        {paths.map((d, i) => {
          const L = lens[i];
          const p = Math.max(0, Math.min(1, (prog - cumul) / L));
          cumul += L;
          return (
            <g key={i}>
              <path d={d} fill={C.ink} opacity={interpolate(p, [0.6, 1], [0, 1], clamp)} />
              <path d={d} fill="none" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} />
            </g>
          );
        })}
      </svg>
      <div style={{ position: 'absolute', top: 780, fontFamily: SERIF, fontSize: 44, color: C.gold, letterSpacing: 4, opacity: sous }}>DE L'OCÉAN INDIEN</div>
    </AbsoluteFill>
  );
};

/* 15. Bandeau promo (avec flou de mouvement) + compte à rebours */
const Bandeau: React.FC = () => {
  const f = useCurrentFrame();
  const x = interpolate(f, [4, 22], [-1300, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const reflet = interpolate(f, [26, 50], [-30, 130], clamp);
  return (
    <div style={{
      position: 'absolute', top: 210, left: -80, right: -80, height: 190, transform: `translateX(${x}px) rotate(-6deg)`,
      background: `linear-gradient(90deg, #b5361f, #d9532e)`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 18px 40px rgba(0,0,0,.35)', overflow: 'hidden',
    }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 70, color: C.paper, letterSpacing: 2, whiteSpace: 'nowrap' }}>– 20 % SUR LES COFFRETS</div>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${reflet - 12}%, rgba(255,255,255,.5) ${reflet}%, transparent ${reflet + 12}%)` }} />
    </div>
  );
};
const Chiffre: React.FC<{ v: number; label: string }> = ({ v, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
    <div style={{
      width: 180, height: 200, borderRadius: 20, background: C.night, color: C.goldHi, fontFamily: SERIF, fontSize: 120,
      display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 -6px 0 rgba(255,255,255,.06)',
    }}>{String(v).padStart(2, '0')}</div>
    <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 28, color: C.ink, letterSpacing: 3 }}>{label}</div>
  </div>
);
const Promo: React.FC = () => {
  const f = useCurrentFrame();
  // compte à rebours accéléré pour la démo : 1 seconde affichée par image
  const restant = 3 * 86400 + 4 * 3600 + 12 * 60 + 30 - Math.max(0, f - 30) * 1;
  const j = Math.floor(restant / 86400), h = Math.floor((restant % 86400) / 3600), m = Math.floor((restant % 3600) / 60), s = restant % 60;
  const apparait = interpolate(f, [24, 40], [0, 1], clamp);
  return (
    <AbsoluteFill style={fond}>
      <CameraMotionBlur shutterAngle={200} samples={8}>
        <AbsoluteFill><Bandeau /></AbsoluteFill>
      </CameraMotionBlur>
      <div style={{ position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center', opacity: apparait, transform: `translateY(${(1 - apparait) * 40}px)` }}>
        <div style={{ fontFamily: SERIF, fontSize: 52, color: C.ink, marginBottom: 40 }}>Fin de l'offre dans</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 26 }}>
          <Chiffre v={j} label="JOURS" />
          <Chiffre v={h} label="HEURES" />
          <Chiffre v={m} label="MIN" />
          <Chiffre v={s} label="SEC" />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EFFETS2: { titre: string; C: React.FC }[] = [
  { titre: 'Médaille 3D', C: Piece3D },
  { titre: 'Transitions pro', C: Transitions },
  { titre: 'Pluie de fleurs et poussière d\'or', C: Particules },
  { titre: 'Graphique animé', C: Graphique },
  { titre: 'Écriture manuscrite', C: Signature },
  { titre: 'Bandeau promo + compte à rebours', C: Promo },
];
export const EFFETS2_TOTAL = EFFETS2.length * EFFET_DUREE;

export const Effets2: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.night }}>
    {EFFETS2.map((e, i) => (
      <Sequence key={i} from={i * EFFET_DUREE} durationInFrames={EFFET_DUREE}>
        <e.C />
        <Label n={i + 10} titre={e.titre} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
