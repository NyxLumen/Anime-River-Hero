import * as THREE from 'three';
import { Lighting } from './Lighting';
import { River } from './River';
import { Terrain } from './Terrain';
import { Rocks } from './Rocks';
import { Riverbank } from './Riverbank';
import { Trees } from './Trees';
import { Vegetation } from './Vegetation';
import { Environment } from './Environment';

export class World {
  public readonly scene: THREE.Scene;
  public readonly lighting: Lighting;
  public readonly river: River;
  public readonly terrain: Terrain;
  public readonly rocks: Rocks;
  public readonly riverbank: Riverbank;
  public readonly trees: Trees;
  public readonly vegetation: Vegetation;
  public readonly environment: Environment;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Lighting Setup (warm golden afternoon sun + sky/ground hemisphere bounce)
    this.lighting = new Lighting();
    this.scene.add(this.lighting.group);

    // 2. River System (undisputed centerpiece)
    this.river = new River(this.lighting.sunLight.position);
    this.scene.add(this.river.group);

    // 3. Terrain & Landscape (carved around river spline, with terrain queries)
    this.terrain = new Terrain(this.river.curve, this.river.splineConfigs);
    this.scene.add(this.terrain.group);

    // 4. Weathered Granite Rock Library (hero boulders, mid-stream rapids, shore outcrops)
    this.rocks = new Rocks(this.terrain);
    this.scene.add(this.rocks.group);

    // 5. Riverbank System (carved shoreline details, pebbles, soil discs, shallows ribbon, reeds)
    this.riverbank = new Riverbank(this.river.curve, this.river.splineConfigs, this.terrain);
    this.scene.add(this.riverbank.group);

    // 6. Tree Archetype Library (sakura, green broadleaf, autumn maple, pines, background, framing)
    this.trees = new Trees(this.terrain);
    this.scene.add(this.trees.group);

    // 7. Vegetation Density System (GPU instanced meadow grass, water reeds, bushes, wildflowers)
    this.vegetation = new Vegetation(this.river.curve, this.river.splineConfigs, this.terrain);
    this.scene.add(this.vegetation.group);

    // 8. Environment Features (countryside cottage, meadow fence, stepping stones, soft mist)
    this.environment = new Environment(this.terrain);
    this.scene.add(this.environment.group);
  }

  public update(time: number, _delta: number): void {
    // Update dynamic river shader uniforms
    this.river.update(time, this.lighting.sunLight.position);
  }
}
