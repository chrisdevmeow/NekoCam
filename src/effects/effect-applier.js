// ============================================================
// NEKOCAM – src/effects/effect-applier.js
// Effect applier – bridges registry and WebGL renderer
// ============================================================

import { getGL } from '../core/webgl-renderer.js';
import { getEffectById, getEffects } from './effects-registry.js';

// ---- State ----
let currentEffectId = null;
let currentIntensity = 0.8;

// ---- Apply effect by ID ----
export function applyEffect(effectId, intensity = 0.8) {
    const gl = getGL();
    if (!gl) {
        console.error('[EffectApplier] WebGL not initialized');
        return false;
    }

    const effect = getEffectById(effectId);
    if (!effect) {
        console.error(`[EffectApplier] Effect not found: ${effectId}`);
        return false;
    }

    currentEffectId = effectId;
    currentIntensity = intensity;

    // Load the shader for this effect
    try {
        // The renderer's loadEffect will fetch and compile the shader
        import('../core/webgl-renderer.js').then(module => {
            module.loadEffect(effectId);
        });
        return true;
    } catch (error) {
        console.error('[EffectApplier] Failed to apply effect:', error);
        return false;
    }
}

// ---- Set intensity ----
export function setIntensity(intensity) {
    const clamped = Math.max(0, Math.min(1, intensity));
    currentIntensity = clamped;
    // The uniform is updated in the render loop
    const gl = getGL();
    if (gl && gl.u_intensity) {
        gl.uniform1f(gl.u_intensity, clamped);
    }
    return clamped;
}

// ---- Get current effect ----
export function getCurrentEffect() {
    return currentEffectId;
}

// ---- Get current intensity ----
export function getCurrentIntensity() {
    return currentIntensity;
}

// ---- Apply next effect (cycle) ----
export function applyNextEffect() {
    const effects = getEffects();
    if (!effects || effects.length === 0) return false;

    const currentIndex = effects.findIndex(e => e.id === currentEffectId);
    const nextIndex = (currentIndex + 1) % effects.length;
    const nextEffect = effects[nextIndex];
    if (nextEffect) {
        return applyEffect(nextEffect.id, currentIntensity);
    }
    return false;
}

// ---- Apply previous effect ----
export function applyPreviousEffect() {
    const effects = getEffects();
    if (!effects || effects.length === 0) return false;

    const currentIndex = effects.findIndex(e => e.id === currentEffectId);
    const prevIndex = (currentIndex - 1 + effects.length) % effects.length;
    const prevEffect = effects[prevIndex];
    if (prevEffect) {
        return applyEffect(prevEffect.id, currentIntensity);
    }
    return false;
}

// ---- Check if effect is active ----
export function isEffectActive(effectId) {
    return currentEffectId === effectId;
}

// ---- Reset to default effect ----
export function resetToDefault() {
    const defaultEffect = getEffects().find(e => e.default);
    if (defaultEffect) {
        return applyEffect(defaultEffect.id, 0.8);
    }
    return false;
}

// ---- Get effect info for current ----
export function getCurrentEffectInfo() {
    if (!currentEffectId) return null;
    return getEffectById(currentEffectId);
}

// ---- Apply effect with fade (placeholder for future) ----
export function applyEffectWithFade(effectId, duration = 500) {
    // For now, just apply immediately
    return applyEffect(effectId, currentIntensity);
}
