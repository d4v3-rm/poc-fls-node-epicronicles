import { canAffordCost } from '@domain/economy/economy';
import type { EconomyConfig } from '@domain/economy/economy';
import type {
  GameSession,
  OrbitingPlanet,
  Planet,
  PopulationJobId,
  StarSystem,
} from '@domain/types';
import type { ReactNode, RefObject } from 'react';
import { DraggablePanel } from '@windows/common/DraggablePanel';
import { DebugConsoleWindow } from '@windows/DebugConsoleWindow';
import { MissionsWindow } from '@windows/MissionsWindow';
import { DiplomacyWindow } from '@windows/DiplomacyWindow';
import { EconomyWindow } from '@windows/EconomyWindow';
import { EventWindow } from '@windows/EventWindow';
import { TechWindow } from '@windows/TechWindow';
import { GalaxyOverviewWindow } from '@windows/GalaxyOverviewWindow';
import { ColonizationWindow } from '@windows/ColonizationWindow';
import { BattlesWindow } from '@windows/BattlesWindow';
import { LogWindow } from '@windows/LogWindow';
import { PlanetDetailWindow } from '@windows/PlanetDetailWindow';
import { MapPanels } from '../MapPanels';

interface PanelSize {
  width: number;
  height: number;
  initialX: number;
  initialY: number;
}

interface GameScreenWindowsProps {
  focusedSystem: StarSystem | null;
  focusedPlanet: Planet | null;
  focusedOrbitingPlanet: OrbitingPlanet | null;
  focusedPlanetSystem: StarSystem | null;
  viewportWidth: number;
  viewportHeight: number;
  onClearFocusTargets: () => void;
  shipyardSystem: StarSystem | null;
  closeShipyard: () => void;
  panelSize: PanelSize;
  windows: {
    missionsOpen: boolean;
    eventsOpen: boolean;
    diplomacyOpen: boolean;
    economyOpen: boolean;
    researchOpen: boolean;
    galaxyOpen: boolean;
    colonizationOpen: boolean;
    battlesOpen: boolean;
    logOpen: boolean;
    debugModalOpen: boolean;
  };
  closers: {
    closeMissions: () => void;
    closeEvents: () => void;
    closeDiplomacy: () => void;
    closeEconomy: () => void;
    closeResearch: () => void;
    closeGalaxy: () => void;
    closeColonization: () => void;
    closeBattles: () => void;
    closeLog: () => void;
    closeDebug: () => void;
  };
  sessionEconomy: GameSession['economy'];
  districtQueue: GameSession['districtConstructionQueue'];
  planetDetail: Planet | null;
  systems: StarSystem[];
  economyConfig: EconomyConfig;
  onQueueDistrict: (planetId: string, districtId: string) => void;
  onRemoveDistrict: (planetId: string, districtId: string) => void;
  onPromotePopulation: (planetId: string, jobId: PopulationJobId) => void;
  onDemotePopulation: (planetId: string, jobId: PopulationJobId) => void;
  onClosePlanetDetail: () => void;
  onFocusFromGalaxy: (systemId: string) => void;
  onFocusFromColonization: (systemId: string) => void;
  warEventsRef: RefObject<HTMLUListElement>;
  unreadWarIds: string[];
  markWarsRead: () => void;
}

interface WindowPanelProps {
  isOpen: boolean;
  title: string;
  panelSize: PanelSize;
  onClose: () => void;
  children: ReactNode;
}

const WindowPanel = ({
  isOpen,
  title,
  panelSize,
  onClose,
  children,
}: WindowPanelProps) => {
  if (!isOpen) {
    return null;
  }
  return (
    <DraggablePanel
      title={title}
      initialX={panelSize.initialX}
      initialY={panelSize.initialY}
      initialWidth={panelSize.width}
      initialHeight={panelSize.height}
      onClose={onClose}
    >
      {children}
    </DraggablePanel>
  );
};

export const GameScreenWindows = ({
  focusedSystem,
  focusedPlanet,
  focusedOrbitingPlanet,
  focusedPlanetSystem,
  viewportWidth,
  viewportHeight,
  onClearFocusTargets,
  shipyardSystem,
  closeShipyard,
  panelSize,
  windows,
  closers,
  sessionEconomy,
  districtQueue,
  planetDetail,
  systems,
  economyConfig,
  onQueueDistrict,
  onRemoveDistrict,
  onPromotePopulation,
  onDemotePopulation,
  onClosePlanetDetail,
  onFocusFromGalaxy,
  onFocusFromColonization,
  warEventsRef,
  unreadWarIds,
  markWarsRead,
}: GameScreenWindowsProps) => {
  const planetSystemName = planetDetail
    ? systems.find((system) => system.id === planetDetail.systemId)?.name ??
      planetDetail.systemId
    : '';

  return (
    <>
      <MapPanels
        focusedSystem={focusedSystem}
        focusedPlanet={focusedPlanet}
        focusedOrbitingPlanet={focusedOrbitingPlanet}
        focusedPlanetSystem={focusedPlanetSystem}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        onClearFocusTargets={onClearFocusTargets}
        shipyardSystem={shipyardSystem}
        closeShipyard={closeShipyard}
      />
      <WindowPanel
        isOpen={windows.missionsOpen}
        title="Missioni in corso"
        panelSize={panelSize}
        onClose={closers.closeMissions}
      >
        <MissionsWindow />
      </WindowPanel>
      <WindowPanel
        isOpen={windows.eventsOpen}
        title="Eventi & Anomalie"
        panelSize={panelSize}
        onClose={closers.closeEvents}
      >
        <EventWindow />
      </WindowPanel>
      <WindowPanel
        isOpen={windows.diplomacyOpen}
        title="Diplomazia"
        panelSize={panelSize}
        onClose={closers.closeDiplomacy}
      >
        <DiplomacyWindow />
      </WindowPanel>
      <WindowPanel
        isOpen={windows.economyOpen}
        title="Bilancio economico"
        panelSize={panelSize}
        onClose={closers.closeEconomy}
      >
        <EconomyWindow />
      </WindowPanel>
      <WindowPanel
        isOpen={windows.researchOpen}
        title="Ricerca & Tradizioni"
        panelSize={panelSize}
        onClose={closers.closeResearch}
      >
        <TechWindow />
      </WindowPanel>
      <WindowPanel
        isOpen={windows.galaxyOpen}
        title="Panoramica galassia"
        panelSize={panelSize}
        onClose={closers.closeGalaxy}
      >
        <GalaxyOverviewWindow onFocusSystem={onFocusFromGalaxy} />
      </WindowPanel>
      <WindowPanel
        isOpen={windows.colonizationOpen}
        title="Colonizzazione"
        panelSize={panelSize}
        onClose={closers.closeColonization}
      >
        <ColonizationWindow onFocusSystem={onFocusFromColonization} />
      </WindowPanel>
      <WindowPanel
        isOpen={windows.battlesOpen}
        title="Flotte & Battaglie"
        panelSize={panelSize}
        onClose={closers.closeBattles}
      >
        <BattlesWindow
          warEventsRef={warEventsRef}
          unreadWarIds={unreadWarIds}
          onMarkWarRead={markWarsRead}
        />
      </WindowPanel>
      <WindowPanel
        isOpen={windows.logOpen}
        title="Log eventi"
        panelSize={panelSize}
        onClose={closers.closeLog}
      >
        <LogWindow />
      </WindowPanel>
      {planetDetail ? (
        <WindowPanel
          isOpen={true}
          title={`Gestione - ${planetDetail.name}`}
          panelSize={panelSize}
          onClose={onClosePlanetDetail}
        >
          <PlanetDetailWindow
            planet={planetDetail}
            systemName={planetSystemName}
            onPromote={(jobId) => onPromotePopulation(planetDetail.id, jobId)}
            onDemote={(jobId) => onDemotePopulation(planetDetail.id, jobId)}
            automationConfig={economyConfig.populationAutomation}
            populationJobs={economyConfig.populationJobs}
            districtDefinitions={economyConfig.districts}
            canAffordDistricts={Object.fromEntries(
              economyConfig.districts.map((definition) => [
                definition.id,
                canAffordCost(sessionEconomy, definition.cost),
              ]),
            )}
            planetDistrictQueue={districtQueue
              .filter((task) => task.planetId === planetDetail.id)
              .map((task) => {
                const definition = economyConfig.districts.find(
                  (entry) => entry.id === task.districtId,
                );
                return {
                  ...task,
                  label: definition?.label ?? task.districtId,
                  progress:
                    1 - task.ticksRemaining / Math.max(1, task.totalTicks),
                };
              })}
            populationMessage={null}
            onQueueDistrict={(districtId) =>
              onQueueDistrict(planetDetail.id, districtId)
            }
            onRemoveDistrict={(districtId) =>
              onRemoveDistrict(planetDetail.id, districtId)
            }
          />
        </WindowPanel>
      ) : null}
      <WindowPanel
        isOpen={windows.debugModalOpen}
        title="Console debug"
        panelSize={panelSize}
        onClose={closers.closeDebug}
      >
        <DebugConsoleWindow />
      </WindowPanel>
    </>
  );
};
