import type { GameConfig } from './types';
import { eventsConfig } from './events';
import { researchConfig } from './research';
import { traditionsConfig } from './traditions';
import { economyConfig } from './economy';
import { militaryConfig } from './military';
import { colonizationConfig } from './colonization';
import { diplomacyConfig } from './diplomacy';
import { mapConfig } from './map';
import { starVisuals } from './starVisuals';
import { starClasses } from './starClasses';

export * from './types';

export const gameConfig: GameConfig = {
  ticksPerSecond: 1,
  defaultGalaxy: {
    seed: 'debug-seed',
    systemCount: 18,
    galaxyRadius: 256,
    galaxyShape: 'circle',
  },
  galaxyShapes: ['circle', 'spiral', 'ring', 'bar', 'ellipse', 'cluster'],
  galaxyRadii: [128, 256, 512, 1024, 1536, 2048],
  galaxySystemCounts: [8, 16, 32, 64, 128, 256],
  debug: {
    autoStart: false,
  },
  exploration: {
    travelTicks: 3,
    surveyTicks: 2,
  },
  economy: economyConfig,
  research: researchConfig,
  traditions: traditionsConfig,
  events: eventsConfig,
  colonization: colonizationConfig,
  diplomacy: diplomacyConfig,
  military: militaryConfig,
  map: mapConfig,
  starVisuals,
  starClasses,
};
