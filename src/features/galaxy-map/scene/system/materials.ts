import { DoubleSide, MeshBasicMaterial } from 'three';
import {
  hostileIndicatorMaterial,
  combatIndicatorMaterial,
  battleIconMaterial,
  ownerMaterials,
} from '@three/materials';

const ownerRingMaterials = {
  player: ownerMaterials.player.clone(),
  ai: ownerMaterials.ai.clone(),
} as const;
ownerRingMaterials.player.side = DoubleSide;
ownerRingMaterials.ai.side = DoubleSide;

const hostileRingMaterial = hostileIndicatorMaterial.clone();
hostileRingMaterial.side = DoubleSide;

const combatRingMaterial = combatIndicatorMaterial.clone();
combatRingMaterial.side = DoubleSide;

const battleIndicatorMaterial = battleIconMaterial.clone();
battleIndicatorMaterial.side = DoubleSide;
battleIndicatorMaterial.depthWrite = false;

const colonizedRingMaterial = new MeshBasicMaterial({
  color: '#6fe6a5',
  transparent: true,
  opacity: 0.16,
  depthWrite: false,
  side: DoubleSide,
});

const shipyardMarkerMaterial = new MeshBasicMaterial({
  color: '#7fc1ff',
  opacity: 0.35,
  transparent: true,
  depthWrite: false,
});

export const systemMaterials = {
  ownerRingMaterials,
  hostileRingMaterial,
  combatRingMaterial,
  battleIndicatorMaterial,
  colonizedRingMaterial,
  shipyardMarkerMaterial,
};

export const setSystemRingOpacity = (opacity: number) => {
  systemMaterials.ownerRingMaterials.player.opacity = opacity;
  systemMaterials.ownerRingMaterials.ai.opacity = opacity;
  systemMaterials.colonizedRingMaterial.opacity = opacity;
  systemMaterials.hostileRingMaterial.opacity = opacity;
  systemMaterials.combatRingMaterial.opacity = opacity;
};

