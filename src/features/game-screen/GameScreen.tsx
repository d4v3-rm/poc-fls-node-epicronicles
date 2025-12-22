import { useEffect, useMemo, useRef } from 'react';
import { useAppSelector, useGameStore } from '@store/gameStore';
import { useGameLoop } from '@hooks/useGameLoop';
import { BottomBar } from '@hud/BottomBar';
import { TopBar } from '@hud/TopBar';
import {
  selectColonizedSystems,
  selectPlanets,
  selectResearch,
  selectScienceShips,
  selectSystems,
} from '@store/selectors';
import { MapLayer } from './MapLayer';
import { useWarEvents } from './hooks/useWarEvents';
import { useGameScreenFocus } from './hooks/useGameScreenFocus';
import { useGameScreenWindows } from './hooks/useGameScreenWindows';
import { GameScreenDocks } from './components/GameScreenDocks';
import { GameScreenDockDetails } from './components/GameScreenDockDetails';
import { GameScreenWindows } from './components/GameScreenWindows';
import { GameScreenEmptyState } from './components/GameScreenEmptyState';
import './GameScreen.scss';

export const GameScreen = () => {
  useGameLoop();
  const session = useGameStore((state) => state.session);
  const sessionId = session?.id;
  const returnToMenu = useGameStore((state) => state.returnToMenu);
  const setSimulationRunning = useGameStore(
    (state) => state.setSimulationRunning,
  );

  const systems = useAppSelector(selectSystems);
  const planets = useAppSelector(selectPlanets);
  const colonizedSystems = useAppSelector(selectColonizedSystems);
  const scienceShips = useAppSelector(selectScienceShips);
  const researchState = useAppSelector(selectResearch);

  const completedTechs = useMemo(
    () =>
      researchState
        ? Object.values(researchState.branches).flatMap((b) => b.completed)
        : [],
    [researchState],
  );
  const colonizationUnlocked = useMemo(() => {
    if (!researchState) {
      return false;
    }
    return Object.values(researchState.branches).some((branch) =>
      branch.completed.includes('colony-foundations'),
    );
  }, [researchState]);

  const focus = useGameScreenFocus({
    session,
    systems,
    planets,
    colonizedSystems,
  });
  const { windows, openers, closers } = useGameScreenWindows();

  const orderFleetMove = useGameStore((state) => state.orderFleetMove);
  const setFleetPosition = useGameStore((state) => state.setFleetPosition);
  const mergeFleets = useGameStore((state) => state.mergeFleets);
  const splitFleet = useGameStore((state) => state.splitFleet);
  const stopFleet = useGameStore((state) => state.stopFleet);
  const buildShipyard = useGameStore((state) => state.buildShipyard);
  const shipDesigns = useGameStore((state) => state.config.military.shipDesigns);
  const orderScienceShip = useGameStore((state) => state.orderScienceShip);
  const setScienceShipPosition = useGameStore(
    (state) => state.setScienceShipPosition,
  );
  const setScienceAutoExplore = useGameStore(
    (state) => state.setScienceAutoExplore,
  );
  const stopScienceShip = useGameStore((state) => state.stopScienceShip);
  const queueDistrictConstruction = useGameStore(
    (state) => state.queueDistrictConstruction,
  );
  const removeDistrict = useGameStore((state) => state.removeDistrict);
  const promotePopulation = useGameStore((state) => state.promotePopulation);
  const demotePopulation = useGameStore((state) => state.demotePopulation);
  const economyConfig = useGameStore((state) => state.config.economy);

  const warEventsRef = useRef<HTMLUListElement | null>(null);
  const { warUnread, unreadWarIds, markWarsRead } = useWarEvents(session ?? null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    setSimulationRunning(true, Date.now());
  }, [sessionId, setSimulationRunning]);

  useEffect(() => {
    const handleVisibility = () => {
      setSimulationRunning(!document.hidden, Date.now());
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [setSimulationRunning]);

  const viewportWidth =
    typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight =
    typeof window !== 'undefined' ? window.innerHeight : 800;

  const sizeFor = (width: number, height: number) => {
    const panelWidth = Math.min(width, viewportWidth - 40);
    const panelHeight = Math.min(height, viewportHeight - 80);
    const initialX = Math.max(20, (viewportWidth - panelWidth) / 2);
    const initialY = Math.max(20, (viewportHeight - panelHeight) / 2);
    return { width: panelWidth, height: panelHeight, initialX, initialY };
  };

  const largePanel = sizeFor(1000, 700);

  if (!session) {
    return <GameScreenEmptyState onReturnToMenu={returnToMenu} />;
  }

  const handleShowWars = () => {
    const target = warEventsRef.current;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    markWarsRead();
  };

  const handleFocusFromGalaxy = (systemId: string) => {
    closers.closeGalaxy();
    focus.centerOnSystem(systemId);
  };

  const handleFocusFromColonization = (systemId: string) => {
    closers.closeColonization();
    focus.centerOnSystem(systemId);
  };

  return (
    <div className="game-layout">
      <TopBar />
      <GameScreenDocks
        showColonization={colonizationUnlocked}
        onOpenMissions={openers.openMissions}
        onOpenEvents={openers.openEvents}
        onOpenDiplomacy={openers.openDiplomacy}
        onOpenEconomy={openers.openEconomy}
        onOpenResearch={openers.openResearch}
        onOpenGalaxy={openers.openGalaxy}
        onOpenColonization={openers.openColonization}
        onOpenBattles={openers.openBattles}
        onOpenLog={openers.openLog}
        onDockCenter={focus.handleDockCenter}
        onDockSelect={focus.handleDockSelect}
      />
      <MapLayer
        focusSystemId={focus.focusSystemId}
        focusTrigger={focus.focusTrigger}
        mapMessage={focus.mapMessage}
        onSelectSystem={focus.handleSelectSystem}
        onClearFocus={focus.clearFocusTargets}
        onSelectShipyard={focus.handleSelectShipyard}
      />
      <BottomBar
        onToggleDebug={openers.openDebug}
        debugOpen={windows.debugModalOpen}
        onShowWars={handleShowWars}
        warUnread={warUnread}
      />
      <div className="floating-panels">
        <GameScreenWindows
          focusedSystem={focus.focusedSystem}
          focusedPlanet={focus.focusedPlanet}
          focusedOrbitingPlanet={focus.focusedOrbitingPlanet}
          focusedPlanetSystem={focus.focusedPlanetSystem}
          viewportWidth={viewportWidth}
          viewportHeight={viewportHeight}
          onClearFocusTargets={focus.clearFocusTargets}
          shipyardSystem={focus.shipyardSystem}
          closeShipyard={focus.closeShipyardPanel}
          panelSize={largePanel}
          windows={windows}
          closers={closers}
          sessionEconomy={session.economy}
          districtQueue={session.districtConstructionQueue}
          planetDetail={focus.planetDetail}
          systems={systems}
          economyConfig={economyConfig}
          onQueueDistrict={queueDistrictConstruction}
          onRemoveDistrict={removeDistrict}
          onPromotePopulation={promotePopulation}
          onDemotePopulation={demotePopulation}
          onClosePlanetDetail={() => focus.setPlanetDetailId(null)}
          onFocusFromGalaxy={handleFocusFromGalaxy}
          onFocusFromColonization={handleFocusFromColonization}
          warEventsRef={warEventsRef}
          unreadWarIds={unreadWarIds}
          markWarsRead={markWarsRead}
        />
        <GameScreenDockDetails
          dockSelection={focus.dockSelection}
          isConstructionSelection={focus.isConstructionSelection}
          selectedFleet={focus.selectedFleet}
          selectedScienceShip={focus.selectedScienceShip}
          fleets={session.fleets}
          systems={systems}
          scienceShips={scienceShips}
          shipDesigns={shipDesigns}
          completedTechs={completedTechs}
          constructionPanelSize={largePanel}
          onCenterSystem={(systemId) => focus.centerOnSystem(systemId)}
          onCloseDock={() => focus.setDockSelection(null)}
          onOrderFleetMove={orderFleetMove}
          onAnchorFleet={setFleetPosition}
          onBuildShipyard={buildShipyard}
          onStopFleet={stopFleet}
          onMergeFleets={mergeFleets}
          onSplitFleet={splitFleet}
          onOrderScienceShip={orderScienceShip}
          onAnchorScienceShip={setScienceShipPosition}
          onToggleScienceAuto={setScienceAutoExplore}
          onStopScienceShip={stopScienceShip}
        />
      </div>
    </div>
  );
};
