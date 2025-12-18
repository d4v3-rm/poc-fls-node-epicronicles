import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { markDisposableMaterial } from './dispose';

const constructorAssets = {
  obj: new URL(
    '../../../../assets/scene/spaceships-constructor/base.obj',
    import.meta.url,
  ).href,
  diffuse: new URL(
    '../../../../assets/scene/spaceships-constructor/texture_diffuse.png',
    import.meta.url,
  ).href,
  normal: new URL(
    '../../../../assets/scene/spaceships-constructor/texture_normal.png',
    import.meta.url,
  ).href,
  roughness: new URL(
    '../../../../assets/scene/spaceships-constructor/texture_roughness.png',
    import.meta.url,
  ).href,
  metalness: new URL(
    '../../../../assets/scene/spaceships-constructor/texture_metallic.png',
    import.meta.url,
  ).href,
};

const buildDefaultConstructorModel = () => {
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(1.2, 2.4, 4, 6),
    new THREE.MeshStandardMaterial({
      color: '#9acfff',
      emissive: '#18354d',
      emissiveIntensity: 0.25,
      metalness: 0.5,
      roughness: 0.4,
    }),
  );
  const dish = new THREE.Mesh(
    new THREE.ConeGeometry(1.2, 1.4, 10),
    new THREE.MeshStandardMaterial({
      color: '#d2e6ff',
      emissive: '#1a324a',
      emissiveIntensity: 0.2,
      metalness: 0.4,
      roughness: 0.35,
    }),
  );
  dish.position.y = 1.4;
  const group = new THREE.Group();
  group.add(body);
  group.add(dish);
  group.scale.set(1.8, 1.8, 1.8);
  return group;
};

export const getConstructionShipModel = (() => {
  let cache: Promise<THREE.Object3D> | null = null;
  return () => {
    if (cache) {
      return cache;
    }
    const objLoader = new OBJLoader();
    const textureLoader = new THREE.TextureLoader();
    cache = Promise.all([
      objLoader.loadAsync(constructorAssets.obj),
      textureLoader.loadAsync(constructorAssets.diffuse),
      textureLoader.loadAsync(constructorAssets.normal),
      textureLoader.loadAsync(constructorAssets.roughness),
      textureLoader.loadAsync(constructorAssets.metalness),
    ])
      .then(([object, diffuse, normal, roughness, metalness]) => {
        diffuse.colorSpace = THREE.SRGBColorSpace;
        const baseMaterial = new THREE.MeshStandardMaterial({
          map: diffuse,
          normalMap: normal,
          roughnessMap: roughness,
          metalnessMap: metalness,
          metalness: 0.85,
          roughness: 0.4,
        });

        const root = new THREE.Group();
        root.add(object);

        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = baseMaterial.clone();
            mesh.castShadow = false;
            mesh.receiveShadow = false;
          }
        });

        // Normalize scale and pivot so the base rests at y=0
        const bbox = new THREE.Box3().setFromObject(root);
        const size = bbox.getSize(new THREE.Vector3());
        const targetHeight = 3.6;
        const scale = size.y > 0 ? targetHeight / size.y : 1;
        root.scale.setScalar(scale);

        const scaledBox = new THREE.Box3().setFromObject(root);
        const center = scaledBox.getCenter(new THREE.Vector3());
        root.position.set(-center.x, -scaledBox.min.y, -center.z);

        return root;
      })
      .catch((error) => {
        console.error(
          'Failed to load constructor ship model, using fallback.',
          error,
        );
        return buildDefaultConstructorModel();
      });
    return cache;
  };
})();

export const cloneConstructionShip = (base: THREE.Object3D) => {
  const clone = base.clone(true);
  clone.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry = mesh.geometry.clone();
      }
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((mat) =>
          markDisposableMaterial(mat.clone()),
        );
      } else if (mesh.material) {
        mesh.material = markDisposableMaterial(
          (mesh.material as THREE.Material).clone(),
        );
      }
    }
  });
  return clone;
};

