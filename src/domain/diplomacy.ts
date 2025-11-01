import type { DiplomacyConfig } from '../config/gameConfig';
import type { Empire, GameNotification } from './types';

const clampOpinion = (value: number) => Math.max(-100, Math.min(100, value));

export const advanceDiplomacy = ({
  empires,
  config,
  tick,
}: {
  empires: Empire[];
  config: DiplomacyConfig;
  tick: number;
}): { empires: Empire[]; notifications: GameNotification[] } => {
  if (empires.length <= 1) {
    return { empires, notifications: [] };
  }
  if (tick % Math.max(1, config.autoCheckInterval) !== 0) {
    return { empires, notifications: [] };
  }

  const notifications: GameNotification[] = [];
  const updated = empires.map((entry) => ({ ...entry }));

  updated.forEach((empire) => {
    if (empire.kind === 'player') {
      return;
    }
    const drifted = clampOpinion(
      empire.opinion + config.opinionDriftPerCheck,
    );
    empire.opinion = drifted;

    if (empire.warStatus === 'peace' && drifted <= config.warThreshold) {
      empire.warStatus = 'war';
      notifications.push({
        id: `notif-${crypto.randomUUID()}`,
        tick,
        kind: 'warDeclared',
        message: `${empire.name} ha dichiarato guerra!`,
      });
    } else if (
      empire.warStatus === 'war' &&
      drifted >= config.peaceThreshold
    ) {
      empire.warStatus = 'peace';
      notifications.push({
        id: `notif-${crypto.randomUUID()}`,
        tick,
        kind: 'peaceAccepted',
        message: `${empire.name} accetta una tregua.`,
      });
    }
  });

  return { empires: updated, notifications };
};
