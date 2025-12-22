import { useCallback, useMemo, useState } from 'react';
import type { GalaxyShape } from '@domain/galaxy/galaxy';
import { useGameStore } from '@store/gameStore';
import { MainMenuLanding } from '../MainMenuLanding';
import { MainMenuSetup } from '../MainMenuSetup';
import { pickBackground, randomBackgroundIndex } from '../common/backgrounds';

type MenuStage = 'landing' | 'setup';

export const MainMenu = () => {
  const startNewSession = useGameStore((state) => state.startNewSession);
  const loadSession = useGameStore((state) => state.loadSession);
  const hasSavedSession = useGameStore((state) => state.hasSavedSession);
  const config = useGameStore((state) => state.config);
  const [seed, setSeed] = useState(config.defaultGalaxy.seed);
  const defaultShapes: GalaxyShape[] = ['circle', 'spiral', 'ring', 'bar', 'ellipse', 'cluster'];
  const availableShapes: GalaxyShape[] =
    config.galaxyShapes && config.galaxyShapes.length > 0
      ? (config.galaxyShapes as GalaxyShape[])
      : defaultShapes;
  const [galaxyShape, setGalaxyShape] = useState<GalaxyShape>(
    (config.defaultGalaxy.galaxyShape as GalaxyShape) ?? availableShapes[0],
  );
  const availableSystemCounts =
    config.galaxySystemCounts && config.galaxySystemCounts.length > 0
      ? config.galaxySystemCounts
      : [8, 16, 32, 64, 128, 256];
  const availableRadii =
    config.galaxyRadii && config.galaxyRadii.length > 0
      ? config.galaxyRadii
      : [128, 256, 512, 1024, 1536, 2048];
  const [systemCount, setSystemCount] = useState(
    config.defaultGalaxy.systemCount ?? availableSystemCounts[0],
  );
  const [galaxyRadius, setGalaxyRadius] = useState(
    config.defaultGalaxy.galaxyRadius ?? availableRadii[0],
  );
  const [stage, setStage] = useState<MenuStage>('landing');
  const [message, setMessage] = useState<string | null>(null);
  const [backgroundIndex] = useState(() =>
    randomBackgroundIndex(),
  );

  const background = useMemo(() => pickBackground(backgroundIndex), [backgroundIndex]);

  const handleLoad = useCallback(() => {
    const result = loadSession();
    setMessage(
      result.success
        ? 'Ultimo salvataggio caricato.'
        : 'Nessun salvataggio disponibile o file non valido.',
    );
    setStage('landing');
  }, [loadSession]);

  const handleStart = useCallback(() => {
    startNewSession({
      seed,
      galaxyShape,
      systemCount,
      galaxyRadius,
    });
    setMessage(null);
  }, [startNewSession, seed, galaxyShape, systemCount, galaxyRadius]);

  return stage === 'landing' ? (
    <MainMenuLanding
      background={background}
      canLoad={hasSavedSession()}
      onStart={() => {
        setStage('setup');
        setMessage(null);
      }}
      onLoad={handleLoad}
      toast={message}
    />
  ) : (
    <MainMenuSetup
      background={background}
      seed={seed}
      galaxyShape={galaxyShape}
      galaxyShapes={availableShapes}
      systemCount={systemCount}
      systemCountOptions={availableSystemCounts}
      galaxyRadius={galaxyRadius}
      galaxyRadii={availableRadii}
      onSeedChange={setSeed}
      onShapeChange={setGalaxyShape}
      onSystemCountChange={setSystemCount}
      onRadiusChange={setGalaxyRadius}
      onConfirm={handleStart}
      onBack={() => setStage('landing')}
    />
  );
};
