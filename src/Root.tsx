import React from 'react';
import {Composition} from 'remotion';
import {FreshFixFilm} from './FreshFixFilm';
import {FPS, T} from './config';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="FreshFix"
    component={FreshFixFilm}
    durationInFrames={Math.round(T.total * FPS)}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
