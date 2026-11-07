import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {C, FONT_SANS, FONT_SERIF} from '../config';

export const EASE = Easing.bezier(0.22, 1, 0.36, 1); // mjuk "expo out"
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/** 0→1 mellan frame a och a+d (med easing). */
export const ramp = (frame: number, a: number, d: number, ease = EASE) =>
  interpolate(frame, [a, a + d], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------- Typsnitt
const FONT_FACES = [
  ['Inter', 300, 'normal', 'inter-latin-300-normal.woff2'],
  ['Inter', 400, 'normal', 'inter-latin-400-normal.woff2'],
  ['Inter', 500, 'normal', 'inter-latin-500-normal.woff2'],
  ['Inter', 600, 'normal', 'inter-latin-600-normal.woff2'],
  ['Inter', 700, 'normal', 'inter-latin-700-normal.woff2'],
  ['Cormorant Garamond', 400, 'normal', 'cormorant-garamond-latin-400-normal.woff2'],
  ['Cormorant Garamond', 500, 'normal', 'cormorant-garamond-latin-500-normal.woff2'],
  ['Cormorant Garamond', 600, 'normal', 'cormorant-garamond-latin-600-normal.woff2'],
  ['Cormorant Garamond', 400, 'italic', 'cormorant-garamond-latin-400-italic.woff2'],
  ['Cormorant Garamond', 500, 'italic', 'cormorant-garamond-latin-500-italic.woff2'],
] as const;

export const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender('Laddar typsnitt'));
  useEffect(() => {
    Promise.all(
      FONT_FACES.map(([family, weight, style, file]) => {
        const ff = new FontFace(family, `url(${staticFile('fonts/' + file)})`, {
          weight: String(weight),
          style,
        });
        return ff.load().then((loaded) => {
          document.fonts.add(loaded);
        });
      }),
    )
      .then(() => continueRender(handle))
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [handle]);
  return null;
};

// ---------------------------------------------------------------- Filmkänsla
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.06}) => {
  const frame = useCurrentFrame();
  const x = (frame * 137) % 512;
  const y = (frame * 271) % 512;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile('img/noise.png')})`,
        backgroundPosition: `${x}px ${y}px`,
        opacity,
        mixBlendMode: 'overlay',
        pointerEvents: 'none',
      }}
    />
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.55}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

// ---------------------------------------------------------------- Text
type RiseProps = {
  text: string;
  start: number; // frame (lokal)
  end?: number; // frame då texten tonas ut
  size?: number;
  weight?: number;
  color?: string;
  serif?: boolean;
  italic?: boolean;
  tracking?: number; // em
  lineHeight?: number;
  align?: 'left' | 'center' | 'right';
  stagger?: number; // frames mellan ord
  style?: React.CSSProperties;
  upper?: boolean;
};

/** Ord som glider upp ur en mask med mjuk oskärpa – premium-reklamkänsla. */
export const RiseText: React.FC<RiseProps> = ({
  text,
  start,
  end,
  size = 64,
  weight = 600,
  color = C.white,
  serif = false,
  italic = false,
  tracking = -0.02,
  lineHeight = 1.12,
  align = 'center',
  stagger = 3,
  style,
}) => {
  const frame = useCurrentFrame();
  const lines = text.split('\n');
  let wi = 0;
  const out = end !== undefined ? ramp(frame, end, 12, EASE_IN_OUT) : 0;
  return (
    <div
      style={{
        fontFamily: serif ? FONT_SERIF : FONT_SANS,
        fontSize: size,
        fontWeight: weight,
        fontStyle: italic ? 'italic' : 'normal',
        letterSpacing: `${tracking}em`,
        lineHeight,
        color,
        textAlign: align,
        opacity: 1 - out,
        filter: out > 0 ? `blur(${out * 10}px)` : undefined,
        transform: `translateY(${-out * 20}px)`,
        ...style,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{whiteSpace: 'nowrap'}}>
          {line.split(' ').map((w, i) => {
            const t = ramp(frame, start + wi++ * stagger, 22);
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  overflow: 'hidden',
                  verticalAlign: 'top',
                  paddingBottom: '0.08em',
                  marginBottom: '-0.08em',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    transform: `translateY(${(1 - t) * 105}%)`,
                    opacity: t,
                    filter: t < 1 ? `blur(${(1 - t) * 6}px)` : undefined,
                  }}
                >
                  {w}
                </span>
                {i < line.split(' ').length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Enkel fade + lätt drift – för små etiketter och källhänvisningar. */
export const FadeText: React.FC<{
  start: number;
  end?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  dy?: number;
}> = ({start, end, children, style, dy = 12}) => {
  const frame = useCurrentFrame();
  const t = ramp(frame, start, 20);
  const o = end !== undefined ? 1 - ramp(frame, end, 10) : 1;
  return (
    <div style={{opacity: t * o, transform: `translateY(${(1 - t) * dy}px)`, ...style}}>{children}</div>
  );
};

export const Label: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({
  children,
  color = C.sand,
  style,
}) => (
  <div
    style={{
      fontFamily: FONT_SANS,
      fontSize: 18,
      fontWeight: 500,
      letterSpacing: '0.32em',
      textTransform: 'uppercase',
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Source: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = 'rgba(255,255,255,0.5)'}) => (
  <div
    style={{
      position: 'absolute',
      left: 120,
      bottom: 64,
      fontFamily: FONT_SANS,
      fontSize: 17,
      fontWeight: 400,
      letterSpacing: '0.02em',
      color,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------- Produkt
export type ProductKey = 'angle' | 'front' | 'upright';
export const PRODUCT_SRC: Record<ProductKey, {src: string; w: number; h: number}> = {
  angle: {src: 'img/freshfixer_angle_cutout.png', w: 765, h: 522},
  front: {src: 'img/freshfixer_front_cutout.png', w: 806, h: 362},
  upright: {src: 'img/freshfixer_upright_cutout.png', w: 807, h: 1279},
};

/**
 * Den frilagda produktbilden – oförändrad – med kontaktskugga och ett
 * diskret ljussvep (glans) som maskas exakt mot produktens form.
 */
export const Product: React.FC<{
  which?: ProductKey;
  width: number;
  sweepStart?: number; // frame
  sweepDur?: number;
  shadow?: number; // 0..1
  shadowColor?: string;
  style?: React.CSSProperties;
}> = ({which = 'angle', width, sweepStart, sweepDur = 40, shadow = 0.6, shadowColor = '0,0,0', style}) => {
  const frame = useCurrentFrame();
  const p = PRODUCT_SRC[which];
  const height = (width * p.h) / p.w;
  const url = staticFile(p.src);
  const s = sweepStart !== undefined ? ramp(frame, sweepStart, sweepDur, EASE_IN_OUT) : -1;
  return (
    <div style={{position: 'relative', width, height, ...style}}>
      {/* kontaktskugga */}
      <div
        style={{
          position: 'absolute',
          left: '6%',
          right: '6%',
          bottom: -height * 0.04,
          height: height * 0.16,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, rgba(${shadowColor},${0.55 * shadow}) 0%, rgba(${shadowColor},0) 70%)`,
          filter: 'blur(6px)',
        }}
      />
      <Img src={url} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
      {s > 0 && s < 1 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            WebkitMaskImage: `url(${url})`,
            WebkitMaskSize: '100% 100%',
            maskImage: `url(${url})`,
            maskSize: '100% 100%',
            background: `linear-gradient(105deg, rgba(255,255,255,0) ${s * 160 - 40}%, rgba(255,255,255,0.38) ${
              s * 160 - 25
            }%, rgba(255,255,255,0) ${s * 160 - 10}%)`,
            mixBlendMode: 'screen',
          }}
        />
      ) : null}
    </div>
  );
};

export const Fill: React.FC<{color: string; children?: React.ReactNode; style?: React.CSSProperties}> = ({
  color,
  children,
  style,
}) => <AbsoluteFill style={{backgroundColor: color, ...style}}>{children}</AbsoluteFill>;

/** Ken Burns-bild (cover) med långsam zoom/panorering. */
export const KenBurns: React.FC<{
  src: string;
  dur: number;
  from?: [number, number, number]; // scale, x%, y%
  to?: [number, number, number];
  style?: React.CSSProperties;
  filter?: string;
}> = ({src, dur, from = [1.05, 50, 50], to = [1.15, 50, 50], style, filter}) => {
  const frame = useCurrentFrame();
  const t = ramp(frame, 0, dur, Easing.linear);
  const s = lerp(from[0], to[0], t);
  const x = lerp(from[1], to[1], t);
  const y = lerp(from[2], to[2], t);
  return (
    <AbsoluteFill style={{overflow: 'hidden', ...style}}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: `${x}% ${y}%`,
          transform: `scale(${s})`,
          transformOrigin: `${x}% ${y}%`,
          filter,
        }}
      />
    </AbsoluteFill>
  );
};
