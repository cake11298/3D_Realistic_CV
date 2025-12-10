/**
 * Scene Manager
 * Handles scene switching and lifecycle
 */

import { Scene } from '@babylonjs/core';
import { AppEngine } from './Engine';
import { WaterfallScene } from '@scenes/WaterfallScene';
import { CyberpunkCityScene } from '@scenes/CyberpunkCityScene';

export interface IScene {
  name: string;
  scene: Scene;
  initialize(): Promise<void>;
  update(deltaTime: number): void;
  dispose(): void;
}

export class SceneManager {
  private appEngine: AppEngine;
  private scenes: Map<string, IScene> = new Map();
  private currentScene: IScene | null = null;
  private lastTime: number = performance.now();

  constructor(appEngine: AppEngine) {
    this.appEngine = appEngine;
  }

  async initialize(): Promise<void> {
    const engine = this.appEngine.getEngine();
    const isWebGPU = this.appEngine.isUsingWebGPU();

    // Create scenes
    const waterfallScene = new WaterfallScene(engine, isWebGPU);
    const cyberpunkScene = new CyberpunkCityScene(engine, isWebGPU);

    // Register scenes
    this.scenes.set('waterfall', waterfallScene);
    this.scenes.set('cyberpunk', cyberpunkScene);

    // Initialize default scene (Waterfall)
    await this.switchScene('waterfall');

    // Setup keyboard controls for scene switching
    this.setupControls();
  }

  async switchScene(sceneName: string): Promise<void> {
    const newScene = this.scenes.get(sceneName);
    if (!newScene) {
      console.error(`Scene "${sceneName}" not found`);
      return;
    }

    // Dispose current scene if exists
    if (this.currentScene) {
      this.currentScene.dispose();
    }

    // Initialize and activate new scene
    await newScene.initialize();
    this.currentScene = newScene;

    // Update UI
    this.updateUI();

    console.log(`🎬 Switched to scene: ${sceneName}`);
  }

  update(): void {
    if (!this.currentScene) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    this.currentScene.update(deltaTime);
  }

  getCurrentScene(): Scene {
    if (!this.currentScene) {
      throw new Error('No active scene');
    }
    return this.currentScene.scene;
  }

  getCurrentSceneName(): string {
    return this.currentScene?.name || 'none';
  }

  private setupControls(): void {
    window.addEventListener('keydown', (event) => {
      switch (event.key) {
        case '1':
          this.switchScene('waterfall');
          break;
        case '2':
          this.switchScene('cyberpunk');
          break;
      }
    });

    console.log('⌨️  Controls: Press [1] Waterfall | [2] Cyberpunk City');
  }

  private updateUI(): void {
    const sceneTitleEl = document.getElementById('scene-title');
    const sceneInfoEl = document.getElementById('scene-info');

    if (!this.currentScene || !sceneTitleEl || !sceneInfoEl) return;

    const sceneInfo = {
      waterfall: {
        title: 'The Flow - Waterfall Simulation',
        info: 'Compute Shader Particle System\n50,000+ particles @ 60 FPS\nPress [1] or [2] to switch scenes',
      },
      cyberpunk: {
        title: 'Cyberpunk Night - Rain City',
        info: 'PBR Materials + SSR + Clustered Lighting\n100+ dynamic lights\nPress [1] or [2] to switch scenes',
      },
    };

    const info = sceneInfo[this.currentScene.name as keyof typeof sceneInfo];
    if (info) {
      sceneTitleEl.textContent = info.title;
      sceneInfoEl.innerHTML = info.info.replace(/\n/g, '<br>');
    }
  }

  dispose(): void {
    this.scenes.forEach((scene) => scene.dispose());
    this.scenes.clear();
    this.currentScene = null;
  }
}
