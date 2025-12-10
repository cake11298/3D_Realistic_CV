# 🚀 3D Resume - WebGPU Tech Demo

> **將履歷轉化為 3D 互動體驗** | 展示瀏覽器的算力極限

<div align="center">

![Babylon.js](https://img.shields.io/badge/Babylon.js-8.0-blue?style=for-the-badge&logo=babylon.js)
![WebGPU](https://img.shields.io/badge/WebGPU-Enabled-green?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

</div>

---

## ✨ 專案亮點

這不是一個普通的履歷網站，而是一個 **Tech Demo 等級** 的技術展示專案：

### 🌊 Scene 1: The Flow (瀑布模擬)
- ⚡ **50,000+ 粒子** 即時流體模擬
- 🖥️ **GPU Compute Shaders** - 在 GPU 上並行計算物理
- 🎯 **60 FPS** 穩定效能
- 📊 **效能對比**: CPU 粒子系統 5K@20FPS → GPU 50K@60FPS

### 🌃 Scene 2: Cyberpunk Night (賽博城市)
- 💡 **120+ 動態光源** - 叢集光照技術
- ✨ **SSR 反射** - 濕潤地面即時反射霓虹燈
- 🎨 **電影級後處理** - Bloom、ACES Tone Mapping、色差
- 🏗️ **PBR 材質系統** - 物理正確的渲染

---

## 🎮 快速開始

### 安裝與運行

```bash
# 1. 安裝依賴
npm install

# 2. 啟動開發伺服器
npm run dev

# 3. 在瀏覽器開啟 http://localhost:3000
```

### 互動控制

| 按鍵 | 功能 |
|------|------|
| **1** | 切換到瀑布場景 |
| **2** | 切換到賽博龐克場景 |
| **滑鼠拖曳** | 旋轉視角 |
| **滾輪** | 縮放視野 |

---

## 🔧 技術架構

### 核心技術堆疊

```
Babylon.js 8.0 (WebGPU Engine)
    ↓
TypeScript 5.3
    ↓
Vite 5.0 (建置工具)
    ↓
WGSL (WebGPU Shading Language)
```

### 專案結構

```
📦 3D_Realistic_CV
├── 🎨 src/
│   ├── 🚀 main.ts                   # 入口
│   ├── ⚙️ core/
│   │   ├── Engine.ts                # WebGPU 引擎
│   │   └── SceneManager.ts          # 場景管理
│   ├── 🎬 scenes/
│   │   ├── WaterfallScene.ts        # 瀑布場景
│   │   └── CyberpunkCityScene.ts    # 賽博龐克場景
│   ├── 🔬 modules/
│   │   └── ComputeParticleSystem.ts # GPU 粒子系統
│   └── 🎨 shaders/
│       └── particle-compute.wgsl    # WGSL Compute Shader
├── 📄 index.html
└── 📦 package.json
```

---

## 🌐 瀏覽器支援

### WebGPU 支援度

| 瀏覽器 | 版本 | 狀態 | 備註 |
|--------|------|------|------|
| Chrome | 113+ | ✅ 推薦 | 完整支援 WebGPU |
| Edge | 113+ | ✅ 推薦 | 完整支援 WebGPU |
| Firefox | Nightly | ⚠️ 實驗性 | 需手動啟用 |
| Safari | - | ❌ 不支援 | 自動降級 WebGL2 |

**💡 提示**: 不支援 WebGPU 時會自動降級至 WebGL2，但部分功能會受限（如 Compute Shader）。

---

## 📊 效能指標

### 目標 FPS: 60

| 場景 | 粒子/光源數量 | WebGPU FPS | WebGL2 FPS |
|------|--------------|------------|------------|
| 瀑布場景 | 50,000 粒子 | **60** | ~20 (降至 5K) |
| 賽博城市 | 120+ 光源 | **60** | ~45 |

### 系統建議

- **GPU**: 獨立顯卡（建議）
- **RAM**: 8GB+
- **瀏覽器**: Chrome 113+ / Edge 113+

---

## 🎓 學習重點

### 1️⃣ Compute Shaders (WGSL)

```wgsl
@compute @workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;
  var particle = particles[index];

  // GPU 並行計算每個粒子的物理
  particle.velocity += params.gravity * params.deltaTime;
  particle.position += particle.velocity * params.deltaTime;

  particles[index] = particle;
}
```

**重點**:
- Storage Buffers 儲存粒子數據於 GPU VRAM
- Workgroup Size = 64，利用 GPU 並行算力
- 完全避免 GPU↔CPU 數據傳輸

---

### 2️⃣ PBR 材質 + SSR

```typescript
const groundMat = new PBRMaterial('groundMat', this.scene);
groundMat.metallic = 0.9;  // 高金屬度
groundMat.roughness = 0.1; // 低粗糙度 = 濕潤反射

// 啟用 SSR (螢幕空間反射)
const ssr = new SSRRenderingPipeline('ssr', scene, [camera]);
ssr.strength = 0.8;
```

---

### 3️⃣ 後處理管線

```typescript
pipeline.bloomEnabled = true;                        // Bloom 輝光
pipeline.imageProcessing.toneMappingType = 1;        // ACES 電影色調
pipeline.chromaticAberrationEnabled = true;          // 色差效果
```

---

## 📚 文檔

- **[開發指南](./README_DEV.md)** - 完整的開發文檔
- **[技術規格](./TECH_SPECS.md)** - 深入的技術細節
- **[Babylon.js 官方文檔](https://doc.babylonjs.com/)** - Babylon.js 學習資源

---

## 🎯 專案目標

這個專案的核心目標是：

1. ✅ **展示 WebGPU 算力** - 證明瀏覽器可以做到「遊戲引擎級」的渲染
2. ✅ **學習現代圖形技術** - Compute Shaders、PBR、SSR、Clustered Lighting
3. ✅ **重新定義履歷形式** - 從「條列式資訊」到「空間探索體驗」

---

## 🔮 未來計劃

- [ ] 加入滑鼠互動（點擊產生力場影響粒子）
- [ ] 實現場景平滑轉場效果
- [ ] 優化粒子渲染（改用 Instanced Rendering）
- [ ] 加入建築物紋理貼圖（Albedo/Normal/Roughness）
- [ ] 整合履歷資訊 UI（3D GUI）

---

## 📝 授權

本專案採用 MIT License 授權。

---

## 🙏 致謝

- **Babylon.js** - 強大的 WebGL/WebGPU 引擎
- **WebGPU Working Group** - 推動次世代圖形 API
- **社群貢獻者** - 所有提供建議的開發者

---

<div align="center">

**用程式碼展示你的技術實力** 💪

Made with ❤️ and WebGPU

</div>
