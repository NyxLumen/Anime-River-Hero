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
      [-18, -14],
      [-16, -9],
      [-14, -4],
      [-13, 2],
      [-14, 8],
    ];

    const postGeo = new THREE.CylinderGeometry(0.12, 0.15, 1.5, 8);
    const railGeo = new THREE.CylinderGeometry(0.08, 0.08, 5.2, 8);
    railGeo.rotateZ(Math.PI / 2);

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

    for (let i = 0; i < postPositions.length - 1; i++) {
      const p = postPositions[i];
      const next = postPositions[i + 1];
      const mid = p.clone().lerp(next, 0.5);

      const rail = new THREE.Mesh(railGeo, fenceMat);
      rail.position.set(mid.x, mid.y + 0.85, mid.z);
      rail.lookAt(next.x, next.y + 0.85, next.z);
      rail.rotateY(Math.PI / 2);
      rail.castShadow = true;
      fenceGroup.add(rail);
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
      [-16, -10],
      [-15, -6],
      [-13, -2],
      [-11, 2],
      [-9.5, 5],
    ];

    stoneCoords.forEach(([x, z], idx) => {
      const y = this.terrain.getHeightAt(x, z).y;
      const geo = new THREE.CylinderGeometry(1.2 - idx * 0.12, 1.4 - idx * 0.12, 0.45, 12);
      const stone = new THREE.Mesh(geo, stoneMat);
      stone.position.set(x, y + 0.15, z);
      stone.rotation.y = idx * 0.7;
      stone.castShadow = true;
      stone.receiveShadow = true;
      stoneGroup.add(stone);
    });

    this.group.add(stoneGroup);
  }

  /**
   * Atmospheric Foreground Mist:
   * Soft hand-painted anime clouds drifting over the foreground framing trees.
   */
  private createAtmosphericMist(): void {
    const mistGroup = new THREE.Group();
    mistGroup.name = 'ForegroundMist';

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 252, 246, 0.42)');
    grad.addColorStop(0.55, 'rgba(236, 244, 248, 0.22)');
    grad.addColorStop(1, 'rgba(220, 232, 240, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const mistTex = new THREE.CanvasTexture(canvas);

    const mistMat = new THREE.MeshBasicMaterial({
      map: mistTex,
      transparent: true,
      opacity: 0.35,
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
