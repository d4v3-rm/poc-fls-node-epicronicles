import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { useGalaxyMapContext } from '../context/GalaxyMapContext';
import { useCameraController } from '../scene/useCameraController';
import { computeAnchor, resolveHitObject } from './raycast';
import { MAP_FOCUS_ZOOM } from './constants';

interface UseMapInteractionsParams {
  onSelectRef: MutableRefObject<
    ((systemId: string, anchor: { x: number; y: number }) => void) | undefined
  >;
  onClearRef: MutableRefObject<(() => void) | undefined>;
  onShipyardSelect?: (
    systemId: string,
    anchor: { x: number; y: number },
  ) => void;
}

export const useMapInteractions = ({
  onSelectRef,
  onClearRef,
  onShipyardSelect,
}: UseMapInteractionsParams) => {
  const { focusOnPosition, toggleTilt, clampZoom, setZoomTarget } = useCameraController();
  const {
    sceneContext,
    cameraState: { systemGroupRef },
    anchorState: { systemPositionRef },
  } = useGalaxyMapContext();
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  useEffect(() => {
    const group = systemGroupRef.current ?? sceneContext?.systemGroup ?? null;
    if (!sceneContext || !group) {
      return undefined;
    }
    const { renderer, camera, controls } = sceneContext;
    const systemGroup = group;

    const handleContextMenu = (event: MouseEvent) => event.preventDefault();
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const distance = camera.position.distanceTo(controls.target);
      const step = Math.max(20, distance * 0.35);
      const delta = Math.sign(event.deltaY) * step;
      const next = clampZoom(distance + delta);
      setZoomTarget(next);
    };

    const handleAuxiliaryTilt = (event: MouseEvent) => {
      if (event.button !== 1) return;
      event.preventDefault();
      event.stopPropagation();
      toggleTilt();
    };

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || !systemGroup.children.length) {
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = mouseRef.current;
      const raycaster = raycasterRef.current;
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(systemGroup.children, true);
      const hit = resolveHitObject(intersects);
      if (!hit) {
        onClearRef.current?.();
        return;
      }

      if (hit.visibility === 'unknown') {
        onClearRef.current?.();
        return;
      }
      const { systemId, kind, worldPos } = hit;
      const systemPos = systemPositionRef.current.get(systemId);
      focusOnPosition(
        {
          x: systemPos?.x ?? worldPos.x,
          y: 0,
          z: systemPos?.z ?? worldPos.z,
        },
        { zoom: MAP_FOCUS_ZOOM },
      );
      const anchor = computeAnchor(worldPos, camera, {
        width: renderer.domElement.clientWidth,
        height: renderer.domElement.clientHeight,
      });
      if (kind === 'shipyard' && onShipyardSelect) {
        onShipyardSelect(systemId, anchor);
      } else {
        onSelectRef.current?.(systemId, anchor);
      }
    };

    renderer.domElement.addEventListener('contextmenu', handleContextMenu);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    renderer.domElement.addEventListener('auxclick', handleAuxiliaryTilt);
    renderer.domElement.addEventListener('click', handleClick);

    return () => {
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('auxclick', handleAuxiliaryTilt);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [
    sceneContext,
    systemGroupRef,
    systemPositionRef,
    onSelectRef,
    onClearRef,
    onShipyardSelect,
    focusOnPosition,
    toggleTilt,
    clampZoom,
    setZoomTarget,
  ]);
};
