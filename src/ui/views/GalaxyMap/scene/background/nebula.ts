import * as THREE from 'three';
import type { GalaxyShape } from '@domain/galaxy/galaxy';
import { markDisposableMaterial } from '../dispose';
import type { RandomFn } from './random';
import { randomGaussian, randomInRange } from './random';
import { createNebulaTexture } from './textures';
import { getSpiralParams } from './layout';
import { galaxyTextureUrls } from './assets';
import { loadAssetTexture } from './assetLoader';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const sampleRadius = (random: RandomFn, inner: number, outer: number) => {
  const t = Math.pow(random(), 0.65);
  return inner + t * (outer - inner);
};

const sampleAngle = (random: RandomFn) => random() * Math.PI * 2;

const sampleNebulaPosition = ({
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
  const inner = innerVoidRadius * 1.05;
  const outer = outerRadius;

  if (shape === 'cluster' && clusterCenters.length > 0) {
    const center = clusterCenters[Math.floor(random() * clusterCenters.length)]!;
    const spread = outer * 0.22;
    return {
      x: center.x + randomGaussian(random) * spread,
      z: center.z + randomGaussian(random) * spread,
    };
  }

  if (shape === 'ring') {
    const targetRadius = ringRadius ?? outer * 0.82;
    const thickness = outer * 0.12;
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
    const r = sampleRadius(random, inner, outer);
    const rn = r / Math.max(1, outer);
    const arm = Math.floor(random() * arms);
    const armOffset = (arm / arms) * Math.PI * 2;
    const angle =
      rn * twist + armOffset + (random() - 0.5) * 0.45 + sampleAngle(random) * 0.15;
    const jitter = outer * 0.05;
    return {
      x: Math.cos(angle) * r + randomGaussian(random) * jitter,
      z: Math.sin(angle) * r + randomGaussian(random) * jitter,
    };
  }

  const a = sampleAngle(random);
  const r = sampleRadius(random, inner, outer);
  let x = Math.cos(a) * r;
  let z = Math.sin(a) * r;

  if (shape === 'bar') {
    x *= 1.25;
    z *= 0.3;
  } else if (shape === 'ellipse') {
    x *= 1.4;
    z *= 0.75;
  }

  const dist = Math.sqrt(x * x + z * z);
  if (dist > outer) {
    const scale = outer / Math.max(1e-3, dist);
    x *= scale;
    z *= scale;
  }
  return { x, z };
};

export interface BuildGalaxyNebulaParams {
  group: THREE.Group;
  shape: GalaxyShape;
  random: RandomFn;
  outerRadius: number;
  innerVoidRadius: number;
  systemPositions: Map<string, THREE.Vector3>;
}

export const buildGalaxyNebula = ({
  group,
  shape,
  random,
  outerRadius,
  innerVoidRadius,
  systemPositions,
}: BuildGalaxyNebulaParams) => {
  const root = new THREE.Group();
  root.name = 'galaxyNebula';

  const nebulaAlpha = createNebulaTexture(random, 384);
  const nebulaMaps = galaxyTextureUrls.nebulae.map((url) =>
    loadAssetTexture(url, {
      colorSpace: THREE.SRGBColorSpace,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    }),
  );
  if (!nebulaAlpha && nebulaMaps.length === 0) {
    group.add(root);
    return { update: () => undefined };
  }

  const systemEntries = [...systemPositions.values()];
  const systemRadii = systemEntries.map((p) => Math.sqrt(p.x * p.x + p.z * p.z));
  const meanSystemRadius =
    systemRadii.length > 0
      ? systemRadii.reduce((acc, value) => acc + value, 0) / systemRadii.length
      : null;
  const ringRadius = shape === 'ring' && meanSystemRadius ? meanSystemRadius : undefined;

  const palette = [
    '#6bd2ff',
    '#7c8cff',
    '#d08bff',
    '#ff7ad9',
    '#4de2ff',
    '#8bdfff',
    '#ffb36b',
    '#7fe38f',
  ];

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

  const nebulaCount = clamp(Math.round(systemPositions.size * 0.35), 14, 42);
  for (let i = 0; i < nebulaCount; i += 1) {
    const p = sampleNebulaPosition({
      shape,
      random,
      innerVoidRadius,
      outerRadius,
      clusterCenters,
      ringRadius,
    });

    const colorHex = palette[Math.floor(random() * palette.length)] ?? '#6bd2ff';
    const opacity = 0.08 + random() * 0.12;
    const mapTexture =
      nebulaMaps[Math.floor(random() * nebulaMaps.length)] ?? nebulaAlpha ?? undefined;
    const material = markDisposableMaterial(
      new THREE.SpriteMaterial({
        map: mapTexture,
        alphaMap: nebulaAlpha ?? undefined,
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      }),
    ) as THREE.SpriteMaterial;
    material.userData = material.userData ?? {};
    material.userData.baseOpacity = opacity;

    const sprite = new THREE.Sprite(material);
    sprite.name = 'nebula';
    sprite.position.set(p.x, randomGaussian(random) * 35 - outerRadius * 0.04, p.z);
    const size = outerRadius * randomInRange(random, 0.18, 0.45);
    sprite.scale.set(size, size, 1);
    sprite.material.rotation = random() * Math.PI * 2;
    sprite.renderOrder = 1;
    root.add(sprite);
  }

  const hazeMaterial = markDisposableMaterial(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#0b1d3a'),
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  const baseHazeOpacity = (hazeMaterial as THREE.MeshBasicMaterial).opacity;
  const haze = new THREE.Mesh(
    new THREE.PlaneGeometry(outerRadius * 3.2, outerRadius * 3.2, 1, 1),
    hazeMaterial,
  );
  haze.name = 'nebulaHaze';
  haze.rotation.x = -Math.PI / 2;
  haze.position.y = -10;
  haze.renderOrder = -1;
  root.add(haze);

  const haze2Material = markDisposableMaterial(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#2b0b45'),
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  const baseHaze2Opacity = (haze2Material as THREE.MeshBasicMaterial).opacity;
  const haze2 = new THREE.Mesh(
    new THREE.PlaneGeometry(outerRadius * 3.8, outerRadius * 3.8, 1, 1),
    haze2Material,
  );
  haze2.name = 'nebulaHazeWarm';
  haze2.rotation.x = -Math.PI / 2;
  haze2.position.y = -14;
  haze2.renderOrder = -2;
  root.add(haze2);

  group.add(root);

  return {
    update: (elapsed: number, zoomFactor = 1) => {
      const visibility = clamp(0.22 + zoomFactor * 0.78, 0, 1);
      root.rotation.y = Math.sin(elapsed * 0.03) * 0.06;
      (hazeMaterial as THREE.MeshBasicMaterial).opacity = clamp(
        baseHazeOpacity * visibility,
        0,
        1,
      );
      (haze2Material as THREE.MeshBasicMaterial).opacity = clamp(
        (baseHaze2Opacity + Math.sin(elapsed * 0.025) * 0.02) * visibility,
        0,
        1,
      );

      root.children.forEach((child) => {
        if (!(child instanceof THREE.Sprite)) return;
        const spriteMaterial = child.material as THREE.SpriteMaterial;
        const baseOpacity = spriteMaterial.userData?.baseOpacity as number | undefined;
        if (typeof baseOpacity !== 'number') return;
        spriteMaterial.opacity = baseOpacity * visibility;
      });
    },
  };
};
