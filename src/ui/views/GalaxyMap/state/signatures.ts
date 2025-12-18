import type { GalaxyShape } from '@domain/galaxy/galaxy';
import type { Fleet, ScienceShip, ShipDesign, StarSystem } from '@domain/types';

const sortById = <T extends { id: string }>(items: T[]) =>
  [...items].sort((a, b) => a.id.localeCompare(b.id));

const fleetKind = (fleet: Fleet, shipDesignLookup: Map<string, ShipDesign>) => {
  const roles = new Set(
    fleet.ships.map((ship) => shipDesignLookup.get(ship.designId)?.role),
  );
  if (roles.has('construction')) return 'construction';
  if (roles.has('colony')) return 'colony';
  if (roles.has('science')) return 'science';
  if (roles.has('military')) return 'military';
  return fleet.ships.length > 0 ? 'mixed' : 'empty';
};

const buildFleetsSignature = (
  fleets: Fleet[],
  shipDesignLookup: Map<string, ShipDesign>,
) =>
  sortById(fleets)
    .map((fleet) => {
      const kind = fleetKind(fleet, shipDesignLookup);
      return `${fleet.id}:${kind}:${fleet.systemId}:${fleet.targetSystemId ?? ''}`;
    })
    .join('|');

const buildScienceShipsSignature = (scienceShips: ScienceShip[]) =>
  sortById(scienceShips)
    .map(
      (ship) =>
        `${ship.id}:${ship.status}:${ship.currentSystemId}:${ship.targetSystemId ?? ''}`,
    )
    .join('|');

const buildSystemsVisualSignature = ({
  systems,
  colonizedSystems,
  recentCombatSystems,
  activeBattles,
}: {
  systems: StarSystem[];
  colonizedSystems: Set<string>;
  recentCombatSystems: Set<string>;
  activeBattles: Set<string>;
}) =>
  sortById(systems)
    .map((system) => {
      const hostile = (system.hostilePower ?? 0) > 0 ? 1 : 0;
      const colonized = colonizedSystems.has(system.id) ? 1 : 0;
      const recentCombat = recentCombatSystems.has(system.id) ? 1 : 0;
      const activeBattle = activeBattles.has(system.id) ? 1 : 0;
      const shipyard = system.hasShipyard ? 1 : 0;
      const shipyardBuild = system.shipyardBuild ? 1 : 0;
      return `${system.id}:${system.starClass}:${system.visibility}:${system.ownerId ?? ''}:${hostile}:${colonized}:${recentCombat}:${activeBattle}:${shipyard}:${shipyardBuild}`;
    })
    .join('|');

export const buildSceneSignature = ({
  systems,
  fleets,
  scienceShips,
  shipDesignLookup,
  colonizedSystems,
  recentCombatSystems,
  activeBattles,
  empireWar,
  galaxyShape,
  galaxySeed,
}: {
  systems: StarSystem[];
  fleets: Fleet[];
  scienceShips: ScienceShip[];
  shipDesignLookup: Map<string, ShipDesign>;
  colonizedSystems: Set<string>;
  recentCombatSystems: Set<string>;
  activeBattles: Set<string>;
  empireWar: boolean;
  galaxyShape: GalaxyShape;
  galaxySeed: string;
}) => {
  const systemsSignature = buildSystemsVisualSignature({
    systems,
    colonizedSystems,
    recentCombatSystems,
    activeBattles,
  });
  const fleetsSignature = buildFleetsSignature(fleets, shipDesignLookup);
  const scienceSignature = buildScienceShipsSignature(scienceShips);
  const war = empireWar ? 1 : 0;

  return `G:${galaxyShape}:${galaxySeed}|W:${war}|SYS:${systemsSignature}|FLT:${fleetsSignature}|SCI:${scienceSignature}`;
};
