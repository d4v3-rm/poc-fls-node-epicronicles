import { useMemo } from 'react';
import { useGameStore } from '@store/gameStore';

export const DebugConsole = () => {
  const session = useGameStore((state) => state.session);

  const data = useMemo(() => {
    if (!session) return null;
    const revealed = session.galaxy.systems.filter(
      (system) => system.visibility !== 'unknown',
    ).length;
    const surveyed = session.galaxy.systems.filter(
      (system) => system.visibility === 'surveyed',
    ).length;

    return {
      sessionId: session.id,
      tick: session.clock.tick,
      speed: session.clock.speedMultiplier,
      running: session.clock.isRunning,
      elapsedMs: session.clock.elapsedMs,
      systems: {
        total: session.galaxy.systems.length,
        revealed,
        surveyed,
      },
      ships: session.scienceShips.map((ship) => ({
        id: ship.id,
        status: ship.status,
        currentSystemId: ship.currentSystemId,
        targetSystemId: ship.targetSystemId,
        ticksRemaining: ship.ticksRemaining,
      })),
      colonizationTasks: session.colonizationTasks.map((task) => ({
        id: task.id,
        systemId: task.systemId,
        status: task.status,
        ticksRemaining: task.ticksRemaining,
        totalTicks: task.totalTicks,
        missionElapsedTicks: task.missionElapsedTicks,
        missionTotalTicks: task.missionTotalTicks,
      })),
      shipyardQueue: session.shipyardQueue.map((task) => ({
        id: task.id,
        designId: task.designId,
        ticksRemaining: task.ticksRemaining,
      })),
      fleets: session.fleets.map((fleet) => ({
        id: fleet.id,
        systemId: fleet.systemId,
        targetSystemId: fleet.targetSystemId,
        ticksToArrival: fleet.ticksToArrival,
        ships: fleet.ships.length,
      })),
    };
  }, [session]);

  if (!data) {
    return <p className="text-muted">Nessuna sessione attiva.</p>;
  }

  const content = (
    <div className="debug-grid">
      <div>
        <h4>Sessione</h4>
        <ul>
          <li>ID: {data.sessionId}</li>
          <li>Tick: {data.tick}</li>
          <li>Speed: {data.speed}</li>
          <li>Running: {data.running ? 'Yes' : 'No'}</li>
          <li>Elapsed: {data.elapsedMs}ms</li>
        </ul>
      </div>
      <div>
        <h4>Sistemi</h4>
        <ul>
          <li>Totale: {data.systems.total}</li>
          <li>Rivelati: {data.systems.revealed}</li>
          <li>Sondati: {data.systems.surveyed}</li>
        </ul>
      </div>
      <div className="debug-list">
        <h4>Navi scientifiche</h4>
        <ul>
          {data.ships.map((ship) => (
            <li key={ship.id}>
              {ship.id} — {ship.status} — curr: {ship.currentSystemId ?? '-'} — tgt:{' '}
              {ship.targetSystemId ?? '-'} ({ship.ticksRemaining}t)
            </li>
          ))}
        </ul>
      </div>
      <div className="debug-list">
        <h4>Colonizzazione</h4>
        <ul>
          {data.colonizationTasks.map((task) => (
            <li key={task.id}>
              {task.systemId} — {task.status} — {task.ticksRemaining} / {task.totalTicks} —{' '}
              {task.missionElapsedTicks}/{task.missionTotalTicks}
            </li>
          ))}
        </ul>
      </div>
      <div className="debug-list">
        <h4>Cantieri</h4>
        <ul>
          {data.shipyardQueue.map((task) => (
            <li key={task.id}>
              {task.designId} — {task.ticksRemaining}t
            </li>
          ))}
        </ul>
      </div>
      <div className="debug-list">
        <h4>Flotte</h4>
        <ul>
          {data.fleets.map((fleet) => (
            <li key={fleet.id}>
              {fleet.id} — sys: {fleet.systemId} — tgt: {fleet.targetSystemId ?? '-'} — eta:{' '}
              {fleet.ticksToArrival} — ships: {fleet.ships}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return content;
};
