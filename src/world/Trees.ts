import * as THREE from 'three';
import { Terrain } from './Terrain';

export interface TreePlacementConfig {
  archetype: 'sakura' | 'greenBroadleaf' | 'autumnBroadleaf' | 'pine' | 'smallBackground' | 'bush' | 'foregroundFraming';
  x: number;
  z: number;
  scale: number;
  yOffset?: number;
  rotationY?: number;
}

export class Trees {
  public readonly group: THREE.Group;
  private terrain: Terrain;

  private sharedFoliageMaterial: THREE.MeshStandardMaterial;
  private sharedTrunkMaterial: THREE.MeshStandardMaterial;
  private sharedForegroundFoliageMaterial: THREE.MeshStandardMaterial;

  constructor(terrain: Terrain) {
    this.group = new THREE.Group();
    this.group.name = 'TreesGroup';
    this.terrain = terrain;

    this.sharedFoliageMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.02,
      flatShading: false,
    });

    this.sharedTrunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x483a2e,
      roughness: 0.90,
      metalness: 0.02,
    });

    this.sharedForegroundFoliageMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.02,
      flatShading: false,
    });

    this.placeTrees();
  }

  /**
   * Generates an organic, asymmetrical, flattened anime foliage lobe.
   */
  private createOrganicFoliageLobe(
    radius: number,
    baseColorHex: number,
    sunlitColorHex: number,
    shadowColorHex: number,
    seed: number
  ): THREE.BufferGeometry {
    const geo = new THREE.SphereGeometry(radius, 18, 14);
    const pos = geo.attributes.position;
    const vertexCount = pos.count;
    const v = new THREE.Vector3();
    const colors = new Float32Array(vertexCount * 3);

    const baseCol = new THREE.Color(baseColorHex);
    const sunlitCol = new THREE.Color(sunlitColorHex);
    const shadowCol = new THREE.Color(shadowColorHex);
    const sunDir = new THREE.Vector3(38, 50, -38).normalize();
    const tempCol = new THREE.Color();

    for (let i = 0; i < vertexCount; i++) {
      v.fromBufferAttribute(pos, i);

      // Flatten in Y to produce layered anime cloud-like canopy cushions
      v.y *= 0.56;

      // Organic asymmetrical horizontal swells
      const angle = Math.atan2(v.z, v.x);
      const horizontalNoise =
        Math.sin(angle * 3.0 + seed) * 0.16 +
        Math.cos(angle * 2.0 + seed * 1.5) * 0.12;

      v.x *= 1.0 + horizontalNoise;
      v.z *= 1.0 + horizontalNoise;

      // Subtle vertical organic distortion
      v.y += Math.sin(v.x * 2.0 + v.z * 2.0 + seed) * 0.08 * radius;

      pos.setXYZ(i, v.x, v.y, v.z);
    }

    geo.computeVertexNormals();
    const normAttr = geo.attributes.normal;
    const norm = new THREE.Vector3();

    for (let i = 0; i < vertexCount; i++) {
      norm.fromBufferAttribute(normAttr, i);
      const sunFactor = norm.dot(sunDir);

      tempCol.copy(baseCol);
      tempCol.lerp(shadowCol, THREE.MathUtils.clamp((-sunFactor + 0.25) * 0.75, 0, 1));
      tempCol.lerp(sunlitCol, THREE.MathUtils.clamp((sunFactor - 0.10) * 0.85, 0, 1));

      colors[i * 3] = tempCol.r;
      colors[i * 3 + 1] = tempCol.g;
      colors[i * 3 + 2] = tempCol.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }

  private createTrunk(height: number, bottomRadius: number, topRadius: number): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 10, 5);
    const pos = geo.attributes.position;
    const vertexCount = pos.count;

    for (let i = 0; i < vertexCount; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      if (y < -height * 0.25) {
        const flare = 1.0 + ((-height * 0.25 - y) / (height * 0.25)) * 0.65;
        x *= flare;
        z *= flare;
      }

      x += Math.sin((y / height) * Math.PI) * 0.10 * height;

      pos.setXYZ(i, x, y, z);
    }

    geo.computeVertexNormals();
    geo.translate(0, height * 0.5, 0);
    const trunk = new THREE.Mesh(geo, this.sharedTrunkMaterial);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    return trunk;
  }

  private createBranch(
    length: number,
    startRadius: number,
    endRadius: number,
    curveBend: number = 0.1
  ): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(endRadius, startRadius, length, 8, 4);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      x += Math.sin((y / length) * Math.PI) * curveBend * length;
      pos.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    geo.translate(0, length * 0.5, 0);
    const branch = new THREE.Mesh(geo, this.sharedTrunkMaterial);
    branch.castShadow = true;
    return branch;
  }

  /**
   * 1. Sakura Tree
   * Spreading branching silhouette with 12 dense, overlapping blossom cloud cushions.
   */
  private createSakuraTree(seed: number = 1.0): THREE.Group {
    const tree = new THREE.Group();

    // Sturdy gnarled Japanese cherry trunk, lower spreading profile
    const trunk = this.createTrunk(2.8, 0.44, 0.28);
    tree.add(trunk);

    const branches = [
      { len: 2.6, rx: 0.30, rz: 0.48, ry: 0.4, y: 1.8 },
      { len: 2.4, rx: -0.22, rz: -0.44, ry: 2.1, y: 2.0 },
      { len: 2.2, rx: 0.16, rz: -0.36, ry: 4.1, y: 2.2 },
    ];

    branches.forEach((b) => {
      const branchMesh = this.createBranch(b.len, 0.22, 0.12, 0.16);
      branchMesh.position.y = b.y;
      branchMesh.rotation.set(b.rx, b.ry, b.rz);
      tree.add(branchMesh);
    });

    const pal = {
      base: 0xebb4c2,   // Soft pastel cherry blossom
      sunlit: 0xfde2e8, // Warm radiant sunlit petal highlight
      shadow: 0xa87082, // Cool plum/mauve underside shadow
    };

    // 12 tightly clustered, overlapping fluffy cloud cushions
    const lobes = [
      { x: 0.0, y: 3.6, z: 0.0, r: 2.3, s: seed + 0.1 },
      { x: -1.6, y: 3.1, z: 0.8, r: 1.9, s: seed + 0.4 },
      { x: 1.5, y: 3.3, z: -0.6, r: 1.8, s: seed + 0.8 },
      { x: 0.2, y: 4.2, z: 0.5, r: 1.7, s: seed + 1.2 },
      { x: -0.8, y: 3.8, z: -1.1, r: 1.6, s: seed + 1.6 },
      { x: 1.6, y: 2.9, z: 1.1, r: 1.6, s: seed + 2.0 },
      { x: -2.0, y: 2.7, z: -0.8, r: 1.6, s: seed + 2.4 },
      { x: 0.0, y: 2.6, z: 1.5, r: 1.5, s: seed + 2.8 },
      { x: -1.1, y: 3.5, z: 1.3, r: 1.4, s: seed + 3.2 },
      { x: 1.2, y: 3.6, z: 0.7, r: 1.5, s: seed + 3.6 },
      { x: 0.9, y: 2.8, z: -1.3, r: 1.4, s: seed + 4.0 },
      { x: -0.6, y: 2.5, z: -1.5, r: 1.3, s: seed + 4.4 },
    ];

    lobes.forEach((l) => {
      const geo = this.createOrganicFoliageLobe(l.r, pal.base, pal.sunlit, pal.shadow, l.s);
      const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
      mesh.position.set(l.x, l.y, l.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      tree.add(mesh);
    });

    return tree;
  }

  /**
   * 2. Mature Green Broadleaf
   */
  private createGreenBroadleaf(seed: number = 2.0): THREE.Group {
    const tree = new THREE.Group();

    const trunk = this.createTrunk(4.5, 0.52, 0.32);
    tree.add(trunk);

    const branch1 = this.createBranch(3.0, 0.24, 0.13, 0.14);
    branch1.position.y = 3.0;
    branch1.rotation.set(0.3, 0.4, 0.4);
    tree.add(branch1);

    const branch2 = this.createBranch(2.8, 0.22, 0.12, -0.12);
    branch2.position.y = 3.2;
    branch2.rotation.set(-0.25, 2.4, -0.35);
    tree.add(branch2);

    const pal = {
      base: 0x6e9646,   // Warm natural anime olive-green
      sunlit: 0x9ec468, // Golden sunlight highlight
      shadow: 0x3d5a2c, // Cool shaded green
    };

    const lobes = [
      { x: 0.0, y: 5.2, z: 0.0, r: 2.4, s: seed + 0.1 },
      { x: -1.3, y: 4.5, z: 0.6, r: 1.9, s: seed + 0.6 },
      { x: 1.2, y: 4.7, z: -0.5, r: 1.8, s: seed + 1.1 },
      { x: 0.2, y: 5.9, z: 0.4, r: 1.7, s: seed + 1.6 },
      { x: -0.6, y: 5.4, z: -0.9, r: 1.6, s: seed + 2.1 },
      { x: 1.4, y: 4.0, z: 0.9, r: 1.5, s: seed + 2.6 },
      { x: -1.6, y: 4.1, z: -0.6, r: 1.6, s: seed + 3.1 },
      { x: 0.0, y: 3.7, z: 1.2, r: 1.4, s: seed + 3.6 },
    ];

    lobes.forEach((l) => {
      const geo = this.createOrganicFoliageLobe(l.r, pal.base, pal.sunlit, pal.shadow, l.s);
      const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
      mesh.position.set(l.x, l.y, l.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      tree.add(mesh);
    });

    return tree;
  }

  /**
   * 3. Autumn Broadleaf
   */
  private createAutumnBroadleaf(seed: number = 3.0): THREE.Group {
    const tree = new THREE.Group();

    const trunk = this.createTrunk(4.2, 0.46, 0.28);
    tree.add(trunk);

    const palAmber = {
      base: 0xd07c38,
      sunlit: 0xf2a456,
      shadow: 0x7e3c1c,
    };

    const palRusset = {
      base: 0xba582e,
      sunlit: 0xdf7c46,
      shadow: 0x6e2b14,
    };

    const lobes = [
      { x: 0.0, y: 4.9, z: 0.0, r: 2.2, pal: palAmber, s: seed + 0.1 },
      { x: -1.1, y: 4.2, z: 0.5, r: 1.8, pal: palRusset, s: seed + 0.7 },
      { x: 1.1, y: 4.4, z: -0.4, r: 1.7, pal: palAmber, s: seed + 1.3 },
      { x: 0.2, y: 5.6, z: 0.3, r: 1.6, pal: palAmber, s: seed + 1.9 },
      { x: -0.5, y: 5.1, z: -0.7, r: 1.5, pal: palRusset, s: seed + 2.5 },
      { x: 1.3, y: 3.8, z: 0.7, r: 1.5, pal: palAmber, s: seed + 3.1 },
      { x: -1.2, y: 3.7, z: -0.5, r: 1.4, pal: palRusset, s: seed + 3.7 },
    ];

    lobes.forEach((l) => {
      const geo = this.createOrganicFoliageLobe(l.r, l.pal.base, l.pal.sunlit, l.pal.shadow, l.s);
      const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
      mesh.position.set(l.x, l.y, l.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      tree.add(mesh);
    });

    return tree;
  }

  /**
   * 4. Pine / Conifer
   */
  private createPineTree(seed: number = 4.0): THREE.Group {
    const tree = new THREE.Group();

    const trunk = this.createTrunk(6.8, 0.40, 0.20);
    tree.add(trunk);

    const pal = {
      base: 0x183428,
      sunlit: 0x2c5440,
      shadow: 0x0f2219,
    };

    const tiers = 5;
    for (let t = 0; t < tiers; t++) {
      const tierRadius = 2.4 - t * 0.36;
      const geo = this.createOrganicFoliageLobe(
        tierRadius,
        pal.base,
        pal.sunlit,
        pal.shadow,
        seed + t * 1.7
      );

      const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
      mesh.position.y = 3.6 + t * 1.5;
      mesh.rotation.y = t * 0.75;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      tree.add(mesh);
    }

    return tree;
  }

  /**
   * 5. Small Background Tree
   */
  private createSmallBackgroundTree(seed: number = 5.0): THREE.Group {
    const tree = new THREE.Group();

    const trunk = this.createTrunk(2.8, 0.28, 0.16);
    tree.add(trunk);

    const pal = {
      base: 0x628456,
      sunlit: 0x86a874,
      shadow: 0x3d5438,
    };

    const lobes = [
      { x: 0.0, y: 3.2, z: 0.0, r: 1.6, s: seed + 0.2 },
      { x: -0.6, y: 2.7, z: 0.4, r: 1.3, s: seed + 0.8 },
      { x: 0.6, y: 2.8, z: -0.3, r: 1.2, s: seed + 1.4 },
    ];

    lobes.forEach((l) => {
      const geo = this.createOrganicFoliageLobe(l.r, pal.base, pal.sunlit, pal.shadow, l.s);
      const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
      mesh.position.set(l.x, l.y, l.z);
      mesh.castShadow = true;
      tree.add(mesh);
    });

    return tree;
  }

  /**
   * 6. Bush / Shrub
   */
  private createBush(seed: number = 6.0): THREE.Group {
    const bush = new THREE.Group();

    const pal = {
      base: 0x5b7e36,
      sunlit: 0x8ab554,
      shadow: 0x354b20,
    };

    const lobes = [
      { x: 0.0, y: 0.7, z: 0.0, r: 1.2, s: seed + 0.1 },
      { x: 0.6, y: 0.5, z: 0.4, r: 0.9, s: seed + 0.6 },
      { x: -0.5, y: 0.5, z: -0.3, r: 1.0, s: seed + 1.2 },
    ];

    lobes.forEach((l) => {
      const geo = this.createOrganicFoliageLobe(l.r, pal.base, pal.sunlit, pal.shadow, l.s);
      const mesh = new THREE.Mesh(geo, this.sharedFoliageMaterial);
      mesh.position.set(l.x, l.y, l.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      bush.add(mesh);
    });

    return bush;
  }

  /**
   * 7. Foreground Framing Tree
   */
  private createForegroundFramingTree(seed: number = 7.0): THREE.Group {
    const tree = new THREE.Group();

    const trunk = this.createTrunk(7.5, 0.60, 0.30);
    tree.add(trunk);

    const pal = {
      base: 0x183428,   // Deep forest evergreen
      sunlit: 0x2c5440, // Sunlit needle tips
      shadow: 0x0f2219, // Deep shadowy underside
    };

    const tiers = 5;
    for (let t = 0; t < tiers; t++) {
      const tierRadius = 2.8 - t * 0.42;
      const geo = this.createOrganicFoliageLobe(
        tierRadius,
        pal.base,
        pal.sunlit,
        pal.shadow,
        seed + t * 1.8
      );

      const mesh = new THREE.Mesh(geo, this.sharedForegroundFoliageMaterial);
      mesh.position.y = 4.0 + t * 1.8;
      mesh.rotation.y = t * 0.8;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      tree.add(mesh);
    }

    return tree;
  }

  // ==========================================
  // HAND-AUTHORED PLACEMENT
  // ==========================================
  private placeTrees(): void {
    const treePlacements: TreePlacementConfig[] = [
      // ----------------------------------------
      // Left Meadow: Cottage & Foothill Groves
      // ----------------------------------------
      // Sakura sheltering right over countryside cottage
      { archetype: 'sakura', x: -24, z: -19, scale: 2.2, rotationY: 0.3 },
      // Sakura grove slightly further back on meadow slope
      { archetype: 'sakura', x: -32, z: -14, scale: 2.1, rotationY: 1.1 },
      // Meadow Broadleaf behind cottage clearing
      { archetype: 'greenBroadleaf', x: -16, z: -25, scale: 1.9, rotationY: 0.7 },
      // Lower meadow oak near pathway bend
      { archetype: 'greenBroadleaf', x: -21, z: -4, scale: 1.8, rotationY: 2.0 },
      // Meadow terrace tree
      { archetype: 'greenBroadleaf', x: -25, z: 8, scale: 1.8, rotationY: 1.4 },
      // Shrubs around cottage and meadow rocks
      { archetype: 'bush', x: -23, z: -13, scale: 1.3 },
      { archetype: 'bush', x: -16, z: -18, scale: 1.2 },
      { archetype: 'bush', x: -22, z: 2, scale: 1.3 },

      // ----------------------------------------
      // Right Bluff: Forested Hillside & Autumn Canopy
      // ----------------------------------------
      // Sunlit Autumn trees catching afternoon light
      { archetype: 'autumnBroadleaf', x: 26, z: -8, scale: 2.3, rotationY: 0.5 },
      { archetype: 'autumnBroadleaf', x: 27, z: 6, scale: 2.2, rotationY: 1.7 },
      // Hillside oak on upper ridge
      { archetype: 'greenBroadleaf', x: 34, z: -18, scale: 2.5, rotationY: 0.4 },
      // Mountain pines on upper slope
      { archetype: 'pine', x: 32, z: -26, scale: 2.4, rotationY: 0.9 },
      { archetype: 'pine', x: 38, z: -20, scale: 2.6, rotationY: 2.3 },

      // ----------------------------------------
      // Distant Background Fillers
      // ----------------------------------------
      { archetype: 'smallBackground', x: -44, z: -38, scale: 1.8 },
      { archetype: 'smallBackground', x: -36, z: -44, scale: 1.9 },
      { archetype: 'smallBackground', x: 44, z: -14, scale: 2.0 },
      { archetype: 'smallBackground', x: 38, z: 16, scale: 1.8 },
      { archetype: 'smallBackground', x: 42, z: 24, scale: 1.7 },

      // ----------------------------------------
      // Bottom-Left Foreground Sakura Accent
      // ----------------------------------------
      { archetype: 'sakura', x: -44, z: 34, scale: 2.0, rotationY: 0.5 },

      // ----------------------------------------
      // Bottom-Right Foreground Cinematic Framing
      // ----------------------------------------
      { archetype: 'foregroundFraming', x: 36, z: 44, scale: 2.8, yOffset: -12, rotationY: 0.3 },
      { archetype: 'foregroundFraming', x: 44, z: 46, scale: 3.2, yOffset: -14, rotationY: 1.1 },
      { archetype: 'foregroundFraming', x: 28, z: 50, scale: 2.4, yOffset: -8, rotationY: 2.0 },
      { archetype: 'foregroundFraming', x: 40, z: 54, scale: 3.0, yOffset: -14, rotationY: 0.7 },
    ];

    treePlacements.forEach((p, idx) => {
      let treeGroup: THREE.Group;

      switch (p.archetype) {
        case 'sakura':
          treeGroup = this.createSakuraTree(idx * 2.3 + 1.1);
          break;
        case 'greenBroadleaf':
          treeGroup = this.createGreenBroadleaf(idx * 2.3 + 1.1);
          break;
        case 'autumnBroadleaf':
          treeGroup = this.createAutumnBroadleaf(idx * 2.3 + 1.1);
          break;
        case 'pine':
          treeGroup = this.createPineTree(idx * 2.3 + 1.1);
          break;
        case 'smallBackground':
          treeGroup = this.createSmallBackgroundTree(idx * 2.3 + 1.1);
          break;
        case 'bush':
          treeGroup = this.createBush(idx * 2.3 + 1.1);
          break;
        case 'foregroundFraming':
          treeGroup = this.createForegroundFramingTree(idx * 2.3 + 1.1);
          break;
      }

      const tInfo = this.terrain.getHeightAt(p.x, p.z);
      const groundY = tInfo.y + (p.yOffset ?? 0);

      treeGroup.position.set(p.x, groundY, p.z);
      treeGroup.scale.setScalar(p.scale);
      if (p.rotationY !== undefined) {
        treeGroup.rotation.y = p.rotationY;
      }

      this.group.add(treeGroup);
    });
  }
}
