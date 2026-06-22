#version 300 es
precision highp float;
uniform sampler2D u_texture;
uniform float u_intensity;
in vec2 v_texCoord;
out vec4 fragColor;

vec4 applyEffect(vec4 color, float intensity) {
    // NORMAL
    #ifdef NORMAL
        return color;
    #endif

    // GRAYSCALE
    #ifdef GRAYSCALE
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        vec3 result = mix(color.rgb, vec3(gray), intensity);
        return vec4(result, color.a);
    #endif

    // SEPIA
    #ifdef SEPIA
        vec3 sepia = vec3(
            dot(color.rgb, vec3(0.393, 0.769, 0.189)),
            dot(color.rgb, vec3(0.349, 0.686, 0.168)),
            dot(color.rgb, vec3(0.272, 0.534, 0.131))
        );
        vec3 result = mix(color.rgb, sepia, intensity);
        return vec4(result, color.a);
    #endif

    // VIBRANCE
    #ifdef VIBRANCE
        float maxChan = max(color.r, max(color.g, color.b));
        float minChan = min(color.r, min(color.g, color.b));
        float sat = maxChan - minChan;
        vec3 gray = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114)));
        vec3 result = mix(gray, color.rgb, 1.0 + intensity * 0.5);
        return vec4(result, color.a);
    #endif

    // CONTRAST
    #ifdef CONTRAST
        float contrast = 1.0 + intensity * 2.0;
        vec3 result = (color.rgb - 0.5) * contrast + 0.5;
        return vec4(result, color.a);
    #endif

    // TEMPERATURE
    #ifdef TEMPERATURE
        float temp = intensity * 2.0 - 1.0;
        vec3 warm = vec3(1.0, 0.8, 0.6);
        vec3 cool = vec3(0.6, 0.8, 1.0);
        vec3 result = color.rgb;
        if (temp < 0.0) {
            result *= mix(vec3(1.0), warm, -temp);
        } else {
            result *= mix(vec3(1.0), cool, temp);
        }
        return vec4(result, color.a);
    #endif

    // TINT
    #ifdef TINT
        float tint = intensity * 2.0 - 1.0;
        vec3 result = color.rgb;
        result.g += tint * 0.2;
        result.b += tint * 0.1;
        return vec4(result, color.a);
    #endif

    // HIGHLIGHTS
    #ifdef HIGHLIGHTS
        float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        float boost = smoothstep(0.5, 1.0, brightness) * intensity * 0.5;
        vec3 result = color.rgb + boost;
        return vec4(result, color.a);
    #endif

    // SHADOWS
    #ifdef SHADOWS
        float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        float boost = smoothstep(0.0, 0.5, 1.0 - brightness) * intensity * 0.5;
        vec3 result = color.rgb + boost;
        return vec4(result, color.a);
    #endif

    // EXPOSURE
    #ifdef EXPOSURE
        float ev = intensity * 2.0 - 1.0;
        float exposure = pow(2.0, ev);
        vec3 result = color.rgb * exposure;
        return vec4(result, color.a);
    #endif

    // GAMMA
    #ifdef GAMMA
        float gamma = 1.0 + intensity * 1.5;
        vec3 result = pow(color.rgb, vec3(1.0 / gamma));
        return vec4(result, color.a);
    #endif

    // COLOR-BALANCE
    #ifdef COLOR_BALANCE
        float r = intensity * 0.5;
        float g = intensity * 0.3;
        float b = intensity * 0.2;
        vec3 result = color.rgb + vec3(r, g, b);
        return vec4(result, color.a);
    #endif

    // LUT (placeholder)
    #ifdef LUT
        // Identity LUT for now
        return color;
    #endif

    // HDR (Reinhard)
    #ifdef HDR
        float exposure = 1.0 + intensity * 0.5;
        vec3 hdr = color.rgb * exposure;
        vec3 mapped = hdr / (hdr + vec3(1.0));
        return vec4(mapped, color.a);
    #endif

    return color;
}
