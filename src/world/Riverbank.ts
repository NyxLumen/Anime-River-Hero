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

    // Shoreline transitions: smooth water-worn pebbles, organic moss cushions, and riparian reeds
    this.createShoreStones();
    this.createShoreMossPatches();
    this.createBankReeds();
  }

  /**
   * 1. Smooth Water-Worn Shore Stones
   * Rounded pebbles and gravel nestled right at the water/land boundary with natural color variation.
   */
  private createShoreStones(): void {
    const stoneCount = 320;

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
      color: 0xffffff, // Tinted via instanceColor
      roughness: 0.82,
      metalness: 0.03,
      flatShading: false,
    });

    const mesh = new THREE.InstancedMesh(stoneGeo, stoneMat, stoneCount);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Material variety: sunlit warm granite gravel, pale river limestone, warm river silt, moss stone
    const pebblePalette = [
      new THREE.Color(0xd8cca8), // Sunlit warm granite pebble
      new THREE.Color(0x6a6456), // Wet warm river gravel
      new THREE.Color(0x8a9896), // Cool slate river gravel
      new THREE.Color(0x768c58), // Moss-dusted shoreline pebble
      new THREE.Color(0xb2a48e), // Earthen bank gravel
      new THREE.Color(0xe4dac8), // Pale water-worn limestone pebble
    ];

    const dummy = new THREE.Object3D();
    const tempCol = new THREE.Color();
    let placed = 0;

    const sampleCount = 80;
    for (let i = 0; i < sampleCount && placed < stoneCount; i++) {
      const t = i / sampleCount;

      // Cluster pebbles naturally in calm shallow bays and gravel bars (t: 0.35 .. 0.75)
      // leaving steep bluffs and rapids rocky edges clean
      const inGravelBarZone = (t > 0.32 && t < 0.78) || seededRandom(i * 4.3) > 0.65;
      if (!inGravelBarZone) continue;

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

      // Cluster 3-6 stones at this gravel bar
      const clusterSize = Math.floor(seededRandom(i * 3.1) * 4) + 2;
      for (let s = 0; s < clusterSize && placed < stoneCount; s++) {
        // Gravel bars mostly form along the left shallow bank
        const side = seededRandom(i * 5.7 + s * 1.3) > 0.25 ? -1 : 1;
        const bankOffset = (seededRandom(i * 7.1 + s) - 0.35) * 2.2;
        const dist = (side === 1 ? halfW : -halfW) + (side * bankOffset);

        const pos = center.clone().addScaledVector(normal, dist);
        pos.x += (seededRandom(i * 9.2 + s * 2.1) - 0.5) * 1.8;
        pos.z += (seededRandom(i * 11.4 + s * 3.1) - 0.5) * 1.8;

        const tInfo = this.terrain.getHeightAt(pos.x, pos.z);
        const y = Math.max(center.y - 0.12, tInfo.y - 0.04);

        dummy.position.set(pos.x, y, pos.z);
        dummy.rotation.set(
          seededRandom(i + s) * 0.4,
          seededRandom(i + s * 2) * Math.PI * 2,
          seededRandom(i + s * 3) * 0.4
        );
        const scale = 0.45 + seededRandom(i * 13.5 + s) * 0.85;
        dummy.scale.set(scale, scale * 0.70, scale);
        dummy.updateMatrix();

        mesh.setMatrixAt(placed, dummy.matrix);

        const isNearWater = y <= center.y + 0.08;
        if (isNearWater && seededRandom(i * 19.1 + s) > 0.5) {
          tempCol.copy(pebblePalette[1]); // Wet river pebble
        } else {
          const colIdx = Math.floor(seededRandom(i * 17.3 + s * 2.7) * pebblePalette.length);
          tempCol.copy(pebblePalette[colIdx]);
        }
        mesh.setColorAt(placed, tempCol);

        placed++;
      }
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.group.add(mesh);
  }

  /**
   * 2. Shoreline Velvet Moss Cushions
   * Soft, organic flattened moss mounds nestled right at the water/land boundary.
   */
  private createShoreMossPatches(): void {
    const patchCount = 75;

    const mossGeo = new THREE.SphereGeometry(0.85, 10, 8);
    const pos = mossGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) * 0.35;
      let x = pos.getX(i);
      let z = pos.getZ(i);
      const angle = Math.atan2(z, x);
      x *= 1.0 + Math.sin(angle * 2.0) * 0.2;
      z *= 1.0 + Math.cos(angle * 2.0) * 0.2;
      pos.setXYZ(i, x, y, z);
    }
    mossGeo.computeVertexNormals();

    const mossMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.01,
    });

    const mesh = new THREE.InstancedMesh(mossGeo, mossMat, patchCount);
    mesh.receiveShadow = true;

    const mossColors = [
      new THREE.Color(0x5e8c36), // Vibrant velvet moss
      new THREE.Color(0x76a440), // Sunlit golden-moss
      new THREE.Color(0x4a722c), // Deep damp moss
      new THREE.Color(0x6b8a48), // Muted shoreline lichen
    ];

    const dummy = new THREE.Object3D();
    const tempCol = new THREE.Color();
    let placed = 0;

    const sampleCount = 50;
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
      const pos = center.clone().addScaledVector(normal, side * (halfW + 0.4));

      const tInfo = this.terrain.getHeightAt(pos.x, pos.z);
      dummy.position.set(pos.x, tInfo.y - 0.04, pos.z);
      dummy.rotation.y = seededRandom(i * 4.9) * Math.PI * 2;
      const scale = 0.65 + seededRandom(i * 6.3) * 0.55;
      dummy.scale.set(scale, scale * 0.5, scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(placed, dummy.matrix);

      const cIdx = Math.floor(seededRandom(i * 8.1) * mossColors.length);
      tempCol.copy(mossColors[cIdx]);
      mesh.setColorAt(placed, tempCol);

      placed++;
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
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
