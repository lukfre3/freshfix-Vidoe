import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT_SANS, FONT_SERIF, T, TEXT, f} from '../config';
import {EASE, EASE_IN_OUT, FadeText, Grain, GrowLine, KenBurns, Label, RiseText, ramp} from '../components/common';

const S = T.scenes.sustain;

const Visual: React.FC<{i: number; dur: number}> = ({i, dur}) => {
  const frame = useCurrentFrame();
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
  if (i === 2)
    return (
      <AbsoluteFill style={{background: `linear-gradient(160deg, ${C.green} 0%, ${C.greenDark} 100%)`, alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: FONT_SERIF, fontSize: 190, fontWeight: 500, color: C.beige, opacity: ramp(frame, 4, 20), transform: `translateY(${(1 - ramp(frame, 4, 30)) * 30}px)`}}>
          Uppsala
        </div>
        <FadeText start={14}>
          <div style={{fontFamily: FONT_SANS, fontSize: 22, letterSpacing: '0.3em', color: 'rgba(238,231,219,0.75)'}}>59.8586° N · 17.6389° E</div>
        </FadeText>
        {/* pulserande platsmarkering */}
        <div style={{position: 'absolute', left: '50%', top: '22%', transform: 'translate(-50%,-50%)'}}>
          {[0, 1].map((k) => {
            const t = ((frame + k * 22) % 44) / 44;
            return (
              <div key={k} style={{position: 'absolute', left: -60 * t, top: -60 * t, width: 120 * t, height: 120 * t, borderRadius: '50%', border: `2px solid ${C.beige}`, opacity: (1 - t) * 0.7}} />
            );
          })}
          <div style={{position: 'absolute', left: -7, top: -7, width: 14, height: 14, borderRadius: 7, background: C.beige}} />
        </div>
      </AbsoluteFill>
    );
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
