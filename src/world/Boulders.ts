import * as THREE from 'three';

export interface BoulderConfig {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotation: THREE.Euler;
}

export class Boulders {
  public readonly group: THREE.Group;
  private rockMaterial: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'BouldersGroup';

    // Stylized Anime Granite & Sandstone Material
    // Sunlit facets catch warm golden buff, shadowed facets reflect soft mossy slate
    this.rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x9a9588,
      roughness: 0.82,
      metalness: 0.04,
      flatShading: true,
    });

    this.createBoulders();
  }

  private createRockGeometry(seed: number): THREE.BufferGeometry {
    const geo = new THREE.IcosahedronGeometry(1.0, 1);
    const pos = geo.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      vertex.y *= 0.88;

      const noise =
        Math.sin(vertex.x * 3.2 + seed) * 0.16 +
        Math.cos(vertex.z * 3.0 + seed * 1.4) * 0.14 +
        Math.sin(vertex.y * 3.8) * 0.08;
      vertex.multiplyScalar(1.0 + noise);

      if (vertex.y < -0.3) {
        vertex.y *= 0.55;
      }

      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geo.computeVertexNormals();
    return geo;
  }

  private createBoulders(): void {
    // Uncluttered, iconic placements directly derived from Reference.png:
    const boulderConfigs: BoulderConfig[] = [
      // 1. Massive Left Shore Guardian Boulder (iconic anchor on grassy riverbank)
      {
        position: new THREE.Vector3(-18.0, 2.2, 0.0),
        scale: new THREE.Vector3(8.5, 7.5, 7.2),
        rotation: new THREE.Euler(0.08, 0.55, 0.05),
      },

      // 2. Mid-stream Rapids Island Boulders (giving space for the grand pool to breathe)
      {
        position: new THREE.Vector3(3.5, 1.8, -4.0),
        scale: new THREE.Vector3(5.2, 4.4, 4.6),
        rotation: new THREE.Euler(0.12, 0.8, -0.06),
      },
      {
        position: new THREE.Vector3(-4.0, 1.2, 6.0),
        scale: new THREE.Vector3(4.4, 3.8, 4.0),
        rotation: new THREE.Euler(-0.08, 1.3, 0.1),
      },

      // 3. Right Bank Stepped Outcrops (granite bluffs meeting water)
      {
        position: new THREE.Vector3(18.0, 3.6, 4.0),
        scale: new THREE.Vector3(7.8, 6.5, 6.2),
        rotation: new THREE.Euler(-0.15, 0.45, 0.12),
      },
      {
        position: new THREE.Vector3(11.0, 2.0, 14.0),
        scale: new THREE.Vector3(5.8, 5.0, 4.8),
        rotation: new THREE.Euler(0.05, 1.15, -0.08),
      },

      // 4. Foreground Left Shallows Boulder (anchoring lower-left rapids)
      {
        position: new THREE.Vector3(-28.0, 0.2, 28.0),
        scale: new THREE.Vector3(6.8, 5.8, 6.2),
        rotation: new THREE.Euler(0.1, 0.9, -0.1),
      },

      // 5. Upper Sunlit Rapids Boulders (catching golden afternoon sun in top-right)
      {
        position: new THREE.Vector3(26.0, 4.8, -24.0),
        scale: new THREE.Vector3(5.6, 4.8, 5.0),
        rotation: new THREE.Euler(0.1, 0.7, 0.0),
      },
      {
        position: new THREE.Vector3(38.0, 6.4, -34.0),
        scale: new THREE.Vector3(6.4, 5.5, 5.8),
        rotation: new THREE.Euler(-0.1, 0.4, 0.1),
      },
    ];

    boulderConfigs.forEach((cfg, idx) => {
      const geo = this.createRockGeometry(idx * 2.3 + 0.5);
      const mesh = new THREE.Mesh(geo, this.rockMaterial);
      mesh.position.copy(cfg.position);
      mesh.scale.copy(cfg.scale);
      mesh.rotation.copy(cfg.rotation);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    });
  }
}
