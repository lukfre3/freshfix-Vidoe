import React from 'react';
import {AbsoluteFill} from 'remotion';

export type FridgeVariant = 'white' | 'dark' | 'american' | 'minimal' | 'family' | 'steel';

type Pal = {
  back: [string, string];
  side: [string, string];
  ceil: string;
  floor: string;
  light: string;
  gasket: string;
  glass: string;
  items: number; // hur mycket mat som syns
  steel?: boolean;
  wide?: boolean;
};

const PAL: Record<FridgeVariant, Pal> = {
  white: {back: ['#F6F7F6', '#D5D9D9'], side: ['#E4E7E7', '#BFC4C5'], ceil: '#FFFFFF', floor: '#C9CECF', light: 'rgba(235,245,255,0.9)', gasket: '#9EA4A6', glass: 'rgba(200,225,220,0.35)', items: 2},
  dark: {back: ['#26282A', '#0E0F10'], side: ['#1A1B1C', '#08090A'], ceil: '#2E3032', floor: '#0B0C0C', light: 'rgba(255,214,160,0.85)', gasket: '#050505', glass: 'rgba(255,220,180,0.18)', items: 2},
  american: {back: ['#EEF0F0', '#C9CECF'], side: ['#DADDDD', '#B3B8B9'], ceil: '#FAFAFA', floor: '#BFC4C5', light: 'rgba(240,248,255,0.9)', gasket: '#8E9496', glass: 'rgba(200,225,220,0.35)', items: 3, steel: true, wide: true},
  minimal: {back: ['#F3EEE5', '#DDD3C3'], side: ['#E8E0D3', '#CFC3B0'], ceil: '#FBF8F2', floor: '#D3C8B6', light: 'rgba(255,246,230,0.9)', gasket: '#BDB2A0', glass: 'rgba(230,220,200,0.35)', items: 1},
  family: {back: ['#F4F5F4', '#D2D6D6'], side: ['#E2E5E5', '#BCC1C2'], ceil: '#FFFFFF', floor: '#C6CBCC', light: 'rgba(240,248,255,0.9)', gasket: '#9EA4A6', glass: 'rgba(200,225,220,0.35)', items: 4},
  steel: {back: ['#C7CACC', '#8E9295'], side: ['#B3B6B8', '#7D8184'], ceil: '#D9DBDC', floor: '#878B8E', light: 'rgba(235,245,255,0.9)', gasket: '#55595C', glass: 'rgba(210,225,230,0.3)', items: 2, steel: true},
};

const W = 1920;
const H = 1080;

/** Matvaror i bakgrunden – medvetet suddiga (kort skärpedjup). */
const Items: React.FC<{level: number; dark: boolean}> = ({level, dark}) => {
  const c = dark
    ? ['#3a3f3a', '#4b4036', '#2f3b44', '#504a3c']
    : ['#B9C7B0', '#E7D6B8', '#C9D6DD', '#D9B9A0', '#A8B79A', '#EBDDC6'];
  const all = [
    // vänster sida
    <g key="b1"><rect x={600} y={470} width={56} height={170} rx={20} fill={c[0]} /><rect x={616} y={430} width={24} height={50} rx={8} fill={c[0]} /></g>,
    <g key="j1"><rect x={680} y={560} width={90} height={80} rx={12} fill={c[1]} /><rect x={676} y={548} width={98} height={18} rx={6} fill={c[3]} /></g>,
    // höger sida
    <g key="c1"><path d="M 1180 640 V 500 L 1210 470 H 1270 L 1300 500 V 640 Z" fill={c[2]} /></g>,
    <g key="f1"><circle cx={1110} cy={612} r={28} fill={c[3]} /><circle cx={1150} cy={618} r={22} fill={c[4 % c.length]} /></g>,
    <g key="b2"><rect x={1318} y={500} width={36} height={140} rx={14} fill={c[5 % c.length]} /></g>,
    <g key="j2"><rect x={780} y={590} width={70} height={50} rx={10} fill={c[2]} /></g>,
    <g key="c2"><path d="M 600 640 V 520 L 620 500 H 660 L 680 520 V 640 Z" fill={c[4 % c.length]} /></g>,
  ];
  const n = [0, 2, 4, 6, 7][level];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, filter: 'blur(7px)', opacity: dark ? 0.9 : 0.85}}>
      {all.slice(0, n)}
    </svg>
  );
};

/**
 * Ett kylskåps insida i perspektiv (CSS/SVG). Produkten placeras ovanpå
 * i FridgeScene – den ritas aldrig om, så den ser alltid exakt likadan ut.
 */
export const FridgeInterior: React.FC<{variant: FridgeVariant}> = ({variant}) => {
  const p = PAL[variant];
  const dark = variant === 'dark';
  const bx0 = p.wide ? 470 : 560;
  const bx1 = W - bx0;
  const by0 = 150;
  const by1 = 880;
  const steelPattern = p.steel ? (
    <pattern id={`brush-${variant}`} width="6" height="1000" patternUnits="userSpaceOnUse">
      <rect width="6" height="1000" fill="rgba(255,255,255,0)" />
      <rect width="1" height="1000" fill="rgba(255,255,255,0.10)" />
      <rect x="3" width="1" height="1000" fill="rgba(0,0,0,0.06)" />
    </pattern>
  ) : null;
  return (
    <AbsoluteFill>
      <svg viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id={`back-${variant}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.back[0]} />
            <stop offset="1" stopColor={p.back[1]} />
          </linearGradient>
          <linearGradient id={`sideL-${variant}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={p.side[1]} />
            <stop offset="1" stopColor={p.side[0]} />
          </linearGradient>
          <linearGradient id={`sideR-${variant}`} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor={p.side[1]} />
            <stop offset="1" stopColor={p.side[0]} />
          </linearGradient>
          <radialGradient id={`glow-${variant}`} cx="0.5" cy="0" r="0.8">
            <stop offset="0" stopColor={p.light} />
            <stop offset="1" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <linearGradient id={`shelf-${variant}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.glass} />
            <stop offset="1" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
          {steelPattern}
        </defs>
        {/* bakvägg */}
        <rect x={bx0} y={by0} width={bx1 - bx0} height={by1 - by0} fill={`url(#back-${variant})`} />
        {p.steel ? <rect x={bx0} y={by0} width={bx1 - bx0} height={by1 - by0} fill={`url(#brush-${variant})`} /> : null}
        {/* tak, golv, sidor */}
        <polygon points={`0,0 ${W},0 ${bx1},${by0} ${bx0},${by0}`} fill={p.ceil} />
        <polygon points={`0,${H} ${W},${H} ${bx1},${by1} ${bx0},${by1}`} fill={p.floor} />
        <polygon points={`0,0 ${bx0},${by0} ${bx0},${by1} 0,${H}`} fill={`url(#sideL-${variant})`} />
        <polygon points={`${W},0 ${bx1},${by0} ${bx1},${by1} ${W},${H}`} fill={`url(#sideR-${variant})`} />
        {p.steel ? (
          <>
            <polygon points={`0,0 ${bx0},${by0} ${bx0},${by1} 0,${H}`} fill={`url(#brush-${variant})`} />
            <polygon points={`${W},0 ${bx1},${by0} ${bx1},${by1} ${W},${H}`} fill={`url(#brush-${variant})`} />
          </>
        ) : null}
        {/* ljus i taket */}
        <rect x={bx0 + 60} y={by0 - 14} width={bx1 - bx0 - 120} height={8} rx={4} fill={p.light} />
        <rect x={0} y={0} width={W} height={H * 0.75} fill={`url(#glow-${variant})`} opacity={dark ? 0.55 : 0.6} />
        {dark ? (
          <>
            {/* LED-list längs sidorna i det mörka kylskåpet */}
            <polygon points={`${bx0 - 6},${by0 + 20} ${bx0},${by0 + 20} ${bx0},${by1 - 20} ${bx0 - 6},${by1 - 20}`} fill={p.light} opacity={0.7} />
            <polygon points={`${bx1},${by0 + 20} ${bx1 + 6},${by0 + 20} ${bx1 + 6},${by1 - 20} ${bx1},${by1 - 20}`} fill={p.light} opacity={0.7} />
          </>
        ) : null}
        {/* övre hylla (syns underifrån) */}
        <polygon points={`${bx0},330 ${bx1},330 ${W - 60},200 60,200`} fill={`url(#shelf-${variant})`} />
        <rect x={60} y={196} width={W - 120} height={8} fill={dark ? 'rgba(255,220,180,0.25)' : 'rgba(255,255,255,0.8)'} />
      </svg>
      <Items level={p.items} dark={dark} />
      <svg viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
        {/* glashyllan produkten står på */}
        <polygon points={`${bx0},640 ${bx1},640 ${W - 90},812 90,812`} fill={`url(#shelf-${variant})`} />
        <rect x={90} y={810} width={W - 180} height={14} fill={dark ? 'rgba(255,225,190,0.22)' : 'rgba(255,255,255,0.75)'} />
        <rect x={90} y={824} width={W - 180} height={4} fill="rgba(0,0,0,0.12)" />
        {/* grönsakslåda nedanför */}
        <rect x={180} y={860} width={W - 360} height={240} rx={18} fill={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.35)'} stroke={dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)'} strokeWidth={3} />
        {/* dörrlist/tätning i bildkanten */}
        <rect x={0} y={0} width={p.wide ? 70 : 34} height={H} fill={p.gasket} />
        <rect x={W - (p.wide ? 70 : 34)} y={0} width={p.wide ? 70 : 34} height={H} fill={p.gasket} />
        {p.wide ? (
          <>
            <rect x={0} y={0} width={44} height={H} fill="#A9AEB1" />
            <rect x={W - 44} y={0} width={44} height={H} fill="#A9AEB1" />
          </>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};

/** Var produkten står (gemensam för alla kylskåp så att den aldrig flyttar sig). */
export const PRODUCT_IN_FRIDGE = {width: 600, bottom: 772};
