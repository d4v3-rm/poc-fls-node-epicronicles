import * as THREE from 'three';
import { markDisposableMaterial, markDisposableTexture } from '../dispose';
import type { RandomFn } from './random';
import { createSoftCircleTexture } from './textures';

const diskVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const diskFragmentShader = `
precision highp float;

uniform float uTime;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform vec3 uInnerColor;
uniform vec3 uOuterColor;

varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  float r = length(uv);
  float angle = atan(uv.y, uv.x);

  float outerEdge = smoothstep(uOuterRadius, uOuterRadius - 0.04, r);
  float innerEdge = smoothstep(uInnerRadius, uInnerRadius + 0.05, r);
  float ring = outerEdge * innerEdge;
  if (ring < 0.001) discard;

  float t = uTime * 0.25;
  float swirl = sin(angle * 12.0 + r * 22.0 - t * 9.0);
  float n = noise(vec2(angle * 1.8, r * 3.2 + t * 0.9));
  float turb = noise(vec2(angle * 4.2 - t * 1.4, r * 10.0 + t * 0.6));
  float gradient = clamp((r - uInnerRadius) / max(0.001, (uOuterRadius - uInnerRadius)), 0.0, 1.0);

  vec3 base = mix(uInnerColor, uOuterColor, gradient);
  base *= 0.85 + 0.25 * turb;
  float doppler = 0.62 + 0.38 * sin(angle - t * 2.35);
  float filaments = (0.22 + 0.78 * abs(swirl)) * (0.7 + 0.3 * n) * (0.75 + 0.25 * turb);
  float innerGlow = smoothstep(uInnerRadius + 0.07, uInnerRadius, r);
  float intensity = ring * filaments * doppler;
  intensity += ring * innerGlow * (1.05 - gradient) * 0.55;
  intensity = clamp(intensity, 0.0, 1.0);

  gl_FragColor = vec4(base * intensity, intensity);
}
`;

export interface BuildBlackHoleParams {
  group: THREE.Group;
  innerVoidRadius: number;
  random: RandomFn;
}

export const buildBlackHole = ({
  group,
  innerVoidRadius,
  random,
}: BuildBlackHoleParams) => {
  const root = new THREE.Group();
  root.name = 'blackHole';

  const horizonRadius = Math.max(14, innerVoidRadius * 0.18);
  const diskOuterWorld = Math.max(horizonRadius * 4.6, innerVoidRadius * 0.7);
  const diskInnerWorld = horizonRadius * 1.35;
  const innerRadius = diskInnerWorld / diskOuterWorld;

  const horizonMaterial = markDisposableMaterial(
    new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.9,
      metalness: 0,
      emissive: new THREE.Color(0x000000),
    }),
  );
  const horizon = new THREE.Mesh(
    new THREE.SphereGeometry(horizonRadius, 32, 32),
    horizonMaterial,
  );
  horizon.name = 'eventHorizon';
  horizon.castShadow = false;
  horizon.receiveShadow = false;
  root.add(horizon);

  const diskMaterial = markDisposableMaterial(
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInnerRadius: { value: innerRadius },
        uOuterRadius: { value: 0.98 },
        uInnerColor: { value: new THREE.Color('#d6f3ff') },
        uOuterColor: { value: new THREE.Color('#ffb36b') },
      },
      vertexShader: diskVertexShader,
      fragmentShader: diskFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  ) as THREE.ShaderMaterial;
  const baseDiskOpacity = 1;

  const disk = new THREE.Mesh(
    new THREE.PlaneGeometry(diskOuterWorld * 2, diskOuterWorld * 2, 1, 1),
    diskMaterial,
  );
  disk.name = 'accretionDisk';
  disk.rotation.x = -Math.PI / 2;
  disk.position.y = 0.25;
  disk.renderOrder = 8;
  root.add(disk);

  const glowTexture = createSoftCircleTexture(256);
  const haloBaseOpacity = 0.18;
  if (glowTexture) {
    const haloMaterial = markDisposableMaterial(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: new THREE.Color('#6bd2ff'),
        transparent: true,
        opacity: haloBaseOpacity,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      }),
    ) as THREE.SpriteMaterial;
    const halo = new THREE.Sprite(haloMaterial);
    halo.name = 'lensingHalo';
    const haloSize = diskOuterWorld * 3.2;
    halo.scale.set(haloSize, haloSize, 1);
    halo.position.y = 8 + innerVoidRadius * 0.02;
    halo.renderOrder = 6;
    root.add(halo);
  }

  const rimMaterial = markDisposableMaterial(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#ff7b6b'),
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  const baseRimOpacity = rimMaterial.opacity;
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(diskOuterWorld * 0.92, diskOuterWorld * 1.2, 72),
    rimMaterial,
  );
  rim.name = 'diskRim';
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.2;
  rim.renderOrder = 5;
  root.add(rim);

  const ringMaterial = markDisposableMaterial(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#cfeaff'),
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  const basePhotonOpacity = ringMaterial.opacity;
  const photonRing = new THREE.Mesh(
    new THREE.RingGeometry(horizonRadius * 1.02, horizonRadius * 1.3, 60),
    ringMaterial,
  );
  photonRing.name = 'photonRing';
  photonRing.rotation.x = -Math.PI / 2;
  photonRing.position.y = 0.28;
  photonRing.renderOrder = 9;
  root.add(photonRing);

  const createJetTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.18, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.15)');
    g.addColorStop(0.82, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const radial = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2,
    );
    radial.addColorStop(0, 'rgba(0,0,0,0)');
    radial.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    const texture = markDisposableTexture(new THREE.CanvasTexture(canvas));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  };

  const jetTexture = createJetTexture();
  const jetBaseOpacity = 0.22;
  if (jetTexture) {
    const jetMaterial = markDisposableMaterial(
      new THREE.MeshBasicMaterial({
        map: jetTexture,
        color: new THREE.Color('#6bd2ff'),
        transparent: true,
        opacity: jetBaseOpacity,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    ) as THREE.MeshBasicMaterial;

    const jetLength = Math.max(diskOuterWorld * 3.2, innerVoidRadius * 1.25);
    const jetRadius = Math.max(horizonRadius * 0.55, diskOuterWorld * 0.12);
    const jetGeometry = new THREE.ConeGeometry(jetRadius, jetLength, 18, 1, true);

    const jetUp = new THREE.Mesh(jetGeometry, jetMaterial);
    jetUp.name = 'jetUp';
    jetUp.position.y = horizonRadius + jetLength / 2;
    jetUp.renderOrder = 7;
    root.add(jetUp);

    const jetDown = new THREE.Mesh(jetGeometry, jetMaterial);
    jetDown.name = 'jetDown';
    jetDown.position.y = -(horizonRadius + jetLength / 2);
    jetDown.rotation.x = Math.PI;
    jetDown.renderOrder = 7;
    root.add(jetDown);
  }

  root.rotation.y = (random() - 0.5) * 0.6;

  group.add(root);

  return {
    update: (elapsed: number, zoomFactor = 1) => {
      const visibility = Math.min(1, Math.max(0, 0.28 + zoomFactor * 0.72));
      diskMaterial.uniforms.uTime.value = elapsed;
      diskMaterial.opacity = baseDiskOpacity * visibility;
      disk.rotation.z = elapsed * 0.08;
      rim.rotation.z = elapsed * -0.03;
      rimMaterial.opacity = baseRimOpacity * visibility;
      photonRing.rotation.z = elapsed * 0.05;
      ringMaterial.opacity = basePhotonOpacity * visibility;
      const halo = root.getObjectByName('lensingHalo') as THREE.Sprite | null;
      if (halo) {
        halo.material.opacity =
          (0.14 + Math.sin(elapsed * 0.8 + root.rotation.y) * 0.03) *
          visibility *
          (haloBaseOpacity / 0.18);
      }
      const jetUp = root.getObjectByName('jetUp') as THREE.Mesh | null;
      const jetDown = root.getObjectByName('jetDown') as THREE.Mesh | null;
      if (jetUp?.material instanceof THREE.MeshBasicMaterial) {
        const pulse = jetBaseOpacity + Math.sin(elapsed * 0.9) * 0.04;
        jetUp.material.opacity = pulse * visibility;
        if (jetDown?.material instanceof THREE.MeshBasicMaterial) {
          jetDown.material.opacity = pulse * visibility;
        }
      }
    },
    horizonRadius,
    diskOuterWorld,
  };
};

