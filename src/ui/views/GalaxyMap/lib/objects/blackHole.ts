import * as THREE from 'three';

const BLACK_HOLE_RADIUS = 12.0;
const DISK_INNER_RADIUS = BLACK_HOLE_RADIUS + 1.0;
const DISK_OUTER_RADIUS = 50.0;
const DISK_TILT = -Math.PI / 2 + Math.PI / 8; // mostly flat on XZ with slight tilt

const eventHorizonVertex = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const eventHorizonFragment = `
  uniform float uTime;
  uniform vec3 uCameraPosition;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 viewDirection = normalize(uCameraPosition - vPosition);
    float fresnel = 1.0 - abs(dot(vNormal, viewDirection));
    fresnel = pow(fresnel, 2.5);
    vec3 glowColor = vec3(1.0, 0.5, 0.1);
    float pulse = sin(uTime * 2.0) * 0.12 + 0.88;
    float alpha = fresnel * 0.35;
    gl_FragColor = vec4(glowColor * fresnel * pulse, alpha);
  }
`;

const diskVertex = `
  varying vec2 vUv;
  varying float vRadius;
  varying float vAngle;
  void main() {
    vUv = uv;
    vRadius = length(position.xy);
    vAngle = atan(position.y, position.x);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const diskFragment = `
  uniform float uTime;
  uniform vec3 uColorHot;
  uniform vec3 uColorMid1;
  uniform vec3 uColorMid2;
  uniform vec3 uColorMid3;
  uniform vec3 uColorOuter;
  uniform float uNoiseScale;
  uniform float uFlowSpeed;
  uniform float uDensity;

  varying vec2 vUv;
  varying float vRadius;
  varying float vAngle;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    float normalizedRadius = smoothstep(${DISK_INNER_RADIUS.toFixed(2)}, ${DISK_OUTER_RADIUS.toFixed(2)}, vRadius);

    float spiral = vAngle * 3.0 - (1.0 / (normalizedRadius + 0.1)) * 2.0;
    vec2 noiseUv = vec2(vUv.x + uTime * uFlowSpeed * (2.0 / (vRadius * 0.3 + 1.0)) + sin(spiral) * 0.1, vUv.y * 0.8 + cos(spiral) * 0.1);
    float noiseVal1 = snoise(vec3(noiseUv * uNoiseScale, uTime * 0.15));
    float noiseVal2 = snoise(vec3(noiseUv * uNoiseScale * 3.0 + 0.8, uTime * 0.22));
    float noiseVal3 = snoise(vec3(noiseUv * uNoiseScale * 6.0 + 1.5, uTime * 0.3));
    float noiseVal = (noiseVal1 * 0.45 + noiseVal2 * 0.35 + noiseVal3 * 0.2);
    noiseVal = (noiseVal + 1.0) * 0.5;

    vec3 color = uColorOuter;
    color = mix(color, uColorMid3, smoothstep(0.0, 0.25, normalizedRadius));
    color = mix(color, uColorMid2, smoothstep(0.2, 0.55, normalizedRadius));
    color = mix(color, uColorMid1, smoothstep(0.5, 0.75, normalizedRadius));
    color = mix(color, uColorHot, smoothstep(0.7, 0.95, normalizedRadius));

    color *= (0.5 + noiseVal * 1.0);
    float brightness = pow(1.0 - normalizedRadius, 1.0) * 3.5 + 0.5;
    brightness *= (0.3 + noiseVal * 2.2);

    float pulse = sin(uTime * 1.8 + normalizedRadius * 12.0 + vAngle * 2.0) * 0.15 + 0.85;
    brightness *= pulse;

    float alpha = uDensity * (0.2 + noiseVal * 0.9);
    alpha *= smoothstep(0.0, 0.15, normalizedRadius);
    alpha *= (1.0 - smoothstep(0.85, 1.0, normalizedRadius));
    alpha = clamp(alpha, 0.0, 1.0);

    gl_FragColor = vec4(color * brightness, alpha);
  }
`;

export const createBlackHole = () => {
  const group = new THREE.Group();
  group.name = 'blackHole';

  const shaderMaterials: THREE.ShaderMaterial[] = [];

  // Event horizon glow (backside fresnel)
  const horizonGlow = new THREE.Mesh(
    new THREE.SphereGeometry(BLACK_HOLE_RADIUS * 1.05, 96, 64),
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraPosition: { value: new THREE.Vector3() },
      },
      vertexShader: eventHorizonVertex,
      fragmentShader: eventHorizonFragment,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  shaderMaterials.push(horizonGlow.material as THREE.ShaderMaterial);
  group.add(horizonGlow);

  // Black core
  const blackCore = new THREE.Mesh(
    new THREE.SphereGeometry(BLACK_HOLE_RADIUS, 96, 64),
    new THREE.MeshBasicMaterial({ color: 0x000000, depthWrite: true }),
  );
  blackCore.renderOrder = 0;
  group.add(blackCore);

  // Accretion disk
  const disk = new THREE.Mesh(
    new THREE.RingGeometry(DISK_INNER_RADIUS, DISK_OUTER_RADIUS, 256, 64),
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColorHot: { value: new THREE.Color(0xffffff) },
        uColorMid1: { value: new THREE.Color(0xff7733) },
        uColorMid2: { value: new THREE.Color(0xff4477) },
        uColorMid3: { value: new THREE.Color(0x7744ff) },
        uColorOuter: { value: new THREE.Color(0x4477ff) },
        uNoiseScale: { value: 2.5 },
        uFlowSpeed: { value: 0.22 },
        uDensity: { value: 1.2 },
      },
      vertexShader: diskVertex,
      fragmentShader: diskFragment,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  shaderMaterials.push(disk.material as THREE.ShaderMaterial);
  disk.rotation.x = DISK_TILT;
  disk.renderOrder = 1;
  group.add(disk);

  group.userData.shaderMaterials = shaderMaterials;
  return group;
};
