import React, {useEffect, useRef, useState} from 'react';
import {continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/** Deterministisk slump (samma resultat varje rendering). */
const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export type GranuleKind = 'kol' | 'zeolit';
const FILES: Record<GranuleKind, string[]> = {
  kol: Array.from({length: 10}, (_, i) => `img/granuler/aktivt_kol_${i}.png`),
  zeolit: Array.from({length: 10}, (_, i) => `img/granuler/zeolit_${i}.png`),
};

const cache: Record<string, HTMLImageElement> = {};
const loadAll = (files: string[]) =>
  Promise.all(
    files.map(
      (f) =>
        new Promise<HTMLImageElement>((res, rej) => {
          if (cache[f]) return res(cache[f]);
          const img = new Image();
          img.onload = () => {
            cache[f] = img;
            res(img);
          };
          img.onerror = rej;
          img.src = staticFile(f);
        }),
    ),
  );

/**
 * Riktiga, frilagda kolbitar / zeolitstenar (från era foton) som faller i
 * slow motion. Djupet styr storlek, fart, oskärpa och skugga – som i en makrofilm.
 */
export const RealGranules: React.FC<{
  kind: GranuleKind;
  count?: number;
  speed?: number;
  seed?: number;
  start?: number;
  size?: number; // längsta sida i px vid z = 1
  region?: {x0: number; x1: number};
  stopY?: number;
  shadow?: boolean;
}> = ({kind, count = 40, speed = 2.2, seed = 1, start = 0, size = 120, region = {x0: 0, x1: 1}, stopY, shadow = true}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const [imgs, setImgs] = useState<HTMLImageElement[] | null>(null);
  const [handle] = useState(() => delayRender('Laddar granuler'));

  useEffect(() => {
    loadAll(FILES[kind])
      .then((l) => {
        setImgs(l);
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [kind, handle]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !imgs) return;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);
    const t = frame - start;
    if (t < 0) return;
    const parts = [] as {x: number; y: number; z: number; rot: number; i: number; img: HTMLImageElement}[];
    for (let i = 0; i < count; i++) {
      const z = 0.3 + rand(seed * 1000 + i) * 1.3; // djup
      const x = (region.x0 + rand(seed * 2000 + i) * (region.x1 - region.x0)) * width;
      const delay = rand(seed * 3000 + i) * 160;
      const tt = t - delay;
      if (tt < 0) continue;
      const y = -size * 1.2 + tt * speed * (0.45 + z * 0.75) * (1 + tt * 0.004);
      if (y > height + size * 1.5) continue;
      if (stopY !== undefined && y > stopY + rand(i) * 40) continue;
      const spin = (rand(seed * 5000 + i) - 0.5) * 0.05;
      const rot = rand(seed * 6000 + i) * 6.28 + tt * spin;
      const img = imgs[Math.floor(rand(seed * 7000 + i) * imgs.length)];
      parts.push({x: x + Math.sin(tt * 0.02 + i) * 8 * z, y, z, rot, i, img});
    }
    parts.sort((a, b) => a.z - b.z);
    for (const p of parts) {
      const long = Math.max(p.img.width, p.img.height);
      const sc = (size * (0.35 + p.z * 0.75) * (0.8 + rand(p.i * 13) * 0.4)) / long;
      const w = p.img.width * sc;
      const h = p.img.height * sc;
      const blur = Math.min(14, Math.abs(p.z - 0.95) * 11); // fokusplan
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.filter = blur > 0.8 ? `blur(${blur.toFixed(1)}px)` : 'none';
      if (shadow) {
        ctx.shadowColor = kind === 'kol' ? 'rgba(40,30,20,0.28)' : 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 18 * p.z;
        ctx.shadowOffsetX = 6 * p.z;
        ctx.shadowOffsetY = 16 * p.z;
      }
      ctx.globalAlpha = Math.min(1, 0.55 + p.z * 0.45);
      ctx.drawImage(p.img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  }, [frame, imgs, width, height, count, speed, seed, start, size, region.x0, region.x1, stopY, kind, shadow]);

  return <canvas ref={ref} width={width} height={height} style={{position: 'absolute', inset: 0}} />;
};
