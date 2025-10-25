import { useGameStore } from '../../store/gameStore';
import { RESOURCE_TYPES } from '../../domain/economy';
import { resourceLabels } from '../../domain/resourceMetadata';

export const PlanetList = () => {
  const planets = useGameStore((state) => state.session?.economy.planets ?? []);
  const systems = useGameStore((state) => state.session?.galaxy.systems ?? []);

  if (planets.length === 0) {
    return null;
  }

  return (
    <section className="planet-list">
      <h3>Pianeti colonizzati</h3>
      <ul>
        {planets.map((planet) => {
          const systemName =
            systems.find((system) => system.id === planet.systemId)?.name ??
            '???';
          return (
            <li key={planet.id}>
              <header>
                <div>
                  <strong>{planet.name}</strong>
                  <span className="planet-list__system">{systemName}</span>
                </div>
                <span className="planet-list__meta">
                  Popolazione: {planet.population}
                </span>
              </header>
              <div className="planet-list__yields">
                {RESOURCE_TYPES.map((type) => {
                  const production = planet.baseProduction[type] ?? 0;
                  const upkeep = planet.upkeep[type] ?? 0;
                  if (production === 0 && upkeep === 0) {
                    return null;
                  }
                  const net = production - upkeep;
                  return (
                    <div key={type} className="planet-list__yield">
                      <span>{resourceLabels[type]}</span>
                      <span className={net >= 0 ? 'is-positive' : 'is-negative'}>
                        {net >= 0 ? '+' : '-'}
                        {Math.abs(net)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
