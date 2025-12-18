import { useEffect, useRef } from 'react';
import { useGalaxyMapContext } from '../context/GalaxyMapContext';
import { useCameraController } from '../scene/useCameraController';
import { MAP_FOCUS_ZOOM } from './constants';

export interface MapFocusParams {
  focusSystemId: string | null;
  focusTrigger: number;
  systems: Array<{
    id: string;
    visibility: string;
    position: { x: number; y: number };
    mapPosition?: { x: number; y: number; z?: number };
  }>;
  onClearFocus?: () => void;
}

export const useMapFocus = ({
  focusSystemId,
  focusTrigger,
  systems,
  onClearFocus,
}: MapFocusParams) => {
  const { focusOnPosition } = useCameraController();
  const { sceneContext } = useGalaxyMapContext();
  const lastFocusAppliedRef = useRef<{ id: string | null; trigger: number }>(
    { id: null, trigger: -1 },
  );

  useEffect(() => {
    if (sceneContext) {
      lastFocusAppliedRef.current = { id: null, trigger: -1 };
    }
  }, [sceneContext]);

  useEffect(() => {
    if (!focusSystemId) {
      lastFocusAppliedRef.current = { id: null, trigger: -1 };
      return;
    }
    const alreadyApplied =
      lastFocusAppliedRef.current.id === focusSystemId &&
      lastFocusAppliedRef.current.trigger === focusTrigger;
    if (alreadyApplied) {
      return;
    }
    const target = systems.find((system) => system.id === focusSystemId);
    if (!target) {
      return;
    }
    if (target.visibility === 'unknown') {
      onClearFocus?.();
      return;
    }
    const pos = {
      x: target.mapPosition?.x ?? target.position.x,
      y: 0,
      z: target.mapPosition?.y ?? target.position.y ?? 0,
    };
    focusOnPosition(pos, { zoom: MAP_FOCUS_ZOOM, immediate: true });
    lastFocusAppliedRef.current = { id: focusSystemId, trigger: focusTrigger };
  }, [
    focusSystemId,
    systems,
    onClearFocus,
    focusTrigger,
    focusOnPosition,
  ]);
};
