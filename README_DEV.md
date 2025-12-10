# 3D Resume - WebGPU Tech Demo 🚀

> **次世代互動履歷**：使用 Babylon.js 8.0 + WebGPU + TypeScript 打造的瀏覽器算力極限展示

---

## 專案簡介

這是一個將傳統履歷轉化為 **3D 空間探索體驗** 的技術展示專案，利用 WebGPU 的強大算力實現：

- ⚡ **50,000+ 粒子**的即時流體模擬（Compute Shaders）
- 💡 **120+ 動態光源**的賽博龐克城市（Clustered Lighting）
- ✨ **電影級後處理**（SSR + Bloom + ACES Tone Mapping）

---

## 技術堆疊

| 類別 | 技術 |
|------|------|
| **渲染引擎** | Babylon.js 8.0 (WebGPU Engine) |
| **程式語言** | TypeScript 5.3+ |
| **建置工具** | Vite 5.0 |
| **圖形 API** | WebGPU (fallback to WebGL2) |
| **著色器語言** | WGSL (WebGPU Shading Language) |

---

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動開發伺服器

```bash
npm run dev
```

專案將在 `http://localhost:3000` 自動開啟。

### 3. 建置生產版本

```bash
npm run build
```

輸出至 `dist/` 目錄。

### 4. 預覽生產版本

```bash
npm run preview
```

---

## 場景展示

### 🌊 Scene 1: "The Flow" (Waterfall Simulation)

**技術重點**: GPU Compute Shaders

- **50,000 粒子** 的 Lagrangian 流體模擬
- Storage Buffers 儲存粒子狀態於 GPU VRAM
- 包含重力、碰撞、黏滯力物理計算
- **效能**: 60 FPS @ 50K 粒子

**切換**: 按下 `[1]` 鍵

---

### 🌃 Scene 2: "Cyberpunk Night" (Rain City)

**技術重點**: PBR + SSR + Clustered Lighting

- **120+ 霓虹燈光源** 動態閃爍
- **PBR 材質系統**（Metallic/Roughness Workflow）
- **SSR** 螢幕空間反射（濕潤地面反射霓虹燈）
- **後處理**: Bloom、Chromatic Aberration、ACES Tone Mapping
- **效能**: 60 FPS @ 120+ lights

**切換**: 按下 `[2]` 鍵

---

## 瀏覽器支援

### WebGPU 支援度

| 瀏覽器 | 版本 | 狀態 |
|--------|------|------|
| **Chrome** | 113+ | ✅ 完整支援 |
| **Edge** | 113+ | ✅ 完整支援 |
| **Firefox** | Nightly | ⚠️ 實驗性 |
| **Safari** | ❌ 未支援 | ⚠️ 自動 Fallback to WebGL2 |

**注意**: 若瀏覽器不支援 WebGPU，系統會自動降級至 WebGL2，但功能會受限：
- ❌ Compute Shader 不可用（粒子數量降至 <5K）
- ⚠️ SSR 效能較差

---

## 專案結構

```
3D_Realistic_CV/
├── src/
│   ├── main.ts                      # 應用入口
│   ├── core/
│   │   ├── Engine.ts                # WebGPU/WebGL2 引擎封裝
│   │   └── SceneManager.ts          # 場景管理器
│   ├── scenes/
│   │   ├── WaterfallScene.ts        # 瀑布場景
│   │   └── CyberpunkCityScene.ts    # 賽博龐克場景
│   ├── modules/
│   │   └── ComputeParticleSystem.ts # GPU 粒子系統
│   ├── shaders/
│   │   └── particle-compute.wgsl    # WGSL Compute Shader
│   └── utils/
│       └── FPSCounter.ts            # FPS 顯示
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 核心程式碼範例

### WebGPU Engine 初始化

```typescript
// src/core/Engine.ts
async initialize(): Promise<boolean> {
  if (await WebGPUEngine.IsSupportedAsync) {
    return await this.initializeWebGPU();
  } else {
    return this.initializeWebGL2();
  }
}
```

### WGSL Compute Shader

```wgsl
// src/shaders/particle-compute.wgsl
@compute @workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;
  var particle = particles[index];

  // 並行計算每個粒子的物理
  particle.velocity += params.gravity * params.deltaTime;
  particle.position += particle.velocity * params.deltaTime;

  particles[index] = particle;
}
```

### 賽博龐克後處理

```typescript
// src/scenes/CyberpunkCityScene.ts
this.renderPipeline.bloomEnabled = true;
this.renderPipeline.bloomThreshold = 0.4;
this.renderPipeline.imageProcessing.toneMappingType = 1; // ACES
this.renderPipeline.chromaticAberrationEnabled = true;
```

---

## 效能優化建議

1. **使用高效能 GPU**：WebGPU 高度依賴 GPU 算力
2. **關閉不必要的瀏覽器擴充套件**（可能影響 Canvas 效能）
3. **開啟硬體加速**：
   - Chrome: `chrome://settings/` → 系統 → 使用硬體加速
4. **監控 FPS**：畫面右上角顯示即時 FPS
   - 🟢 綠色 (>55 FPS): 優秀
   - 🟡 黃色 (30-55 FPS): 可接受
   - 🔴 紅色 (<30 FPS): 需優化

---

## 除錯指南

### 檢查 WebGPU 狀態

在瀏覽器控制台執行：

```javascript
navigator.gpu !== undefined
```

- `true`: WebGPU 可用
- `false`: 自動使用 WebGL2 Fallback

### 查看引擎資訊

控制台會顯示：
```
🚀 Application initialized successfully
📊 Engine: WebGPU  // 或 WebGL2
🎬 Active Scene: waterfall
```

### 常見問題

**Q: 畫面是黑的？**
A: 檢查控制台錯誤，可能是 Shader 編譯失敗或瀏覽器不支援。

**Q: FPS 很低？**
A: 確認是否在使用整合顯卡（建議使用獨立顯卡）。

**Q: 粒子不動？**
A: WebGPU 可能未啟用，檢查 `chrome://flags/#enable-unsafe-webgpu`。

---

## 開發指令

```bash
# 開發模式（熱重載）
npm run dev

# 類型檢查
npm run type-check

# 生產建置
npm run build

# 預覽建置結果
npm run preview
```

---

## 技術文檔

詳細技術規格請參閱：[TECH_SPECS.md](./TECH_SPECS.md)

---

## 授權

本專案為個人技術展示作品，程式碼遵循 MIT License。

---

## 聯絡資訊

- **專案**: 3D Resume WebGPU Tech Demo
- **技術堆疊**: Babylon.js 8.0 + WebGPU + TypeScript
- **建置日期**: 2025-12-10

**展示你的技術實力，用程式碼說話！** 🎨✨
