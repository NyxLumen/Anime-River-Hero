import * as THREE from 'three';

export class AppScene {
  public readonly instance: THREE.Scene;

  constructor() {
    this.instance = new THREE.Scene();

    // Stylized anime sky background tint (soft blue-green / pale blue)
    const skyColor = new THREE.Color(0x98b8c4);
    this.instance.background = skyColor;

    // Atmospheric aerial perspective fog:
    // Progressive loss of contrast and saturation in the distance
    const fogColor = new THREE.Color(0xb2cad0);
    this.instance.fog = new THREE.Fog(fogColor, 45, 170);
  }
}
