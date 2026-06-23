// ============================================================
// NEKOCAM – src/effects/effects-registry.js
// Effect registry – loads shaders from 5 category files
// ============================================================

import { loadEffectShader } from '../core/webgl-renderer.js';

// ---- Shader file map ----
const SHADER_FILES = {
    color: 'shaders/color.glsl',
    stylized: 'shaders/stylized.glsl',
    glitch: 'shaders/glitch.glsl',
    tracking: 'shaders/tracking.glsl',
    extra: 'shaders/extra.glsl',
};

// ---- Effect to file + #ifdef mapping ----
const EFFECT_MAP = {
    // Color
    'normal': { file: 'color', def: 'NORMAL' },
    'grayscale': { file: 'color', def: 'GRAYSCALE' },
    'sepia': { file: 'color', def: 'SEPIA' },
    'vibrance': { file: 'color', def: 'VIBRANCE' },
    'contrast': { file: 'color', def: 'CONTRAST' },
    'temperature': { file: 'color', def: 'TEMPERATURE' },
    'tint': { file: 'color', def: 'TINT' },
    'highlights': { file: 'color', def: 'HIGHLIGHTS' },
    'shadows': { file: 'color', def: 'SHADOWS' },
    'exposure': { file: 'color', def: 'EXPOSURE' },
    'gamma': { file: 'color', def: 'GAMMA' },
    'color-balance': { file: 'color', def: 'COLOR_BALANCE' },
    'lut': { file: 'color', def: 'LUT' },
    'hdr': { file: 'color', def: 'HDR' },

    // Stylized
    'pixelate': { file: 'stylized', def: 'PIXELATE' },
    'mosaic': { file: 'stylized', def: 'MOSAIC' },
    'posterize': { file: 'stylized', def: 'POSTERIZE' },
    'oil-paint': { file: 'stylized', def: 'OIL_PAINT' },
    'watercolor': { file: 'stylized', def: 'WATERCOLOR' },
    'pencil-sketch': { file: 'stylized', def: 'PENCIL_SKETCH' },
    'comic': { file: 'stylized', def: 'COMIC' },
    'cross-hatch': { file: 'stylized', def: 'CROSS_HATCH' },
    'pointillism': { file: 'stylized', def: 'POINTILLISM' },
    'neon-glow': { file: 'stylized', def: 'NEON_GLOW' },

    // Glitch
    'chromatic-aberration': { file: 'glitch', def: 'CHROMATIC_ABERRATION' },
    'datamosh': { file: 'glitch', def: 'DATAMOSH' },
    'scanlines': { file: 'glitch', def: 'SCANLINES' },
    'vhs': { file: 'glitch', def: 'VHS' },
    'glitch': { file: 'glitch', def: 'GLITCH' },
    'pixel-sort': { file: 'glitch', def: 'PIXEL_SORT' },
    'ripple': { file: 'glitch', def: 'RIPPLE' },
    'fisheye': { file: 'glitch', def: 'FISHEYE' },

    // Tracking
    'face-swap': { file: 'tracking', def: 'FACE_SWAP' },
    'virtual-makeup': { file: 'tracking', def: 'VIRTUAL_MAKEUP' },
    'background-blur': { file: 'tracking', def: 'BACKGROUND_BLUR' },
    'background-replace': { file: 'tracking', def: 'BACKGROUND_REPLACE' },
    'face-warp': { file: 'tracking', def: 'FACE_WARP' },
    'face-morph': { file: 'tracking', def: 'FACE_MORPH' },
    'head-track': { file: 'tracking', def: 'HEAD_TRACK' },
    'pose-mirror': { file: 'tracking', def: 'POSE_MIRROR' },
    'disco-ball': { file: 'tracking', def: 'DISCO_BALL' },

    // Extra
    'greenscreen': { file: 'extra', def: 'GREENSCREEN' },
    'color-pop': { file: 'extra', def: 'COLOR_POP' },
    'color-spill': { file: 'extra', def: 'COLOR_SPILL' },
    'slow-shutter': { file: 'extra', def: 'SLOW_SHUTTER' },
    'motion-trail': { file: 'extra', def: 'MOTION_TRAIL' },
    'strobe': { file: 'extra', def: 'STROBE' },
    'time-freeze': { file: 'extra', def: 'TIME_FREEZE' },
    'reverse-motion': { file: 'extra', def: 'REVERSE_MOTION' },
    'kaleidoscope': { file: 'extra', def: 'KALEIDOSCOPE' },
    'fractal-zoom': { file: 'extra', def: 'FRACTAL_ZOOM' },
    'plasma': { file: 'extra', def: 'PLASMA' },
    'tunnel-vision': { file: 'extra', def: 'TUNNEL_VISION' },
    'heatmap': { file: 'extra', def: 'HEATMAP' },
    'xor-glitch': { file: 'extra', def: 'XOR_GLITCH' },
    'ascii-art': { file: 'extra', def: 'ASCII_ART' },
    'film-grain': { file: 'extra', def: 'FILM_GRAIN' },
    'cinematic-fps': { file: 'extra', def: 'CINEMATIC_FPS' },
    'anamorphic-flare': { file: 'extra', def: 'ANAMORPHIC_FLARE' },
    'letterbox': { file: 'extra', def: 'LETTERBOX' },
    'face-paint': { file: 'extra', def: 'FACE_PAINT' },
    'snow': { file: 'extra', def: 'SNOW' },
    'fire': { file: 'extra', def: 'FIRE' },
    'matrix': { file: 'extra', def: 'MATRIX' },
    'bokeh': { file: 'extra', def: 'BOKEH' },
};

// ---- State ----
let effects = [];
let categories = [];
let loadedShaders = {};

// ---- Load effects from JSON ----
export async function loadEffects() {
    try {
        const response = await fetch('../../config/effects.json');
        if (!response.ok) throw new Error('Failed to load effects.json');
        const data = await response.json();
        effects = data.effects || [];
        categories = extractCategories(effects);
        return effects;
    } catch (error) {
        console.error('[EffectsRegistry] Error loading effects:', error);
        effects = getFallbackEffects();
        categories = ['All', 'Color', 'Stylized'];
        return effects;
    }
}

// ---- Extract unique categories ----
function extractCategories(effects) {
    const cats = new Set();
    effects.forEach(e => {
        if (e.category) cats.add(e.category);
    });
    return ['All', ...Array.from(cats)];
}

// ---- Get all effects ----
export function getEffects() {
    return effects;
}

// ---- Get categories ----
export function getCategories() {
    return categories;
}

// ---- Get effect by ID ----
export function getEffectById(id) {
    return effects.find(e => e.id === id) || null;
}

// ---- Get default effect ----
export function getDefaultEffect() {
    return effects.find(e => e.default) || effects[0] || null;
}

// ---- Get effects by category ----
export function getEffectsByCategory(category) {
    if (category === 'All') return effects;
    return effects.filter(e => e.category === category);
}

// ---- Load and apply effect ----
export async function applyEffectById(id, intensity = 0.8) {
    const effect = getEffectById(id);
    if (!effect) {
        console.error(`[EffectsRegistry] Effect not found: ${id}`);
        return false;
    }

    const mapping = EFFECT_MAP[id];
    if (!mapping) {
        console.error(`[EffectsRegistry] No shader mapping for: ${id}`);
        return false;
    }

    try {
        const filePath = SHADER_FILES[mapping.file];
        const defName = mapping.def;

        // Fetch the shader file
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Failed to load ${filePath}`);
        let source = await response.text();

        // Inject the #define for this effect
        source = `#define ${defName}\n` + source;

        // Also inject u_time if the shader uses it
        if (source.includes('u_time')) {
            source = source.replace(
                'uniform float u_intensity;',
                'uniform float u_intensity;\nuniform float u_time;'
            );
        }

        // Also inject tracking uniforms if needed
        if (mapping.file === 'tracking') {
            source = source.replace(
                'uniform float u_intensity;',
                'uniform float u_intensity;\nuniform vec2 u_faceCenter;\nuniform float u_faceSize;'
            );
        }

        // Compile and apply
        loadEffectShader(source);
        return true;
    } catch (error) {
        console.error(`[EffectsRegistry] Failed to apply ${id}:`, error);
        return false;
    }
}

// ---- Fallback effects ----
function getFallbackEffects() {
    return [
        { id: 'normal', name: 'Normal', category: 'Color', default: true },
        { id: 'grayscale', name: 'Grayscale', category: 'Color' },
        { id: 'sepia', name: 'Sepia', category: 'Color' },
        { id: 'pixelate', name: 'Pixelate', category: 'Stylized' },
        { id: 'glitch', name: 'Glitch', category: 'Glitch' },
    ];
}

// ---- Get effect count ----
export function getEffectCount() {
    return effects.length;
}

// ---- Reload effects ----
export async function reloadEffects() {
    return await loadEffects();
}

// ---- Get shader mapping for an effect ----
export function getEffectMapping(id) {
    return EFFECT_MAP[id] || null;
}
