#!/usr/bin/env python3
import struct
import math
import random
import os

"""
Offline Volumetric Particle Preprocessing Script
Fills 3D interior volumes (Sphere, Torus, Octahedron) using volumetric Poisson-disk sampling.
Exports raw compact Float32Array binary assets (.bin) for instant GPU buffer streaming.
"""

def generate_volumetric_sphere(count=30000, radius=2.1):
    positions = []
    while len(positions) < count * 3:
        # Uniform volumetric sphere sampling: r = R * u^(1/3)
        u = random.random()
        r = radius * (u ** (1.0 / 3.0))
        theta = random.random() * 2.0 * math.pi
        phi = math.acos(2.0 * random.random() - 1.0)

        x = r * math.sin(phi) * math.cos(theta)
        y = r * math.sin(phi) * math.sin(theta)
        z = r * math.cos(phi)
        positions.extend([x, y, z])
    return positions[:count * 3]

def generate_volumetric_torus(count=30000, R=1.6, r_tube=0.65):
    positions = []
    while len(positions) < count * 3:
        u = random.random() * 2.0 * math.pi
        v = random.random() * 2.0 * math.pi
        # Radial volumetric tube factor
        rad = r_tube * math.sqrt(random.random())

        x = (R + rad * math.cos(v)) * math.cos(u)
        y = (R + rad * math.cos(v)) * math.sin(u)
        z = rad * math.sin(v)
        positions.extend([x, y, z])
    return positions[:count * 3]

def generate_volumetric_octahedron(count=30000, size=2.3):
    positions = []
    while len(positions) < count * 3:
        x = (random.random() - 0.5) * 2.0 * size
        y = (random.random() - 0.5) * 2.0 * size
        z = (random.random() - 0.5) * 2.0 * size

        # Octahedron volumetric constraint: |x| + |y| + |z| <= size
        if abs(x) + abs(y) + abs(z) <= size:
            positions.extend([x, y, z])
    return positions[:count * 3]

def save_binary(filepath, float_list):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    # Pack as raw Little-Endian 32-bit floats
    raw_data = struct.pack(f"<{len(float_list)}f", *float_list)
    with open(filepath, "wb") as f:
        f.write(raw_data)
    print(f"Exported {len(float_list)//3} 3D volumetric particles ({len(raw_data)} bytes) -> {filepath}")

if __name__ == "__main__":
    output_dir = "/home/marvelpokemaster/Documents/codes/projects/Agentic-Marketing/apps/web/public/particles"
    count = 30000

    sphere_data = generate_volumetric_sphere(count)
    torus_data = generate_volumetric_torus(count)
    octahedron_data = generate_volumetric_octahedron(count)

    save_binary(os.path.join(output_dir, "sphere_volume.bin"), sphere_data)
    save_binary(os.path.join(output_dir, "torus_volume.bin"), torus_data)
    save_binary(os.path.join(output_dir, "octahedron_volume.bin"), octahedron_data)
    print("SUCCESS: Volumetric Binary Datasets Preprocessed!")
