import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT_SANS, T, TEXT, f} from '../config';
import {FridgeInterior, FridgeVariant, PRODUCT_IN_FRIDGE} from '../components/Fridge';
import {EASE, Grain, Product, PRODUCT_SRC, RiseText, Vignette, ramp} from '../components/common';

const S = T.scenes.fridges;
const ORDER: FridgeVariant[] = ['white', 'dark', 'american', 'minimal', 'family', 'steel', 'white', 'dark'];
const LABEL_INDEX: Record<FridgeVariant, number> = {white: 0, dark: 1, american: 2, minimal: 3, family: 4, steel: 5};

/** Produkten står alltid exakt här – samma storlek, samma position. */
export const FixedProduct: React.FC<{sweepStart?: number; dark?: boolean}> = ({sweepStart, dark}) => {
  const w = PRODUCT_IN_FRIDGE.width;
  const h = (w * PRODUCT_SRC.angle.h) / PRODUCT_SRC.angle.w;
  return (
    <div
      style={{
        position: 'absolute',
        left: 960 - w / 2,
        top: PRODUCT_IN_FRIDGE.bottom - h,
      }}
    >
      {/* spegling i glashyllan – förankrar produkten på hyllan */}
      <Img
        src={staticFile(PRODUCT_SRC.angle.src)}
        style={{
          position: 'absolute',
          left: 0,
          top: h - 6,
          width: w,
          height: h,
          transform: 'scaleY(-1)',
          opacity: dark ? 0.16 : 0.22,
          filter: 'blur(1.5px)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 38%)',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 38%)',
        }}
      />
      <Product which="angle" width={w} shadow={dark ? 1 : 0.9} sweepStart={sweepStart} sweepDur={50} />
    </div>
  );
};

export const S5Fridges: React.FC = () => {
  const frame = useCurrentFrame();
  const cut = f(S.cut);
  const finalAt = f(S.final - S.start);
  const total = f(S.end - S.start);
  const idx = Math.min(ORDER.length - 1, Math.floor(frame / cut));
  const inFinal = frame >= finalAt;
  const variant: FridgeVariant = inFinal ? 'dark' : ORDER[idx];
  const local = inFinal ? frame - finalAt : frame - idx * cut;
  // liten "punch" i bakgrunden vid varje klipp (produkten påverkas inte)
  const punch = inFinal ? interpolate(frame - finalAt, [0, total - finalAt], [1.02, 1.1]) : 1.035 - 0.035 * ramp(local, 0, cut, EASE);
  const flash = inFinal ? 1 - ramp(local, 0, 6) : 1 - ramp(local, 0, 4);
  const finalPush = inFinal ? interpolate(frame - finalAt, [0, total - finalAt], [1, 1.08]) : 1;
  const darkish = variant === 'dark';
  const label = TEXT.fridges.labels[LABEL_INDEX[variant]];
  return (
    <AbsoluteFill style={{background: C.charcoal}}>
      <AbsoluteFill style={{transform: `scale(${punch})`}}>
        <FridgeInterior variant={variant} />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${finalPush})`, transformOrigin: '50% 62%'}}>
        <FixedProduct dark={darkish} sweepStart={inFinal ? finalAt + 10 : undefined} />
      </AbsoluteFill>
      {/* ljusblixt i övergången */}
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.18}} />
      {/* etikett för respektive kylskåp */}
      {!inFinal ? (
        <div
          style={{
            position: 'absolute',
            left: 90,
            top: 70,
            fontFamily: FONT_SANS,
            fontSize: 16,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: darkish ? 'rgba(255,255,255,0.65)' : 'rgba(27,28,26,0.6)',
          }}
        >
          {String(idx + 1).padStart(2, '0')} — {label}
        </div>
      ) : null}
      {/* text */}
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 70}}>
        {!inFinal ? (
          <div
            style={{
              padding: '18px 40px',
              borderRadius: 60,
              background: 'rgba(20,21,20,0.55)',
              backdropFilter: 'blur(14px)',
              opacity: ramp(frame, f(S.text1 - S.start), 10),
            }}
          >
            <RiseText text={TEXT.fridges.t1} start={f(S.text1 - S.start)} size={44} weight={600} color={C.white} tracking={0.04} stagger={3} />
          </div>
        ) : null}
      </AbsoluteFill>
      {inFinal ? (
        <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 96}}>
          <RiseText text={TEXT.fridges.t2} start={finalAt + 8} end={total - 10} size={50} weight={600} color={C.beige} tracking={0.03} stagger={3} />
        </AbsoluteFill>
      ) : null}
      <Vignette strength={darkish ? 0.55 : 0.25} />
      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
};
