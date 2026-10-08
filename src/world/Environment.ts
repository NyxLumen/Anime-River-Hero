import * as THREE from 'three';

export class Environment {
  public readonly group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'EnvironmentGroup';

    this.createForegroundFraming();
    this.createMidgroundTrees();
    this.createCottagePlaceholder();
    this.createMeadowFence();
    this.createSteppingStones();
    this.createAtmosphericMist();
  }

  /**
   * Generates an organic, asymmetrical, flattened anime foliage cushion.
   * Uses indexed SphereGeometry so normals are completely smooth,
   * eliminating all faceted low-poly game artifacts.
   */
  private createOrganicFoliageLobe(
    radius: number,
    baseColorHex: number,
    sunlitColorHex: number,
    shadowColorHex: number,
    seed: number
  ): THREE.BufferGeometry {
    // 18 x 14 segments provides smooth continuous curvature without heavy vertex count
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
      v.y *= 0.60;

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

    // Smooth averaged normals across indexed triangles
    geo.computeVertexNormals();
    const normAttr = geo.attributes.normal;
    const norm = new THREE.Vector3();

    // Compute painterly anime volumetric light gradient
    for (let i = 0; i < vertexCount; i++) {
      norm.fromBufferAttribute(normAttr, i);
      const sunFactor = norm.dot(sunDir);

      tempCol.copy(baseCol);
      // Soft cool shadow on underside
      tempCol.lerp(shadowCol, THREE.MathUtils.clamp((-sunFactor + 0.25) * 0.75, 0, 1));
      // Warm sunlit highlight on upper sun-facing lobes
      tempCol.lerp(sunlitCol, THREE.MathUtils.clamp((sunFactor - 0.1) * 0.85, 0, 1));

      colors[i * 3] = tempCol.r;
      colors[i * 3 + 1] = tempCol.g;
      colors[i * 3 + 2] = tempCol.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }

  /**
   * Foreground Layer:
   * Layered organic conifer boughs in the bottom-right corner.
   * Completely smooth shading, eliminating cone facets.
   */
  private createForegroundFraming(): void {
    const fgGroup = new THREE.Group();
    fgGroup.name = 'ForegroundFraming';

    const fgFoliageMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.86,
      metalness: 0.03,
      flatShading: false,
    });

    const fgTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x1f1814,
      roughness: 0.95,
    });

    const createPineTree = (x: number, y: number, z: number, scale: number) => {
      const tree = new THREE.Group();
      tree.position.set(x, y, z);
      tree.scale.setScalar(scale);

      const trunkGeo = new THREE.CylinderGeometry(0.35, 0.65, 6.0, 10);
      const trunk = new THREE.Mesh(trunkGeo, fgTrunkMat);
      trunk.position.y = 3.0;
      trunk.castShadow = true;
      tree.add(trunk);

      // 5 Tiered organic drooping skirts
      const tiers = 5;
      for (let t = 0; t < tiers; t++) {
        const tierRadius = 2.6 - t * 0.40;
        const tierLobeGeo = this.createOrganicFoliageLobe(
          tierRadius,
          0x183428, // Deep muted forest green
          0x2c5440, // Sunlit needle tips
          0x0f2219, // Deep shadowy underside
          t * 1.7 + x * 0.1
        );

        const tierMesh = new THREE.Mesh(tierLobeGeo, fgFoliageMat);
        tierMesh.position.y = 4.0 + t * 1.9;
        tierMesh.rotation.y = t * 0.8;
        tierMesh.castShadow = true;
        tierMesh.receiveShadow = true;
        tree.add(tierMesh);
      }

      return tree;
    };

    // Positioned strictly in the bottom-right periphery
    fgGroup.add(createPineTree(40, 10.0, 38, 3.2));
    fgGroup.add(createPineTree(48, 14.0, 40, 3.8));
    fgGroup.add(createPineTree(34, 6.0, 46, 2.8));
    fgGroup.add(createPineTree(44, 12.0, 50, 3.5));

    this.group.add(fgGroup);
  }

  /**
   * Midground Trees:
   * Stylized anime foliage trees on the left meadow plateau
   * with organic layered cushions and painterly lighting gradients.
   */
  private createMidgroundTrees(): void {
    const treesGroup = new THREE.Group();
    treesGroup.name = 'MidgroundTrees';

    const foliageSharedMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.84,
      metalness: 0.03,
      flatShading: false, // Smooth painterly shading, no d20 facets!
    });

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x483a2e,
      roughness: 0.9,
    });

    // Curated natural anime palettes
    const treePalettes = {
      green: {
        base: 0x6e9646,   // Warm natural anime olive-green
        sunlit: 0x9ec468, // Golden sunlight highlight
        shadow: 0x3d5a2c, // Cool shaded green
      },
      sakura: {
        base: 0xebb4c2,   // Soft pastel cherry blossom
        sunlit: 0xfde2e8, // Warm sunlit petal highlight
        shadow: 0xa87082, // Cool plum/mauve shadow
      },
      autumn: {
        base: 0xd07c38,   // Warm autumn amber / ochre
        sunlit: 0xf2a456, // Golden sunlit amber
        shadow: 0x7e3c1c, // Rich russet shadow
      },
    };

    const createAnimeTree = (
      x: number,
      y: number,
      z: number,
      scale: number,
      type: 'green' | 'sakura' | 'autumn' = 'green'
    ) => {
      const tree = new THREE.Group();
      tree.position.set(x, y, z);
      tree.scale.setScalar(scale);

      const trunkGeo = new THREE.CylinderGeometry(0.35, 0.65, 5.0, 10);
      const trunk = new THREE.Mesh(trunkGeo, woodMat);
      trunk.position.y = 2.5;
      trunk.castShadow = true;
      tree.add(trunk);

      const pal = treePalettes[type];

      // Layered organic cloud lobes arranged like painterly foliage masses
      const lobes = [
        { ox: 0.0, oy: 5.2, oz: 0.0, r: 2.3, seed: 1.1 },
        { ox: -1.0, oy: 4.5, oz: 0.6, r: 1.8, seed: 2.4 },
        { ox: 0.9, oy: 4.7, oz: -0.5, r: 1.7, seed: 3.7 },
        { ox: 0.2, oy: 6.0, oz: 0.4, r: 1.6, seed: 4.9 },
        { ox: -0.5, oy: 5.5, oz: -0.7, r: 1.5, seed: 5.8 },
      ];

      lobes.forEach((l) => {
        const lobeGeo = this.createOrganicFoliageLobe(l.r, pal.base, pal.sunlit, pal.shadow, l.seed);
        const lobeMesh = new THREE.Mesh(lobeGeo, foliageSharedMaterial);
        lobeMesh.position.set(l.ox, l.oy, l.oz);
        lobeMesh.castShadow = true;
        lobeMesh.receiveShadow = true;
        tree.add(lobeMesh);
      });

      return tree;
    };

    // Upper left meadow trees framing cottage & footpath
    treesGroup.add(createAnimeTree(-26, 6.0, -22, 2.2, 'sakura'));   // Sakura behind cottage
    treesGroup.add(createAnimeTree(-16, 5.2, -26, 1.9, 'green'));    // Meadow oak behind cottage
    treesGroup.add(createAnimeTree(-32, 6.4, -12, 2.3, 'sakura'));   // Sakura on meadow slope
    treesGroup.add(createAnimeTree(-20, 4.2, -4, 1.6, 'green'));     // Lower meadow tree
    treesGroup.add(createAnimeTree(-24, 3.8, 8, 1.8, 'green'));

    // Right hillside trees with warm autumn/amber accents matching Reference.png
    treesGroup.add(createAnimeTree(28, 12.0, -10, 2.6, 'autumn'));
    treesGroup.add(createAnimeTree(36, 15.0, -20, 3.0, 'green'));
    treesGroup.add(createAnimeTree(28, 9.0, 8, 2.5, 'autumn'));

    // Bottom-left foreground sakura accent (matching Reference.png)
    treesGroup.add(createAnimeTree(-44, 0.8, 34, 2.2, 'sakura'));

    this.group.add(treesGroup);
  }

  /**
   * Cottage Placeholder:
   * Japanese rural wooden dwelling clearly visible on the upper-left meadow.
   */
  private createCottagePlaceholder(): void {
    const cottage = new THREE.Group();
    cottage.name = 'CottagePlaceholder';
    cottage.position.set(-20, 5.2, -16);
    cottage.rotation.y = 0.85;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x76634e,
      roughness: 0.9,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x3e3834,
      roughness: 0.85,
      flatShading: true,
    });

    const bodyGeo = new THREE.BoxGeometry(4.8, 2.8, 3.6);
    const body = new THREE.Mesh(bodyGeo, wallMat);
    body.position.y = 1.4;
    body.castShadow = true;
    body.receiveShadow = true;
    cottage.add(body);

    const roofGeo = new THREE.ConeGeometry(4.2, 2.4, 4);
    roofGeo.rotateY(Math.PI / 4);
    roofGeo.scale(1.22, 1.0, 0.95);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.8;
    roof.castShadow = true;
    roof.receiveShadow = true;
    cottage.add(roof);

    this.group.add(cottage);
  }

  /**
   * Meadow Fence:
   * Post-and-rail wooden fence along the meadow ridge.
   */
  private createMeadowFence(): void {
    const fenceGroup = new THREE.Group();
    fenceGroup.name = 'MeadowFence';

    const fenceMat = new THREE.MeshStandardMaterial({
      color: 0x5a4c3e,
      roughness: 0.9,
    });

    const posts = [
      new THREE.Vector3(-18, 4.6, -14),
      new THREE.Vector3(-16, 4.2, -9),
      new THREE.Vector3(-14, 3.8, -4),
      new THREE.Vector3(-13, 3.4, 2),
    ];

    const postGeo = new THREE.CylinderGeometry(0.12, 0.15, 1.5, 8);
    const railGeo = new THREE.CylinderGeometry(0.08, 0.08, 5.2, 8);
    railGeo.rotateZ(Math.PI / 2);

    for (let i = 0; i < posts.length; i++) {
      const p = posts[i];
      const postMesh = new THREE.Mesh(postGeo, fenceMat);
      postMesh.position.set(p.x, p.y + 0.75, p.z);
      postMesh.castShadow = true;
      fenceGroup.add(postMesh);

      if (i < posts.length - 1) {
        const next = posts[i + 1];
        const mid = p.clone().lerp(next, 0.5);
        const rail = new THREE.Mesh(railGeo, fenceMat);
        rail.position.set(mid.x, mid.y + 0.85, mid.z);
        rail.lookAt(next.x, next.y + 0.85, next.z);
        rail.rotateY(Math.PI / 2);
        rail.castShadow = true;
        fenceGroup.add(rail);
      }
    }

    this.group.add(fenceGroup);
  }

  /**
   * Stepping Stones:
   * Flat anime riverbank stepping stones leading from meadow path toward water.
   */
  private createSteppingStones(): void {
    const stoneGroup = new THREE.Group();
    stoneGroup.name = 'SteppingStones';

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x948f84,
      roughness: 0.85,
      flatShading: false,
    });

    const stonePositions = [
      new THREE.Vector3(-16, 3.0, -10),
      new THREE.Vector3(-15, 2.5, -6),
      new THREE.Vector3(-13, 1.9, -2),
      new THREE.Vector3(-11, 1.4, 2),
    ];

    stonePositions.forEach((pos, idx) => {
      const geo = new THREE.CylinderGeometry(1.2 - idx * 0.12, 1.4 - idx * 0.12, 0.45, 12);
      const stone = new THREE.Mesh(geo, stoneMat);
      stone.position.copy(pos);
      stone.rotation.y = idx * 0.7;
      stone.castShadow = true;
      stone.receiveShadow = true;
      stoneGroup.add(stone);
    });

    this.group.add(stoneGroup);
  }

  /**
   * Atmospheric Foreground Mist:
   * Soft clouds drifting over the corner trees.
   */
  private createAtmosphericMist(): void {
    const mistGroup = new THREE.Group();
    mistGroup.name = 'ForegroundMist';

    const mistMat = new THREE.MeshBasicMaterial({
      color: 0xeff5f8,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });

    const mistSpheres = [
      { x: 38, y: 14.0, z: 38, r: 7.5 },
      { x: 44, y: 16.5, z: 40, r: 9.0 },
      { x: 34, y: 11.5, z: 44, r: 6.5 },
    ];

    mistSpheres.forEach((m) => {
      const geo = new THREE.SphereGeometry(m.r, 16, 12);
      const mesh = new THREE.Mesh(geo, mistMat);
      mesh.position.set(m.x, m.y, m.z);
      mesh.scale.set(1.4, 0.45, 1.0);
      mistGroup.add(mesh);
    });

    this.group.add(mistGroup);
  }
}
