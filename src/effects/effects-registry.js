// ============================================================
// NEKOCAM – src/effects/effects-registry.js
// Effect registry – loads effects from config/effects.json
// ============================================================

import { loadEffect as loadShader } from '../core/webgl-renderer.js';

// ---- State ----
let effects = [];
let categories = [];

// ---- Load effects from JSON ----
export async function loadEffects() {
    try {
        const response = await fetch('../config/effects.json');
        if (!response.ok) throw new Error('Failed to load effects.json');
        const data = await response.json();
        effects = data.effects || [];
        categories = extractCategories(effects);
        return effects;
    } catch (error) {
        console.error('[EffectsRegistry] Error loading effects:', error);
        // Fallback to minimal set
        effects = getFallbackEffects();
        categories = ['Color', 'Stylized'];
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

// ---- Apply effect (loads shader) ----
export function applyEffectById(id, intensity = 0.8) {
    const effect = getEffectById(id);
    if (!effect) {
        console.error(`[EffectsRegistry] Effect not found: ${id}`);
        return false;
    }
    try {
        loadShader(effect.id);
        if (typeof intensity === 'number') {
            // intensity will be passed to shader via uniform
        }
        return true;
    } catch (error) {
        console.error(`[EffectsRegistry] Failed to apply ${id}:`, error);
        return false;
    }
}

// ---- Fallback effects (in case JSON fails) ----
function getFallbackEffects() {
    return [
        { id: 'normal', name: 'Normal', category: 'Color', default: true },
        { id: 'grayscale', name: 'Grayscale', category: 'Color' },
        { id: 'sepia', name: 'Sepia', category: 'Color' },
        { id: 'pixelate', name: 'Pixelate', category: 'Stylized' },
        { id: 'edge', name: 'Edge Detection', category: 'Stylized' },
        { id: 'blur', name: 'Blur', category: 'Stylized' },
        { id: 'glitch', name: 'Glitch', category: 'Glitch' },
    ];
}

// ---- Get effect count ----
export function getEffectCount() {
    return effects.length;
}

// ---- Reload effects from JSON ----
export async function reloadEffects() {
    return await loadEffects();
}
