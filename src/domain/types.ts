export type GameView = 'mainMenu' | 'simulation';

export interface SimulationClock {
  tick: number;
  elapsedMs: number;
  speedMultiplier: number;
  isRunning: boolean;
  lastUpdate: number | null;
}

export type StarClass = 'mainSequence' | 'giant' | 'dwarf';

export interface Vector2 {
  x: number;
  y: number;
}

export interface StarSystem {
  id: string;
  name: string;
  position: Vector2;
  starClass: StarClass;
  discovered: boolean;
}

export interface GalaxyState {
  seed: string;
  systems: StarSystem[];
}

export interface GameSession {
  id: string;
  label: string;
  createdAt: number;
  galaxy: GalaxyState;
  clock: SimulationClock;
}
