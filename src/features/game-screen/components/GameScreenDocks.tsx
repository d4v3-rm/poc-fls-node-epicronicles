import { MainDock } from '@docks/MainDock';
import { EntityDock } from '@docks/EntityDock';
import type { DockSelection } from '../types';

interface GameScreenDocksProps {
  showColonization: boolean;
  onOpenMissions: () => void;
  onOpenEvents: () => void;
  onOpenDiplomacy: () => void;
  onOpenEconomy: () => void;
  onOpenResearch: () => void;
  onOpenGalaxy: () => void;
  onOpenColonization: () => void;
  onOpenBattles: () => void;
  onOpenLog: () => void;
  onDockCenter: (systemId: string, planetId?: string | null) => void;
  onDockSelect: (selection: DockSelection) => void;
}

export const GameScreenDocks = ({
  showColonization,
  onOpenMissions,
  onOpenEvents,
  onOpenDiplomacy,
  onOpenEconomy,
  onOpenResearch,
  onOpenGalaxy,
  onOpenColonization,
  onOpenBattles,
  onOpenLog,
  onDockCenter,
  onDockSelect,
}: GameScreenDocksProps) => (
  <>
    <MainDock
      onOpenMissions={onOpenMissions}
      onOpenEvents={onOpenEvents}
      onOpenDiplomacy={onOpenDiplomacy}
      onOpenEconomy={onOpenEconomy}
      onOpenResearch={onOpenResearch}
      onOpenGalaxy={onOpenGalaxy}
      onOpenColonization={onOpenColonization}
      onOpenBattles={onOpenBattles}
      onOpenLog={onOpenLog}
      showColonization={showColonization}
    />
    <div className="side-entity-stack">
      <EntityDock
        variant="colonies"
        onCenter={(systemId, planetId) => onDockCenter(systemId, planetId)}
        onSelect={onDockSelect}
      />
      <EntityDock
        variant="fleets"
        onCenter={(systemId) => onDockCenter(systemId)}
        onSelect={onDockSelect}
      />
      <EntityDock
        variant="colonization"
        onCenter={(systemId) => onDockCenter(systemId)}
        onSelect={onDockSelect}
      />
      <EntityDock
        variant="construction"
        onCenter={(systemId) => onDockCenter(systemId)}
        onSelect={onDockSelect}
      />
      <EntityDock
        variant="science"
        onCenter={(systemId) => onDockCenter(systemId)}
        onSelect={onDockSelect}
      />
    </div>
  </>
);
