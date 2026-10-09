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
    const sunColor = new THREE.Color(0xfff3d6);
    this.sunLight = new THREE.DirectionalLight(sunColor, 1.62);
    // Position light source farther back along the afternoon sun ray to encompass distant canyon hills
    this.sunLight.position.set(85, 112, -85);
    this.sunLight.target.position.set(0, 0, 0);

    // Soft Shadow configuration for painterly anime transitions
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.radius = 4.2; // Soft penumbra filter

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
    // Generous ambient fill ensures shaded areas maintain luminous anime watercolor color
    const skyColor = new THREE.Color(0x82b4cc);    // Soft anime sky blue-teal
    const groundColor = new THREE.Color(0x6e8850); // Warm golden-olive bounce
    this.hemiLight = new THREE.HemisphereLight(skyColor, groundColor, 1.55);
    this.hemiLight.position.set(0, 60, 0);
    this.group.add(this.hemiLight);

    // 3. Warm Ambient Fill
    const ambientColor = new THREE.Color(0xfff0da);
    this.ambientLight = new THREE.AmbientLight(ambientColor, 0.52);
    this.group.add(this.ambientLight);
  }
}
