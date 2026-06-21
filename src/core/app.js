// ============================================================
// NEKOCAM – src/core/app.js
// Main application orchestrator
// ============================================================

import { initCamera } from './camera.js';
import { initRenderer, getRenderer } from './webgl-renderer.js';
import { loadEffects, getEffectById, getDefaultEffect } from '../effects/effects-registry.js';
import { applyEffect, setIntensity } from '../effects/effect-applier.js';
import { initTracking } from '../tracking/tracking.js';
import { initRecorder } from '../media/recorder.js';
import { initSnapshot } from '../media/snapshot.js';
import { initUI } from '../ui/ui-controller.js';
import { startFpsCounter, updateFps } from '../ui/utils.js';

// ---- State ----
const state = {
    currentEffectId: null,
    intensity: 0.8,
    isRecording: false,
    isTracking: false,
};

// ---- DOM refs ----
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

// ---- Init ----
export async function initApp() {
    try {
        console.log('[NekoCam] Initializing...');

        // 1. Load effects registry
        const effects = await loadEffects();
        console.log(`[NekoCam] Loaded ${effects.length} effects`);

        // 2. Set default effect
        const defaultEffect = getDefaultEffect(effects);
        state.currentEffectId = defaultEffect.id;

        // 3. Init camera
        const stream = await initCamera(video);
        console.log('[NekoCam] Camera ready');

        // 4. Init WebGL renderer
        initRenderer(canvas);
        const renderer = getRenderer();
        console.log('[NekoCam] WebGL renderer ready');

        // 5. Init tracking (if enabled in settings)
        // Uncomment when tracking.js is ready:
        // initTracking();

        // 6. Init UI
        initUI({
            effects,
            onEffectSelect: handleEffectSelect,
            onIntensityChange: handleIntensityChange,
            onRecordToggle: handleRecordToggle,
            onSnapshot: handleSnapshot,
        });

        // 7. Start render loop
        renderer.setRenderCallback((gl) => {
            // Draw video frame to canvas
            const width = canvas.width;
            const height = canvas.height;
            gl.viewport(0, 0, width, height);
            
            // Clear
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // Get current effect shader
            const effect = getEffectById(state.currentEffectId);
            if (effect) {
                applyEffect(gl, effect, state.intensity);
            }

            // Update FPS
            updateFps();
        });

        // 8. Start render loop
        renderer.start();

        // 9. Start FPS counter
        startFpsCounter();

        console.log('[NekoCam] Ready');
    } catch (error) {
        console.error('[NekoCam] Init failed:', error);
        // Show error on screen
        document.getElementById('fps').textContent = 'ERR';
    }
}

// ---- Event Handlers ----

function handleEffectSelect(effectId) {
    state.currentEffectId = effectId;
    console.log(`[NekoCam] Effect changed: ${effectId}`);
    // applyEffect will be called in render loop
}

function handleIntensityChange(value) {
    state.intensity = parseFloat(value);
    document.getElementById('intensityValue').textContent = state.intensity.toFixed(2);
}

function handleRecordToggle() {
    state.isRecording = !state.isRecording;
    if (state.isRecording) {
        initRecorder(canvas);
        document.getElementById('recordBtn').textContent = '⏹ Stop';
        document.getElementById('recordBtn').classList.add('recording');
    } else {
        // Stop recording logic in recorder.js
        document.getElementById('recordBtn').textContent = '⏺ Record';
        document.getElementById('recordBtn').classList.remove('recording');
    }
}

function handleSnapshot() {
    initSnapshot(canvas);
}

// ---- Cleanup (optional) ----
export function destroyApp() {
    // Stop renderer, release camera, etc.
    const renderer = getRenderer();
    if (renderer) renderer.stop();
    const stream = video.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    console.log('[NekoCam] Destroyed');
}
