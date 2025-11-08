import type {
  EventLogEntry,
  EventOption,
  EventOptionEffect,
  GameEvent,
  GameSession,
  ResourceType,
} from '@domain/types';
import type { EventsConfig } from '@config/gameConfig';
import { canAffordCost, spendResources } from '@domain/economy/economy';

export interface EventState {
  active: GameEvent | null;
  log: EventLogEntry[];
}

const resourceLabels: Record<ResourceType, string> = {
  energy: 'Energia',
  minerals: 'Minerali',
  food: 'Cibo',
  research: 'Ricerca',
  influence: 'Influenza',
};

const applyEffect = (
  session: GameSession,
  effect: EventOptionEffect,
  fallbackSystemId?: string | null,
): GameSession => {
  switch (effect.kind) {
    case 'resource': {
      if (!effect.target) {
        return session;
      }
      const delta = effect.amount ?? 0;
      if (delta === 0) {
        return session;
      }
      const resources = { ...session.economy.resources };
      const ledger = resources[effect.target];
      if (!ledger) {
        return session;
      }
      resources[effect.target] = {
        ...ledger,
        amount: Math.max(0, ledger.amount + delta),
      };
      return {
        ...session,
        economy: { ...session.economy, resources },
      };
    }
    case 'influence': {
      const delta = effect.amount ?? 0;
      if (delta === 0) {
        return session;
      }
      const resources = { ...session.economy.resources };
      const ledger = resources.influence;
      resources.influence = {
        ...ledger,
        amount: Math.max(0, (ledger?.amount ?? 0) + delta),
      };
      return {
        ...session,
        economy: { ...session.economy, resources },
      };
    }
    case 'hostileSpawn': {
      const targetSystemId = effect.systemId ?? fallbackSystemId;
      const delta = effect.amount ?? 0;
      if (!targetSystemId || delta === 0) {
        return session;
      }
      const systems = session.galaxy.systems.map((system) =>
        system.id === targetSystemId
          ? { ...system, hostilePower: Math.max(0, (system.hostilePower ?? 0) + delta) }
          : system,
      );
      return { ...session, galaxy: { ...session.galaxy, systems } };
    }
    case 'stability': {
      const delta = effect.amount ?? 0;
      if (delta === 0) {
        return session;
      }
      const planets = session.economy.planets.map((planet) => ({
        ...planet,
        stability: Math.max(20, Math.min(95, planet.stability + delta)),
      }));
      return { ...session, economy: { ...session.economy, planets } };
    }
    case 'insight':
    default:
      return session;
  }
};

export const resolveEvent = ({
  session,
  option,
  activeEvent,
  tick,
}: {
  session: GameSession;
  option: EventOption;
  activeEvent: GameEvent;
  tick: number;
}): { session: GameSession; logEntry: EventLogEntry } => {
  let updatedSession = session;
  option.effects.forEach((effect) => {
    updatedSession = applyEffect(updatedSession, effect, activeEvent.systemId);
  });

  const logEntry: EventLogEntry = {
    id: `evt-log-${activeEvent.id}`,
    tick,
    title: activeEvent.title,
    result: option.label,
  };
  return { session: updatedSession, logEntry };
};

export const canAffordOption = (
  session: GameSession,
  option: EventOption,
): boolean => {
  const costEffects = option.effects.filter(
    (effect) => effect.kind === 'resource' && (effect.amount ?? 0) < 0,
  );
  if (costEffects.length === 0) {
    return true;
  }
  const cost = costEffects.reduce<Record<ResourceType, number>>((acc, effect) => {
    const target = effect.target;
    if (target && typeof effect.amount === 'number' && effect.amount < 0) {
      acc[target] = Math.abs(effect.amount);
    }
    return acc;
  }, {} as Record<ResourceType, number>);
  return canAffordCost(session.economy, cost);
};

export const applyOptionCost = (
  session: GameSession,
  option: EventOption,
): GameSession['economy'] => {
  const cost = option.effects.reduce<Record<ResourceType, number>>((acc, effect) => {
    if (effect.kind !== 'resource' || !effect.target) {
      return acc;
    }
    if (typeof effect.amount === 'number' && effect.amount < 0) {
      acc[effect.target] = Math.abs(effect.amount);
    }
    return acc;
  }, {} as Record<ResourceType, number>);
  return spendResources(session.economy, cost);
};

const pick = <T>(items: T[]): T | null =>
  items.length === 0 ? null : items[Math.floor(Math.random() * items.length)];

const createNarrativeEvent = (config: EventsConfig): GameEvent | null => {
  const definitions = config.narrative;
  const def = pick(definitions);
  if (!def) {
    return null;
  }
  return {
    ...def,
    id: `evt-${def.id}-${crypto.randomUUID()}`,
  };
};

const createAnomalyEvent = (config: EventsConfig, systemId: string): GameEvent | null => {
  const def = pick(config.anomalies);
  if (!def) {
    return null;
  }
  return {
    ...def,
    id: `anomaly-${def.id}-${crypto.randomUUID()}`,
    systemId,
  };
};

const createCrisisEvent = (config: EventsConfig, systemId: string): GameEvent | null => {
  const def = pick(config.crisis);
  if (!def) {
    return null;
  }
  return {
    ...def,
    id: `crisis-${def.id}-${crypto.randomUUID()}`,
    systemId,
  };
};

export const maybeSpawnEvent = ({
  session,
  config,
  tick,
}: {
  session: GameSession;
  config: EventsConfig;
  tick: number;
}): GameEvent | null => {
  if (session.notifications.some((n) => n.kind === 'eventStarted' && tick - n.tick < 4)) {
    return null;
  }
  if (session.warEvents.length > 0 && Math.random() < 0.2) {
    return null;
  }

  if (tick > 40 && tick % config.crisisIntervalTicks === 0) {
    const target = pick(session.galaxy.systems.filter((s) => s.visibility === 'surveyed'));
    return target ? createCrisisEvent(config, target.id) : null;
  }

  if (tick > 15 && tick % config.anomalyIntervalTicks === 0) {
    const target = pick(
      session.galaxy.systems.filter(
        (s) => s.visibility === 'surveyed' && (s.hostilePower ?? 0) === 0,
      ),
    );
    return target ? createAnomalyEvent(config, target.id) : null;
  }

  if (tick > 10 && tick % config.narrativeIntervalTicks === 0) {
    return createNarrativeEvent(config);
  }

  return null;
};

export const formatOptionCost = (option: EventOption): string => {
  const costs = option.effects.filter(
    (e) => e.kind === 'resource' && (e.amount ?? 0) < 0 && e.target,
  );
  if (costs.length === 0) {
    return '';
  }
  return costs
    .map((c) => `${resourceLabels[c.target as ResourceType]} ${Math.abs(c.amount ?? 0)}`)
    .join(', ');
};
