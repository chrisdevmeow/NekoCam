#version 300 es
precision highp float;
uniform sampler2D u_texture;
uniform float u_intensity;
in vec2 v_texCoord;
out vec4 fragColor;

vec4 applyEffect(vec4 color, float intensity) {
    float tint = intensity * 2.0 - 1.0; // -1 green, +1 magenta
    vec3 result = color.rgb;
    result.g += tint * 0.2;
    result.b += tint * 0.1;
    return vec4(result, color.a);
}
