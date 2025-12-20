import * as THREE from 'three';
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmShader } from 'three/examples/jsm/shaders/FilmShader.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import {
  createBlackHoleLensingPass,
  type BlackHoleLensingData,
} from './blackHoleLensingPass';

const BLOOM = {
  strength: 0.55,
  radius: 0.55,
  threshold: 0.18,
} as const;

const VIGNETTE = {
  offset: 1.15,
  darkness: 1.08,
} as const;

const FILM_GRAIN = {
  intensity: 0.12,
} as const;

const CHROMA = {
  amount: 0.0011,
  angle: 0.35,
} as const;

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

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    BLOOM.strength,
    BLOOM.radius,
    BLOOM.threshold,
  );
  composer.addPass(bloomPass);

  const vignettePass = new ShaderPass(VignetteShader);
  vignettePass.uniforms.offset.value = VIGNETTE.offset;
  vignettePass.uniforms.darkness.value = VIGNETTE.darkness;
  composer.addPass(vignettePass);

  const filmPass = new ShaderPass(FilmShader);
  filmPass.uniforms.intensity.value = FILM_GRAIN.intensity;
  filmPass.uniforms.grayscale.value = false;
  composer.addPass(filmPass);

  const rgbShiftPass = new ShaderPass(RGBShiftShader);
  rgbShiftPass.uniforms.amount.value = CHROMA.amount;
  rgbShiftPass.uniforms.angle.value = CHROMA.angle;
  composer.addPass(rgbShiftPass);

  const fxaaPass = new ShaderPass(FXAAShader);
  composer.addPass(fxaaPass);

  const resize = (nextWidth: number, nextHeight: number, nextPixelRatio: number) => {
    composer.setPixelRatio(nextPixelRatio);
    composer.setSize(nextWidth, nextHeight);
    lensingPass.resize(nextWidth, nextHeight);
    bloomPass.setSize(nextWidth, nextHeight);
    fxaaPass.uniforms.resolution.value.set(
      1 / Math.max(1, nextWidth * nextPixelRatio),
      1 / Math.max(1, nextHeight * nextPixelRatio),
    );
  };

  resize(width, height, pixelRatio);

  return {
    composer,
    resize,
    update: (elapsed: number, lensing?: BlackHoleLensingData) => {
      lensingPass.update(elapsed, lensing);
      filmPass.uniforms.time.value = elapsed * 0.75;
      rgbShiftPass.uniforms.angle.value = CHROMA.angle + Math.sin(elapsed * 0.06) * 0.25;
    },
  };
};
