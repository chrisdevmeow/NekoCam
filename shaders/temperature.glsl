#version 300 es
precision highp float;
uniform sampler2D u_texture;
uniform float u_intensity;
in vec2 v_texCoord;
out vec4 fragColor;

vec4 applyEffect(vec4 color, float intensity) {
    float temp = intensity * 2.0 - 1.0; // -1 warm, +1 cool
    vec3 warm = vec3(1.0, 0.8, 0.6);
    vec3 cool = vec3(0.6, 0.8, 1.0);
    vec3 result = color.rgb;
    if (temp < 0.0) {
        result *= mix(vec3(1.0), warm, -temp);
    } else {
        result *= mix(vec3(1.0), cool, temp);
    }
    return vec4(result, color.a);
}
