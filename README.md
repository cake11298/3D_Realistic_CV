專案概覽 (Project Overview) — 3D Resume 重構計畫
概念：將傳統履歷的「條列式資訊」轉化為「空間探索體驗」。

場景設計：

Waterfall Scene (瀑布)：象徵技能的流動與累積 — [技術驗證點：Compute Shaders]。

Cyberpunk City (賽博城市)：象徵創新與未來視野 — [技術驗證點：Clustered Lighting & SSR]。

技術堆疊：Babylon.js 8.0 (WebGPU Engine), TypeScript, Vite.

Slide 5: 核心技術 I — 讓 GPU 算物理 (Compute Shaders)
應用場景：瀑布場景中的粒子流體模擬 (Lagrangian Fluid Simulation)。

技術實作：

Storage Buffers：粒子位置 (Position) 與速度 (Velocity) 數據全程駐留在 GPU VRAM，不回傳 CPU。

Parallelism：利用 GPU 的數千個核心並行計算每一顆水滴的物理碰撞。

代碼展示：秀出一小段 WGSL (WebGPU Shading Language) 的 Compute Shader 代碼，證明你碰過底層。

Slide 6: 效能對照 — CPU vs. GPU 粒子系統
數據視覺化 (Bar Chart)：

CPU (Legacy Way)：極限約 5,000 粒子，FPS 掉到 20。

GPU (Compute Shader)：輕鬆承載 100,000+ 粒子，穩定 60 FPS。

結論：WebGPU 釋放了瀏覽器的算力，實現了「百萬粒子級」的互動體驗。

Slide 7: 核心技術 II — 叢集光照與渲染 (Clustered Lighting)
應用場景：Cyberpunk City 的霓虹夜景。

挑戰：傳統 Forward Rendering 在超過 10 盞燈光後效能會崩潰。

解決方案：

Clustered Forward Rendering：將視錐體 (Frustum) 切割成無數個 3D 小格 (Clusters)，每個格子只計算影響該區域的燈光。

成果：在場景中放置 100+ 個動態霓虹招牌光源，依然保持流暢。

Slide 8: 視覺極致 — 後處理管線 (Post-Processing Pipeline)
畫面質感提升術：

SSR (Screen Space Reflections)：即時計算地面積水的倒影（這在舊版 WebGL 很吃力，但在 WebGPU 上更有效率）。

Bloom (輝光)：讓霓虹燈管產生迷幻的暈光效果。

Tone Mapping (ACES)：電影級的色調映射。

對比圖：放一張 [無特效] vs [全特效開啟] 的對比圖，視覺衝擊力極強。