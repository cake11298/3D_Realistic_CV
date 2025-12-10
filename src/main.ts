/**
 * 3D Resume - WebGPU Tech Demo
 * Entry Point
 */

import { AppEngine } from '@/core/Engine';
import { SceneManager } from '@/core/SceneManager';
import { FPSCounter } from '@/utils/FPSCounter';

class Application {
  private engine: AppEngine | null = null;
  private sceneManager: SceneManager | null = null;
  private fpsCounter: FPSCounter;

  constructor() {
    this.fpsCounter = new FPSCounter('fps-counter');
  }

  async init(): Promise<void> {
    try {
      // Update loading status
      this.updateLoadingStatus('Checking WebGPU support...');

      // Initialize engine with WebGPU/WebGL2 fallback
      this.engine = new AppEngine('renderCanvas');
      const isWebGPU = await this.engine.initialize();

      this.updateLoadingStatus(
        isWebGPU
          ? '✓ WebGPU Engine Initialized'
          : '⚠ Fallback to WebGL2 (WebGPU not supported)'
      );

      // Initialize scene manager
      this.sceneManager = new SceneManager(this.engine);
      await this.sceneManager.initialize();

      // Hide loading screen
      setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
          loadingScreen.classList.add('hidden');
        }
      }, 500);

      // Start render loop
      this.startRenderLoop();

      console.log('🚀 Application initialized successfully');
      console.log(`📊 Engine: ${isWebGPU ? 'WebGPU' : 'WebGL2'}`);
      console.log(`🎬 Active Scene: ${this.sceneManager.getCurrentSceneName()}`);
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.updateLoadingStatus(`Error: ${error}`);
    }
  }

  private startRenderLoop(): void {
    if (!this.engine || !this.sceneManager) return;

    const engine = this.engine.getEngine();
    const scene = this.sceneManager.getCurrentScene();

    engine.runRenderLoop(() => {
      scene.render();
      this.fpsCounter.update();
      this.sceneManager.update();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      engine.resize();
    });
  }

  private updateLoadingStatus(message: string): void {
    const statusElement = document.getElementById('engine-status');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }
}

// Bootstrap application
const app = new Application();
app.init().catch(console.error);
