import { ResourceBar } from './ResourceBar';
import { useGameStore } from '../../store/gameStore';

const speedOptions = [0.5, 1, 2, 4];

export const HudTopBar = () => {
  const session = useGameStore((state) => state.session);
  const setSimulationRunning = useGameStore(
    (state) => state.setSimulationRunning,
  );
  const setSpeedMultiplier = useGameStore((state) => state.setSpeedMultiplier);

  if (!session) {
    return null;
  }

  const { clock, label, galaxy } = session;

  return (
    <div className="hud-top-bar">
      <div className="hud-top-bar__resources">
        <ResourceBar />
      </div>
      <div className="hud-top-bar__session">
        <div>
          <h2>{label}</h2>
          <p>Seed: {galaxy.seed}</p>
        </div>
        <div className="hud-top-bar__controls">
          <button
            className="panel__action"
            onClick={() => setSimulationRunning(!clock.isRunning, Date.now())}
          >
            {clock.isRunning ? 'Pausa' : 'Riprendi'}
          </button>
          <span>Velocità:</span>
          <div className="speed-options">
            {speedOptions.map((option) => (
              <button
                key={option}
                className={`panel__action ${
                  option === clock.speedMultiplier ? 'is-active' : ''
                }`}
                onClick={() => setSpeedMultiplier(option)}
              >
                {option}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
