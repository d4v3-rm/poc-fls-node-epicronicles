import * as THREE from 'three';
import type { GalaxyShape } from '@domain/galaxy/galaxy';
import { markDisposableMaterial } from '../dispose';
import type { RandomFn } from './random';
import { createGalaxyDiscTexture } from './galaxyDiscTexture';
import { galaxyTextureUrls } from './assets';
import { loadAssetTexture } from './assetLoader';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const computeMeanSystemRadius = (systemPositions: Map<string, THREE.Vector3>) => {
  const entries = [...systemPositions.values()];
  if (!entries.length) return null;
  const sum = entries.reduce((acc, p) => acc + Math.sqrt(p.x * p.x + p.z * p.z), 0);
  return sum / entries.length;
};

export interface BuildGalaxyDiscParams {
  group: THREE.Group;
  shape: GalaxyShape;
  random: RandomFn;
  outerRadius: number;
  innerVoidRadius: number;
  systemPositions: Map<string, THREE.Vector3>;
}

export const buildGalaxyDisc = ({
  group,
  shape,
  random,
  outerRadius,
  innerVoidRadius,
  systemPositions,
}: BuildGalaxyDiscParams) => {
  const root = new THREE.Group();
  root.name = 'galaxyDisc';

  const meanSystemRadius = computeMeanSystemRadius(systemPositions);
  const ringRadius = shape === 'ring' && meanSystemRadius ? meanSystemRadius : undefined;

  const baseTexture = createGalaxyDiscTexture({
    random,
    shape,
    size: 1152,
    outerRadius,
    innerVoidRadius,
    ringRadius,
    variant: 'base',
  });
  const lanesTexture = createGalaxyDiscTexture({
    random,
    shape,
    size: 1152,
    outerRadius,
    innerVoidRadius,
    ringRadius,
    variant: 'lanes',
  });

  const discRadius = outerRadius * 1.14;
  const geometry = new THREE.PlaneGeometry(discRadius * 2, discRadius * 2, 1, 1);

  const usePhotoDisc = shape === 'circle' || shape === 'spiral';
  const photoTexture = usePhotoDisc
    ? loadAssetTexture(galaxyTextureUrls.disc, {
        colorSpace: THREE.SRGBColorSpace,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
      })
    : null;

  const photoMaterial = photoTexture
    ? markDisposableMaterial(
        new THREE.MeshBasicMaterial({
          map: photoTexture,
          alphaMap: baseTexture ?? undefined,
          transparent: true,
          opacity: 0.6,
          depthWrite: false,
          depthTest: true,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        }),
      )
    : null;

  const baseMaterial = markDisposableMaterial(
    new THREE.MeshBasicMaterial({
      map: baseTexture ?? undefined,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  ) as THREE.MeshBasicMaterial;

  const lanesMaterial = markDisposableMaterial(
    new THREE.MeshBasicMaterial({
      map: lanesTexture ?? undefined,
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  ) as THREE.MeshBasicMaterial;

  if (photoMaterial) {
    const photoPlane = new THREE.Mesh(geometry, photoMaterial);
    photoPlane.name = 'discPhoto';
    photoPlane.rotation.x = -Math.PI / 2;
    photoPlane.position.y = -outerRadius * 0.095;
    photoPlane.renderOrder = -8;
    root.add(photoPlane);
  }

  const basePlane = new THREE.Mesh(geometry, baseMaterial);
  basePlane.name = 'discBase';
  basePlane.rotation.x = -Math.PI / 2;
  basePlane.position.y = -outerRadius * 0.09;
  basePlane.renderOrder = -6;
  root.add(basePlane);

  const lanesPlane = new THREE.Mesh(geometry, lanesMaterial);
  lanesPlane.name = 'discLanes';
  lanesPlane.rotation.x = -Math.PI / 2;
  lanesPlane.position.y = basePlane.position.y - 4;
  lanesPlane.scale.setScalar(1.02);
  lanesPlane.renderOrder = -5;
  root.add(lanesPlane);

  const veilMaterial = markDisposableMaterial(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#152b5a'),
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  ) as THREE.MeshBasicMaterial;
  const veil = new THREE.Mesh(geometry, veilMaterial);
  veil.name = 'discVeil';
  veil.rotation.x = -Math.PI / 2;
  veil.position.y = basePlane.position.y - 10;
  veil.scale.setScalar(1.08);
  veil.renderOrder = -7;
  root.add(veil);

  root.rotation.y = (random() - 0.5) * 0.18;
  lanesPlane.rotation.y = (random() - 0.5) * 0.08;

  group.add(root);

  const base = {
    photoOpacity: photoMaterial?.opacity ?? 0,
    baseOpacity: baseMaterial.opacity,
    lanesOpacity: lanesMaterial.opacity,
    veilOpacity: veilMaterial.opacity,
  };

  return {
    update: (elapsed: number, zoomFactor = 1) => {
      const visibility = clamp(0.22 + zoomFactor * 0.78, 0, 1);
      if (photoMaterial) {
        photoMaterial.opacity = base.photoOpacity * visibility;
      }
      baseMaterial.opacity = base.baseOpacity * visibility;
      lanesMaterial.opacity = base.lanesOpacity * visibility;
      veilMaterial.opacity = base.veilOpacity * visibility;

      root.rotation.y += 0.001 + Math.sin(elapsed * 0.02) * 0.00025;
      lanesPlane.rotation.y -= 0.0012;
      veil.rotation.y += 0.00065;
    },
  };
};
