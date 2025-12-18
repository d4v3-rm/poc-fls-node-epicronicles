import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { AnchorsResolver, type AnchorEntry } from '../scene/anchors/AnchorsResolver';
import { BASE_TILT } from '../scene/constants';
import type { GalaxySceneContext } from '../scene/useGalaxyScene';

export type GalaxyMapRefs = ReturnType<typeof useGalaxyMapRefs>;

export const useGalaxyMapRefs = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const systemGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const offsetTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const zoomTargetRef = useRef(170);
  const zoomTargetDirtyRef = useRef(false);
  const tiltStateRef = useRef<{ current: number; target: number }>({
    current: BASE_TILT,
    target: BASE_TILT,
  });
  const tempSphericalRef = useRef(new THREE.Spherical());
  const tempOffsetRef = useRef(new THREE.Vector3());
  const systemPositionRef = useRef(new Map<string, THREE.Vector3>());
  const scienceAnchorsRef = useRef<AnchorEntry[]>([]);
  const fleetAnchorsRef = useRef<AnchorEntry[]>([]);
  const sceneSignatureRef = useRef<string>('');
  const anchorResolverRef = useRef<AnchorsResolver | null>(null);

  const syncSceneContext = useCallback((sceneContext: GalaxySceneContext | null) => {
    if (!sceneContext) {
      return;
    }
    cameraRef.current = sceneContext.camera;
    systemGroupRef.current = sceneContext.systemGroup;
  }, []);

  const cameraState = useMemo(
    () => ({
      systemGroupRef,
      cameraRef,
      offsetTargetRef,
      zoomTargetRef,
      zoomTargetDirtyRef,
      tiltStateRef,
      tempSphericalRef,
      tempOffsetRef,
    }),
    [],
  );

  const anchorState = useMemo(
    () => ({
      systemPositionRef,
      scienceAnchorsRef,
      fleetAnchorsRef,
      sceneSignatureRef,
      anchorResolverRef,
    }),
    [],
  );

  return useMemo(
    () => ({
      containerRef,
      systemGroupRef,
      cameraRef,
      offsetTargetRef,
      zoomTargetRef,
      zoomTargetDirtyRef,
      tiltStateRef,
      tempSphericalRef,
      tempOffsetRef,
      systemPositionRef,
      scienceAnchorsRef,
      fleetAnchorsRef,
      sceneSignatureRef,
      anchorResolverRef,
      cameraState,
      anchorState,
      syncSceneContext,
    }),
    [cameraState, anchorState, syncSceneContext],
  );
};
