import * as THREE from 'three';
import { Cottage } from './Cottage';
import { Terrain } from './Terrain';

export class Environment {
  public readonly group: THREE.Group;
  public readonly cottage: Cottage;
  private terrain: Terrain;

  constructor(terrain: Terrain) {
    this.group = new THREE.Group();
    this.group.name = 'EnvironmentGroup';
    this.terrain = terrain;

    // 1. Stylized Japanese Countryside Cottage (anchored to terrain)
    this.cottage = new Cottage(this.terrain);
    this.group.add(this.cottage.group);

    // 2. Meadow Fence along the ridgeline (anchored to terrain)
    this.createMeadowFence();

    // 3. Stepping stones path from meadow toward water (anchored to terrain)
    this.createSteppingStones();

    // 4. Atmospheric soft mist
    this.createAtmosphericMist();

    // 5. Drifting cherry blossom petals on the wind
    this.createDriftingPetals();
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

    const postCoords = [
      [-25, -15],
      [-23.5, -11],
      [-22, -7],
      [-20.5, -3],
    ];

    const postGeo = new THREE.CylinderGeometry(0.10, 0.13, 1.4, 8);
    const postPositions: THREE.Vector3[] = [];

    for (let i = 0; i < postCoords.length; i++) {
      const [x, z] = postCoords[i];
      const y = this.terrain.getHeightAt(x, z).y;
      const pos = new THREE.Vector3(x, y, z);
      postPositions.push(pos);

      const postMesh = new THREE.Mesh(postGeo, fenceMat);
      postMesh.position.set(x, y + 0.75, z);
      postMesh.castShadow = true;
      fenceGroup.add(postMesh);
    }

    // Connect posts with upper and lower horizontal timber rails
    const upUnit = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < postPositions.length - 1; i++) {
      const p = postPositions[i];
      const next = postPositions[i + 1];

      // Upper rail (y + 0.90) and Lower rail (y + 0.52)
      const railHeights = [0.90, 0.52];
      railHeights.forEach((rh) => {
        const start = new THREE.Vector3(p.x, p.y + rh, p.z);
        const end = new THREE.Vector3(next.x, next.y + rh, next.z);
        const dist = start.distanceTo(end);
        const dir = end.clone().sub(start).normalize();
        const mid = start.clone().add(end).multiplyScalar(0.5);

        const rGeo = new THREE.CylinderGeometry(0.055, 0.055, dist, 8);
        const rail = new THREE.Mesh(rGeo, fenceMat);
        rail.position.copy(mid);
        rail.quaternion.setFromUnitVectors(upUnit, dir);
        rail.castShadow = true;
        fenceGroup.add(rail);
      });
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

    const stoneCoords = [
      { x: -16.8, z: -11.0, rx: 1.15, rz: 0.85, rot: 0.2 },
      { x: -15.2, z: -6.5,  rx: 0.95, rz: 1.20, rot: 0.8 },
      { x: -13.5, z: -2.0,  rx: 1.25, rz: 0.90, rot: 1.4 },
      { x: -11.2, z: 2.2,   rx: 1.05, rz: 1.10, rot: 2.1 },
      { x: -9.5,  z: 5.5,   rx: 1.10, rz: 0.85, rot: 0.5 },
    ];

    stoneCoords.forEach((s) => {
      const y = this.terrain.getHeightAt(s.x, s.z).y;
      // Low-profile weathered flagstone (natural Japanese tobi-ishi)
      const geo = new THREE.CylinderGeometry(0.85, 0.95, 0.12, 8);
      const stone = new THREE.Mesh(geo, stoneMat);
      stone.position.set(s.x, y + 0.04, s.z);
      stone.scale.set(s.rx, 1.0, s.rz);
      stone.rotation.y = s.rot;
      stone.castShadow = true;
      stone.receiveShadow = true;
      stoneGroup.add(stone);
    });

    this.group.add(stoneGroup);
  }

  /**
   * Atmospheric Foreground Mist & Cloud Billows:
   * Painterly anime cumulus puffs drifting across the foreground framing trees
   * and valley swales (matching Reference.png).
   */
  private createAtmosphericMist(): void {
    const mistGroup = new THREE.Group();
    mistGroup.name = 'ForegroundMist';

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Layered soft watercolor cumulus puffs with sunlit warmth & atmospheric blue
    const puffs = [
      { x: 256, y: 230, r: 170, col: 'rgba(255, 252, 244, 0.65)' },
      { x: 160, y: 270, r: 140, col: 'rgba(255, 246, 238, 0.48)' },
      { x: 350, y: 260, r: 145, col: 'rgba(255, 248, 240, 0.52)' },
      { x: 256, y: 340, r: 150, col: 'rgba(228, 240, 250, 0.35)' },
      { x: 180, y: 190, r: 120, col: 'rgba(255, 254, 248, 0.70)' },
      { x: 330, y: 180, r: 125, col: 'rgba(255, 254, 248, 0.72)' },
    ];

    puffs.forEach((p) => {
      const grad = ctx.createRadialGradient(p.x, p.y - p.r * 0.2, p.r * 0.1, p.x, p.y, p.r);
      grad.addColorStop(0, p.col);
      grad.addColorStop(0.55, 'rgba(240, 246, 252, 0.30)');
      grad.addColorStop(0.85, 'rgba(220, 234, 248, 0.12)');
      grad.addColorStop(1.0, 'rgba(210, 225, 240, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    const mistTex = new THREE.CanvasTexture(canvas);
    mistTex.generateMipmaps = true;

    const mistMat = new THREE.MeshBasicMaterial({
      map: mistTex,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Cloud clusters:
    // Cluster 1: Iconic anime foreground bottom-right framing cumulus clouds (Reference.png)
    const fgClouds = [
      { x: 20, y: 50.0, z: 36, scale: 20 },
      { x: 25, y: 54.0, z: 40, scale: 24 },
      { x: 15, y: 46.0, z: 32, scale: 16 },
      { x: 28, y: 58.0, z: 44, scale: 26 },
      // Cluster 2: Valley bluff swales
      { x: 34, y: 22.0, z: 36, scale: 18 },
      { x: 38, y: 24.0, z: 42, scale: 20 },
      // Cluster 3: Upper Gorge Cascade Mist rising from rapids
      { x: 44, y: 14.0, z: -38, scale: 20 },
      { x: 52, y: 18.0, z: -48, scale: 24 },
      // Cluster 4: Distant Foothill Mist
      { x: -38, y: 16.0, z: -30, scale: 20 },
    ];

    const planeGeo = new THREE.PlaneGeometry(1, 1);
    const cameraPos = new THREE.Vector3(6, 72, 54);

    fgClouds.forEach((c) => {
      const mesh = new THREE.Mesh(planeGeo, mistMat);
      mesh.position.set(c.x, c.y, c.z);
      mesh.scale.set(c.scale * 1.5, c.scale * 1.0, 1);
      mesh.lookAt(cameraPos);
      mesh.renderOrder = 20;
      mistGroup.add(mesh);
    });

    // Radiant Golden Gorge Sunburst (Matching Reference.png top-right sunlit gorge)
    const sunCanvas = document.createElement('canvas');
    sunCanvas.width = 512;
    sunCanvas.height = 512;
    const sCtx = sunCanvas.getContext('2d')!;
    const sGrad = sCtx.createRadialGradient(256, 256, 10, 256, 256, 250);
    sGrad.addColorStop(0.0, 'rgba(255, 255, 245, 0.70)');
    sGrad.addColorStop(0.24, 'rgba(255, 242, 200, 0.45)');
    sGrad.addColorStop(0.52, 'rgba(255, 222, 150, 0.22)');
    sGrad.addColorStop(0.80, 'rgba(255, 200, 120, 0.08)');
    sGrad.addColorStop(1.0, 'rgba(255, 185, 95, 0.0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 512, 512);

    const sunTex = new THREE.CanvasTexture(sunCanvas);
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const sunQuad = new THREE.Mesh(new THREE.PlaneGeometry(42, 32), sunMat);
    sunQuad.position.set(56, 28, -52);
    sunQuad.lookAt(cameraPos);
    sunQuad.renderOrder = 25;
    mistGroup.add(sunQuad);

    this.group.add(mistGroup);
  }

  /**
   * Drifting Sakura Blossom Petals:
   * Delicate, subtle pink petals drifting gently under the cottage cherry blossom canopy.
   */
  private createDriftingPetals(): void {
    const petalGroup = new THREE.Group();
    petalGroup.name = 'DriftingSakuraPetals';

    const petalGeo = new THREE.BufferGeometry();
    const w = 0.09;
    const h = 0.13;
    // Delicate curved petal quad
    const verts = [
      -w, 0, -h,
       w, 0, -h,
       w * 0.6, 0.04, h,
      -w * 0.6, 0.04, h,
    ];
    const uvs = [0, 0, 1, 0, 1, 1, 0, 1];
    const indices = [0, 1, 2, 0, 2, 3];
    petalGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    petalGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    petalGeo.setIndex(indices);
    petalGeo.computeVertexNormals();

    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xf8c8d8,
      emissive: 0xebb4c6,
      emissiveIntensity: 0.20,
      roughness: 0.82,
      side: THREE.DoubleSide,
    });

    const petalCount = 36;
    const instancedMesh = new THREE.InstancedMesh(petalGeo, petalMat, petalCount);
    instancedMesh.castShadow = false;
    instancedMesh.receiveShadow = false;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < petalCount; i++) {
      // Clustered under the cherry blossom grove around cottage
      const px = -27 + (i % 6) * 1.8 + (Math.sin(i * 3.7) - 0.5) * 2.0;
      const pz = -23 + Math.floor(i / 6) * 1.6 + (Math.cos(i * 4.3) - 0.5) * 2.0;
      const groundY = this.terrain.getHeightAt(px, pz).y;
      const py = groundY + 0.5 + (i % 5) * 0.6 + Math.sin(i * 2.1) * 0.4;

      dummy.position.set(px, py, pz);
      dummy.rotation.set(
        Math.sin(i * 2.3) * 0.6,
        (i * 1.7) % (Math.PI * 2),
        Math.cos(i * 3.1) * 0.6
      );
      const s = 0.75 + (i % 4) * 0.20;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();

      instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.renderOrder = 15;
    petalGroup.add(instancedMesh);

    this.group.add(petalGroup);
  }
}
