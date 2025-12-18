import * as THREE from 'three';

const DISPOSABLE_KEY = '__epicronicles_disposable';

const markDisposable = (resource: { userData?: Record<string, unknown> }) => {
  resource.userData = resource.userData ?? {};
  resource.userData[DISPOSABLE_KEY] = true;
  return resource;
};

export const markDisposableMaterial = (material: THREE.Material) =>
  markDisposable(material);

export const markDisposableTexture = (texture: THREE.Texture) =>
  markDisposable(texture);

const isDisposable = (resource: { userData?: Record<string, unknown> }) =>
  Boolean(resource.userData?.[DISPOSABLE_KEY]);

const TEXTURE_PROPS = [
  'map',
  'alphaMap',
  'aoMap',
  'bumpMap',
  'displacementMap',
  'emissiveMap',
  'envMap',
  'lightMap',
  'metalnessMap',
  'normalMap',
  'roughnessMap',
  'specularMap',
  'clearcoatMap',
  'clearcoatNormalMap',
  'clearcoatRoughnessMap',
  'iridescenceMap',
  'iridescenceThicknessMap',
  'sheenColorMap',
  'sheenRoughnessMap',
  'transmissionMap',
  'thicknessMap',
] as const;

const disposeTexturesIfOwned = (
  material: THREE.Material,
  disposedTextures: WeakSet<THREE.Texture>,
) => {
  const anyMaterial = material as unknown as Record<string, unknown>;
  TEXTURE_PROPS.forEach((key) => {
    const tex = anyMaterial[key] as THREE.Texture | null | undefined;
    if (!tex || disposedTextures.has(tex) || !isDisposable(tex)) {
      return;
    }
    disposedTextures.add(tex);
    tex.dispose();
  });
};

const disposeMaterialIfOwned = (
  material: THREE.Material,
  disposedMaterials: WeakSet<THREE.Material>,
  disposedTextures: WeakSet<THREE.Texture>,
) => {
  if (disposedMaterials.has(material) || !isDisposable(material)) {
    return;
  }
  disposedMaterials.add(material);
  disposeTexturesIfOwned(material, disposedTextures);
  material.dispose();
};

export const disposeGroupResources = (group: THREE.Group) => {
  const disposedGeometries = new WeakSet<THREE.BufferGeometry>();
  const disposedMaterials = new WeakSet<THREE.Material>();
  const disposedTextures = new WeakSet<THREE.Texture>();

  group.traverse((child) => {
    if (child === group) {
      return;
    }

    const maybeGeometry = (child as unknown as { geometry?: THREE.BufferGeometry }).geometry;
    if (maybeGeometry && typeof maybeGeometry.dispose === 'function' && !disposedGeometries.has(maybeGeometry)) {
      disposedGeometries.add(maybeGeometry);
      maybeGeometry.dispose();
    }

    const maybeMaterial = (child as unknown as { material?: THREE.Material | THREE.Material[] }).material;
    if (!maybeMaterial) {
      return;
    }
    const materials = Array.isArray(maybeMaterial) ? maybeMaterial : [maybeMaterial];
    materials.forEach((material) => {
      disposeMaterialIfOwned(material, disposedMaterials, disposedTextures);
    });
  });

  group.clear();
};

