/**
 * WebGPU Engine with WebGL2 Fallback
 * Core rendering engine initialization
 */

import {
  Engine,
  WebGPUEngine,
  Scene,
  NullEngine,
} from '@babylonjs/core';

export class AppEngine {
  private engine: Engine | WebGPUEngine | null = null;
  private canvas: HTMLCanvasElement;
  private isWebGPU: boolean = false;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }
    this.canvas = canvas;
  }

  /**
   * Initialize engine with WebGPU first, fallback to WebGL2 if not supported
   * @returns Promise<boolean> - true if WebGPU, false if WebGL2
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if WebGPU is supported
      if (await WebGPUEngine.IsSupportedAsync) {
        console.log('🎮 WebGPU is supported, initializing WebGPU Engine...');
        return await this.initializeWebGPU();
      } else {
        console.warn('⚠️ WebGPU not supported, falling back to WebGL2...');
        return this.initializeWebGL2();
      }
    } catch (error) {
      console.error('Failed to check WebGPU support:', error);
      console.log('Attempting WebGL2 fallback...');
      return this.initializeWebGL2();
    }
  }

  /**
   * Initialize WebGPU Engine
   */
  private async initializeWebGPU(): Promise<boolean> {
    try {
      const engine = new WebGPUEngine(this.canvas, {
        deviceDescriptor: {
          requiredFeatures: [
            'depth-clip-control',
            'depth32float-stencil8',
            'texture-compression-bc',
            'timestamp-query',
            'indirect-first-instance',
          ],
        },
        audioEngine: false, // Disable audio for now
        antialias: true,
        stencil: true,
        powerPreference: 'high-performance',
      });

      // Wait for engine initialization
      await engine.initAsync();

      this.engine = engine;
      this.isWebGPU = true;

      // Configure engine settings
      this.configureEngine();

      console.log('✓ WebGPU Engine initialized successfully');
      console.log('GPU Adapter:', engine.adapterSupportedFeatures);

      return true;
    } catch (error) {
      console.error('Failed to initialize WebGPU:', error);
      console.log('Falling back to WebGL2...');
      return this.initializeWebGL2();
    }
  }

  /**
   * Initialize WebGL2 Engine (Fallback)
   */
  private initializeWebGL2(): boolean {
    try {
      const engine = new Engine(this.canvas, true, {
        preserveDrawingBuffer: false,
        stencil: true,
        antialias: true,
        powerPreference: 'high-performance',
        doNotHandleContextLost: true,
      });

      this.engine = engine;
      this.isWebGPU = false;

      // Configure engine settings
      this.configureEngine();

      console.log('✓ WebGL2 Engine initialized successfully');
      return false;
    } catch (error) {
      console.error('Failed to initialize WebGL2:', error);
      throw new Error('No suitable rendering engine available');
    }
  }

  /**
   * Configure common engine settings
   */
  private configureEngine(): void {
    if (!this.engine) return;

    // Enable optimizations
    this.engine.enableOfflineSupport = false;
    this.engine.doNotHandleContextLost = true;

    // Set loading UI to null (we have custom loading screen)
    this.engine.loadingScreen = {
      displayLoadingUI: () => {},
      hideLoadingUI: () => {},
      loadingUIBackgroundColor: '#000000',
      loadingUIText: 'Loading...',
    };
  }

  /**
   * Get the initialized engine instance
   */
  getEngine(): Engine | WebGPUEngine {
    if (!this.engine) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }
    return this.engine;
  }

  /**
   * Check if WebGPU is being used
   */
  isUsingWebGPU(): boolean {
    return this.isWebGPU;
  }

  /**
   * Get canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Dispose engine and cleanup resources
   */
  dispose(): void {
    if (this.engine) {
      this.engine.dispose();
      this.engine = null;
    }
  }
}
