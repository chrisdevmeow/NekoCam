// ============================================================
// NEKOCAM – src/ui/utils.js
// Utilities – FPS counter, debounce, logging, DOM helpers
// ============================================================

// ---- FPS counter ----
let frameCount = 0;
let lastFpsUpdate = 0;
let currentFps = 0;
let fpsDisplay = null;

// ---- Start FPS counter ----
export function startFpsCounter(updateInterval = 500) {
    fpsDisplay = document.getElementById('fps');
    if (!fpsDisplay) {
        console.warn('[Utils] FPS display not found');
        return;
    }

    lastFpsUpdate = performance.now();
    frameCount = 0;
    currentFps = 0;

    // Use requestAnimationFrame to track frames
    function trackFrame() {
        frameCount++;
        const now = performance.now();
        if (now - lastFpsUpdate >= updateInterval) {
            currentFps = Math.round(frameCount / ((now - lastFpsUpdate) / 1000));
            fpsDisplay.textContent = `${currentFps} FPS`;
            frameCount = 0;
            lastFpsUpdate = now;
        }
        requestAnimationFrame(trackFrame);
    }
    requestAnimationFrame(trackFrame);
}

// ---- Update FPS manually (for render loop integration) ----
export function updateFps() {
    frameCount++;
    const now = performance.now();
    if (now - lastFpsUpdate >= 500) {
        currentFps = Math.round(frameCount / ((now - lastFpsUpdate) / 1000));
        if (fpsDisplay) {
            fpsDisplay.textContent = `${currentFps} FPS`;
        }
        frameCount = 0;
        lastFpsUpdate = now;
    }
}

// ---- Get current FPS ----
export function getCurrentFps() {
    return currentFps;
}

// ---- Debounce (rate-limit function calls) ----
export function debounce(func, delay = 300) {
    let timeoutId = null;
    return function (...args) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func.apply(this, args);
            timeoutId = null;
        }, delay);
    };
}

// ---- Throttle (limit function calls to once per interval) ----
export function throttle(func, interval = 100) {
    let lastCall = 0;
    let timeoutId = null;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= interval) {
            lastCall = now;
            func.apply(this, args);
        } else if (!timeoutId) {
            timeoutId = setTimeout(() => {
                lastCall = Date.now();
                timeoutId = null;
                func.apply(this, args);
            }, interval - (now - lastCall));
        }
    };
}

// ---- DOM helpers ----
export function $(selector, context = document) {
    return context.querySelector(selector);
}

export function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

export function createElement(tag, className = '', attributes = {}) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    Object.entries(attributes).forEach(([key, value]) => {
        el.setAttribute(key, value);
    });
    return el;
}

// ---- Logging (with timestamps) ----
export function log(message, level = 'info') {
    const timestamp = new Date().toISOString().slice(11, 23);
    const prefix = `[${timestamp}]`;
    switch (level) {
        case 'error':
            console.error(prefix, message);
            break;
        case 'warn':
            console.warn(prefix, message);
            break;
        case 'debug':
            console.debug(prefix, message);
            break;
        default:
            console.log(prefix, message);
    }
}

// ---- Timer ----
export function timer(label) {
    const start = performance.now();
    return {
        stop: () => {
            const elapsed = (performance.now() - start).toFixed(2);
            console.log(`[Timer] ${label}: ${elapsed}ms`);
            return parseFloat(elapsed);
        }
    };
}

// ---- Check if running on mobile ----
export function isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// ---- Check if running on iOS ----
export function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// ---- Fullscreen toggle ----
export function toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
        el.requestFullscreen?.() || el.webkitRequestFullscreen?.();
    } else {
        document.exitFullscreen?.() || document.webkitExitFullscreen?.();
    }
}
