# 技術規格文件 (Technical Specifications)

## 專案架構

```
3D_Realistic_CV/
├── src/
│   ├── main.ts                 # 應用入口
│   ├── core/
│   │   ├── Engine.ts          # WebGPU/WebGL2 引擎封裝
│   │   └── SceneManager.ts    # 場景管理器
│   ├── scenes/
│   │   ├── WaterfallScene.ts  # 瀑布場景（Compute Shader）
│   │   └── CyberpunkCityScene.ts  # 賽博龐克場景（SSR + Lighting）
│   ├── modules/
│   │   └── ComputeParticleSystem.ts  # GPU 粒子系統
│   ├── shaders/
│   │   └── particle-compute.wgsl  # WGSL Compute Shader
│   ├── utils/
│   │   └── FPSCounter.ts      # FPS 計數器
│   └── types/
│       └── shaders.d.ts       # Shader 型別定義
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 核心技術點

### 1. WebGPU Engine 初始化與 Fallback

**檔案**: `src/core/Engine.ts`

**關鍵功能**:
- 自動檢測 WebGPU 支援性
- 不支援時自動降級至 WebGL2
- 配置高效能渲染參數

**程式碼範例**:
```typescript
async initialize(): Promise<boolean> {
  if (await WebGPUEngine.IsSupportedAsync) {
    return await this.initializeWebGPU();
  } else {
    return this.initializeWebGL2();
  }
}
```

---

### 2. Compute Shader 粒子系統

**檔案**:
- `src/shaders/particle-compute.wgsl` (WGSL Shader)
- `src/modules/ComputeParticleSystem.ts` (TypeScript 綁定)

**技術亮點**:
- **50,000+ 粒子** 同時運算
- **Storage Buffers**: 粒子數據完全駐留在 GPU VRAM
- **並行計算**: Workgroup Size = 64，利用 GPU 數千核心
- **物理模擬**:
  - 重力
  - 碰撞檢測（與岩石障礙物）
  - 流體黏滯力（Viscosity）

**WGSL Compute Shader 結構**:
```wgsl
struct Particle {
  position: vec3<f32>,
  velocity: vec3<f32>,
  life: f32,
  size: f32,
}

@compute @workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  // GPU 並行處理每個粒子的物理
}
```

**效能對比**:
| 方法 | 粒子數量 | FPS |
|------|---------|-----|
| CPU (傳統) | 5,000 | 20-30 |
| **GPU Compute Shader** | **50,000+** | **60** |

---

### 3. Cyberpunk City Scene - 渲染管線

**檔案**: `src/scenes/CyberpunkCityScene.ts`

#### 3.1 PBR 材質系統
- **Metalness/Roughness Workflow**
- 建築物使用 `PBRMaterial`
- 地面高金屬度（0.9）+ 低粗糙度（0.1）= 濕潤反射效果

```typescript
const groundMat = new PBRMaterial('groundMat', this.scene);
groundMat.metallic = 0.9;  // 高金屬度
groundMat.roughness = 0.1; // 低粗糙度（濕滑）
```

#### 3.2 叢集光照 (Clustered Lighting)
- **120+ 動態點光源**（霓虹招牌）
- Babylon.js 自動使用 Clustered Forward Rendering
- 每個光源設定 `range` 限制影響範圍

```typescript
const light = new PointLight(`light${i}`, position, this.scene);
light.intensity = 5 + Math.random() * 10;
light.range = 8 + Math.random() * 5;
```

#### 3.3 SSR (Screen Space Reflections)
- **僅在 WebGPU 啟用**（效能考量）
- 地面反射霓虹燈光

```typescript
this.ssrPipeline = new SSRRenderingPipeline('ssr', this.scene, [this.camera!]);
this.ssrPipeline.strength = 0.8;
this.ssrPipeline.roughnessFactor = 0.2;
```

#### 3.4 後處理管線
使用 `DefaultRenderingPipeline` 整合多種效果：

| 效果 | 用途 | 參數 |
|------|------|------|
| **Bloom** | 霓虹燈輝光 | threshold: 0.4, weight: 0.6 |
| **ACES Tone Mapping** | 電影級色調 | exposure: 1.2, contrast: 1.3 |
| **Chromatic Aberration** | 色差（賽博風格） | amount: 30, radialIntensity: 1.5 |
| **Grain** | 膠片質感 | intensity: 10 |

```typescript
this.renderPipeline.bloomEnabled = true;
this.renderPipeline.imageProcessing.toneMappingType = 1; // ACES
this.renderPipeline.chromaticAberrationEnabled = true;
```

---

## 場景切換

**快捷鍵**:
- `[1]` - 切換到 Waterfall Scene
- `[2]` - 切換到 Cyberpunk City Scene

**實作**: `src/core/SceneManager.ts`

---

## 效能指標

### 目標 FPS
- **Waterfall Scene**: 60 FPS（50K 粒子）
- **Cyberpunk City Scene**: 60 FPS（120+ 光源）

### 瓶頸分析
- **WebGPU**: Compute Shader 執行在專用 GPU，不影響渲染管線
- **WebGL2**: Compute Shader 不可用，回退至 CPU 粒子系統（<5K 粒子）

---

## WebGPU vs WebGL2 功能對比

| 功能 | WebGPU | WebGL2 |
|------|--------|--------|
| Compute Shaders | ✅ 完整支援 | ❌ 不支援 |
| SSR | ✅ 高效能 | ⚠️ 可用但慢 |
| Clustered Lighting | ✅ 原生優化 | ⚠️ 有限 |
| 粒子數量 | 50,000+ | <5,000 |

---

## 技術債務與未來優化

1. **粒子渲染**：目前使用 `PointsCloudSystem`（CPU 更新），應改用 **Instanced Rendering** 直接讀取 Compute Buffer。
2. **紋理貼圖**：建築物目前是純色 PBR，可加入 Albedo/Normal/Roughness 貼圖。
3. **物理互動**：加入滑鼠點擊與粒子的互動（點擊產生力場）。
4. **場景轉場**：加入平滑的淡入淡出效果。

---

## 參考資源

- [Babylon.js WebGPU 文檔](https://doc.babylonjs.com/setup/support/webGPU)
- [WGSL 規範](https://www.w3.org/TR/WGSL/)
- [PBR 材質理論](https://learnopengl.com/PBR/Theory)
- [Screen Space Reflections](https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/SSRRenderingPipeline)

---

**作者**: 3D Resume Tech Demo
**更新日期**: 2025-12-10
