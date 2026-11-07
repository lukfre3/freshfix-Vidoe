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
  dur?: number; // frames per ord-animation
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
  dur = 22,
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
            const t = ramp(frame, start + wi++ * stagger, dur);
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
/**
 * FreshFixer visas ALLTID med era hela, oredigerade studiofoton (ingen frilagd
 * kant). Kameran zoomar/panorerar mot produkten och ett ljussvep glider över stålet.
 */
export type ProductKey = 'angle' | 'front' | 'upright';
export const PRODUCT_PHOTO: Record<ProductKey, {src: string; cx: number; cy: number}> = {
  angle: {src: 'img/freshfixer_angle.jpg', cx: 48.4, cy: 53.6},
  front: {src: 'img/freshfixer_front.jpg', cx: 49.8, cy: 51.3},
  upright: {src: 'img/freshfixer_upright.jpg', cx: 46.5, cy: 49.4},
};

export const ProductPhoto: React.FC<{
  which?: ProductKey;
  dur: number; // frames för kamerarörelsen
  zoom?: [number, number];
  pan?: [number, number]; // procentuell förskjutning i x (start, slut)
  sweepStart?: number;
  sweepDur?: number;
  rotate?: [number, number];
  style?: React.CSSProperties;
}> = ({which = 'angle', dur, zoom = [1.5, 1.7], pan = [0, 0], sweepStart, sweepDur = 40, rotate = [0, 0], style}) => {
  const frame = useCurrentFrame();
  const p = PRODUCT_PHOTO[which];
  const t = ramp(frame, 0, dur, Easing.bezier(0.33, 0, 0.2, 1));
  const z = lerp(zoom[0], zoom[1], t);
  const px = lerp(pan[0], pan[1], t);
  const rot = lerp(rotate[0], rotate[1], t);
  const s = sweepStart !== undefined ? ramp(frame, sweepStart, sweepDur, EASE_IN_OUT) : -1;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#6d6e70', ...style}}>
      <Img
        src={staticFile(p.src)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: `${p.cx}% ${p.cy}%`,
          transform: `translateX(${px}%) scale(${z}) rotate(${rot}deg)`,
          transformOrigin: `${p.cx}% ${p.cy}%`,
          filter: 'contrast(1.06) saturate(0.9)',
        }}
      />
      {s > 0 && s < 1 ? (
        <AbsoluteFill
          style={{
            background: `linear-gradient(110deg, rgba(255,255,255,0) ${s * 170 - 50}%, rgba(255,255,255,0.32) ${
              s * 170 - 35
            }%, rgba(255,255,255,0) ${s * 170 - 20}%)`,
            mixBlendMode: 'soft-light',
          }}
        />
      ) : null}
      {/* mjuk studiovinjett */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 52%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Den riktiga logotypen (ikonen) i valfri färg, som "ritas" fram nedifrån och upp. */
export const LogoReveal: React.FC<{start: number; color?: string; height: number; dur?: number; word?: boolean}> = ({
  start,
  color = '#fff',
  height,
  dur = 36,
  word = false,
}) => {
  const frame = useCurrentFrame();
  const t = ramp(frame, start, dur, EASE_IN_OUT);
  const w = ramp(frame, start + dur * 0.6, 24);
  const icon = staticFile('img/logo_icon_white.png');
  const wordUrl = staticFile('img/logo_word_white.png');
  const iconW = (height * 685) / 1215;
  const mask = (url: string): React.CSSProperties => ({
    background: color,
    WebkitMaskImage: `url(${url})`,
    WebkitMaskSize: '100% 100%',
    maskImage: `url(${url})`,
    maskSize: '100% 100%',
  });
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div
        style={{
          width: iconW,
          height,
          ...mask(icon),
          clipPath: `inset(${(1 - t) * 100}% 0 0 0)`,
          transform: `translateY(${(1 - t) * 20}px)`,
        }}
      />
      {word ? (
        <div style={{width: height * 0.15 * (1104 / 225), height: height * 0.15, marginTop: height * 0.08, ...mask(wordUrl), opacity: w}} />
      ) : null}
    </div>
  );
};

/** Svävande ljuspartiklar (bokeh) – ger liv åt lugna bilder. */
export const Bokeh: React.FC<{count?: number; color?: string; seed?: number; opacity?: number}> = ({
  count = 18,
  color = '255,250,240',
  seed = 1,
  opacity = 0.35,
}) => {
  const frame = useCurrentFrame();
  const r = (i: number) => {
    const x = Math.sin((i + seed * 100) * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: count}).map((_, i) => {
        const size = 10 + r(i) * 60;
        const x = r(i + 50) * 1920 + Math.sin(frame / 60 + i) * 30;
        const y = (r(i + 90) * 1300 - frame * (0.3 + r(i + 7) * 0.8)) % 1300;
        const yy = y < -100 ? y + 1300 : y;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: yy,
              width: size,
              height: size,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(${color},${opacity}) 0%, rgba(${color},0) 70%)`,
              filter: `blur(${2 + r(i + 3) * 4}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Tunn linje som växer fram – används som accent under rubriker. */
export const GrowLine: React.FC<{start: number; width: number; color?: string; style?: React.CSSProperties}> = ({
  start,
  width,
  color = C.sand,
  style,
}) => {
  const frame = useCurrentFrame();
  const t = ramp(frame, start, 24);
  return <div style={{height: 2, width: width * t, background: color, borderRadius: 1, ...style}} />;
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
