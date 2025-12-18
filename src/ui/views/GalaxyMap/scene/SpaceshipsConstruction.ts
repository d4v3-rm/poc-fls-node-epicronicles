import * as THREE from 'three';
import type { Fleet, ShipDesign } from '@domain/types';
import type { AnchorEntry } from './anchors/AnchorsResolver';
import { SceneEntityBase } from './SceneEntityBase';
import {
  cloneConstructionShip,
  getConstructionShipModel,
} from './constructionShipModel';
import { isConstructionFleet } from './fleetRoles';

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

export class ConstructionSpaceships extends SceneEntityBase {
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
    const buildId =
      ((group.userData?.__constructorBuildId as number | undefined) ?? 0) + 1;
    group.userData = group.userData ?? {};
    group.userData.__constructorBuildId = buildId;
    const fleetTargetGroup =
      (group.getObjectByName('fleetTargets') as THREE.Group | null) ??
      (() => {
        const created = new THREE.Group();
        created.name = 'fleetTargets';
        group.add(created);
        return created;
      })();

    const constructionFleets = fleets.filter((fleet) =>
      isConstructionFleet(fleet, this.shipDesignLookup),
    );
    if (constructionFleets.length === 0) {
      return fleetTargetGroup;
    }

    const statusMaterials = empireWar
      ? { ship: this.fleetMaterials.war, line: this.fleetMaterials.warLine }
      : { ship: this.fleetMaterials.idle, line: this.fleetMaterials.line };

    const placeholderGeometry = new THREE.SphereGeometry(0.8, 12, 12);
    const placeholderMesh = new THREE.InstancedMesh(
      placeholderGeometry,
      statusMaterials.ship ?? this.fleetMaterials.idle,
      constructionFleets.length,
    );
    placeholderMesh.name = 'constructionPlaceholders';
    placeholderMesh.userData = { entityKind: 'construction', instances: constructionFleets };
    group.add(placeholderMesh);

    let fleetTargetGeometry: THREE.BoxGeometry | null = null;
    const entriesForBuild: AnchorEntry[] = [];

    constructionFleets.forEach((fleet, idx) => {
      const entry: AnchorEntry = {
        mesh: placeholderMesh,
        index: idx,
        systemId: fleet.systemId,
        height: 3,
      };
      entriesForBuild.push(entry);
      this.fleetAnchorsRef.push(entry);

      if (fleet.targetSystemId && fleet.targetSystemId !== fleet.systemId) {
        const targetGeometry =
          fleetTargetGeometry ?? new THREE.BoxGeometry(0.5, 0.5, 0.5);
        fleetTargetGeometry = targetGeometry;
        const targetMaterial = statusMaterials.ship ?? this.fleetMaterials.idle;
        const lineMaterial = statusMaterials.line ?? this.fleetMaterials.line;
        this.createTravelPath({
          group: fleetTargetGroup,
          fromSystemId: fleet.systemId,
          toSystemId: fleet.targetSystemId,
          lineMaterial,
          targetGeometry,
          targetMaterial,
          targetHeight: 1.5,
        });
      }
    });
    placeholderMesh.instanceMatrix.needsUpdate = true;

    getConstructionShipModel()
      .then((model) => {
        if (
          (group.userData?.__constructorBuildId as number | undefined) !== buildId
        ) {
          return;
        }

        group.remove(placeholderMesh);
        placeholderMesh.geometry.dispose();

        entriesForBuild.forEach((entry, idx) => {
          const fleet = constructionFleets[idx];
          const ship = cloneConstructionShip(model);
          ship.name = 'constructionShip';
          ship.userData = {
            ...ship.userData,
            systemId: fleet.systemId,
            kind: 'constructionShip',
          };
          ship.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              (child as THREE.Mesh).castShadow = false;
              (child as THREE.Mesh).receiveShadow = false;
            }
          });
          const basePos = this.positions.get(fleet.systemId);
          if (basePos) {
            ship.position.set(basePos.x, basePos.y + entry.height, basePos.z);
          }
          group.add(ship);
          entry.mesh = undefined;
          entry.index = undefined;
          entry.object = ship;
        });
      })
      .catch(() => {
        // Keep placeholders if the model can't be loaded.
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
