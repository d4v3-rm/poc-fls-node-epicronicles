import * as THREE from 'three';
import type { MutableRefObject } from 'react';

type ShaderMat = THREE.ShaderMaterial & {
  uniforms: Record<string, { value: unknown }>;
};

export const updateBlackHoleFrame = (
  blackHoleRef: MutableRefObject<THREE.Group | null>,
  elapsed: number,
  camera?: THREE.Camera,
) => {
  const group = blackHoleRef.current;
  if (!group) {
    return;
  }

  const materials = group.userData?.shaderMaterials as ShaderMat[] | undefined;
  if (!materials?.length) {
    return;
  }

  materials.forEach((material) => {
    if (material.uniforms?.uTime) {
      // animate shader-driven pieces like the accretion disk and horizon glow
      material.uniforms.uTime.value = elapsed;
    }
    if (material.uniforms?.uCameraPosition && camera) {
      const target = material.uniforms.uCameraPosition.value as THREE.Vector3;
      target.copy(camera.position);
    }
  });
};
