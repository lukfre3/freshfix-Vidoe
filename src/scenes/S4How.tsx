import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT_SANS, FONT_SERIF, T, TEXT, f} from '../config';
import {RealGranules} from '../components/RealGranules';
import {EASE, FadeText, Grain, Label, RiseText, Vignette, ramp} from '../components/common';

const S = T.scenes.how;

const Material: React.FC<{kind: 'kol' | 'zeolit'; dur: number}> = ({kind, dur}) => {
  const frame = useCurrentFrame();
  const kol = kind === 'kol';
  // svart kol syns bäst mot ljus bakgrund – ljus zeolit mot mörk
  const dark = !kol;
  const tx = kol ? TEXT.how.kol : TEXT.how.zeolit;
  const fg = dark ? C.white : C.charcoal;
  const zoom = interpolate(frame, [0, dur], [1, 1.06]);
  return (
    <AbsoluteFill
      style={{
        background: dark
          ? 'radial-gradient(ellipse at 65% 40%, #34373a 0%, #17181a 55%, #0a0a0a 100%)'
          : `radial-gradient(ellipse at 65% 40%, #FBF9F5 0%, #EEEAE3 50%, ${C.beigeDeep} 100%)`,
        opacity: ramp(frame, 0, 8),
      }}
    >
      {/* ljuskägla för studiokänsla */}
      <AbsoluteFill
        style={{
          background: dark
            ? 'radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 50%)'
            : 'radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 50%)',
        }}
      />
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        {/* riktiga bitar från era foton – skarpa i mitten, suddiga när de är nära/långt bort */}
        <RealGranules kind={kind} count={34} size={kol ? 150 : 120} speed={2.3} seed={kol ? 3 : 7} start={-210} region={{x0: 0.38, x1: 1}} />
        <RealGranules kind={kind} count={5} size={kol ? 330 : 270} speed={3.4} seed={kol ? 21 : 27} start={-120} region={{x0: 0, x1: 1}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 140, top: 390}}>
        <FadeText start={2}>
          <Label color={dark ? C.sand : C.green}>{kol ? 'Material 01' : 'Material 02'}</Label>
        </FadeText>
        <div style={{height: 18}} />
        <RiseText text={tx.title} start={4} size={128} weight={400} align="left" color={fg} tracking={0.08} stagger={4} />
        <div style={{height: 16}} />
        <RiseText text={tx.line} start={14} size={42} weight={500} align="left" color={dark ? C.beige : C.charcoal} tracking={-0.01} stagger={2} />
        <FadeText start={24} style={{marginTop: 26}}>
          <div style={{fontFamily: FONT_SERIF, fontStyle: 'italic', fontSize: 34, color: dark ? 'rgba(238,231,219,0.7)' : C.green}}>{tx.amount}</div>
        </FadeText>
      </div>
      <Vignette strength={dark ? 0.6 : 0.18} />
    </AbsoluteFill>
  );
};

const Pase: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const photoIn = ramp(frame, 0, 20);
  const z = interpolate(frame, [0, dur], [1.0, 1.08]);
  return (
    <AbsoluteFill style={{background: C.charcoal}}>
      {/* verkligt foto på filterpåsen – oförändrat */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1000,
          height: 1080,
          overflow: 'hidden',
          opacity: photoIn,
        }}
      >
        <Img
          src={staticFile('img/filterpase.jpg')}
          style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 50%', transform: `scale(${z})`, transformOrigin: '48% 50%'}}
        />
        <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(27,28,26,0) 60%, rgba(27,28,26,1) 100%)'}} />
      </div>
      {/* material som "fylls" i påsen – zeolit i vänster fack, kol i höger */}
      <AbsoluteFill style={{opacity: 1 - ramp(frame, 46, 14)}}>
        <RealGranules kind="kol" count={26} size={60} speed={7} seed={11} start={-14} spread={36} region={{x0: 0.258, x1: 0.37}} stopY={330} />
        <RealGranules kind="zeolit" count={18} size={48} speed={7} seed={13} start={-10} spread={36} region={{x0: 0.162, x1: 0.224}} stopY={330} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 1080, top: 380, width: 760}}>
        <FadeText start={4}>
          <Label color={C.sand}>Filterpåsen</Label>
        </FadeText>
        <div style={{height: 22}} />
        <RiseText text={TEXT.how.pase.title} start={8} size={76} weight={600} align="left" color={C.white} tracking={-0.02} />
        <div style={{height: 26}} />
        <FadeText start={26}>
          <div style={{fontFamily: FONT_SANS, fontSize: 32, lineHeight: 1.4, color: 'rgba(238,231,219,0.8)', width: 680}}>{TEXT.how.pase.line}</div>
        </FadeText>
        <FadeText start={34} style={{display: 'flex', gap: 22, marginTop: 34}}>
          {[
            ['55 g', 'aktivt kol', '#2A2B2D'],
            ['15 g', 'zeolit', '#D9D4C8'],
          ].map(([a, b, col]) => (
            <div key={a} style={{display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', borderRadius: 40, border: '1px solid rgba(238,231,219,0.25)'}}>
              <div style={{width: 18, height: 18, borderRadius: 9, background: col, border: '1px solid rgba(255,255,255,0.4)'}} />
              <div style={{fontFamily: FONT_SANS, fontSize: 24, color: C.beige}}>
                <b style={{fontWeight: 600}}>{a}</b> {b}
              </div>
            </div>
          ))}
        </FadeText>
      </div>
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

const Montering: React.FC = () => {
  const frame = useCurrentFrame();
  const inT = ramp(frame, 0, 18, EASE);
  return (
    <AbsoluteFill style={{background: `linear-gradient(140deg, ${C.beige} 0%, ${C.beigeDeep} 100%)`}}>
      {/* verkligt klipp: filterpåsen läggs i och FreshFixer stängs (slowmotion) */}
      <div
        style={{
          position: 'absolute',
          right: 120,
          top: 90,
          width: 900,
          height: 900,
          borderRadius: 28,
          overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(40,35,25,0.25)',
          opacity: inT,
          transform: `translateY(${(1 - inT) * 40}px)`,
        }}
      >
        <OffthreadVideo
          src={staticFile('video/stangning_med_pase.mp4')}
          playbackRate={0.7}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 35%', transform: 'scale(1.18)', transformOrigin: '42% 30%'}}
        />
      </div>
      <div style={{position: 'absolute', left: 140, top: 380}}>
        <FadeText start={4}>
          <Label color={C.green}>Så fungerar det</Label>
        </FadeText>
        <div style={{height: 22}} />
        <RiseText text={TEXT.how.montering.title} start={8} size={70} weight={600} align="left" color={C.charcoal} tracking={-0.02} />
        <div style={{height: 26}} />
        <FadeText start={26}>
          <div style={{fontFamily: FONT_SERIF, fontStyle: 'italic', fontSize: 38, color: C.green}}>{TEXT.how.montering.line}</div>
        </FadeText>
      </div>
      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
};

export const S4How: React.FC = () => {
  const L = (sec: number) => f(sec - S.start);
  const k = L(S.kol);
  const z = L(S.zeolit);
  const p = L(S.pase);
  const m = L(S.montering);
  const e = L(S.end);
  return (
    <AbsoluteFill>
      <Sequence from={k} durationInFrames={z - k}>
        <Material kind="kol" dur={z - k} />
      </Sequence>
      <Sequence from={z} durationInFrames={p - z}>
        <Material kind="zeolit" dur={p - z} />
      </Sequence>
      <Sequence from={p} durationInFrames={m - p}>
        <Pase dur={m - p} />
      </Sequence>
      <Sequence from={m} durationInFrames={e - m}>
        <Montering />
      </Sequence>
    </AbsoluteFill>
  );
};
