// ============================================================
// NEKOCAM – src/core/app.js
// Debug: log before each import to find the broken file
// ============================================================

console.log('[APP] === app.js loaded ===');

// ---- Import each file with a log before and after ----
console.log('[APP] Importing camera.js...');
import { initCamera, stopCamera } from './camera.js';
console.log('[APP] ✅ camera.js loaded');

console.log('[APP] Importing webgl-renderer.js...');
import { initRenderer, getRenderer, startRenderer, stopRenderer } from './webgl-renderer.js';
console.log('[APP] ✅ webgl-renderer.js loaded');

console.log('[APP] Importing effects-registry.js...');
import { loadEffects, getDefaultEffect, applyEffectById } from '../effects/effects-registry.js';
console.log('[APP] ✅ effects-registry.js loaded');

console.log('[APP] Importing ui-controller.js...');
import { initUI } from '../ui/ui-controller.js';
console.log('[APP] ✅ ui-controller.js loaded');

console.log('[APP] Importing utils.js...');
import { startFpsCounter } from '../ui/utils.js';
console.log('[APP] ✅ utils.js loaded');

console.log('[APP] All imports successful — starting app...');

// ---- State ----
let state = {
    currentEffectId: null,
    intensity: 0.8,
    isReady: false,
};

// ---- DOM refs ----
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

// ---- Debug logger ----
function debugLog(label, data) {
    const msg = `[NekoCam] ${label}`;
    if (data !== undefined) {
        console.log(msg, data);
        if (typeof vConsole !== 'undefined' && vConsole) {
            vConsole.log(msg, data);
        }
    } else {
        console.log(msg);
        if (typeof vConsole !== 'undefined' && vConsole) {
            vConsole.log(msg);
        }
    }
}

function debugError(label, error) {
    const msg = `[NekoCam] ❌ ${label}`;
    console.error(msg, error || '');
    if (typeof vConsole !== 'undefined' && vConsole) {
        vConsole.error(msg, error || '');
    }
}

// ---- Init ----
export async function initApp() {
    debugLog('========== INIT START ==========');
    debugLog('1. Checking DOM elements...');
    debugLog('video element:', video);
    debugLog('canvas element:', canvas);

    if (!video) debugError('video element not found!');
    if (!canvas) debugError('canvas element not found!');

    try {
        // ---- STEP 2: DIRECT CAMERA TEST ----
        debugLog('2. Testing camera directly...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });
            debugLog('✅ Direct camera SUCCESS');
            debugLog('Stream active:', stream.active);
            debugLog('Video tracks:', stream.getVideoTracks().length);
            
            stream.getTracks().forEach(t => t.stop());
            debugLog('Direct camera test stream stopped');
        } catch (camErr) {
            debugError('Direct camera FAILED:', camErr.message);
        }

        // ---- STEP 3: Load effects ----
        debugLog('3. Loading effects from config/effects.json...');
        const effects = await loadEffects();
        debugLog(`✅ Loaded ${effects.length} effects`);
        debugLog('First 3 effects:', effects.slice(0, 3));

        // ---- STEP 4: Set default effect ----
        const defaultEffect = getDefaultEffect();
        if (defaultEffect) {
            state.currentEffectId = defaultEffect.id;
            debugLog(`✅ Default effect: ${defaultEffect.name} (${defaultEffect.id})`);
        } else {
            debugError('No default effect found');
        }

        // ---- STEP 5: Init camera ----
        debugLog('4. Initializing camera via initCamera()...');
        try {
            const stream = await initCamera(video);
            debugLog('✅ initCamera() returned stream');
            debugLog('Stream active:', stream.active);
            debugLog('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        } catch (camInitErr) {
            debugError('initCamera() FAILED:', camInitErr.message);
            debugLog('Trying fallback...');
            try {
                const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = fallbackStream;
                await video.play();
                debugLog('✅ Fallback camera SUCCESS');
            } catch (fallbackErr) {
                debugError('Fallback camera FAILED:', fallbackErr.message);
                document.getElementById('fps').textContent = 'CAMERA ERROR';
                document.getElementById('fps').style.color = 'red';
            }
        }

        // ---- STEP 6: Init WebGL ----
        debugLog('5. Initializing WebGL renderer...');
        try {
            initRenderer(canvas, video);
            const renderer = getRenderer();
            debugLog('✅ WebGL renderer initialized');
            debugLog('Renderer object:', renderer);
        } catch (renderErr) {
            debugError('WebGL renderer FAILED:', renderErr.message);
        }

        // ---- STEP 7: Apply default effect ----
        if (state.currentEffectId) {
            debugLog(`6. Applying default effect: ${state.currentEffectId}`);
            try {
                const result = await applyEffectById(state.currentEffectId, state.intensity);
                debugLog(`✅ Effect applied, result: ${result}`);
            } catch (effectErr) {
                debugError('Effect application FAILED:', effectErr.message);
            }
        }

        // ---- STEP 8: Init UI ----
        debugLog('7. Initializing UI...');
        try {
            initUI({
                effects: effects,
                onEffectSelect: async (id) => {
                    debugLog(`UI: Effect selected: ${id}`);
                    state.currentEffectId = id;
                    await applyEffectById(id, state.intensity);
                },
                onIntensityChange: (val) => {
                    debugLog(`UI: Intensity changed: ${val}`);
                    state.intensity = val;
                    applyEffectById(state.currentEffectId, val);
                },
                onRecordToggle: () => {
                    debugLog('UI: Record toggled');
                },
                onSnapshot: () => {
                    debugLog('UI: Snapshot taken');
                },
            });
            debugLog('✅ UI initialized');
        } catch (uiErr) {
            debugError('UI initialization FAILED:', uiErr.message);
        }

        // ---- STEP 9: Start renderer ----
        debugLog('8. Starting renderer...');
        try {
            startRenderer();
            debugLog('✅ Renderer started');
        } catch (startErr) {
            debugError('Renderer start FAILED:', startErr.message);
        }

        // ---- STEP 10: Start FPS ----
        debugLog('9. Starting FPS counter...');
        try {
            startFpsCounter();
            debugLog('✅ FPS counter started');
        } catch (fpsErr) {
            debugError('FPS counter FAILED:', fpsErr.message);
        }

        state.isReady = true;
        debugLog('========== INIT COMPLETE ==========');
        debugLog('State:', state);

    } catch (error) {
        debugError('FATAL init error:', error.message);
        debugLog('Stack trace:', error.stack);
        document.getElementById('fps').textContent = 'FATAL';
        document.getElementById('fps').style.color = 'red';
    }
}

// ---- Cleanup ----
export function destroyApp() {
    debugLog('Destroying NekoCam...');
    try {
        stopRenderer();
        stopCamera(video);
        state.isReady = false;
        debugLog('✅ NekoCam destroyed');
    } catch (e) {
        debugError('Destroy failed:', e.message);
    }
}
