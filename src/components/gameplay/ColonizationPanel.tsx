import { useMemo, useState } from 'react';
import { useGameStore, type ColonizationError } from '../../store/gameStore';
import { resourceLabels } from '../../domain/resourceMetadata';

export const ColonizationPanel = () => {
  const tasks = useGameStore((state) => state.session?.colonizationTasks ?? []);
  const systems = useGameStore((state) => state.session?.galaxy.systems ?? []);
  const planets = useGameStore((state) => state.session?.economy.planets ?? []);
  const resources = useGameStore(
    (state) => state.session?.economy.resources ?? null,
  );
  const startColonization = useGameStore((state) => state.startColonization);
  const colonizationConfig = useGameStore(
    (state) => state.config.colonization,
  );
  const [message, setMessage] = useState<string | null>(null);

  const systemMap = useMemo(() => {
    const map = new Map<string, string>();
    systems.forEach((system) => map.set(system.id, system.name));
    return map;
  }, [systems]);

  const colonizedSystems = useMemo(
    () => new Set(planets.map((planet) => planet.systemId)),
    [planets],
  );
  const pendingSystems = useMemo(
    () => new Set(tasks.map((task) => task.systemId)),
    [tasks],
  );

  const colonizationErrors: Record<ColonizationError, string> = {
    NO_SESSION: 'Nessuna sessione.',
    SYSTEM_NOT_FOUND: 'Sistema non trovato.',
    SYSTEM_NOT_SURVEYED: 'Sonda prima il sistema.',
    NO_HABITABLE_WORLD: 'Nessun mondo abitabile.',
    ALREADY_COLONIZED: 'Sistema gia colonizzato.',
    TASK_IN_PROGRESS: 'Colonizzazione gia attiva.',
    INSUFFICIENT_RESOURCES: 'Risorse insufficienti.',
  };

  const canAfford = () => {
    if (!resources) {
      return false;
    }
    return Object.entries(colonizationConfig.cost).every(([type, amount]) => {
      if (!amount) {
        return true;
      }
      const ledger = resources[type as keyof typeof resources];
      return (ledger?.amount ?? 0) >= amount;
    });
  };

  const handleColonize = (systemId: string) => {
    const result = startColonization(systemId);
    if (result.success) {
      setMessage('Colonizzazione avviata.');
    } else {
      setMessage(colonizationErrors[result.reason]);
    }
  };

  return (
    <section className="colonization-panel">
      <h3>Colonizzazione</h3>
      {message ? <p className="panel-message">{message}</p> : null}
      <p className="text-muted">
        Costi:{' '}
        {Object.entries(colonizationConfig.cost)
          .filter(([, amount]) => amount && amount > 0)
          .map(
            ([type, amount]) =>
              `${resourceLabels[type as keyof typeof resourceLabels]} ${amount}`,
          )
          .join(' | ')}
      </p>
      <div className="colonization-panel__table">
        <table>
          <thead>
            <tr>
              <th>Sistema</th>
              <th>Mondo</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {systems.map((system) => {
              const habitable = system.habitableWorld;
              const colonized = colonizedSystems.has(system.id);
              const pending = pendingSystems.has(system.id);
              const afford = canAfford();
              const disabledReason = !habitable
                ? 'Nessun mondo'
                : system.visibility !== 'surveyed'
                  ? 'Serve sondaggio'
                  : colonized
                    ? 'Colonia attiva'
                    : pending
                      ? 'In corso'
                      : !afford
                        ? 'Risorse insufficienti'
                        : null;
              return (
                <tr key={system.id}>
                  <td>{system.name}</td>
                  <td>{habitable ? habitable.kind : '—'}</td>
                  <td>
                    {colonized ? 'Colonia attiva' : pending ? 'In corso' : '-'}
                  </td>
                  <td>
                    <button
                      className="panel__action panel__action--compact"
                      disabled={Boolean(disabledReason)}
                      title={disabledReason ?? 'Avvia colonizzazione'}
                      onClick={() => handleColonize(system.id)}
                    >
                      Colonizza
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {tasks.length > 0 ? (
        <>
          <h4>Colonizzazioni in corso</h4>
          <ul>
            {tasks.map((task) => {
              const progress =
                1 - task.ticksRemaining / Math.max(1, task.totalTicks);
              return (
                <li key={task.id}>
                  <div className="colonization-row">
                    <div>
                      <strong>
                        {task.planetTemplate.name} ({systemMap.get(task.systemId)})
                      </strong>
                      <span className="text-muted">
                        {task.ticksRemaining} tick rimanenti
                      </span>
                    </div>
                    <span className="colonization-status">{task.status}</span>
                  </div>
                  <div className="colonization-progress">
                    <div
                      className="colonization-progress__bar"
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </section>
  );
};
