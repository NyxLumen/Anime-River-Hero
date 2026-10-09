import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Terrain } from './Terrain';
import { HeroRock } from './HeroRock';

export type RockMaterialFamily = 'warmGranite' | 'coolSlate' | 'paleRiverStone' | 'mossStone' | 'wetRiverRock';

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
  family?: RockMaterialFamily;
}

export class Rocks {
  public readonly group: THREE.Group;
  private materials: Record<RockMaterialFamily, THREE.MeshStandardMaterial>;
  private terrain: Terrain;

  constructor(terrain: Terrain) {
    this.group = new THREE.Group();
    this.group.name = 'RocksGroup';
    this.terrain = terrain;

    // 5 Distinct Painterly Anime Rock Material Families with Smooth Shading
    this.materials = {
      warmGranite: new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.82,
        metalness: 0.02,
        flatShading: false,
      }),
      coolSlate: new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.74,
        metalness: 0.04,
        flatShading: false,
      }),
      paleRiverStone: new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.78,
        metalness: 0.02,
        flatShading: false,
      }),
      mossStone: new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.88,
        metalness: 0.01,
        flatShading: false,
      }),
      wetRiverRock: new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.50, // Noticeably wetter, glistening surface sheen
        metalness: 0.08,
        flatShading: false,
      }),
    };

    this.buildRocks();
  }

  private buildRocks(): void {
    // Curated compositional placement matching Reference.png:
    const rockConfigs: RockInstanceConfig[] = [
      // ==========================================
      // 1. HERO ROCKS (3 Archetypes)
      // ==========================================
      // Hero 1: Iconic Left Shore Guardian Monolith (commanding warm granite monolith on left shoreline)
      {
        type: 'hero',
        family: 'warmGranite',
        variant: 0,
        x: -14.5,
        z: -3.8,
        yOffset: -0.15,
        scale: [4.8, 5.6, 4.2],
        rotation: [0.06, 0.45, 0.02],
        mossAmount: 0.65,
        seed: 1.2,
      },
      // Hero 2: Mid-Stream Rapids Island Splitter (chiseled rapids slab with velvet moss shelf parting chute)
      {
        type: 'hero',
        family: 'warmGranite',
        variant: 1,
        x: 3.5,
        z: -5.5,
        yOffset: 0.0,
        scale: [5.8, 3.8, 4.8],
        rotation: [0.08, 0.65, -0.04],
        mossAmount: 0.70,
        seed: 2.5,
      },
      // Hero 3: Left Shore Shallows Stepping Slab (flat granite river slab jutting into clear turquoise shallows)
      {
        type: 'hero',
        family: 'paleRiverStone',
        variant: 2,
        x: -11.0,
        z: 6.5,
        yOffset: 0.0,
        scale: [3.4, 1.2, 2.8],
        rotation: [0.04, 0.35, -0.02],
        mossAmount: 0.40,
        seed: 3.7,
      },

      // ==========================================
      // 2. MEDIUM ROCKS & SHORE PROMONTORIES
      // ==========================================
      // Right Bank Granite Promontory 1 (prominent sunlit granite bluff jutting into river)
      {
        type: 'medium',
        family: 'warmGranite',
        variant: 0,
        x: 15.0,
        z: -1.0,
        yOffset: 0.20,
        scale: [6.8, 5.0, 5.5],
        rotation: [-0.10, 0.45, 0.08],
        mossAmount: 0.35,
        seed: 4.1,
      },
      // Right Bank Mid-Gorge Ledge 2
      {
        type: 'medium',
        family: 'coolSlate',
        variant: 1,
        x: 19.0,
        z: -11.0,
        yOffset: 0.25,
        scale: [6.0, 4.5, 5.2],
        rotation: [0.15, -0.40, 0.10],
        mossAmount: 0.40,
        seed: 4.8,
      },
      // Right Bank Upper Gorge Bluff 3 (breaking upper right shoreline)
      {
        type: 'medium',
        family: 'warmGranite',
        variant: 2,
        x: 25.0,
        z: -22.0,
        yOffset: 0.20,
        scale: [7.2, 5.6, 6.0],
        rotation: [0.08, 0.65, 0.0],
        mossAmount: 0.30,
        seed: 5.2,
      },
      // Right Bank Granite Ledges meeting water
      {
        type: 'medium',
        family: 'warmGranite',
        variant: 0,
        x: 18.0,
        z: 4.0,
        yOffset: 0.20,
        scale: [6.5, 4.8, 5.2],
        rotation: [-0.12, 0.40, 0.10],
        mossAmount: 0.35,
        seed: 5.7,
      },
      {
        type: 'medium',
        family: 'warmGranite',
        variant: 1,
        x: 12.0,
        z: 9.0,
        yOffset: 0.10,
        scale: [5.8, 4.0, 4.8],
        rotation: [0.04, 1.10, -0.06],
        mossAmount: 0.50,
        seed: 6.1,
      },
      {
        type: 'medium',
        family: 'warmGranite',
        variant: 2,
        x: 7.0,
        z: 18.0,
        yOffset: 0.05,
        scale: [5.2, 3.6, 4.4],
        rotation: [0.06, 0.85, -0.08],
        mossAmount: 0.45,
        seed: 6.4,
      },

      // Foreground Rapids Boulder (anchoring lower-left rapids)
      {
        type: 'medium',
        family: 'wetRiverRock',
        variant: 2,
        x: -27.0,
        z: 28.0,
        yOffset: 0.85,
        scale: [6.2, 4.6, 5.4],
        rotation: [0.08, 0.85, -0.08],
        mossAmount: 0.60,
        seed: 6.7,
      },

      // Headwaters Gorge Canyon Cliff Enclosure (framing upper right river bend)
      {
        type: 'medium',
        family: 'warmGranite',
        variant: 3,
        x: 48.0,
        z: -44.0,
        yOffset: 0.50,
        scale: [10.5, 8.5, 9.0],
        rotation: [0.05, 0.55, 0.0],
        mossAmount: 0.20,
        seed: 7.9,
      },
      {
        type: 'medium',
        family: 'warmGranite',
        variant: 4,
        x: 58.0,
        z: -58.0,
        yOffset: 0.60,
        scale: [12.0, 10.0, 10.5],
        rotation: [-0.08, 0.35, 0.08],
        mossAmount: 0.15,
        seed: 8.4,
      },

      // Left Bank Embedded Cut-Bank Rocks
      {
        type: 'medium',
        family: 'warmGranite',
        variant: 0,
        x: -16.5,
        z: -7.0,
        yOffset: 0.10,
        scale: [3.6, 2.2, 3.0],
        rotation: [0.15, 0.82, -0.05],
        mossAmount: 0.45,
        seed: 9.1,
      },
      {
        type: 'medium',
        family: 'mossStone',
        variant: 2,
        x: -20.0,
        z: 12.0,
        yOffset: 0.0,
        scale: [3.6, 2.6, 3.2],
        rotation: [-0.10, 1.40, 0.12],
        mossAmount: 0.50,
        seed: 10.3,
      },

      // Right Bluff Ledge Rocks
      {
        type: 'medium',
        family: 'coolSlate',
        variant: 1,
        x: 22.0,
        z: -14.0,
        yOffset: 0.30,
        scale: [4.0, 2.8, 3.4],
        rotation: [0.20, -0.45, 0.10],
        mossAmount: 0.30,
        seed: 11.6,
      },

      // ==========================================
      // 3. SMALL ROCKS & COMPANION STONES (~18 Placements)
      // ==========================================
      // Companion clusters around Guardian Monolith
      {
        type: 'small',
        family: 'paleRiverStone',
        variant: 0,
        x: -12.0,
        z: 4.8,
        yOffset: -0.1,
        scale: [2.0, 1.4, 1.8],
        rotation: [0.1, 0.4, 0.1],
        mossAmount: 0.40,
        seed: 13.2,
      },
      {
        type: 'small',
        family: 'warmGranite',
        variant: 1,
        x: -22.5,
        z: -3.0,
        yOffset: 0.1,
        scale: [1.8, 1.3, 1.6],
        rotation: [-0.2, 1.1, 0.0],
        mossAmount: 0.45,
        seed: 14.5,
      },

      // Companion stones around Rapids Island Splitter
      {
        type: 'small',
        family: 'coolSlate',
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
        family: 'coolSlate',
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
        family: 'wetRiverRock',
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
        family: 'paleRiverStone',
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
        family: 'paleRiverStone',
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
        family: 'paleRiverStone',
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
        family: 'paleRiverStone',
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
        family: 'paleRiverStone',
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
        family: 'paleRiverStone',
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
        family: 'warmGranite',
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
        family: 'warmGranite',
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
        family: 'warmGranite',
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
      const tInfo = this.terrain.getHeightAt(cfg.x, cfg.z);
      const isRiverRock = tInfo.distToRiver < tInfo.halfWidth;

      let groundY = tInfo.y + (cfg.yOffset ?? 0);
      if (cfg.type === 'hero' && cfg.variant === 0) {
        // Hero 1 (Guardian Monolith): firmly grounded into the meadow bank
        groundY = tInfo.y + (cfg.yOffset ?? -0.15);
      } else if (cfg.type === 'hero' && cfg.variant === 1) {
        // Hero 2 (Splitter): seated in the rapids channel, parting the current
        groundY = tInfo.sampleY - 0.35;
      } else if (cfg.type === 'hero' && cfg.variant === 2) {
        // Hero 3 (Stepping Slab): flat stone jutting into clear turquoise shallows
        groundY = tInfo.sampleY - 0.25;
      } else if (isRiverRock) {
        // River rocks sit deep in the riverbed so their base is firmly anchored
        groundY = Math.min(tInfo.sampleY - 0.35, tInfo.y + (cfg.yOffset ?? 0));
      }

      const family = cfg.family ?? (cfg.type === 'hero' ? 'warmGranite' : 'paleRiverStone');

      // Route all hero rock variants to authored anime HeroRock asset
      if (cfg.type === 'hero') {
        const authoredMesh = HeroRock.createMesh(cfg, groundY, tInfo.sampleY);
        this.group.add(authoredMesh);
        return;
      }

      let geo: THREE.BufferGeometry;

      if (cfg.type === 'medium') {
        geo = this.createMediumRockGeometry(cfg.variant, cfg.seed, cfg.mossAmount, family, groundY, cfg.scale[1], tInfo.sampleY);
      } else {
        geo = this.createSmallRockGeometry(cfg.variant, cfg.seed, cfg.mossAmount, family, groundY, cfg.scale[1], tInfo.sampleY);
      }

      const mesh = new THREE.Mesh(geo, this.materials[family]);

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
   * Features distinct material families, planar facet modulation, darker undersides, and wet waterline.
   */
  private generateSmoothWeatheredGeometry(
    baseRadius: number,
    aspectY: number,
    aspectXZ: number,
    seed: number,
    mossAmount: number,
    angularity: number = 0.14,
    family: RockMaterialFamily = 'warmGranite',
    groundY: number = 0,
    scaleY: number = 1,
    sampleY: number = 0
  ): THREE.BufferGeometry {
    // 14 x 10 segments provides structured planar anime facets
    const baseGeo = new THREE.SphereGeometry(baseRadius, 14, 10);
    const basePos = baseGeo.attributes.position;
    const baseCount = basePos.count;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < baseCount; i++) {
      vertex.fromBufferAttribute(basePos, i);

      // Proportional shaping
      vertex.y *= aspectY;
      vertex.x *= aspectXZ;
      vertex.z *= aspectXZ;

      // Natural organic harmonic displacement
      const angle = Math.atan2(vertex.z, vertex.x);
      const horizontalNoise =
        Math.sin(angle * 2.0 + seed) * angularity +
        Math.cos(angle * 3.0 + seed * 1.5) * (angularity * 0.70);

      vertex.x *= 1.0 + horizontalNoise;
      vertex.z *= 1.0 + horizontalNoise;

      // Vertical organic harmonic undulation
      vertex.y += Math.sin(vertex.x * 2.0 + vertex.z * 2.0 + seed) * 0.08 * baseRadius;

      // Authentic anime planar chisel cuts (multi-angle cleavage planes)
      // Plane 1: Sun-facing sloping facet (+X, +Y, -Z)
      const n1 = new THREE.Vector3(0.58, 0.65, -0.48).normalize();
      const d1 = 0.52 * baseRadius * Math.min(aspectY, aspectXZ);
      const dot1 = vertex.dot(n1);
      if (dot1 > d1) {
        vertex.addScaledVector(n1, -(dot1 - d1));
      }

      // Plane 2: Steep shaded fracture plane (-X, +Y, +Z)
      const n2 = new THREE.Vector3(-0.65, 0.45, 0.60).normalize();
      const d2 = 0.58 * baseRadius * Math.min(aspectY, aspectXZ);
      const dot2 = vertex.dot(n2);
      if (dot2 > d2) {
        vertex.addScaledVector(n2, -(dot2 - d2));
      }

      // Plane 3: Natural sloped crest facet
      const n3 = new THREE.Vector3(0.28, 0.88, -0.38).normalize();
      const d3 = 0.62 * baseRadius * aspectY;
      const dot3 = vertex.dot(n3);
      if (dot3 > d3) {
        vertex.addScaledVector(n3, -(dot3 - d3));
      }

      // Plane 4: Lateral diagonal facet
      const n4 = new THREE.Vector3(-0.50, 0.55, -0.65).normalize();
      const d4 = 0.62 * baseRadius * aspectXZ;
      const dot4 = vertex.dot(n4);
      if (dot4 > d4) {
        vertex.addScaledVector(n4, -(dot4 - d4));
      }

      // Solid grounded base extending downward into riverbed or terrain
      if (vertex.y < 0) {
        vertex.y *= 1.30;
      }

      basePos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    // Compute smooth averaged vertex normals across shared vertices
    baseGeo.computeVertexNormals();
    const geo = baseGeo;

    const pos = geo.attributes.position;
    const vertexCount = pos.count;
    const normAttr = geo.attributes.normal;
    const colors = new Float32Array(vertexCount * 3);

    const familyPalettes: Record<RockMaterialFamily, {
      sunlit: THREE.Color;
      shadow: THREE.Color;
      underside: THREE.Color;
      moss: THREE.Color;
      waterline: THREE.Color;
    }> = {
      warmGranite: {
        sunlit: new THREE.Color(0xe4d8c0),   // Warm radiant buff granite
        shadow: new THREE.Color(0x5a5048),   // Warm slate shadow
        underside: new THREE.Color(0x28201a),// Deep dark underside
        moss: new THREE.Color(0x6b8e38),     // Soft olive moss cap
        waterline: new THREE.Color(0x221c16),// Dark damp stone
      },
      coolSlate: {
        sunlit: new THREE.Color(0xb0c4d0),   // Cool bluish-gray slate
        shadow: new THREE.Color(0x38444e),   // Deep cool slate shadow
        underside: new THREE.Color(0x1a2228),
        moss: new THREE.Color(0x547244),
        waterline: new THREE.Color(0x161c20),
      },
      paleRiverStone: {
        sunlit: new THREE.Color(0xede4d4),   // Pale water-worn river limestone
        shadow: new THREE.Color(0x787062),
        underside: new THREE.Color(0x383228),
        moss: new THREE.Color(0x728846),
        waterline: new THREE.Color(0x28241c),
      },
      mossStone: {
        sunlit: new THREE.Color(0xc6cca8),
        shadow: new THREE.Color(0x465240),
        underside: new THREE.Color(0x1e241a),
        moss: new THREE.Color(0x527630),     // Rich natural velvet olive moss
        waterline: new THREE.Color(0x182014),
      },
      wetRiverRock: {
        sunlit: new THREE.Color(0x86989a),   // Dark water-slick rapids rock
        shadow: new THREE.Color(0x283238),
        underside: new THREE.Color(0x12181c),
        moss: new THREE.Color(0x425c34),
        waterline: new THREE.Color(0x0e1418),// Deep wet waterline
      },
    };

    const pal = familyPalettes[family];
    const sunDir = new THREE.Vector3(38, 50, -38).normalize();
    const tempColor = new THREE.Color();
    const norm = new THREE.Vector3();

    // Compute painterly vertex colors (moss, sunlit face, shadow, waterline, planar facet)
    for (let i = 0; i < vertexCount; i++) {
      vertex.fromBufferAttribute(pos, i);
      norm.fromBufferAttribute(normAttr, i);

      const sunFactor = norm.dot(sunDir);
      const isTop = norm.y > 0.60;

      // Clean planar light/shadow separation for anime brush-plane look
      if (sunFactor > 0.05) {
        tempColor.copy(pal.shadow).lerp(pal.sunlit, 0.42 + sunFactor * 0.58);
      } else {
        tempColor.copy(pal.shadow).lerp(pal.underside, THREE.MathUtils.clamp(-sunFactor * 0.55, 0, 1));
      }

      // Darker undersides & ground contact occlusion
      if (vertex.y < -0.05 * baseRadius) {
        const underBlend = THREE.MathUtils.clamp((-0.05 * baseRadius - vertex.y) / (0.45 * baseRadius), 0, 1);
        tempColor.lerp(pal.underside, underBlend * 0.85);
      }

      // Moss cap on upward-facing surfaces with organic boundary
      if (isTop && mossAmount > 0) {
        const mossNoise = Math.sin(vertex.x * 3.5 + seed) * 0.08 + Math.cos(vertex.z * 3.5) * 0.08;
        const mossBlend = THREE.MathUtils.clamp((norm.y - 0.60 + mossNoise) / 0.32, 0, 1) * mossAmount;
        tempColor.lerp(pal.moss, mossBlend * 0.72);
      }

      // Dark wet waterline where stone meets the river water elevation
      const worldY = groundY + vertex.y * scaleY;
      const relWaterY = worldY - sampleY;
      if (relWaterY < 0.40 && relWaterY > -0.70) {
        const wetIntensity = 1.0 - THREE.MathUtils.clamp(Math.abs(relWaterY - (-0.10)) / 0.55, 0, 1);
        tempColor.lerp(pal.waterline, wetIntensity * 0.88);
      } else if (worldY <= sampleY) {
        tempColor.lerp(pal.waterline, 0.82);
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return BufferGeometryUtils.toCreasedNormals(geo, THREE.MathUtils.degToRad(28));
  }

  private createMediumRockGeometry(
    variant: number,
    seed: number,
    moss: number,
    family: RockMaterialFamily,
    groundY: number,
    scaleY: number,
    sampleY: number
  ): THREE.BufferGeometry {
    const aspectYConfigs = [0.80, 0.70, 0.60, 0.90, 0.75];
    const aspectXZConfigs = [1.05, 1.20, 1.15, 0.95, 1.10];
    const idx = Math.abs(variant) % 5;
    return this.generateSmoothWeatheredGeometry(
      1.0,
      aspectYConfigs[idx],
      aspectXZConfigs[idx],
      seed,
      moss,
      0.15,
      family,
      groundY,
      scaleY,
      sampleY
    );
  }

  private createSmallRockGeometry(
    variant: number,
    seed: number,
    moss: number,
    family: RockMaterialFamily,
    groundY: number,
    scaleY: number,
    sampleY: number
  ): THREE.BufferGeometry {
    const aspectYConfigs = [0.70, 0.55, 0.80, 0.65, 0.75, 0.60, 0.85, 0.70];
    const aspectXZConfigs = [1.10, 1.25, 0.95, 1.15, 1.05, 1.20, 1.00, 1.10];
    const idx = Math.abs(variant) % 8;
    return this.generateSmoothWeatheredGeometry(
      1.0,
      aspectYConfigs[idx],
      aspectXZConfigs[idx],
      seed,
      moss,
      0.14,
      family,
      groundY,
      scaleY,
      sampleY
    );
  }
}
