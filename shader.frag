#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vTexCoord;

uniform sampler2D texture;
uniform float splitting;
uniform float hue;

vec3 rgb2hsb(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsb2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

void main() {
    vec2 uv = vTexCoord;
    uv.y = 1.0 - uv.y;

    // rgb splitting
    vec2 offset = vec2(splitting * 0.03, 0.0);
    vec3 col;
    col.r = texture2D(texture, uv + offset).r;
    col.g = texture2D(texture, uv).g;
    col.b = texture2D(texture, uv - offset).b;

    //hue
    vec3 hsb = rgb2hsb(col);
    hsb.x += hue;
    if (hsb.x > 1.0) hsb.x -= 1.0;
    vec3 adjustedColor = hsb2rgb(hsb);
    gl_FragColor = vec4(adjustedColor, 1.0);
}
