interface SideDockProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenMissions: () => void;
}

export const SideDock = ({
  isOpen,
  onToggle,
  onOpenMissions,
}: SideDockProps) => (
  <aside className={`side-dock ${isOpen ? 'is-open' : ''}`}>
    <button
      type="button"
      className="side-dock__toggle"
      onClick={onToggle}
      aria-label={isOpen ? 'Comprimi barra laterale' : 'Espandi barra laterale'}
    >
      {isOpen ? '⟨' : '⟩'}
    </button>
    <div className="side-dock__content">
      <div className="side-dock__section">
        <p className="side-dock__section-label">Operazioni</p>
        <button
          type="button"
          className="side-dock__item"
          onClick={onOpenMissions}
        >
          Missioni in corso
        </button>
      </div>
      <div className="side-dock__section side-dock__section--muted">
        <p className="side-dock__hint">
          Altre sezioni (flotte, economia, log) verranno aggiunte qui.
        </p>
      </div>
    </div>
  </aside>
);
