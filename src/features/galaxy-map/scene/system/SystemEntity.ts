import { Group } from 'three';
import type { StarClass, StarSystem } from '@domain/types';
import { StarEntity, fallbackStarVisuals, type StarVisual } from '../Star';
import { SYSTEM_LABEL_OFFSET_Y } from './constants';
import { createLabelSprite } from './createLabelSprite';
import {
  addBattleIndicator,
  addCombatIndicator,
  addHostileIndicator,
  addOwnerRings,
  addShipyardMarker,
} from './indicators';

export class SystemEntity {
  private starVisuals: Record<StarClass, StarVisual> = fallbackStarVisuals;
  private starEntity: StarEntity = new StarEntity();

  setup(params: { starVisuals: Record<StarClass, StarVisual> }) {
    this.starVisuals = params.starVisuals;
    this.starEntity.setup({ starVisuals: params.starVisuals });
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

    const label = isRevealed ? createLabelSprite(system.name) : null;
    if (label) {
      label.position.y = baseRadius + SYSTEM_LABEL_OFFSET_Y;
      node.add(label);
    }

    const hasColonized = Boolean(colonizedPlanet);

    if (system.ownerId) {
      const ownerKey = system.ownerId === 'player' ? 'player' : 'ai';
      addOwnerRings({
        node,
        systemId: system.id,
        baseRadius,
        ownerKey,
        hasColonized,
      });
    }

    addHostileIndicator({ node, system, baseRadius });
    addCombatIndicator({
      node,
      systemId: system.id,
      baseRadius,
      recentCombatSystems,
    });
    addBattleIndicator({
      node,
      systemId: system.id,
      baseRadius,
      activeBattles,
    });
    addShipyardMarker({ node, system, baseRadius });

    return node;
  }

  update(node: Group) {
    this.starEntity.update(node);
  }
}

