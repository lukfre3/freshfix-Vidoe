import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_SANS, FONT_SERIF, T, TEXT, f} from '../config';
import {Bokeh, EASE, EASE_IN_OUT, FadeText, Grain, GrowLine, Label, LogoReveal, ProductPhoto, RiseText, ramp} from '../components/common';

const S = T.scenes.solution;

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
      <span style={{display: 'inline-block', color: C.green, transform: `scale(${spring({frame: frame - 24, fps, config: {damping: 7, stiffness: 220}})})`}}>.</span>
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
              {word}.
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

      {/* Hjältebild: riktigt studiofoto, kameran glider in */}
      <Sequence from={product} durationInFrames={close - product + 6}>
        <AbsoluteFill style={{opacity: ramp(frame - product, 0, 6)}}>
          <ProductPhoto which="angle" dur={close - product + 6} zoom={[1.55, 1.85]} pan={[2, -2]} sweepStart={8} sweepDur={40} />
          <Bokeh count={14} opacity={0.25} seed={3} />
          <div style={{position: 'absolute', top: 96, width: '100%', textAlign: 'center'}}>
            <div style={{fontFamily: FONT_SERIF, fontWeight: 500, fontSize: 92, color: C.white, opacity: ramp(frame - product, 4, 16), letterSpacing: '0.01em'}}>
              FreshFixer
            </div>
          </div>
          <FadeText start={14} style={{position: 'absolute', bottom: 96, width: '100%', textAlign: 'center'}}>
            <div style={{fontFamily: FONT_SANS, fontSize: 22, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.beige}}>
              {TEXT.solution.tagline}
            </div>
          </FadeText>
        </AbsoluteFill>
      </Sequence>

      {/* Makrobild på det rostfria stålet */}
      <Sequence from={close} durationInFrames={total - close}>
        <AbsoluteFill style={{opacity: ramp(frame - close, 0, 6)}}>
          <ProductPhoto which="upright" dur={total - close} zoom={[2.3, 2.7]} pan={[3, -3]} rotate={[-1, 1]} sweepStart={2} sweepDur={36} />
          <div style={{position: 'absolute', left: 140, bottom: 120}}>
            <FadeText start={4}>
              <Label color={C.beige}>Rostfritt stål · Återanvändbar behållare</Label>
            </FadeText>
            <GrowLine start={8} width={260} color={C.beige} style={{marginTop: 16}} />
          </div>
        </AbsoluteFill>
      </Sequence>
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};
