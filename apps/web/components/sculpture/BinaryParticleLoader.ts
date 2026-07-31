export interface VolumetricParticleBufferData {
  count: number;
  posSphere: Float32Array;
  posTorus: Float32Array;
  posOctahedron: Float32Array;
  params: Float32Array; // [scale, phase, speed]
}

/**
 * Loads compact binary Float32Array particle datasets (.bin) directly into GPU-ready ArrayBuffers.
 */
export async function loadVolumetricParticleDatasets(
  count: number = 30000
): Promise<VolumetricParticleBufferData> {
  const fetchBinary = async (path: string): Promise<Float32Array> => {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = await res.arrayBuffer();
      return new Float32Array(buffer);
    } catch (err) {
      console.warn(`[BinaryParticleLoader] Failed to fetch ${path}, generating procedural volume fallback:`, err);
      return generateProceduralVolumeFallback(count, path.includes("sphere") ? "sphere" : path.includes("torus") ? "torus" : "octahedron");
    }
  };

  const [posSphere, posTorus, posOctahedron] = await Promise.all([
    fetchBinary("/particles/sphere_volume.bin"),
    fetchBinary("/particles/torus_volume.bin"),
    fetchBinary("/particles/octahedron_volume.bin"),
  ]);

  const actualCount = Math.min(
    count,
    Math.floor(posSphere.length / 3),
    Math.floor(posTorus.length / 3),
    Math.floor(posOctahedron.length / 3)
  );

  // Generate Instance Shader Parameters Attribute [scale, phase, speed]
  const params = new Float32Array(actualCount * 3);
  for (let i = 0; i < actualCount; i++) {
    params[i * 3 + 0] = 0.7 + Math.random() * 0.6; // Scale
    params[i * 3 + 1] = Math.random() * Math.PI * 2; // Phase
    params[i * 3 + 2] = 0.5 + Math.random() * 1.2; // Speed
  }

  return {
    count: actualCount,
    posSphere: posSphere.subarray(0, actualCount * 3),
    posTorus: posTorus.subarray(0, actualCount * 3),
    posOctahedron: posOctahedron.subarray(0, actualCount * 3),
    params,
  };
}

/**
 * Procedural Fallback Generator (Used if binary assets are unavailable during initial SSR/local load)
 */
function generateProceduralVolumeFallback(count: number, type: "sphere" | "torus" | "octahedron"): Float32Array {
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    if (type === "sphere") {
      const r = 2.1 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.sin(phi) * Math.sin(theta);
      z = r * Math.cos(phi);
    } else if (type === "torus") {
      const R = 1.6, r_tube = 0.55 * Math.sqrt(Math.random());
      const u = Math.random() * 2 * Math.PI;
      const v = Math.random() * 2 * Math.PI;
      x = (R + r_tube * Math.cos(v)) * Math.cos(u);
      y = (R + r_tube * Math.cos(v)) * Math.sin(u);
      z = r_tube * Math.sin(v);
    } else {
      x = (Math.random() - 0.5) * 4.2;
      y = (Math.random() - 0.5) * 4.2;
      z = (Math.random() - 0.5) * 4.2;
    }
    data[i * 3 + 0] = x;
    data[i * 3 + 1] = y;
    data[i * 3 + 2] = z;
  }
  return data;
}
