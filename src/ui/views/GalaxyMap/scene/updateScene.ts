import * as THREE from 'three';
import type { MutableRefObject } from 'react';
import type { AnchorEntry } from './anchors/AnchorsResolver';
import type { GalaxySceneContext } from './useGalaxyScene';
import type { BlackHoleLensingData } from './postprocessing/blackHoleLensingPass';
import { CameraEntity } from './Camera';
import { updateSystemEntities } from './System';
import { BASE_TILT, MAX_TILT_DOWN } from './constants';

const cameraEntity = new CameraEntity();
const lensingCenter = new THREE.Vector3();
const lensingNdc = new THREE.Vector3();
const lensingEdge = new THREE.Vector3();
const lensingNdcEdge = new THREE.Vector3();
const lensingHorizon = new THREE.Vector3();
const lensingNdcHorizon = new THREE.Vector3();
const lensingScreenCenter = new THREE.Vector2();
const lensingScreenEdge = new THREE.Vector2();
const lensingScreenHorizon = new THREE.Vector2();
const lensingForward = new THREE.Vector3();
const lensingRight = new THREE.Vector3();

const getBlackHoleLensing = (
  ctx: GalaxySceneContext,
  zoomFactor: number,
): BlackHoleLensingData | undefined => {
  const blackHole = (ctx.backgroundGroup.userData as {
    blackHole?: {
      object: THREE.Object3D;
      lensingRadius: number;
      horizonRadius: number;
    };
  }).blackHole;
  if (!blackHole) {
    return undefined;
  }

  const { object, lensingRadius, horizonRadius } = blackHole;
  object.getWorldPosition(lensingCenter);
  lensingNdc.copy(lensingCenter).project(ctx.camera);
  if (lensingNdc.z < -1 || lensingNdc.z > 1) {
    return undefined;
  }

  const maxOffscreen = 1.45;
  if (Math.abs(lensingNdc.x) > maxOffscreen || Math.abs(lensingNdc.y) > maxOffscreen) {
    return undefined;
  }

  lensingScreenCenter.set(lensingNdc.x * 0.5 + 0.5, lensingNdc.y * 0.5 + 0.5);

  ctx.camera.getWorldDirection(lensingForward);
  lensingRight.crossVectors(lensingForward, ctx.camera.up).normalize();

  lensingEdge.copy(lensingCenter).addScaledVector(lensingRight, lensingRadius);
  lensingNdcEdge.copy(lensingEdge).project(ctx.camera);
  lensingScreenEdge.set(
    lensingNdcEdge.x * 0.5 + 0.5,
    lensingNdcEdge.y * 0.5 + 0.5,
  );
  const screenRadius = lensingScreenEdge.distanceTo(lensingScreenCenter);

  lensingHorizon.copy(lensingCenter).addScaledVector(lensingRight, horizonRadius);
  lensingNdcHorizon.copy(lensingHorizon).project(ctx.camera);
  lensingScreenHorizon.set(
    lensingNdcHorizon.x * 0.5 + 0.5,
    lensingNdcHorizon.y * 0.5 + 0.5,
  );
  const screenHorizon = lensingScreenHorizon.distanceTo(lensingScreenCenter);

  if (!Number.isFinite(screenRadius) || screenRadius <= 0) {
    return undefined;
  }

  const zoomFade = THREE.MathUtils.smoothstep(zoomFactor, 0.45, 0.9);
  if (zoomFade <= 0.02) {
    return undefined;
  }
  const strength = 0.1 + 0.65 * zoomFade;

  const edgeMargin = 0.2;
  const edgeDistance = Math.max(
    Math.max(0, Math.abs(lensingNdc.x) - 1),
    Math.max(0, Math.abs(lensingNdc.y) - 1),
  );
  const opacity = (1 - Math.min(1, edgeDistance / edgeMargin)) * zoomFade;
  if (opacity <= 0) {
    return undefined;
  }

  return {
    center: lensingScreenCenter,
    radius: screenRadius,
    horizon: Math.min(screenHorizon, screenRadius * 0.85),
    strength,
    opacity,
  };
};

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

  const updateBackground = (params.ctx.backgroundGroup.userData as {
    update?: (elapsed: number, zoomFactor: number) => void;
  }).update;
  if (typeof updateBackground === 'function') {
    updateBackground(params.elapsed, zoomFactor);
  }

  if (typeof params.ctx.postprocessingUpdate === 'function') {
    const lensing = getBlackHoleLensing(params.ctx, zoomFactor);
    params.ctx.postprocessingUpdate(params.elapsed, lensing);
  }
};
