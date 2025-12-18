import {
  Group,
  Mesh,
  RingGeometry,
  MeshBasicMaterial,
  DoubleSide,
  PlaneGeometry,
  CanvasTexture,
  SpriteMaterial,
  Sprite,
} from 'three';
import type { StarSystem, StarClass } from '@domain/types';
import {
  hostileIndicatorMaterial,
  combatIndicatorMaterial,
  battleIconMaterial,
  ownerMaterials,
} from '@three/materials';
import { StarEntity, fallbackStarVisuals, type StarVisual } from '../Star';
import { markDisposableMaterial, markDisposableTexture } from '../dispose';

const noop = () => undefined;

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

export interface SystemUpdateParams {
  systemGroup: Group;
  zoomFactor: number;
  camera: import('three').PerspectiveCamera;
}

export class SystemEntity {
  private starVisuals: Record<StarClass, StarVisual> = fallbackStarVisuals;
  private starEntity: StarEntity = new StarEntity();

  setup(params: { starVisuals: Record<StarClass, StarVisual> }) {
    this.starVisuals = params.starVisuals;
    this.starEntity.setup({ starVisuals: params.starVisuals });
  }

  private createLabelSprite(text: string) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const fontSize = 48;
    ctx.font = `600 ${fontSize}px Inter`;
    const textWidth = ctx.measureText(text).width + 40;
    canvas.width = textWidth;
    canvas.height = fontSize * 1.8;

    ctx.font = `600 ${fontSize}px Inter`;
    ctx.fillStyle = '#e5ecff';
    ctx.fillText(text, 20, fontSize);

    const texture = markDisposableTexture(new CanvasTexture(canvas));
    texture.needsUpdate = true;
    const material = markDisposableMaterial(
      new SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    ) as SpriteMaterial;

    const sprite = new Sprite(material);
    sprite.userData.baseWidth = canvas.width / 30;
    sprite.userData.baseHeight = canvas.height / 30;
    sprite.scale.set(sprite.userData.baseWidth, sprite.userData.baseHeight, 1);
    sprite.position.set(0, 8, 0);
    sprite.renderOrder = 20;
    sprite.raycast = noop;
    sprite.name = 'label';
    return sprite;
  }

  private addOwnerRings({
    node,
    systemId,
    baseRadius,
    ownerKey,
    hasColonized,
  }: {
    node: Group;
    systemId: string;
    baseRadius: number;
    ownerKey: 'player' | 'ai';
    hasColonized: boolean;
  }) {
    const baseInner = baseRadius + 3.6;
    const baseOuter = baseInner + 2.5;

    const baseRing = new Mesh(
      new RingGeometry(baseInner, baseOuter, 32),
      ownerRingMaterials[ownerKey],
    );
    baseRing.userData.systemId = systemId;
    baseRing.userData.kind = 'ownerBase';
    baseRing.raycast = noop;
    baseRing.rotation.x = -Math.PI / 2;
    node.add(baseRing);

    if (hasColonized && ownerKey === 'player') {
      const colonizedInner = baseRadius + 2.1;
      const colonizedOuter = colonizedInner + 1.2;
      const colonizedRing = new Mesh(
        new RingGeometry(colonizedInner, colonizedOuter, 32),
        colonizedRingMaterial,
      );
      colonizedRing.userData.systemId = systemId;
      colonizedRing.userData.kind = 'colonizedSystem';
      colonizedRing.raycast = noop;
      colonizedRing.rotation.x = -Math.PI / 2;
      node.add(colonizedRing);
    }
  }

  private addHostileIndicator(node: Group, system: StarSystem, baseRadius: number) {
    if (!system.hostilePower || system.hostilePower <= 0) return;
    const ring = new Mesh(
      new RingGeometry(baseRadius + 1.2, baseRadius + 2.1, 24),
      hostileRingMaterial,
    );
    ring.userData.systemId = system.id;
    ring.userData.kind = 'hostile';
    ring.raycast = noop;
    ring.rotation.x = -Math.PI / 2;
    node.add(ring);
  }

  private addCombatIndicator(
    node: Group,
    systemId: string,
    baseRadius: number,
    recentCombatSystems: Set<string>,
  ) {
    if (!recentCombatSystems.has(systemId)) return;
    const ring = new Mesh(
      new RingGeometry(baseRadius + 2.2, baseRadius + 3.6, 24),
      combatRingMaterial,
    );
    ring.userData.systemId = systemId;
    ring.userData.kind = 'combat';
    ring.raycast = noop;
    ring.rotation.x = -Math.PI / 2;
    node.add(ring);
  }

  private addBattleIndicator(
    node: Group,
    systemId: string,
    baseRadius: number,
    activeBattles: Set<string>,
  ) {
    if (!activeBattles.has(systemId)) return;
    const cross = new Mesh(
      new PlaneGeometry((baseRadius + 3) * 1.6, (baseRadius + 3) * 1.6),
      battleIndicatorMaterial,
    );
    cross.position.y = 0.5;
    cross.userData.systemId = systemId;
    cross.scale.set(1, 0.2, 1);
    cross.raycast = noop;
    cross.rotation.x = -Math.PI / 2;
    node.add(cross);
  }

  private addShipyardMarker({
    node,
    system,
    baseRadius,
  }: { node: Group; system: StarSystem; baseRadius: number }) {
    if (!system.hasShipyard) return;
    const square = new Mesh(
      new PlaneGeometry(baseRadius * 1.6, baseRadius * 1.6),
      shipyardMarkerMaterial,
    );
    square.userData.systemId = system.id;
    square.userData.kind = 'shipyard';
    square.rotation.z = Math.PI / 4;
    square.rotation.x = -Math.PI / 2;
    square.position.set(0, baseRadius + 2.5, 0);
    node.add(square);
  }

  rebuild({
    system,
    recentCombatSystems,
    activeBattles,
    colonizedPlanet,
  }: {
    system: StarSystem;
    recentCombatSystems: Set<string>;
    activeBattles: Set<string>;
    colonizedPlanet?: { id: string; name: string } | null;
  }): Group {
    const node = new Group();
    node.name = system.id;
    node.userData.systemId = system.id;
    node.userData.visibility = system.visibility;
    const pos = system.mapPosition ?? system.position;
    const depth = pos.y ?? 0;
    node.position.set(pos.x, 0, depth);

    const isRevealed = system.visibility !== 'unknown';
    const visuals = this.starVisuals ?? fallbackStarVisuals;
    const baseRadius = visuals[system.starClass]?.coreRadius ?? 2.1;

    const starVisual = this.starEntity.rebuild({
      starClass: system.starClass,
      visibility: system.visibility,
      pulseSeed: system.id.charCodeAt(0),
    });
    starVisual.userData.systemId = system.id;
    node.add(starVisual);

    const label = isRevealed ? this.createLabelSprite(system.name) : null;
    if (label) {
      label.position.y = baseRadius + 6;
      node.add(label);
    }

    const hasColonized = Boolean(colonizedPlanet);

    if (system.ownerId) {
      const ownerKey = system.ownerId === 'player' ? 'player' : 'ai';
      this.addOwnerRings({
        node,
        systemId: system.id,
        baseRadius,
        ownerKey,
        hasColonized,
      });
    }

    this.addHostileIndicator(node, system, baseRadius);
    this.addCombatIndicator(node, system.id, baseRadius, recentCombatSystems);
    this.addBattleIndicator(node, system.id, baseRadius, activeBattles);
    this.addShipyardMarker({ node, system, baseRadius });

    return node;
  }

  update(node: Group) {
    this.starEntity.update(node);
  }
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
    const showLabels = camera.position.y < 240 && zoomFactor < 0.9;
    const baseLabelScale = showLabels
      ? Math.min(1.4, Math.max(0.45, 120 / Math.max(1, camera.position.y)))
      : 1;
    const starLabelScale = baseLabelScale;
    const ringOpacity = 0.2 + zoomFactor * 0.5;

    systemGroup.children.forEach((node) => {
      const label = node.getObjectByName('label') as Sprite;
      if (label) {
        label.visible = showLabels;
        if (showLabels) {
          label.scale.set(
            label.userData.baseWidth * starLabelScale,
            label.userData.baseHeight * starLabelScale,
            1,
          );
        }
      }

      node.children.forEach((child) => {
        if (
          child instanceof Mesh &&
          (child.userData?.kind === 'ownerBase' ||
            child.userData?.kind === 'colonizedSystem' ||
            child.userData?.kind === 'hostile' ||
            child.userData?.kind === 'combat')
        ) {
          const mat = child.material as MeshBasicMaterial & {
            opacity?: number;
            transparent?: boolean;
          };
          if (mat.opacity !== undefined) {
            mat.transparent = true;
            mat.opacity = ringOpacity;
          }
        }
      });

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
