import type { Fleet, ScienceShip, ShipDesign, StarSystem } from '@domain/types';
import { DraggablePanel } from '@windows/common/DraggablePanel';
import { ConstructionDetailWindow } from '@windows/ConstructionDetailWindow';
import { FleetDetailWindow } from '@windows/FleetDetailWindow';
import { ScienceShipDetailWindow } from '@windows/ScienceShipDetailWindow';
import type { DockSelection } from '../types';

interface PanelSize {
  width: number;
  height: number;
  initialX: number;
  initialY: number;
}

interface GameScreenDockDetailsProps {
  dockSelection: DockSelection | null;
  isConstructionSelection: boolean;
  selectedFleet: Fleet | null;
  selectedScienceShip: ScienceShip | null;
  fleets: Fleet[];
  systems: StarSystem[];
  scienceShips: ScienceShip[];
  shipDesigns: ShipDesign[];
  completedTechs: string[];
  constructionPanelSize: PanelSize;
  onCenterSystem: (systemId: string) => void;
  onCloseDock: () => void;
  onOrderFleetMove: (fleetId: string, systemId: string) => void;
  onAnchorFleet: (fleetId: string, planetId: string | null) => void;
  onBuildShipyard: (systemId: string, anchorPlanetId: string | null) => void;
  onStopFleet: (fleetId: string) => void;
  onMergeFleets: (sourceId: string, targetId: string) => void;
  onSplitFleet: (fleetId: string) => void;
  onOrderScienceShip: (shipId: string, systemId: string) => void;
  onAnchorScienceShip: (shipId: string, planetId: string | null) => void;
  onToggleScienceAuto: (shipId: string, auto: boolean) => void;
  onStopScienceShip: (shipId: string) => void;
}

export const GameScreenDockDetails = ({
  dockSelection,
  isConstructionSelection,
  selectedFleet,
  selectedScienceShip,
  fleets,
  systems,
  scienceShips,
  shipDesigns,
  completedTechs,
  constructionPanelSize,
  onCenterSystem,
  onCloseDock,
  onOrderFleetMove,
  onAnchorFleet,
  onBuildShipyard,
  onStopFleet,
  onMergeFleets,
  onSplitFleet,
  onOrderScienceShip,
  onAnchorScienceShip,
  onToggleScienceAuto,
  onStopScienceShip,
}: GameScreenDockDetailsProps) => {
  if (!dockSelection) {
    return null;
  }

  if (dockSelection.kind === 'fleet') {
    if (isConstructionSelection) {
      return (
        <DraggablePanel
          title="Nave costruttrice"
          initialX={constructionPanelSize.initialX}
          initialY={constructionPanelSize.initialY}
          initialWidth={constructionPanelSize.width}
          initialHeight={constructionPanelSize.height}
          onClose={onCloseDock}
        >
          {selectedFleet ? (
            <ConstructionDetailWindow
              fleet={selectedFleet}
              systems={systems}
              designs={shipDesigns}
              completedTechs={completedTechs}
              onOrder={(fleetId, systemId) => onOrderFleetMove(fleetId, systemId)}
              onAnchorChange={(fleetId, planetId) => onAnchorFleet(fleetId, planetId)}
              onBuildShipyard={(systemId, anchorPlanetId) =>
                onBuildShipyard(systemId, anchorPlanetId)
              }
              onCenter={(systemId) => onCenterSystem(systemId)}
              onStop={(fleetId) => onStopFleet(fleetId)}
            />
          ) : (
            <div className="dock-detail__content">
              <p className="text-muted">Flotta non trovata.</p>
            </div>
          )}
        </DraggablePanel>
      );
    }

    return (
      <div className="dock-detail-modal">
        {selectedFleet ? (
          <FleetDetailWindow
            fleet={selectedFleet}
            fleets={fleets}
            systems={systems}
            scienceShips={scienceShips}
            designs={shipDesigns}
            completedTechs={completedTechs}
            onOrder={(fleetId, systemId) => onOrderFleetMove(fleetId, systemId)}
            onAnchorChange={(fleetId, planetId) => onAnchorFleet(fleetId, planetId)}
            onCenter={(systemId) => onCenterSystem(systemId)}
            onStop={(fleetId) => onStopFleet(fleetId)}
            onMerge={(sourceId, targetId) => onMergeFleets(sourceId, targetId)}
            onSplit={(fleetId) => onSplitFleet(fleetId)}
            showConstructionActions={dockSelection.source === 'construction'}
            onBuildShipyard={(systemId, anchorPlanetId) =>
              onBuildShipyard(systemId, anchorPlanetId)
            }
            onClose={onCloseDock}
          />
        ) : (
          <div className="dock-detail__content">
            <p className="text-muted">Flotta non trovata.</p>
          </div>
        )}
      </div>
    );
  }

  if (dockSelection.kind === 'science') {
    return (
      <div className="dock-detail-modal">
        {selectedScienceShip ? (
          <ScienceShipDetailWindow
            ship={selectedScienceShip}
            systems={systems}
            onOrder={(systemId) =>
              onOrderScienceShip(selectedScienceShip.id, systemId)
            }
            onAnchorChange={(planetId) =>
              onAnchorScienceShip(selectedScienceShip.id, planetId)
            }
            onToggleAuto={(auto) => onToggleScienceAuto(selectedScienceShip.id, auto)}
            onStop={() => onStopScienceShip(selectedScienceShip.id)}
            onCenter={(systemId) => onCenterSystem(systemId)}
            onClose={onCloseDock}
          />
        ) : (
          <div className="dock-detail__content">
            <p className="text-muted">Nave non trovata.</p>
          </div>
        )}
      </div>
    );
  }

  return null;
};
