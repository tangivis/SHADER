# SHADER_LIB 🟢

> 一个**纯本地、离线**的实时 GPU 着色器画廊。100 个 shader 由 **Rust + wgpu (WASM)** 以 60fps 渲染，
> 复古 CRT 终端界面浏览，每个 shader 都有**实时可调参数**。**无 AI、无 API key、无联网。**

```
┌─ SHADER_LIB v1.0 ────┐
│ [100 entries] _      │  ← 终端面板：列表 + 过滤 + 实时滑块
│ > type to filter...  │
│ ▸[077] STARFIELD_..  │     全屏 = 实时渲染的 shader
│  [078] STARFIELD_..  │     绿字 / 扫描线 / CRT 辉光
│ ── PARAMS ──         │
│ SPEED ▭▬▭ 1.00       │
│ SCALE ▭▬▭ 1.00       │
│ HUE   ▭▬▭ 0.00       │
│ BRIGHT▭▬▭ 1.00       │
└──────────────────────┘
```

## ✨ 特性

- **100 个实时 shader**：20 个家族 × 5 个调色板变体，全部经 `naga` 校验保证可编译（0 破图）。
- **每个 shader 4 个通用旋钮**：`SPEED`（速度）/ `SCALE`（缩放）/ `HUE`（色相）/ `BRIGHT`（亮度），拖动即时生效。
- **部分 shader 带专属旋钮**：如 `JULIA` 的 `MORPH`、`TUNNEL` 的 `TWIST`、`VORONOI` 的 `JITTER`——UI 读取 shader 文件头的 `@knob` 声明**动态生成**滑块。
- **文件夹驱动**：`web/shaders/*.wgsl`，丢一个文件就多一个模版。
- **键盘操作**：`↑/↓` 浏览 · `R` 随机 · `0` 复位参数 · 输入框打字过滤 · 鼠标在画面上交互。

## 🧱 技术栈

- **渲染核**：Rust + [`wgpu`](https://wgpu.rs) 0.20（WebGPU）+ [`naga`](https://github.com/gfx-rs/wgpu) 0.20（WGSL 校验）
- **WASM 胶水**：`wasm-bindgen` / `web-sys` / `bytemuck`
- **前端**：Vite + 原生 JS（无框架）；shader 经 `import.meta.glob` 加载
- **AI**：无。100% 本地。

## 🚀 运行

```bash
# 一次性
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
cd web && npm install

# 构建 WASM 渲染核（改了 Rust 后重跑）
npm run build:wasm

# 起开发服务器
npm run dev          # http://localhost:5173
```

> 需要支持 WebGPU 的浏览器（Chrome / Edge 113+）。`index.html` 里有一段兼容 shim，
> 修掉 wgpu 0.20 传给新版 Chrome 的废弃 limits——别删。

## 🗂 结构

```
src/lib.rs              # wgpu 渲染核 + wasm-bindgen 导出（set_shader / set_params / set_extra）
web/
  index.html            # CRT 终端 UI（含 WebGPU 兼容 shim）
  main.js               # 加载 shader、列表、过滤、滑块、键盘
  style.css             # CRT 绿字/扫描线主题
  shaders/*.wgsl        # 100 个 shader 模版（生成产物）
  scripts/gen-shaders.mjs  # 模版生成器（家族 × 变体 + @knob）
  pkg/                  # wasm-pack 产物（gitignore）
docs/SPEC.md            # 架构与契约
```

## ➕ 增改模版

- **改批量风格/参数**：编辑 `web/scripts/gen-shaders.mjs`（家族、调色板、变体、专属旋钮），跑 `npm run gen` 重新生成。
- **手写单个**：在 `web/shaders/` 放一个 `.wgsl`，按下面的契约写一个 `mainImage`，刷新即出现在列表。

shader 文件格式见 [`docs/SPEC.md`](docs/SPEC.md)。每个文件是一个 `mainImage(frag_coord) -> vec3<f32>`，
可读 `u.params`（4 个通用旋钮）和 `u.extra`（专属旋钮），宿主固定提供顶点/uniform/片元包装。
