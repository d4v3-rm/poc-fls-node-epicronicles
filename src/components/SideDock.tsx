import { SatelliteDish, Sparkles, Handshake, LineChart, FlaskConical, Orbit, Flag } from 'lucide-react';

interface SideDockProps {
  onOpenMissions: () => void;
  onOpenEvents: () => void;
  onOpenDiplomacy: () => void;
  onOpenEconomy: () => void;
  onOpenResearch: () => void;
  onOpenGalaxy: () => void;
  onOpenColonization: () => void;
}

export const SideDock = ({
  onOpenMissions,
  onOpenEvents,
  onOpenDiplomacy,
  onOpenEconomy,
  onOpenResearch,
  onOpenGalaxy,
  onOpenColonization,
}: SideDockProps) => (
  <aside className="side-dock">
    <div className="side-dock__items">
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenMissions}
        aria-label="Missioni in corso"
        data-tooltip="Missioni in corso"
      >
        <SatelliteDish size={18} />
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenEvents}
        aria-label="Eventi e anomalie"
        data-tooltip="Eventi e anomalie"
      >
        <Sparkles size={18} />
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenDiplomacy}
        aria-label="Diplomazia"
        data-tooltip="Diplomazia"
      >
        <Handshake size={18} />
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenEconomy}
        aria-label="Bilancio economico"
        data-tooltip="Bilancio economico"
      >
        <LineChart size={18} />
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenResearch}
        aria-label="Ricerca & Tradizioni"
        data-tooltip="Ricerca & Tradizioni"
      >
        <FlaskConical size={18} />
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenColonization}
        aria-label="Colonizzazione"
        data-tooltip="Colonizzazione"
      >
        <Flag size={18} />
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenGalaxy}
        aria-label="Panoramica galassia"
        data-tooltip="Panoramica galassia"
      >
        <Orbit size={18} />
      </button>
    </div>
  </aside>
);
