// @id 032
// @name GRID_PRISM
// @category GRID
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.5000, 0.5000, 0.5000) + vec3<f32>(0.5000, 0.5000, 0.5000) * cos(6.28318 * (vec3<f32>(1.0000, 1.0000, 1.0000) * s + vec3<f32>(0.0000, 0.3300, 0.6700))); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 1.4000 * u.params.x;
  let sc = 10.2000 * u.params.y;
  let g = abs(fract(uv * sc + vec2<f32>(t * 0.1)) - 0.5);
  let line = smoothstep(0.0, 0.04, min(g.x, g.y));
  return pal((1.0 - line) * 0.6 + length(uv) * 0.5 + t * 0.05);
}
