import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

export interface SampledShapeData {
  positions: Float32Array; // [COUNT * 3]
  normals: Float32Array;   // [COUNT * 3]
}

export interface ParticleAttributeData {
  count: number;
  shapeSphere: SampledShapeData;
  shapeTorus: SampledShapeData;
  shapeOctahedron: SampledShapeData;
  scales: Float32Array;        // [COUNT]
  phases: Float32Array;        // [COUNT]
  speeds: Float32Array;        // [COUNT]
}

/**
 * Samples geometries using Three.js MeshSurfaceSampler to produce volumetric surface point clouds.
 */
export function generateSculptureSampleData(count: number = 60000): ParticleAttributeData {
  // 1. Create Base Geometries for Sampling
  const sphereGeo = new THREE.IcosahedronGeometry(1.6, 5);
  const torusGeo = new THREE.TorusKnotGeometry(1.2, 0.45, 128, 32);
  const octahedronGeo = new THREE.OctahedronGeometry(1.8, 4);

  // Material dummy for Mesh instantiation
  const dummyMat = new THREE.MeshBasicMaterial();

  const sampleMesh = (geo: THREE.BufferGeometry): SampledShapeData => {
    const mesh = new THREE.Mesh(geo, dummyMat);
    const sampler = new MeshSurfaceSampler(mesh).build();

    const positions = new Float32Array(count * 3);
    const normals = new Float32Array(count * 3);

    const tempPos = new THREE.Vector3();
    const tempNormal = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      sampler.sample(tempPos, tempNormal);
      positions[i * 3 + 0] = tempPos.x;
      positions[i * 3 + 1] = tempPos.y;
      positions[i * 3 + 2] = tempPos.z;

      normals[i * 3 + 0] = tempNormal.x;
      normals[i * 3 + 1] = tempNormal.y;
      normals[i * 3 + 2] = tempNormal.z;
    }

    // Clean up temporary geometry
    geo.dispose();
    return { positions, normals };
  };

  const shapeSphere = sampleMesh(sphereGeo);
  const shapeTorus = sampleMesh(torusGeo);
  const shapeOctahedron = sampleMesh(octahedronGeo);
  dummyMat.dispose();

  // 2. Generate Random Instance Attributes (Scales, Phases, Speeds)
  const scales = new Float32Array(count);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Randomized sphere instance sizes (0.6x to 1.4x base radius)
    scales[i] = 0.6 + Math.random() * 0.8;
    // Random noise phase offset
    phases[i] = Math.random() * Math.PI * 2;
    // Movement speed multiplier
    speeds[i] = 0.5 + Math.random() * 1.2;
  }

  return {
    count,
    shapeSphere,
    shapeTorus,
    shapeOctahedron,
    scales,
    phases,
    speeds,
  };
}
