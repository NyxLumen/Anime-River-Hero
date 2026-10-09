import * as THREE from 'three';

export class Lighting {
  public readonly group: THREE.Group;
  public readonly sunLight: THREE.DirectionalLight;
  public readonly hemiLight: THREE.HemisphereLight;
  public readonly ambientLight: THREE.AmbientLight;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'LightingGroup';

    // 1. Warm Directional Sunlight (Late afternoon / Golden hour)
    // Radiant pale gold sunlight pouring down from top-right
    const sunColor = new THREE.Color(0xfff4dc);
    this.sunLight = new THREE.DirectionalLight(sunColor, 1.85);
    this.sunLight.position.set(75, 100, -70);
    this.sunLight.target.position.set(0, 0, 0);

    // Soft Shadow configuration for painterly anime transitions
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.bias = 0.00015;
    this.sunLight.shadow.normalBias = 0.04; // Eliminates shadow acne on foliage cones and curved bark
    this.sunLight.shadow.radius = 2.5; // Smooth painterly penumbra without speckled noise

    // Expand frustum to cover full visible scene and avoid harsh shadow box cutoffs
    const d = 140;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 300;
    this.sunLight.shadow.camera.updateProjectionMatrix();

    this.group.add(this.sunLight);
    this.group.add(this.sunLight.target);

    // 2. Hemisphere Light (Soft anime sky blue-teal + warm golden-olive ground bounce)
    // Calibrated fill ensures shaded areas maintain luminous anime watercolor color with clear contrast
    const skyColor = new THREE.Color(0x8abed4);    // Luminous anime sky blue-teal
    const groundColor = new THREE.Color(0x628046); // Warm golden-olive bounce
    this.hemiLight = new THREE.HemisphereLight(skyColor, groundColor, 1.05);
    this.hemiLight.position.set(0, 60, 0);
    this.group.add(this.hemiLight);

    // 3. Warm Ambient Fill
    const ambientColor = new THREE.Color(0xfff4de);
    this.ambientLight = new THREE.AmbientLight(ambientColor, 0.28);
    this.group.add(this.ambientLight);
  }
}
