#version 300 es
precision highp float;
uniform sampler2D u_texture;
uniform float u_intensity;
uniform float u_time;
in vec2 v_texCoord;
out vec4 fragColor;

// Random helper
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

vec4 applyEffect(vec4 color, float intensity) {
    // GREENSCREEN
    #ifdef GREENSCREEN
        vec3 key = vec3(0.0, 1.0, 0.0);
        float diff = length(color.rgb - key);
        float alpha = smoothstep(0.1, 0.4, diff);
        return vec4(color.rgb, color.a * alpha);
    #endif

    // COLOR-POP
    #ifdef COLOR_POP
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        float pop = 1.0 - intensity;
        return vec4(mix(vec3(gray), color.rgb, pop), color.a);
    #endif

    // COLOR-SPILL
    #ifdef COLOR_SPILL
        vec3 key = vec3(0.0, 1.0, 0.0);
        float spill = max(color.g - max(color.r, color.b), 0.0) * intensity;
        return vec4(color.r + spill, color.g, color.b + spill, color.a);
    #endif

    // SLOW-SHUTTER
    #ifdef SLOW_SHUTTER
        // Needs previous frame buffer – placeholder
        return color;
    #endif

    // MOTION-TRAIL
    #ifdef MOTION_TRAIL
        // Needs previous frame buffer – placeholder
        return color;
    #endif

    // STROBE
    #ifdef STROBE
        float flash = sin(u_time * 10.0 * intensity) * 0.5 + 0.5;
        return vec4(color.rgb * flash, color.a);
    #endif

    // TIME-FREEZE
    #ifdef TIME_FREEZE
        // Placeholder – hold a single frame
        return color;
    #endif

    // REVERSE-MOTION
    #ifdef REVERSE_MOTION
        // Placeholder – temporal reverse
        return color;
    #endif

    // KALEIDOSCOPE
    #ifdef KALEIDOSCOPE
        vec2 uv = v_texCoord - 0.5;
        float angle = atan(uv.y, uv.x);
        float segments = 6.0;
        float segAngle = 6.283 / segments;
        angle = mod(angle, segAngle);
        if (angle > segAngle * 0.5) angle = segAngle - angle;
        float radius = length(uv);
        vec2 rotated = vec2(cos(angle), sin(angle)) * radius;
        return texture(u_texture, rotated + 0.5);
    #endif

    // FRACTAL-ZOOM
    #ifdef FRACTAL_ZOOM
        vec2 uv = v_texCoord;
        for (int i = 0; i < 4; i++) {
            uv = fract(uv * 2.0 + 0.5);
        }
        return texture(u_texture, uv);
    #endif

    // PLASMA
    #ifdef PLASMA
        float plasma = sin(v_texCoord.x * 50.0 + u_time) * sin(v_texCoord.y * 50.0 + u_time * 0.7);
        plasma = plasma * 0.5 + 0.5;
        vec3 plasmaColor = vec3(plasma, plasma * 0.5, 1.0 - plasma);
        return vec4(mix(color.rgb, plasmaColor, intensity * 0.5), color.a);
    #endif

    // TUNNEL-VISION
    #ifdef TUNNEL_VISION
        vec2 uv = v_texCoord - 0.5;
        float radius = length(uv);
        float zoom = 1.0 / (radius * 2.0 + 0.1);
        vec2 coord = uv * zoom + 0.5;
        return texture(u_texture, coord);
    #endif

    // HEATMAP
    #ifdef HEATMAP
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        vec3 hot = vec3(1.0, 0.0, 0.0);
        vec3 warm = vec3(1.0, 1.0, 0.0);
        vec3 cool = vec3(0.0, 0.0, 1.0);
        vec3 heat = mix(cool, warm, gray);
        heat = mix(heat, hot, gray * gray);
        return vec4(mix(color.rgb, heat, intensity), color.a);
    #endif

    // XOR-GLITCH
    #ifdef XOR_GLITCH
        vec2 uv = floor(v_texCoord * 100.0);
        float xor = float(int(uv.x) ^ int(uv.y));
        float pattern = mod(xor, 2.0);
        return vec4(mix(color.rgb, vec3(pattern), intensity * 0.5), color.a);
    #endif

    // ASCII-ART
    #ifdef ASCII_ART
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        float chars = floor(gray * 16.0) / 16.0;
        return vec4(vec3(chars), color.a);
    #endif

    // FILM-GRAIN
    #ifdef FILM_GRAIN
        float noise = hash(v_texCoord + vec2(0.0, u_time));
        float grain = (noise - 0.5) * intensity * 0.1;
        return vec4(color.rgb + grain, color.a);
    #endif

    // CINEMATIC-FPS
    #ifdef CINEMATIC_FPS
        float frame = floor(u_time * 24.0) / 24.0;
        // Placeholder – needs temporal buffer
        return color;
    #endif

    // ANAMORPHIC-FLARE
    #ifdef ANAMORPHIC_FLARE
        vec2 uv = v_texCoord - 0.5;
        float angle = atan(uv.y, uv.x);
        float len = length(uv);
        float flare = sin(angle * 8.0) * len * 2.0;
        flare = max(flare, 0.0);
        return vec4(color.rgb + vec3(flare, flare * 0.5, 0.0) * intensity * 0.5, color.a);
    #endif

    // LETTERBOX
    #ifdef LETTERBOX
        float aspect = 720.0 / 1280.0;
        float crop = 0.1 * intensity;
        float y = abs(v_texCoord.y - 0.5) * 2.0;
        if (y > 0.9 - crop) {
            return vec4(0.0);
        }
        return color;
    #endif

    // FACE-PAINT
    #ifdef FACE_PAINT
        float angle = atan(v_texCoord.y - 0.5, v_texCoord.x - 0.5);
        float stripe = sin(angle * 6.0 + u_time) * 0.5 + 0.5;
        return vec4(mix(color.rgb, vec3(stripe, 0.0, 1.0 - stripe), intensity * 0.4), color.a);
    #endif

    // SNOW
    #ifdef SNOW
        float snow = hash(v_texCoord * 100.0 + vec2(0.0, u_time * 0.5));
        if (snow > 0.98) {
            return vec4(1.0);
        }
        return color;
    #endif

    // FIRE
    #ifdef FIRE
        float fire = hash(v_texCoord * 50.0 + vec2(0.0, u_time * 2.0));
        fire = max(fire - (1.0 - v_texCoord.y), 0.0);
        return vec4(mix(color.rgb, vec3(1.0, 0.3, 0.0), fire * intensity * 0.5), color.a);
    #endif

    // MATRIX
    #ifdef MATRIX
        float lines = sin(v_texCoord.y * 200.0 + v_texCoord.x * 10.0 + u_time * 2.0) * 0.5 + 0.5;
        float drop = floor(v_texCoord.y * 50.0 + u_time * 10.0);
        float char = floor(fract(drop / 2.0) * 16.0) / 16.0;
        return vec4(vec3(lines * char), color.a);
    #endif

    // BOKEH
    #ifdef BOKEH
        float radius = intensity * 0.02;
        vec2 uv = v_texCoord - 0.5;
        float dist = length(uv);
        float circle = 1.0 - step(radius, dist);
        float blur = dist / (radius + 0.001);
        vec2 offset = uv / (1.0 + blur * 2.0);
        vec4 blurred = texture(u_texture, offset + 0.5);
        return vec4(mix(blurred.rgb, vec3(1.0), circle * 0.5), color.a);
    #endif

    return color;
}
