import type {
  EconomyState,
  Planet,
  PlanetKind,
  ResourceLedger,
  ResourceType,
} from './types';

export const RESOURCE_TYPES: ResourceType[] = [
  'energy',
  'minerals',
  'food',
  'research',
];

export interface HomeworldConfig {
  name: string;
  kind: PlanetKind;
  size: number;
  population: number;
  baseProduction: Partial<Record<ResourceType, number>>;
  upkeep: Partial<Record<ResourceType, number>>;
}

export interface EconomyConfig {
  startingResources: Partial<Record<ResourceType, number>>;
  homeworld: HomeworldConfig;
}

const createLedger = (
  starting: Partial<Record<ResourceType, number>>,
): Record<ResourceType, ResourceLedger> =>
  RESOURCE_TYPES.reduce<Record<ResourceType, ResourceLedger>>((acc, type) => {
    const amount = starting[type] ?? 0;
    acc[type] = {
      amount,
      income: 0,
      upkeep: 0,
    };
    return acc;
  }, {} as Record<ResourceType, ResourceLedger>);

const createHomeworld = (
  systemId: string,
  config: HomeworldConfig,
): Planet => ({
  id: `HOME-${systemId}`,
  name: config.name,
  systemId,
  kind: config.kind,
  size: config.size,
  population: config.population,
  baseProduction: config.baseProduction,
  upkeep: config.upkeep,
});

export const createInitialEconomy = (
  homeSystemId: string,
  config: EconomyConfig,
): EconomyState => ({
  resources: createLedger(config.startingResources),
  planets: [createHomeworld(homeSystemId, config.homeworld)],
});

export interface AdvanceEconomyResult {
  economy: EconomyState;
  netProduction: Record<ResourceType, number>;
}

export const advanceEconomy = (
  state: EconomyState,
  _config: EconomyConfig,
): AdvanceEconomyResult => {
  const totals = RESOURCE_TYPES.reduce(
    (acc, type) => {
      acc.income[type] = 0;
      acc.upkeep[type] = 0;
      return acc;
    },
    {
      income: {} as Record<ResourceType, number>,
      upkeep: {} as Record<ResourceType, number>,
    },
  );

  state.planets.forEach((planet) => {
    RESOURCE_TYPES.forEach((type) => {
      const production = planet.baseProduction[type] ?? 0;
      const consumption = planet.upkeep[type] ?? 0;
      totals.income[type] += production;
      totals.upkeep[type] += consumption;
    });
  });

  const resources = { ...state.resources };
  const netProduction: Record<ResourceType, number> = {
    energy: 0,
    minerals: 0,
    food: 0,
    research: 0,
  };

  RESOURCE_TYPES.forEach((type) => {
    const income = totals.income[type];
    const upkeep = totals.upkeep[type];
    const net = income - upkeep;
    netProduction[type] = net;
    const current = resources[type] ?? { amount: 0, income: 0, upkeep: 0 };
    resources[type] = {
      amount: Math.max(0, current.amount + net),
      income,
      upkeep,
    };
  });

  return {
    economy: {
      ...state,
      resources,
    },
    netProduction,
  };
};
