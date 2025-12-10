/**
 * FPS Counter Utility
 */

export class FPSCounter {
  private element: HTMLElement | null;
  private lastTime: number = performance.now();
  private frames: number = 0;
  private fps: number = 0;

  constructor(elementId: string) {
    this.element = document.getElementById(elementId);
  }

  update(): void {
    const currentTime = performance.now();
    this.frames++;

    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
      this.frames = 0;
      this.lastTime = currentTime;

      if (this.element) {
        const color = this.fps >= 55 ? '#0f0' : this.fps >= 30 ? '#ff0' : '#f00';
        this.element.style.color = color;
        this.element.textContent = `FPS: ${this.fps}`;
      }
    }
  }

  getFPS(): number {
    return this.fps;
  }
}
