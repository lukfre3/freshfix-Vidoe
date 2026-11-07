import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {C, T, TEXT, f} from '../config';
import {BinDrop, ForgottenFridge} from '../components/LineArt';
import {EASE_IN_OUT, Grain, RiseText, Vignette, ramp} from '../components/common';

const S = T.scenes.problem;

export const S1Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const total = f(S.end - S.start);
  const phaseB = f(S.phaseB - S.start);
  const fadeIn = ramp(frame, 0, 24);
  const push = interpolate(frame, [0, total], [1, 1.08]);
  // långsam "kamera"-panorering
  const panA = interpolate(frame, [0, phaseB], [0, -30]);
  const crossA = 1 - ramp(frame, phaseB - 8, 14, EASE_IN_OUT);
  const crossB = ramp(frame, phaseB - 6, 14, EASE_IN_OUT);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 70% 40%, #2a2c2a 0%, ${C.charcoal} 55%, #0d0e0d 100%)`, opacity: fadeIn}}>
      {/* Fas A: kylskåp med bortglömd mat */}
      <AbsoluteFill style={{opacity: crossA}}>
        <div style={{position: 'absolute', right: 120, top: 120, width: 820, height: 820, transform: `scale(${push}) translateX(${panA}px)`, opacity: 0.92}}>
          <ForgottenFridge start={6} color="rgba(238,231,219,0.92)" />
        </div>
      </AbsoluteFill>
      {/* Fas B: maten slängs */}
      <AbsoluteFill style={{opacity: crossB}}>
        <Sequence from={phaseB}>
          <div style={{position: 'absolute', right: 160, top: 80, width: 820, height: 820, transform: `scale(${push})`}}>
            <BinDrop start={0} color="rgba(238,231,219,0.92)" />
          </div>
        </Sequence>
      </AbsoluteFill>

      <div style={{position: 'absolute', left: 140, top: 380, width: 900}}>
        <RiseText
          text={TEXT.problem.t1}
          start={f(S.text1 - S.start)}
          end={f(S.text2 - S.start) - 10}
          size={84}
          weight={600}
          align="left"
          tracking={-0.03}
        />
      </div>
      <div style={{position: 'absolute', left: 140, top: 380, width: 900}}>
        <RiseText
          text={TEXT.problem.t2}
          start={f(S.text2 - S.start)}
          end={total - 12}
          size={72}
          weight={600}
          align="left"
          tracking={-0.03}
          color={C.beige}
        />
      </div>
      <Vignette strength={0.6} />
      <Grain opacity={0.08} />
    </AbsoluteFill>
  );
};

