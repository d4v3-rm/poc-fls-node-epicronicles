import * as THREE from 'three';
import { markDisposableMaterial, markDisposableTexture } from '../dispose';
import type { RandomFn } from './random';
import { randomInRange } from './random';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const createDustFieldTexture = ({
  random,
  size,
  outerRadius,
  innerVoidRadius,
  systemPositions,
}: {
  random: RandomFn;
  size: number;
  outerRadius: number;
  innerVoidRadius: number;
  systemPositions: Map<string, THREE.Vector3>;
}) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.fillRect(0, 0, size, size);

  ctx.globalCompositeOperation = 'lighter';
  const entries = [...systemPositions.values()];
  const maxSamples = 1800;
  const step = Math.max(1, Math.ceil(entries.length / maxSamples));
  const extent = outerRadius * 1.05;
  const half = size / 2;

  for (let i = 0; i < entries.length; i += step) {
    const p = entries[i]!;
    const u = (p.x / extent + 1) * 0.5;
    const v = (p.z / extent + 1) * 0.5;
    if (u < 0 || u > 1 || v < 0 || v > 1) {
      continue;
    }

    const x = u * size;
    const y = (1 - v) * size;
    const radius = randomInRange(random, 10, 22) * (size / 512);
    const alpha = randomInRange(random, 0.035, 0.085);
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.2);
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(0.25, `rgba(255,255,255,${alpha * 0.55})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const blurCanvas = document.createElement('canvas');
  blurCanvas.width = size;
  blurCanvas.height = size;
  const blurCtx = blurCanvas.getContext('2d');
  if (blurCtx) {
    blurCtx.filter = `blur(${Math.round(size * 0.012)}px)`;
    blurCtx.drawImage(canvas, 0, 0);
    ctx.globalCompositeOperation = 'copy';
    ctx.filter = 'none';
    ctx.drawImage(blurCanvas, 0, 0);
  }

  const holeRadiusPx = clamp((innerVoidRadius / extent) * half, 0, half);
  if (holeRadiusPx > 1) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(half, half, holeRadiusPx, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = markDisposableTexture(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

export interface BuildDustFieldParams {
  group: THREE.Group;
  random: RandomFn;
  outerRadius: number;
  innerVoidRadius: number;
  systemPositions: Map<string, THREE.Vector3>;
}

export const buildDustField = ({
  group,
  random,
  outerRadius,
  innerVoidRadius,
  systemPositions,
}: BuildDustFieldParams) => {
  const root = new THREE.Group();
  root.name = 'dustField';

  const texture = createDustFieldTexture({
    random,
    size: 640,
    outerRadius,
    innerVoidRadius,
    systemPositions,
  });
  if (!texture) {
    group.add(root);
    return { update: () => undefined };
  }

  const extent = outerRadius * 1.08;
  const geometry = new THREE.PlaneGeometry(extent * 2, extent * 2, 1, 1);

  const makeLayer = ({
    color,
    opacity,
    scale,
    y,
    renderOrder,
  }: {
    color: string;
    opacity: number;
    scale: number;
    y: number;
    renderOrder: number;
  }) => {
    const material = markDisposableMaterial(
      new THREE.MeshBasicMaterial({
        map: texture,
        color: new THREE.Color(color),
        transparent: true,
        opacity,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = y;
    mesh.scale.setScalar(scale);
    mesh.renderOrder = renderOrder;
    return mesh;
  };

  const layerA = makeLayer({
    color: '#6bd2ff',
    opacity: 0.18,
    scale: 1.05,
    y: -outerRadius * 0.065,
    renderOrder: -2,
  });
  const layerB = makeLayer({
    color: '#d08bff',
    opacity: 0.12,
    scale: 1.12,
    y: -outerRadius * 0.07 - 6,
    renderOrder: -3,
  });
  root.add(layerA, layerB);

  group.add(root);

  const layerAMat = layerA.material as THREE.MeshBasicMaterial;
  const layerBMat = layerB.material as THREE.MeshBasicMaterial;
  const base = {
    a: layerAMat.opacity,
    b: layerBMat.opacity,
  };

  return {
    update: (elapsed: number, zoomFactor = 1) => {
      const visibility = clamp(0.22 + zoomFactor * 0.78, 0, 1);
      layerAMat.opacity = clamp(
        (base.a + Math.sin(elapsed * 0.06) * 0.025) * visibility,
        0,
        1,
      );
      layerBMat.opacity = clamp(
        (base.b + Math.sin(elapsed * 0.05 + 1.8) * 0.02) * visibility,
        0,
        1,
      );
    },
  };
};

