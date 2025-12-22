import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export interface BlackHoleLensingData {
  center: THREE.Vector2;
  radius: number;
  horizon: number;
  strength: number;
  opacity?: number;
}

export interface BlackHoleLensingPass {
  pass: ShaderPass;
  resize: (width: number, height: number) => void;
  update: (elapsed: number, data?: BlackHoleLensingData) => void;
}

const BlackHoleLensingShader = {
  uniforms: {
    tDiffuse: { value: null },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uRadius: { value: 0.08 },
    uHorizon: { value: 0.025 },
    uStrength: { value: 0.35 },
    uAspect: { value: 1 },
    uOpacity: { value: 0 },
    uTime: { value: 0 },
    uRingColor: { value: new THREE.Color('#ffd4a2') },
    uPhotonColor: { value: new THREE.Color('#fff0d8') },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;

    uniform sampler2D tDiffuse;
    uniform vec2 uCenter;
    uniform float uRadius;
    uniform float uHorizon;
    uniform float uStrength;
    uniform float uAspect;
    uniform float uOpacity;
    uniform float uTime;
    uniform vec3 uRingColor;
    uniform vec3 uPhotonColor;

    varying vec2 vUv;

    void main() {
      vec3 base = texture2D(tDiffuse, vUv).rgb;
      if (uOpacity <= 0.0 || uRadius <= 0.0) {
        gl_FragColor = vec4(base, 1.0);
        return;
      }

      vec2 aspect = vec2(uAspect, 1.0);
      vec2 offset = (vUv - uCenter) * aspect;
      float dist = length(offset);
      float radius = max(uRadius, 0.0001);
      float horizon = max(uHorizon, 0.0001);
      float norm = dist / radius;

      float lensMask = smoothstep(1.05, 0.0, norm);
      float lensPower = uStrength * lensMask * lensMask;
      vec2 warpedOffset = offset * (1.0 + lensPower * (1.0 - norm * 0.6));
      vec2 warpedUv = uCenter + warpedOffset / aspect;

      vec2 dir = dist > 0.0001 ? offset / dist : vec2(0.0, 1.0);
      float aberr = (0.002 + 0.01 * lensMask) * lensMask;
      vec2 chroma = dir * aberr / aspect;

      vec3 warped;
      warped.r = texture2D(tDiffuse, warpedUv + chroma).r;
      warped.g = texture2D(tDiffuse, warpedUv).g;
      warped.b = texture2D(tDiffuse, warpedUv - chroma).b;

      float shadow = smoothstep(horizon * 0.92, horizon * 1.05, dist);
      warped *= shadow;

      float ring = smoothstep(radius * 0.86, radius * 0.96, dist)
        * (1.0 - smoothstep(radius * 1.02, radius * 1.18, dist));
      float photon = smoothstep(horizon * 1.05, horizon * 1.2, dist)
        * (1.0 - smoothstep(horizon * 1.32, horizon * 1.55, dist));

      vec3 ringGlow = uRingColor * ring * (1.2 + 0.2 * sin(uTime * 0.9));
      vec3 photonGlow = uPhotonColor * photon * (1.4 + 0.2 * sin(uTime * 1.3));
      vec3 effect = mix(base, warped, lensMask);
      effect += ringGlow + photonGlow;

      vec3 finalColor = mix(base, effect, clamp(uOpacity, 0.0, 1.0));
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

export const createBlackHoleLensingPass = ({
  width,
  height,
}: {
  width: number;
  height: number;
}): BlackHoleLensingPass => {
  const pass = new ShaderPass(BlackHoleLensingShader);
  pass.uniforms.uAspect.value = width / Math.max(1, height);

  const resize = (nextWidth: number, nextHeight: number) => {
    pass.uniforms.uAspect.value = nextWidth / Math.max(1, nextHeight);
  };

  const update = (elapsed: number, data?: BlackHoleLensingData) => {
    pass.uniforms.uTime.value = elapsed;
    if (!data || data.radius <= 0 || data.strength <= 0) {
      pass.uniforms.uOpacity.value = 0;
      return;
    }
    pass.uniforms.uOpacity.value = data.opacity ?? 1;
    pass.uniforms.uCenter.value.copy(data.center);
    pass.uniforms.uRadius.value = data.radius;
    pass.uniforms.uHorizon.value = data.horizon;
    pass.uniforms.uStrength.value = data.strength;
  };

  return { pass, resize, update };
};
