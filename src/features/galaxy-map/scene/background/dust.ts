import * as THREE from 'three';
import type { GalaxyShape } from '@domain/galaxy/galaxy';
import { markDisposableMaterial } from '../dispose';
import type { RandomFn } from './random';
import { randomGaussian, randomInRange } from './random';
import { createSoftCircleTexture } from './textures';
import { galaxyTextureUrls } from './assets';
import { loadAssetTexture } from './assetLoader';
import { getSpiralParams } from './layout';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const sampleRadius = (random: RandomFn, inner: number, outer: number) => {
  // Area-uniform sampling.
  const t = random();
  const r = Math.sqrt(inner * inner + t * (outer * outer - inner * inner));
  return r;
};

const sampleAngle = (random: RandomFn) => random() * Math.PI * 2;

const sampleShapePosition = ({
  shape,
  random,
  innerVoidRadius,
  outerRadius,
  clusterCenters,
  ringRadius,
}: {
  shape: GalaxyShape;
  random: RandomFn;
  innerVoidRadius: number;
  outerRadius: number;
  clusterCenters: Array<{ x: number; z: number }>;
  ringRadius?: number;
}) => {
  const inner = innerVoidRadius;
  const outer = outerRadius;

  if (shape === 'cluster' && clusterCenters.length > 0) {
    const center = clusterCenters[Math.floor(random() * clusterCenters.length)]!;
    const spread = outer * 0.14;
    const x = center.x + randomGaussian(random) * spread;
    const z = center.z + randomGaussian(random) * spread;
    return { x, z };
  }

  if (shape === 'ring') {
    const targetRadius = ringRadius ?? outer * 0.82;
    const thickness = outer * 0.08;
    const r = clamp(
      targetRadius + randomGaussian(random) * thickness,
      inner,
      outer,
    );
    const a = sampleAngle(random);
    return { x: Math.cos(a) * r, z: Math.sin(a) * r };
  }

  if (shape === 'spiral') {
    const { arms, twist } = getSpiralParams();
    const a0 = sampleAngle(random);
    const r = sampleRadius(random, inner, outer);
    const rn = r / Math.max(1, outer);
    const arm = Math.floor(random() * arms);
    const armOffset = (arm / arms) * Math.PI * 2;
    const angle = a0 * 0.25 + rn * twist + armOffset + (random() - 0.5) * 0.35;
    const jitter = outer * 0.03;
    return {
      x: Math.cos(angle) * r + randomGaussian(random) * jitter,
      z: Math.sin(angle) * r + randomGaussian(random) * jitter,
    };
  }

  let x = 0;
  let z = 0;
  {
    const a = sampleAngle(random);
    const r = sampleRadius(random, inner, outer);
    x = Math.cos(a) * r;
    z = Math.sin(a) * r;
  }

  if (shape === 'bar') {
    x *= 1.2;
    z *= 0.25;
  } else if (shape === 'ellipse') {
    x *= 1.35;
    z *= 0.7;
  }

  const dist = Math.sqrt(x * x + z * z);
  if (dist > outer) {
    const scale = outer / Math.max(1e-3, dist);
    x *= scale;
    z *= scale;
  }
  return { x, z };
};

const writeColor = (out: Float32Array, idx: number, color: THREE.Color) => {
  out[idx] = color.r;
  out[idx + 1] = color.g;
  out[idx + 2] = color.b;
};

export interface BuildGalaxyDustParams {
  group: THREE.Group;
  shape: GalaxyShape;
  random: RandomFn;
  outerRadius: number;
  innerVoidRadius: number;
  systemPositions: Map<string, THREE.Vector3>;
}

export const buildGalaxyDust = ({
  group,
  shape,
  random,
  outerRadius,
  innerVoidRadius,
  systemPositions,
}: BuildGalaxyDustParams) => {
  const root = new THREE.Group();
  root.name = 'galaxyDust';

  const dotTexture =
    loadAssetTexture(galaxyTextureUrls.dustSprite, {
      colorSpace: THREE.SRGBColorSpace,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      flipY: false,
    }) ?? createSoftCircleTexture(64);
  const systemEntries = [...systemPositions.values()];
  const systemRadii = systemEntries.map((p) => Math.sqrt(p.x * p.x + p.z * p.z));
  const meanSystemRadius =
    systemRadii.length > 0
      ? systemRadii.reduce((acc, value) => acc + value, 0) / systemRadii.length
      : null;
  const ringRadius = shape === 'ring' && meanSystemRadius ? meanSystemRadius : undefined;
  const clusterCenters =
    shape === 'cluster' && systemEntries.length > 0
      ? Array.from({ length: Math.min(3, systemEntries.length) }, () => {
          const idx = Math.floor(random() * systemEntries.length);
          const p = systemEntries[idx]!;
          return { x: p.x, z: p.z };
        })
      : shape === 'cluster'
        ? Array.from({ length: 3 }, () => {
            const a = random() * Math.PI * 2;
            const r = outerRadius * randomInRange(random, 0.35, 0.6);
            return { x: Math.cos(a) * r, z: Math.sin(a) * r };
          })
        : [];

  const buildPoints = ({
    count,
    radiusMin,
    radiusMax,
    opacity,
    size,
    colorMode,
    name,
  }: {
    count: number;
    radiusMin: number;
    radiusMax: number;
    opacity: number;
    size: number;
    colorMode: 'ambient' | 'dust';
    name: string;
  }) => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      const p = sampleShapePosition({
        shape,
        random,
        innerVoidRadius: radiusMin,
        outerRadius: radiusMax,
        clusterCenters,
        ringRadius,
      });

      const yBase = colorMode === 'ambient' ? -radiusMax * 0.06 : -radiusMax * 0.035;
      const y = yBase + randomGaussian(random) * (colorMode === 'ambient' ? 35 : 18);
      const baseIndex = i * 3;
      positions[baseIndex] = p.x;
      positions[baseIndex + 1] = y;
      positions[baseIndex + 2] = p.z;

      if (colorMode === 'ambient') {
        const hue = 0.56 + (random() - 0.5) * 0.06;
        const sat = 0.15 + random() * 0.15;
        const light = 0.72 + random() * 0.25;
        color.setHSL(hue, sat, light);
      } else {
        const dist = Math.sqrt(p.x * p.x + p.z * p.z);
        const t = clamp((dist - radiusMin) / Math.max(1, radiusMax - radiusMin), 0, 1);
        const hue = 0.62 - t * 0.18 + (random() - 0.5) * 0.06;
        const sat = 0.28 + random() * 0.35;
        const light = 0.55 + random() * 0.35;
        color.setHSL(hue, sat, light);
      }
      writeColor(colors, baseIndex, color);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = markDisposableMaterial(
      new THREE.PointsMaterial({
        size,
        sizeAttenuation: true,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        map: dotTexture ?? undefined,
      }),
    ) as THREE.PointsMaterial;

    const points = new THREE.Points(geometry, material);
    points.name = name;
    points.renderOrder = colorMode === 'ambient' ? 0 : 2;
    return points;
  };

  const ambientCount = clamp(Math.round(systemPositions.size * 30), 2500, 6500);
  const dustCount = clamp(Math.round(systemPositions.size * 140), 8000, 24000);
  const wideDustCount = clamp(Math.round(systemPositions.size * 75), 2800, 11000);
  const aroundSystemsCount = clamp(Math.round(systemPositions.size * 40), 2000, 12000);

  const ambientStars = buildPoints({
    count: ambientCount,
    radiusMin: innerVoidRadius,
    radiusMax: outerRadius * 1.35,
    opacity: 0.35,
    size: 1.2,
    colorMode: 'ambient',
    name: 'ambientStars',
  });
  root.add(ambientStars);

  const shapeDust = buildPoints({
    count: dustCount,
    radiusMin: innerVoidRadius,
    radiusMax: outerRadius,
    opacity: 0.72,
    size: 1.8,
    colorMode: 'dust',
    name: 'shapeDust',
  });
  root.add(shapeDust);

  const shapeDustWide = buildPoints({
    count: wideDustCount,
    radiusMin: innerVoidRadius,
    radiusMax: outerRadius,
    opacity: 0.34,
    size: 2.8,
    colorMode: 'dust',
    name: 'shapeDustWide',
  });
  shapeDustWide.renderOrder = 1;
  root.add(shapeDustWide);

  if (systemPositions.size > 0 && aroundSystemsCount > 0) {
    const positions = new Float32Array(aroundSystemsCount * 3);
    const colors = new Float32Array(aroundSystemsCount * 3);
    const color = new THREE.Color();
    const entries = systemEntries.length > 0 ? systemEntries : [...systemPositions.values()];
    const perSystem = Math.max(
      1,
      Math.floor(aroundSystemsCount / Math.max(1, entries.length)),
    );
    const sigma = Math.max(14, outerRadius * 0.015);

    let idx = 0;
    for (let s = 0; s < entries.length && idx < aroundSystemsCount; s += 1) {
      const base = entries[s]!;
      for (let k = 0; k < perSystem && idx < aroundSystemsCount; k += 1) {
        const ox = randomGaussian(random) * sigma;
        const oz = randomGaussian(random) * sigma;
        const oy = randomGaussian(random) * 10;
        const baseIndex = idx * 3;
        positions[baseIndex] = base.x + ox;
        positions[baseIndex + 1] = base.y + oy - 8;
        positions[baseIndex + 2] = base.z + oz;

        const hue = 0.55 + (random() - 0.5) * 0.08;
        const sat = 0.25 + random() * 0.35;
        const light = 0.65 + random() * 0.3;
        color.setHSL(hue, sat, light);
        writeColor(colors, baseIndex, color);
        idx += 1;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = markDisposableMaterial(
      new THREE.PointsMaterial({
        size: 2.1,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        map: dotTexture ?? undefined,
      }),
    ) as THREE.PointsMaterial;

    const points = new THREE.Points(geometry, material);
    points.name = 'systemDust';
    points.renderOrder = 3;
    root.add(points);
  }

  group.add(root);

  const ambientMaterial = ambientStars.material as THREE.PointsMaterial;
  const dustMaterial = shapeDust.material as THREE.PointsMaterial;
  const dustWideMaterial = shapeDustWide.material as THREE.PointsMaterial;
  const systemDust = root.getObjectByName('systemDust') as THREE.Points | null;
  const systemMaterial =
    systemDust && systemDust.material instanceof THREE.PointsMaterial
      ? systemDust.material
      : null;

  const base = {
    ambient: ambientMaterial.opacity,
    dust: dustMaterial.opacity,
    dustWide: dustWideMaterial.opacity,
    system: systemMaterial?.opacity ?? 0,
  };

  return {
    update: (elapsed: number, zoomFactor = 1) => {
      const visibility = clamp(0.85 + zoomFactor * 0.15, 0, 1);
      ambientMaterial.opacity = clamp(
        (base.ambient + Math.sin(elapsed * 0.12) * 0.03) * visibility,
        0,
        1,
      );
      dustMaterial.opacity = clamp(
        (base.dust + Math.sin(elapsed * 0.08) * 0.05) * visibility,
        0,
        1,
      );
      dustWideMaterial.opacity = clamp(
        (base.dustWide + Math.sin(elapsed * 0.06) * 0.04) * visibility,
        0,
        1,
      );
      if (systemMaterial) {
        systemMaterial.opacity = clamp(
          (base.system + Math.sin(elapsed * 0.1) * 0.06) * visibility,
          0,
          1,
        );
      }
    },
  };
};
