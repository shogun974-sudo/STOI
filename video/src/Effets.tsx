import React from 'react';
import {
  AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing,
} from 'remotion';
import { evolvePath, getLength, getPointAtLength } from '@remotion/paths';
import { Vani } from './Vani';
import { C } from './Stoi';

// Catalogue d'effets visuels STOI : une démonstration par effet, enchaînées.
export const EFFET_DUREE = 105; // 3,5 s par effet
const SERIF = 'Cinzel, serif';
const SANS = 'Mulish, sans-serif';
const ITALIC = '"Playfair Display", serif';
const img = (n: string) => staticFile(`scenes/${n}.jpg`);

const fond = { background: `radial-gradient(circle at 50% 40%, ${C.paper} 0%, ${C.cream} 55%, #ead9b8 100%)` };

// Étiquette numérotée de l'effet
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
        fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{n}</div>
      <div style={{
        background: 'rgba(20,17,12,.75)', color: C.cream, fontFamily: SANS, fontWeight: 800, fontSize: 34,
        padding: '10px 24px', borderRadius: 14,
      }}>{titre}</div>
    </div>
  );
};

/* 1. Logo qui s'assemble avec reflet doré */
const LogoReflet: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 11, mass: 0.9 } });
  const sweep = interpolate(f, [25, 70], [-60, 160], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const src = staticFile('logo-stoi.avif');
  const mask = { WebkitMaskImage: `url(${src})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' } as React.CSSProperties;
  return (
    <AbsoluteFill style={{ ...fond, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: 620, height: 680, transform: `scale(${s}) rotate(${(1 - s) * -12}deg)`, opacity: Math.min(1, s * 1.3) }}>
        <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        <div style={{
          position: 'absolute', inset: 0, ...mask,
          background: `linear-gradient(105deg, transparent ${sweep - 18}%, rgba(255,250,225,.95) ${sweep}%, transparent ${sweep + 18}%)`,
          mixBlendMode: 'screen',
        }} />
      </div>
    </AbsoluteFill>
  );
};

/* 2. Orbite du logo (résumé de la démo complète) */
const OrbiteMini: React.FC = () => {
  const f = useCurrentFrame();
  const a = (f / EFFET_DUREE) * Math.PI * 2 * 1.3 - Math.PI / 2;
  const front = Math.sin(a) > 0;
  const size = 240 * (0.85 + 0.15 * (Math.sin(a) + 1) / 2);
  const logo = (
    <Img src={staticFile('emblem-stoi.avif')} style={{
      position: 'absolute', left: 540 + Math.cos(a) * 360 - size / 2, top: 660 + Math.sin(a) * 110 - size / 2,
      width: size, height: size, objectFit: 'contain', transform: `scaleX(${0.35 + 0.65 * Math.abs(Math.cos(f / 8))})`,
      filter: front ? 'drop-shadow(0 10px 18px rgba(0,0,0,.3))' : 'blur(.6px)', zIndex: front ? 3 : 1,
    }} />
  );
  return (
    <AbsoluteFill style={fond}>
      {!front && logo}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}><Vani x={540} y={880} scale={1.05} wave /></div>
      {front && logo}
    </AbsoluteFill>
  );
};

/* 3. Avant / après : photo réelle -> illustration */
const AvantApres: React.FC = () => {
  const f = useCurrentFrame();
  const x = interpolate(f, [10, 45, 70, 95], [100, 15, 60, 50], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ backgroundColor: C.night }}>
      <Img src={staticFile('photos/vanille-gousses.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${x}%)` }}>
        <Img src={img('vanille')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${x}%`, width: 6, marginLeft: -3, background: C.paper, boxShadow: '0 0 20px rgba(0,0,0,.5)' }}>
        <div style={{
          position: 'absolute', top: '50%', left: -32, width: 70, height: 70, marginTop: -35, borderRadius: 35, background: C.paper,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, color: C.ink, fontWeight: 800, fontFamily: SANS,
        }}>⇆</div>
      </div>
      {[['PHOTO', 40, 'left'], ['ILLUSTRATION', 40, 'right']].map(([t, top, side]) => (
        <div key={t as string} style={{
          position: 'absolute', top: top as number, [side as string]: 40, background: 'rgba(20,17,12,.7)', color: C.cream,
          fontFamily: SANS, fontWeight: 800, fontSize: 30, padding: '8px 18px', borderRadius: 10, letterSpacing: 2,
        }}>{t as string}</div>
      ))}
    </AbsoluteFill>
  );
};

/* 4. Carte animée : trajet entre les îles */
const Carte: React.FC = () => {
  const f = useCurrentFrame();
  const route = 'M 790 760 C 650 640, 480 470, 330 330';
  const p = interpolate(f, [12, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });
  const ev = evolvePath(p, route);
  const pt = getPointAtLength(route, getLength(route) * p);
  const pin = (x: number, y: number, label: string, delay: number, dx = 30) => {
    const s = interpolate(f, [delay, delay + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2)) });
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <circle r="16" fill={C.curcuma} stroke={C.paper} strokeWidth="5" />
        <text x={dx} y="10" fontFamily="Mulish" fontWeight={800} fontSize="34" fill={C.paper} stroke={C.night} strokeWidth="6" paintOrder="stroke">{label}</text>
      </g>
    );
  };
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 60% 50%, #2a8f9b 0%, ${C.lagoon} 60%, #124a52 100%)` }}>
      <svg viewBox="0 0 1080 1350" width="1080" height="1350">
        {/* vagues */}
        {Array.from({ length: 9 }).map((_, i) => (
          <path key={i} d={`M 0 ${150 * i + 40 + Math.sin(f / 15 + i) * 6} q 60 -16 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0`} stroke="rgba(255,255,255,.08)" strokeWidth="4" fill="none" />
        ))}
        {/* Madagascar (stylisée) */}
        <path d="M 330 300 C 380 330 400 420 390 540 C 380 700 330 880 260 1040 C 230 1100 170 1110 160 1040 C 150 900 190 760 220 620 C 250 480 270 360 330 300 Z" fill="#7da35a" stroke="#cfe0a8" strokeWidth="5" />
        {/* La Réunion et Maurice */}
        <ellipse cx="800" cy="770" rx="42" ry="34" fill="#7da35a" stroke="#cfe0a8" strokeWidth="5" />
        <ellipse cx="900" cy="690" rx="26" ry="32" fill="#7da35a" stroke="#cfe0a8" strokeWidth="5" />
        <path d={route} stroke={C.goldHi} strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
        {pin(800, 770, 'La Réunion', 4, 34)}
        {pin(330, 330, 'Diego Suarez', 80, 26)}
        <text x="70" y="140" fontFamily="Cinzel" fontWeight={600} fontSize="54" fill={C.paper}>Océan Indien</text>
      </svg>
      <div style={{ position: 'absolute', left: pt.x - 45, top: pt.y - 70, transform: `rotate(-30deg)` }}>
        <svg width="90" height="60" viewBox="0 0 90 60">
          <path d="M5 30 Q45 52 85 30 L75 40 Q45 56 15 40 Z" fill={C.gold} stroke={C.night} strokeWidth="3" />
          <path d="M45 30 L45 4 L66 26 Z" fill={C.paper} stroke={C.night} strokeWidth="2" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/* 5. Compteur animé (chiffre clé) */
const Compteur: React.FC = () => {
  const f = useCurrentFrame();
  const v = interpolate(f, [8, 65], [0, 80], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const r = 230;
  const circ = 2 * Math.PI * r;
  return (
    <AbsoluteFill style={{ ...fond, alignItems: 'center', justifyContent: 'center' }}>
      <svg width="600" height="600" viewBox="0 0 600 600" style={{ position: 'absolute', top: 260 }}>
        <circle cx="300" cy="300" r={r} stroke="#e3d2ad" strokeWidth="36" fill="none" />
        <circle cx="300" cy="300" r={r} stroke={C.leaf} strokeWidth="36" fill="none" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - v / 100)} transform="rotate(-90 300 300)" />
      </svg>
      <div style={{ position: 'absolute', top: 470, width: '100%', textAlign: 'center', fontFamily: SERIF, fontSize: 150, color: C.ink }}>
        {Math.round(v)}<span style={{ fontSize: 80 }}> %</span>
      </div>
      <div style={{
        position: 'absolute', top: 920, left: 90, right: 90, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 40,
        color: C.ink, opacity: interpolate(f, [50, 65], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      }}>des producteurs de vanille de l'île travaillent avec ProVanille</div>
    </AbsoluteFill>
  );
};

/* 6. Typographie animée */
const Typo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mots = ['Des', 'terroirs', "d'exception,", 'un', 'avenir', 'partagé.'];
  const accent = [1, 4];
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 900, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px 26px' }}>
        {mots.map((m, i) => {
          const s = spring({ frame: f - 6 - i * 9, fps, config: { damping: 10, mass: 0.6 } });
          return (
            <span key={i} style={{
              display: 'inline-block', fontFamily: accent.includes(i) ? ITALIC : SERIF, fontStyle: accent.includes(i) ? 'italic' : 'normal',
              fontWeight: 700, fontSize: 104, color: accent.includes(i) ? C.goldHi : C.cream, opacity: Math.min(1, s * 1.5),
              transform: `translateY(${(1 - s) * 80}px) rotate(${(1 - s) * (i % 2 ? 8 : -8)}deg)`,
            }}>{m}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* 7. Transition « iris » entre deux scènes */
const Iris: React.FC = () => {
  const f = useCurrentFrame();
  const r = interpolate(f, [30, 75], [0, 120], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Img src={img('volcan')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, clipPath: `circle(${r}% at 50% 70%)` }}>
        <Img src={img('lagon')} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.15 - r / 1200})` }} />
      </div>
      <div style={{
        position: 'absolute', left: '50%', top: '70%', width: `${r * 2.6}%`, aspectRatio: '1', transform: 'translate(-50%,-50%)',
        borderRadius: '50%', border: `10px solid ${C.goldHi}`, opacity: r > 0 && r < 118 ? 0.9 : 0,
      }} />
    </AbsoluteFill>
  );
};

/* 8. Mosaïque : tuiles qui se retournent */
const Mosaique: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const imgs = ['volcan', 'lagon', 'curcuma', 'cambourg', 'majihy', 'vanille'];
  const zoom = interpolate(f, [70, 100], [1, 2.05], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 30, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', gap: 18,
        transform: `scale(${zoom})`, transformOrigin: '25% 50%',
      }}>
        {imgs.map((n, i) => {
          const s = spring({ frame: f - 4 - i * 6, fps, config: { damping: 14 } });
          return (
            <div key={n} style={{ perspective: 1200 }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: 18, overflow: 'hidden', transform: `rotateY(${(1 - s) * 180}deg)`,
                backfaceVisibility: 'hidden', boxShadow: '0 10px 24px rgba(0,0,0,.4)',
              }}>
                <Img src={img(n)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* 9. Tampon « Producteur à la une » + confettis */
const Tampon: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 15, fps, config: { damping: 9, mass: 1.1 } });
  const scale = 2.6 - 1.6 * s;
  const hit = f >= 22;
  const shake = hit && f < 34 ? Math.sin(f * 3) * (34 - f) * 0.8 : 0;
  const couleurs = [C.gold, C.curcuma, C.lagoon, C.leaf, C.goldHi, '#c0392b'];
  return (
    <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
      <Img src={img('curcuma')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.8)' }} />
      {hit && Array.from({ length: 46 }).map((_, i) => {
        const a = (i / 46) * Math.PI * 2 + i;
        const t = (f - 22) / fps;
        const sp = 700 + (i % 7) * 90;
        const x = 540 + Math.cos(a) * sp * t;
        const y = 640 + Math.sin(a) * sp * t + 900 * t * t;
        return <div key={i} style={{
          position: 'absolute', left: x, top: y, width: 18, height: 10, background: couleurs[i % couleurs.length],
          transform: `rotate(${f * 20 + i * 30}deg)`, opacity: interpolate(t, [0, 1.6], [1, 0], { extrapolateRight: 'clamp' }),
        }} />;
      })}
      <div style={{
        position: 'absolute', left: 540 - 230, top: 640 - 230, width: 460, height: 460, borderRadius: '50%',
        border: `14px solid ${C.paper}`, outline: `5px solid ${C.curcuma}`, outlineOffset: -30, background: 'rgba(217,139,30,.92)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        transform: `scale(${scale}) rotate(${-12 + (1 - s) * 30}deg)`, opacity: Math.min(1, s * 2), boxShadow: '0 20px 50px rgba(0,0,0,.45)',
      }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: C.paper, letterSpacing: 3 }}>PRODUCTEUR</div>
        <div style={{ fontFamily: ITALIC, fontStyle: 'italic', fontWeight: 700, fontSize: 92, color: C.night, lineHeight: 1 }}>à la une</div>
        <div style={{ fontFamily: SERIF, fontSize: 34, color: C.paper, marginTop: 10 }}>Maison du curcuma</div>
      </div>
    </AbsoluteFill>
  );
};

const EFFETS: { titre: string; C: React.FC }[] = [
  { titre: 'Logo révélé avec reflet doré', C: LogoReflet },
  { titre: 'Logo en orbite 3D', C: OrbiteMini },
  { titre: 'Avant / après : photo → dessin', C: AvantApres },
  { titre: 'Carte et trajet animés', C: Carte },
  { titre: 'Compteur de chiffres clés', C: Compteur },
  { titre: 'Typographie animée', C: Typo },
  { titre: 'Transition « iris »', C: Iris },
  { titre: 'Mosaïque de tuiles', C: Mosaique },
  { titre: 'Tampon + confettis', C: Tampon },
];
export const EFFETS_TOTAL = EFFETS.length * EFFET_DUREE;

export const Effets: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.night }}>
    {EFFETS.map((e, i) => (
      <Sequence key={i} from={i * EFFET_DUREE} durationInFrames={EFFET_DUREE}>
        <e.C />
        <Label n={i + 1} titre={e.titre} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
