import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  PointLight,
  SRGBColorSpace,
  ACESFilmicToneMapping,
} from 'three';

export interface SceneSetup {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  dispose: () => void;
}

export const createScene = (container: HTMLDivElement): SceneSetup => {
  const scene = new Scene();

  const camera = new PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    20000,
  );

  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const ambient = new AmbientLight(0xffffff, 0.35);
  const keyLight = new PointLight(0xffffff, 1.2);
  keyLight.position.set(60, 60, 100);
  scene.add(ambient);
  scene.add(keyLight);

  const dispose = () => {
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { scene, camera, renderer, dispose };
};
