import type {
  PopulationJobId,
  GameNotification,
  GameSession,
  ResourceCost,
  ResourceType,
  WarEvent,
  WarEventType,
  Planet,
} from '../../domain/types';

export const appendNotification = (
  session: GameSession,
  message: string,
  kind: GameNotification['kind'],
  tick?: number,
): GameSession => {
  const entry: GameNotification = {
    id: `notif-${crypto.randomUUID()}`,
    tick: tick ?? session.clock.tick,
    kind,
    message,
  };
  return {
    ...session,
    notifications: [...session.notifications, entry].slice(-6),
  };
};

export const appendWarEvent = (
  session: GameSession,
  type: WarEventType,
  empireId: string,
  tick: number,
  message: string,
): GameSession => {
  const event: WarEvent = {
    id: `war-${crypto.randomUUID()}`,
    type,
    empireId,
    tick,
    message,
  };
  return {
    ...session,
    warEvents: [...session.warEvents, event].slice(-12),
  };
};

export const refundResourceCost = (
  economy: GameSession['economy'],
  cost: ResourceCost,
) => {
  const resources = { ...economy.resources };
  Object.entries(cost).forEach(([type, amount]) => {
    if (!amount) {
      return;
    }
    const resourceType = type as ResourceType;
    const ledger = resources[resourceType];
    resources[resourceType] = {
      amount: (ledger?.amount ?? 0) + amount,
      income: ledger?.income ?? 0,
      upkeep: ledger?.upkeep ?? 0,
    };
  });
  return {
    ...economy,
    resources,
  };
};

export const updatePlanetPopulation = (
  planet: Planet,
  updates: Partial<Planet['population']>,
): Planet => ({
  ...planet,
  population: {
    ...planet.population,
    ...updates,
  },
});

export const updatePopulationCounts = (
  planet: Planet,
  changes: Partial<Record<PopulationJobId, number>>,
): Planet => {
  const next = { ...planet.population };
  (Object.keys(changes) as PopulationJobId[]).forEach((jobId) => {
    const delta = changes[jobId] ?? 0;
    next[jobId] = Math.max(0, next[jobId] + delta);
  });
  return updatePlanetPopulation(planet, next);
};
