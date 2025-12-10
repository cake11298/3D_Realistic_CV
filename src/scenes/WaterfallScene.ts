/**
 * Waterfall Scene - "The Flow"
 * Simplified version with standard particle system
 */

import {
  Scene,
  Engine,
  WebGPUEngine,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  Mesh,
  ParticleSystem,
  Texture,
} from '@babylonjs/core';
import { IScene } from '@/core/SceneManager';

export class WaterfallScene implements IScene {
  name = 'waterfall';
  scene: Scene;
  private engine: Engine | WebGPUEngine;
  private camera: ArcRotateCamera | null = null;
  private particleSystem: ParticleSystem | null = null;
  private obstacleMeshes: Mesh[] = [];

  constructor(engine: Engine | WebGPUEngine, _isWebGPU: boolean) {
    this.engine = engine;
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0.05, 0.05, 0.15, 1.0);
  }

  async initialize(): Promise<void> {
    console.log('🌊 Initializing Waterfall Scene...');

    // Setup camera
    this.setupCamera();

    // Setup lighting
    this.setupLighting();

    // Create environment
    this.createEnvironment();

    // Create particle system
    this.createParticleSystem();

    console.log('✓ Waterfall Scene initialized');
  }

  private setupCamera(): void {
    this.camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 3,
      20,
      new Vector3(0, 0, 0),
      this.scene
    );

    this.camera.lowerRadiusLimit = 10;
    this.camera.upperRadiusLimit = 50;
    this.camera.lowerBetaLimit = 0.1;
    this.camera.upperBetaLimit = Math.PI / 2;

    this.camera.attachControl(this.engine.getRenderingCanvas(), true);
  }

  private setupLighting(): void {
    // Ambient light
    const hemiLight = new HemisphericLight(
      'hemiLight',
      new Vector3(0, 1, 0),
      this.scene
    );
    hemiLight.intensity = 0.6;
    hemiLight.groundColor = new Color3(0.2, 0.2, 0.3);

    // Directional light (sun)
    const dirLight = new DirectionalLight(
      'dirLight',
      new Vector3(-1, -2, -1),
      this.scene
    );
    dirLight.intensity = 0.8;
    dirLight.position = new Vector3(10, 15, 10);
  }

  private createEnvironment(): void {
    // Create ground/pool
    const ground = MeshBuilder.CreateGround(
      'ground',
      { width: 30, height: 30 },
      this.scene
    );
    ground.position.y = -10;

    const groundMat = new StandardMaterial('groundMat', this.scene);
    groundMat.diffuseColor = new Color3(0.1, 0.15, 0.2);
    groundMat.specularColor = new Color3(0.5, 0.5, 0.5);
    ground.material = groundMat;

    // Create rock obstacles
    const obstaclePositions = [
      { pos: new Vector3(2, 0, 0), radius: 1.5 },
      { pos: new Vector3(-2, -2, 1), radius: 1.2 },
      { pos: new Vector3(0, -5, -2), radius: 1.8 },
      { pos: new Vector3(3, -3, 2), radius: 1.0 },
      { pos: new Vector3(-3, -1, -1), radius: 1.3 },
    ];

    obstaclePositions.forEach((obstacle, i) => {
      const rock = MeshBuilder.CreateSphere(
        `rock${i}`,
        { diameter: obstacle.radius * 2, segments: 16 },
        this.scene
      );
      rock.position = obstacle.pos;

      const rockMat = new StandardMaterial(`rockMat${i}`, this.scene);
      rockMat.diffuseColor = new Color3(0.3, 0.25, 0.2);
      rock.material = rockMat;

      this.obstacleMeshes.push(rock);
    });

    // Create emitter visual (waterfall source)
    const emitter = MeshBuilder.CreateTorus(
      'emitter',
      { diameter: 4, thickness: 0.2 },
      this.scene
    );
    emitter.position = new Vector3(0, 10, 0);

    const emitterMat = new StandardMaterial('emitterMat', this.scene);
    emitterMat.emissiveColor = new Color3(0, 0.8, 1);
    emitter.material = emitterMat;
  }

  private createParticleSystem(): void {
    // Create particle system emitter
    const fountain = MeshBuilder.CreateBox('fountain', { size: 0.1 }, this.scene);
    fountain.position = new Vector3(0, 10, 0);
    fountain.isVisible = false;

    // Create particle system
    this.particleSystem = new ParticleSystem('particles', 5000, this.scene);
    this.particleSystem.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAOUlEQVQoU2NkYGD4z0AEYBxXV1dGRkaGahC7sbERLI5sAUgBWBybImQFyArRFWArIKgAXSG6ArwKAPjVIgjYuki4AAAAAElFTkSuQmCC',
      this.scene
    );

    // Particle properties
    this.particleSystem.emitter = fountain;
    this.particleSystem.minEmitBox = new Vector3(-1, 0, -1);
    this.particleSystem.maxEmitBox = new Vector3(1, 0, 1);

    // Colors
    this.particleSystem.color1 = new Color4(0.3, 0.7, 1.0, 1.0);
    this.particleSystem.color2 = new Color4(0.1, 0.5, 0.9, 1.0);
    this.particleSystem.colorDead = new Color4(0.0, 0.3, 0.6, 0.0);

    // Size
    this.particleSystem.minSize = 0.1;
    this.particleSystem.maxSize = 0.3;

    // Life time
    this.particleSystem.minLifeTime = 2;
    this.particleSystem.maxLifeTime = 4;

    // Emission rate
    this.particleSystem.emitRate = 1000;

    // Blend mode
    this.particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;

    // Direction
    this.particleSystem.direction1 = new Vector3(-2, -8, -2);
    this.particleSystem.direction2 = new Vector3(2, -10, 2);

    // Speed
    this.particleSystem.minEmitPower = 1;
    this.particleSystem.maxEmitPower = 3;
    this.particleSystem.updateSpeed = 0.005;

    // Gravity
    this.particleSystem.gravity = new Vector3(0, -9.81, 0);

    // Start the particle system
    this.particleSystem.start();

    console.log('✓ Particle system created with 5,000 particles');
  }

  update(_deltaTime: number): void {
    // Particle system updates automatically
  }

  dispose(): void {
    this.particleSystem?.dispose();
    this.obstacleMeshes.forEach((mesh) => mesh.dispose());
    this.scene.dispose();
  }
}
