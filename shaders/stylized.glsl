#version 300 es
precision highp float;
uniform sampler2D u_texture;
uniform float u_intensity;
in vec2 v_texCoord;
out vec4 fragColor;

vec4 applyEffect(vec4 color, float intensity) {
    // PIXELATE
    #ifdef PIXELATE
        float size = mix(1.0, 40.0, intensity);
        vec2 uv = v_texCoord * vec2(1280.0, 720.0);
        vec2 pixel = floor(uv / size) * size + size * 0.5;
        vec2 coord = pixel / vec2(1280.0, 720.0);
        return texture(u_texture, coord);
    #endif

    // MOSAIC
    #ifdef MOSAIC
        float size = mix(1.0, 30.0, intensity);
        vec2 uv = v_texCoord * vec2(1280.0, 720.0);
        vec2 tile = floor(uv / size);
        vec2 center = tile * size + size * 0.5;
        vec2 coord = center / vec2(1280.0, 720.0);
        return texture(u_texture, coord);
    #endif

    // POSTERIZE
    #ifdef POSTERIZE
        float levels = mix(255.0, 4.0, intensity);
        vec3 quantized = floor(color.rgb * levels) / levels;
        return vec4(quantized, color.a);
    #endif

    // OIL-PAINT
    #ifdef OIL_PAINT
        float radius = mix(1.0, 8.0, intensity);
        vec2 texel = 1.0 / vec2(1280.0, 720.0);
        vec4 sum = vec4(0.0);
        float count = 0.0;
        for (float y = -8.0; y <= 8.0; y += 1.0) {
            for (float x = -8.0; x <= 8.0; x += 1.0) {
                if (abs(x) <= radius && abs(y) <= radius) {
                    sum += texture(u_texture, v_texCoord + vec2(x, y) * texel);
                    count += 1.0;
                }
            }
        }
        return sum / count;
    #endif

    // WATERCOLOR
    #ifdef WATERCOLOR
        float radius = mix(1.0, 5.0, intensity);
        vec2 texel = 1.0 / vec2(1280.0, 720.0);
        vec4 sum = vec4(0.0);
        float weight = 0.0;
        vec3 center = color.rgb;
        for (float y = -5.0; y <= 5.0; y += 1.0) {
            for (float x = -5.0; x <= 5.0; x += 1.0) {
                if (abs(x) <= radius && abs(y) <= radius) {
                    vec4 sample = texture(u_texture, v_texCoord + vec2(x, y) * texel);
                    float diff = length(sample.rgb - center);
                    float w = exp(-diff * 4.0);
                    sum += sample * w;
                    weight += w;
                }
            }
        }
        return sum / weight;
    #endif

    // PENCIL-SKETCH
    #ifdef PENCIL_SKETCH
        vec2 texel = 1.0 / vec2(1280.0, 720.0);
        float gx = 0.0, gy = 0.0;
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        for (float y = -1.0; y <= 1.0; y += 1.0) {
            for (float x = -1.0; x <= 1.0; x += 1.0) {
                vec2 off = vec2(x, y) * texel;
                float s = dot(texture(u_texture, v_texCoord + off).rgb, vec3(0.299, 0.587, 0.114));
                float kx = x * (y == 0.0 ? 2.0 : 1.0);
                float ky = y * (x == 0.0 ? 2.0 : 1.0);
                gx += s * kx;
                gy += s * ky;
            }
        }
        float edge = sqrt(gx * gx + gy * gy);
        float sketch = 1.0 - clamp(edge * intensity * 2.0, 0.0, 1.0);
        return vec4(vec3(sketch), color.a);
    #endif

    // COMIC
    #ifdef COMIC
        vec3 result = floor(color.rgb * 6.0) / 6.0;
        float edge = 1.0 - texture(u_texture, v_texCoord + vec2(0.001, 0.0)).r;
        edge += 1.0 - texture(u_texture, v_texCoord + vec2(0.0, 0.001)).r;
        result *= 1.0 - clamp(edge * 0.5, 0.0, 0.5) * intensity;
        return vec4(result, color.a);
    #endif

    // CROSS-HATCH
    #ifdef CROSS_HATCH
        vec2 uv = v_texCoord * 20.0;
        float hatch = sin(uv.x) * sin(uv.y);
        float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        float lines = smoothstep(0.0, 0.5, hatch * 0.5 + 0.5);
        float result = mix(lines, 1.0, brightness);
        return vec4(vec3(result), color.a);
    #endif

    // POINTILLISM
    #ifdef POINTILLISM
        vec2 uv = v_texCoord * 50.0;
        vec2 dotPos = floor(uv) + 0.5;
        float dist = length(uv - dotPos);
        float radius = 0.3 + 0.4 * (1.0 - intensity);
        if (dist > radius) {
            return vec4(0.0, 0.0, 0.0, 1.0);
        }
        return color;
    #endif

    // NEON-GLOW
    #ifdef NEON_GLOW
        vec2 texel = 1.0 / vec2(1280.0, 720.0);
        vec4 glow = vec4(0.0);
        for (float y = -3.0; y <= 3.0; y += 1.0) {
            for (float x = -3.0; x <= 3.0; x += 1.0) {
                vec2 off = vec2(x, y) * texel;
                float dist = length(vec2(x, y));
                float weight = exp(-dist * 0.5);
                glow += texture(u_texture, v_texCoord + off) * weight;
            }
        }
        float gray = dot(glow.rgb, vec3(0.299, 0.587, 0.114));
        return vec4(glow.rgb * (1.0 + gray * 0.5 * intensity), color.a);
    #endif

    return color;
}
