import React from 'react';
import { useCurrentFrame } from 'remotion';

// « Vani », la petite gousse de vanille. (x, y) = position des pieds, au centre.
export const Vani: React.FC<{
  x: number; y: number; scale?: number; rotate?: number; opacity?: number;
  wave?: boolean; walking?: boolean; lookRight?: boolean; surprised?: boolean;
}> = ({ x, y, scale = 1, rotate = 0, opacity = 1, wave, walking, lookRight, surprised }) => {
  const f = useCurrentFrame();
  const W = 220;
  const H = 400;
  const blink = f % 75 > 70 ? 0.15 : 1;
  const breathe = 1 + Math.sin(f / 10) * 0.015;
  const step = walking ? Math.sin(f / 3.2) : 0;
  const bounce = walking ? Math.abs(Math.sin(f / 3.2)) * -10 : 0;
  const armWave = wave ? Math.sin(f / 4) * 28 : 0;
  const look = lookRight ? 7 : 0;

  return (
    <div style={{
      position: 'absolute', left: x - (W * scale) / 2, top: y - H * scale, width: W * scale, height: H * scale,
      opacity, transform: `rotate(${rotate}deg)`, transformOrigin: '50% 100%',
    }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="pod" x1="0" x2="1">
            <stop offset="0" stopColor="#2a170d" />
            <stop offset="0.45" stopColor="#5a3520" />
            <stop offset="1" stopColor="#2f1a0f" />
          </linearGradient>
        </defs>
        {/* ombre */}
        <ellipse cx="110" cy="392" rx="62" ry="10" fill="rgba(0,0,0,.25)" />
        <g transform={`translate(0 ${bounce})`}>
          {/* jambes */}
          <path d={`M92 330 L${86 + step * 14} 384`} stroke="#2a170d" strokeWidth="10" strokeLinecap="round" />
          <path d={`M128 330 L${134 - step * 14} 384`} stroke="#2a170d" strokeWidth="10" strokeLinecap="round" />
          <ellipse cx={82 + step * 14} cy="387" rx="16" ry="8" fill="#c9a14a" />
          <ellipse cx={138 - step * 14} cy="387" rx="16" ry="8" fill="#c9a14a" />
          <g transform={`scale(1 ${breathe})`} style={{ transformOrigin: '110px 340px' }}>
            {/* bras gauche */}
            <path d="M58 200 Q30 230 34 262" stroke="#2a170d" strokeWidth="10" fill="none" strokeLinecap="round" />
            {/* bras droit (salut) */}
            <g transform={`rotate(${-armWave - (wave ? 40 : 0)} 160 200)`}>
              <path d="M160 200 Q192 222 190 258" stroke="#2a170d" strokeWidth="10" fill="none" strokeLinecap="round" />
              <circle cx="190" cy="262" r="9" fill="#2a170d" />
            </g>
            <circle cx="34" cy="266" r="9" fill="#2a170d" />
            {/* corps : gousse */}
            <path d="M110 40 C150 60 168 140 166 220 C164 290 142 340 110 345 C78 340 56 290 54 220 C52 140 70 60 110 40 Z" fill="url(#pod)" />
            <path d="M104 62 C92 120 90 220 100 320" stroke="#8a5a36" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".7" />
            <path d="M124 70 C132 140 134 230 124 316" stroke="#1d0f07" strokeWidth="3" fill="none" opacity=".5" />
            {/* tige */}
            <path d="M110 42 C112 26 120 16 132 12" stroke="#2f5a35" strokeWidth="8" fill="none" strokeLinecap="round" />
            {/* fleur de vanille sur la tête */}
            <g transform="translate(138 14)">
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse key={a} cx="0" cy="-16" rx="9" ry="18" fill="#f5ecdb" stroke="#e5d3a8" strokeWidth="1.5" transform={`rotate(${a + Math.sin(f / 15) * 4})`} />
              ))}
              <circle r="8" fill="#ebcf86" />
            </g>
            {/* yeux */}
            <g transform={`translate(${look} 0)`}>
              <ellipse cx="88" cy="150" rx="19" ry={22 * blink * (surprised ? 1.15 : 1)} fill="#fff" />
              <ellipse cx="134" cy="150" rx="19" ry={22 * blink * (surprised ? 1.15 : 1)} fill="#fff" />
              {blink > 0.5 && (
                <>
                  <circle cx={92 + look * 0.4} cy="154" r="10" fill="#14110c" />
                  <circle cx={138 + look * 0.4} cy="154" r="10" fill="#14110c" />
                  <circle cx={96 + look * 0.4} cy="149" r="3.5" fill="#fff" />
                  <circle cx={142 + look * 0.4} cy="149" r="3.5" fill="#fff" />
                </>
              )}
              {/* joues */}
              <ellipse cx="72" cy="188" rx="11" ry="7" fill="#d98b1e" opacity=".55" />
              <ellipse cx="150" cy="188" rx="11" ry="7" fill="#d98b1e" opacity=".55" />
              {/* bouche */}
              {surprised
                ? <ellipse cx="111" cy="200" rx="9" ry="11" fill="#14110c" />
                : <path d="M94 192 Q111 212 128 192" stroke="#f5ecdb" strokeWidth="5" fill="none" strokeLinecap="round" />}
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};
