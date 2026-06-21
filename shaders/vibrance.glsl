#version 300 es
precision highp float;
uniform sampler2D u_texture;
uniform float u_intensity;
in vec2 v_texCoord;
out vec4 fragColor;

vec4 applyEffect(vec4 color, float intensity) {
    float maxChan = max(color.r, max(color.g, color.b));
    float minChan = min(color.r, min(color.g, color.b));
    float sat = maxChan - minChan;
    vec3 gray = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114)));
    vec3 result = mix(gray, color.rgb, 1.0 + intensity * 0.5);
    return vec4(result, color.a);
}
