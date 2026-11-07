import React from 'react';
import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT_SANS, T, TEXT, f} from '../config';
import {BinDrop} from '../components/LineArt';
import {Bokeh, EASE, Grain, ProductPhoto, RiseText, Vignette, ramp} from '../components/common';

const S = T.scenes.why;

const Beat: React.FC<{i: number; dur: number}> = ({i, dur}) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, dur], [1, 1.05]);
  const bg = [C.charcoal, C.charcoal, C.forest, C.green][i];
  return (
    <AbsoluteFill style={{background: bg}}>
      {/* diskret bakgrundsmotiv */}
      <AbsoluteFill style={{transform: `scale(${z})`, opacity: 0.22}}>
        {i === 0 ? (
          <div style={{position: 'absolute', left: 560, top: 140, width: 800, height: 800}}>
            <BinDrop start={-60} color={C.beige} />
          </div>
        ) : null}
        {i === 3 ? (
          <Img src={staticFile('img/logo_icon_white.png')} style={{position: 'absolute', left: 960 - 200, top: 140, height: 800}} />
        ) : null}
      </AbsoluteFill>
      {i === 1 ? (
        <AbsoluteFill style={{opacity: 0.28}}>
          <ProductPhoto which="front" dur={dur} zoom={[1.5, 1.75]} sweepStart={2} sweepDur={30} />
        </AbsoluteFill>
      ) : null}
      <Bokeh count={12} opacity={0.15} seed={i + 11} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `scale(${1.08 - 0.08 * ramp(frame, 0, 14, EASE)})`}}>
        <RiseText text={TEXT.why[i]} start={0} stagger={1} dur={12} size={i === 3 ? 130 : 104} weight={i === 3 ? 700 : 600} color={C.white} tracking={-0.03} />
      </AbsoluteFill>
      {i === 3 ? (
        <div style={{position: 'absolute', bottom: 120, width: '100%', display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap'}}>
          {TEXT.whyPillars.map((p, k) => {
            const t = ramp(frame, 3 + k * 2, 10, EASE);
            return (
              <div
                key={p}
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 19,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  color: C.beige,
                  padding: '10px 20px',
                  borderRadius: 30,
                  border: '1px solid rgba(238,231,219,0.45)',
                  opacity: t,
                  transform: `translateY(${(1 - t) * 14}px)`,
                }}
              >
                {p}
              </div>
            );
          })}
        </div>
      ) : null}
      <Vignette strength={0.45} />
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};

export const S7Why: React.FC = () => {
  const each = f(S.each);
  return (
    <AbsoluteFill>
      {TEXT.why.map((_, i) => (
        <Sequence key={i} from={i * each} durationInFrames={each}>
          <Beat i={i} dur={each} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
