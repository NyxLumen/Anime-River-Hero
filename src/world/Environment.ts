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
   * Foreground Layer:
   * Dark, saturated conifer silhouettes in the bottom-right corner.
   * Kept strictly at the corner edge to frame without obstructing.
   */
  private createForegroundFraming(): void {
    const fgGroup = new THREE.Group();
    fgGroup.name = 'ForegroundFraming';

    const fgFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x1a362a, // Saturated dark forest evergreen
      roughness: 0.85,
      metalness: 0.04,
      flatShading: true,
    });

    const fgTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x221a14,
      roughness: 0.95,
    });

    const createPineTree = (x: number, y: number, z: number, scale: number) => {
      const tree = new THREE.Group();
      tree.position.set(x, y, z);
      tree.scale.setScalar(scale);

      const trunkGeo = new THREE.CylinderGeometry(0.35, 0.65, 6.0, 6);
      const trunk = new THREE.Mesh(trunkGeo, fgTrunkMat);
      trunk.position.y = 3.0;
      trunk.castShadow = true;
      tree.add(trunk);

      const tiers = 5;
      for (let t = 0; t < tiers; t++) {
        const coneRadius = 2.8 - t * 0.45;
        const coneHeight = 3.6 - t * 0.4;
        const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 7);
        const cone = new THREE.Mesh(coneGeo, fgFoliageMat);
        cone.position.y = 4.2 + t * 2.0;
        cone.rotation.y = t * 0.7;
        cone.castShadow = true;
        cone.receiveShadow = true;
        tree.add(cone);
      }

      return tree;
    };

    // Positioned strictly in the bottom-right corner
    fgGroup.add(createPineTree(40, 10.0, 38, 3.2));
    fgGroup.add(createPineTree(48, 14.0, 40, 3.8));
    fgGroup.add(createPineTree(34, 6.0, 46, 2.8));
    fgGroup.add(createPineTree(44, 12.0, 50, 3.5));

    this.group.add(fgGroup);
  }

  /**
   * Midground Trees:
   * Stylized anime foliage trees on the left meadow plateau
   * with cherry blossom accents and right-bank warm autumn foliage (matching Reference.png).
   */
  private createMidgroundTrees(): void {
    const treesGroup = new THREE.Group();
    treesGroup.name = 'MidgroundTrees';

    const foliageMatGreen = new THREE.MeshStandardMaterial({
      color: 0x689a44, // Warm anime green
      roughness: 0.82,
      metalness: 0.04,
      flatShading: true,
    });

    const foliageMatSakura = new THREE.MeshStandardMaterial({
      color: 0xf8becc, // Pastel cherry blossom pink
      roughness: 0.80,
      metalness: 0.03,
      flatShading: true,
    });

    const foliageMatAutumn = new THREE.MeshStandardMaterial({
      color: 0xd6803c, // Warm amber / orange autumn foliage (seen on right bank in Reference.png)
      roughness: 0.82,
      metalness: 0.04,
      flatShading: true,
    });

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x4f4032,
      roughness: 0.9,
    });

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

      const trunkGeo = new THREE.CylinderGeometry(0.35, 0.65, 5.0, 6);
      const trunk = new THREE.Mesh(trunkGeo, woodMat);
      trunk.position.y = 2.5;
      trunk.castShadow = true;
      tree.add(trunk);

      const folMat = type === 'sakura' ? foliageMatSakura : type === 'autumn' ? foliageMatAutumn : foliageMatGreen;
      const puffOffsets = [
        [0, 5.0, 0, 2.3],
        [-1.0, 4.4, 0.7, 1.7],
        [1.0, 4.6, -0.6, 1.6],
        [0.2, 5.8, 0.5, 1.5],
        [-0.6, 5.3, -0.8, 1.4],
      ];

      puffOffsets.forEach(([px, py, pz, pr]) => {
        const puffGeo = new THREE.DodecahedronGeometry(pr, 1);
        const puff = new THREE.Mesh(puffGeo, folMat);
        puff.position.set(px, py, pz);
        puff.castShadow = true;
        puff.receiveShadow = true;
        tree.add(puff);
      });

      return tree;
    };

    // Upper left meadow trees framing cottage & footpath
    treesGroup.add(createAnimeTree(-26, 6.0, -22, 2.2, 'sakura'));   // Sakura behind cottage
    treesGroup.add(createAnimeTree(-16, 5.2, -26, 1.9, 'green'));    // Meadow oak behind cottage
    treesGroup.add(createAnimeTree(-32, 6.4, -12, 2.3, 'sakura'));   // Sakura on meadow slope
    treesGroup.add(createAnimeTree(-20, 4.2, -4, 1.6, 'green'));     // Lower meadow tree
    treesGroup.add(createAnimeTree(-24, 3.8, 8, 1.8, 'green'));

    // Right hillside trees with warm autumn/amber accents matching Reference.png!
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

    const postGeo = new THREE.CylinderGeometry(0.12, 0.15, 1.5, 5);
    const railGeo = new THREE.CylinderGeometry(0.08, 0.08, 5.2, 4);
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
      flatShading: true,
    });

    const stonePositions = [
      new THREE.Vector3(-16, 3.0, -10),
      new THREE.Vector3(-15, 2.5, -6),
      new THREE.Vector3(-13, 1.9, -2),
      new THREE.Vector3(-11, 1.4, 2),
    ];

    stonePositions.forEach((pos, idx) => {
      const geo = new THREE.CylinderGeometry(1.2 - idx * 0.12, 1.4 - idx * 0.12, 0.45, 6);
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
      opacity: 0.36,
      depthWrite: false,
    });

    const mistSpheres = [
      { x: 38, y: 14.0, z: 38, r: 7.5 },
      { x: 44, y: 16.5, z: 40, r: 9.0 },
      { x: 34, y: 11.5, z: 44, r: 6.5 },
    ];

    mistSpheres.forEach((m) => {
      const geo = new THREE.SphereGeometry(m.r, 12, 8);
      const mesh = new THREE.Mesh(geo, mistMat);
      mesh.position.set(m.x, m.y, m.z);
      mesh.scale.set(1.4, 0.45, 1.0);
      mistGroup.add(mesh);
    });

    this.group.add(mistGroup);
  }
}
