import { Group, Mesh, PlaneGeometry, RingGeometry } from 'three';
import type { StarSystem } from '@domain/types';
import { systemMaterials } from './materials';

const noop = () => undefined;

export const addOwnerRings = ({
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
}) => {
  const baseInner = baseRadius + 3.6;
  const baseOuter = baseInner + 2.5;

  const baseRing = new Mesh(
    new RingGeometry(baseInner, baseOuter, 32),
    systemMaterials.ownerRingMaterials[ownerKey],
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
      systemMaterials.colonizedRingMaterial,
    );
    colonizedRing.userData.systemId = systemId;
    colonizedRing.userData.kind = 'colonizedSystem';
    colonizedRing.raycast = noop;
    colonizedRing.rotation.x = -Math.PI / 2;
    node.add(colonizedRing);
  }
};

export const addHostileIndicator = ({
  node,
  system,
  baseRadius,
}: {
  node: Group;
  system: StarSystem;
  baseRadius: number;
}) => {
  if (!system.hostilePower || system.hostilePower <= 0) {
    return;
  }
  const ring = new Mesh(
    new RingGeometry(baseRadius + 1.2, baseRadius + 2.1, 24),
    systemMaterials.hostileRingMaterial,
  );
  ring.userData.systemId = system.id;
  ring.userData.kind = 'hostile';
  ring.raycast = noop;
  ring.rotation.x = -Math.PI / 2;
  node.add(ring);
};

export const addCombatIndicator = ({
  node,
  systemId,
  baseRadius,
  recentCombatSystems,
}: {
  node: Group;
  systemId: string;
  baseRadius: number;
  recentCombatSystems: Set<string>;
}) => {
  if (!recentCombatSystems.has(systemId)) {
    return;
  }
  const ring = new Mesh(
    new RingGeometry(baseRadius + 2.2, baseRadius + 3.6, 24),
    systemMaterials.combatRingMaterial,
  );
  ring.userData.systemId = systemId;
  ring.userData.kind = 'combat';
  ring.raycast = noop;
  ring.rotation.x = -Math.PI / 2;
  node.add(ring);
};

export const addBattleIndicator = ({
  node,
  systemId,
  baseRadius,
  activeBattles,
}: {
  node: Group;
  systemId: string;
  baseRadius: number;
  activeBattles: Set<string>;
}) => {
  if (!activeBattles.has(systemId)) {
    return;
  }
  const cross = new Mesh(
    new PlaneGeometry((baseRadius + 3) * 1.6, (baseRadius + 3) * 1.6),
    systemMaterials.battleIndicatorMaterial,
  );
  cross.position.y = 0.5;
  cross.userData.systemId = systemId;
  cross.scale.set(1, 0.2, 1);
  cross.raycast = noop;
  cross.rotation.x = -Math.PI / 2;
  node.add(cross);
};

export const addShipyardMarker = ({
  node,
  system,
  baseRadius,
}: {
  node: Group;
  system: StarSystem;
  baseRadius: number;
}) => {
  if (!system.hasShipyard) {
    return;
  }
  const square = new Mesh(
    new PlaneGeometry(baseRadius * 1.6, baseRadius * 1.6),
    systemMaterials.shipyardMarkerMaterial,
  );
  square.userData.systemId = system.id;
  square.userData.kind = 'shipyard';
  square.rotation.z = Math.PI / 4;
  square.rotation.x = -Math.PI / 2;
  square.position.set(0, baseRadius + 2.5, 0);
  node.add(square);
};

