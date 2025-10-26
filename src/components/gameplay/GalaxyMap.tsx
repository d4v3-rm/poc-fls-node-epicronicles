import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { StarClass, SystemVisibility } from '../../domain/types';

const systemClassColor: Record<StarClass, string> = {
  mainSequence: '#70c1ff',
  giant: '#ffa94d',
  dwarf: '#d8b4ff',
};

const visibilityOpacity: Record<SystemVisibility, number> = {
  unknown: 0.2,
  revealed: 0.6,
  surveyed: 1,
};

const visibilityRadius: Record<SystemVisibility, number> = {
  unknown: 4,
  revealed: 5,
  surveyed: 6,
};

export const GalaxyMap = () => {
  const systems = useGameStore((state) => state.session?.galaxy.systems ?? []);
  const scienceShips = useGameStore(
    (state) => state.session?.scienceShips ?? [],
  );

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
        ((system.position.x - minX) / spanX) * 100,
      screenY:
        ((system.position.y - minY) / spanY) * 100,
    }));
  }, [systems]);

  const systemById = useMemo(() => {
    const map = new Map<string, (typeof mappedSystems)[number]>();
    mappedSystems.forEach((system) => map.set(system.id, system));
    return map;
  }, [mappedSystems]);

  return (
    <div className="galaxy-map">
      {mappedSystems.map((system) => (
        <div
          key={system.id}
          className={`galaxy-map__system`}
          style={{
            left: `${system.screenX}%`,
            top: `${system.screenY}%`,
          }}
        >
          {system.hostilePower && system.hostilePower > 0 ? (
            <span className="galaxy-map__hostile" />
          ) : null}
          <span
            className="galaxy-map__dot"
            style={{
              background: systemClassColor[system.starClass],
              opacity: visibilityOpacity[system.visibility],
              width: visibilityRadius[system.visibility] * 2,
              height: visibilityRadius[system.visibility] * 2,
            }}
          />
          <span className="galaxy-map__label">{system.name}</span>
        </div>
      ))}
      {scienceShips.map((ship) => {
        const currentSystem = systemById.get(ship.currentSystemId);
        if (!currentSystem) {
          return null;
        }
        return (
          <div
            key={ship.id}
            className="galaxy-map__ship"
            style={{
              left: `${currentSystem.screenX}%`,
              top: `${currentSystem.screenY}%`,
            }}
            title={ship.name}
          />
        );
      })}
    </div>
  );
};
