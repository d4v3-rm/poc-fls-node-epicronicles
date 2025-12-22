import { TopBar } from '@hud/TopBar';

interface GameScreenEmptyStateProps {
  onReturnToMenu: () => void;
}

export const GameScreenEmptyState = ({
  onReturnToMenu,
}: GameScreenEmptyStateProps) => (
  <div className="game-layout">
    <TopBar />
    <div className="floating-panels">
      <p className="text-muted">Nessuna sessione attiva.</p>
      <button className="panel__action" onClick={onReturnToMenu}>
        Torna al menu
      </button>
    </div>
  </div>
);
