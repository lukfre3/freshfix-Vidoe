import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT_SANS, T, TEXT, f} from '../config';
import {FridgeInterior} from '../components/Fridge';
import {EASE, EASE_IN_OUT, Grain, RiseText, Vignette, lerp, ramp} from '../components/common';
import {FixedProduct} from './S5Fridges';

const S = T.scenes.finale;

export const S8Finale: React.FC = () => {
  const frame = useCurrentFrame();
  const L = (sec: number) => f(sec - S.start);
  const logo = L(S.logo);
  const t1 = L(S.t1);
  const t2 = L(S.t2);
  const t3 = L(S.t3);
  const t4 = L(S.t4);

  // 1) Långsam kameraåkning in mot produkten i ett exklusivt kylskåp
  const push = interpolate(frame, [0, logo], [1, 1.55], {extrapolateRight: 'clamp', easing: EASE_IN_OUT});
  const fridgeOut = ramp(frame, logo - 10, 14, EASE_IN_OUT);

  // 2) Logotyp – liten upptill under texterna, stor och centrerad i slutet
  const logoIn = ramp(frame, logo, 30, EASE);
  const toFinal = ramp(frame, t4, 26, EASE_IN_OUT);
  const logoH = lerp(250, 470, toFinal);
  const logoTop = lerp(90, 170, toFinal);
  const wordIn = ramp(frame, logo + 10, 30, EASE);

  return (
    <AbsoluteFill style={{background: C.forest}}>
      {/* produkt i kylskåp */}
      {fridgeOut < 1 ? (
        <AbsoluteFill style={{opacity: 1 - fridgeOut}}>
          <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 62%'}}>
            <FridgeInterior variant="dark" />
            <FixedProduct dark sweepStart={20} />
          </AbsoluteFill>
          <Vignette strength={0.6} />
        </AbsoluteFill>
      ) : null}

      {/* varumärkesfond */}
      <AbsoluteFill
        style={{
          opacity: fridgeOut,
          background: `radial-gradient(ellipse at 50% 42%, #87917A 0%, ${C.green} 38%, #4F5945 100%)`,
        }}
      />

      {/* logotyp (verkliga logotypen, vit) */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: logoTop,
          height: logoH,
          transform: `translateX(-50%) scale(${0.96 + logoIn * 0.04})`,
          opacity: logoIn,
          filter: logoIn < 1 ? `blur(${(1 - logoIn) * 12}px)` : undefined,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Img src={staticFile('img/logo_icon_white.png')} style={{height: logoH * 0.76}} />
        <Img src={staticFile('img/logo_word_white.png')} style={{height: logoH * 0.15, marginTop: logoH * 0.07, opacity: wordIn}} />
      </div>

      {/* avslutande texter i steg */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingTop: 280}}>
        {frame < t2 ? <RiseText text={TEXT.finale.t1} start={t1} end={t2 - 12} size={64} weight={600} color={C.white} tracking={0.01} lineHeight={1.18} stagger={2} /> : null}
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingTop: 280}}>
        {frame >= t2 && frame < t3 ? <RiseText text={TEXT.finale.t2} start={t2} end={t3 - 12} size={72} weight={600} color={C.white} tracking={0.01} /> : null}
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingTop: 280}}>
        {frame >= t3 && frame < t4 ? <RiseText text={TEXT.finale.t3} start={t3} end={t4 - 10} size={64} weight={600} color={C.beige} tracking={0.01} lineHeight={1.18} stagger={2} /> : null}
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 760, width: '100%'}}>
        {frame >= t4 ? <RiseText text={TEXT.finale.t4} start={t4 + 14} size={58} weight={700} color={C.white} tracking={0.02} stagger={3} /> : null}
      </div>
      {/* tunn linje + sidfot */}
      <div style={{position: 'absolute', bottom: 92, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
        <div style={{height: 1, width: 360 * ramp(frame, t4 + 30, 30), background: 'rgba(238,231,219,0.6)'}} />
        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: 18,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(238,231,219,0.85)',
            opacity: ramp(frame, t4 + 36, 24),
          }}
        >
          {TEXT.finale.footer}
        </div>
      </div>
      <Vignette strength={0.3} />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};
