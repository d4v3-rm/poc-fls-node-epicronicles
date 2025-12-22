import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createScene } from '@three/scene';
import { BASE_TILT, MAX_TILT_DOWN } from './constants';
import type { GalaxySceneContext } from './useGalaxyScene';
import { createGalaxyPostprocessing } from './postprocessing/createGalaxyPostprocessing';

interface UseGalaxySceneSetupOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  minZoom: number;
  maxZoom: number;
}

// Creates and owns the Three.js scene resources (renderer/camera/composer/controls).
export const useGalaxySceneSetup = ({
  containerRef,
  minZoom,
  maxZoom,
}: UseGalaxySceneSetupOptions) => {
  const [context, setContext] = useState<GalaxySceneContext | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const { scene, camera, renderer, dispose } = createScene(container);
    const pixelRatio = Math.min(window.devicePixelRatio ?? 1, 2);
    renderer.setPixelRatio(pixelRatio);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enabled = true;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.enableRotate = false;
    controls.enableZoom = false; // gestito a mano per evitare side-effect su tilt
    controls.minDistance = minZoom;
    controls.maxDistance = maxZoom;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE, // rotation disabilitata, click sinistro non muove
      MIDDLE: THREE.MOUSE.ROTATE, // click centrale gestito a mano, nessun drag
      RIGHT: THREE.MOUSE.PAN,
    };
    controls.minAzimuthAngle = -Math.PI;
    controls.maxAzimuthAngle = Math.PI;
    controls.minPolarAngle = BASE_TILT;
    controls.maxPolarAngle = MAX_TILT_DOWN;

    controls.target.set(0, 0, 0);
    const initialDistance = Math.min(
      maxZoom,
      Math.max(minZoom, Math.max(170, maxZoom * 0.65)),
    );
    camera.position.set(0, initialDistance, 0);
    camera.lookAt(controls.target);
    controls.update();

    const postprocessing = createGalaxyPostprocessing({
      renderer,
      scene,
      camera,
      width: container.clientWidth,
      height: container.clientHeight,
      pixelRatio,
    });

    const backgroundGroup = new THREE.Group();
    backgroundGroup.name = 'backgroundGroup';
    scene.add(backgroundGroup);

    const systemGroup = new THREE.Group();
    systemGroup.name = 'systemGroup';
    scene.add(systemGroup);

    const clock = new THREE.Clock();

    const ctx: GalaxySceneContext = {
      scene,
      camera,
      renderer,
      controls,
      composer: postprocessing.composer,
      clock,
      backgroundGroup,
      systemGroup,
      postprocessingUpdate: postprocessing.update,
    };
    setContext(ctx);

    const handleResize = () => {
      const nextPixelRatio = Math.min(window.devicePixelRatio ?? 1, 2);
      renderer.setPixelRatio(nextPixelRatio);
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      postprocessing.resize(
        container.clientWidth,
        container.clientHeight,
        nextPixelRatio,
      );
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      postprocessing.composer.dispose();
      dispose();
      setContext(null);
    };
  }, [containerRef, minZoom, maxZoom]);

  return context;
};
