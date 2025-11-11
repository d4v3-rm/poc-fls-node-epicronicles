interface SideDockProps {
  onOpenMissions: () => void;
  onOpenEvents: () => void;
  onOpenDiplomacy: () => void;
  onOpenEconomy: () => void;
  onOpenResearch: () => void;
}

export const SideDock = ({
  onOpenMissions,
  onOpenEvents,
  onOpenDiplomacy,
  onOpenEconomy,
  onOpenResearch,
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
        M
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenEvents}
        aria-label="Eventi e anomalie"
        data-tooltip="Eventi e anomalie"
      >
        E
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenDiplomacy}
        aria-label="Diplomazia"
        data-tooltip="Diplomazia"
      >
        D
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenEconomy}
        aria-label="Bilancio economico"
        data-tooltip="Bilancio economico"
      >
        $
      </button>
      <button
        type="button"
        className="side-dock__btn"
        onClick={onOpenResearch}
        aria-label="Ricerca & Tradizioni"
        data-tooltip="Ricerca & Tradizioni"
      >
        R
      </button>
    </div>
  </aside>
);
