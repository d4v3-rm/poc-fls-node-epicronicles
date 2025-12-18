import { useGalaxyMapData } from './state/useGalaxyMapData';
import { useGalaxyMapContext } from './context/GalaxyMapContext';
import { useMapFocus } from './interaction/useMapFocus';
import { useMapInteractions } from './interaction/useMapInteractions';
import { useSceneRebuild } from './scene/useSceneRebuild';
import type { MutableRefObject } from 'react';
import {
  scienceMaterials,
  scienceLineMaterials,
  fleetMaterials,
} from '@three/materials';

type GalaxyMapCanvasProps = {
  data: ReturnType<typeof useGalaxyMapData>;
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
