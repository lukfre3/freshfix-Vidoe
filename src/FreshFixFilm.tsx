import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {T, f} from './config';
import {FontLoader} from './components/common';
import {S1Problem} from './scenes/S1Problem';
import {S2Facts} from './scenes/S2Facts';
import {S3Solution} from './scenes/S3Solution';
import {S4How} from './scenes/S4How';
import {S5Fridges} from './scenes/S5Fridges';
import {S6Sustain} from './scenes/S6Sustain';
import {S7Why} from './scenes/S7Why';
import {S8Finale} from './scenes/S8Finale';

const SC = T.scenes;
const scenes: [keyof typeof SC, React.FC][] = [
  ['problem', S1Problem],
  ['facts', S2Facts],
  ['solution', S3Solution],
  ['how', S4How],
  ['fridges', S5Fridges],
  ['sustain', S6Sustain],
  ['why', S7Why],
  ['finale', S8Finale],
];

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
      <Audio src={staticFile('audio/soundtrack.wav')} />
    </AbsoluteFill>
  );
};
