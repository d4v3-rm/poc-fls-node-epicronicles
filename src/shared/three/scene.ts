import {
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  PointLight,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
} from 'three';

export interface SceneSetup {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  dispose: () => void;
}

export const createScene = (container: HTMLDivElement): SceneSetup => {
  const scene = new Scene();
  scene.background = new Color(0x050a12);

  const camera = new PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000,
  );
  camera.position.set(0, 0, 170);

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const ambient = new AmbientLight(0xffffff, 0.35);
  const keyLight = new PointLight(0xffffff, 1.2);
  keyLight.position.set(60, 60, 100);
  scene.add(ambient);
  scene.add(keyLight);

  // Starfield backdrop + faint galactic fog
  const starGeometry = new BufferGeometry();
  const starCount = 1100;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    const radius = 650 + Math.random() * 650;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  starGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  const starMaterial = new PointsMaterial({
    color: 0xaac8ff,
    size: 1.5,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const stars = new Points(starGeometry, starMaterial);
  scene.add(stars);

  const fogGeometry = new BufferGeometry();
  const fogCount = 280;
  const fogPositions = new Float32Array(fogCount * 3);
  for (let i = 0; i < fogCount; i += 1) {
    const radius = 420 + Math.random() * 220;
    const theta = Math.random() * Math.PI * 2;
    fogPositions[i * 3] = Math.cos(theta) * radius;
    fogPositions[i * 3 + 1] = Math.sin(theta) * radius;
    fogPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
  }
  fogGeometry.setAttribute('position', new Float32BufferAttribute(fogPositions, 3));
  const fogMaterial = new PointsMaterial({
    color: 0x4d73ff,
    size: 12,
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const fog = new Points(fogGeometry, fogMaterial);
  scene.add(fog);

  const dispose = () => {
    starGeometry.dispose();
    starMaterial.dispose();
    fogGeometry.dispose();
    fogMaterial.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { scene, camera, renderer, dispose };
};
