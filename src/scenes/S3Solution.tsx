import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT_SANS, FONT_SERIF, T, TEXT, f} from '../config';
import {LogoFridge} from '../components/LineArt';
import {EASE, EASE_IN_OUT, FadeText, Grain, KenBurns, Label, Product, RiseText, Vignette, ramp} from '../components/common';

const S = T.scenes.solution;

export const S3Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const L = (sec: number) => f(sec - S.start);
  const total = L(S.end);
  const present = L(S.present);
  const product = L(S.product);
  const close = L(S.productClose);

  // mörkt → ljust: kylskåpsljuset tänds
  const light = ramp(frame, 0, 30, EASE_IN_OUT);
  const open = ramp(frame, 14, 40, EASE);
  const fridgeOut = ramp(frame, present - 12, 14, EASE_IN_OUT);

  // presentation
  const presOut = ramp(frame, product - 8, 10, EASE_IN_OUT);
  const pIn = ramp(frame, product, 30, EASE);
  const pScale = interpolate(frame, [product, close], [0.94, 1.04]);

  return (
    <AbsoluteFill style={{background: C.beige}}>
      {/* övergång från mörker */}
      <AbsoluteFill style={{background: C.charcoal, opacity: 1 - light}} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 70% 50%, rgba(255,250,240,${0.9 * open}) 0%, rgba(255,250,240,0) ${20 + open * 40}%)`,
          opacity: 1 - fridgeOut,
        }}
      />
      {/* kylskåpet ur logotypen öppnas */}
      <div style={{position: 'absolute', right: 180, top: 170, width: 620, height: 760, opacity: (1 - fridgeOut) * light}}>
        <LogoFridge start={4} color={C.greenDark} open={open} />
      </div>
      <div style={{position: 'absolute', left: 140, top: 330, opacity: 1 - fridgeOut}}>
        <RiseText text={TEXT.solution.question} start={L(S.question)} size={78} weight={600} align="left" color={C.charcoal} tracking={-0.03} />
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
          <RiseText text={TEXT.solution.product + '.'} start={8} size={200} weight={500} serif color={C.charcoal} tracking={-0.01} />
        </AbsoluteFill>
      </Sequence>

      {/* Produkten – hjältebild */}
      <Sequence from={product} durationInFrames={close - product + 8}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 55%, #FBF8F2 0%, ${C.beige} 45%, ${C.beigeDeep} 100%)`,
            opacity: 1 - ramp(frame - product, close - product, 8),
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 560,
              transform: `translate(-50%, -50%) scale(${pScale})`,
              opacity: pIn,
              filter: pIn < 1 ? `blur(${(1 - pIn) * 14}px)` : undefined,
            }}
          >
            <Product which="angle" width={820} sweepStart={18} sweepDur={36} shadow={0.7} />
          </div>
          <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center'}}>
            <div style={{fontFamily: FONT_SERIF, fontWeight: 500, fontSize: 84, color: C.charcoal, opacity: ramp(frame - product, 8, 20)}}>FreshFixer</div>
          </div>
          <FadeText start={18} style={{position: 'absolute', bottom: 110, width: '100%', textAlign: 'center'}}>
            <div style={{fontFamily: FONT_SANS, fontSize: 22, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.green}}>
              {TEXT.solution.tagline}
            </div>
          </FadeText>
        </AbsoluteFill>
      </Sequence>

      {/* Makrobild på det rostfria stålet */}
      <Sequence from={close} durationInFrames={total - close}>
        <AbsoluteFill style={{opacity: ramp(frame - close, 0, 8)}}>
          <KenBurns src="img/freshfixer_upright.jpg" dur={total - close} from={[2.2, 46, 30]} to={[2.6, 50, 36]} />
          <AbsoluteFill
            style={{
              background: `linear-gradient(105deg, rgba(255,255,255,0) ${ramp(frame - close, 4, 40) * 160 - 40}%, rgba(255,255,255,0.22) ${
                ramp(frame - close, 4, 40) * 160 - 25
              }%, rgba(255,255,255,0) ${ramp(frame - close, 4, 40) * 160 - 10}%)`,
              mixBlendMode: 'screen',
            }}
          />
          <Vignette strength={0.5} />
          <div style={{position: 'absolute', left: 140, bottom: 120}}>
            <FadeText start={8}>
              <Label color={C.beige}>Rostfritt stål · Återanvändbar behållare</Label>
            </FadeText>
          </div>
        </AbsoluteFill>
      </Sequence>
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

