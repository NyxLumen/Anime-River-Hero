export type UpdateCallback = (time: number, delta: number) => void;

export class Loop {
  private isRunning: boolean = false;
  private animFrameId: number = 0;
  private lastTime: number = 0;
  private callbacks: Set<UpdateCallback> = new Set();

  public register(callback: UpdateCallback): void {
    this.callbacks.add(callback);
  }

  public unregister(callback: UpdateCallback): void {
    this.callbacks.delete(callback);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick = this.tick.bind(this);
    this.animFrameId = requestAnimationFrame(this.tick);
  }

  public stop(): void {
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameId);
  }

  private tick(now: number): void {
    if (!this.isRunning) return;

    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    const time = now / 1000;

    for (const cb of this.callbacks) {
      cb(time, delta);
    }

    this.animFrameId = requestAnimationFrame(this.tick);
  }
}
