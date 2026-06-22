#version 300 es
precision highp float;
uniform sampler2D u_texture;
uniform float u_intensity;
uniform vec2 u_faceCenter;
uniform float u_faceSize;
in vec2 v_texCoord;
out vec4 fragColor;

vec4 applyEffect(vec4 color, float intensity) {
    // FACE-SWAP
    #ifdef FACE_SWAP
        // Placeholder – actual swap uses another texture input
        // u_faceCenter and u_faceSize are provided by tracking.js
        float dist = distance(v_texCoord, u_faceCenter);
        if (dist < u_faceSize * 0.5) {
            return color; // Should be swapped with face texture
        }
        return color;
    #endif

    // VIRTUAL-MAKEUP
    #ifdef VIRTUAL_MAKEUP
        float dist = distance(v_texCoord, u_faceCenter);
        if (dist < u_faceSize * 0.3) {
            vec3 lip = vec3(0.8, 0.2, 0.2) * intensity;
            return vec4(mix(color.rgb, lip, 0.5), color.a);
        }
        return color;
    #endif

    // BACKGROUND-BLUR
    #ifdef BACKGROUND_BLUR
        float dist = distance(v_texCoord, u_faceCenter);
        float blurRadius = mix(0.0, 10.0, intensity);
        if (dist > u_faceSize * 0.6) {
            vec2 texel = 1.0 / vec2(1280.0, 720.0);
            vec4 sum = vec4(0.0);
            for (float y = -10.0; y <= 10.0; y += 1.0) {
                for (float x = -10.0; x <= 10.0; x += 1.0) {
                    if (abs(x) <= blurRadius && abs(y) <= blurRadius) {
                        sum += texture(u_texture, v_texCoord + vec2(x, y) * texel);
                    }
                }
            }
            float count = (blurRadius * 2.0 + 1.0) * (blurRadius * 2.0 + 1.0);
            return sum / max(count, 1.0);
        }
        return color;
    #endif

    // BACKGROUND-REPLACE
    #ifdef BACKGROUND_REPLACE
        float dist = distance(v_texCoord, u_faceCenter);
        if (dist > u_faceSize * 0.6) {
            return vec4(0.0, 0.0, 0.0, 1.0); // Should be replaced with bg texture
        }
        return color;
    #endif

    // FACE-WARP
    #ifdef FACE_WARP
        float dist = distance(v_texCoord, u_faceCenter);
        if (dist < u_faceSize * 0.4) {
            vec2 offset = (v_texCoord - u_faceCenter) * intensity * 0.2;
            return texture(u_texture, v_texCoord + offset);
        }
        return color;
    #endif

    // FACE-MORPH
    #ifdef FACE_MORPH
        // Placeholder – morphs between two face textures
        return color;
    #endif

    // HEAD-TRACK
    #ifdef HEAD_TRACK
        float angle = u_faceCenter.x * 6.28;
        float cosA = cos(angle);
        float sinA = sin(angle);
        vec2 offset = v_texCoord - u_faceCenter;
        vec2 rotated = vec2(
            offset.x * cosA - offset.y * sinA,
            offset.x * sinA + offset.y * cosA
        );
        return texture(u_texture, rotated + u_faceCenter);
    #endif

    // POSE-MIRROR
    #ifdef POSE_MIRROR
        return texture(u_texture, vec2(1.0 - v_texCoord.x, v_texCoord.y));
    #endif

    // DISCO-BALL
    #ifdef DISCO_BALL
        float dist = distance(v_texCoord, u_faceCenter);
        float angle = atan(v_texCoord.y - u_faceCenter.y, v_texCoord.x - u_faceCenter.x);
        float facets = 12.0;
        float face = floor(angle / 6.283 * facets) / facets;
        float brightness = 0.5 + 0.5 * sin(face * 50.0 + u_intensity * 100.0);
        return vec4(color.rgb * brightness, color.a);
    #endif

    return color;
}
