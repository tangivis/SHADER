// @id 060
// @name DOTS_PHOSPHOR
// @category DOTS
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.0000, 0.4000, 0.1000) + vec3<f32>(0.1000, 0.5000, 0.1000) * cos(6.28318 * (vec3<f32>(1.0000, 1.0000, 1.0000) * s + vec3<f32>(0.0000, 0.2500, 0.1000))); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 0.9000 * u.params.x;
  let sc = 13.0000 * u.params.y;
  let cell = fract(uv * sc) - 0.5;
  let id = floor(uv * sc);
  let pulse = 0.35 + 0.15 * sin(t * 2.0 + id.x * 0.7 + id.y * 1.3);
  let v = smoothstep(pulse, pulse - 0.05, length(cell));
  return pal(v * 0.7 + (id.x + id.y) * 0.04 + t * 0.1);
}
