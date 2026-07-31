import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

export interface GPUSculptureBufferData {
  count: number;
  posSphere: Float32Array;      // [count * 3]
  posTorus: Float32Array;       // [count * 3]
  posOctahedron: Float32Array;  // [count * 3]
  params: Float32Array;         // [count * 3] (scale, phase, speed)
}

/**
 * Samples geometries using MeshSurfaceSampler and generates packed Float32Array GPU attributes
 */
export function generateGPUSculptureBuffers(count: number = 40000): GPUSculptureBufferData {
  // 1. Base Geometries for Surface Sampling
  const sphereGeo = new THREE.IcosahedronGeometry(1.6, 4);
  const torusGeo = new THREE.TorusKnotGeometry(1.2, 0.45, 128, 32);
  const octahedronGeo = new THREE.OctahedronGeometry(1.8, 3);

  const dummyMat = new THREE.MeshBasicMaterial();

  const samplePositions = (geo: THREE.BufferGeometry): Float32Array => {
    const mesh = new THREE.Mesh(geo, dummyMat);
    const sampler = new MeshSurfaceSampler(mesh).build();

    const positions = new Float32Array(count * 3);
    const tempPos = new THREE.Vector3();
    const tempNormal = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      sampler.sample(tempPos, tempNormal);
      positions[i * 3 + 0] = tempPos.x;
      positions[i * 3 + 1] = tempPos.y;
      positions[i * 3 + 2] = tempPos.z;
    }

    geo.dispose();
    return positions;
  };

  const posSphere = samplePositions(sphereGeo);
  const posTorus = samplePositions(torusGeo);
  const posOctahedron = samplePositions(octahedronGeo);
  dummyMat.dispose();

  // 2. Packed Instance Parameters Attribute [scale, phase, speed]
  const params = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    params[i * 3 + 0] = 0.6 + Math.random() * 0.8; // scale
    params[i * 3 + 1] = Math.random() * Math.PI * 2; // phase
    params[i * 3 + 2] = 0.5 + Math.random() * 1.2; // speed
  }

  return {
    count,
    posSphere,
    posTorus,
    posOctahedron,
    params,
  };
}
