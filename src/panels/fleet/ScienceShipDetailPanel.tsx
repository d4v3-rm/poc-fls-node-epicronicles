import type { ScienceShip, StarSystem } from '@domain/types';

import '../../styles/components/FleetShared.scss';

interface ScienceShipDetailPanelProps {
  ship: ScienceShip;
  systems: StarSystem[];
  onOrder: (systemId: string) => void;
  onToggleAuto: (auto: boolean) => void;
  onStop: () => void;
  onClose: () => void;
}

const statusLabel: Record<ScienceShip['status'], string> = {
  idle: 'In stazione',
  traveling: 'In viaggio',
  surveying: 'Sondando',
};

export const ScienceShipDetailPanel = ({
  ship,
  systems,
  onOrder,
  onToggleAuto,
  onStop,
  onClose,
}: ScienceShipDetailPanelProps) => {
  const resolveName = (systemId: string | null | undefined) =>
    systemId
      ? systems.find((system) => system.id === systemId)?.name ?? systemId
      : 'N/D';

  return (
    <div className="science-detail">
      <header className="science-detail__header">
        <div>
          <p className="fleet-detail__eyebrow">Dettagli nave scientifica</p>
          <h3 className="fleet-detail__title">{ship.name ?? ship.id}</h3>
          <div className="fleet-detail__meta">
            <span>Stato: {statusLabel[ship.status]}</span>
          </div>
        </div>
        <button className="dock-detail__close" onClick={onClose}>
          ×
        </button>
      </header>

      <section className="science-detail__section">
        <div className="science-detail__row">
          <div>
            <span className="text-muted">Sistema attuale</span>
            <p className="science-detail__value">
              {resolveName(ship.currentSystemId)}
            </p>
          </div>
          <div>
            <span className="text-muted">Destinazione</span>
            <p className="science-detail__value">
              {ship.targetSystemId ? resolveName(ship.targetSystemId) : 'Nessuna'}
            </p>
          </div>
        </div>
        <div className="science-detail__controls">
          <label className="science-detail__field">
            <span>Ordina su sistema</span>
            <select
              value={ship.targetSystemId ?? ''}
              onChange={(e) => onOrder(e.target.value)}
            >
              <option value="">Seleziona sistema</option>
              {systems
                .filter((system) => system.visibility !== 'unknown')
                .map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.name}
                  </option>
                ))}
            </select>
          </label>
          <div className="science-detail__actions">
            <label className="science-detail__toggle">
              <input
                type="checkbox"
                checked={ship.autoExplore}
                onChange={(e) => onToggleAuto(e.target.checked)}
              />
              <span>Auto esplorazione</span>
            </label>
            <button className="hud-icon-btn" onClick={onStop} data-tooltip="Ferma nave">
              Stop
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
