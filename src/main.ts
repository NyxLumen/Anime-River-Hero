import { Renderer } from './core/Renderer';
import { AppScene } from './core/Scene';
import { CinematicCamera } from './core/Camera';
import { Loop } from './core/Loop';
import { World } from './world/World';

class AnimeRiverApp {
  private renderer: Renderer;
  private appScene: AppScene;
  private camera: CinematicCamera;
  private world: World;
  private loop: Loop;

  constructor() {
    const canvas = document.getElementById('app-canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element #app-canvas not found.');
    }

    // 1. Core Systems
    this.renderer = new Renderer(canvas);
    this.appScene = new AppScene();
    this.camera = new CinematicCamera();
    this.loop = new Loop();

    // 2. World Elements
    this.world = new World(this.appScene.instance);

    // 3. Setup Loop
    this.loop.register((time, delta) => {
      this.world.update(time, delta);
      this.camera.update();
      this.renderer.render(this.appScene.instance, this.camera.instance);
    });

    // 4. Events
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this));

    // 5. Start
    this.loop.start();
    console.log('🌸 Anime River — Phase 0 Scene Foundation Initialized.');
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.resize(w, h);
    this.camera.resize(w, h);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'r' || e.key === 'R') {
      this.camera.resetToHeroView();
    }
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new AnimeRiverApp();
});
