import { useMemo } from 'react';
import type { GalaxyMapContextValue } from './GalaxyMapContext';
import type { GalaxyMapRefs } from './useGalaxyMapRefs';
import type { GalaxySceneContext } from '../scene/useGalaxyScene';
import type { useGalaxyMapData } from '../state/useGalaxyMapData';
import { BASE_TILT, MAX_TILT_DOWN } from '../scene/constants';

type UseGalaxyMapContextValueParams = {
  data: ReturnType<typeof useGalaxyMapData>;
  refs: GalaxyMapRefs;
  sceneContext: GalaxySceneContext | null;
};

export const useGalaxyMapContextValue = ({
  data,
  refs,
  sceneContext,
}: UseGalaxyMapContextValueParams): GalaxyMapContextValue => {
  const { cameraState, anchorState } = refs;

  return useMemo(
    () => ({
      cameraState,
      anchorState,
      refs,
      sceneContext,
      minZoom: data.minZoom,
      maxZoom: data.maxZoom,
      baseTilt: BASE_TILT,
      maxTiltDown: MAX_TILT_DOWN,
    }),
    [anchorState, cameraState, refs, sceneContext, data.minZoom, data.maxZoom],
  );
};
