import * as THREE from 'three';

export class AppScene {
  public readonly instance: THREE.Scene;

  constructor() {
    this.instance = new THREE.Scene();

    // Stylized anime sky background tint
    const skyColor = new THREE.Color(0x9fc0d4);
    this.instance.background = skyColor;

    // Soft aerial perspective fog — progressive loss of contrast in distance
    // Matches the painterly anime background depth gradient
    const fogColor = new THREE.Color(0xb2cad4);
    this.instance.fog = new THREE.Fog(fogColor, 40, 150);
  }
}
