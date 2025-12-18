import * as THREE from 'three';
import type { MutableRefObject } from 'react';
import type { AnchorEntry } from './anchors/AnchorsResolver';
import type { GalaxySceneContext } from './useGalaxyScene';
import { CameraEntity } from './Camera';
import { updateSystemEntities } from './System';
import { BASE_TILT, MAX_TILT_DOWN } from './constants';

const cameraEntity = new CameraEntity();

export interface SceneUpdateParams {
  ctx: GalaxySceneContext;
  delta: number;
  elapsed: number;
  minZoom: number;
  maxZoom: number;
  baseTilt?: number;
  maxTiltDown?: number;
  offsetTargetRef: MutableRefObject<THREE.Vector3>;
  zoomTargetRef: MutableRefObject<number>;
  zoomTargetDirtyRef: MutableRefObject<boolean>;
  tiltStateRef: MutableRefObject<{ current: number; target: number }>;
  tempSphericalRef: MutableRefObject<THREE.Spherical>;
  tempOffsetRef: MutableRefObject<THREE.Vector3>;
  scienceAnchors: AnchorEntry[];
  fleetAnchors: AnchorEntry[];
  updateAnchors: (group: THREE.Group, entries: AnchorEntry[]) => void;
}

export const updateScene = (params: SceneUpdateParams) => {
  const baseTilt = params.baseTilt ?? BASE_TILT;
  const maxTiltDown = params.maxTiltDown ?? MAX_TILT_DOWN;

  const { zoomFactor } = cameraEntity.update({
    ctx: params.ctx,
    delta: params.delta,
    minZoom: params.minZoom,
    maxZoom: params.maxZoom,
    minTilt: baseTilt,
    maxTilt: maxTiltDown,
    offsetTargetRef: params.offsetTargetRef,
    zoomTargetRef: params.zoomTargetRef,
    zoomTargetDirtyRef: params.zoomTargetDirtyRef,
    tiltStateRef: params.tiltStateRef,
    tempSphericalRef: params.tempSphericalRef,
    tempOffsetRef: params.tempOffsetRef,
  });

  updateSystemEntities({
    systemGroup: params.ctx.systemGroup,
    zoomFactor,
    camera: params.ctx.camera,
  });

  params.updateAnchors(params.ctx.systemGroup, params.scienceAnchors);
  params.updateAnchors(params.ctx.systemGroup, params.fleetAnchors);
};

