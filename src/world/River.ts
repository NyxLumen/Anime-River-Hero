import * as THREE from 'three';
import { createRiverRibbonGeometry, SplinePointConfig } from '../utils/SplineUtils';
import { RiverMaterial } from './RiverMaterial';

export class River {
  public readonly group: THREE.Group;
  public readonly waterMesh: THREE.Mesh;
  public readonly bedMesh: THREE.Mesh;
  public readonly riverMaterial: RiverMaterial;
  public readonly curve: THREE.CatmullRomCurve3;
  public readonly splineConfigs: SplinePointConfig[];

  constructor(sunDirection?: THREE.Vector3) {
    this.group = new THREE.Group();
    this.group.name = 'RiverSystem';

    // 1. Centerline Spline Points & Wide Hero Proportions
    // Flows diagonally TOP-RIGHT (+X, -Z) -> BOTTOM-LEFT (-X, +Z)
    // S-curve swells into a grand turquoise pool occupying 38-44% of the visual composition,
    // establishing the river as the undisputed centerpiece of the painting.
    this.splineConfigs = [
      { point: new THREE.Vector3(46, 7.2, -46), width: 20.0 },   // Distant sunlit headwaters
      { point: new THREE.Vector3(32, 5.2, -30), width: 25.0 },   // Sunlit upper rapids
      { point: new THREE.Vector3(18, 3.4, -16), width: 30.0 },   // Upper bend entering valley
      { point: new THREE.Vector3(3, 1.8, -3), width: 37.0 },     // Opening into wide basin
      { point: new THREE.Vector3(-9, 0.6, 9), width: 43.0 },     // Majestic central pool (hero expanse)
      { point: new THREE.Vector3(-22, -0.4, 22), width: 34.0 },  // Lower neck curving past promontory
      { point: new THREE.Vector3(-35, -1.4, 35), width: 36.0 },  // Foreground rapids
      { point: new THREE.Vector3(-50, -2.5, 50), width: 42.0 },  // Exiting canvas bottom-left
    ];

    // 2. Generate Water Surface Mesh
    const waterRibbon = createRiverRibbonGeometry(this.splineConfigs, 260, 42, false);
    this.curve = waterRibbon.curve;

    this.riverMaterial = new RiverMaterial({ sunDirection });
    this.waterMesh = new THREE.Mesh(waterRibbon.geometry, this.riverMaterial.material);
    this.waterMesh.receiveShadow = true;
    this.group.add(this.waterMesh);

    // 3. Generate Submerged Riverbed Mesh
    const bedRibbon = createRiverRibbonGeometry(this.splineConfigs, 180, 28, true);
    const bedMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3830, // Deep jade & dark mossy riverbed silt
      roughness: 0.92,
      metalness: 0.04,
      flatShading: true,
    });
    this.bedMesh = new THREE.Mesh(bedRibbon.geometry, bedMaterial);
    this.bedMesh.position.y -= 0.25;
    this.bedMesh.receiveShadow = true;
    this.group.add(this.bedMesh);
  }

  public update(time: number, sunDir?: THREE.Vector3): void {
    this.riverMaterial.update(time, sunDir);
  }
}
