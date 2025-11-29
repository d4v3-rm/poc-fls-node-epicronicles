import { useEffect } from 'react';
import { createBlackHole } from '../scene/blackHole';
import { useGalaxyMapContext } from './GalaxyMapContext';

export const useBlackHole = () => {
  const {
    sceneContext,
    refs: { blackHoleRef },
  } = useGalaxyMapContext();

  useEffect(() => {
    const group = sceneContext?.systemGroup ?? null;
    if (!sceneContext || !group) {
      return;
    }
    const blackHole = createBlackHole();
    blackHoleRef.current = blackHole;
    group.add(blackHole);

    return () => {
      if (blackHoleRef.current && group) {
        group.remove(blackHoleRef.current);
      }
      blackHoleRef.current = null;
    };
  }, [sceneContext, blackHoleRef]);
};
