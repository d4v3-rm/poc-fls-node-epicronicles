import { Group, Sprite } from 'three';
import type { StarSystem, StarClass } from '@domain/types';
import type { StarVisual } from '../Star';
import { SystemEntity } from './SystemEntity';
import {
  SYSTEM_LABELS_MAX_CAMERA_HEIGHT,
  SYSTEM_LABELS_MAX_ZOOM_FACTOR,
  SYSTEM_LABELS_SCALE_BASE_HEIGHT,
  SYSTEM_LABELS_SCALE_MAX,
  SYSTEM_LABELS_SCALE_MIN,
  SYSTEM_RING_OPACITY_BASE,
  SYSTEM_RING_OPACITY_FACTOR,
} from './constants';
import { setSystemRingOpacity } from './materials';

export interface SystemUpdateParams {
  systemGroup: Group;
  zoomFactor: number;
  camera: import('three').PerspectiveCamera;
}

export interface SystemBuildParams {
  group: Group;
  systems: StarSystem[];
  colonizedLookup: Map<string, { id: string; name: string }>;
  recentCombatSystems: Set<string>;
  activeBattles: Set<string>;
  starVisuals: Record<StarClass, StarVisual>;
  starRotations?: Map<string, number>;
}

export class SystemEntities {
  private systemEntity: SystemEntity;

  constructor() {
    this.systemEntity = new SystemEntity();
  }

  setup(params: { starVisuals: Record<StarClass, StarVisual> }) {
    this.systemEntity.setup({ starVisuals: params.starVisuals });
  }

  rebuild({
    group,
    systems,
    colonizedLookup,
    recentCombatSystems,
    activeBattles,
    starRotations,
  }: SystemBuildParams) {
    const positions = new Map<string, Group['position']>();

    systems.forEach((system) => {
      const colonizedPlanet = colonizedLookup.get(system.id);
      const node = this.systemEntity.rebuild({
        system,
        recentCombatSystems,
        activeBattles,
        colonizedPlanet,
      });
      const preservedSpin = starRotations?.get(system.id);
      if (preservedSpin !== undefined) {
        const starGroup = node.getObjectByName('starVisual') as Group | null;
        if (starGroup) {
          starGroup.rotation.y = preservedSpin;
        }
      }
      group.add(node);
      positions.set(system.id, node.position.clone());
    });

    return positions;
  }

  update({ systemGroup, zoomFactor, camera }: SystemUpdateParams) {
    const showLabels =
      camera.position.y < SYSTEM_LABELS_MAX_CAMERA_HEIGHT &&
      zoomFactor < SYSTEM_LABELS_MAX_ZOOM_FACTOR;
    const baseLabelScale = showLabels
      ? Math.min(
          SYSTEM_LABELS_SCALE_MAX,
          Math.max(
            SYSTEM_LABELS_SCALE_MIN,
            SYSTEM_LABELS_SCALE_BASE_HEIGHT / Math.max(1, camera.position.y),
          ),
        )
      : 1;
    const ringOpacity =
      SYSTEM_RING_OPACITY_BASE + zoomFactor * SYSTEM_RING_OPACITY_FACTOR;
    setSystemRingOpacity(ringOpacity);

    systemGroup.children.forEach((node) => {
      const label = node.getObjectByName('label') as Sprite;
      if (label) {
        label.visible = showLabels;
        if (showLabels) {
          label.scale.set(
            label.userData.baseWidth * baseLabelScale,
            label.userData.baseHeight * baseLabelScale,
            1,
          );
        }
      }

      this.systemEntity.update(node as Group);
    });
  }
}

export const buildSystems = (params: SystemBuildParams) => {
  const systems = new SystemEntities();
  systems.setup({ starVisuals: params.starVisuals });
  return systems.rebuild(params);
};

const systemUpdater = new SystemEntities();
export const updateSystemEntities = (params: SystemUpdateParams) =>
  systemUpdater.update(params);

