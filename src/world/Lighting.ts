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
    // Streaming from the upper-right quadrant, illuminating water glints and rock ridges
    const sunColor = new THREE.Color(0xfff6e4);
    this.sunLight = new THREE.DirectionalLight(sunColor, 1.75);
    this.sunLight.position.set(38, 50, -38);
    this.sunLight.target.position.set(-2, 0, -2);

    // Shadow configuration
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.bias = -0.0003;

    const d = 70;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 170;

    this.group.add(this.sunLight);
    this.group.add(this.sunLight.target);

    // 2. Hemisphere Light (Soft anime sky dome + warm golden-olive bounce)
    // High intensity ensures shaded slopes have luminous anime watercolor tonality, never dark black
    const skyColor = new THREE.Color(0x9cc8ea);    // Soft cerulean sky
    const groundColor = new THREE.Color(0x768c54); // Warm golden meadow bounce
    this.hemiLight = new THREE.HemisphereLight(skyColor, groundColor, 1.35);
    this.hemiLight.position.set(0, 60, 0);
    this.group.add(this.hemiLight);

    // 3. Warm Ambient Fill
    const ambientColor = new THREE.Color(0xfff2e2);
    this.ambientLight = new THREE.AmbientLight(ambientColor, 0.48);
    this.group.add(this.ambientLight);
  }
}
