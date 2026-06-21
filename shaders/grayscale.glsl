#version 300 es
precision highp float;
uniform sampler2D u_texture;
uniform float u_intensity;
in vec2 v_texCoord;
out vec4 fragColor;

vec4 applyEffect(vec4 color, float intensity) {
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    vec3 result = mix(color.rgb, vec3(gray), intensity);
    return vec4(result, color.a);
}
