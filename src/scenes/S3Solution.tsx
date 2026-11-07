import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_SANS, FONT_SERIF, T, TEXT, f} from '../config';
import {Bokeh, EASE, EASE_IN_OUT, FadeText, Grain, GrowLine, Label, LogoReveal, ProductPhoto, RiseText, ramp} from '../components/common';

const S = T.scenes.solution;

const SHOTS: {which: 'angle' | 'front' | 'upright'; zoom: [number, number]; pan: [number, number]}[] = [
  {which: 'angle', zoom: [1.45, 1.7], pan: [0, -2]},
  {which: 'front', zoom: [1.9, 2.15], pan: [-2, 2]},
  {which: 'upright', zoom: [2.5, 2.85], pan: [3, -1]},
  {which: 'angle', zoom: [2.4, 2.1], pan: [-3, 1]},
  {which: 'angle', zoom: [1.5, 1.4], pan: [0, 0]},
];

/** Produktsidan: cirkel öppnas, klipp på varje taktslag, egenskaper poppar fram runt produkten. */
const ProductReveal: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const beat = (60 / T.bpm) * fps;
  const idx = Math.min(SHOTS.length - 1, Math.floor(frame / beat));
  const local = frame - idx * beat;
  const shot = SHOTS[idx];
  const iris = spring({frame, fps, config: {damping: 16, stiffness: 90}});
  const punch = 1.06 - 0.06 * ramp(local, 0, 10, EASE);
  const flash = idx > 0 ? 1 - ramp(local, 0, 5) : 0;
  const feats = TEXT.solution.features;
  const POS = [
    {x: 150, y: 330, side: 'L'},
    {x: 1770, y: 330, side: 'R'},
    {x: 150, y: 760, side: 'L'},
    {x: 1770, y: 760, side: 'R'},
  ] as const;
  const titleIn = spring({frame: frame - 2, fps, config: {damping: 12, stiffness: 120}});
  const tagT = ramp(frame, beat * 4, 14, EASE);
  return (
    <AbsoluteFill style={{background: C.charcoal}}>
      <AbsoluteFill style={{clipPath: `circle(${iris * 85}% at 50% 52%)`}}>
        <AbsoluteFill style={{transform: `scale(${punch})`}}>
          <Sequence from={Math.round(idx * beat)} durationInFrames={Math.round(beat) + 2} layout="none">
            <ProductPhoto which={shot.which} dur={Math.round(beat)} zoom={shot.zoom} pan={shot.pan} sweepStart={2} sweepDur={Math.round(beat)} />
          </Sequence>
        </AbsoluteFill>
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(20,21,20,0.55) 0%, rgba(20,21,20,0) 30%, rgba(20,21,20,0) 65%, rgba(20,21,20,0.65) 100%)'}} />
      </AbsoluteFill>
      {/* grön ram som pulserar på takten */}
      <AbsoluteFill style={{border: `${10 * (1 - ramp(local, 0, 8))}px solid ${C.green}`, opacity: idx > 0 ? 0.9 : 0}} />
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.35}} />
      <Bokeh count={12} opacity={0.25} seed={6} />

      {/* titel */}
      <div style={{position: 'absolute', top: 70, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: FONT_SERIF, fontWeight: 600, fontSize: 108, color: C.white, letterSpacing: `${0.3 - titleIn * 0.3}em`, opacity: Math.min(1, titleIn * 1.3), textShadow: '0 6px 30px rgba(0,0,0,0.35)'}}>
          {TEXT.solution.product}
        </div>
      </div>

      {/* egenskaper – en per taktslag */}
      {feats.map((txt, k) => {
        const st = Math.round(beat * k) + 6;
        const p = spring({frame: frame - st, fps, config: {damping: 10, stiffness: 170, mass: 0.6}});
        const line = ramp(frame, st + 4, 12, EASE);
        const pos = POS[k];
        const left = pos.side === 'L';
        return (
          <div key={txt} style={{position: 'absolute', top: pos.y, [left ? 'left' : 'right']: 1920 - pos.x > 960 ? pos.x : 1920 - pos.x, display: 'flex', alignItems: 'center', flexDirection: left ? 'row' : 'row-reverse', gap: 0, opacity: Math.min(1, p * 1.5)}}>
            <div
              style={{
                padding: '16px 28px',
                borderRadius: 50,
                background: 'rgba(27,28,26,0.72)',
                border: `1.5px solid rgba(238,231,219,0.35)`,
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                transform: `scale(${0.5 + 0.5 * p}) translateX(${(1 - p) * (left ? -60 : 60)}px)`,
                transformOrigin: left ? '0% 50%' : '100% 50%',
              }}
            >
              <div style={{width: 14, height: 14, borderRadius: 7, background: C.green, boxShadow: `0 0 0 ${6 * (1 - ramp(frame, st, 16))}px rgba(120,130,106,0.5)`}} />
              <div style={{fontFamily: FONT_SANS, fontSize: 38, fontWeight: 600, color: C.white, whiteSpace: 'nowrap'}}>{txt}</div>
            </div>
            <div style={{height: 2, width: 170 * line, background: C.beige, opacity: 0.8}} />
            <div style={{width: 10, height: 10, borderRadius: 5, background: C.beige, opacity: line}} />
          </div>
        );
      })}

      {/* taggline på sista slaget */}
      <div style={{position: 'absolute', bottom: 80, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div style={{padding: '14px 34px', borderRadius: 50, background: C.green, opacity: tagT, transform: `translateY(${(1 - tagT) * 30}px) scale(${0.9 + tagT * 0.1})`}}>
          <div style={{fontFamily: FONT_SANS, fontSize: 32, fontWeight: 600, color: C.white, letterSpacing: '0.04em'}}>{TEXT.solution.tagline}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Bokstäver som studsar fram, en färgpuls, en ljusstrimma och en "ljudvåg" av streck. */
const PresentPop: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const word = TEXT.solution.product;
  const out = ramp(frame, dur - 7, 8, EASE_IN_OUT);
  const disk = spring({frame: frame - 1, fps, config: {damping: 14, stiffness: 120}});
  const ring = ramp(frame, 6, 24, EASE);
  const shine = ramp(frame, 30, 11, EASE_IN_OUT);
  const under = ramp(frame, 16, 14, EASE);
  const labelT = ramp(frame, 0, 14, EASE);
  const zoom = interpolate(frame, [0, dur], [1, 1.06]) + out * 0.25;
  const letters = (
    <>
      {word.split('').map((ch, i) => {
        const p = spring({frame: frame - 4 - i * 1.6, fps, config: {damping: 9, stiffness: 190, mass: 0.6}});
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `translateY(${(1 - p) * 90}px) scale(${0.4 + 0.6 * p}) rotate(${(1 - p) * (i % 2 ? 14 : -14)}deg)`,
              opacity: Math.min(1, p * 1.4),
            }}
          >
            {ch}
          </span>
        );
      })}
    </>
  );
  const textStyle: React.CSSProperties = {fontFamily: FONT_SERIF, fontWeight: 500, fontSize: 220, letterSpacing: '-0.01em', lineHeight: 1, whiteSpace: 'nowrap'};
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: 1 - out, filter: out > 0 ? `blur(${out * 12}px)` : undefined}}>
      {/* mjuk färgpuls bakom ordet */}
      <div style={{position: 'absolute', width: 1100, height: 1100, borderRadius: '50%', background: `radial-gradient(circle, rgba(120,130,106,0.30) 0%, rgba(120,130,106,0.08) 45%, rgba(120,130,106,0) 70%)`, transform: `scale(${disk})`}} />
      {/* ring + streck som skjuts ut */}
      <div style={{position: 'absolute', width: 520, height: 520, borderRadius: '50%', border: `2px solid ${C.green}`, transform: `scale(${0.6 + ring * 1.4})`, opacity: (1 - ring) * 0.6}} />
      <svg viewBox="-500 -500 1000 1000" style={{position: 'absolute', width: 1000, height: 1000, overflow: 'visible'}}>
        {Array.from({length: 14}).map((_, k) => {
          const ang = (k / 14) * Math.PI * 2;
          const r0 = 300 + ring * 140;
          const r1 = r0 + 40 * (1 - ring);
          return (
            <line key={k} x1={Math.cos(ang) * r0} y1={Math.sin(ang) * r0 * 0.55} x2={Math.cos(ang) * r1} y2={Math.sin(ang) * r1 * 0.55} stroke={C.green} strokeWidth={3} strokeLinecap="round" opacity={(1 - ring) * (ring > 0 ? 0.9 : 0)} />
          );
        })}
      </svg>
      <div style={{transform: `scale(${zoom})`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{fontFamily: FONT_SANS, fontSize: 24, fontWeight: 600, letterSpacing: `${0.9 - labelT * 0.5}em`, textTransform: 'uppercase', color: C.green, opacity: labelT, marginBottom: 18}}>
          {TEXT.solution.presentSmall}
        </div>
        <div style={{position: 'relative'}}>
          <div style={{...textStyle, color: C.charcoal}}>{letters}</div>
          {/* ljusstrimma över texten */}
          {shine > 0 && shine < 1 ? (
            <div
              style={{
                ...textStyle,
                position: 'absolute',
                inset: 0,
                color: 'transparent',
                backgroundImage: `linear-gradient(100deg, rgba(255,255,255,0) ${shine * 140 - 30}%, rgba(255,255,255,0.85) ${shine * 140 - 15}%, rgba(255,255,255,0) ${shine * 140}%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }}
            >
              {word}
            </div>
          ) : null}
        </div>
        <div style={{height: 5, width: 640 * under, background: C.green, borderRadius: 3, marginTop: 14}} />
      </div>
    </AbsoluteFill>
  );
};

export const S3Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const L = (sec: number) => f(sec - S.start);
  const total = L(S.end);
  const present = L(S.present);
  const product = L(S.product);
  const close = L(S.productClose);

  // mörkt → ljust: som när kylskåpsdörren öppnas och ljuset tänds
  const light = ramp(frame, 0, 24, EASE_IN_OUT);
  const glow = ramp(frame, 8, 40, EASE);
  const qOut = ramp(frame, present - 10, 12, EASE_IN_OUT);

  return (
    <AbsoluteFill style={{background: C.beige}}>
      <AbsoluteFill style={{background: C.charcoal, opacity: 1 - light}} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 72% 50%, rgba(255,252,245,${0.95 * glow}) 0%, rgba(255,252,245,0) ${18 + glow * 42}%)`,
          opacity: 1 - qOut,
        }}
      />
      {/* den riktiga logotypen ritas fram */}
      <div style={{position: 'absolute', right: 300, top: 190, opacity: (1 - qOut) * light, transform: `scale(${interpolate(frame, [0, present], [0.97, 1.03])})`}}>
        <LogoReveal start={6} height={680} color={C.greenDark} dur={40} />
      </div>
      <div style={{position: 'absolute', left: 140, top: 340, opacity: 1 - qOut}}>
        <FadeText start={L(S.question)}>
          <Label color={C.green}>En ny idé</Label>
        </FadeText>
        <GrowLine start={L(S.question) + 4} width={120} color={C.green} style={{margin: '18px 0 26px'}} />
        <RiseText text={TEXT.solution.question} start={L(S.question) + 4} size={76} weight={600} align="left" color={C.charcoal} tracking={-0.03} stagger={2} />
      </div>

      {/* "Vi presenterar FreshFixer." – poppande avtäckning */}
      <Sequence from={present} durationInFrames={product - present + 2}>
        <PresentPop dur={product - present} />
      </Sequence>

      {/* Produktsidan: snabba klipp i takt, egenskaper som poppar fram */}
      <Sequence from={product} durationInFrames={total - product}>
        <ProductReveal dur={total - product} />
      </Sequence>
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};
