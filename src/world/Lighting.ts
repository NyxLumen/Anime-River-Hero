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
    // Warm pale gold sunlight casting soft shadows downriver
    const sunColor = new THREE.Color(0xfff5dd);
    this.sunLight = new THREE.DirectionalLight(sunColor, 1.55);
    this.sunLight.position.set(38, 50, -38);
    this.sunLight.target.position.set(-2, 0, -2);

    // Soft Shadow configuration for painterly anime transitions
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.bias = -0.0002;
    this.sunLight.shadow.radius = 4.0; // Soft penumbra filter

    const d = 70;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 170;

    this.group.add(this.sunLight);
    this.group.add(this.sunLight.target);

    // 2. Hemisphere Light (Soft pale blue-green sky + warm golden-olive ground bounce)
    // Generous ambient fill ensures shaded areas maintain luminous anime watercolor color
    const skyColor = new THREE.Color(0x8eb6c8);    // Soft anime sky blue-green
    const groundColor = new THREE.Color(0x6a7c4c); // Warm golden-olive bounce
    this.hemiLight = new THREE.HemisphereLight(skyColor, groundColor, 1.40);
    this.hemiLight.position.set(0, 60, 0);
    this.group.add(this.hemiLight);

    // 3. Warm Ambient Fill
    const ambientColor = new THREE.Color(0xfff2dc);
    this.ambientLight = new THREE.AmbientLight(ambientColor, 0.42);
    this.group.add(this.ambientLight);
  }
}
