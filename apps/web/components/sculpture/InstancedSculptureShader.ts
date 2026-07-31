import * as THREE from "three";

export const VolumetricSculptureShader = {
  uniforms: {
    uTime: { value: 0 },
    uMorphProgress: { value: 0 }, // 0 = Sphere, 1 = Torus, 2 = Octahedron
    uCursor: { value: new THREE.Vector3(999, 999, 999) },
    uColor: { value: new THREE.Color("#0066ff") },
    uCoreColor: { value: new THREE.Color("#38bdf8") },
    uRoughness: { value: 0.15 },
    uMetalness: { value: 0.8 },
  },

  vertexShader: /* glsl */ `
    attribute vec3 aPosSphere;
    attribute vec3 aPosTorus;
    attribute vec3 aPosOctahedron;
    attribute vec3 aParams; // x: scale, y: phase, z: speed

    uniform float uTime;
    uniform float uMorphProgress;
    uniform vec3 uCursor;

    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vDistanceToCursor;

    void main() {
      // 1. Calculate Morphed Base Position
      float p = clamp(uMorphProgress, 0.0, 2.0);
      vec3 basePos;
      if (p <= 1.0) {
        basePos = mix(aPosSphere, aPosTorus, p);
      } else {
        basePos = mix(aPosTorus, aPosOctahedron, p - 1.0);
      }

      // 2. Organic Simplex/Sine Noise Breathing Motion
      float scale = aParams.x;
      float phase = aParams.y;
      float speed = aParams.z;

      vec3 breath;
      breath.x = sin(uTime * speed + phase) * 0.05;
      breath.y = cos(uTime * speed * 1.2 + phase) * 0.05;
      breath.z = sin(uTime * speed * 0.8 + phase) * 0.05;

      vec3 targetPos = basePos + breath;

      // 3. GPU 3D Cursor Repulsion with Smoothstep Falloff
      vec3 diff = targetPos - uCursor;
      float dist = length(diff);
      float repulsionRadius = 2.2;
      float repulsionStrength = 2.5;

      vec3 displacedPos = targetPos;
      if (dist < repulsionRadius && dist > 0.001) {
        float falloff = smoothstep(repulsionRadius, 0.0, dist);
        displacedPos += normalize(diff) * falloff * falloff * repulsionStrength;
      }

      vDistanceToCursor = dist;

      // 4. Transform Local Geometry Position per Instance (Scale increased to 0.038)
      vec3 instanceLocalPos = position * (scale * 0.038) + displacedPos;

      // Calculate World & Screen Position
      vec4 worldPosition = modelMatrix * vec4(instanceLocalPos, 1.0);
      vWorldPosition = worldPosition.xyz;

      // Transform Normal
      vNormal = normalize(mat3(modelMatrix) * normal);

      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,

  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform vec3 uCoreColor;
    uniform float uRoughness;
    uniform float uMetalness;

    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying float vDistanceToCursor;

    void main() {
      vec3 N = normalize(vNormal);
      vec3 L = normalize(vec3(5.0, 8.0, 6.0)); // Studio Key Light
      vec3 V = normalize(cameraPosition - vWorldPosition);
      vec3 H = normalize(L + V);

      // Diffuse Lighting
      float NdotL = max(dot(N, L), 0.0);
      vec3 diffuse = uColor * (0.35 + 0.65 * NdotL);

      // Specular Highlight (Blinn-Phong)
      float NdotH = max(dot(N, H), 0.0);
      float spec = pow(NdotH, 32.0 * (1.0 - uRoughness));
      vec3 specular = vec3(1.0) * spec * uMetalness;

      // Fresnel Rim Highlight
      float fresnel = pow(1.0 - max(dot(V, N), 0.0), 3.0);
      vec3 rim = uCoreColor * fresnel * 0.6;

      // Cursor Proximity Highlight Glow
      float cursorGlow = smoothstep(1.8, 0.0, vDistanceToCursor) * 0.45;
      vec3 finalColor = diffuse + specular + rim + uCoreColor * cursorGlow;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};
