// ============================================================
// NEKOCAM – src/core/app.js
// Full raw debug – no wrappers, just console.log
// ============================================================

import { initCamera, stopCamera } from './camera.js';
import { initRenderer, getRenderer, startRenderer, stopRenderer } from './webgl-renderer.js';
import { loadEffects, getDefaultEffect, applyEffectById } from '../effects/effects-registry.js';
import { initUI } from '../ui/ui-controller.js';
import { startFpsCounter } from '../ui/utils.js';

// ---- State ----
let state = {
    currentEffectId: null,
    intensity: 0.8,
    isReady: false,
};

// ---- DOM refs ----
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

// ---- Init ----
export async function initApp() {
    console.log('[APP] ========== INIT START ==========');
    console.log('[APP] video element:', video);
    console.log('[APP] canvas element:', canvas);

    try {
        // ---- STEP 1: Direct camera test ----
        console.log('[APP] STEP 1: Testing camera directly...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });
            console.log('[APP] ✅ Direct camera SUCCESS');
            console.log('[APP] Stream active:', stream.active);
            stream.getTracks().forEach(t => t.stop());
        } catch (camErr) {
            console.error('[APP] ❌ Direct camera FAILED:', camErr.message);
        }

        // ---- STEP 2: Load effects ----
        console.log('[APP] STEP 2: Loading effects...');
        const effects = await loadEffects();
        console.log('[APP] ✅ Effects loaded:', effects.length);

        // ---- STEP 3: Set default effect ----
        console.log('[APP] STEP 3: Setting default effect...');
        const defaultEffect = getDefaultEffect();
        if (defaultEffect) {
            state.currentEffectId = defaultEffect.id;
            console.log('[APP] ✅ Default effect:', defaultEffect.name);
        }

        // ---- STEP 4: Init camera ----
        console.log('[APP] STEP 4: Initializing camera...');
        const stream = await initCamera(video);
        console.log('[APP] ✅ Camera initialized');
        console.log('[APP] Video dimensions:', video.videoWidth, 'x', video.videoHeight);

        // ---- STEP 5: Init WebGL ----
        console.log('[APP] STEP 5: Initializing WebGL...');
        initRenderer(canvas, video);
        const renderer = getRenderer();
        console.log('[APP] ✅ WebGL initialized');

        // ---- STEP 6: Apply default effect ----
        console.log('[APP] STEP 6: Applying default effect...');
        if (state.currentEffectId) {
            await applyEffectById(state.currentEffectId, state.intensity);
            console.log('[APP] ✅ Effect applied');
        }

        // ---- STEP 7: Init UI ----
        console.log('[APP] STEP 7: Initializing UI...');
        initUI({
            effects: effects,
            onEffectSelect: async (id) => {
                console.log('[APP] UI: Effect selected:', id);
                state.currentEffectId = id;
                await applyEffectById(id, state.intensity);
            },
            onIntensityChange: (val) => {
                console.log('[APP] UI: Intensity changed:', val);
                state.intensity = val;
                applyEffectById(state.currentEffectId, val);
            },
            onRecordToggle: () => {
                console.log('[APP] UI: Record toggled');
            },
            onSnapshot: () => {
                console.log('[APP] UI: Snapshot taken');
            },
        });
        console.log('[APP] ✅ UI initialized');

        // ---- STEP 8: Start renderer ----
        console.log('[APP] STEP 8: Starting renderer...');
        startRenderer();
        console.log('[APP] ✅ Renderer started');

        // ---- STEP 9: Start FPS counter ----
        console.log('[APP] STEP 9: Starting FPS counter...');
        startFpsCounter();
        console.log('[APP] ✅ FPS counter started');

        state.isReady = true;
        console.log('[APP] ========== INIT COMPLETE ==========');
        console.log('[APP] State:', state);

    } catch (err) {
        console.error('[APP] ❌ FATAL error in initApp:');
        console.error('[APP] Error name:', err.name);
        console.error('[APP] Error message:', err.message);
        console.error('[APP] Stack:', err.stack);
    }
}

// ---- Cleanup ----
export function destroyApp() {
    console.log('[APP] Destroying...');
    try {
        stopRenderer();
        stopCamera(video);
        state.isReady = false;
        console.log('[APP] ✅ Destroyed');
    } catch (e) {
        console.error('[APP] ❌ Destroy failed:', e.message);
    }
}
