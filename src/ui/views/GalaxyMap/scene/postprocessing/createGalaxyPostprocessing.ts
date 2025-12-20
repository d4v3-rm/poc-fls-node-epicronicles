import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import {
  createBlackHoleLensingPass,
  type BlackHoleLensingData,
} from './blackHoleLensingPass';

export interface GalaxyPostprocessing {
  composer: EffectComposer;
  resize: (width: number, height: number, pixelRatio: number) => void;
  update: (elapsed: number, lensing?: BlackHoleLensingData) => void;
}

export const createGalaxyPostprocessing = ({
  renderer,
  scene,
  camera,
  width,
  height,
  pixelRatio,
}: {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  width: number;
  height: number;
  pixelRatio: number;
}): GalaxyPostprocessing => {
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(pixelRatio);
  composer.setSize(width, height);

  composer.addPass(new RenderPass(scene, camera));

  const lensingPass = createBlackHoleLensingPass({ width, height });
  composer.addPass(lensingPass.pass);

  const resize = (nextWidth: number, nextHeight: number, nextPixelRatio: number) => {
    composer.setPixelRatio(nextPixelRatio);
    composer.setSize(nextWidth, nextHeight);
    lensingPass.resize(nextWidth, nextHeight);
  };

  resize(width, height, pixelRatio);

  return {
    composer,
    resize,
    update: (elapsed: number, lensing?: BlackHoleLensingData) => {
      lensingPass.update(elapsed, lensing);
    },
  };
};
