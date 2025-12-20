import {
  CanvasTexture,
  ClampToEdgeWrapping,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';
import type { GalaxyShape } from '@domain/galaxy/galaxy';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';
import { markDisposableTexture } from '../dispose';
import type { RandomFn } from './random';
import { randomInRange } from './random';
import { getSpiralParams } from './layout';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / Math.max(1e-6, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const fract = (x: number) => x - Math.floor(x);

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const mix3 = (a: [number, number, number], b: [number, number, number], t: number) => [
  mix(a[0], b[0], t),
  mix(a[1], b[1], t),
  mix(a[2], b[2], t),
] as [number, number, number];

const applyShapeWarp = (shape: GalaxyShape, x: number, y: number) => {
  if (shape === 'bar') {
    return { x: x * 1.25, y: y * 0.34 };
  }
  if (shape === 'ellipse') {
    return { x: x * 1.35, y: y * 0.78 };
  }
  return { x, y };
};

const computeArmMask = ({
  r,
  angle,
  arms,
  twist,
}: {
  r: number;
  angle: number;
  arms: number;
  twist: number;
}) => {
  const armPeriod = (Math.PI * 2) / Math.max(1, arms);
  const a = angle - r * twist;
  const aMod = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const dist = Math.abs(fract(aMod / armPeriod + 0.5) - 0.5) * armPeriod;
  const width = armPeriod * (0.12 - r * 0.045);
  return smoothstep(width, 0, dist);
};

const computeRingMask = (r: number, ringRadius: number, thickness: number) => {
  const d = Math.abs(r - ringRadius);
  return smoothstep(thickness, 0, d);
};

export type GalaxyDiscVariant = 'base' | 'lanes';

export interface GalaxyDiscTextureParams {
  random: RandomFn;
  shape: GalaxyShape;
  size: number;
  outerRadius: number;
  innerVoidRadius: number;
  ringRadius?: number;
  variant: GalaxyDiscVariant;
}

export const createGalaxyDiscTexture = ({
  random,
  shape,
  size,
  outerRadius,
  innerVoidRadius,
  ringRadius,
  variant,
}: GalaxyDiscTextureParams) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  const image = ctx.createImageData(size, size);
  const data = image.data;

  const noise = new ImprovedNoise();
  const z1 = random() * 10;
  const z2 = random() * 10 + 3.7;
  const z3 = random() * 10 + 8.9;

  const extent = Math.max(1, outerRadius * 1.08);
  const voidR = clamp(innerVoidRadius / extent, 0, 0.95);
  const ringR =
    typeof ringRadius === 'number' && ringRadius > 0
      ? clamp(ringRadius / extent, voidR + 0.05, 0.98)
      : 0.82;

  const { arms, twist } = getSpiralParams();
  const twistFactor =
    shape === 'spiral'
      ? twist * 1.05
      : shape === 'bar'
        ? twist * 0.85
        : twist * 0.65;

  const paletteWarm: [number, number, number] = [255, 205, 145];
  const paletteCool: [number, number, number] = [115, 200, 255];
  const palettePurple: [number, number, number] = [208, 155, 255];

  const isLanes = variant === 'lanes';
  const baseOpacity = isLanes ? 0.92 : 0.78;

  for (let py = 0; py < size; py += 1) {
    const ny = (py / (size - 1)) * 2 - 1;
    for (let px = 0; px < size; px += 1) {
      const nx = (px / (size - 1)) * 2 - 1;

      const warped = applyShapeWarp(shape, nx, ny);
      const r = Math.sqrt(warped.x * warped.x + warped.y * warped.y);
      if (r > 1 || r <= voidR * 0.98) {
        const idx = (py * size + px) * 4;
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
        continue;
      }

      const angle = Math.atan2(warped.y, warped.x);

      const radial = Math.pow(1 - r, 1.4);
      const radialCore = Math.pow(1 - r, 2.15);

      const low = noise.noise(nx * 1.15, ny * 1.15, z1) * 0.5 + 0.5;
      const mid = noise.noise(nx * 3.2, ny * 3.2, z2) * 0.5 + 0.5;
      const high =
        noise.noise(nx * 8.4 + mid * 0.25, ny * 8.4 + mid * 0.25, z3) * 0.5 +
        0.5;

      let mask = radial;
      if (shape === 'ring') {
        const thickness = isLanes ? 0.06 : 0.1;
        mask *= computeRingMask(r, ringR, thickness);
      } else if (shape === 'cluster') {
        mask *= 0.65 + low * 0.75;
        mask = Math.pow(mask, 0.85);
      } else if (shape === 'spiral' || shape === 'bar') {
        const armMask = computeArmMask({
          r,
          angle,
          arms: shape === 'bar' ? 2 : arms,
          twist: twistFactor,
        });
        mask *= 0.32 + armMask * 0.92;
      }

      const innerEdge = smoothstep(voidR * 1.03, voidR * 1.25, r);
      mask *= innerEdge;

      const lane = smoothstep(0.25, 0.92, high);
      const laneDepth = isLanes ? 0.65 : 0.42;
      mask *= 1 - (1 - lane) * laneDepth;

      const clump = 0.55 + 0.45 * mid;
      mask *= isLanes ? Math.pow(clump, 1.15) : clump;

      const coreRing = smoothstep(voidR * 1.08, voidR * 1.65, r) * (1 - r);
      const coreBoost = isLanes ? coreRing * 0.45 : coreRing * 0.8;
      const density =
        clamp(mask * (0.55 + low * 0.55) + radialCore * coreBoost, 0, 1) *
        baseOpacity;

      const colorT = clamp(Math.pow(1 - r, 0.95) * (0.8 + low * 0.25), 0, 1);
      const base = mix3(paletteCool, paletteWarm, colorT);
      const accent = mix3(paletteCool, palettePurple, 0.45 + low * 0.35);
      const accentMix = clamp(0.2 + mid * 0.55, 0, 1);
      const rgb = mix3(base, accent, accentMix);

      const idx = (py * size + px) * 4;
      data[idx] = clamp(Math.round(rgb[0]), 0, 255);
      data[idx + 1] = clamp(Math.round(rgb[1]), 0, 255);
      data[idx + 2] = clamp(Math.round(rgb[2]), 0, 255);
      data[idx + 3] = clamp(Math.round(density * 255), 0, 255);
    }
  }

  ctx.putImageData(image, 0, 0);

  if (!isLanes) {
    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = size;
    blurCanvas.height = size;
    const blurCtx = blurCanvas.getContext('2d');
    if (blurCtx) {
      blurCtx.filter = `blur(${Math.round(size * 0.006)}px)`;
      blurCtx.drawImage(canvas, 0, 0);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.85;
      ctx.filter = `blur(${Math.round(size * 0.008)}px)`;
      ctx.drawImage(blurCanvas, 0, 0);
      ctx.globalAlpha = 1;
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.15,
    size / 2,
    size / 2,
    size / 2,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${isLanes ? 0.35 : 0.55})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  ctx.globalCompositeOperation = 'lighter';
  const speckCount = Math.round(randomInRange(random, 180, 420));
  for (let i = 0; i < speckCount; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const dx = (x / size) * 2 - 1;
    const dy = (y / size) * 2 - 1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < voidR * 0.9 || dist > 0.98) continue;
    const r = randomInRange(random, 0.6, 1.6);
    const a = randomInRange(random, 0.06, isLanes ? 0.18 : 0.12);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  const texture = markDisposableTexture(new CanvasTexture(canvas));
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
};

