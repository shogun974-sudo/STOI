import '@fontsource/cinzel/600.css';
import '@fontsource/mulish/600.css';
import '@fontsource/mulish/800.css';
import '@fontsource/playfair-display/700-italic.css';
import React from 'react';
import {
  AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing,
} from 'remotion';
import { Vani } from './Vani';

export const FPS = 30;
export const DURATION = 30 * FPS;

export const C = {
  night: '#14110c', cream: '#f5ecdb', paper: '#fbf6ec', ink: '#1c2a1f',
  gold: '#c9a14a', goldHi: '#ebcf86', lagoon: '#1c6f79', curcuma: '#d98b1e', leaf: '#2f5a35',
};
const SERIF = 'Cinzel, serif';
const SANS = 'Mulish, sans-serif';
const ITALIC = '"Playfair Display", serif';

// Découpage (en images, 30 i/s). Chaque scène déborde de XF images sur la suivante pour le fondu.
const XF = 12;
export const SCENES = [
  { id: 'volcan', from: 0, to: 150 },
  { id: 'lagon', from: 150, to: 255 },
  { id: 'curcuma', from: 255, to: 375 },
  { id: 'cambourg', from: 375, to: 480 },
  { id: 'majihy', from: 480, to: 615 },
  { id: 'vanille', from: 615, to: 735 },
  { id: 'fin', from: 735, to: 900 },
] as const;

// Sous-titres (= texte de la voix off). Recalés sur la voix quand elle sera ajoutée.
const SUBS: { from: number; to: number; text: string }[] = [
  { from: 8, to: 80, text: "Sur une île de feu, au cœur de l'océan Indien," },
  { from: 80, to: 150, text: 'naît une petite gousse de vanille.' },
  { from: 156, to: 252, text: 'Un matin, elle part à l’aventure.' },
  { from: 260, to: 372, text: 'En chemin, elle croise l’or du curcuma,' },
  { from: 380, to: 477, text: 'les confitures du Panier de Cambourg,' },
  { from: 485, to: 612, text: 'puis les savons et la cire de Majihy, à Madagascar.' },
  { from: 620, to: 732, text: 'Ensemble, ils racontent ce que la terre des îles donne.' },
];

const Scene: React.FC<{ from: number; to: number; first?: boolean; last?: boolean; children: React.ReactNode }> = ({
  from, to, first, last, children,
}) => {
  const dur = to - from + (last ? 0 : XF);
  return (
    <Sequence from={from} durationInFrames={dur}>
      <FadeWrap dur={dur} first={first} last={last}>{children}</FadeWrap>
    </Sequence>
  );
};

const FadeWrap: React.FC<{ dur: number; first?: boolean; last?: boolean; children: React.ReactNode }> = ({
  dur, first, last, children,
}) => {
  const f = useCurrentFrame();
  const inO = first ? 1 : interpolate(f, [0, XF], [0, 1], { extrapolateRight: 'clamp' });
  const outO = last ? 1 : interpolate(f, [dur - XF, dur], [1, 1], { extrapolateLeft: 'clamp' });
  return <AbsoluteFill style={{ opacity: Math.min(inO, outO) }}>{children}</AbsoluteFill>;
};

// Illustration plein cadre avec léger mouvement de caméra (Ken Burns)
const Bg: React.FC<{ src: string; dur: number; from?: number; to?: number; x?: [number, number]; y?: [number, number] }> = ({
  src, dur, from = 1.04, to = 1.14, x = [0, 0], y = [0, 0],
}) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, dur], [0, 1], { extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });
  const s = from + (to - from) * t;
  const tx = x[0] + (x[1] - x[0]) * t;
  const ty = y[0] + (y[1] - y[0]) * t;
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: C.cream }}>
      <Img
        src={staticFile(`scenes/${src}.png`)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `translate(${tx}px, ${ty}px) scale(${s})` }}
      />
    </AbsoluteFill>
  );
};

// Étiquette producteur (haut de l'écran)
const Tag: React.FC<{ name: string; place: string; color: string; delay?: number }> = ({ name, place, color, delay = 10 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - delay, fps, config: { damping: 14, mass: 0.7 } });
  return (
    <div style={{
      position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center',
      transform: `translateY(${(1 - p) * -60}px) scale(${0.8 + 0.2 * p})`, opacity: p,
    }}>
      <div style={{
        background: C.paper, borderRadius: 999, padding: '18px 40px', boxShadow: '0 10px 30px rgba(0,0,0,.25)',
        border: `5px solid ${color}`, textAlign: 'center',
      }}>
        <div style={{ fontFamily: SERIF, fontSize: 46, color: C.ink, letterSpacing: 1 }}>{name}</div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 28, color, marginTop: 2 }}>{place}</div>
      </div>
    </div>
  );
};

const Subtitles: React.FC = () => {
  const f = useCurrentFrame();
  const cur = SUBS.find((s) => f >= s.from && f < s.to);
  if (!cur) return null;
  const local = f - cur.from;
  const o = Math.min(
    interpolate(local, [0, 6], [0, 1], { extrapolateRight: 'clamp' }),
    interpolate(f, [cur.to - 6, cur.to], [1, 0], { extrapolateLeft: 'clamp' }),
  );
  return (
    <div style={{ position: 'absolute', bottom: 64, left: 60, right: 60, display: 'flex', justifyContent: 'center', opacity: o }}>
      <div style={{
        background: 'rgba(20,17,12,.72)', color: C.cream, fontFamily: SANS, fontWeight: 800, fontSize: 44,
        lineHeight: 1.25, padding: '18px 30px', borderRadius: 22, textAlign: 'center', maxWidth: 940,
      }}>{cur.text}</div>
    </div>
  );
};

// Petites étincelles dorées
const Sparkles: React.FC<{ n?: number; seed?: number }> = ({ n = 14, seed = 1 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: n }).map((_, i) => {
        const r = (k: number) => {
          const v = Math.sin((i + 1) * 12.9898 * (k + seed)) * 43758.5453;
          return v - Math.floor(v);
        };
        const x = r(1) * 1080;
        const y = 200 + r(2) * 800 - ((f * (0.6 + r(3))) % 260);
        const tw = 0.5 + 0.5 * Math.sin(f / 6 + i);
        const size = 10 + r(4) * 18;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" style={{ position: 'absolute', left: x, top: y, opacity: tw }}>
            <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill={C.goldHi} />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

// Position de Vani : entrée en marchant depuis la gauche
const walkIn = (f: number, fps: number, startX: number, endX: number, delay = 0) => {
  const p = spring({ frame: f - delay, fps, config: { damping: 200 }, durationInFrames: 40 });
  return { x: startX + (endX - startX) * p, walking: p < 0.98 };
};

/* ---------------- Scènes ---------------- */

const SVolcan: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f - 40, fps, config: { damping: 9, mass: 0.8 } });
  return (
    <>
      <Bg src="volcan" dur={162} from={1.18} to={1.04} y={[-40, 0]} />
      <Sparkles n={10} />
      <Vani x={540} y={1080 - 150 * pop} scale={0.5 + 0.5 * pop} wave={f > 75} opacity={Math.min(1, pop * 1.5)} />
    </>
  );
};

const SLagon: React.FC = () => {
  const f = useCurrentFrame();
  const bob = Math.sin(f / 9) * 10;
  return (
    <>
      <Bg src="lagon" dur={117} from={1.06} to={1.16} x={[30, -30]} />
      <Vani x={500} y={880 + bob} scale={0.62} rotate={Math.sin(f / 12) * 4} wave />
    </>
  );
};

const SProduit: React.FC<{ src: string; name: string; place: string; color: string; dur: number }> = ({ src, name, place, color, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = walkIn(f, fps, -200, 210, 4);
  return (
    <>
      <Bg src={src} dur={dur} from={1.02} to={1.12} />
      <Tag name={name} place={place} color={color} />
      <Vani x={w.x} y={1040} scale={0.72} walking={w.walking} lookRight surprised={!w.walking} />
    </>
  );
};

const SVanille: React.FC = () => {
  const f = useCurrentFrame();
  const jump = Math.abs(Math.sin(f / 7)) * 60;
  return (
    <>
      <Bg src="vanille" dur={132} from={1.14} to={1.03} />
      <Sparkles n={18} seed={3} />
      <Vani x={540} y={1010 - jump} scale={0.78} wave />
    </>
  );
};

const SFin: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: f - 4, fps, config: { damping: 12 } });
  const tag = spring({ frame: f - 30, fps, config: { damping: 200 } });
  const cta = spring({ frame: f - 60, fps, config: { damping: 10 } });
  const pulse = 1 + Math.sin(f / 6) * 0.025 * (f > 80 ? 1 : 0);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 35%, ${C.paper} 0%, ${C.cream} 55%, #ead9b8 100%)` }}>
      <Sparkles n={12} seed={7} />
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Img src={staticFile('logo-stoi.avif')} style={{ width: 430, transform: `scale(${logo})`, opacity: logo }} />
      </div>
      <div style={{
        position: 'absolute', top: 560, left: 60, right: 60, textAlign: 'center', opacity: tag,
        transform: `translateY(${(1 - tag) * 30}px)`, fontFamily: ITALIC, fontStyle: 'italic', fontWeight: 700,
        fontSize: 54, lineHeight: 1.2, color: C.ink,
      }}>
        Relier les îles par ce<br />qu’elles savent faire.
      </div>
      <div style={{
        position: 'absolute', top: 760, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
        opacity: Math.min(1, cta * 1.4), transform: `scale(${(0.7 + 0.3 * cta) * pulse})`,
      }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 36, color: C.lagoon, marginBottom: 18 }}>
          Producteur ou professionnel ?
        </div>
        <div style={{
          background: C.leaf, color: C.paper, borderRadius: 999, padding: '24px 46px', fontFamily: SANS, fontWeight: 800,
          fontSize: 44, boxShadow: '0 12px 30px rgba(47,90,53,.35)', display: 'flex', alignItems: 'center', gap: 18,
        }}>
          <WhatsIcon /> +262 692 09 76 47
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.ink, marginTop: 22 }}>
          savoirterroirs@gmail.com
        </div>
      </div>
      <Vani x={170} y={1300} scale={0.62} wave={f > 20} />
    </AbsoluteFill>
  );
};

const WhatsIcon = () => (
  <svg width="46" height="46" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="15" fill={C.paper} />
    <path d="M16 6.5a9.5 9.5 0 0 0-8.2 14.3L6.6 25.4l4.7-1.2A9.5 9.5 0 1 0 16 6.5Z" fill={C.leaf} />
    <path d="M12.4 11.4c.3-.6.6-.6.9-.6h.7c.2 0 .5.1.7.6l.9 2.1c.1.3 0 .6-.2.8l-.6.7c-.2.2-.2.4 0 .7.7 1.2 1.7 2.1 2.9 2.7.3.2.5.1.7-.1l.7-.8c.2-.3.5-.3.8-.2l2 .9c.3.2.5.3.5.6 0 .9-.6 2-1.6 2.3-1 .3-2.6 0-4.6-1.2-2.3-1.4-3.8-3.6-4.2-4.5-.5-1-.6-2.3.1-3.2Z" fill={C.paper} />
  </svg>
);

/* ---------------- Composition ---------------- */

export const Stoi: React.FC<{ withVoice: boolean }> = ({ withVoice }) => {
  const f = useCurrentFrame();
  // Musique : plus basse pendant la voix, remonte sur l'écran final, fondu de sortie
  const musicVol = (fr: number) => {
    const base = withVoice ? (fr < 735 ? 0.22 : 0.5) : 0.75;
    const fadeIn = interpolate(fr, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
    const fadeOut = interpolate(fr, [DURATION - 45, DURATION], [1, 0], { extrapolateLeft: 'clamp' });
    return base * fadeIn * fadeOut;
  };
  void f;
  const s = (id: string) => SCENES.find((x) => x.id === id)!;
  return (
    <AbsoluteFill style={{ backgroundColor: C.cream }}>
      <Audio src={staticFile('musique.mp3')} volume={musicVol} />
      {withVoice ? <Audio src={staticFile('voix.mp3')} startFrom={0} /> : null}

      <Scene {...s('volcan')} first><SVolcan /></Scene>
      <Scene {...s('lagon')}><SLagon /></Scene>
      <Scene {...s('curcuma')}>
        <SProduit src="curcuma" name="Maison du curcuma" place="Saint-Joseph · La Réunion" color={C.curcuma} dur={132} />
      </Scene>
      <Scene {...s('cambourg')}>
        <SProduit src="cambourg" name="Le panier de Cambourg" place="Sainte-Anne · La Réunion" color={C.leaf} dur={117} />
      </Scene>
      <Scene {...s('majihy')}>
        <SProduit src="majihy" name="H - Majihy" place="Diego Suarez · Madagascar" color={C.lagoon} dur={147} />
      </Scene>
      <Scene {...s('vanille')}><SVanille /></Scene>
      <Scene {...s('fin')} last><SFin /></Scene>

      <Subtitles />
    </AbsoluteFill>
  );
};
