import React, {useEffect, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';

/** Deterministisk slump (samma resultat varje rendering). */
const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

type Kind = 'kol' | 'zeolit';

/**
 * Granuler som faller i slow motion genom bilden. Djup (z) styr storlek,
 * hastighet och skärpedjup – det ger en makro/kamerakänsla.
 */
export const FallingGranules: React.FC<{
  kind: Kind;
  count?: number;
  speed?: number; // px per frame vid z=1
  seed?: number;
  start?: number; // frame då partiklarna börjar falla
  region?: {x0: number; x1: number}; // horisontellt spann (0..1)
  stopY?: number; // y (px) där partiklar försvinner (t.ex. ned i påsen)
}> = ({kind, count = 140, speed = 2.2, seed = 1, start = 0, region = {x0: 0, x1: 1}, stopY}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);
    const t = frame - start;
    if (t < 0) return;
    const parts = [] as {x: number; y: number; z: number; r: number; rot: number; i: number}[];
    for (let i = 0; i < count; i++) {
      const z = 0.25 + rand(seed * 1000 + i) * 1.15; // djup
      const x = (region.x0 + rand(seed * 2000 + i) * (region.x1 - region.x0)) * width;
      const delay = rand(seed * 3000 + i) * 200;
      const tt = t - delay;
      if (tt < 0) continue;
      const y = -80 + tt * speed * (0.5 + z * 0.8) * (1 + tt * 0.004);
      if (y > height + 80) continue;
      if (stopY !== undefined && y > stopY + rand(i) * 40) continue;
      const r = (kind === 'kol' ? 9 : 7) * (0.5 + z) * (0.6 + rand(seed * 4000 + i) * 0.9);
      const rot = rand(seed * 5000 + i) * 6.28 + tt * 0.02 * (rand(i) - 0.5);
      parts.push({x: x + Math.sin(tt * 0.02 + i) * 6 * z, y, z, r, rot, i});
    }
    parts.sort((a, b) => a.z - b.z);
    for (const p of parts) {
      const focus = Math.abs(p.z - 0.85); // fokusplan
      const blur = Math.min(10, focus * 12);
      ctx.save();
      ctx.filter = blur > 0.6 ? `blur(${blur.toFixed(1)}px)` : 'none';
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // oregelbunden polygon
      const n = 6 + Math.floor(rand(p.i * 7) * 4);
      ctx.beginPath();
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const rr = p.r * (0.7 + rand(p.i * 31 + k) * 0.5) * (kind === 'kol' ? 1 : 1.05);
        const px = Math.cos(a) * rr * (kind === 'kol' ? 1.25 : 1);
        const py = Math.sin(a) * rr;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      const g = ctx.createLinearGradient(-p.r, -p.r, p.r, p.r);
      if (kind === 'kol') {
        g.addColorStop(0, '#5a5d60');
        g.addColorStop(0.35, '#26272a');
        g.addColorStop(1, '#0c0c0d');
      } else {
        g.addColorStop(0, '#f2eee6');
        g.addColorStop(0.45, '#c9c3b4');
        g.addColorStop(1, '#8a8576');
      }
      ctx.fillStyle = g;
      ctx.globalAlpha = Math.min(1, 0.35 + p.z * 0.6);
      ctx.fill();
      if (kind === 'kol') {
        // liten glansig kant – kolets struktur fångar ljuset
        ctx.strokeStyle = 'rgba(200,205,210,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [frame, width, height, count, speed, seed, start, kind, region.x0, region.x1, stopY]);

  return <canvas ref={ref} width={width} height={height} style={{position: 'absolute', inset: 0}} />;
};
