/**
 * Compute Particle System
 * GPU-accelerated particle simulation using Compute Shaders
 */

import {
  Engine,
  WebGPUEngine,
  Scene,
  ComputeShader,
  StorageBuffer,
  UniformBuffer,
  Vector3,
} from '@babylonjs/core';
import particleComputeShader from '@shaders/particle-compute.wgsl?raw';

interface Particle {
  position: Float32Array; // vec3
  velocity: Float32Array; // vec3
  life: number;
  size: number;
}

interface SimulationParams {
  deltaTime: number;
  gravity: Vector3;
  damping: number;
  viscosity: number;
  particleCount: number;
  emitterPosition: Vector3;
  emitterRadius: number;
}

interface Obstacle {
  position: Vector3;
  radius: number;
}

export class ComputeParticleSystem {
  private engine: WebGPUEngine;
  private scene: Scene;
  private computeShader: ComputeShader | null = null;
  private particleBuffer: StorageBuffer | null = null;
  private paramsBuffer: UniformBuffer | null = null;
  private obstacleBuffer: StorageBuffer | null = null;

  private particleCount: number;
  private params: SimulationParams;
  private obstacles: Obstacle[] = [];

  constructor(
    engine: Engine | WebGPUEngine,
    scene: Scene,
    particleCount: number = 50000
  ) {
    if (!(engine instanceof WebGPUEngine)) {
      throw new Error('ComputeParticleSystem requires WebGPU engine');
    }

    this.engine = engine;
    this.scene = scene;
    this.particleCount = particleCount;

    this.params = {
      deltaTime: 0.016,
      gravity: new Vector3(0, -9.81, 0),
      damping: 0.99,
      viscosity: 0.02,
      particleCount: particleCount,
      emitterPosition: new Vector3(0, 10, 0),
      emitterRadius: 2.0,
    };
  }

  async initialize(): Promise<void> {
    console.log('🔧 Initializing Compute Particle System...');

    // Initialize particle data (CPU-side first)
    const particleData = this.initializeParticleData();

    // Create storage buffer for particles (GPU-side)
    this.particleBuffer = new StorageBuffer(
      this.engine,
      particleData.byteLength,
      WebGPUEngine.BUFFER_USAGE_STORAGE | WebGPUEngine.BUFFER_USAGE_COPY_DST
    );
    this.particleBuffer.update(particleData);

    // Create uniform buffer for simulation parameters
    this.paramsBuffer = new UniformBuffer(this.engine);
    this.updateParamsBuffer();

    // Create obstacle buffer
    this.initializeObstacles();

    // Create compute shader
    this.computeShader = new ComputeShader(
      'particleCompute',
      this.engine,
      { computeSource: particleComputeShader },
      {
        bindingsMapping: {
          particles: { group: 0, binding: 0 },
          params: { group: 0, binding: 1 },
          obstacles: { group: 0, binding: 2 },
        },
      }
    );

    // Bind buffers to shader
    this.computeShader.setStorageBuffer('particles', this.particleBuffer);
    this.computeShader.setUniformBuffer('params', this.paramsBuffer);
    this.computeShader.setStorageBuffer('obstacles', this.obstacleBuffer!);

    console.log(`✓ Compute Particle System initialized with ${this.particleCount} particles`);
  }

  private initializeParticleData(): Float32Array {
    // Each particle: position (3) + velocity (3) + life (1) + size (1) = 8 floats
    const data = new Float32Array(this.particleCount * 8);

    for (let i = 0; i < this.particleCount; i++) {
      const offset = i * 8;

      // Position (random around emitter)
      data[offset + 0] = (Math.random() - 0.5) * 2;
      data[offset + 1] = 10 + Math.random() * 2;
      data[offset + 2] = (Math.random() - 0.5) * 2;

      // Velocity
      data[offset + 3] = (Math.random() - 0.5) * 2;
      data[offset + 4] = -1 - Math.random() * 2;
      data[offset + 5] = (Math.random() - 0.5) * 2;

      // Life
      data[offset + 6] = Math.random() * 5;

      // Size
      data[offset + 7] = 0.05 + Math.random() * 0.05;
    }

    return data;
  }

  private initializeObstacles(): void {
    // Create some rock obstacles for particles to collide with
    this.obstacles = [
      { position: new Vector3(2, 0, 0), radius: 1.5 },
      { position: new Vector3(-2, -2, 1), radius: 1.2 },
      { position: new Vector3(0, -5, -2), radius: 1.8 },
      { position: new Vector3(3, -3, 2), radius: 1.0 },
      { position: new Vector3(-3, -1, -1), radius: 1.3 },
    ];

    // Create buffer (position: vec3 + radius: f32 = 4 floats per obstacle)
    const obstacleData = new Float32Array(this.obstacles.length * 4);

    this.obstacles.forEach((obstacle, i) => {
      const offset = i * 4;
      obstacleData[offset + 0] = obstacle.position.x;
      obstacleData[offset + 1] = obstacle.position.y;
      obstacleData[offset + 2] = obstacle.position.z;
      obstacleData[offset + 3] = obstacle.radius;
    });

    this.obstacleBuffer = new StorageBuffer(
      this.engine,
      obstacleData.byteLength,
      WebGPUEngine.BUFFER_USAGE_STORAGE | WebGPUEngine.BUFFER_USAGE_COPY_DST
    );
    this.obstacleBuffer.update(obstacleData);
  }

  private updateParamsBuffer(): void {
    if (!this.paramsBuffer) return;

    this.paramsBuffer.updateFloat('deltaTime', this.params.deltaTime);
    this.paramsBuffer.updateVector3('gravity', this.params.gravity);
    this.paramsBuffer.updateFloat('damping', this.params.damping);
    this.paramsBuffer.updateFloat('viscosity', this.params.viscosity);
    this.paramsBuffer.updateUInt('particleCount', this.params.particleCount);
    this.paramsBuffer.updateVector3('emitterPosition', this.params.emitterPosition);
    this.paramsBuffer.updateFloat('emitterRadius', this.params.emitterRadius);
    this.paramsBuffer.update();
  }

  update(deltaTime: number): void {
    if (!this.computeShader) return;

    // Update simulation parameters
    this.params.deltaTime = Math.min(deltaTime, 0.033); // Cap at ~30 FPS
    this.updateParamsBuffer();

    // Dispatch compute shader
    // Workgroup size is 64 (defined in shader), so we need particleCount / 64 workgroups
    const workgroupCount = Math.ceil(this.particleCount / 64);
    this.computeShader.dispatch(workgroupCount, 1, 1);
  }

  getParticleBuffer(): StorageBuffer | null {
    return this.particleBuffer;
  }

  getParticleCount(): number {
    return this.particleCount;
  }

  getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  dispose(): void {
    this.particleBuffer?.dispose();
    this.paramsBuffer?.dispose();
    this.obstacleBuffer?.dispose();
    this.computeShader?.dispose();
  }
}
