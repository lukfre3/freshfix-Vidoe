import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT_SANS, FONT_SERIF, T, TEXT, f} from '../config';
import {Bokeh, EASE, EASE_IN_OUT, FadeText, Grain, GrowLine, Label, LogoReveal, ProductPhoto, RiseText, ramp} from '../components/common';

const S = T.scenes.solution;

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
  const presOut = ramp(frame, product - 6, 8, EASE_IN_OUT);

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

      {/* "Vi presenterar FreshFixer." */}
      <Sequence from={present} durationInFrames={product - present + 2}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: 1 - presOut}}>
          <FadeText start={0}>
            <Label color={C.green} style={{fontSize: 22, textAlign: 'center'}}>
              {TEXT.solution.presentSmall}
            </Label>
          </FadeText>
          <div style={{height: 20}} />
          <div style={{transform: `scale(${interpolate(frame - present, [0, product - present], [0.96, 1.04])})`}}>
            <RiseText text={TEXT.solution.product + '.'} start={4} size={210} weight={500} serif color={C.charcoal} tracking={-0.01} dur={18} />
          </div>
        </AbsoluteFill>
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
