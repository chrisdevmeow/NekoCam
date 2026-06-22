#version 300 es
precision highp float;
uniform sampler2D u_texture;
uniform float u_intensity;
in vec2 v_texCoord;
out vec4 fragColor;

// Random helper
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

vec4 applyEffect(vec4 color, float intensity) {
    // CHROMATIC-ABERRATION
    #ifdef CHROMATIC_ABERRATION
        float shift = 0.001 * intensity * 2.0;
        float r = texture(u_texture, v_texCoord + vec2(shift, 0.0)).r;
        float g = texture(u_texture, v_texCoord).g;
        float b = texture(u_texture, v_texCoord - vec2(shift, 0.0)).b;
        return vec4(r, g, b, color.a);
    #endif

    // DATAMOSH
    #ifdef DATAMOSH
        float block = 0.02 * intensity;
        vec2 uv = v_texCoord;
        float rand = hash(floor(uv / block));
        if (rand > 0.9) {
            uv.x += 0.1 * (rand - 0.5);
        }
        return texture(u_texture, uv);
    #endif

    // SCANLINES
    #ifdef SCANLINES
        float line = sin(v_texCoord.y * 500.0) * 0.5 + 0.5;
        float dark = mix(0.7, 1.0, line * intensity);
        return vec4(color.rgb * dark, color.a);
    #endif

    // VHS
    #ifdef VHS
        float noise = hash(v_texCoord + vec2(0.0, fract(u_intensity * 100.0)));
        float lines = sin(v_texCoord.y * 400.0 + u_intensity * 50.0) * 0.5 + 0.5;
        float distortion = 0.01 * sin(v_texCoord.y * 100.0 + u_intensity * 20.0);
        vec2 uv = v_texCoord + vec2(distortion, 0.0);
        vec4 sample = texture(u_texture, uv);
        sample.rgb *= 0.9 + 0.1 * (1.0 - lines * 0.5);
        sample.rgb += noise * 0.05;
        return sample;
    #endif

    // GLITCH
    #ifdef GLITCH
        float block = 0.03 * intensity;
        vec2 uv = v_texCoord;
        float rand = hash(floor(uv.y / block) + vec2(0.0, 0.0));
        if (rand > 0.8) {
            uv.x += 0.2 * (hash(vec2(rand, 0.0)) - 0.5);
        }
        return texture(u_texture, uv);
    #endif

    // PIXEL-SORT
    #ifdef PIXEL_SORT
        float threshold = 0.8 - intensity * 0.3;
        float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        if (brightness > threshold) {
            float shift = 0.02 * (brightness - threshold) / (1.0 - threshold);
            return texture(u_texture, v_texCoord + vec2(shift, 0.0));
        }
        return color;
    #endif

    // RIPPLE
    #ifdef RIPPLE
        vec2 uv = v_texCoord - 0.5;
        float dist = length(uv);
        float wave = sin(dist * 30.0 - u_intensity * 10.0) * 0.02 * intensity;
        vec2 offset = normalize(uv) * wave;
        return texture(u_texture, v_texCoord + offset);
    #endif

    // FISHEYE
    #ifdef FISHEYE
        vec2 uv = v_texCoord - 0.5;
        float dist = length(uv);
        float radius = 0.5;
        float norm = dist / radius;
        float zoom = 1.0 + norm * norm * 0.5 * intensity;
        vec2 offset = uv / zoom;
        if (norm > 1.0) return vec4(0.0);
        return texture(u_texture, offset + 0.5);
    #endif

    return color;
}
