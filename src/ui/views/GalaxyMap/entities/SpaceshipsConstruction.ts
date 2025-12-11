import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import type { Fleet, ShipDesign } from '@domain/types';
import type { AnchorEntry } from './Anchors';
import { SpaceshipsBase } from './SpaceshipsBase';

interface ConstructorAnchorParams {
  group: THREE.Group;
  fleets: Fleet[];
  positions: Map<string, THREE.Vector3>;
  empireWar: boolean;
  fleetAnchorsRef: AnchorEntry[];
  fleetMaterials: Record<string, THREE.Material>;
  getVector: () => THREE.Vector3;
  releaseVector: (v: THREE.Vector3) => void;
  shipDesignLookup: Map<string, ShipDesign>;
}

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

const constructorModel = (() => {
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
        diffuse.encoding = THREE.sRGBEncoding;
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
        console.error('Failed to load constructor ship model, using fallback.', error);
        return buildDefaultConstructorModel();
      });
    return cache;
  };
})();

const cloneConstructionShip = (base: THREE.Object3D) => {
  const clone = base.clone(true);
  clone.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry = mesh.geometry.clone();
      }
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((mat) => mat.clone());
      } else if (mesh.material) {
        mesh.material = (mesh.material as THREE.Material).clone();
      }
    }
  });
  return clone;
};

const isConstructionFleet = (
  fleet: Fleet,
  designLookup: Map<string, ShipDesign>,
) =>
  fleet.ships.some(
    (ship) => designLookup.get(ship.designId)?.role === 'construction',
  );

export class ConstructionSpaceships extends SpaceshipsBase {
  private fleetAnchorsRef: AnchorEntry[] = [];
  private fleetMaterials: Record<string, THREE.Material> = {};
  private shipDesignLookup: Map<string, ShipDesign> = new Map();

  setup({
    fleetAnchorsRef,
    fleetMaterials,
    shipDesignLookup,
  }: Pick<ConstructorAnchorParams, 'fleetAnchorsRef' | 'fleetMaterials' | 'shipDesignLookup'>) {
    this.fleetAnchorsRef = fleetAnchorsRef;
    this.fleetMaterials = fleetMaterials;
    this.shipDesignLookup = shipDesignLookup;
  }

  rebuild({
    group,
    fleets,
    empireWar,
  }: Pick<ConstructorAnchorParams, 'group' | 'fleets' | 'empireWar'>) {
    const fleetTargetGroup = group.getObjectByName('fleetTargets') as THREE.Group | null;
    const fleetGeometry = new THREE.SphereGeometry(0.8, 12, 12);
    const fleetTargetGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    constructorModel()
      .then((model) => {
        (['idle', 'war'] as const).forEach((status) => {
          const list = fleets.filter(() =>
            status === 'war' ? empireWar : !empireWar,
          );
          const constructionFleets = list.filter((fleet) =>
            isConstructionFleet(fleet, this.shipDesignLookup),
          );
          if (constructionFleets.length === 0) {
            return;
          }
          const lineMaterial =
            status === 'war' ? this.fleetMaterials.warLine : this.fleetMaterials.line;
          const targetMaterial =
            status === 'war' ? this.fleetMaterials.war : this.fleetMaterials.idle;
          const placeholderMaterial =
            status === 'war' ? this.fleetMaterials.war : this.fleetMaterials.idle;

          constructionFleets.forEach((fleet) => {
            const placeholder = new THREE.Mesh(fleetGeometry, placeholderMaterial);
            placeholder.scale.set(2.2, 2.2, 2.2);
            placeholder.name = 'constructionPlaceholder';
            const entry: AnchorEntry = {
              object: placeholder,
              systemId: fleet.systemId,
              height: 3,
            };
            this.fleetAnchorsRef.push(entry);
            group.add(placeholder);

            const ship = cloneConstructionShip(model);
            ship.name = 'constructionShip';
            ship.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                (child as THREE.Mesh).castShadow = false;
                (child as THREE.Mesh).receiveShadow = false;
              }
            });
            ship.position.copy(placeholder.position);
            ship.position.y += entry.height;
            group.add(ship);
            group.remove(placeholder);
            entry.object = ship;

            if (fleet.targetSystemId && fleet.targetSystemId !== fleet.systemId) {
              this.createTravelPath({
                group: fleetTargetGroup ?? group,
                fromSystemId: fleet.systemId,
                toSystemId: fleet.targetSystemId,
                lineMaterial,
                targetGeometry: fleetTargetGeometry,
                targetMaterial,
                targetHeight: 1.5,
              });
            }
          });
        });
      })
      .catch(() => {
        // Ignore loading errors to avoid breaking the scene.
      });
    return fleetTargetGroup;
  }
}

export const buildConstructionAnchors = (params: ConstructorAnchorParams) => {
  const builder = new ConstructionSpaceships(
    params.positions,
    params.getVector,
    params.releaseVector,
  );
  builder.setup({
    fleetAnchorsRef: params.fleetAnchorsRef,
    fleetMaterials: params.fleetMaterials,
    shipDesignLookup: params.shipDesignLookup,
  });
  return builder.rebuild({
    group: params.group,
    fleets: params.fleets,
    empireWar: params.empireWar,
  });
};
