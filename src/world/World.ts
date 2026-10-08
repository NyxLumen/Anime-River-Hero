import * as THREE from 'three';
import { Lighting } from './Lighting';
import { River } from './River';
import { Terrain } from './Terrain';
import { Boulders } from './Boulders';
import { Environment } from './Environment';

export class World {
  public readonly scene: THREE.Scene;
  public readonly lighting: Lighting;
  public readonly river: River;
  public readonly terrain: Terrain;
  public readonly boulders: Boulders;
  public readonly environment: Environment;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Lighting Setup
    this.lighting = new Lighting();
    this.scene.add(this.lighting.group);

    // 2. River System (centerpiece)
    this.river = new River(this.lighting.sunLight.position);
    this.scene.add(this.river.group);

    // 3. Terrain & Landscape (carved around river spline)
    this.terrain = new Terrain(this.river.curve, this.river.splineConfigs);
    this.scene.add(this.terrain.group);

    // 4. Granite Boulder Outcrops (mid-stream and shorelines)
    this.boulders = new Boulders();
    this.scene.add(this.boulders.group);

    // 5. Environment & Foliage Framing
    this.environment = new Environment();
    this.scene.add(this.environment.group);
  }

  public update(time: number, _delta: number): void {
    // Update dynamic river shader uniforms
    this.river.update(time, this.lighting.sunLight.position);
  }
}
