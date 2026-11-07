import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_SANS, FONT_SERIF, T, TEXT, f} from '../config';
import {Bokeh, EASE, EASE_IN_OUT, FadeText, Grain, Label, RiseText, Source, Vignette, ramp} from '../components/common';

const S = T.scenes.facts;

const fmt = (n: number) => Math.round(n).toLocaleString('sv-SE').replace(/ | /g, ' ');

/** Prickmatris – varje prick = 1 kg (fakta 1 och 2). */
const DotGrid: React.FC<{count: number; cols: number; highlight?: number; start: number; dur: number}> = ({
  count,
  cols,
  highlight = 0,
  start,
  dur,
}) => {
  const frame = useCurrentFrame();
  const gap = 34;
  return (
    <div style={{position: 'relative', width: cols * gap, height: Math.ceil(count / cols) * gap}}>
      {Array.from({length: count}).map((_, i) => {
        const t = ramp(frame, start + (i / count) * dur, 10);
        const hi = i < highlight;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: (i % cols) * gap,
              top: Math.floor(i / cols) * gap,
              width: 14,
              height: 14,
              borderRadius: 7,
              background: hi ? C.sand : C.green,
              opacity: t * (hi ? 1 : 0.85),
              transform: `scale(${0.3 + t * 0.7})`,
            }}
          />
        );
      })}
    </div>
  );
};

/** Två vuxna och två barn – var och en "kostar" sin del av matsvinnet. */
const Person: React.FC<{child?: boolean; start: number; color: string}> = ({child = false, start, color}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame: frame - start, fps, config: {damping: 11, stiffness: 160, mass: 0.7}});
  const h = child ? 185 : 265;
  const draw = ramp(frame, start, 18);
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 128}}>
      <div style={{height: 265, display: 'flex', alignItems: 'flex-end'}}>
        <svg
          viewBox="0 0 100 200"
          style={{height: h, overflow: 'visible', transform: `translateY(${(1 - pop) * 40}px) scale(${0.6 + 0.4 * pop})`, transformOrigin: '50% 100%', opacity: Math.min(1, pop * 1.5)}}
        >
          <circle cx={50} cy={30} r={21} fill="none" stroke={color} strokeWidth={4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
          <path
            d="M 14 198 V 104 Q 14 66 50 66 Q 86 66 86 104 V 198"
            fill={color}
            fillOpacity={0.12 * draw}
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - draw}
          />
        </svg>
      </div>
      <div
        style={{
          marginTop: 16,
          fontFamily: FONT_SANS,
          fontSize: 23,
          fontWeight: 600,
          color: C.sand,
          fontVariantNumeric: 'tabular-nums',
          opacity: ramp(frame, start + 10, 12),
          transform: `translateY(${(1 - ramp(frame, start + 10, 16)) * 10}px)`,
          whiteSpace: 'nowrap',
        }}
      >
        −1 330 kr
      </div>
    </div>
  );
};

const Family: React.FC = () => (
  <div>
    <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between'}}>
      <Person start={8} color={C.beige} />
      <Person start={13} color={C.beige} />
      <Person child start={18} color={C.green} />
      <Person child start={23} color={C.green} />
    </div>
    <div style={{height: 2, background: 'rgba(238,231,219,0.25)', margin: '18px 0 16px'}} />
    <FadeText start={36}>
      <Label color="rgba(238,231,219,0.6)" style={{fontSize: 16, letterSpacing: '0.24em', textAlign: 'center'}}>
        2 vuxna + 2 barn ≈ 5 300 kr / år
      </Label>
    </FadeText>
  </div>
);

const Fact: React.FC<{i: number; dur: number}> = ({i, dur}) => {
  const frame = useCurrentFrame();
  const fact = TEXT.facts[i];
  const count = interpolate(frame, [6, 46], [0, fact.value], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE,
  });
  const out = ramp(frame, dur - 10, 10, EASE_IN_OUT);
  const lineW = ramp(frame, 4, 40);
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <div style={{position: 'absolute', left: 140, top: 150, display: 'flex', alignItems: 'center', gap: 24}}>
        <FadeText start={0}>
          <Label color={C.sand}>{fact.index} / 03</Label>
        </FadeText>
        <div style={{height: 1, width: 220 * lineW, background: 'rgba(238,231,219,0.35)'}} />
        <FadeText start={4}>
          <Label color="rgba(238,231,219,0.55)">Matsvinn i Sverige</Label>
        </FadeText>
      </div>
      <div style={{position: 'absolute', left: 130, top: 250}}>
        <div
          style={{
            fontFamily: FONT_SANS,
            fontWeight: 600,
            fontSize: i === 2 ? 140 : 260,
            letterSpacing: '-0.05em',
            color: C.white,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            opacity: ramp(frame, 2, 14),
            transform: `translateY(${(1 - ramp(frame, 2, 26)) * 40}px) scale(${1.06 - 0.06 * ramp(frame, 2, 30)})`,
            transformOrigin: '0% 100%',
            whiteSpace: 'nowrap',
          }}
        >
          {fmt(count)}
          <span style={{color: C.sand, fontWeight: 400}}>{fact.suffix}</span>
        </div>
        <div style={{marginTop: 36, width: i === 2 ? 1100 : 900}}>
          <RiseText text={fact.line} start={18} size={46} weight={500} align="left" color={C.beige} tracking={-0.015} stagger={2} />
        </div>
        <FadeText start={36} style={{marginTop: 22}}>
          <div style={{fontFamily: FONT_SERIF, fontStyle: 'italic', fontSize: 36, color: 'rgba(238,231,219,0.7)'}}>{fact.sub}</div>
        </FadeText>
      </div>
      {i < 2 ? (
        <div style={{position: 'absolute', right: 150, top: i === 0 ? 300 : 380}}>
          <DotGrid count={fact.value} cols={i === 0 ? 13 : 9} highlight={i === 1 ? 16 : 0} start={6} dur={46} />
          <FadeText start={50} style={{marginTop: 20}}>
            <Label color="rgba(238,231,219,0.5)" style={{fontSize: 14, letterSpacing: '0.24em'}}>
              {i === 0 ? (
                '1 prick = 1 kg'
              ) : (
                <>
                  <span style={{color: C.sand}}>● soppåsen</span>
                  {'   '}
                  <span style={{color: C.green}}>● vasken</span>
                </>
              )}
            </Label>
          </FadeText>
        </div>
      ) : (
        <div style={{position: 'absolute', right: 110, top: 300, width: 540}}>
          <Family />
        </div>
      )}
      <FadeText start={30}>
        <Source>{fact.source}</Source>
      </FadeText>
    </AbsoluteFill>
  );
};

export const S2Facts: React.FC = () => {
  const items = S.items.map((x) => f(x - S.start));
  const end = f(S.end - S.start);
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${C.charcoal2} 0%, ${C.charcoal} 60%, #121312 100%)`}}>
      {items.map((st, i) => {
        const dur = (i < items.length - 1 ? items[i + 1] : end) - st;
        return (
          <Sequence key={i} from={st} durationInFrames={dur}>
            <Fact i={i} dur={dur} />
          </Sequence>
        );
      })}
      <Bokeh count={12} opacity={0.1} seed={5} />
      <Vignette strength={0.45} />
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};
