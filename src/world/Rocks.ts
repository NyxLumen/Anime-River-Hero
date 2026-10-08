import * as THREE from 'three';
import { Terrain } from './Terrain';

export interface RockInstanceConfig {
  type: 'hero' | 'medium' | 'small';
  variant: number;
  x: number;
  z: number;
  yOffset?: number;
  scale: [number, number, number];
  rotation: [number, number, number];
  mossAmount: number;
  seed: number;
}

export class Rocks {
  public readonly group: THREE.Group;
  private material: THREE.MeshStandardMaterial;
  private terrain: Terrain;

  constructor(terrain: Terrain) {
    this.group = new THREE.Group();
    this.group.name = 'RocksGroup';
    this.terrain = terrain;

    // Stylized anime weathered granite material
    // Smooth painterly shading, soft lighting response
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.86,
      metalness: 0.02,
      flatShading: false, // Smooth weathered contours, zero faceted artifacts
    });

    this.buildRocks();
  }

  private buildRocks(): void {
    // Curated compositional placement matching Reference.png:
    const rockConfigs: RockInstanceConfig[] = [
      // ==========================================
      // 1. HERO ROCKS (3 Archetypes)
      // ==========================================
      // Hero 1: Iconic Left Shore Guardian Monolith (tall, imposing, anchored in cut-bank shelf)
      {
        type: 'hero',
        variant: 0,
        x: -18.0,
        z: 0.5,
        yOffset: 0.8,
        scale: [8.5, 7.5, 7.8],
        rotation: [0.06, 0.52, 0.04],
        mossAmount: 0.65,
        seed: 1.2,
      },
      // Hero 2: Mid-Stream Rapids Island Splitter (wide flat slab parting upper chute)
      {
        type: 'hero',
        variant: 1,
        x: 3.5,
        z: -4.0,
        yOffset: -0.2,
        scale: [5.8, 3.6, 5.0],
        rotation: [0.10, 0.75, -0.05],
        mossAmount: 0.45,
        seed: 2.5,
      },
      // Hero 3: Central Rapids Water-Worn Boulder (partially submerged, splitting pool current)
      {
        type: 'hero',
        variant: 2,
        x: -4.0,
        z: 6.0,
        yOffset: -0.3,
        scale: [4.8, 3.4, 4.2],
        rotation: [-0.06, 1.25, 0.08],
        mossAmount: 0.50,
        seed: 3.7,
      },

      // ==========================================
      // 2. MEDIUM ROCKS (5 Archetypes / 9 Placements)
      // ==========================================
      // Right Bank Granite Ledges meeting water
      {
        type: 'medium',
        variant: 0,
        x: 18.0,
        z: 4.0,
        yOffset: 0.2,
        scale: [7.2, 5.4, 5.8],
        rotation: [-0.12, 0.40, 0.10],
        mossAmount: 0.35,
        seed: 4.1,
      },
      {
        type: 'medium',
        variant: 1,
        x: 11.0,
        z: 14.0,
        yOffset: -0.1,
        scale: [5.4, 3.8, 4.4],
        rotation: [0.04, 1.10, -0.06],
        mossAmount: 0.55,
        seed: 5.3,
      },

      // Foreground Rapids Boulder (anchoring lower-left rapids)
      {
        type: 'medium',
        variant: 2,
        x: -27.0,
        z: 28.0,
        yOffset: -0.3,
        scale: [6.2, 4.6, 5.4],
        rotation: [0.08, 0.85, -0.08],
        mossAmount: 0.60,
        seed: 6.7,
      },

      // Upper Sunlit Rapids Boulders (distant headwaters)
      {
        type: 'medium',
        variant: 3,
        x: 26.0,
        z: -24.0,
        yOffset: 0.1,
        scale: [5.2, 3.8, 4.5],
        rotation: [0.08, 0.65, 0.0],
        mossAmount: 0.25,
        seed: 7.9,
      },
      {
        type: 'medium',
        variant: 4,
        x: 38.0,
        z: -34.0,
        yOffset: 0.2,
        scale: [5.8, 4.2, 4.8],
        rotation: [-0.08, 0.35, 0.08],
        mossAmount: 0.20,
        seed: 8.4,
      },

      // Left Bank Embedded Cut-Bank Rocks
      {
        type: 'medium',
        variant: 0,
        x: -14.0,
        z: -8.0,
        yOffset: 0.1,
        scale: [3.2, 2.4, 2.8],
        rotation: [0.15, 0.82, -0.05],
        mossAmount: 0.50,
        seed: 9.1,
      },
      {
        type: 'medium',
        variant: 2,
        x: -20.0,
        z: 12.0,
        yOffset: 0.0,
        scale: [3.6, 2.6, 3.2],
        rotation: [-0.10, 1.40, 0.12],
        mossAmount: 0.65,
        seed: 10.3,
      },

      // Right Bluff Ledge Rocks
      {
        type: 'medium',
        variant: 1,
        x: 22.0,
        z: -14.0,
        yOffset: 0.3,
        scale: [4.0, 2.8, 3.4],
        rotation: [0.20, -0.45, 0.10],
        mossAmount: 0.30,
        seed: 11.6,
      },
      {
        type: 'medium',
        variant: 3,
        x: 16.0,
        z: 10.0,
        yOffset: 0.1,
        scale: [3.4, 2.5, 3.0],
        rotation: [-0.05, 0.70, -0.10],
        mossAmount: 0.45,
        seed: 12.8,
      },

      // ==========================================
      // 3. SMALL ROCKS & COMPANION STONES (~18 Placements)
      // ==========================================
      // Companion clusters around Guardian Monolith
      {
        type: 'small',
        variant: 0,
        x: -15.5,
        z: 3.2,
        yOffset: 0.0,
        scale: [2.2, 1.6, 2.0],
        rotation: [0.1, 0.4, 0.1],
        mossAmount: 0.70,
        seed: 13.2,
      },
      {
        type: 'small',
        variant: 1,
        x: -20.5,
        z: -2.0,
        yOffset: 0.1,
        scale: [1.8, 1.3, 1.6],
        rotation: [-0.2, 1.1, 0.0],
        mossAmount: 0.60,
        seed: 14.5,
      },

      // Companion stones around Rapids Island Splitter
      {
        type: 'small',
        variant: 2,
        x: 1.2,
        z: -5.8,
        yOffset: -0.2,
        scale: [2.0, 1.4, 1.8],
        rotation: [0.05, 0.9, -0.1],
        mossAmount: 0.40,
        seed: 15.7,
      },
      {
        type: 'small',
        variant: 3,
        x: 5.8,
        z: -2.2,
        yOffset: -0.1,
        scale: [1.6, 1.2, 1.5],
        rotation: [-0.1, 0.3, 0.2],
        mossAmount: 0.35,
        seed: 16.1,
      },

      // Companion stones around Central Boulder
      {
        type: 'small',
        variant: 4,
        x: -6.5,
        z: 4.2,
        yOffset: -0.2,
        scale: [1.9, 1.3, 1.7],
        rotation: [0.15, 1.6, -0.05],
        mossAmount: 0.55,
        seed: 17.4,
      },

      // Left Shore Shallows Stepping/Shoreline Stones
      {
        type: 'small',
        variant: 5,
        x: -12.0,
        z: 2.0,
        yOffset: -0.1,
        scale: [2.1, 1.4, 1.9],
        rotation: [0.0, 0.5, 0.1],
        mossAmount: 0.65,
        seed: 18.2,
      },
      {
        type: 'small',
        variant: 6,
        x: -10.5,
        z: 7.5,
        yOffset: -0.2,
        scale: [1.7, 1.2, 1.5],
        rotation: [0.2, -0.8, 0.1],
        mossAmount: 0.50,
        seed: 19.8,
      },
      {
        type: 'small',
        variant: 7,
        x: -23.0,
        z: 19.0,
        yOffset: -0.2,
        scale: [2.4, 1.7, 2.2],
        rotation: [-0.1, 1.2, 0.0],
        mossAmount: 0.55,
        seed: 20.3,
      },
      {
        type: 'small',
        variant: 0,
        x: -24.5,
        z: 23.5,
        yOffset: -0.2,
        scale: [1.8, 1.3, 1.7],
        rotation: [0.1, 0.2, -0.1],
        mossAmount: 0.60,
        seed: 21.7,
      },

      // Right Shore Shallows Stones
      {
        type: 'small',
        variant: 1,
        x: 8.5,
        z: 9.5,
        yOffset: -0.1,
        scale: [2.0, 1.4, 1.8],
        rotation: [-0.1, 0.6, 0.2],
        mossAmount: 0.45,
        seed: 22.1,
      },
      {
        type: 'small',
        variant: 2,
        x: 14.5,
        z: 6.8,
        yOffset: 0.0,
        scale: [1.9, 1.3, 1.6],
        rotation: [0.15, -0.4, 0.0],
        mossAmount: 0.40,
        seed: 23.9,
      },
      {
        type: 'small',
        variant: 3,
        x: 21.0,
        z: -7.5,
        yOffset: 0.1,
        scale: [1.7, 1.2, 1.5],
        rotation: [0.05, 1.1, -0.1],
        mossAmount: 0.35,
        seed: 24.4,
      },

      // Meadow Trail Stones
      {
        type: 'small',
        variant: 4,
        x: -16.5,
        z: -12.5,
        yOffset: 0.05,
        scale: [1.4, 0.9, 1.3],
        rotation: [0.1, 0.8, 0.0],
        mossAmount: 0.40,
        seed: 25.6,
      },
      {
        type: 'small',
        variant: 5,
        x: -14.0,
        z: -3.5,
        yOffset: 0.05,
        scale: [1.5, 1.0, 1.4],
        rotation: [-0.1, 0.3, 0.1],
        mossAmount: 0.45,
        seed: 26.2,
      },
      {
        type: 'small',
        variant: 6,
        x: -18.5,
        z: 7.0,
        yOffset: 0.05,
        scale: [1.6, 1.1, 1.5],
        rotation: [0.2, 1.4, -0.05],
        mossAmount: 0.50,
        seed: 27.8,
      },
    ];

    rockConfigs.forEach((cfg) => {
      let geo: THREE.BufferGeometry;

      if (cfg.type === 'hero') {
        geo = this.createHeroRockGeometry(cfg.variant, cfg.seed, cfg.mossAmount);
      } else if (cfg.type === 'medium') {
        geo = this.createMediumRockGeometry(cfg.variant, cfg.seed, cfg.mossAmount);
      } else {
        geo = this.createSmallRockGeometry(cfg.variant, cfg.seed, cfg.mossAmount);
      }

      const mesh = new THREE.Mesh(geo, this.material);

      // Anchor to terrain height cleanly
      const tInfo = this.terrain.getHeightAt(cfg.x, cfg.z);
      const groundY = tInfo.y + (cfg.yOffset ?? 0);

      mesh.position.set(cfg.x, groundY, cfg.z);
      mesh.scale.set(...cfg.scale);
      mesh.rotation.set(...cfg.rotation);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      this.group.add(mesh);
    });
  }

  /**
   * Generates continuous, smooth organic weathered rock geometry using spherical harmonics.
   * Eliminates all vertex tearing, pole starbursts, and low-poly facets.
   */
  private generateSmoothWeatheredGeometry(
    baseRadius: number,
    aspectY: number,
    aspectXZ: number,
    seed: number,
    mossAmount: number,
    angularity: number = 0.12
  ): THREE.BufferGeometry {
    // 20 x 16 segments produces smooth continuous curvature without heavy vertex overhead
    const geo = new THREE.SphereGeometry(baseRadius, 20, 16);
    const pos = geo.attributes.position;
    const vertexCount = pos.count;
    const vertex = new THREE.Vector3();
    const colors = new Float32Array(vertexCount * 3);

    const colSunBuff = new THREE.Color(0xb6aba0);     // Warm sunlit granite / buff
    const colMossTop = new THREE.Color(0x6b824b);     // Soft moss cap on top
    const colSlateShadow = new THREE.Color(0x525c58); // Cool shaded slate
    const colWaterline = new THREE.Color(0x383e3a);   // Dark wet stone near waterline

    const sunDir = new THREE.Vector3(38, 50, -38).normalize();
    const tempColor = new THREE.Color();

    for (let i = 0; i < vertexCount; i++) {
      vertex.fromBufferAttribute(pos, i);

      // Proportional shaping
      vertex.y *= aspectY;
      vertex.x *= aspectXZ;
      vertex.z *= aspectXZ;

      // Smooth organic harmonic displacement (spatial coherence prevents tearing)
      const angle = Math.atan2(vertex.z, vertex.x);
      const horizontalNoise =
        Math.sin(angle * 2.0 + seed) * angularity +
        Math.cos(angle * 3.0 + seed * 1.5) * (angularity * 0.7);

      vertex.x *= 1.0 + horizontalNoise;
      vertex.z *= 1.0 + horizontalNoise;

      // Subtle vertical organic distortion
      vertex.y += Math.sin(vertex.x * 2.2 + vertex.z * 2.2 + seed) * 0.08 * baseRadius;

      // Flatten base so stone embeds solidly into riverbed or terrain
      if (vertex.y < -0.10 * baseRadius) {
        vertex.y *= 0.55;
      }

      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geo.computeVertexNormals();
    const normAttr = geo.attributes.normal;
    const norm = new THREE.Vector3();

    // Compute painterly vertex colors (moss, sunlit face, shadow, waterline)
    for (let i = 0; i < vertexCount; i++) {
      vertex.fromBufferAttribute(pos, i);
      norm.fromBufferAttribute(normAttr, i);

      const sunFactor = norm.dot(sunDir);
      const isTop = norm.y > 0.45;

      // Soft sunlit vs shadow gradient
      tempColor.copy(colSlateShadow).lerp(colSunBuff, THREE.MathUtils.clamp((sunFactor + 0.25) * 0.78, 0, 1));

      // Moss cap on upward-facing surfaces
      if (isTop && mossAmount > 0) {
        const mossBlend = THREE.MathUtils.clamp((norm.y - 0.45) / 0.45, 0, 1) * mossAmount;
        tempColor.lerp(colMossTop, mossBlend * 0.70);
      }

      // Dark wet waterline near stone base
      if (vertex.y < 0.12 * baseRadius) {
        const wetBlend = THREE.MathUtils.clamp((0.12 * baseRadius - vertex.y) / (0.45 * baseRadius), 0, 1);
        tempColor.lerp(colWaterline, wetBlend * 0.85);
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }

  private createHeroRockGeometry(variant: number, seed: number, moss: number): THREE.BufferGeometry {
    if (variant === 0) {
      // Tall monolith - narrow and tall, slightly asymmetrical weathered top
      return this.generateSmoothWeatheredGeometry(1.0, 1.25, 0.92, seed, moss, 0.14);
    } else if (variant === 1) {
      // Wide flat rapids slab - broad water-worn platform
      return this.generateSmoothWeatheredGeometry(1.0, 0.65, 1.28, seed, moss, 0.16);
    } else {
      // Angular crag boulder - weathered river stone
      return this.generateSmoothWeatheredGeometry(1.0, 0.85, 1.05, seed, moss, 0.18);
    }
  }

  private createMediumRockGeometry(variant: number, seed: number, moss: number): THREE.BufferGeometry {
    const aspectYConfigs = [0.80, 0.70, 0.60, 0.90, 0.75];
    const aspectXZConfigs = [1.05, 1.20, 1.15, 0.95, 1.10];
    const idx = Math.abs(variant) % 5;
    return this.generateSmoothWeatheredGeometry(
      1.0,
      aspectYConfigs[idx],
      aspectXZConfigs[idx],
      seed,
      moss,
      0.15
    );
  }

  private createSmallRockGeometry(variant: number, seed: number, moss: number): THREE.BufferGeometry {
    const aspectYConfigs = [0.70, 0.55, 0.80, 0.65, 0.75, 0.60, 0.85, 0.70];
    const aspectXZConfigs = [1.10, 1.25, 0.95, 1.15, 1.05, 1.20, 1.00, 1.10];
    const idx = Math.abs(variant) % 8;
    return this.generateSmoothWeatheredGeometry(
      1.0,
      aspectYConfigs[idx],
      aspectXZConfigs[idx],
      seed,
      moss,
      0.14
    );
  }
}
