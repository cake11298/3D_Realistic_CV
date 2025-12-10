/**
 * Waterfall Scene - "The Flow"
 * Enhanced waterfall simulation with realistic water effects
 */

import {
  Scene,
  Engine,
  WebGPUEngine,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  SpotLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  Mesh,
  ParticleSystem,
  Texture,
  ShadowGenerator,
  PointLight,
  GlowLayer,
} from '@babylonjs/core';
import { IScene } from '@/core/SceneManager';

export class WaterfallScene implements IScene {
  name = 'waterfall';
  scene: Scene;
  private engine: Engine | WebGPUEngine;
  private camera: ArcRotateCamera | null = null;
  private mainWaterfall: ParticleSystem | null = null;
  private mistParticles: ParticleSystem | null = null;
  private splashParticles: ParticleSystem | null = null;
  private obstacleMeshes: Mesh[] = [];
  private waterPool: Mesh | null = null;

  constructor(engine: Engine | WebGPUEngine, _isWebGPU: boolean) {
    this.engine = engine;
    this.scene = new Scene(engine);

    // 深藍夜空背景
    this.scene.clearColor = new Color4(0.01, 0.05, 0.15, 1.0);

    // 輕微霧氣增強氛圍
    this.scene.fogEnabled = true;
    this.scene.fogMode = Scene.FOGMODE_EXP;
    this.scene.fogDensity = 0.02;
    this.scene.fogColor = new Color3(0.05, 0.1, 0.2);
  }

  async initialize(): Promise<void> {
    console.log('🌊 Initializing Enhanced Waterfall Scene...');

    this.setupCamera();
    this.setupLighting();
    this.createEnvironment();
    this.createMainWaterfall();
    this.createWaterMist();
    this.createSplashEffects();
    this.addGlowEffect();

    console.log('✓ Enhanced Waterfall Scene initialized');
  }

  private setupCamera(): void {
    this.camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 2.5,
      25,
      new Vector3(0, 2, 0),
      this.scene
    );

    this.camera.lowerRadiusLimit = 12;
    this.camera.upperRadiusLimit = 40;
    this.camera.lowerBetaLimit = 0.2;
    this.camera.upperBetaLimit = Math.PI / 2;

    // 平滑相機移動
    this.camera.inertia = 0.9;
    this.camera.wheelPrecision = 50;

    this.camera.attachControl(this.engine.getRenderingCanvas(), true);
  }

  private setupLighting(): void {
    // 環境光（冷色調）
    const hemiLight = new HemisphericLight(
      'hemiLight',
      new Vector3(0, 1, 0),
      this.scene
    );
    hemiLight.intensity = 0.4;
    hemiLight.diffuse = new Color3(0.5, 0.7, 1.0);
    hemiLight.groundColor = new Color3(0.1, 0.2, 0.4);

    // 主光源（模擬月光）
    const moonLight = new DirectionalLight(
      'moonLight',
      new Vector3(-0.5, -1, -0.3),
      this.scene
    );
    moonLight.intensity = 0.6;
    moonLight.diffuse = new Color3(0.7, 0.8, 1.0);
    moonLight.position = new Vector3(15, 20, 10);

    // 陰影生成器
    const shadowGenerator = new ShadowGenerator(2048, moonLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;

    // 水面反射光（藍綠色）
    const waterLight = new PointLight(
      'waterLight',
      new Vector3(0, 1, 0),
      this.scene
    );
    waterLight.intensity = 2;
    waterLight.diffuse = new Color3(0.2, 0.8, 1.0);
    waterLight.specular = new Color3(0.5, 1.0, 1.0);

    // 瀑布頂部聚光燈
    const topSpot = new SpotLight(
      'topSpot',
      new Vector3(0, 12, 0),
      new Vector3(0, -1, 0),
      Math.PI / 3,
      2,
      this.scene
    );
    topSpot.intensity = 1.5;
    topSpot.diffuse = new Color3(0.6, 0.9, 1.0);
  }

  private createEnvironment(): void {
    // 創建深邃的水池
    this.waterPool = MeshBuilder.CreateGround(
      'waterPool',
      { width: 40, height: 40 },
      this.scene
    );
    this.waterPool.position.y = -0.5;

    const poolMat = new StandardMaterial('poolMat', this.scene);
    poolMat.diffuseColor = new Color3(0.05, 0.15, 0.3);
    poolMat.specularColor = new Color3(0.8, 0.9, 1.0);
    poolMat.specularPower = 128;
    poolMat.emissiveColor = new Color3(0.02, 0.08, 0.15);
    poolMat.alpha = 0.7;
    this.waterPool.material = poolMat;
    this.waterPool.receiveShadows = true;

    // 創建逼真的岩石障礙物
    this.createRocks();

    // 創建瀑布源頭結構
    this.createWaterfallSource();
  }

  private createRocks(): void {
    const rockConfigs = [
      { pos: new Vector3(3, -0.3, 1), scale: new Vector3(2.5, 2, 2.2), color: new Color3(0.25, 0.22, 0.20) },
      { pos: new Vector3(-3, -0.2, -1), scale: new Vector3(2.2, 1.8, 2), color: new Color3(0.28, 0.24, 0.22) },
      { pos: new Vector3(1, 3, -2), scale: new Vector3(1.8, 1.5, 1.6), color: new Color3(0.22, 0.20, 0.18) },
      { pos: new Vector3(-2, 5, 1.5), scale: new Vector3(2, 2.2, 1.8), color: new Color3(0.26, 0.23, 0.21) },
      { pos: new Vector3(4, 1, -1.5), scale: new Vector3(1.5, 1.3, 1.4), color: new Color3(0.24, 0.21, 0.19) },
      { pos: new Vector3(-4, 2, 0.5), scale: new Vector3(1.9, 1.6, 1.7), color: new Color3(0.27, 0.24, 0.22) },
    ];

    rockConfigs.forEach((config, i) => {
      const rock = MeshBuilder.CreateSphere(
        `rock${i}`,
        { diameter: 2, segments: 12 },
        this.scene
      );
      rock.position = config.pos;
      rock.scaling = config.scale;

      // 稍微變形讓岩石更自然
      rock.scaling.x *= (0.9 + Math.random() * 0.2);
      rock.scaling.z *= (0.9 + Math.random() * 0.2);

      const rockMat = new StandardMaterial(`rockMat${i}`, this.scene);
      rockMat.diffuseColor = config.color;
      rockMat.specularColor = new Color3(0.1, 0.1, 0.1);
      rockMat.specularPower = 8;
      // 添加環境映射讓岩石有濕潤感
      rockMat.emissiveColor = new Color3(0.02, 0.03, 0.04);
      rock.material = rockMat;
      rock.receiveShadows = true;

      this.obstacleMeshes.push(rock);
    });
  }

  private createWaterfallSource(): void {
    // 創建瀑布源頭的岩石平台
    const source = MeshBuilder.CreateCylinder(
      'source',
      { height: 2, diameterTop: 6, diameterBottom: 5, tessellation: 24 },
      this.scene
    );
    source.position = new Vector3(0, 10, 0);

    const sourceMat = new StandardMaterial('sourceMat', this.scene);
    sourceMat.diffuseColor = new Color3(0.2, 0.18, 0.16);
    sourceMat.specularColor = new Color3(0.3, 0.3, 0.3);
    source.material = sourceMat;

    // 發光的水源中心
    const waterSource = MeshBuilder.CreateTorus(
      'waterSource',
      { diameter: 3, thickness: 0.3, tessellation: 32 },
      this.scene
    );
    waterSource.position = new Vector3(0, 11, 0);

    const glowMat = new StandardMaterial('glowMat', this.scene);
    glowMat.emissiveColor = new Color3(0.3, 0.7, 1.0);
    glowMat.disableLighting = true;
    waterSource.material = glowMat;
  }

  private createMainWaterfall(): void {
    // 主瀑布粒子系統 - 大幅增強
    const emitter = MeshBuilder.CreateBox('emitter', { size: 0.1 }, this.scene);
    emitter.position = new Vector3(0, 10.5, 0);
    emitter.isVisible = false;

    this.mainWaterfall = new ParticleSystem('mainWaterfall', 15000, this.scene);

    // 使用更好的粒子紋理（圓形光斑）
    this.mainWaterfall.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAOklEQVRYR+3XMQoAIAwDwOT/j3YREhBc1WVhM3MHHsBHEQgCQRAIgkAQBIIgEASBIAgEQSAIAsEDBegFFT0YgagAAAAASUVORK5CYII=',
      this.scene
    );

    this.mainWaterfall.emitter = emitter;
    this.mainWaterfall.minEmitBox = new Vector3(-1.5, 0, -1.5);
    this.mainWaterfall.maxEmitBox = new Vector3(1.5, 0, 1.5);

    // 顏色漸變 - 從頂部的淺藍到底部的深藍
    this.mainWaterfall.color1 = new Color4(0.6, 0.85, 1.0, 1.0);
    this.mainWaterfall.color2 = new Color4(0.3, 0.65, 0.95, 0.9);
    this.mainWaterfall.colorDead = new Color4(0.1, 0.4, 0.7, 0.3);

    // 粒子大小變化
    this.mainWaterfall.minSize = 0.15;
    this.mainWaterfall.maxSize = 0.4;
    this.mainWaterfall.minScaleX = 0.8;
    this.mainWaterfall.maxScaleX = 1.5;

    // 生命週期
    this.mainWaterfall.minLifeTime = 2.5;
    this.mainWaterfall.maxLifeTime = 4;

    // 發射速率
    this.mainWaterfall.emitRate = 3000;

    // 混合模式 - 使用標準混合獲得更自然的水效果
    this.mainWaterfall.blendMode = ParticleSystem.BLENDMODE_STANDARD;

    // 方向 - 主要向下，帶有輕微的擴散
    this.mainWaterfall.direction1 = new Vector3(-1, -10, -1);
    this.mainWaterfall.direction2 = new Vector3(1, -12, 1);

    // 速度
    this.mainWaterfall.minEmitPower = 2;
    this.mainWaterfall.maxEmitPower = 4;
    this.mainWaterfall.updateSpeed = 0.01;

    // 重力
    this.mainWaterfall.gravity = new Vector3(0, -15, 0);

    // 啟動主瀑布
    this.mainWaterfall.start();
  }

  private createWaterMist(): void {
    // 水霧粒子系統
    const mistEmitter = MeshBuilder.CreateBox('mistEmitter', { size: 0.1 }, this.scene);
    mistEmitter.position = new Vector3(0, 0, 0);
    mistEmitter.isVisible = false;

    this.mistParticles = new ParticleSystem('mist', 2000, this.scene);
    this.mistParticles.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAOUlEQVQoU2NkYGD4z0AEYBxXV1dGRkaGahC7sbERLI5sAUgBWBybImQFyArRFWArIKgAXSG6ArwKAPjVIgjYuki4AAAAAElFTkSuQmCC',
      this.scene
    );

    this.mistParticles.emitter = mistEmitter;
    this.mistParticles.minEmitBox = new Vector3(-3, 0, -3);
    this.mistParticles.maxEmitBox = new Vector3(3, 0, 3);

    // 半透明白色水霧
    this.mistParticles.color1 = new Color4(0.8, 0.9, 1.0, 0.3);
    this.mistParticles.color2 = new Color4(0.6, 0.8, 0.95, 0.2);
    this.mistParticles.colorDead = new Color4(0.5, 0.7, 0.9, 0);

    this.mistParticles.minSize = 1.5;
    this.mistParticles.maxSize = 3.5;

    this.mistParticles.minLifeTime = 3;
    this.mistParticles.maxLifeTime = 6;

    this.mistParticles.emitRate = 300;
    this.mistParticles.blendMode = ParticleSystem.BLENDMODE_STANDARD;

    // 水霧向上飄散
    this.mistParticles.direction1 = new Vector3(-0.5, 0.3, -0.5);
    this.mistParticles.direction2 = new Vector3(0.5, 1, 0.5);

    this.mistParticles.minEmitPower = 0.3;
    this.mistParticles.maxEmitPower = 0.8;
    this.mistParticles.updateSpeed = 0.015;

    this.mistParticles.gravity = new Vector3(0, 0.5, 0);

    this.mistParticles.start();
  }

  private createSplashEffects(): void {
    // 水花飛濺效果
    const splashEmitter = MeshBuilder.CreateBox('splashEmitter', { size: 0.1 }, this.scene);
    splashEmitter.position = new Vector3(0, -0.3, 0);
    splashEmitter.isVisible = false;

    this.splashParticles = new ParticleSystem('splash', 1500, this.scene);
    this.splashParticles.particleTexture = new Texture(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAOUlEQVQoU2NkYGD4z0AEYBxXV1dGRkaGahC7sbERLI5sAUgBWBybImQFyArRFWArIKgAXSG6ArwKAPjVIgjYuki4AAAAAElFTkSuQmCC',
      this.scene
    );

    this.splashParticles.emitter = splashEmitter;
    this.splashParticles.minEmitBox = new Vector3(-2, 0, -2);
    this.splashParticles.maxEmitBox = new Vector3(2, 0, 2);

    this.splashParticles.color1 = new Color4(0.7, 0.9, 1.0, 0.8);
    this.splashParticles.color2 = new Color4(0.5, 0.8, 1.0, 0.6);
    this.splashParticles.colorDead = new Color4(0.3, 0.6, 0.9, 0);

    this.splashParticles.minSize = 0.1;
    this.splashParticles.maxSize = 0.3;

    this.splashParticles.minLifeTime = 0.5;
    this.splashParticles.maxLifeTime = 1.5;

    this.splashParticles.emitRate = 800;
    this.splashParticles.blendMode = ParticleSystem.BLENDMODE_ONEONE;

    // 向四周飛濺
    this.splashParticles.direction1 = new Vector3(-3, 1, -3);
    this.splashParticles.direction2 = new Vector3(3, 4, 3);

    this.splashParticles.minEmitPower = 1.5;
    this.splashParticles.maxEmitPower = 3;
    this.splashParticles.updateSpeed = 0.008;

    this.splashParticles.gravity = new Vector3(0, -12, 0);

    this.splashParticles.start();
  }

  private addGlowEffect(): void {
    // 添加輝光層讓水更有發光感
    const glowLayer = new GlowLayer('glow', this.scene);
    glowLayer.intensity = 0.5;
  }

  update(_deltaTime: number): void {
    // 粒子系統自動更新

    // 添加水池輕微波動效果
    if (this.waterPool) {
      const time = performance.now() * 0.001;
      this.waterPool.position.y = -0.5 + Math.sin(time * 0.5) * 0.05;
    }
  }

  dispose(): void {
    this.mainWaterfall?.dispose();
    this.mistParticles?.dispose();
    this.splashParticles?.dispose();
    this.obstacleMeshes.forEach((mesh) => mesh.dispose());
    this.waterPool?.dispose();
    this.scene.dispose();
  }
}
