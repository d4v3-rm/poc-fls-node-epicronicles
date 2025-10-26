import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { DebugConsole } from '../debug/DebugConsole';
import { useGameLoop } from '../../utils/useGameLoop';
import { GalaxyMap } from './GalaxyMap';
import { ColonyPanel } from './ColonyPanel';
import { ShipyardPanel } from './ShipyardPanel';
import { FleetAndCombatPanel } from './FleetAndCombatPanel';
import { HudTopBar } from './HudTopBar';
import { HudBottomBar } from './HudBottomBar';
import { DraggablePanel } from '../ui/DraggablePanel';
import type { StarSystem } from '../../domain/types';

export const GameScreen = () => {
  useGameLoop();
  const session = useGameStore((state) => state.session);
  const sessionId = session?.id;
  const returnToMenu = useGameStore((state) => state.returnToMenu);
  const setSimulationRunning = useGameStore(
    (state) => state.setSimulationRunning,
  );
  const [debugOpen, setDebugOpen] = useState(false);
  const [shipyardSystemId, setShipyardSystemId] = useState<string | null>(null);

  if (!session) {
    return (
      <div className="panel">
        <p>No active session.</p>
        <button className="panel__action" onClick={returnToMenu}>
          Back to menu
        </button>
      </div>
    );
  }

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    setSimulationRunning(true, Date.now());
  }, [sessionId, setSimulationRunning]);

  const viewportWidth =
    typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight =
    typeof window !== 'undefined' ? window.innerHeight : 800;
  const systems = session.galaxy.systems;
  const shipyardSystem: StarSystem | null =
    systems.find((system) => system.id === shipyardSystemId) ?? null;

  return (
    <div className="game-layout">
      <HudTopBar />
      <div className="game-map-layer">
        <GalaxyMap onSystemSelect={(systemId) => setShipyardSystemId(systemId)} />
      </div>
      <HudBottomBar
        onToggleDebug={() => setDebugOpen((value) => !value)}
        debugOpen={debugOpen}
      />
      <div className="floating-panels">
        <DraggablePanel title="Colonie" initialX={20} initialY={140}>
          <ColonyPanel />
        </DraggablePanel>
        <DraggablePanel title="Flotte & Battaglie" initialX={viewportWidth - 340} initialY={420}>
          <FleetAndCombatPanel />
        </DraggablePanel>
        {debugOpen ? (
          <DraggablePanel
            title="Debug"
            initialX={viewportWidth - 420}
            initialY={viewportHeight - 380}
            onClose={() => setDebugOpen(false)}
          >
            <DebugConsole />
          </DraggablePanel>
        ) : null}
        {shipyardSystem ? (
          <div className="shipyard-modal">
            <div className="shipyard-modal__content">
              <button
                className="shipyard-modal__close"
                onClick={() => setShipyardSystemId(null)}
              >
                ×
              </button>
              <ShipyardPanel system={shipyardSystem} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
