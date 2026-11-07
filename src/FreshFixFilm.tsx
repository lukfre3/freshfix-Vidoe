import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {T, f} from './config';
import {EASE_IN_OUT, FontLoader, ramp} from './components/common';
import {C} from './config';
import {S1Problem} from './scenes/S1Problem';
import {S2Facts} from './scenes/S2Facts';
import {S3Solution} from './scenes/S3Solution';
import {S4How} from './scenes/S4How';
import {S6Sustain} from './scenes/S6Sustain';
import {S7Why} from './scenes/S7Why';
import {S8Finale} from './scenes/S8Finale';

const SC = T.scenes;
const scenes: [keyof typeof SC, React.FC][] = [
  ['problem', S1Problem],
  ['facts', S2Facts],
  ['solution', S3Solution],
  ['how', S4How],
  ['sustain', S6Sustain],
  ['why', S7Why],
  ['finale', S8Finale],
];

/** Snabb varumärkesövergång: en grön panel sveper över bilden i klippet. */
const BrandWipe: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const d = 7;
  if (frame < at - d || frame > at + d) return null;
  const inT = ramp(frame, at - d, d, EASE_IN_OUT);
  const outT = ramp(frame, at, d, EASE_IN_OUT);
  const left = -130 + inT * 130 + outT * 130; // % (täcker helt vid klippet)
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: '-10%', bottom: '-10%', left: `${left}%`, width: '130%', background: C.green, transform: 'skewX(-12deg)'}} />
      <div style={{position: 'absolute', top: '-10%', bottom: '-10%', left: `${left + 128}%`, width: '3%', background: C.beige, transform: 'skewX(-12deg)'}} />
    </AbsoluteFill>
  );
};

const WIPES: (keyof typeof SC)[] = ['facts', 'how', 'sustain', 'why', 'finale'];

export const FreshFixFilm: React.FC = () => {
  const frame = useCurrentFrame();
  const end = f(T.total);
  const fadeOut = interpolate(frame, [end - 8, end], [1, 0.0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <FontLoader />
      <AbsoluteFill style={{opacity: fadeOut}}>
        {scenes.map(([key, Comp]) => {
          const s = SC[key];
          return (
            <Sequence key={key} from={f(s.start)} durationInFrames={f(s.end) - f(s.start)} name={key}>
              <Comp />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      {WIPES.map((k) => (
        <BrandWipe key={k} at={f(SC[k].start)} />
      ))}
      <Audio src={staticFile('audio/soundtrack.wav')} />
    </AbsoluteFill>
  );
};
