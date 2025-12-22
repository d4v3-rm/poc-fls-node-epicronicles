import type { GalaxyMapData } from './state';
import { useGalaxyMapContext } from './context';
import { useMapFocus, useMapInteractions } from './interaction';
import { useSceneRebuild } from './scene/useSceneRebuild';
import type { MutableRefObject } from 'react';
import {
  scienceMaterials,
  scienceLineMaterials,
  fleetMaterials,
} from '@three/materials';

type GalaxyMapCanvasProps = {
  data: GalaxyMapData;
  focusSystemId: string | null;
  focusTrigger: number;
  onShipyardSelect?: (
    systemId: string,
    anchor: { x: number; y: number },
  ) => void;
  onClearFocus?: () => void;
  onSelectRef: MutableRefObject<
    ((systemId: string, anchor: { x: number; y: number }) => void) | undefined
  >;
  onClearRef: MutableRefObject<(() => void) | undefined>;
};

export const GalaxyMapCanvas = ({
  data,
  focusSystemId,
  focusTrigger,
  onShipyardSelect,
  onClearFocus,
  onSelectRef,
  onClearRef,
}: GalaxyMapCanvasProps) => {
  const { refs } = useGalaxyMapContext();
  const { containerRef } = refs;

  useMapInteractions({
    onSelectRef,
    onClearRef,
    onShipyardSelect,
  });

  useSceneRebuild({
    systems: data.systems,
    colonizedLookup: data.colonizedLookup,
    recentCombatSystems: data.recentCombatSystems,
    activeBattles: data.activeBattles,
    starVisuals: data.starVisuals,
    scienceShips: data.scienceShips,
    fleets: data.fleets,
    empireWar: data.empireWar,
    sceneSignature: data.sceneSignature,
    galaxyShape: data.galaxyShape,
    galaxySeed: data.galaxySeed,
    maxSystemRadius: data.maxSystemRadius,
    scienceMaterials,
    scienceLineMaterials,
    fleetMaterials,
    shipDesignLookup: data.shipDesignLookup,
  });

  useMapFocus({
    focusSystemId,
    focusTrigger,
    systems: data.systems,
    onClearFocus,
  });

  return <div className="galaxy-map" ref={containerRef} />;
};
