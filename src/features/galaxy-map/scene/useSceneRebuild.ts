import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { StarSystem, ScienceShip, Fleet } from '@domain/types';
import { rebuildScene } from './Scene';
import { useGalaxyMapContext } from '../context/GalaxyMapContext';
import { disposeGroupResources } from './dispose';
import { buildGalaxyBackground } from './background/buildGalaxyBackground';
import type { GalaxyShape } from '@domain/galaxy/galaxy';

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
  galaxyShape: GalaxyShape;
  galaxySeed: string;
  maxSystemRadius: number;
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
  galaxyShape,
  galaxySeed,
  maxSystemRadius,
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
  const backgroundSignatureRef = useRef<string>('');
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

    const resolverForBuild = anchorResolverRef.current;

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
      getVector: resolverForBuild.getVector,
      releaseVector: resolverForBuild.releaseVector,
      getMatrix: resolverForBuild.getMatrix,
      releaseMatrix: resolverForBuild.releaseMatrix,
      shipDesignLookup,
      starRotations,
    });

    systemPositionRef.current = positions;
    anchorResolverRef.current.setup(systemPositionRef.current);

    updateAnchorInstances();

    const backgroundGroup = sceneContext.backgroundGroup;
    const nextBackgroundSignature = `${galaxySeed}:${galaxyShape}:${systems.length}:${Math.round(maxSystemRadius)}`;
    if (backgroundSignatureRef.current !== nextBackgroundSignature) {
      backgroundSignatureRef.current = nextBackgroundSignature;
      disposeGroupResources(backgroundGroup);
      buildGalaxyBackground({
        group: backgroundGroup,
        galaxyShape,
        galaxySeed,
        systemPositions: positions,
        maxSystemRadius,
      });
    }
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
    galaxyShape,
    galaxySeed,
    maxSystemRadius,
    scienceMaterials,
    scienceLineMaterials,
    fleetMaterials,
    anchorResolverRef,
    systemGroupRef,
    systemPositionRef,
    sceneSignatureRef,
    scienceAnchorsRef,
    fleetAnchorsRef,
    backgroundSignatureRef,
  ]);
};
