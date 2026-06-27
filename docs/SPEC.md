# SHADER_LIB — 架构与契约

> Gemini AI Hackathon · Live: https://shader-94o.pages.dev/ · Repo: https://github.com/tangivis/SHADER · by カキ · 0xtang

纯本地实时 shader 画廊。Rust+wgpu(WASM) 渲染，CRT 终端 UI，100 个文件夹驱动的 shader 模版，每个带实时参数。

---

## 1. 数据流

```
web/shaders/*.wgsl ──(Vite import.meta.glob)──▶ main.js 解析 @id/@name/@category/@knob
       │                                              │
       │ 选中一个                                       ▼
       └──────────── playground.set_shader(code) ──▶ src/lib.rs
                     滑块 ─ set_params / set_extra ──▶  拼装 PRELUDE+code+SUFFIX
                                                        → naga 校验 → wgpu pipeline
                                                        → rAF 每帧写 uniform、全屏 60fps
```

渲染核 (`src/lib.rs`) 不含任何业务逻辑，只做：初始化 wgpu、编译热替换 shader、跑渲染循环、暴露 setter。

---

## 2. 渲染契约（CONTRACTS）

### 2.1 Uniform（src/lib.rs 与 gen 脚本共享，64 字节）

```wgsl
struct Uniforms {
  resolution : vec2<f32>,   // 像素
  time       : f32,         // 秒
  frame      : f32,         // 帧计数
  mouse      : vec4<f32>,   // xy=指针(px,左下原点) z=按下 w=0
  params     : vec4<f32>,   // x=SPEED y=SCALE z=HUE w=BRIGHT（4 个通用旋钮）
  extra      : vec4<f32>,   // 专属旋钮 e0..e3（按 @knob 顺序）
};
@group(0) @binding(0) var<uniform> u: Uniforms;
```

Rust 镜像 `#[repr(C)]`：`resolution:[f32;2], time, frame, mouse:[f32;4], params:[f32;4], extra:[f32;4]`。

### 2.2 拼装（PRELUDE + 文件内容 + SUFFIX）

- **PRELUDE**（固定）：上面的 `Uniforms` + 绑定 + 全屏三角形顶点着色器 `vs_main`。
- **文件内容**：shader 作者写的 `mainImage` 及 helper。
- **SUFFIX**（固定）：
  ```wgsl
  @fragment
  fn fs_main(@builtin(position) frag_coord: vec4<f32>) -> @location(0) vec4<f32> {
    let p = vec2<f32>(frag_coord.x, u.resolution.y - frag_coord.y); // 翻 Y → 左下原点
    let col = mainImage(p) * u.params.w;                            // BRIGHT 在此应用
    return vec4<f32>(clamp(col, vec3<f32>(0.0), vec3<f32>(1.0)), 1.0);
  }
  ```

### 2.3 wasm-bindgen 接口

```rust
Playground.create(canvas) -> Promise<Playground>   // 异步工厂（非构造函数）
playground.set_shader(code) -> Result               // 失败返回 naga 带源码标注错误
playground.set_params(speed, scale, hue, bright)    // 4 个通用旋钮
playground.set_extra(e0, e1, e2, e3)                // 专属旋钮
playground.set_mouse(x, y, down)                    // 像素，左下原点
```

---

## 3. Shader 文件格式（web/shaders/*.wgsl）

```wgsl
// @id 066
// @name JULIA_EMBER
// @category JULIA
// @knob MORPH -1.0 1.0 0.0        // 可选，0~4 个；映射到 u.extra.x/y/z/w（按顺序）
fn pal(t: f32) -> vec3<f32> { ... }     // 任意 helper
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R  = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t  = u.time * <baseSpeed> * u.params.x;   // SPEED 注入
  let sc = <baseScale> * u.params.y;            // SCALE 注入
  ...                                           // HUE 在 pal() 里 (+ u.params.z)
  return pal(...);                              // 返回线性 RGB [0,1]
}
```

- 必须定义 `fn mainImage(frag_coord: vec2<f32>) -> vec3<f32>`。
- 可读 `u.params.*`（通用旋钮）与 `u.extra.*`（专属旋钮）。
- 不要重复声明 `Uniforms`/`u`，不要写 `@vertex`/`@fragment`（宿主提供）。
- UI 自动：通用 4 旋钮恒在；`@knob` 声明的旋钮按文件动态生成滑块（标签=第 1 字段）。

### WGSL 注意
强类型无隐式转换；浮点要带小数点；无 `mod`、无三元（用 `select`）、无 `++`；`atan2(y,x)`；
matrix/vector 构造显式。改完务必跑校验（见 §4）。

---

## 4. 校验与构建

- **校验**：所有 shader 必须过 `naga` parse+validate（拼装后）。仓库外有一个独立 naga 校验器；
  CI 思路是对每个文件 `PRELUDE+body+SUFFIX` 跑 `naga::front::wgsl::parse_str` + `Validator::validate`。
  目标恒为 **100/100 passed**。
- **生成**：`node web/scripts/gen-shaders.mjs`（= `npm run gen`）。家族/调色板/变体/旋钮都在此。
- **构建**：`npm run build:wasm`（改 Rust 后）+ `npm run dev`。

---

## 5. 已知约束

- **wgpu 0.20 + 新版 Chrome**：wgpu 传了废弃 limits，`index.html` 用一段 shim 删掉
  `maxInterStageShaderComponents` / `maxInterStageShaderVariables`——**勿删**。
- **WebGPU only**：目标 Chrome/Edge 113+。
- 改 Rust 必须重跑 `build:wasm`（Vite 不自动重编 WASM）。
- 时间用 `performance.now()`。PRELUDE/SUFFIX 只在 `src/lib.rs` 维护一份。
