import { gameConfig } from '../../src/config/gameConfig';
import {
  advanceResearch,
  createInitialResearch,
  listAvailableTechs,
  startResearch,
} from '../../src/engines/research/research';
import {
  advanceTraditions,
  createInitialTraditions,
  unlockTradition,
} from '../../src/engines/traditions/traditions';

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const finishTech = (techId: string, researchState: ReturnType<typeof createInitialResearch>) => {
  const tech = gameConfig.research.techs.find((t) => t.id === techId);
  if (!tech) throw new Error(`Tech ${techId} not found in config`);
  const started = startResearch(tech.branch, techId, researchState, gameConfig.research);
  assert(started.success, `Cannot start research ${techId}: ${started.reason}`);
  const tick = advanceResearch({
    state: started.state,
    researchIncome: tech.cost * 3, // enough to finish in one tick (split on 3 branches)
    config: gameConfig.research,
  });
  assert(
    tick.completed.some((t) => t.id === techId),
    `Research ${techId} did not complete`,
  );
  return tick.research;
};

const smokeResearch = () => {
  let research = createInitialResearch(gameConfig.research);
  const maxEra = Math.max(...(gameConfig.research.eras ?? []).map((e) => e.id));

  // Disponibilità iniziale per ogni ramo
  (['physics', 'society', 'engineering'] as const).forEach((branch) => {
    const available = listAvailableTechs(branch, research, gameConfig.research);
    assert(available.length > 0, `No tech available for branch ${branch} at start`);
  });

  // Completa gateway Era 2
  research = finishTech('advanced-sensors', research);
  research = finishTech('reinforced-alloys', research);
  assert(
    research.currentEra === 2 && research.unlockedEras.includes(2),
    'Era 2 not unlocked after gateway techs',
  );

  // Completa gateway Era 3
  research = finishTech('bureaucracy', research);
  research = finishTech('modular-yards', research);
  assert(
    research.currentEra === 3 && research.unlockedEras.includes(3),
    'Era 3 not unlocked after gateway techs',
  );

  // Completa gateway Era 4
  research = finishTech('deep-space-navigation', research);
  research = finishTech('stellar-logistics', research);
  assert(
    research.currentEra === maxEra && research.unlockedEras.includes(maxEra),
    `Era ${maxEra} not unlocked after gateway techs`,
  );
};

const smokeTraditions = () => {
  let traditions = createInitialTraditions(gameConfig.traditions);
  // Accumula punti
  traditions = advanceTraditions({
    state: traditions,
    influenceIncome: 200, // 200 * 0.05 = 10 punti
    config: gameConfig.traditions,
  });

  // Sblocca 3 perk di Era 1 (60% del pool)
  ['survey-speed', 'logistics', 'bureaucrats'].forEach((perkId) => {
    const result = unlockTradition(perkId, traditions, gameConfig.traditions);
    assert(result.success, `Cannot unlock perk ${perkId}: ${result.reason}`);
    traditions = result.state;
  });

  const nextEra = Math.min(
    ...gameConfig.traditions.perks
      .map((p) => p.era ?? 1)
      .filter((era) => era > 1),
    Number.POSITIVE_INFINITY,
  );
  if (nextEra !== Number.POSITIVE_INFINITY) {
    assert(
      traditions.currentEra >= nextEra && traditions.unlockedEras.includes(nextEra),
      `Traditions era ${nextEra} not unlocked after 60% perks`,
    );
  } else {
    assert(traditions.currentEra === 1, 'Traditions era advanced without higher-era perks');
  }
};

const run = () => {
  smokeResearch();
  smokeTraditions();
  console.log('QA progression smoke: OK');
};

run();
