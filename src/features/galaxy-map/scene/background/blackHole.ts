import * as THREE from 'three';
import { markDisposableMaterial, markDisposableTexture } from '../dispose';
import type { RandomFn } from './random';
import { galaxyTextureUrls } from './assets';
import { loadAssetTexture } from './assetLoader';
import { createAccretionNoiseTexture, createSoftCircleTexture } from './textures';

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
uniform vec3 uMidColor;
uniform vec3 uOuterColor;
uniform sampler2D uNoiseTex;
uniform vec2 uViewDir;

varying vec2 vUv;

vec3 temperatureRamp(float t) {
  vec3 cool = uOuterColor;
  vec3 mid = uMidColor;
  vec3 hot = uInnerColor;
  if (t < 0.5) {
    return mix(cool, mid, t * 2.0);
  }
  return mix(mid, hot, (t - 0.5) * 2.0);
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  float r = length(uv);

  float ring = smoothstep(uOuterRadius, uOuterRadius - 0.06, r)
    * smoothstep(uInnerRadius, uInnerRadius + 0.05, r);
  if (ring < 0.001) {
    discard;
  }

  float gradient = clamp(
    (r - uInnerRadius) / max(0.0001, (uOuterRadius - uInnerRadius)),
    0.0,
    1.0
  );
  float angle = atan(uv.y, uv.x);
  float speed = mix(2.9, 0.7, gradient);
  float swirl = angle + uTime * speed;

  vec2 swirlUv = vec2(cos(swirl), sin(swirl)) * (1.8 + gradient * 4.6);
  vec2 noiseUv = swirlUv * 0.18 + vec2(uTime * 0.025, -uTime * 0.018);
  vec3 noise = texture2D(uNoiseTex, noiseUv).rgb;
  vec3 noiseFine = texture2D(
    uNoiseTex,
    noiseUv * 2.6 + vec2(-uTime * 0.04, uTime * 0.033)
  ).rgb;

  float filament = smoothstep(0.18, 0.95, noise.r) * (0.6 + 0.4 * noiseFine.g);
  float clump = smoothstep(0.3, 0.9, noise.b);

  vec2 viewDir = normalize(uViewDir);
  vec2 tangent = normalize(vec2(-uv.y, uv.x));
  float doppler = clamp(dot(tangent, viewDir), -1.0, 1.0);
  float beaming = pow(1.0 + 0.55 * doppler, 2.1);

  float radial = mix(0.65, 1.35, pow(1.0 - gradient, 1.65));
  float flicker = 0.9 + 0.1 * sin(uTime * 1.4 + angle * 6.0 + r * 14.0);
  float intensity = ring * radial * filament * beaming * (0.7 + 0.3 * clump) * flicker;

  float innerGlow = smoothstep(uInnerRadius + 0.035, uInnerRadius, r);
  intensity += innerGlow * 0.55;

  float heat = pow(1.0 - gradient, 0.35);
  vec3 base = temperatureRamp(heat);
  base *= 0.8 + 0.2 * noiseFine.r;

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
  const diskOuterWorld = Math.max(horizonRadius * 4.8, innerVoidRadius * 0.72);
  const diskInnerWorld = horizonRadius * 1.32;
  const innerRadius = diskInnerWorld / diskOuterWorld;
  const lensingRadius = Math.min(horizonRadius * 7.2, diskOuterWorld * 0.65);

  const horizonMaterial = markDisposableMaterial(
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
  ) as THREE.MeshBasicMaterial;
  const baseHorizonOpacity = horizonMaterial.opacity;
  const horizon = new THREE.Mesh(
    new THREE.SphereGeometry(horizonRadius, 48, 48),
    horizonMaterial,
  );
  horizon.name = 'eventHorizon';
  horizon.castShadow = false;
  horizon.receiveShadow = false;
  root.add(horizon);

  const noiseTexture = createAccretionNoiseTexture(random, 512);
  const viewDir = new THREE.Vector2(0, 1);
  const tempCameraLocal = new THREE.Vector3();

  const diskMaterial = markDisposableMaterial(
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInnerRadius: { value: innerRadius },
        uOuterRadius: { value: 0.98 },
        uInnerColor: { value: new THREE.Color('#d9f7ff') },
        uMidColor: { value: new THREE.Color('#ffe2b8') },
        uOuterColor: { value: new THREE.Color('#ff8b5c') },
        uNoiseTex: { value: noiseTexture },
        uViewDir: { value: viewDir },
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
  const baseDiskOpacity = 0.95;

  const disk = new THREE.Mesh(
    new THREE.PlaneGeometry(diskOuterWorld * 2, diskOuterWorld * 2, 1, 1),
    diskMaterial,
  );
  disk.name = 'accretionDisk';
  disk.rotation.x = -Math.PI / 2;
  disk.position.y = 0.22;
  disk.renderOrder = 8;
  disk.onBeforeRender = (_renderer, _scene, camera) => {
    tempCameraLocal.copy(camera.position);
    disk.worldToLocal(tempCameraLocal);
    viewDir.set(tempCameraLocal.x, tempCameraLocal.y);
    if (viewDir.lengthSq() < 0.001) {
      viewDir.set(0, 1);
    } else {
      viewDir.normalize();
    }
    diskMaterial.uniforms.uViewDir.value.copy(viewDir);
  };
  root.add(disk);

  const glowTexture = createSoftCircleTexture(256);
  const haloTexture =
    loadAssetTexture(galaxyTextureUrls.dustSprite, {
      colorSpace: THREE.SRGBColorSpace,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      flipY: false,
    }) ?? glowTexture;
  const haloBaseOpacity = 0.22;
  if (haloTexture) {
    const haloMaterial = markDisposableMaterial(
      new THREE.SpriteMaterial({
        map: haloTexture,
        color: new THREE.Color('#8bdcff'),
        transparent: true,
        opacity: haloBaseOpacity,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      }),
    ) as THREE.SpriteMaterial;
    const halo = new THREE.Sprite(haloMaterial);
    halo.name = 'lensingHalo';
    const haloSize = diskOuterWorld * 3.6;
    halo.scale.set(haloSize, haloSize, 1);
    halo.position.y = 8 + innerVoidRadius * 0.02;
    halo.renderOrder = 6;
    root.add(halo);
  }

  const coronaTexture = glowTexture ?? haloTexture;
  const coronaBaseOpacity = 0.24;
  if (coronaTexture) {
    const coronaMaterial = markDisposableMaterial(
      new THREE.SpriteMaterial({
        map: coronaTexture,
        color: new THREE.Color('#ffd7b4'),
        transparent: true,
        opacity: coronaBaseOpacity,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      }),
    ) as THREE.SpriteMaterial;
    const corona = new THREE.Sprite(coronaMaterial);
    corona.name = 'coronaGlow';
    const coronaSize = diskOuterWorld * 1.6;
    corona.scale.set(coronaSize, coronaSize, 1);
    corona.position.y = 1.6;
    corona.renderOrder = 7;
    root.add(corona);
  }

  const rimMaterial = markDisposableMaterial(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#ffc38c'),
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  const baseRimOpacity = rimMaterial.opacity;
  const rim = new THREE.Mesh(
    new THREE.RingGeometry(diskOuterWorld * 0.88, diskOuterWorld * 1.25, 96),
    rimMaterial,
  );
  rim.name = 'diskRim';
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.16;
  rim.renderOrder = 5;
  root.add(rim);

  const ringMaterial = markDisposableMaterial(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#fff1d8'),
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  const basePhotonOpacity = ringMaterial.opacity;
  const photonRing = new THREE.Mesh(
    new THREE.RingGeometry(horizonRadius * 1.06, horizonRadius * 1.55, 96),
    ringMaterial,
  );
  photonRing.name = 'photonRing';
  photonRing.rotation.x = -Math.PI / 2;
  photonRing.position.y = 0.24;
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
    g.addColorStop(0.2, 'rgba(200,230,255,0.55)');
    g.addColorStop(0.5, 'rgba(150,210,255,0.16)');
    g.addColorStop(0.8, 'rgba(200,230,255,0.55)');
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
  const jetBaseOpacity = 0.18;
  let jetMaterial: THREE.MeshBasicMaterial | null = null;
  if (jetTexture) {
    jetMaterial = markDisposableMaterial(
      new THREE.MeshBasicMaterial({
        map: jetTexture,
        color: new THREE.Color('#88d8ff'),
        transparent: true,
        opacity: jetBaseOpacity,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    ) as THREE.MeshBasicMaterial;

    const jetLength = Math.max(diskOuterWorld * 3.8, innerVoidRadius * 1.4);
    const jetRadius = Math.max(horizonRadius * 0.5, diskOuterWorld * 0.1);
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

  const halo = root.getObjectByName('lensingHalo') as THREE.Sprite | null;
  const corona = root.getObjectByName('coronaGlow') as THREE.Sprite | null;

  return {
    update: (elapsed: number, zoomFactor = 1) => {
      const visibility = THREE.MathUtils.smoothstep(zoomFactor, 0.6, 0.95);
      horizonMaterial.opacity = baseHorizonOpacity * visibility;
      diskMaterial.uniforms.uTime.value = elapsed;
      diskMaterial.opacity = baseDiskOpacity * visibility;
      disk.rotation.z = elapsed * 0.04;
      rim.rotation.z = elapsed * -0.018;
      rimMaterial.opacity = baseRimOpacity * visibility;
      photonRing.rotation.z = elapsed * 0.06;
      ringMaterial.opacity = basePhotonOpacity * visibility;

      if (halo?.material instanceof THREE.SpriteMaterial) {
        halo.material.opacity =
          (haloBaseOpacity + Math.sin(elapsed * 0.6 + root.rotation.y) * 0.03) *
          visibility;
      }
      if (corona?.material instanceof THREE.SpriteMaterial) {
        corona.material.opacity =
          (coronaBaseOpacity + Math.sin(elapsed * 0.85) * 0.03) * visibility;
      }
      if (jetMaterial) {
        const pulse = jetBaseOpacity + Math.sin(elapsed * 0.9) * 0.035;
        jetMaterial.opacity = pulse * visibility;
      }
    },
    horizonRadius,
    diskOuterWorld,
    lensingRadius,
    object: root,
  };
};
