import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Vani } from './Vani';
import { C } from './Stoi';

// Démo : l'emblème STOI tourne en orbite autour de Vani (passe devant puis derrière).
export const Orbite: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const cx = 540;
  const cy = 700; // centre de l'orbite (milieu du personnage)
  const tours = 2; // nombre de tours sur la durée
  const angle = (f / durationInFrames) * tours * Math.PI * 2 - Math.PI / 2;
  const x = cx + Math.cos(angle) * 360;
  const y = cy + Math.sin(angle) * 110 - 40;
  const depth = Math.sin(angle); // > 0 : devant ; < 0 : derrière
  const size = 260 * (0.8 + 0.25 * (depth + 1) / 2);
  const spin = f * 6; // le logo tourne aussi sur lui-même
  const flip = Math.cos(f / 8); // effet pièce qui pivote
  const appear = spring({ frame: f, fps, config: { damping: 12 } });
  const front = depth > 0;

  const logo = (
    <div style={{
      position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size,
      opacity: appear * (front ? 1 : 0.8), filter: front ? 'drop-shadow(0 10px 18px rgba(0,0,0,.3))' : 'blur(0.6px)',
      transform: `scaleX(${0.35 + 0.65 * Math.abs(flip)}) rotate(${Math.sin(f / 20) * 8}deg)`,
    }}>
      <Img src={staticFile('emblem-stoi.avif')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );

  // traînée dorée le long de l'orbite
  const trail = Array.from({ length: 10 }).map((_, i) => {
    const a = angle - (i + 1) * 0.12;
    return (
      <div key={i} style={{
        position: 'absolute', left: cx + Math.cos(a) * 360 - 6, top: cy + Math.sin(a) * 110 - 46,
        width: 12, height: 12, borderRadius: 6, background: C.goldHi, opacity: (1 - i / 10) * 0.6 * appear,
        zIndex: Math.sin(a) > 0 ? 3 : 1,
      }} />
    );
  });

  const fade = interpolate(f, [durationInFrames - 15, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${C.paper} 0%, ${C.cream} 55%, #ead9b8 100%)`, opacity: fade }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>{trail.filter((_, i) => Math.sin(angle - (i + 1) * 0.12) <= 0)}{!front && logo}</div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        <Vani x={540} y={900} scale={1.1} wave={f > 30} />
      </div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>{trail.filter((_, i) => Math.sin(angle - (i + 1) * 0.12) > 0)}{front && logo}</div>
    </AbsoluteFill>
  );
};
