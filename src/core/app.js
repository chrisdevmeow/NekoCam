// ============================================================
// NEKOCAM – src/core/app.js
// Main application orchestrator
// ============================================================

import { initCamera } from './camera.js';
import { initRenderer, getRenderer } from './webgl-renderer.js';
import { loadEffects, getDefaultEffect, applyEffectById } from '../effects/effects-registry.js';
import { initUI } from '../ui/ui-controller.js';
import { startFpsCounter } from '../ui/utils.js';

// ---- State ----
let state = {
    currentEffectId: null,
    intensity: 0.8,
};

// ---- DOM refs ----
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

// ---- Init ----
export async function initApp() {
    try {
        console.log('[NekoCam] Initializing...');

        // 1. Load effects
        const effects = await loadEffects();
        console.log(`[NekoCam] Loaded ${effects.length} effects`);

        // 2. Set default effect
        const defaultEffect = getDefaultEffect();
        if (defaultEffect) {
            state.currentEffectId = defaultEffect.id;
        }

        // 3. Init camera (THIS WAS MISSING)
        const stream = await initCamera(video);
        console.log('[NekoCam] Camera ready');

        // 4. Init WebGL renderer
        initRenderer(canvas, video);
        const renderer = getRenderer();
        console.log('[NekoCam] WebGL ready');

        // 5. Apply default effect
        if (state.currentEffectId) {
            await applyEffectById(state.currentEffectId, state.intensity);
        }

        // 6. Init UI
        initUI({
            effects: effects,
            onEffectSelect: async (id) => {
                state.currentEffectId = id;
                await applyEffectById(id, state.intensity);
            },
            onIntensityChange: (val) => {
                state.intensity = val;
                applyEffectById(state.currentEffectId, val);
            },
            onRecordToggle: () => {
                console.log('[NekoCam] Record toggled');
            },
            onSnapshot: () => {
                console.log('[NekoCam] Snapshot taken');
            },
        });

        // 7. Start renderer
        renderer.start();

        // 8. Start FPS counter
        startFpsCounter();

        console.log('[NekoCam] Ready');
    } catch (error) {
        console.error('[NekoCam] Init failed:', error);
        document.getElementById('fps').textContent = 'ERR';
    }
}
