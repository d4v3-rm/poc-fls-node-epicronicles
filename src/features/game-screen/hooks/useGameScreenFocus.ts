import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Fleet,
  GameSession,
  OrbitingPlanet,
  Planet,
  ScienceShip,
  StarSystem,
} from '@domain/types';
import type { DockSelection } from '../types';

interface UseGameScreenFocusArgs {
  session: GameSession | null;
  systems: StarSystem[];
  planets: Planet[];
  colonizedSystems: Set<string>;
}

export const useGameScreenFocus = ({
  session,
  systems,
  planets,
  colonizedSystems,
}: UseGameScreenFocusArgs) => {
  const [focusSystemId, setFocusSystemId] = useState<string | null>(null);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [shipyardSystemId, setShipyardSystemId] = useState<string | null>(null);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
  const [planetDetailId, setPlanetDetailId] = useState<string | null>(null);
  const [mapMessage, setMapMessage] = useState<string | null>(null);
  const [dockSelection, setDockSelection] = useState<DockSelection | null>(null);
  const focusedSessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!session) {
      focusedSessionRef.current = null;
      return;
    }
    if (focusedSessionRef.current === session.id) {
      return;
    }
    const homeSystemId =
      session.economy.planets[0]?.systemId ??
      session.galaxy.systems[0]?.id ??
      null;
    if (homeSystemId) {
      setFocusSystemId(homeSystemId);
      setSelectedSystemId(null);
      setSelectedPlanetId(null);
      setMapMessage(null);
    }
    focusedSessionRef.current = session.id;
  }, [session]);

  const clearFocusTargets = useCallback(() => {
    setFocusSystemId(null);
    setShipyardSystemId(null);
    setSelectedSystemId(null);
    setSelectedPlanetId(null);
    setPlanetDetailId(null);
    setMapMessage(null);
  }, []);

  const closeShipyardPanel = useCallback(() => {
    setShipyardSystemId(null);
    setFocusSystemId(null);
  }, []);

  const centerOnSystem = useCallback((systemId: string) => {
    setFocusSystemId(systemId);
    setFocusTrigger((value) => value + 1);
    setSelectedSystemId(null);
    setSelectedPlanetId(null);
  }, []);

  const handleDockCenter = useCallback(
    (systemId: string, _planetId?: string | null) => {
      void _planetId;
      centerOnSystem(systemId);
      setDockSelection(null);
    },
    [centerOnSystem],
  );

  const handleDockSelect = useCallback((selection: DockSelection) => {
    if (selection.kind === 'colony') {
      setSelectedPlanetId(null);
      setPlanetDetailId(selection.planetId);
      setDockSelection(null);
      return;
    }
    setDockSelection(selection);
  }, []);

  const handleSelectSystem = useCallback(
    (systemId: string, _anchor?: { x: number; y: number }) => {
      void _anchor;
      const targetSystem = systems.find((entry) => entry.id === systemId);
      if (!targetSystem) {
        return;
      }
      const isAccessible =
        targetSystem.visibility === 'surveyed' ||
        colonizedSystems.has(targetSystem.id);
      setSelectedPlanetId(null);
      setSelectedSystemId(isAccessible ? systemId : null);
      setFocusSystemId(systemId);
      setMapMessage(
        isAccessible
          ? null
          : 'Sistema non sondato: esplora con una nave scientifica per ottenere i dettagli.',
      );
    },
    [colonizedSystems, systems],
  );

  const handleSelectShipyard = useCallback(
    (systemId: string, _anchor?: { x: number; y: number }) => {
      void _anchor;
      const targetSystem = systems.find((entry) => entry.id === systemId);
      if (!targetSystem) {
        return;
      }
      const isAccessible =
        targetSystem.visibility === 'surveyed' ||
        colonizedSystems.has(targetSystem.id);
      const hasShipyardStructure =
        targetSystem.hasShipyard || Boolean(targetSystem.shipyardBuild);
      setShipyardSystemId(
        isAccessible && hasShipyardStructure ? systemId : null,
      );
      setSelectedSystemId(null);
      setSelectedPlanetId(null);
      setFocusSystemId(systemId);
    },
    [colonizedSystems, systems],
  );

  const shipyardSystem = useMemo<StarSystem | null>(
    () =>
      shipyardSystemId
        ? systems.find((system) => system.id === shipyardSystemId) ?? null
        : null,
    [shipyardSystemId, systems],
  );

  const focusedSystem = useMemo<StarSystem | null>(
    () =>
      selectedSystemId
        ? systems.find((system) => system.id === selectedSystemId) ?? null
        : null,
    [selectedSystemId, systems],
  );

  const focusedPlanet = useMemo<Planet | null>(
    () =>
      selectedPlanetId
        ? planets.find((planet) => planet.id === selectedPlanetId) ?? null
        : null,
    [selectedPlanetId, planets],
  );

  const focusedOrbitingPlanet = useMemo<OrbitingPlanet | null>(() => {
    if (!selectedPlanetId || !focusSystemId) {
      return null;
    }
    const system = systems.find((entry) => entry.id === focusSystemId);
    return (
      system?.orbitingPlanets.find((planet) => planet.id === selectedPlanetId) ??
      null
    );
  }, [focusSystemId, selectedPlanetId, systems]);

  const focusedPlanetSystem = useMemo<StarSystem | null>(() => {
    if (focusedPlanet) {
      return (
        systems.find((system) => system.id === focusedPlanet.systemId) ?? null
      );
    }
    if (focusSystemId) {
      return systems.find((system) => system.id === focusSystemId) ?? null;
    }
    return null;
  }, [focusSystemId, focusedPlanet, systems]);

  const selectedFleet = useMemo<Fleet | null>(() => {
    if (!session || dockSelection?.kind !== 'fleet') {
      return null;
    }
    return session.fleets.find((fleet) => fleet.id === dockSelection.fleetId) ?? null;
  }, [dockSelection, session]);

  const selectedScienceShip = useMemo<ScienceShip | null>(() => {
    if (!session || dockSelection?.kind !== 'science') {
      return null;
    }
    return (
      session.scienceShips.find((ship) => ship.id === dockSelection.shipId) ?? null
    );
  }, [dockSelection, session]);

  const planetDetail = useMemo<Planet | null>(() => {
    if (!session || !planetDetailId) {
      return null;
    }
    return (
      session.economy.planets.find((planet) => planet.id === planetDetailId) ??
      null
    );
  }, [planetDetailId, session]);

  const isConstructionSelection =
    dockSelection?.kind === 'fleet' && dockSelection.source === 'construction';

  return {
    focusSystemId,
    focusTrigger,
    selectedSystemId,
    selectedPlanetId,
    planetDetailId,
    mapMessage,
    dockSelection,
    shipyardSystemId,
    shipyardSystem,
    focusedSystem,
    focusedPlanet,
    focusedOrbitingPlanet,
    focusedPlanetSystem,
    selectedFleet,
    selectedScienceShip,
    planetDetail,
    isConstructionSelection,
    setDockSelection,
    setPlanetDetailId,
    setSelectedPlanetId,
    clearFocusTargets,
    closeShipyardPanel,
    centerOnSystem,
    handleDockCenter,
    handleDockSelect,
    handleSelectSystem,
    handleSelectShipyard,
  };
};
