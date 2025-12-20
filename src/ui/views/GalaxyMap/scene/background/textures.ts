import {
  CanvasTexture,
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';
import { createNoise2D } from 'simplex-noise';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';
import { markDisposableTexture } from '../dispose';
import type { RandomFn } from './random';
import { randomGaussian, randomInRange } from './random';

export const createSoftCircleTexture = (size = 64) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.8)');
  g.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const texture = markDisposableTexture(new CanvasTexture(canvas));
  texture.needsUpdate = true;
  return texture;
};

export const createNebulaTexture = (random: RandomFn, size = 256) => {
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
  const z = random() * 10;
  const freq1 = 3.0 / size;
  const freq2 = 8.5 / size;

  for (let y = 0; y < size; y += 1) {
    const ny = (y / (size - 1)) * 2 - 1;
    for (let x = 0; x < size; x += 1) {
      const nx = (x / (size - 1)) * 2 - 1;
      const r = Math.sqrt(nx * nx + ny * ny);
      const falloff = Math.max(0, 1 - r);

      const n1 = noise.noise(x * freq1, y * freq1, z) * 0.5 + 0.5;
      const n2 = noise.noise(x * freq2, y * freq2, z + 2.1) * 0.5 + 0.5;
      const value = Math.min(1, Math.max(0, (n1 * 0.75 + n2 * 0.25) * falloff));

      const idx = (y * size + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = Math.round(value * 255);
    }
  }

  ctx.putImageData(image, 0, 0);

  // Soft vignette to avoid hard edges.
  const vignette = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.2,
    size / 2,
    size / 2,
    size / 2,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);

  const texture = markDisposableTexture(new CanvasTexture(canvas));
  texture.needsUpdate = true;
  return texture;
};

export const createAccretionNoiseTexture = (random: RandomFn, size = 512) => {
  const noise2D = createNoise2D(random);
  const data = new Uint8Array(size * size * 4);
  const baseScale = 1 / Math.max(1, size);

  const fbm = (x: number, y: number, baseFrequency: number, octaves = 4) => {
    let amplitude = 1;
    let frequency = baseFrequency;
    let value = 0;
    let norm = 0;
    for (let i = 0; i < octaves; i += 1) {
      value += amplitude * noise2D(x * frequency, y * frequency);
      norm += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return norm > 0 ? value / norm : 0;
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x - size * 0.5) * baseScale;
      const ny = (y - size * 0.5) * baseScale;
      const coarse = 0.5 + 0.5 * fbm(nx, ny, 1.6, 4);
      const fine = 0.5 + 0.5 * fbm(nx, ny, 5.2, 3);
      const ridge = 1 - Math.abs(fine * 2 - 1);

      const idx = (y * size + x) * 4;
      data[idx] = Math.round(Math.min(1, Math.max(0, coarse)) * 255);
      data[idx + 1] = Math.round(Math.min(1, Math.max(0, fine)) * 255);
      data[idx + 2] = Math.round(Math.min(1, Math.max(0, ridge)) * 255);
      data[idx + 3] = 255;
    }
  }

  const texture = markDisposableTexture(new DataTexture(data, size, size));
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
};

export const createStarfieldTexture = (
  random: RandomFn,
  width = 1024,
  height = 512,
) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  const base = ctx.createRadialGradient(
    width * 0.35,
    height * 0.4,
    0,
    width * 0.35,
    height * 0.4,
    Math.max(width, height),
  );
  base.addColorStop(0, 'rgba(18, 28, 62, 0.95)');
  base.addColorStop(0.55, 'rgba(6, 10, 22, 0.98)');
  base.addColorStop(1, 'rgba(0, 0, 0, 1)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const band = ctx.createLinearGradient(0, 0, 0, height);
  band.addColorStop(0, 'rgba(0,0,0,0)');
  band.addColorStop(0.35, 'rgba(40, 80, 160, 0.05)');
  band.addColorStop(0.5, 'rgba(120, 90, 180, 0.07)');
  band.addColorStop(0.65, 'rgba(40, 80, 160, 0.05)');
  band.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'lighter';

  const starCount = Math.round((width * height) / 220);
  for (let i = 0; i < starCount; i += 1) {
    const x = random() * width;
    const useBand = random() < 0.68;
    const y = useBand
      ? height / 2 + randomGaussian(random) * height * 0.18
      : random() * height;
    if (y < 0 || y >= height) {
      continue;
    }

    const sparkle = random();
    const warm = random() < 0.18;
    const r = warm ? 255 : 210 + Math.round(random() * 45);
    const g = warm ? 210 + Math.round(random() * 35) : 220 + Math.round(random() * 35);
    const b = warm ? 175 + Math.round(random() * 40) : 255;

    if (sparkle < 0.06) {
      const radius = randomInRange(random, 1.2, 3.4);
      const alpha = randomInRange(random, 0.12, sparkle < 0.012 ? 0.75 : 0.35);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.4);
      glow.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
      glow.addColorStop(0.35, `rgba(${r},${g},${b},${alpha * 0.35})`);
      glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const alpha = randomInRange(random, 0.06, 0.22);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const texture = markDisposableTexture(new CanvasTexture(canvas));
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
};
