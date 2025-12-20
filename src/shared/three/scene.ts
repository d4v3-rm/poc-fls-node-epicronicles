import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  SRGBColorSpace,
  NoToneMapping,
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
  renderer.toneMapping = NoToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const ambient = new AmbientLight(0xffffff, 1);
  scene.add(ambient);

  const dispose = () => {
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { scene, camera, renderer, dispose };
};
