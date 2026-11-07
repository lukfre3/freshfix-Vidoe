import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_SANS, FONT_SERIF, T, TEXT, f} from '../config';
import {EASE, EASE_IN_OUT, FadeText, Grain, GrowLine, KenBurns, Label, RiseText, ramp} from '../components/common';

const S = T.scenes.sustain;

const Visual: React.FC<{i: number; dur: number}> = ({i, dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (i === 0) return <KenBurns src="img/freshfixer_upright.jpg" dur={dur} from={[1.9, 30, 40]} to={[2.15, 36, 46]} />;
  if (i === 1)
    return (
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <OffthreadVideo
          src={staticFile('video/stangning_tom.mp4')}
          startFrom={8}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%', transform: 'scale(1.35)', transformOrigin: '45% 28%'}}
        />
      </AbsoluteFill>
    );
  if (i === 2) {
    // Karta över Uppland/Stockholm (er bild, omfärgad) – nålen faller ned över Uppsala
    const W = 960;
    const H = (W * 1478) / 1064;
    const ux = 0.4746 * W;
    const uy = 0.4973 * H;
    const top = 560 - uy;
    const z = 1 + 0.22 * ramp(frame, 0, dur, Easing.bezier(0.33, 0, 0.2, 1));
    const drop = spring({frame: frame - 8, fps, config: {damping: 9, stiffness: 140, mass: 0.7}});
    const chip = ramp(frame, 22, 12, EASE);
    return (
      <AbsoluteFill style={{background: C.charcoal, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top, width: W, height: H, transform: `scale(${z})`, transformOrigin: `${ux}px ${uy}px`}}>
          <Img src={staticFile('img/karta_uppland.jpg')} style={{width: W, height: H}} />
          {/* pulserande ringar */}
          {[0, 1, 2].map((k) => {
            const t = (((frame - 14 + k * 12) % 36) + 36) % 36 / 36;
            return frame > 14 ? (
              <div key={k} style={{position: 'absolute', left: ux - 70 * t, top: uy - 70 * t * 0.6, width: 140 * t, height: 140 * t * 0.6, borderRadius: '50%', border: `2px solid ${C.white}`, opacity: (1 - t) * 0.8}} />
            ) : null;
          })}
          {/* kartnål */}
          <div style={{position: 'absolute', left: ux - 32, top: uy - 86 - (1 - drop) * 300, opacity: Math.min(1, drop * 2)}}>
            <svg width={64} height={88} viewBox="0 0 64 88" style={{overflow: 'visible', filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.45))'}}>
              <path d="M32 86 C 32 86 4 52 4 32 A 28 28 0 1 1 60 32 C 60 52 32 86 32 86 Z" fill={C.white} />
              <circle cx={32} cy={31} r={12} fill={C.green} />
            </svg>
          </div>
          <div style={{position: 'absolute', left: ux - 40 * (1 - drop * 0.6), top: uy - 6, width: 80 * (0.4 + 0.6 * drop) - 0, height: 12, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', filter: 'blur(3px)', opacity: drop}} />
        </div>
        {/* etikett */}
        <div style={{position: 'absolute', left: 80, bottom: 90, opacity: chip, transform: `translateY(${(1 - chip) * 20}px)`}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 26px', borderRadius: 40, background: 'rgba(27,28,26,0.8)', border: '1px solid rgba(255,255,255,0.3)'}}>
            <div style={{width: 12, height: 12, borderRadius: 6, background: C.green}} />
            <div style={{fontFamily: FONT_SANS, fontSize: 28, fontWeight: 600, color: C.white}}>Här tillverkas FreshFixer</div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }
  if (i === 3) return <KenBurns src="img/forpackning.jpg" dur={dur} from={[1.15, 50, 52]} to={[1.3, 50, 56]} />;
  return (
    <AbsoluteFill style={{background: C.beige, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 40}}>
      {['img/sdg12.png', 'img/sdg13.png'].map((src, k) => {
        const t = ramp(frame, 4 + k * 6, 22, EASE);
        return (
          <Img
            key={src}
            src={staticFile(src)}
            style={{width: 330, height: 330, borderRadius: 8, opacity: t, transform: `translateY(${(1 - t) * 40}px) scale(${0.94 + t * 0.06})`, boxShadow: '0 30px 60px rgba(40,35,25,0.18)'}}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Panel: React.FC<{i: number; dur: number}> = ({i, dur}) => {
  const frame = useCurrentFrame();
  const left = i % 2 === 0; // bild till vänster eller höger
  const wipe = ramp(frame, 0, 9, EASE_IN_OUT);
  const textBg = i === 4 ? C.greenDark : i === 2 ? C.beige : C.charcoal;
  const textCol = i === 2 ? C.charcoal : C.white;
  const subCol = i === 2 ? C.green : 'rgba(238,231,219,0.7)';
  return (
    <AbsoluteFill style={{background: textBg}}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 960,
          left: left ? 0 : 960,
          overflow: 'hidden',
          clipPath: left ? `inset(0 ${(1 - wipe) * 100}% 0 0)` : `inset(0 0 0 ${(1 - wipe) * 100}%)`,
        }}
      >
        <Visual i={i} dur={dur} />
      </div>
      <div style={{position: 'absolute', top: 0, bottom: 0, left: left ? 960 : 0, width: 960, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 110}}>
        <FadeText start={0}>
          <Label color={i === 2 ? C.green : C.sand}>Hållbarhet · 0{i + 1}</Label>
        </FadeText>
        <GrowLine start={3} width={90} color={i === 2 ? C.green : C.sand} style={{margin: '16px 0 22px'}} />
        <RiseText text={TEXT.sustain[i].title} start={2} size={i === 3 || i === 4 ? 56 : 66} weight={600} align="left" color={textCol} tracking={-0.015} stagger={1} dur={12} />
        <div style={{height: 24}} />
        <FadeText start={10}>
          <div style={{fontFamily: FONT_SERIF, fontStyle: 'italic', fontSize: 34, color: subCol}}>{TEXT.sustain[i].sub}</div>
        </FadeText>
      </div>
      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
};

export const S6Sustain: React.FC = () => {
  const each = f(S.each);
  return (
    <AbsoluteFill>
      {TEXT.sustain.map((_, i) => (
        <Sequence key={i} from={i * each} durationInFrames={each}>
          <Panel i={i} dur={each} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
