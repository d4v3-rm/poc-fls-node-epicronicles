import * as THREE from 'three';
import { markDisposableMaterial } from '../dispose';
import type { RandomFn } from './random';
import { createStarfieldTexture } from './textures';
import { galaxyTextureUrls } from './assets';
import { loadAssetTexture } from './assetLoader';

export interface BuildStarfieldParams {
  group: THREE.Group;
  random: RandomFn;
  radius: number;
}

export const buildStarfield = ({ group, random, radius }: BuildStarfieldParams) => {
  const root = new THREE.Group();
  root.name = 'starfield';

  const texture =
    loadAssetTexture(galaxyTextureUrls.starfield, {
      colorSpace: THREE.SRGBColorSpace,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    }) ?? createStarfieldTexture(random, 1024, 512);
  const material = markDisposableMaterial(
    new THREE.MeshBasicMaterial({
      map: texture ?? undefined,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      transparent: true,
      opacity: 0.92,
    }),
  );

  const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 42, 30), material);
  sphere.name = 'starSphere';
  sphere.renderOrder = -10;
  root.add(sphere);

  group.add(root);

  return {
    update: (elapsed: number) => {
      root.rotation.y = elapsed * 0.006;
      root.rotation.x = Math.sin(elapsed * 0.02) * 0.02;
    },
  };
};
