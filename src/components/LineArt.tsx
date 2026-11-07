import React from 'react';
import {useCurrentFrame} from 'remotion';
import {EASE, EASE_IN_OUT, ramp} from './common';

/** En linje som "ritas" fram – samma tunna linjestil som FreshFix-logotypen. */
export const DrawPath: React.FC<{
  d: string;
  start: number;
  dur?: number;
  color?: string;
  width?: number;
  fill?: string;
  fillOpacity?: number;
}> = ({d, start, dur = 30, color = '#fff', width = 3, fill = 'none', fillOpacity = 0}) => {
  const frame = useCurrentFrame();
  const t = ramp(frame, start, dur, EASE_IN_OUT);
  return (
    <path
      d={d}
      pathLength={1}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={fill}
      fillOpacity={fillOpacity}
      strokeDasharray="1 1"
      strokeDashoffset={1 - t}
    />
  );
};

/** Kylskåp framifrån med öppen dörr och bortglömd mat – mörk öppning. */
export const ForgottenFridge: React.FC<{start: number; color?: string}> = ({start, color = '#fff'}) => {
  const frame = useCurrentFrame();
  const s = start;
  // "luktlinjer" som ringlar uppåt från den bortglömda maten
  const smell = (x: number, delay: number) => {
    const t = ((frame - s - 70 - delay) / 50) % 1;
    const vis = frame > s + 70 + delay ? 1 : 0;
    const tt = t < 0 ? 0 : t;
    const y = 312 - tt * 60;
    const o = vis * Math.sin(tt * Math.PI) * 0.8;
    return (
      <path
        key={x + '-' + delay}
        d={`M ${x} ${y + 30} q 8 -8 0 -15 q -8 -8 0 -15`}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        opacity={o}
        vectorEffect="non-scaling-stroke"
      />
    );
  };
  return (
    <svg viewBox="0 0 600 600" style={{width: '100%', height: '100%', overflow: 'visible'}}>
      {/* stomme */}
      <DrawPath d="M 200 60 H 420 Q 430 60 430 70 V 540 Q 430 550 420 550 H 200 Q 190 550 190 540 V 70 Q 190 60 200 60 Z" start={s} dur={40} color={color} />
      {/* frysfack-linje */}
      <DrawPath d="M 190 200 H 430" start={s + 15} dur={25} color={color} />
      {/* hyllor */}
      <DrawPath d="M 205 330 H 415" start={s + 25} dur={25} color={color} width={2} />
      <DrawPath d="M 205 440 H 415" start={s + 30} dur={25} color={color} width={2} />
      {/* öppen dörr (perspektiv) */}
      <DrawPath d="M 190 60 L 95 100 V 520 L 190 550" start={s + 20} dur={35} color={color} />
      <DrawPath d="M 190 200 L 95 222" start={s + 35} dur={20} color={color} />
      <DrawPath d="M 110 250 L 175 236" start={s + 40} dur={20} color={color} width={2} />
      <DrawPath d="M 110 380 L 175 372" start={s + 42} dur={20} color={color} width={2} />
      {/* bortglömd mat: burk, mjölkpaket, äpple, ost */}
      <DrawPath d="M 225 330 V 285 Q 225 278 232 278 H 262 Q 269 278 269 285 V 330" start={s + 45} dur={25} color={color} width={2} />
      <DrawPath d="M 222 278 H 272" start={s + 50} dur={15} color={color} width={2} />
      <DrawPath d="M 300 330 V 262 L 315 248 H 345 L 360 262 V 330" start={s + 48} dur={25} color={color} width={2} />
      <DrawPath d="M 385 330 c -18 0 -22 -24 -12 -34 c 6 -6 12 -4 14 -2 c 2 -2 8 -4 14 2 c 10 10 6 34 -12 34 z" start={s + 52} dur={25} color={color} width={2} />
      <DrawPath d="M 387 296 q 2 -10 8 -12" start={s + 60} dur={10} color={color} width={2} />
      <DrawPath d="M 240 440 L 330 440 L 330 410 L 240 425 Z" start={s + 55} dur={25} color={color} width={2} />
      {smell(380, 0)}
      {smell(392, 22)}
      {smell(250, 12)}
      {smell(258, 34)}
    </svg>
  );
};

/** Soptunna + mat som faller ned i den. */
export const BinDrop: React.FC<{start: number; color?: string}> = ({start, color = '#fff'}) => {
  const frame = useCurrentFrame();
  const s = start;
  const items = [
    // äpple, bröd, banan – {d, delay, x, rot}
    {d: 'M 0 18 c -18 0 -22 -24 -12 -34 c 6 -6 12 -4 14 -2 c 2 -2 8 -4 14 2 c 10 10 6 34 -12 34 z M 2 -16 q 2 -10 8 -12', delay: 20, x: 290, rot: 25},
    {d: 'M -40 10 V -10 Q -40 -28 -20 -28 H 20 Q 40 -28 40 -10 V 10 Z M -20 -10 l 6 10 M 0 -12 l 6 10 M 20 -10 l 6 10', delay: 38, x: 318, rot: -18},
    {d: 'M -40 -6 Q 0 30 40 -10 Q 0 14 -40 -6 Z', delay: 54, x: 300, rot: 40},
  ];
  return (
    <svg viewBox="0 0 600 600" style={{width: '100%', height: '100%', overflow: 'visible'}}>
      {/* lock + tunna */}
      <DrawPath d="M 200 290 H 400" start={s} dur={22} color={color} />
      <DrawPath d="M 270 290 V 280 H 330 V 290" start={s + 6} dur={16} color={color} />
      <DrawPath d="M 212 300 L 232 540 H 368 L 388 300" start={s + 4} dur={30} color={color} />
      <DrawPath d="M 265 330 L 272 510 M 300 330 V 510 M 335 330 L 328 510" start={s + 14} dur={26} color={color} width={2} />
      {items.map((it, i) => {
        const t = ramp(frame, s + it.delay, 26, (x) => x * x); // gravitation
        const y = -60 + t * 360;
        const o = frame < s + it.delay ? 0 : t > 0.96 ? 0 : 1;
        return (
          <g key={i} transform={`translate(${it.x} ${y}) rotate(${it.rot * t})`} opacity={o}>
            <path d={it.d} stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
      {/* litet "studs" i locket när något landar */}
      {items.map((it, i) => {
        const t = ramp(frame, s + it.delay + 25, 14, EASE);
        if (t <= 0 || t >= 1) return null;
        return (
          <circle key={'r' + i} cx={300} cy={290} r={20 + t * 90} stroke={color} strokeWidth={1.5} fill="none" opacity={(1 - t) * 0.5} vectorEffect="non-scaling-stroke" />
        );
      })}
    </svg>
  );
};
