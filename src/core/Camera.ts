import * as THREE from 'three';

export class CinematicCamera {
  public readonly instance: THREE.PerspectiveCamera;
  public target: THREE.Vector3;
  private defaultPosition: THREE.Vector3;
  private defaultTarget: THREE.Vector3;

  constructor() {
    const aspect = window.innerWidth / window.innerHeight;

    // 45° FOV provides natural cinematic perspective matching anime background art
    this.instance = new THREE.PerspectiveCamera(45, aspect, 1.0, 600);

    // Elevated aerial vantage point (~52° downward pitch angle)
    // Looking down along the diagonal to frame the river flowing TOP-RIGHT to BOTTOM-LEFT,
    // balancing the sunny left meadow plateau with the right forested bluff.
    this.defaultPosition = new THREE.Vector3(6, 72, 54);
    this.defaultTarget = new THREE.Vector3(0, 0, -6);

    this.target = this.defaultTarget.clone();
    this.resetToHeroView();
  }

  public resetToHeroView(): void {
    this.instance.position.copy(this.defaultPosition);
    this.target.copy(this.defaultTarget);
    this.instance.lookAt(this.target);
    this.instance.updateProjectionMatrix();
  }

  public resize(width: number, height: number): void {
    this.instance.aspect = width / height;
    this.instance.updateProjectionMatrix();
  }

  public update(): void {
    // Stable cinematic framing for Phase 0 foundation
  }
}
