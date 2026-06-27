use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use web_sys::HtmlCanvasElement;
use wgpu::util::DeviceExt;

#[wasm_bindgen(start)]
fn start() {
    console_error_panic_hook::set_once();
    console_log::init_with_level(log::Level::Warn).expect("Couldn't initialize logger");
}

const PRELUDE: &str = r#"
struct Uniforms {
  resolution : vec2<f32>,
  time       : f32,
  frame      : f32,
  mouse      : vec4<f32>,
  params     : vec4<f32>,
  extra      : vec4<f32>,
};
@group(0) @binding(0) var<uniform> u: Uniforms;

@vertex
fn vs_main(@builtin(vertex_index) vid: u32) -> @builtin(position) vec4<f32> {
  // 全屏三角形（覆盖整个裁剪空间）
  var verts = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 3.0, -1.0),
    vec2<f32>(-1.0,  3.0),
  );
  return vec4<f32>(verts[vid], 0.0, 1.0);
}
"#;

const SUFFIX: &str = r#"
@fragment
fn fs_main(@builtin(position) frag_coord: vec4<f32>) -> @location(0) vec4<f32> {
  // wgpu 的 frag_coord 原点在左上；翻 Y 得到 Shadertoy 的左下原点
  let p = vec2<f32>(frag_coord.x, u.resolution.y - frag_coord.y);
  let col = mainImage(p) * u.params.w;
  return vec4<f32>(clamp(col, vec3<f32>(0.0), vec3<f32>(1.0)), 1.0);
}
"#;

#[repr(C)]
#[derive(Clone, Copy, bytemuck::Pod, bytemuck::Zeroable)]
struct Uniforms {
    resolution: [f32; 2],
    time: f32,
    frame: f32,
    mouse: [f32; 4],
    params: [f32; 4],
    extra: [f32; 4],
}

struct State {
    surface: wgpu::Surface<'static>,
    device: wgpu::Device,
    queue: wgpu::Queue,
    config: wgpu::SurfaceConfiguration,
    uniform_buf: wgpu::Buffer,
    bind_group: wgpu::BindGroup,
    bind_group_layout: wgpu::BindGroupLayout,
    pipeline: Option<wgpu::RenderPipeline>,
    uniforms: Uniforms,
    start_time: f64,
    canvas: HtmlCanvasElement,
    mouse: [f32; 4],
}

#[wasm_bindgen]
pub struct Playground {
    state: Rc<RefCell<State>>,
    _raf: Rc<RefCell<Option<Closure<dyn FnMut()>>>>,
}

#[wasm_bindgen]
impl Playground {
    pub async fn create(canvas: HtmlCanvasElement) -> Result<Playground, JsValue> {
        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
            backends: wgpu::Backends::BROWSER_WEBGPU,
            ..Default::default()
        });

        let surface_target = wgpu::SurfaceTarget::Canvas(canvas.clone());
        let surface = instance.create_surface(surface_target).map_err(|e| JsValue::from_str(&e.to_string()))?;

        let adapter = instance
            .request_adapter(&wgpu::RequestAdapterOptions {
                power_preference: wgpu::PowerPreference::HighPerformance,
                compatible_surface: Some(&surface),
                force_fallback_adapter: false,
            })
            .await
            .ok_or_else(|| JsValue::from_str("No suitable WebGPU adapter found"))?;

        let (device, queue) = adapter
            .request_device(
                &wgpu::DeviceDescriptor {
                    label: None,
                    required_features: wgpu::Features::empty(),
                    required_limits: adapter.limits(),
                },
                None,
            )
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let caps = surface.get_capabilities(&adapter);
        let format = caps.formats[0];

        let mut width = canvas.width();
        let mut height = canvas.height();
        if width == 0 { width = 1; }
        if height == 0 { height = 1; }

        let config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            format,
            width,
            height,
            present_mode: wgpu::PresentMode::Fifo,
            alpha_mode: caps.alpha_modes[0],
            view_formats: vec![],
            desired_maximum_frame_latency: 2,
        };
        surface.configure(&device, &config);

        let uniforms = Uniforms {
            resolution: [width as f32, height as f32],
            time: 0.0,
            frame: 0.0,
            mouse: [0.0; 4],
            params: [1.0, 1.0, 0.0, 1.0],
            extra: [0.0; 4],
        };

        let uniform_buf = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("Uniform Buffer"),
            contents: bytemuck::bytes_of(&uniforms),
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
        });

        let bind_group_layout = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: None,
            entries: &[wgpu::BindGroupLayoutEntry {
                binding: 0,
                visibility: wgpu::ShaderStages::FRAGMENT,
                ty: wgpu::BindingType::Buffer {
                    ty: wgpu::BufferBindingType::Uniform,
                    has_dynamic_offset: false,
                    min_binding_size: None,
                },
                count: None,
            }],
        });

        let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: None,
            layout: &bind_group_layout,
            entries: &[wgpu::BindGroupEntry {
                binding: 0,
                resource: uniform_buf.as_entire_binding(),
            }],
        });

        let window = web_sys::window().unwrap();
        let start_time = window.performance().unwrap().now();

        let state = Rc::new(RefCell::new(State {
            surface,
            device,
            queue,
            config,
            uniform_buf,
            bind_group,
            bind_group_layout,
            pipeline: None,
            uniforms,
            start_time,
            canvas: canvas.clone(),
            mouse: [0.0; 4],
        }));

        type RafClosure = Closure<dyn FnMut()>;
        let f: Rc<RefCell<Option<RafClosure>>> = Rc::new(RefCell::new(None));
        let g = f.clone();
        
        let state_clone = state.clone();
        *g.borrow_mut() = Some(Closure::wrap(Box::new(move || {
            render_frame(&state_clone);
            web_sys::window()
                .unwrap()
                .request_animation_frame(f.borrow().as_ref().unwrap().as_ref().unchecked_ref())
                .unwrap();
        }) as Box<dyn FnMut()>));

        web_sys::window()
            .unwrap()
            .request_animation_frame(g.borrow().as_ref().unwrap().as_ref().unchecked_ref())
            .unwrap();

        Ok(Playground { state, _raf: g })
    }

    pub fn set_shader(&self, generated_wgsl: &str) -> Result<(), JsValue> {
        let full = format!("{}\n{}\n{}", PRELUDE, generated_wgsl, SUFFIX);
        
        let module = naga::front::wgsl::parse_str(&full)
            .map_err(|e| JsValue::from_str(&e.emit_to_string(&full)))?;
            
        let mut validator = naga::valid::Validator::new(
            naga::valid::ValidationFlags::all(),
            naga::valid::Capabilities::all(),
        );
        let _info = validator.validate(&module)
            .map_err(|e| JsValue::from_str(&e.emit_to_string(&full)))?;

        let mut state = self.state.borrow_mut();

        let shader = state.device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("user_shader"),
            source: wgpu::ShaderSource::Wgsl(full.into()),
        });

        let pipeline_layout = state.device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: None,
            bind_group_layouts: &[&state.bind_group_layout],
            push_constant_ranges: &[],
        });

        let pipeline = state.device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: None,
            layout: Some(&pipeline_layout),
            vertex: wgpu::VertexState {
                module: &shader,
                entry_point: "vs_main",
                buffers: &[],
                compilation_options: wgpu::PipelineCompilationOptions::default(),
            },
            fragment: Some(wgpu::FragmentState {
                module: &shader,
                entry_point: "fs_main",
                targets: &[Some(wgpu::ColorTargetState {
                    format: state.config.format,
                    blend: Some(wgpu::BlendState::REPLACE),
                    write_mask: wgpu::ColorWrites::ALL,
                })],
                compilation_options: wgpu::PipelineCompilationOptions::default(),
            }),
            primitive: wgpu::PrimitiveState {
                topology: wgpu::PrimitiveTopology::TriangleList,
                ..Default::default()
            },
            depth_stencil: None,
            multisample: wgpu::MultisampleState::default(),
            multiview: None,
        });

        state.pipeline = Some(pipeline);
        Ok(())
    }

    pub fn set_mouse(&self, x: f32, y: f32, down: bool) {
        let mut state = self.state.borrow_mut();
        state.mouse = [x, y, if down { 1.0 } else { 0.0 }, 0.0];
    }

    /// Live knobs: speed (x time), scale (x freq), hue shift, brightness.
    pub fn set_params(&self, speed: f32, scale: f32, hue: f32, bright: f32) {
        let mut state = self.state.borrow_mut();
        state.uniforms.params = [speed, scale, hue, bright];
    }

    /// Per-shader custom knobs (e0..e3), referenced as u.extra.x/y/z/w in WGSL.
    pub fn set_extra(&self, e0: f32, e1: f32, e2: f32, e3: f32) {
        let mut state = self.state.borrow_mut();
        state.uniforms.extra = [e0, e1, e2, e3];
    }

    pub fn assembled_source(&self, generated_wgsl: &str) -> String {
        format!("{}\n{}\n{}", PRELUDE, generated_wgsl, SUFFIX)
    }
}

fn render_frame(state_rc: &Rc<RefCell<State>>) {
    let mut state = state_rc.borrow_mut();
    
    let mut w = state.canvas.width();
    let mut h = state.canvas.height();
    if w == 0 { w = 1; }
    if h == 0 { h = 1; }

    if w != state.config.width || h != state.config.height {
        state.config.width = w;
        state.config.height = h;
        state.surface.configure(&state.device, &state.config);
    }

    let now = web_sys::window().unwrap().performance().unwrap().now();
    state.uniforms.resolution = [w as f32, h as f32];
    state.uniforms.time = ((now - state.start_time) / 1000.0) as f32;
    state.uniforms.frame += 1.0;
    state.uniforms.mouse = state.mouse;

    state.queue.write_buffer(&state.uniform_buf, 0, bytemuck::bytes_of(&state.uniforms));

    let output = match state.surface.get_current_texture() {
        Ok(t) => t,
        Err(_) => return,
    };

    let view = output.texture.create_view(&wgpu::TextureViewDescriptor::default());

    let mut encoder = state.device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
        label: Some("Render Encoder"),
    });

    {
        let mut render_pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
            label: Some("Render Pass"),
            color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                view: &view,
                resolve_target: None,
                ops: wgpu::Operations {
                    load: wgpu::LoadOp::Clear(wgpu::Color {
                        r: 0.05,
                        g: 0.05,
                        b: 0.05,
                        a: 1.0,
                    }),
                    store: wgpu::StoreOp::Store,
                },
            })],
            depth_stencil_attachment: None,
            timestamp_writes: None,
            occlusion_query_set: None,
        });

        if let Some(pipeline) = &state.pipeline {
            render_pass.set_pipeline(pipeline);
            render_pass.set_bind_group(0, &state.bind_group, &[]);
            render_pass.draw(0..3, 0..1);
        }
    }

    state.queue.submit(std::iter::once(encoder.finish()));
    output.present();
}
