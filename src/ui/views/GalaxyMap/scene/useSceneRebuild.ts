import { useEffect } from 'react';
import * as THREE from 'three';
import type { StarSystem, ScienceShip, Fleet } from '@domain/types';
import { rebuildScene } from './Scene';
import { AnchorsResolver } from './anchors/AnchorsResolver';
import { useGalaxyMapContext } from '../context/GalaxyMapContext';
import { disposeGroupResources } from './dispose';

export interface UseSceneRebuildParams {
  systems: StarSystem[];
  colonizedLookup: Map<string, { id: string; name: string }>;
  recentCombatSystems: Set<string>;
  activeBattles: Set<string>;
  starVisuals: Record<string, unknown>;
  scienceShips: ScienceShip[];
  fleets: Fleet[];
  empireWar: boolean;
  sceneSignature: string;
  scienceMaterials: Record<string, THREE.Material>;
  scienceLineMaterials: Record<string, THREE.Material>;
  fleetMaterials: Record<string, THREE.Material>;
  shipDesignLookup: Map<string, import('@domain/types').ShipDesign>;
}

const preserveStarRotations = (group: THREE.Group) => {
  const map = new Map<string, number>();
  group.children.forEach((child) => {
    const systemId = child.userData?.systemId as string | undefined;
    if (!systemId) {
      return;
    }
    const starGroup = child.getObjectByName('starVisual') as THREE.Group | null;
    if (starGroup) {
      map.set(systemId, starGroup.rotation.y);
    }
  });
  return map;
};

export const useSceneRebuild = ({
  systems,
  colonizedLookup,
  recentCombatSystems,
  activeBattles,
  starVisuals,
  scienceShips,
  fleets,
  empireWar,
  sceneSignature,
  scienceMaterials,
  scienceLineMaterials,
  fleetMaterials,
  shipDesignLookup,
}: UseSceneRebuildParams) => {
  const {
    sceneContext,
    cameraState: { systemGroupRef },
    anchorState: {
      systemPositionRef,
      sceneSignatureRef,
      scienceAnchorsRef,
      fleetAnchorsRef,
      anchorResolverRef,
    },
  } = useGalaxyMapContext();
  useEffect(() => {
    const group = systemGroupRef.current ?? sceneContext?.systemGroup ?? null;
    if (!sceneContext || !group) {
      return;
    }

    if (sceneSignatureRef.current === sceneSignature) {
      return;
    }
    sceneSignatureRef.current = sceneSignature;

    const starRotations = preserveStarRotations(group);

    disposeGroupResources(group);

    const resolverForBuild =
      anchorResolverRef.current ??
      new AnchorsResolver(systemPositionRef.current);

    const { positions, updateAnchorInstances } = rebuildScene({
      group,
      systems,
      colonizedLookup,
      recentCombatSystems,
      activeBattles,
      starVisuals,
      scienceShips,
      fleets,
      empireWar,
      scienceMaterials,
      scienceLineMaterials,
      fleetMaterials,
      scienceAnchorsRef: scienceAnchorsRef.current,
      fleetAnchorsRef: fleetAnchorsRef.current,
      getVector: resolverForBuild.getVector.bind(resolverForBuild),
      releaseVector: resolverForBuild.releaseVector.bind(resolverForBuild),
      getMatrix: resolverForBuild.getMatrix.bind(resolverForBuild),
      releaseMatrix: resolverForBuild.releaseMatrix.bind(resolverForBuild),
      shipDesignLookup,
      starRotations,
    });

    systemPositionRef.current = positions;
    anchorResolverRef.current = new AnchorsResolver(systemPositionRef.current);

    updateAnchorInstances();
  }, [
    sceneContext,
    systems,
    colonizedLookup,
    recentCombatSystems,
    activeBattles,
    starVisuals,
    scienceShips,
    fleets,
    shipDesignLookup,
    empireWar,
    sceneSignature,
    scienceMaterials,
    scienceLineMaterials,
    fleetMaterials,
    anchorResolverRef,
    systemGroupRef,
    systemPositionRef,
    sceneSignatureRef,
    scienceAnchorsRef,
    fleetAnchorsRef,
  ]);
};
