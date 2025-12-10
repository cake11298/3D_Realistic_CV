/**
 * Cyberpunk City Scene - "Cyberpunk Night"
 * Showcases dynamic lighting and post-processing
 */

import {
  Scene,
  Engine,
  WebGPUEngine,
  ArcRotateCamera,
  Vector3,
  Color3,
  Color4,
  MeshBuilder,
  StandardMaterial,
  PointLight,
  Mesh,
} from '@babylonjs/core';
import { IScene } from '@/core/SceneManager';

interface NeonLight {
  mesh: Mesh;
  light: PointLight;
  baseIntensity: number;
  color: Color3;
  animationSpeed: number;
}

export class CyberpunkCityScene implements IScene {
  name = 'cyberpunk';
  scene: Scene;
  private engine: Engine | WebGPUEngine;
  private camera: ArcRotateCamera | null = null;
  private neonLights: NeonLight[] = [];
  private buildings: Mesh[] = [];

  constructor(engine: Engine | WebGPUEngine, _isWebGPU: boolean) {
    this.engine = engine;
    this.scene = new Scene(engine);

    // Cyberpunk night sky
    this.scene.clearColor = new Color4(0.02, 0.02, 0.08, 1.0);
    this.scene.fogEnabled = true;
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.01;
    this.scene.fogColor = new Color3(0.1, 0.05, 0.15);
  }

  async initialize(): Promise<void> {
    console.log('🌃 Initializing Cyberpunk City Scene...');

    // Setup camera
    this.setupCamera();

    // Create city environment
    this.createCityEnvironment();

    // Create neon lights
    this.createNeonLights();

    // Animate lights
    this.animateLights();

    console.log('✓ Cyberpunk City Scene initialized');
    console.log(`💡 Active lights: ${this.neonLights.length}`);
  }

  private setupCamera(): void {
    this.camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 3,
      30,
      new Vector3(0, 5, 0),
      this.scene
    );

    this.camera.lowerRadiusLimit = 15;
    this.camera.upperRadiusLimit = 60;
    this.camera.lowerBetaLimit = 0.1;
    this.camera.upperBetaLimit = Math.PI / 2.2;

    this.camera.inertia = 0.8;
    this.camera.angularSensibilityX = 2000;
    this.camera.angularSensibilityY = 2000;

    this.camera.attachControl(this.engine.getRenderingCanvas(), true);
  }

  private createCityEnvironment(): void {
    // Create wet ground
    const ground = MeshBuilder.CreateGround(
      'ground',
      { width: 100, height: 100 },
      this.scene
    );

    const groundMat = new StandardMaterial('groundMat', this.scene);
    groundMat.diffuseColor = new Color3(0.05, 0.05, 0.08);
    groundMat.specularColor = new Color3(0.5, 0.5, 0.5);
    groundMat.emissiveColor = new Color3(0.01, 0.01, 0.02);
    ground.material = groundMat;

    // Create cyberpunk buildings
    this.createBuildings();
  }

  private createBuildings(): void {
    const buildingConfigs = [
      { pos: new Vector3(0, 10, 0), size: { w: 8, h: 20, d: 8 }, color: new Color3(0.1, 0.1, 0.15) },
      { pos: new Vector3(15, 8, 5), size: { w: 6, h: 16, d: 6 }, color: new Color3(0.12, 0.1, 0.15) },
      { pos: new Vector3(-12, 7, -3), size: { w: 7, h: 14, d: 7 }, color: new Color3(0.1, 0.12, 0.15) },
      { pos: new Vector3(8, 5, 12), size: { w: 5, h: 10, d: 5 }, color: new Color3(0.08, 0.08, 0.12) },
      { pos: new Vector3(-8, 6, 10), size: { w: 6, h: 12, d: 6 }, color: new Color3(0.1, 0.08, 0.12) },
      { pos: new Vector3(18, 4, -8), size: { w: 4, h: 8, d: 4 }, color: new Color3(0.09, 0.09, 0.13) },
      { pos: new Vector3(-15, 5, -12), size: { w: 5, h: 10, d: 5 }, color: new Color3(0.08, 0.1, 0.12) },
      { pos: new Vector3(5, 3, -15), size: { w: 3, h: 6, d: 3 }, color: new Color3(0.1, 0.09, 0.14) },
    ];

    buildingConfigs.forEach((config, i) => {
      const building = MeshBuilder.CreateBox(
        `building${i}`,
        { width: config.size.w, height: config.size.h, depth: config.size.d },
        this.scene
      );
      building.position = config.pos;

      const mat = new StandardMaterial(`buildingMat${i}`, this.scene);
      mat.diffuseColor = config.color;
      mat.specularColor = new Color3(0.1, 0.1, 0.1);
      const emissiveStrength = 0.02 + Math.random() * 0.03;
      mat.emissiveColor = new Color3(
        0.2 * emissiveStrength,
        0.4 * emissiveStrength,
        0.6 * emissiveStrength
      );

      building.material = mat;
      this.buildings.push(building);
    });
  }

  private createNeonLights(): void {
    const neonColors = [
      new Color3(1, 0, 0.5),
      new Color3(0, 1, 1),
      new Color3(1, 0.3, 0),
      new Color3(0.5, 0, 1),
      new Color3(0, 1, 0.5),
      new Color3(1, 1, 0),
    ];

    // Create 60 dynamic neon lights (reduced for better performance)
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const radius = 12 + Math.random() * 15;
      const height = 2 + Math.random() * 18;

      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 5;
      const y = height;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 5;

      // Neon sign mesh
      const neonSign = MeshBuilder.CreateBox(
        `neon${i}`,
        { width: 0.5, height: 0.5, depth: 0.1 },
        this.scene
      );
      neonSign.position = new Vector3(x, y, z);

      const color = neonColors[Math.floor(Math.random() * neonColors.length)].clone();

      const neonMat = new StandardMaterial(`neonMat${i}`, this.scene);
      neonMat.emissiveColor = color;
      neonMat.disableLighting = true;
      neonSign.material = neonMat;

      // Point light
      const light = new PointLight(
        `light${i}`,
        new Vector3(x, y, z),
        this.scene
      );
      light.diffuse = color;
      light.specular = color.scale(0.5);
      light.intensity = 5 + Math.random() * 10;
      light.range = 8 + Math.random() * 5;

      this.neonLights.push({
        mesh: neonSign,
        light: light,
        baseIntensity: light.intensity,
        color: color,
        animationSpeed: 0.5 + Math.random() * 2,
      });
    }

    console.log(`✓ Created ${this.neonLights.length} dynamic neon lights`);
  }

  private animateLights(): void {
    this.neonLights.forEach((neonLight) => {
      const flickerInterval = 100 + Math.random() * 200;

      setInterval(() => {
        if (Math.random() > 0.7) {
          neonLight.light.intensity = neonLight.baseIntensity * (0.3 + Math.random() * 0.7);
        }
      }, flickerInterval);
    });
  }

  update(_deltaTime: number): void {
    const time = performance.now() * 0.001;

    this.neonLights.forEach((neonLight, i) => {
      const pulse = Math.sin(time * neonLight.animationSpeed + i) * 0.3 + 0.7;
      neonLight.light.intensity = neonLight.baseIntensity * pulse;
    });
  }

  dispose(): void {
    this.neonLights.forEach((neonLight) => {
      neonLight.mesh.dispose();
      neonLight.light.dispose();
    });
    this.buildings.forEach((building) => building.dispose());
    this.scene.dispose();
  }
}
