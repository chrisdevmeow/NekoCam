#version 300 es
precision highp float;
uniform sampler2D u_texture;
uniform float u_intensity;
in vec2 v_texCoord;
out vec4 fragColor;

vec4 applyEffect(vec4 color, float intensity) {
    float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    float boost = smoothstep(0.0, 0.5, 1.0 - brightness) * intensity * 0.5;
    vec3 result = color.rgb + boost;
    return vec4(result, color.a);
}
