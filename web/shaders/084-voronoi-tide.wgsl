// @id 084
// @name VORONOI_TIDE
// @category VORONOI
// @knob JITTER -1.0000 1.0000 0.0000
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.2000, 0.5000, 0.6000) + vec3<f32>(0.3000, 0.4000, 0.5000) * cos(6.28318 * (vec3<f32>(1.0000, 1.0000, 1.0000) * s + vec3<f32>(0.0000, 0.1500, 0.3000))); }
fn h22(p: vec2<f32>) -> vec2<f32> { let q = vec2<f32>(dot(p, vec2<f32>(127.1, 311.7)), dot(p, vec2<f32>(269.5, 183.3))); return fract(sin(q) * 43758.5453); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 1.1000 * u.params.x;
  let sc = 4.2000 * u.params.y;
  let g = uv * sc;
  let id = floor(g);
  let fp = fract(g);
  var md = 8.0;
  for (var j: i32 = -1; j <= 1; j = j + 1) {
    for (var i: i32 = -1; i <= 1; i = i + 1) {
      let o = vec2<f32>(f32(i), f32(j));
      let rnd = h22(id + o);
      let pt = o + vec2<f32>(0.5) + (0.5 + u.extra.x * 0.4) * sin(vec2<f32>(t) + 6.28318 * rnd);
      md = min(md, length(fp - pt));
    }
  }
  return pal(md + t * 0.1);
}
