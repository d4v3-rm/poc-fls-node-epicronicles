import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { StarClass } from '../../domain/types';

const VIEWPORT_SIZE = 320;

const systemClassColor: Record<StarClass, string> = {
  mainSequence: '#70c1ff',
  giant: '#ffa94d',
  dwarf: '#d8b4ff',
};

export const GalaxyOverview = () => {
  const systems = useGameStore((state) => state.session?.galaxy.systems ?? []);

  const mappedSystems = useMemo(() => {
    if (systems.length === 0) {
      return [];
    }

    const xs = systems.map((system) => system.position.x);
    const ys = systems.map((system) => system.position.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;

    return systems.map((system) => ({
      ...system,
      screenX:
        ((system.position.x - minX) / spanX) * (VIEWPORT_SIZE - 20) + 10,
      screenY:
        ((system.position.y - minY) / spanY) * (VIEWPORT_SIZE - 20) + 10,
    }));
  }, [systems]);

  return (
    <section className="galaxy-overview">
      <div className="galaxy-overview__map" aria-label="Mappa galattica">
        <svg viewBox={`0 0 ${VIEWPORT_SIZE} ${VIEWPORT_SIZE}`} role="presentation">
          <rect
            width={VIEWPORT_SIZE}
            height={VIEWPORT_SIZE}
            fill="rgba(255,255,255,0.02)"
            stroke="rgba(255,255,255,0.1)"
          />
          {mappedSystems.map((system) => (
            <g key={system.id}>
              <circle
                cx={system.screenX}
                cy={system.screenY}
                r={system.discovered ? 6 : 4}
                fill={systemClassColor[system.starClass]}
                opacity={system.discovered ? 1 : 0.4}
              />
              <text
                x={system.screenX + 8}
                y={system.screenY + 4}
                className="galaxy-overview__label"
              >
                {system.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="galaxy-overview__list">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Scoperta</th>
            </tr>
          </thead>
          <tbody>
            {systems.map((system) => (
              <tr key={system.id}>
                <td>{system.name}</td>
                <td>{system.starClass}</td>
                <td>{system.discovered ? 'Sì' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
