import type { Fleet, ShipDesign } from '@domain/types';

export const isConstructionFleet = (
  fleet: Fleet,
  shipDesignLookup: Map<string, ShipDesign>,
) =>
  fleet.ships.some(
    (ship) => shipDesignLookup.get(ship.designId)?.role === 'construction',
  );

