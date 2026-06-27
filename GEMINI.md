# GEMINI.md — SHADER_LIB 项目上下文

供在本仓库工作的 coding agent 自动读取。详尽契约见 `docs/SPEC.md`。

## 一句话
纯本地、离线的实时 GPU shader 画廊：100 个 `.wgsl` 模版，由 Rust+wgpu(WASM) 60fps 渲染，
CRT 终端 UI 浏览，每个 shader 带实时参数（通用 4 旋钮 + 可选专属旋钮）。**无 AI、无 key、无联网。**

## 结构
- `src/lib.rs` — wgpu 渲染核 + wasm-bindgen 导出：`Playground.create / set_shader / set_params / set_extra / set_mouse`。
- `web/main.js` — `import.meta.glob` 加载 shaders、列表/过滤/键盘、通用滑块 + 动态专属滑块。
- `web/index.html` / `style.css` — CRT 终端主题（含 WebGPU 兼容 shim）。
- `web/shaders/*.wgsl` — 100 个模版（生成产物）。
- `web/scripts/gen-shaders.mjs` — 生成器（家族 × 调色板变体 + `@knob`）。

## 改东西时
- **批量风格/新增家族/调旋钮** → 改 `gen-shaders.mjs`，`npm run gen` 重新生成。
- **手写单个 shader** → 在 `web/shaders/` 放 `.wgsl`，按 `docs/SPEC.md §3` 的契约写 `mainImage`。
- **改渲染核/uniform** → 改 `src/lib.rs`，记得 `npm run build:wasm`。

## 不可违反的契约（详见 SPEC §2）
- shader 只写 `mainImage(frag_coord: vec2<f32>) -> vec3<f32>` + helper；顶点/uniform/片元包装由 PRELUDE/SUFFIX 固定提供，**只在 `src/lib.rs` 维护一份**。
- uniform 64 字节，`#[repr(C)]` 镜像 WGSL `Uniforms`（含 `params` 通用旋钮、`extra` 专属旋钮）。
- 任何 shader 改动后必须过 `naga` 校验，目标 **100/100**。

## 坑
- **wgpu 0.20 + 新 Chrome**：`index.html` 的 shim 删掉废弃 limits，**别删**。
- WebGPU only（Chrome/Edge 113+）。
- WGSL 强类型：浮点带小数点、无 `mod`、无三元（用 `select`）、`atan2(y,x)`、构造显式。
- 改 Rust 必须重跑 `build:wasm`。时间用 `performance.now()`。
- 纯本地，**不要引入任何网络/AI/key 依赖**。

## 验证
- `cargo check --target wasm32-unknown-unknown` 通过。
- 所有 `.wgsl` 经 naga 校验 100/100。
- `npx vite build` 能打包。
