import * as THREE from 'three';
import { SplinePointConfig } from '../utils/SplineUtils';
import { Terrain } from './Terrain';

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export class Riverbank {
  public readonly group: THREE.Group;
  private terrain: Terrain;
  private riverCurve: THREE.CatmullRomCurve3;
  private splineConfigs: SplinePointConfig[];

  constructor(
    riverCurve: THREE.CatmullRomCurve3,
    splineConfigs: SplinePointConfig[],
    terrain: Terrain
  ) {
    this.group = new THREE.Group();
    this.group.name = 'RiverbankGroup';
    this.riverCurve = riverCurve;
    this.splineConfigs = splineConfigs;
    this.terrain = terrain;

    this.createShallowWaterTransition();
    this.createShoreStones();
    this.createShoreSoilPatches();
    this.createBankReeds();
  }

  /**
   * 1. Shallow Water Transition
   * Subtle translucent jade ribbons hugging the shoreline for natural anime water edge depth.
   */
  private createShallowWaterTransition(): void {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x48a896, // Clear jade shallows
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const sampleCount = 90;
    const geo = new THREE.PlaneGeometry(3.2, 1.8);
    geo.rotateX(-Math.PI / 2);

    const mesh = new THREE.InstancedMesh(geo, mat, sampleCount * 2);
    mesh.castShadow = false;

    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let i = 0; i <= sampleCount; i++) {
      const t = i / sampleCount;
      const center = this.riverCurve.getPointAt(t);
      const tangent = this.riverCurve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Get width at t
      const n = this.splineConfigs.length - 1;
      const scaledT = t * n;
      const sIdx = Math.min(Math.floor(scaledT), n - 1);
      const frac = scaledT - sIdx;
      const width = THREE.MathUtils.lerp(
        this.splineConfigs[sIdx].width,
        this.splineConfigs[sIdx + 1].width,
        frac
      );
      const halfW = width * 0.5;

      const angle = Math.atan2(tangent.x, tangent.z);

      // Left Bank shallow transition
      const leftPos = center.clone().addScaledVector(normal, halfW - 0.9);
      dummy.position.set(leftPos.x, center.y + 0.02, leftPos.z);
      dummy.rotation.set(0, angle, 0);
      dummy.scale.set(1.0 + seededRandom(i * 1.5) * 0.4, 1, 0.9 + seededRandom(i * 2.3) * 0.3);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx++, dummy.matrix);

      // Right Bank shallow transition
      const rightPos = center.clone().addScaledVector(normal, -halfW + 0.9);
      dummy.position.set(rightPos.x, center.y + 0.02, rightPos.z);
      dummy.rotation.set(0, angle, 0);
      dummy.scale.set(1.0 + seededRandom(i * 3.1) * 0.4, 1, 0.9 + seededRandom(i * 4.1) * 0.3);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx++, dummy.matrix);
    }

    mesh.count = idx;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * 2. Smooth Water-Worn Shore Stones
   * Rounded pebbles and gravel nestled right at the water/land boundary.
   */
  private createShoreStones(): void {
    const stoneCount = 180;

    // Smooth flattened pebble geometry (continuous curvature, no pinching)
    const stoneGeo = new THREE.SphereGeometry(0.35, 10, 8);
    const posAttr = stoneGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      let y = posAttr.getY(i) * 0.55;
      let x = posAttr.getX(i) * (1.0 + Math.sin(posAttr.getZ(i) * 3.0) * 0.15);
      posAttr.setXY(i, x, y);
    }
    stoneGeo.computeVertexNormals();

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x8e877c, // Weathered river gravel
      roughness: 0.85,
      metalness: 0.02,
      flatShading: false,
    });

    const mesh = new THREE.InstancedMesh(stoneGeo, stoneMat, stoneCount);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;

    const sampleCount = 60;
    for (let i = 0; i < sampleCount && placed < stoneCount; i++) {
      const t = i / sampleCount;
      const center = this.riverCurve.getPointAt(t);
      const tangent = this.riverCurve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const n = this.splineConfigs.length - 1;
      const scaledT = t * n;
      const sIdx = Math.min(Math.floor(scaledT), n - 1);
      const frac = scaledT - sIdx;
      const width = THREE.MathUtils.lerp(
        this.splineConfigs[sIdx].width,
        this.splineConfigs[sIdx + 1].width,
        frac
      );
      const halfW = width * 0.5;

      // Cluster 2-4 stones at this sample
      const clusterSize = Math.floor(seededRandom(i * 3.1) * 3) + 1;
      for (let s = 0; s < clusterSize && placed < stoneCount; s++) {
        const side = seededRandom(i * 5.7 + s * 1.3) > 0.4 ? 1 : -1;
        const bankOffset = (seededRandom(i * 7.1 + s) - 0.5) * 1.8;
        const dist = (side === 1 ? halfW : -halfW) + (side * bankOffset);

        const pos = center.clone().addScaledVector(normal, dist);
        pos.x += (seededRandom(i * 9.2 + s * 2.1) - 0.5) * 1.5;
        pos.z += (seededRandom(i * 11.4 + s * 3.1) - 0.5) * 1.5;

        const tInfo = this.terrain.getHeightAt(pos.x, pos.z);
        // Place stone flush with terrain/waterline
        const y = Math.max(center.y - 0.15, tInfo.y - 0.05);

        dummy.position.set(pos.x, y, pos.z);
        dummy.rotation.set(
          seededRandom(i + s) * 0.4,
          seededRandom(i + s * 2) * Math.PI * 2,
          seededRandom(i + s * 3) * 0.4
        );
        const scale = 0.55 + seededRandom(i * 13.5 + s) * 0.9;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        mesh.setMatrixAt(placed, dummy.matrix);
        placed++;
      }
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * 3. Shoreline Soil & Exposed Silt Discs
   * Weathered earthen discs breaking up the polygon edge between bank and river.
   */
  private createShoreSoilPatches(): void {
    const patchCount = 65;

    const soilGeo = new THREE.CylinderGeometry(1.1, 1.3, 0.12, 10);
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x5a4c3a, // Earthen cut-bank soil
      roughness: 0.94,
      metalness: 0.02,
    });

    const mesh = new THREE.InstancedMesh(soilGeo, soilMat, patchCount);
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;

    const sampleCount = 45;
    for (let i = 0; i < sampleCount && placed < patchCount; i++) {
      const t = i / sampleCount;
      const center = this.riverCurve.getPointAt(t);
      const tangent = this.riverCurve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const n = this.splineConfigs.length - 1;
      const scaledT = t * n;
      const sIdx = Math.min(Math.floor(scaledT), n - 1);
      const frac = scaledT - sIdx;
      const width = THREE.MathUtils.lerp(
        this.splineConfigs[sIdx].width,
        this.splineConfigs[sIdx + 1].width,
        frac
      );
      const halfW = width * 0.5;

      const side = seededRandom(i * 2.7) > 0.35 ? 1 : -1;
      const pos = center.clone().addScaledVector(normal, side * (halfW + 0.3));

      const tInfo = this.terrain.getHeightAt(pos.x, pos.z);
      dummy.position.set(pos.x, tInfo.y - 0.02, pos.z);
      dummy.rotation.y = seededRandom(i * 4.9) * Math.PI * 2;
      const scale = 0.75 + seededRandom(i * 6.3) * 0.65;
      dummy.scale.set(scale, 1, scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * 4. Shoreline Bank Reeds (Delicate clusters emerging from water's edge)
   */
  private createBankReeds(): void {
    const reedCount = 120;

    const reedGeo = new THREE.CylinderGeometry(0.02, 0.045, 1.1, 4);
    reedGeo.translate(0, 0.55, 0);

    const reedMat = new THREE.MeshStandardMaterial({
      color: 0x98a44d, // Golden olive water reed
      roughness: 0.85,
    });

    const mesh = new THREE.InstancedMesh(reedGeo, reedMat, reedCount);
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let placed = 0;

    const sampleCount = 40;
    for (let i = 0; i < sampleCount && placed < reedCount; i++) {
      const t = i / sampleCount;
      const center = this.riverCurve.getPointAt(t);
      const tangent = this.riverCurve.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const n = this.splineConfigs.length - 1;
      const scaledT = t * n;
      const sIdx = Math.min(Math.floor(scaledT), n - 1);
      const frac = scaledT - sIdx;
      const width = THREE.MathUtils.lerp(
        this.splineConfigs[sIdx].width,
        this.splineConfigs[sIdx + 1].width,
        frac
      );
      const halfW = width * 0.5;

      // Group 2-3 reeds together
      for (let r = 0; r < 3 && placed < reedCount; r++) {
        const offset = halfW + (seededRandom(i * 3.3 + r) - 0.3) * 1.2;
        const pos = center.clone().addScaledVector(normal, offset);
        pos.x += (seededRandom(i * 5.1 + r) - 0.5) * 0.6;
        pos.z += (seededRandom(i * 7.7 + r) - 0.5) * 0.6;

        const tInfo = this.terrain.getHeightAt(pos.x, pos.z);
        dummy.position.set(pos.x, tInfo.y - 0.02, pos.z);
        dummy.rotation.set(
          (seededRandom(i + r * 2) - 0.5) * 0.22,
          seededRandom(i * 2 + r) * Math.PI * 2,
          (seededRandom(i + r * 3) - 0.5) * 0.22
        );
        const scale = 0.75 + seededRandom(i * 9.1 + r) * 0.65;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        mesh.setMatrixAt(placed, dummy.matrix);
        placed++;
      }
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    this.group.add(mesh);
  }
}
